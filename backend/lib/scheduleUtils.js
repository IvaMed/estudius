// =====================================================
// Horarios estructurados (JSON en columna teachers.schedules)
// Formato: { version: 1, slots: [{ dow, start, end }], notes? }
// dow: 0=Domingo .. 6=Sábado (Date.getDay())
// Regla de producto: siempre al menos una franja; no hay modo "flexible".
// =====================================================

const DOW_LABELS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Franjas por defecto para profesores sin horario definido: Lun–Vie 17:00–20:00 */
function defaultWeekdayEveningSlots(start = '17:00', end = '20:00') {
  return [1, 2, 3, 4, 5].map((dow) => ({ dow, start, end }));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function normalizeTimeHM(s) {
  if (!s || typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${pad2(h)}:${pad2(min)}`;
}

function timeToMinutes(hm) {
  const n = normalizeTimeHM(hm);
  if (!n) return null;
  const [h, min] = n.split(':').map((x) => parseInt(x, 10));
  return h * 60 + min;
}

function getFilterSegments(filterStartMin, filterEndMin) {
  if (filterStartMin == null || filterEndMin == null) return [];
  if (filterEndMin > filterStartMin) {
    return [{ start: filterStartMin, end: filterEndMin, dayShift: 0 }];
  }
  if (filterEndMin === filterStartMin) return [];
  return [
    { start: filterStartMin, end: 24 * 60, dayShift: 0 },
    { start: 0, end: filterEndMin, dayShift: 1 }
  ];
}

function getSlotSegments(startMin, endMin) {
  if (startMin == null || endMin == null) return [];
  if (endMin > startMin) return [{ start: startMin, end: endMin, dayShift: 0 }];
  if (endMin === startMin) return [];
  return [
    { start: startMin, end: 24 * 60, dayShift: 0 },
    { start: 0, end: endMin, dayShift: 1 }
  ];
}

function canonicalSchedule(obj) {
  const slots = Array.isArray(obj.slots)
    ? obj.slots
        .map((slot) => ({
          dow: Number(slot.dow),
          start: normalizeTimeHM(slot.start),
          end: normalizeTimeHM(slot.end)
        }))
        .filter((s) => {
          const sMin = timeToMinutes(s.start);
          const eMin = timeToMinutes(s.end);
          return s.start && s.end && s.dow >= 0 && s.dow <= 6 && sMin != null && eMin != null && sMin !== eMin;
        })
    : [];
  return {
    version: 1,
    slots,
    flexible: false,
    notes: typeof obj.notes === 'string' ? obj.notes.trim().slice(0, 500) : ''
  };
}

/** Garantiza al menos una franja (p.ej. tras leer datos viejos). */
function ensureMinSlotsSchedule(sch) {
  const c = canonicalSchedule(sch || {});
  if (c.slots && c.slots.length > 0) return c;
  const note = c.notes || '';
  return { version: 1, slots: defaultWeekdayEveningSlots(), flexible: false, notes: note };
}

function parseSchedulesField(raw) {
  if (raw == null || raw === '') {
    return { version: 1, slots: defaultWeekdayEveningSlots(), flexible: false, notes: '' };
  }
  const s = String(raw).trim();
  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      const o = JSON.parse(s);
      if (Array.isArray(o)) {
        return ensureMinSlotsSchedule({ version: 1, slots: o, flexible: false, notes: '' });
      }
      if (o && typeof o === 'object') {
        return ensureMinSlotsSchedule({
          version: 1,
          slots: o.slots || [],
          flexible: false,
          notes: o.notes || ''
        });
      }
    } catch (_) {
      /* fallthrough */
    }
  }
  return ensureMinSlotsSchedule(migrateLegacyScheduleText(s));
}

function serializeScheduleForDb(obj) {
  const ensured = ensureMinSlotsSchedule(obj || {});
  return JSON.stringify(ensured);
}

function normalizeScheduleInput(value) {
  if (value == null) {
    return { version: 1, slots: defaultWeekdayEveningSlots(), flexible: false, notes: '' };
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return { version: 1, slots: defaultWeekdayEveningSlots(), flexible: false, notes: '' };
    try {
      const o = JSON.parse(t);
      if (Array.isArray(o)) return ensureMinSlotsSchedule({ slots: o, flexible: false, notes: '' });
      if (o && typeof o === 'object') return ensureMinSlotsSchedule({ ...o, flexible: false });
    } catch (_) {
      return ensureMinSlotsSchedule(migrateLegacyScheduleText(t));
    }
  }
  if (typeof value === 'object') {
    return ensureMinSlotsSchedule({ ...value, flexible: false });
  }
  return { version: 1, slots: defaultWeekdayEveningSlots(), flexible: false, notes: '' };
}

function validateScheduleShape(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return { ok: false, message: 'Los horarios son requeridos (al menos una franja)' };
  }
  let obj;
  if (typeof value === 'string') {
    try {
      obj = JSON.parse(value.trim());
    } catch {
      return { ok: false, message: 'Formato de horarios inválido' };
    }
  } else {
    obj = value;
  }
  if (!obj || typeof obj !== 'object') {
    return { ok: false, message: 'Formato de horarios inválido' };
  }
  const sch = canonicalSchedule(obj);
  if (!sch.slots || sch.slots.length === 0) {
    return { ok: false, message: 'Debés cargar al menos un día con horario de inicio y fin' };
  }
  const overlap = findScheduleOverlap(sch);
  if (overlap.overlap) {
    return {
      ok: false,
      message: `Las franjas no pueden superponerse. Revisá ${formatScheduleSlotLabel(overlap.existing)} y ${formatScheduleSlotLabel(overlap.current)}`
    };
  }
  return { ok: true, data: sch };
}

function migrateLegacyScheduleText(text) {
  const t = String(text || '').trim();
  if (!t) {
    return { version: 1, slots: defaultWeekdayEveningSlots(), flexible: false, notes: '' };
  }

  try {
    const p = JSON.parse(t);
    if (p && typeof p === 'object') {
      if (p.version === 1 && Array.isArray(p.slots)) return canonicalSchedule({ ...p, flexible: false });
      if (Array.isArray(p.slots)) return canonicalSchedule({ ...p, version: 1, flexible: false });
    }
  } catch (_) {
    /* legacy plain text */
  }

  const lower = t.toLowerCase();
  if (
    /flexible|consultar|coordin|previa|mañanas y tardes|mananas y tardes|disponibilidad/i.test(lower)
  ) {
    return { version: 1, slots: defaultWeekdayEveningSlots(), flexible: false, notes: t.slice(0, 500) };
  }

  let startH = '17:00';
  let endH = '21:00';
  const timeRange = t.match(/(\d{1,2}:\d{2})\s*[-–a]\s*(\d{1,2}:\d{2})/i);
  if (timeRange) {
    const a = normalizeTimeHM(timeRange[1]);
    const b = normalizeTimeHM(timeRange[2]);
    const aMin = a ? timeToMinutes(a) : null;
    const bMin = b ? timeToMinutes(b) : null;
    if (a && b && aMin != null && bMin != null && aMin !== bMin) {
      startH = a;
      endH = b;
    }
  }

  let dows = [];
  if (/lunes\s*a\s*viernes|lun[\s./]*vie|entre\s*semana/i.test(lower)) {
    dows = [1, 2, 3, 4, 5];
  } else if (/s[áa]bados?/i.test(t) && !/domingos?/i.test(lower)) {
    dows = [6];
  } else if (/domingos?/i.test(lower) && !/s[áa]bados?/i.test(lower)) {
    dows = [0];
  } else if (/s[áa]bados?\s*y\s*domingos?|fines?\s*de\s*semana/i.test(lower)) {
    dows = [0, 6];
  } else if (/lun[\s./]*mi[eé][\s./]*vie/i.test(lower)) {
    dows = [1, 3, 5];
  } else if (/mar[\s./]*jue/i.test(lower) || /martes\s*y\s*jueves/i.test(lower)) {
    dows = [2, 4];
  } else {
    if (/\blunes\b/i.test(t)) dows.push(1);
    if (/\bmartes\b/i.test(t)) dows.push(2);
    if (/\bmi[eé]rcoles\b/i.test(t)) dows.push(3);
    if (/\bjueves\b/i.test(t)) dows.push(4);
    if (/\bviernes\b/i.test(t)) dows.push(5);
    if (/\bs[áa]bado\b/i.test(t)) dows.push(6);
    if (/\bdomingo\b/i.test(t)) dows.push(0);
    dows = [...new Set(dows)].sort((a, b) => a - b);
  }

  if (dows.length === 0) {
    return { version: 1, slots: defaultWeekdayEveningSlots(), flexible: false, notes: t.slice(0, 500) };
  }

  const slots = dows.map((dow) => ({ dow, start: startH, end: endH }));
  return { version: 1, slots, flexible: false, notes: '' };
}

function uniqueDowsInDateRangeInclusive(dateFromStr, dateToStr) {
  const from = parseYMDLocal(dateFromStr);
  const to = parseYMDLocal(dateToStr);
  if (!from || !to || from > to) return null;
  const set = new Set();
  const cur = new Date(from.getTime());
  while (cur <= to) {
    set.add(cur.getDay());
    cur.setDate(cur.getDate() + 1);
  }
  return [...set];
}

function parseYMDLocal(s) {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function rangesOverlapMinutes(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function minutesToTimeHM(mins) {
  if (!Number.isFinite(mins)) return String(mins);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function formatScheduleSlotLabel(slot) {
  const dow = Number(slot.dow);
  const day = DOW_LABELS_ES[dow] || `Día ${dow}`;
  const start = typeof slot.start === 'number' ? minutesToTimeHM(slot.start) : slot.start;
  const end = typeof slot.end === 'number' ? minutesToTimeHM(slot.end) : slot.end;
  return `${day} ${start}–${end}`;
}

function findScheduleOverlap(scheduleObj) {
  const sch = canonicalSchedule(scheduleObj || {});
  const occupied = [];

  for (const slot of sch.slots) {
    const s = timeToMinutes(slot.start);
    const e = timeToMinutes(slot.end);
    if (s == null || e == null) continue;

    const slotSegments = getSlotSegments(s, e);
    for (const seg of slotSegments) {
      const actualDow = (Number(slot.dow) + seg.dayShift + 7) % 7;
      const conflict = occupied.find(
        (prev) => prev.dow === actualDow && rangesOverlapMinutes(prev.start, prev.end, seg.start, seg.end)
      );
      if (conflict) {
        return {
          overlap: true,
          existing: conflict,
          current: {
            dow: actualDow,
            start: seg.start,
            end: seg.end,
            sourceDow: Number(slot.dow),
            dayShift: seg.dayShift
          }
        };
      }
      occupied.push({ dow: actualDow, start: seg.start, end: seg.end });
    }
  }

  return { overlap: false };
}

/**
 * Coincidencia por rango de fechas calendario + franja horaria.
 */
function teacherMatchesAvailability(scheduleObj, targetDows, filterStartMin, filterEndMin) {
  if (!targetDows || targetDows.length === 0 || filterStartMin == null || filterEndMin == null) return true;
  const segments = getFilterSegments(filterStartMin, filterEndMin);
  if (!segments.length) return false;

  const sch = ensureMinSlotsSchedule(scheduleObj || {});

  for (const slot of sch.slots) {
    const s = timeToMinutes(slot.start);
    const e = timeToMinutes(slot.end);
    if (s == null || e == null) continue;
    const slotSegments = getSlotSegments(s, e);
    for (const slotSeg of slotSegments) {
      const slotDow = (slot.dow + slotSeg.dayShift) % 7;
      for (const seg of segments) {
        const targetDow = (slotDow - seg.dayShift + 7) % 7;
        if (!targetDows.includes(targetDow)) continue;
        if (rangesOverlapMinutes(slotSeg.start, slotSeg.end, seg.start, seg.end)) return true;
      }
    }
  }
  return false;
}

/**
 * Un día de la semana concreto (0–6) + ventana horaria [filterStartMin, filterEndMin).
 */
function teacherMatchesDowWindow(scheduleObj, dow, filterStartMin, filterEndMin) {
  if (dow == null || Number.isNaN(dow) || filterStartMin == null || filterEndMin == null) return true;
  const segments = getFilterSegments(filterStartMin, filterEndMin);
  if (!segments.length) return false;
  const sch = ensureMinSlotsSchedule(scheduleObj || {});
  for (const slot of sch.slots) {
    const s = timeToMinutes(slot.start);
    const e = timeToMinutes(slot.end);
    if (s == null || e == null) continue;
    const slotSegments = getSlotSegments(s, e);
    for (const slotSeg of slotSegments) {
      const slotDow = (slot.dow + slotSeg.dayShift) % 7;
      for (const seg of segments) {
        const targetDow = (slotDow - seg.dayShift + 7) % 7;
        if (targetDow !== dow) continue;
        if (rangesOverlapMinutes(slotSeg.start, slotSeg.end, seg.start, seg.end)) return true;
      }
    }
  }
  return false;
}

function formatScheduleSummaryEs(sch) {
  const s = ensureMinSlotsSchedule(sch || {});
  const parts = s.slots.map((sl) => {
    const day = DOW_LABELS_ES[sl.dow] || `Día ${sl.dow}`;
    return `${day} ${sl.start}–${sl.end}`;
  });
  const base = parts.join(' · ');
  if (s.notes) return `${base}. ${s.notes}`;
  return base;
}

function isAlreadyMigratedDbString(raw) {
  const s = String(raw || '').trim();
  if (!s.startsWith('{')) return false;
  try {
    const o = JSON.parse(s);
    return !!(o && typeof o === 'object' && o.version === 1 && Array.isArray(o.slots) && o.slots.length > 0);
  } catch (_) {
    return false;
  }
}

/** Franjas de un día de la semana (0–6), ordenadas por hora de inicio */
function getSlotsForDow(scheduleInput, dow) {
  const sch =
    typeof scheduleInput === 'object' && scheduleInput !== null && !Array.isArray(scheduleInput)
      ? ensureMinSlotsSchedule(scheduleInput)
      : ensureMinSlotsSchedule(parseSchedulesField(scheduleInput));
  return sch.slots
    .filter((sl) => Number(sl.dow) === Number(dow))
    .sort((a, b) => (timeToMinutes(a.start) || 0) - (timeToMinutes(b.start) || 0));
}

/**
 * Franja canónica para una fecha calendario (YYYY-MM-DD).
 * Si hay más de una franja el mismo día de la semana, se usa solo la primera (helper legacy).
 */
function getSlotForCalendarDate(scheduleInput, ymd) {
  const d = parseYMDLocal(ymd);
  if (!d) return null;
  const dow = d.getDay();
  const list = getSlotsForDow(scheduleInput, dow);
  if (!list.length) return null;
  const slot = list[0];
  return { start: slot.start, end: slot.end, dow };
}

/** Unifica instantes de reserva para comparar (evita fallos entre `T` vs espacio y segundos). */
function normalizeBookingInstant(value) {
  const s = String(value || '').trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = String(parseInt(m[2], 10)).padStart(2, '0');
  const mm = String(parseInt(m[3], 10)).padStart(2, '0');
  return `${m[1]}T${hh}:${mm}`;
}

/** Valor guardado en bookings.datetime: YYYY-MM-DDTHH:mm (inicio de franja) */
function canonicalDatetimeForBooking(ymd, startHM) {
  const t = normalizeTimeHM(startHM);
  if (!t || !ymd) return null;
  return `${ymd}T${t}`;
}

module.exports = {
  DOW_LABELS_ES,
  defaultWeekdayEveningSlots,
  ensureMinSlotsSchedule,
  pad2,
  normalizeTimeHM,
  timeToMinutes,
  canonicalSchedule,
  parseSchedulesField,
  serializeScheduleForDb,
  normalizeScheduleInput,
  validateScheduleShape,
  migrateLegacyScheduleText,
  uniqueDowsInDateRangeInclusive,
  parseYMDLocal,
  findScheduleOverlap,
  teacherMatchesAvailability,
  teacherMatchesDowWindow,
  formatScheduleSummaryEs,
  isAlreadyMigratedDbString,
  getSlotsForDow,
  getSlotForCalendarDate,
  canonicalDatetimeForBooking,
  normalizeBookingInstant
};
