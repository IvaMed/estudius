const BookingRepository = require('../data/bookingRepository');
const TeacherRepository = require('../data/teacherRepository');
const { formatTeacherAddress } = require('../lib/locationUtils');
const {
  parseYMDLocal,
  getSlotsForDow,
  canonicalDatetimeForBooking,
  normalizeTimeHM,
  timeToMinutes,
  parseSchedulesField,
  normalizeBookingInstant
} = require('../lib/scheduleUtils');

function extractYmdFromDatetimeInput(dt) {
  if (!dt || typeof dt !== 'string') return null;
  const s = dt.trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function extractHmFromDatetimeInput(dt) {
  if (!dt || typeof dt !== 'string') return null;
  const s = dt.trim();
  const m = s.match(/[T\s](\d{1,2}):(\d{2})/);
  if (!m) return null;
  return normalizeTimeHM(`${m[1]}:${m[2]}`);
}

function parseModalities(teacher) {
  if (!teacher) return [];
  if (teacher.modalities && Array.isArray(teacher.modalities)) return teacher.modalities;
  if (teacher.modalities) {
    try {
      const p = JSON.parse(teacher.modalities);
      return Array.isArray(p) ? p : [];
    } catch (_) {
      return [];
    }
  }
  return teacher.modality ? [teacher.modality] : [];
}

function teacherIsVirtualCapable(teacher) {
  const m = parseModalities(teacher);
  return m.includes('virtual') || teacher.modality === 'virtual';
}

/** Parse fecha/hora de reserva almacenada como "YYYY-MM-DD HH:MM" o ISO. */
function parseBookingStartLocal(datetimeStr) {
  const s = String(datetimeStr || '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const d = new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      m[6] ? parseInt(m[6], 10) : 0
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const iso = new Date(s.replace(' ', 'T'));
  return Number.isNaN(iso.getTime()) ? null : iso;
}

class BookingService {
  static async getAvailability(teacherId, fromYmd, toYmd) {
    const teacher = await TeacherRepository.getById(teacherId);
    if (!teacher) {
      const e = new Error('Profesor no encontrado');
      e.code = 'NOT_FOUND';
      throw e;
    }
    const from = parseYMDLocal(fromYmd);
    const to = parseYMDLocal(toYmd);
    if (!from || !to || from > to) {
      const e = new Error('Parámetros from y to deben ser fechas YYYY-MM-DD válidas');
      e.code = 'BAD_RANGE';
      throw e;
    }

    const classSize = Math.max(1, parseInt(teacher.classSize, 10) || 1);
    const counts = await BookingRepository.countByTeacherDatetimeRange(teacherId, fromYmd, toYmd);

    const days = {};
    const cur = new Date(from.getTime());
    const end = new Date(to.getTime());

    while (cur <= end) {
      const ymd = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const day = parseYMDLocal(ymd);
      const dow = day ? day.getDay() : null;
      const slots = dow != null ? getSlotsForDow(teacher.schedules, dow) : [];
      if (!slots.length) {
        days[ymd] = {
          status: 'no_class',
          start: null,
          end: null,
          bookedCount: 0,
          capacity: classSize,
          slots: []
        };
      } else {
        const slotItems = slots.map((slot) => {
          const dt = canonicalDatetimeForBooking(ymd, slot.start);
          const nk = dt ? normalizeBookingInstant(dt) : null;
          const bookedCount = nk ? counts[nk] || 0 : 0;
          let status = 'available';
          if (bookedCount >= classSize) status = 'full';
          else if (bookedCount > 0) status = 'partial';
          return {
            status,
            start: slot.start,
            end: slot.end,
            bookedCount,
            capacity: classSize
          };
        });
        const allFull = slotItems.every((s) => s.status === 'full');
        const anyBooked = slotItems.some((s) => (s.bookedCount || 0) > 0);
        const dayStatus = allFull ? 'full' : (anyBooked ? 'partial' : 'available');
        const dayBooked = slotItems.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
        days[ymd] = {
          status: dayStatus,
          start: slotItems[0].start,
          end: slotItems[slotItems.length - 1].end,
          bookedCount: dayBooked,
          capacity: classSize * slotItems.length,
          slots: slotItems
        };
      }
      cur.setDate(cur.getDate() + 1);
    }

    return { classSize, days };
  }

  /**
   * Crea reserva normalizando datetime al inicio de franja del día.
   * Acepta `date` (YYYY-MM-DD) o `datetime` (legacy datetime-local).
    * `slotStart` permite elegir la franja cuando hay varias en el mismo día.
   * `sessionModality`: 'virtual' | 'presencial' (obligatorio si el profesor ofrece ambas).
   */
  static async createBookingForUser({
    userId,
    teacherId,
    date,
    datetime,
    slotStart,
    message,
    sessionModality: bodyModality,
    bookingSubjects: bodySubjects
  }) {
    const teacher = await TeacherRepository.getById(teacherId);
    if (!teacher) {
      const e = new Error('Profesor no encontrado');
      e.code = 'NOT_FOUND';
      throw e;
    }

    let ymd = date && String(date).trim().match(/^\d{4}-\d{2}-\d{2}$/) ? String(date).trim() : null;
    if (!ymd && datetime) {
      ymd = extractYmdFromDatetimeInput(String(datetime));
    }
    if (!ymd) {
      const e = new Error('Indicá una fecha válida (YYYY-MM-DD)');
      e.code = 'VALIDATION';
      throw e;
    }

    const day = parseYMDLocal(ymd);
    const dow = day ? day.getDay() : null;
    const slots = dow != null ? getSlotsForDow(teacher.schedules, dow) : [];
    if (!slots.length) {
      const e = new Error('El profesor no dicta clases en esa fecha');
      e.code = 'NO_CLASS';
      throw e;
    }

    let slot = null;
    const slotStartStr = slotStart && String(slotStart).trim();
    if (slotStartStr) {
      const hm = normalizeTimeHM(slotStartStr);
      if (!hm) {
        const e = new Error('El horario seleccionado no es válido');
        e.code = 'SLOT_MISMATCH';
        throw e;
      }
      slot = slots.find((sl) => sl.start === hm) || null;
      if (!slot) {
        const e = new Error('El horario no coincide con el del profesor para ese día');
        e.code = 'SLOT_MISMATCH';
        throw e;
      }
    }
    const datetimeHm = extractHmFromDatetimeInput(datetime);
    if (!slot && datetimeHm) {
      slot = slots.find((sl) => sl.start === datetimeHm) || null;
      if (!slot) {
        const e = new Error('La hora seleccionada no coincide con el horario del profesor ese día');
        e.code = 'SLOT_MISMATCH';
        throw e;
      }
    }
    if (!slot) slot = slots[0];

    const canonical = canonicalDatetimeForBooking(ymd, slot.start);
    if (!canonical) {
      const e = new Error('No se pudo calcular el horario de la reserva');
      e.code = 'VALIDATION';
      throw e;
    }

    // No permitir reservar si la clase ya empezó o ya terminó
    try {
      const classStartDate = parseBookingStartLocal(canonical);
      if (!classStartDate || classStartDate.getTime() <= Date.now()) {
        const e = new Error('No se puede reservar una clase que ya empezó o ya pasó');
        e.code = 'PAST';
        throw e;
      }
      if (slot.end) {
        const startMin = timeToMinutes(slot.start);
        const endMin = timeToMinutes(slot.end);
        if (startMin != null && endMin != null) {
          const classEndDate = new Date(classStartDate.getTime());
          classEndDate.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
          if (endMin <= startMin) {
            classEndDate.setDate(classEndDate.getDate() + 1);
          }
          if (classEndDate.getTime() <= Date.now()) {
            const e = new Error('No se puede reservar una clase que ya terminó');
            e.code = 'PAST';
            throw e;
          }
        }
        else {
          const e = new Error('No se puede reservar una clase que ya terminó');
          e.code = 'PAST';
          throw e;
        }
      }
    } catch (e) {
      if (e && e.code === 'PAST') throw e;
    }

    try {
      const classStartDate = parseBookingStartLocal(canonical);
      const maxDate = new Date();
      maxDate.setHours(23, 59, 59, 999);
      maxDate.setMonth(maxDate.getMonth() + 3);
      if (classStartDate && classStartDate.getTime() > maxDate.getTime()) {
        const e = new Error('No podés reservar con más de 3 meses de anticipación');
        e.code = 'TOO_FAR';
        throw e;
      }
    } catch (e) {
      if (e && e.code === 'TOO_FAR') throw e;
    }

    let teacherSubjects = [];
    try {
      teacherSubjects = Array.isArray(teacher.subjects)
        ? teacher.subjects
        : JSON.parse(teacher.subjects || '[]');
    } catch (_) {
      teacherSubjects = [];
    }
    let chosenSubjects = [];
    if (Array.isArray(bodySubjects)) chosenSubjects = bodySubjects.map((s) => String(s).trim()).filter(Boolean);
    else if (typeof bodySubjects === 'string' && bodySubjects.trim()) {
      try {
        const parsed = JSON.parse(bodySubjects);
        chosenSubjects = Array.isArray(parsed) ? parsed.map((s) => String(s).trim()).filter(Boolean) : [];
      } catch (_) {
        chosenSubjects = [];
      }
    }
    if (!chosenSubjects.length) {
      const e = new Error('Seleccioná al menos una materia para esta clase');
      e.code = 'SUBJECTS_REQUIRED';
      throw e;
    }
    const invalid = chosenSubjects.filter((s) => !teacherSubjects.includes(s));
    if (invalid.length) {
      const e = new Error(`Materias no válidas para este profesor: ${invalid.join(', ')}`);
      e.code = 'SUBJECTS_INVALID';
      throw e;
    }

    if (datetime && datetimeHm && timeToMinutes(datetimeHm) !== timeToMinutes(slot.start)) {
      const e = new Error('La hora seleccionada no coincide con el horario del profesor ese día');
      e.code = 'SLOT_MISMATCH';
      throw e;
    }

    const mods = parseModalities(teacher);
    const uniq = [...new Set(mods)].filter((x) => x === 'virtual' || x === 'presencial');
    let sessionModality =
      bodyModality && ['virtual', 'presencial'].includes(String(bodyModality)) ? String(bodyModality) : null;
    if (uniq.length === 1) {
      sessionModality = uniq[0];
    } else if (uniq.length >= 2) {
      if (!sessionModality || !uniq.includes(sessionModality)) {
        const e = new Error('Tenés que elegir si la clase será virtual u presencial.');
        e.code = 'MODALITY_REQUIRED';
        throw e;
      }
    } else {
      sessionModality = null;
    }

    const classSize = Math.max(1, parseInt(teacher.classSize, 10) || 1);
    const existing = await BookingRepository.countByTeacherAndDatetime(teacherId, canonical);
    if (existing >= classSize) {
      const e = new Error('No quedan cupos para esa clase');
      e.code = 'FULL';
      throw e;
    }

    // Verificar solapamiento con otras reservas del usuario (no se permiten clases que se solapen ni un minuto)
    try {
      const newStartMin = timeToMinutes(slot.start);
      let newEndMin = timeToMinutes(slot.end);
      if (newStartMin == null || newEndMin == null) {
        const e = new Error('Horario del profesor inválido');
        e.code = 'VALIDATION';
        throw e;
      }
      if (newEndMin <= newStartMin) newEndMin += 24 * 60;
      const userBookings = await BookingRepository.getByUserId(userId);
      for (const ub of userBookings || []) {
        const existingYmd = extractYmdFromDatetimeInput(ub.datetime);
        if (!existingYmd) continue;
        // Solo comparar reservas en la misma fecha calendario
        if (existingYmd !== ymd) continue;
        const schedRaw = ub.teacherSchedulesStr != null ? ub.teacherSchedulesStr : ub.teacherschedulesstr;
        const existingDay = parseYMDLocal(existingYmd);
        const existingDow = existingDay ? existingDay.getDay() : null;
        const existingSlots = existingDow != null ? getSlotsForDow(parseSchedulesField(schedRaw), existingDow) : [];
        if (!existingSlots.length) continue;
        const existingHm = extractHmFromDatetimeInput(ub.datetime || '');
        let existingSlot = existingHm
          ? existingSlots.find((sl) => sl.start === existingHm) || null
          : null;
        if (!existingSlot) existingSlot = existingSlots[0];
        if (!existingSlot || !existingSlot.start || !existingSlot.end) continue;
        const existStartMin = timeToMinutes(existingSlot.start);
        let existEndMin = timeToMinutes(existingSlot.end);
        if (existStartMin == null || existEndMin == null) continue;
        if (existEndMin <= existStartMin) existEndMin += 24 * 60;
        // Si hay solapamiento en minutos -> error
        if (existStartMin < newEndMin && existEndMin > newStartMin) {
          const e = new Error('Ya tenés una clase reservada que se superpone en horario con esta nueva reserva.');
          e.code = 'USER_BUSY';
          throw e;
        }
      }
    } catch (errOverlap) {
      if (errOverlap && errOverlap.code === 'USER_BUSY') throw errOverlap;
      // cualquier otro error no bloquea (seguir con validaciones normales)
    }

    const bookingId = await BookingRepository.create({
      userId,
      teacherId,
      datetime: canonical,
      message,
      sessionModality,
      bookingSubjects: chosenSubjects
    });
    return { bookingId, datetime: canonical };
  }

  static async deleteBookingForUser(bookingId, userId) {
    const row = await BookingRepository.getById(bookingId);
    if (!row || Number(row.userId) !== Number(userId)) {
      return { ok: false, code: 'NOT_FOUND' };
    }
    const classStart = parseBookingStartLocal(row.datetime);
    if (!classStart) {
      return { ok: false, code: 'BAD_DATA' };
    }
    const msUntil = classStart.getTime() - Date.now();
    if (msUntil <= 24 * 60 * 60 * 1000) {
      return {
        ok: false,
        code: 'CANCEL_TOO_LATE',
        message:
          'No podés cancelar con menos de un día de antelación. Si necesitás cambiar la clase, contactá al profesor.'
      };
    }
    const deleted = await BookingRepository.deleteByIdForUser(bookingId, userId);
    return deleted ? { ok: true } : { ok: false, code: 'NOT_FOUND' };
  }

  static async getBookingDetailForUser(bookingId, userId) {
    const row = await BookingRepository.getByIdForUserWithTeacher(bookingId, userId);
    if (!row) return null;

    let modalities = [];
    try {
      modalities = row.teacherModalitiesStr ? JSON.parse(row.teacherModalitiesStr) : [];
      if (!Array.isArray(modalities)) modalities = [];
    } catch (_) {
      modalities = row.teacherModality ? [row.teacherModality] : [];
    }

    const chosen = row.sessionModality ? String(row.sessionModality) : null;
    const hasV = modalities.includes('virtual');
    const hasP = modalities.includes('presencial');
    const showVirtualContact =
      chosen === 'virtual' || (!chosen && hasV && !hasP) || (!chosen && hasV && hasP);

    let bookingSubjects = [];
    try {
      bookingSubjects = row.bookingSubjects ? JSON.parse(row.bookingSubjects) : [];
      if (!Array.isArray(bookingSubjects)) bookingSubjects = [];
    } catch (_) {
      bookingSubjects = [];
    }

    const base = {
      id: row.id,
      userId: row.userId,
      teacherId: row.teacherId,
      datetime: row.datetime,
      timeEnd: null,
      sessionModality: chosen,
      message: row.message,
      bookingSubjects,
      createdAt: row.createdAt,
      teacher: {
        firstName: row.teacherFirstName,
        lastName: row.teacherLastName,
        photo: row.teacherPhoto,
        description: row.teacherDescription,
        curriculum: row.teacherCurriculum,
        location: formatTeacherAddress(row) || row.teacherLocation,
        modality: row.teacherModality,
        modalities,
        classSize: row.teacherClassSize
      }
    };

    try {
      const dm = String(row.datetime || '').match(/^(\d{4}-\d{2}-\d{2})/);
      const ymd = dm ? dm[1] : '';
      if (ymd) {
        const schedRaw = row.teacherSchedulesStr != null ? row.teacherSchedulesStr : row.teacherschedulesstr;
        const day = parseYMDLocal(ymd);
        const dow = day ? day.getDay() : null;
        const slots = dow != null ? getSlotsForDow(parseSchedulesField(schedRaw), dow) : [];
        if (slots.length) {
          const hm = extractHmFromDatetimeInput(row.datetime || '');
          let slot = hm ? slots.find((sl) => sl.start === hm) || null : null;
          if (!slot) slot = slots[0];
          if (slot && slot.end) base.timeEnd = slot.end;
        }
      }
    } catch (_) {
      /* ignore */
    }

    if (showVirtualContact) {
      base.teacher.email = row.teacherEmail || null;
      base.teacher.phone = row.teacherPhone || null;
    }

    return base;
  }

  static teacherIsVirtualCapable(teacher) {
    return teacherIsVirtualCapable(teacher);
  }
}

module.exports = BookingService;
