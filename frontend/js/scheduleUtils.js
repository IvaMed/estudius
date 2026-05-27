/**
 * Horarios estructurados (alineado con backend/lib/scheduleUtils.js)
 * Siempre al menos una franja; no hay modo flexible.
 * dow: 0=Domingo .. 6=Sábado
 */
const ScheduleUtils = {
  DOW_LABELS_ES: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  /** Abreviaturas para filtros compactos (mismo índice dow 0–6) */
  DOW_LABELS_SHORT_ES: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],

  defaultWeekdayEveningSlots(start = '17:00', end = '20:00') {
    return [1, 2, 3, 4, 5].map((dow) => ({ dow, start, end }));
  },

  pad2(n) {
    return String(n).padStart(2, '0');
  },

  normalizeTimeHM(s) {
    if (!s || typeof s !== 'string') return null;
    const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return `${this.pad2(h)}:${this.pad2(min)}`;
  },

  timeToMinutes(hm) {
    const n = this.normalizeTimeHM(hm);
    if (!n) return null;
    const [h, min] = n.split(':').map((x) => parseInt(x, 10));
    return h * 60 + min;
  },

  rangesOverlapMinutes(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && aEnd > bStart;
  },

  minutesToTimeHM(mins) {
    if (!Number.isFinite(mins)) return String(mins);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${this.pad2(h)}:${this.pad2(m)}`;
  },

  getFilterSegments(filterStartMin, filterEndMin) {
    if (filterStartMin == null || filterEndMin == null) return [];
    if (filterEndMin > filterStartMin) {
      return [{ start: filterStartMin, end: filterEndMin, dayShift: 0 }];
    }
    if (filterEndMin === filterStartMin) return [];
    return [
      { start: filterStartMin, end: 24 * 60, dayShift: 0 },
      { start: 0, end: filterEndMin, dayShift: 1 }
    ];
  },

  getSlotSegments(startMin, endMin) {
    if (startMin == null || endMin == null) return [];
    if (endMin > startMin) return [{ start: startMin, end: endMin, dayShift: 0 }];
    if (endMin === startMin) return [];
    return [
      { start: startMin, end: 24 * 60, dayShift: 0 },
      { start: 0, end: endMin, dayShift: 1 }
    ];
  },

  formatScheduleSlotLabel(slot) {
    const dow = Number(slot.dow);
    const day = this.DOW_LABELS_ES[dow] || `Día ${dow}`;
    const start = typeof slot.start === 'number' ? this.minutesToTimeHM(slot.start) : slot.start;
    const end = typeof slot.end === 'number' ? this.minutesToTimeHM(slot.end) : slot.end;
    return `${day} ${start}–${end}`;
  },

  findScheduleOverlap(scheduleObj) {
    const sch = this.canonicalSchedule(scheduleObj || {});
    const occupied = [];

    for (const slot of sch.slots) {
      const s = this.timeToMinutes(slot.start);
      const e = this.timeToMinutes(slot.end);
      if (s == null || e == null) continue;

      const slotSegments = this.getSlotSegments(s, e);
      for (const seg of slotSegments) {
        const actualDow = (Number(slot.dow) + seg.dayShift + 7) % 7;
        const conflict = occupied.find(
          (prev) => prev.dow === actualDow && this.rangesOverlapMinutes(prev.start, prev.end, seg.start, seg.end)
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
  },

  slotWithinSegment(slot, segStartMin, segEndMin) {
    const s = typeof slot.start === 'number' ? slot.start : this.timeToMinutes(slot.start);
    const e = typeof slot.end === 'number' ? slot.end : this.timeToMinutes(slot.end);
    if (s == null || e == null) return false;
    return s >= segStartMin && e <= segEndMin;
  },

  canonicalSchedule(obj) {
    const slots = Array.isArray(obj.slots)
      ? obj.slots
          .map((slot) => ({
            dow: Number(slot.dow),
            start: this.normalizeTimeHM(slot.start),
            end: this.normalizeTimeHM(slot.end)
          }))
          .filter(
            (sl) => {
              const sMin = this.timeToMinutes(sl.start);
              const eMin = this.timeToMinutes(sl.end);
              return (
                sl.start &&
                sl.end &&
                sl.dow >= 0 &&
                sl.dow <= 6 &&
                sMin != null &&
                eMin != null &&
                sMin !== eMin
              );
            }
          )
      : [];
    return {
      version: 1,
      slots,
      flexible: false,
      notes: typeof obj.notes === 'string' ? obj.notes.trim().slice(0, 500) : ''
    };
  },

  validateScheduleShape(value) {
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
    const sch = this.canonicalSchedule(obj);
    if (!sch.slots || sch.slots.length === 0) {
      return { ok: false, message: 'Debés cargar al menos un día con horario de inicio y fin' };
    }
    const overlap = this.findScheduleOverlap(sch);
    if (overlap.overlap) {
      return {
        ok: false,
        message: `Las franjas no pueden superponerse. Revisá ${this.formatScheduleSlotLabel(overlap.existing)} y ${this.formatScheduleSlotLabel(overlap.current)}`
      };
    }
    return { ok: true, data: sch };
  },

  ensureMinSlotsSchedule(sch) {
    const c = this.canonicalSchedule(sch || {});
    if (c.slots && c.slots.length > 0) return c;
    const note = c.notes || '';
    return { version: 1, slots: this.defaultWeekdayEveningSlots(), flexible: false, notes: note };
  },

  parseSchedulesFromApi(raw) {
    if (raw == null || raw === '') {
      return { version: 1, slots: this.defaultWeekdayEveningSlots(), flexible: false, notes: '' };
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      return this.ensureMinSlotsSchedule(raw);
    }
    const s = String(raw).trim();
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        const o = JSON.parse(s);
        if (Array.isArray(o)) return this.ensureMinSlotsSchedule({ version: 1, slots: o, flexible: false, notes: '' });
        if (o && typeof o === 'object') return this.ensureMinSlotsSchedule({ ...o, flexible: false });
      } catch (_) {
        /* fallthrough */
      }
    }
    return this.ensureMinSlotsSchedule({ version: 1, slots: this.defaultWeekdayEveningSlots(), flexible: false, notes: s.slice(0, 500) });
  },

  uniqueDowsInDateRangeInclusive(dateFromStr, dateToStr) {
    const from = this.parseYMDLocal(dateFromStr);
    const to = this.parseYMDLocal(dateToStr);
    if (!from || !to || from > to) return null;
    const set = new Set();
    const cur = new Date(from.getTime());
    while (cur <= to) {
      set.add(cur.getDay());
      cur.setDate(cur.getDate() + 1);
    }
    return [...set];
  },

  parseYMDLocal(s) {
    if (!s || typeof s !== 'string') return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    if (Number.isNaN(d.getTime())) return null;
    return d;
  },

  /** Franjas reales del docente (sin horarios por defecto inventados para el filtro). */
  slotsForFilter(scheduleObj) {
    const parsed = this.parseSchedulesFromApi(scheduleObj);
    const raw = Array.isArray(parsed.slots) ? parsed.slots : [];
    return raw
      .map((slot) => ({
        dow: Number(slot.dow),
        start: this.normalizeTimeHM(slot.start),
        end: this.normalizeTimeHM(slot.end)
      }))
      .filter((sl) => {
        const s = this.timeToMinutes(sl.start);
        const e = this.timeToMinutes(sl.end);
        return (
          sl.start &&
          sl.end &&
          sl.dow >= 0 &&
          sl.dow <= 6 &&
          s != null &&
          e != null &&
          s !== e
        );
      });
  },

  /** La franja del docente debe quedar completamente dentro del rango elegido. */
  slotWithinFilterWindow(slot, filterStartMin, filterEndMin) {
    const segments = this.getFilterSegments(filterStartMin, filterEndMin);
    if (!segments.length) return false;
    const s = this.timeToMinutes(slot.start);
    const e = this.timeToMinutes(slot.end);
    const slotSegments = this.getSlotSegments(s, e);
    return slotSegments.some((slotSeg) =>
      segments.some((seg) => this.slotWithinSegment(slotSeg, seg.start, seg.end))
    );
  },

  teacherMatchesAvailability(scheduleObj, targetDows, filterStartMin, filterEndMin) {
    if (!targetDows || targetDows.length === 0 || filterStartMin == null || filterEndMin == null) return true;
    const segments = this.getFilterSegments(filterStartMin, filterEndMin);
    if (!segments.length) return false;
    const slots = this.slotsForFilter(scheduleObj);
    if (!slots.length) return false;
    for (const slot of slots) {
      const s = this.timeToMinutes(slot.start);
      const e = this.timeToMinutes(slot.end);
      const slotSegments = this.getSlotSegments(s, e);
      for (const slotSeg of slotSegments) {
        const slotDow = (slot.dow + slotSeg.dayShift) % 7;
        for (const seg of segments) {
          const targetDow = (slotDow - seg.dayShift + 7) % 7;
          if (!targetDows.includes(targetDow)) continue;
          if (this.slotWithinSegment(slotSeg, seg.start, seg.end)) return true;
        }
      }
    }
    return false;
  },

  teacherMatchesDowWindow(scheduleObj, dow, filterStartMin, filterEndMin) {
    if (dow == null || Number.isNaN(dow) || filterStartMin == null || filterEndMin == null) return true;
    const segments = this.getFilterSegments(filterStartMin, filterEndMin);
    if (!segments.length) return false;
    const slots = this.slotsForFilter(scheduleObj);
    if (!slots.length) return false;
    for (const slot of slots) {
      const s = this.timeToMinutes(slot.start);
      const e = this.timeToMinutes(slot.end);
      const slotSegments = this.getSlotSegments(s, e);
      for (const slotSeg of slotSegments) {
        const slotDow = (slot.dow + slotSeg.dayShift) % 7;
        for (const seg of segments) {
          const targetDow = (slotDow - seg.dayShift + 7) % 7;
          if (targetDow !== dow) continue;
          if (this.slotWithinSegment(slotSeg, seg.start, seg.end)) return true;
        }
      }
    }
    return false;
  },

  formatScheduleSummaryEs(sch) {
    const s = this.ensureMinSlotsSchedule(this.parseSchedulesFromApi(sch));
    const parts = s.slots.map((sl) => {
      const day = this.DOW_LABELS_ES[sl.dow] || `Día ${sl.dow}`;
      return `${day} ${sl.start}–${sl.end}`;
    });
    const base = parts.join(' · ');
    if (s.notes) return `${base}. ${s.notes}`;
    return base;
  },

  formatScheduleDetailHtml(sch) {
    const s = this.ensureMinSlotsSchedule(this.parseSchedulesFromApi(sch));
    if (!s.slots.length) return '<p>Sin franjas cargadas.</p>';
    const rows = s.slots
      .map(
        (sl) =>
          `<li><strong>${this.escapeHtml(this.DOW_LABELS_ES[sl.dow] || '')}</strong>: ${this.escapeHtml(
            sl.start
          )} a ${this.escapeHtml(sl.end)}</li>`
      )
      .join('');
    const notes = s.notes ? `<p class="schedule-notes">${this.escapeHtml(s.notes)}</p>` : '';
    return `<ul class="schedule-detail-list">${rows}</ul>${notes}`;
  },

  escapeHtml(t) {
    return String(t || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  /** Valores por defecto del filtro de horario (solo UI hasta pulsar Aplicar). */
  resetScheduleFilterInputs() {
    const tFrom = document.getElementById('barSchFrom');
    const tTo = document.getElementById('barSchTo');
    const dow = document.getElementById('barSchDow');
    if (tFrom) tFrom.value = '00:00';
    if (tTo) tTo.value = '23:59';
    if (dow) dow.value = '';
  },

  /** HTML del filtro compacto día + hora (reutilizable en home y listado) */
  inlineScheduleFilterMarkup() {
    const opts = this.DOW_LABELS_SHORT_ES.map(
      (label, i) => `<option value="${i}">${label}</option>`
    ).join('');
    return `
      <div class="inline-schedule-filter" role="group" aria-label="Mostrar docentes con clase en este día y franja horaria">
        <span class="inline-schedule-lead">Horario</span>
        <select id="barSchDow" class="form-control form-control-inline inline-sch-dow" title="Día de la semana">
          <option value="">Todos</option>
          ${opts}
        </select>
        <span class="inline-schedule-mid" aria-hidden="true">de</span>
        <input type="time" id="barSchFrom" class="form-control form-control-inline inline-sch-time" value="00:00" title="Desde" aria-label="Desde las" />
        <span class="inline-schedule-sep" aria-hidden="true">a</span>
        <input type="time" id="barSchTo" class="form-control form-control-inline inline-sch-time" value="23:59" title="Hasta" aria-label="Hasta las" />
        <div class="inline-schedule-actions">
          <button type="button" id="barSchApply" class="btn btn-primary btn-compact btn-sch-apply" title="Aplicar filtro de horario">Aplicar</button>
          <button type="button" id="barSchClear" class="btn btn-outline btn-compact btn-sch-clear" title="Quitar filtro de horario" aria-label="Quitar filtro de horario">✕</button>
        </div>
      </div>
    `;
  },

  getSlotsForDow(scheduleObj, dow) {
    const sch = this.ensureMinSlotsSchedule(this.parseSchedulesFromApi(scheduleObj));
    return sch.slots
      .filter((sl) => Number(sl.dow) === Number(dow))
      .sort((a, b) => (this.timeToMinutes(a.start) || 0) - (this.timeToMinutes(b.start) || 0));
  },

  /** Una sola franja por día de semana (si hay varias, la primera por hora de inicio). */
  getSlotForCalendarDate(scheduleObj, ymd) {
    const d = this.parseYMDLocal(ymd);
    if (!d) return null;
    const list = this.getSlotsForDow(scheduleObj, d.getDay());
    if (!list.length) return null;
    return { start: list[0].start, end: list[0].end, dow: list[0].dow };
  }
};
