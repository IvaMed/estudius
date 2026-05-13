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

  canonicalSchedule(obj) {
    const slots = Array.isArray(obj.slots)
      ? obj.slots
          .map((slot) => ({
            dow: Number(slot.dow),
            start: this.normalizeTimeHM(slot.start),
            end: this.normalizeTimeHM(slot.end)
          }))
          .filter(
            (sl) =>
              sl.start &&
              sl.end &&
              sl.dow >= 0 &&
              sl.dow <= 6 &&
              this.timeToMinutes(sl.end) > this.timeToMinutes(sl.start)
          )
      : [];
    return {
      version: 1,
      slots,
      flexible: false,
      notes: typeof obj.notes === 'string' ? obj.notes.trim().slice(0, 500) : ''
    };
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

  teacherMatchesAvailability(scheduleObj, targetDows, filterStartMin, filterEndMin) {
    if (!targetDows || targetDows.length === 0 || filterStartMin == null || filterEndMin == null) return true;
    if (filterEndMin <= filterStartMin) return false;
    const sch = this.ensureMinSlotsSchedule(this.parseSchedulesFromApi(scheduleObj));
    for (const slot of sch.slots) {
      if (!targetDows.includes(slot.dow)) continue;
      const s = this.timeToMinutes(slot.start);
      const e = this.timeToMinutes(slot.end);
      if (s == null || e == null) continue;
      if (s < filterEndMin && e > filterStartMin) return true;
    }
    return false;
  },

  teacherMatchesDowWindow(scheduleObj, dow, filterStartMin, filterEndMin) {
    if (dow == null || Number.isNaN(dow) || filterStartMin == null || filterEndMin == null) return true;
    if (filterEndMin <= filterStartMin) return false;
    const sch = this.ensureMinSlotsSchedule(this.parseSchedulesFromApi(scheduleObj));
    for (const slot of sch.slots) {
      if (slot.dow !== dow) continue;
      const s = this.timeToMinutes(slot.start);
      const e = this.timeToMinutes(slot.end);
      if (s == null || e == null) continue;
      if (s < filterEndMin && e > filterStartMin) return true;
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
