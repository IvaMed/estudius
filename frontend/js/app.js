// ========================================
// APLICACIÓN PRINCIPAL
// ========================================

class EstudiusApp {
  constructor() {
    this.currentPage = 'home';
    this.teachersPerPage = 10;
    this.currentPage_pagination = 1;
    this.allTeachers = [];
    this.currentTeacher = null;
    this.currentDisplayedTeachers = [];
    this.currentUser = null; // objeto del usuario autenticado
    this.authToken = null;   // token JWT
    // Admin page state
    this.adminPage = 1;
    this.adminPageSize = 10;
    this.adminSearch = '';
    // Página previa antes de entrar a sección admin (para botón "volver")
    this.previousPageBeforeAdmin = null;
    this.subjectGroups = [];
    
    // Estado de filtros
    this.filters = {
      subject: null,
      modalities: [] // array de modalidades seleccionadas
    };

    /** Filtro compacto día de semana + franja (home y listado) */
    this.barScheduleFilter = null;
    
    /** @type {Set<number>} */
    this.favoriteTeacherIds = new Set();
    /** Estado del calendario de reserva en detalle de profesor */
    this._teacherDetailCal = null;

    this.init();
  }

  async init() {
    console.log('Inicializando Estudius');
    await this.loadAuthState();
    await this.loadSubjectGroups();
    this.setupEventListeners();
    await this.handleRouteChange();
    this.loadTeachers();
  }

  async loadSubjectGroups() {
    try {
      const resp = await TeacherAPI.getGroupedSubjects();
      if (resp && resp.success && Array.isArray(resp.data)) {
        this.subjectGroups = resp.data;
        return;
      }
    } catch (error) {
      console.warn('No se pudieron cargar materias agrupadas desde API, se usa fallback local');
    }

    this.subjectGroups = Object.entries(SUBJECTS).map(([name, items]) => ({
      name,
      items: (items || []).map((subject) => ({ name: subject, icon: '📘' }))
    }));
  }

  getAllSubjectsFlat() {
    return this.subjectGroups.flatMap((group) => (group.items || []).map((item) => item.name));
  }

  getSubjectIconMap() {
    const map = new Map();
    this.subjectGroups.forEach((group) => {
      (group.items || []).forEach((item) => {
        map.set(item.name, item.icon || '📘');
      });
    });
    return map;
  }

  async loadAuthState() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.currentUser = null;
        this.authToken = null;
        this.updateHeaderAuthUI();
        return;
      }

      try {
        const resp = await AuthAPI.me(token);
        if (resp && resp.success && resp.user) {
          this.currentUser = resp.user;
          this.authToken = token;
        } else {
          localStorage.removeItem('authToken');
          this.currentUser = null;
          this.authToken = null;
        }
      } catch (err) {
        console.error('Error validando token:', err);
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.authToken = null;
      }
    } finally {
      this.updateHeaderAuthUI();
    }
  }

  updateHeaderAuthUI() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    if (this.currentUser) {
      const initial = typeof userAvatarInitial === 'function' ? userAvatarInitial(this.currentUser) : (this.currentUser.firstName || 'U').charAt(0).toUpperCase();
      headerRight.innerHTML = `
        <div class="profile-wrapper">
          <div id="profileBubble" class="profile-bubble">${initial}</div>
          <div id="profileMenu" class="profile-menu" style="display:none;">
            <div style="padding: 8px 12px; font-weight: 700;">${this.currentUser.firstName} ${this.currentUser.lastName}</div>
            <div style="padding: 4px 12px; font-size: 0.85rem; color: #666;">${this.currentUser.email}</div>
            <div style="padding: 8px 12px; display:flex; gap:8px; flex-direction:column;">
              ${this.currentUser.role === 'user' ? '<a href="#my-bookings" class="btn btn-link" style="text-align:left;">Mis clases reservadas</a>' : ''}
              <a href="#favorites" class="btn btn-link" style="text-align:left;">Favoritos</a>
              <button id="changePwBtn" class="btn btn-link" style="text-align:left;">Cambiar contraseña</button>
              <button id="logoutBtn" class="btn btn-link" style="text-align:left;">Cerrar sesión</button>
            </div>
          </div>
        </div>
      `;

      const bubble = document.getElementById('profileBubble');
      const menu = document.getElementById('profileMenu');
      if (bubble && menu) {
        // Usar color persistido del usuario si existe, sino fallback a paleta CSS
        try {
          if (this.currentUser && this.currentUser.color) {
            bubble.style.backgroundColor = this.currentUser.color;
          } else {
            const paletteVars = ['--color-primary', '--color-secondary', '--isotipo-dark', '--isotipo-darker', '--isotipo-accent', '--color-success', '--color-warning', '--color-error', '--color-info'];
            const pick = paletteVars[Math.floor(Math.random() * paletteVars.length)];
            const computed = getComputedStyle(document.documentElement).getPropertyValue(pick).trim() || '#587D71';
            bubble.style.backgroundColor = computed;
          }
        } catch (e) {
          bubble.style.backgroundColor = '#587D71';
        }

        try {
          const bg = bubble.style.backgroundColor || this.currentUser.color || '#587D71';
          bubble.style.color = typeof contrastingAvatarTextColor === 'function' ? contrastingAvatarTextColor(bg) : '#ffffff';
        } catch (e) {
          bubble.style.color = '#ffffff';
        }

        bubble.onclick = (e) => {
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        };
      }

      const logoutBtn = document.getElementById('logoutBtn');
      const changePwBtn = document.getElementById('changePwBtn');
      if (changePwBtn) { changePwBtn.addEventListener('click', () => this.showChangePasswordModal()); }
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }
    } else {
      headerRight.innerHTML = `
        <button class="btn-header btn-signin">Iniciar sesión</button>
        <button class="btn-header btn-signup">Registrarse</button>
      `;

      const signin = headerRight.querySelector('.btn-signin');
      const signup = headerRight.querySelector('.btn-signup');
      if (signin) signin.addEventListener('click', () => this.showAuthModal('login'));
      if (signup) signup.addEventListener('click', () => this.showAuthModal('register'));
    }

    // Mostrar/ocultar opción de "Agregar Profesor" según rol
    try {
      const addNav = document.querySelector('[data-page="add-teacher"]');
      if (addNav) {
        addNav.style.display = (this.currentUser && this.currentUser.role === 'admin') ? '' : 'none';
      }
    } catch (e) {
      // ignore
    }

    // Admin dropdown en el header-left: visible para cualquier usuario con rol 'admin'
    try {
      const headerLeft = document.querySelector('.header-left');
      let adminWrapper = document.getElementById('adminWrapper');
      if (this.currentUser && this.currentUser.role === 'admin') {
        if (!adminWrapper && headerLeft) {
          adminWrapper = document.createElement('div');
          adminWrapper.id = 'adminWrapper';
          adminWrapper.className = 'admin-wrapper';
          adminWrapper.innerHTML = `<button id="adminHeaderBtn" class="admin-button">Admin ▾</button><div id="adminDropdown" class="admin-dropdown"></div>`;
          headerLeft.appendChild(adminWrapper);
        }

        if (adminWrapper) {
          const dropdown = adminWrapper.querySelector('#adminDropdown');
          const btn = adminWrapper.querySelector('#adminHeaderBtn');

          // Mostrar opción para modificar características a todos los admins
          dropdown.innerHTML = `<div class="admin-dropdown-item" id="manageFeaturesBtn">Modificar características</div>`;
          const manageFeatures = dropdown.querySelector('#manageFeaturesBtn');
          if (manageFeatures) {
            manageFeatures.onclick = (e) => { e.stopPropagation(); this.showPage('admin-features'); dropdown.style.display = 'none'; };
          }

          // Para el super-admin (admin@gmail.com) agregar además administración de cuentas
          if (this.currentUser.email && this.currentUser.email.toLowerCase() === 'admin@gmail.com') {
            const acc = document.createElement('div');
            acc.className = 'admin-dropdown-item';
            acc.id = 'manageAccountsBtn';
            acc.textContent = 'Administración de cuentas';
            dropdown.appendChild(acc);
            acc.onclick = (e) => { e.stopPropagation(); this.showPage('admin'); dropdown.style.display = 'none'; };
          }

          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            };
          }
        }
      } else {
        if (adminWrapper) adminWrapper.remove();
      }
    } catch (e) { /* ignore */ }

    this.syncNavAuthItems();
  }

  showAuthModal(mode = 'login', opts = {}) {
    // mode: 'login' | 'register'
    this.closeAuthModal();
    const overlay = document.createElement('div');
    overlay.id = 'authModal';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    const formHtml = mode === 'register' ? `
      <h2>Registrarse</h2>
      <form id="authForm">
        <div class="form-group required"><label>Nombre</label><input name="firstName" required /></div>
        <div class="form-group required"><label>Apellido</label><input name="lastName" required /></div>
        <div class="form-group required"><label>Email</label><input name="email" type="email" required /></div>
        <div class="form-group required"><label>Contraseña</label><input name="password" type="password" required /></div>
        <div class="form-group required"><label>Confirmar contraseña</label><input name="confirmPassword" type="password" required /></div>
        <div style="display:flex; gap:8px; margin-top:12px;"><button type="submit" class="btn btn-primary">Crear cuenta</button><button type="button" id="cancelAuthBtn" class="btn btn-outline">Cancelar</button></div>
        <div id="authErrors" style="margin-top:12px; color: #b00020;"></div>
      </form>
    ` : `
      <h2>Iniciar sesión</h2>
      <p class="auth-login-hint">Si no tienes una cuenta, <button type="button" id="switchToRegisterFromLogin" class="btn btn-link">créala aquí</button>.</p>
      <form id="authForm">
        <div class="form-group required"><label>Email</label><input name="email" type="email" required /></div>
        <div class="form-group required"><label>Contraseña</label><input name="password" type="password" required /></div>
        <div style="display:flex; gap:8px; margin-top:12px;"><button type="submit" class="btn btn-primary">Iniciar sesión</button><button type="button" id="cancelAuthBtn" class="btn btn-outline">Cancelar</button></div>
        <div id="authErrors" style="margin-top:12px; color: #b00020;"></div>
      </form>
    `;

    const container = document.createElement('div');
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.borderRadius = '12px';
    container.style.width = '420px';
    container.innerHTML = formHtml;

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const form = document.getElementById('authForm');
    const cancelBtn = document.getElementById('cancelAuthBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeAuthModal());

    if (mode === 'login') {
      const sw = document.getElementById('switchToRegisterFromLogin');
      if (sw) {
        sw.addEventListener('click', () => {
          this.closeAuthModal();
          setTimeout(() => this.showAuthModal('register'), 120);
        });
      }
    }

    // Prefill email if provided in opts
    try {
      if (opts && opts.email) {
        const emailField = form.querySelector('input[name="email"]');
        if (emailField) emailField.value = opts.email;
      }
    } catch (e) { /* ignore */ }

    // Add password visibility toggles for any password inputs in the auth form
    try {
      const pwInputs = form.querySelectorAll('input[type="password"]');
      pwInputs.forEach((input, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toggle-password';
        btn.textContent = 'Mostrar';
        btn.addEventListener('click', () => {
          if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = 'Ocultar';
          } else {
            input.type = 'password';
            btn.textContent = 'Mostrar';
          }
        });

        // Insert the button after the input
        input.parentNode && input.parentNode.appendChild(btn);
      });
    } catch (e) { /* ignore */ }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const errorsEl = document.getElementById('authErrors');
      errorsEl.textContent = '';

      try {
        if (mode === 'register') {
          // Validaciones cliente
          if (!data.firstName || !data.lastName || !data.email || !data.password || !data.confirmPassword) {
            errorsEl.textContent = 'Todos los campos son obligatorios';
            return;
          }
          if (!validateEmail(data.email)) { errorsEl.textContent = 'Email inválido'; return; }
          if (data.password !== data.confirmPassword) { errorsEl.textContent = 'Las contraseñas no coinciden'; return; }
          const pwErrors = checkPasswordStrength(data.password);
          if (pwErrors.length > 0) { errorsEl.innerHTML = pwErrors.join('<br/>'); return; }

          const resp = await AuthAPI.register({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password });
          if (resp && resp.success) {
            this.setAuth(resp.token, resp.user);
            this.closeAuthModal();
            showAlert('Registro exitoso', 'success');
            // Recargar la página para reflejar el estado de sesión
            location.reload();
          }
        } else {
          if (!data.email || !data.password) { errorsEl.textContent = 'Email y contraseña son requeridos'; return; }
          const resp = await AuthAPI.login({ email: data.email, password: data.password });
          if (resp && resp.success) {
            this.setAuth(resp.token, resp.user);
            this.closeAuthModal();
            showAlert('Sesión iniciada', 'success');
            // Recargar la página para reflejar el estado de sesión
            location.reload();
          }
        }
      } catch (err) {
        console.error('Auth error:', err, err && err.details);
        // Special handling: login -> email not registered => suggest register
        if (mode === 'login') {
          if (err && err.details && err.details.notRegistered) {
            errorsEl.innerHTML = 'No existe una cuenta con ese email. <button id="gotoRegisterBtn" class="btn btn-link">Registrarse</button>';
            const btn = document.getElementById('gotoRegisterBtn');
            if (btn) btn.addEventListener('click', () => {
              this.closeAuthModal();
              setTimeout(() => this.showAuthModal('register', { email: data.email }), 120);
            });
            return;
          }
          // otherwise generic login error
          errorsEl.textContent = err && err.message ? err.message : 'Error en la operación de autenticación';
          return;
        }

        // Special handling: register -> email already exists => redirect to login with same email
        if (mode === 'register') {
          if (err && err.details && err.details.emailExists) {
            this.closeAuthModal();
            showAlert('Ya existe una cuenta con ese email. Redirigiendo a iniciar sesión', 'info');
            setTimeout(() => this.showAuthModal('login', { email: data.email }), 200);
            return;
          }
          // If server returned array of validation errors
          if (err && err.details && Array.isArray(err.details.errors) && err.details.errors.length) {
            errorsEl.innerHTML = err.details.errors.join('<br/>');
            return;
          }
        }

        // Fallback
        if (err && err.message) errorsEl.textContent = err.message;
        else errorsEl.textContent = 'Error en la operación de autenticación';
      }
    });
  }

  closeAuthModal() {
    const existing = document.getElementById('authModal');
      if (existing) existing.remove(); 
      // Clear any existing suggestions
      const suggestions = document.getElementById('homeSearchSuggestions');
      if (suggestions) suggestions.remove();
  }

  setAuth(token, user) {
    try {
      localStorage.setItem('authToken', token);
    } catch (e) { console.warn('No se pudo guardar token en localStorage'); }
    this.authToken = token;
    this.currentUser = user;
    this.updateHeaderAuthUI();
    this.syncNavAuthItems();
    // Limpiar mensaje inline de reserva si existe
    try {
      const bookErr = document.getElementById('bookError');
      if (bookErr) { bookErr.textContent = ''; bookErr.style.visibility = 'hidden'; }
    } catch (e) { /* ignore */ }
  }

  logout() {
    localStorage.removeItem('authToken');
    this.authToken = null;
    this.currentUser = null;
    this.updateHeaderAuthUI();
    showAlert('Sesión cerrada', 'info');
    // Recargar la página para reflejar el cierre de sesión
    location.reload();
  }

  showScheduleModal(teacher) {
    this.closeScheduleModal();
    const modOpts = this.bookingModalityOptions(teacher);
    let modalityField = '';
    if (modOpts.length >= 2) {
      modalityField = `
        <div class="form-group required"><label>Modalidad</label>
          <div class="schedule-modality-radios">
            <label class="booking-modality-label"><input type="radio" name="sessionModality" value="virtual" /> Virtual</label>
            <label class="booking-modality-label"><input type="radio" name="sessionModality" value="presencial" /> Presencial</label>
          </div>
        </div>`;
    }
    const overlay = document.createElement('div');
    overlay.id = 'scheduleModal';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    const container = document.createElement('div');
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.borderRadius = '12px';
    container.style.width = '480px';
    container.innerHTML = `
      <h3>Agendar clase con ${teacher.firstName} ${teacher.lastName}</h3>
      <form id="scheduleForm">
        <div class="form-group required"><label>Fecha y hora</label><input name="datetime" type="datetime-local" required /></div>
        ${modalityField}
        <div class="form-group"><label>Mensaje (opcional)</label><textarea name="message" rows="3"></textarea></div>
        <div style="display:flex; gap:8px; margin-top:12px;"><button type="submit" class="btn btn-primary">Reservar</button><button type="button" id="cancelScheduleBtn" class="btn btn-outline">Cancelar</button></div>
        <div id="scheduleErrors" style="margin-top:12px; color: #b00020;"></div>
      </form>
    `;

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const form = document.getElementById('scheduleForm');
    const cancelBtn = document.getElementById('cancelScheduleBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeScheduleModal());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const errorsEl = document.getElementById('scheduleErrors');
      errorsEl.textContent = '';

      if (!data.datetime) { errorsEl.textContent = 'Selecciona fecha y hora'; return; }

      try {
        const dt = data.datetime || '';
        const dateOnly = dt.indexOf('T') >= 0 ? dt.split('T')[0] : dt;
        let sessionModality = null;
        if (modOpts.length >= 2) {
          sessionModality = data.sessionModality;
          if (!sessionModality) {
            errorsEl.textContent = 'Elegí si la clase será virtual o presencial';
            return;
          }
        } else if (modOpts.length === 1) {
          sessionModality = modOpts[0];
        }
        await this.handleCreateBooking(teacher.id, dateOnly, data.message, sessionModality);
        this.closeScheduleModal();
        showAlert('Clase agendada correctamente', 'success');
      } catch (err) {
        console.error('Error reservando:', err);
        errorsEl.textContent = err.message || 'Error al crear reserva';
      }
    });
  }

  closeScheduleModal() {
    const existing = document.getElementById('scheduleModal');
    if (existing) existing.remove();
  }

  showChangePasswordModal() {
    this.closeChangePasswordModal();
    const overlay = document.createElement('div');
    overlay.id = 'changePwModal';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    const container = document.createElement('div');
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.borderRadius = '12px';
    container.style.width = '420px';
    container.innerHTML = `
      <h3>Cambiar contraseña</h3>
      <form id="changePwForm">
        <div class="form-group required"><label>Contraseña actual</label><input name="currentPassword" type="password" required /></div>
        <div class="form-group required"><label>Nueva contraseña</label><input name="newPassword" type="password" required /></div>
        <div class="form-group required"><label>Confirmar nueva contraseña</label><input name="confirmPassword" type="password" required /></div>
        <div style="display:flex; gap:8px; margin-top:12px;"><button type="submit" class="btn btn-primary">Cambiar</button><button type="button" id="cancelChangePwBtn" class="btn btn-outline">Cancelar</button></div>
        <div id="changePwErrors" style="margin-top:12px; color: #b00020;"></div>
      </form>
    `;

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const form = document.getElementById('changePwForm');
    const cancelBtn = document.getElementById('cancelChangePwBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeChangePasswordModal());

    // Add toggle buttons for password inputs
    try {
      const pwInputs = form.querySelectorAll('input[type="password"]');
      pwInputs.forEach((input) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toggle-password';
        btn.textContent = 'Mostrar';
        btn.addEventListener('click', () => {
          if (input.type === 'password') { input.type = 'text'; btn.textContent = 'Ocultar'; }
          else { input.type = 'password'; btn.textContent = 'Mostrar'; }
        });
        input.parentNode && input.parentNode.appendChild(btn);
      });
    } catch (e) { /* ignore */ }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const errorsEl = document.getElementById('changePwErrors');
      errorsEl.textContent = '';

      if (!data.currentPassword || !data.newPassword || !data.confirmPassword) { errorsEl.textContent = 'Todos los campos son obligatorios'; return; }
      if (data.newPassword !== data.confirmPassword) { errorsEl.textContent = 'Las contraseñas nuevas no coinciden'; return; }
      const pwErrors = checkPasswordStrength(data.newPassword);
      if (pwErrors.length > 0) { errorsEl.innerHTML = pwErrors.join('<br/>'); return; }

      try {
        await AuthAPI.changePassword(this.authToken, { currentPassword: data.currentPassword, newPassword: data.newPassword });
        showAlert('Contraseña cambiada correctamente', 'success');
        this.closeChangePasswordModal();
      } catch (err) {
        console.error('Error cambiando contraseña:', err);
        if (err && err.details && Array.isArray(err.details.errors) && err.details.errors.length) {
          errorsEl.innerHTML = err.details.errors.join('<br/>');
        } else if (err && err.message) {
          errorsEl.textContent = err.message;
        } else {
          errorsEl.textContent = 'Error al cambiar contraseña';
        }
      }
    });
  }

  closeChangePasswordModal() {
    const existing = document.getElementById('changePwModal');
    if (existing) existing.remove();
  }

  /** Modalidades que ofrece el profesor para una reserva (virtual / presencial). */
  bookingModalityOptions(teacher) {
    if (!teacher) return [];
    let raw = [];
    if (Array.isArray(teacher.modalities)) raw = teacher.modalities;
    else if (teacher.modalities && typeof teacher.modalities === 'string') {
      try {
        const p = JSON.parse(teacher.modalities);
        raw = Array.isArray(p) ? p : [];
      } catch (_) {
        raw = [];
      }
    }
    if (!raw.length && teacher.modality) raw = [teacher.modality];
    return [...new Set(raw)].filter((x) => x === 'virtual' || x === 'presencial');
  }

  async handleCreateBooking(teacherId, date, message, sessionModality) {
    if (!this.authToken) throw new Error('No autenticado');
    const tid = Number(teacherId);
    if (!Number.isFinite(tid) || tid < 1) {
      throw new Error('No se pudo identificar al profesor. Volvé a abrir la ficha del profesor e intentá de nuevo.');
    }
    const dateStr = date && String(date).trim();
    if (!dateStr) {
      throw new Error('Elegí un día con cupo en el calendario antes de confirmar.');
    }
    const payload = { teacherId: tid, date: dateStr, message: (message && String(message).trim()) || undefined };
    if (sessionModality === 'virtual' || sessionModality === 'presencial') {
      payload.sessionModality = sessionModality;
    }
    const res = await BookingAPI.createBooking(this.authToken, payload);
    if (!res || !res.success) {
      const msg = (res && res.message) ? res.message : 'No se pudo crear la reserva';
      const error = new Error(msg);
      throw error;
    }
    return res.bookingId;
  }

  async refreshFavoriteIds() {
    this.favoriteTeacherIds = new Set();
    if (!this.authToken) return;
    try {
      const r = await FavoriteAPI.listIds(this.authToken);
      if (r && r.success && Array.isArray(r.data)) {
        r.data.forEach((id) => this.favoriteTeacherIds.add(Number(id)));
      }
    } catch (e) {
      console.warn('refreshFavoriteIds', e);
    }
  }

  syncNavAuthItems() {
    const my = document.querySelector('.nav-my-classes');
    const fav = document.querySelector('.nav-favorites');
    if (my) my.style.display = this.currentUser && this.currentUser.role === 'user' ? '' : 'none';
    if (fav) fav.style.display = this.currentUser ? '' : 'none';
  }

  async onFavoriteClick(teacherId, ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    let tid = Number(teacherId);
    if (!Number.isFinite(tid) || tid < 1) {
      const btn = ev && ev.currentTarget && ev.currentTarget.closest && ev.currentTarget.closest('[data-fav-teacher-id]');
      const raw = btn && btn.getAttribute('data-fav-teacher-id');
      tid = raw ? parseInt(raw, 10) : NaN;
    }
    if (!Number.isFinite(tid) || tid < 1) {
      showAlert('No se pudo identificar al profesor. Recargá la página e intentá de nuevo.', 'error');
      return;
    }
    if (!this.authToken) {
      showAlert('Iniciá sesión para usar favoritos', 'info');
      this.showAuthModal('login');
      return;
    }
    try {
      const r = await FavoriteAPI.toggle(this.authToken, tid);
      if (r && r.success) {
        if (r.isFavorite) this.favoriteTeacherIds.add(tid);
        else this.favoriteTeacherIds.delete(tid);
        document.querySelectorAll(`[data-fav-teacher-id="${tid}"]`).forEach((el) => {
          const on = this.favoriteTeacherIds.has(tid);
          el.classList.toggle('is-favorite', on);
          el.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (this.currentPage === 'favorites') {
          const main = document.querySelector('main');
          if (main) await this.renderFavoritesPage(main);
        }
      }
    } catch (err) {
      showAlert((err && err.message) || 'No se pudo actualizar el favorito', 'error');
    }
  }

  setupEventListeners() {
    // Header logo - ir a home (solo cuando se hace click en logo/texto)
    const headerLeft = document.querySelector('.header-left');
    if (headerLeft) {
      headerLeft.addEventListener('click', (e) => {
        if (e.target.closest('.header-logo-text') || e.target.closest('.header-logo') || e.target.closest('.header-logo-image')) {
          this.navigateToHome();
        }
      });
    }

    // Menú de navegación
    const addTeacherBtn = document.querySelector('[data-page="add-teacher"]');
    const listTeachersBtn = document.querySelector('[data-page="list-teachers"]');

    if (addTeacherBtn) {
      addTeacherBtn.addEventListener('click', () => {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
          showAlert('Debes ser administrador para agregar profesores', 'error');
          return;
        }
        this.showPage('add-teacher');
      });
    }

    if (listTeachersBtn) {
      listTeachersBtn.addEventListener('click', () => this.showPage('list-teachers'));
    }

    // Manejo de cambio de hash (URL)
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });

    // Cerrar menú de perfil y admin al hacer clic afuera
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('profileMenu');
      const wrapper = document.querySelector('.profile-wrapper');
      if (menu && wrapper) {
        if (!e.target.closest('.profile-wrapper')) {
          menu.style.display = 'none';
        }
      }

      const adminDropdown = document.getElementById('adminDropdown');
      const adminWrapper = document.getElementById('adminWrapper');
      if (adminDropdown && adminWrapper) {
        if (!e.target.closest('.admin-wrapper')) {
          adminDropdown.style.display = 'none';
        }
      }
    });
  }

  async handleRouteChange() {
    await this.refreshFavoriteIds();
    const raw = window.location.hash.slice(1) || '/';
    const hash = raw.replace(/^\//, '');

    if (hash.startsWith('teacher/')) {
      const teacherId = parseInt(hash.replace('teacher/', ''), 10);
      if (!Number.isNaN(teacherId)) await this.showTeacherDetail(teacherId);
    } else {
      await this.showPage(hash || 'home');
    }
    this.syncNavAuthItems();
  }

  navigateToHome() {
    window.location.hash = '';
    void this.showPage('home');
  }

  async showPage(pageName) {
    // Protecciones por página
    if (pageName === 'add-teacher' && (!this.currentUser || this.currentUser.role !== 'admin')) {
      showAlert('Debes ser administrador para acceder a esta sección', 'error');
      this.currentPage = 'home';
      await this.renderPage();
      return;
    }

    if (pageName === 'my-bookings') {
      if (!this.currentUser || this.currentUser.role !== 'user') {
        showAlert('Iniciá sesión como alumno para ver tus clases', 'info');
        this.showAuthModal('login');
        this.currentPage = 'home';
        await this.renderPage();
        return;
      }
    }

    if (pageName === 'favorites') {
      if (!this.currentUser) {
        showAlert('Iniciá sesión para ver tus favoritos', 'info');
        this.showAuthModal('login');
        this.currentPage = 'home';
        await this.renderPage();
        return;
      }
    }

    // Si entramos a una página de administración desde una página no-admin,
    // recordamos la página previa para el botón de volver.
    const adminPages = new Set(['admin', 'add-teacher', 'admin-features']);
    if (adminPages.has(pageName) && !adminPages.has(this.currentPage)) {
      this.previousPageBeforeAdmin = this.currentPage || 'home';
    }

    this.currentPage = pageName;
    await this.renderPage();
  }

  async renderPage() {
    const main = document.querySelector('main');
    
    switch (this.currentPage) {
      case 'admin':
        this.renderAdminPage(main);
        break;
      case 'admin-features':
        this.renderAdminFeaturesPage(main);
        break;
      case 'add-teacher':
        this.renderAddTeacherPage(main);
        break;
      case 'list-teachers':
        this.renderListTeachersPage(main);
        break;
      case 'my-bookings':
        await this.renderMyBookingsPage(main);
        break;
      case 'favorites':
        await this.renderFavoritesPage(main);
        break;
      case 'teacher-detail':
        if (this.currentTeacher) {
          await this.showTeacherDetail(this.currentTeacher.id);
        }
        break;
      case 'home':
      default:
        this.renderHomePage(main);
    }
  }

  async renderAdminPage(main) {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      showAlert('Debes ser administrador para acceder a esta sección', 'error');
      this.currentPage = 'home';
      await this.renderPage();
      return;
    }

    main.innerHTML = `
      <div class="container" style="max-width: 1000px; padding-top: var(--spacing-2xl);">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom: var(--spacing-2xl);">
          <button id="adminBackBtn" class="btn btn-outline" style="padding:6px 10px; font-size:0.95rem;">← Volver</button>
          <h1 style="color: var(--isotipo-dark); margin:0;">Panel de Administración</h1>
        </div>
        <div id="adminContent" style="margin-top:12px;"></div>
      </div>
    `;

    const adminContent = document.getElementById('adminContent');
    const adminBackBtn = document.getElementById('adminBackBtn');
    if (adminBackBtn) {
      adminBackBtn.addEventListener('click', () => {
        this.showPage(this.previousPageBeforeAdmin || 'home');
        this.previousPageBeforeAdmin = null;
      });
    }
    if (!adminContent) return;

    // Solo el super-admin (admin@gmail.com) puede administrar cuentas por ahora
    if (!this.currentUser.email || this.currentUser.email.toLowerCase() !== 'admin@gmail.com') {
      adminContent.innerHTML = `<div class="card" style="padding:16px;">Solo el usuario <strong>admin@gmail.com</strong> puede gestionar cuentas.</div>`;
      return;
    }

    adminContent.innerHTML = `<div id="accountsSection"><p>Cargando cuentas...</p></div>`;

    try {
      const resp = await AdminAPI.listUsers(this.authToken, this.adminPage, this.adminPageSize, this.adminSearch);
      if (!resp || !resp.success) {
        adminContent.innerHTML = `<div class="card" style="padding:16px; color: #b00020;">Error cargando usuarios</div>`;
        return;
      }

      const users = resp.users || [];
      const total = resp.totalCount || 0;
      const page = resp.page || this.adminPage;
      const pageSize = resp.pageSize || this.adminPageSize;

      // Header: search box
      const headerHtml = document.createElement('div');
      headerHtml.style.display = 'flex';
      headerHtml.style.justifyContent = 'space-between';
      headerHtml.style.alignItems = 'center';
      headerHtml.style.marginBottom = '16px';
      headerHtml.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="adminSearchInput" placeholder="Buscar por nombre o email" style="padding:8px 12px; border-radius:8px; border:1px solid #ddd; min-width:320px;" value="${this.adminSearch || ''}" />
          <button id="adminSearchBtn" class="btn btn-primary" style="padding:6px 10px; font-size:0.9rem;">Buscar</button>
        </div>
        <div style="font-size:0.95rem; color:#666;">Mostrando ${Math.min(total, (page - 1) * pageSize + 1)} - ${Math.min(total, page * pageSize)} de ${total}</div>
      `;

      adminContent.innerHTML = '';
      adminContent.appendChild(headerHtml);

      if (users.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'card';
        empty.style.padding = '16px';
        empty.textContent = 'No hay cuentas disponibles';
        adminContent.appendChild(empty);
        return;
      }

      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.innerHTML = `
        <thead>
          <tr style="text-align:left;">
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th style="width:260px;">Acciones</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector('tbody');
      users.forEach(u => {
        const tr = document.createElement('tr');
        tr.style.borderTop = '1px solid #eee';
        tr.style.padding = '8px 0';
        const nameCell = document.createElement('td');
        nameCell.style.padding = '12px 8px';
        const initial = typeof userAvatarInitial === 'function' ? userAvatarInitial(u) : (u.firstName || 'U').charAt(0).toUpperCase();
        const bg = u.color || '#587D71';
        const fg = typeof contrastingAvatarTextColor === 'function' ? contrastingAvatarTextColor(bg) : '#fff';
        const bubble = `<span style="display:inline-block; width:32px; height:32px; border-radius:50%; background:${bg}; color:${fg}; text-align:center; line-height:32px; font-weight:700; margin-right:8px;">${initial}</span>`;
        nameCell.innerHTML = `${bubble} ${u.firstName} ${u.lastName}`;

        const emailCell = document.createElement('td');
        emailCell.style.padding = '12px 8px';
        emailCell.textContent = u.email;

        const roleCell = document.createElement('td');
        roleCell.style.padding = '12px 8px';
        roleCell.textContent = u.role;

        const actionsCell = document.createElement('td');
        actionsCell.style.padding = '12px 8px';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'admin-action-btn';
        toggleBtn.textContent = u.role === 'admin' ? 'Quitar admin' : 'Promover admin';
        toggleBtn.style.background = 'transparent';
        toggleBtn.style.border = '1px solid #587D71';
        toggleBtn.style.color = '#274580';
        toggleBtn.addEventListener('click', async () => {
          try {
            const targetRole = u.role === 'admin' ? 'user' : 'admin';
            const r = await AdminAPI.updateUserRole(this.authToken, u.id, targetRole);
            if (r && r.success) {
              showAlert('Rol actualizado', 'success');
              this.renderAdminPage(main);
            } else {
              showAlert((r && r.message) || 'No se pudo actualizar rol', 'error');
            }
          } catch (err) {
            console.error('Error actualizando rol:', err);
            showAlert('Error actualizando rol', 'error');
          }
        });

        const pwBtn = document.createElement('button');
        pwBtn.className = 'admin-action-btn';
        pwBtn.style.marginLeft = '8px';
        pwBtn.style.background = '#274580';
        pwBtn.style.color = 'white';
        pwBtn.textContent = 'Cambiar contraseña';
        pwBtn.addEventListener('click', () => {
          this.showAdminSetPasswordModal(u);
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'admin-action-btn';
        delBtn.style.marginLeft = '8px';
        delBtn.style.background = '#d9534f';
        delBtn.style.color = 'white';
        delBtn.textContent = 'Borrar cuenta';
        delBtn.addEventListener('click', () => {
          this.showAdminDeleteConfirmation(u);
        });

        actionsCell.appendChild(toggleBtn);
        actionsCell.appendChild(pwBtn);
        actionsCell.appendChild(delBtn);

        tr.appendChild(nameCell);
        tr.appendChild(emailCell);
        tr.appendChild(roleCell);
        tr.appendChild(actionsCell);
        tbody.appendChild(tr);
      });

      adminContent.appendChild(table);

      // Pagination controls
      const pages = Math.ceil(total / pageSize);
      const pager = document.createElement('div');
      pager.style.display = 'flex';
      pager.style.justifyContent = 'center';
      pager.style.alignItems = 'center';
      pager.style.gap = '8px';
      pager.style.marginTop = '16px';

      const prev = document.createElement('button');
      prev.className = 'btn btn-outline';
      prev.textContent = '← Anterior';
      prev.style.padding = '6px 10px';
      prev.style.fontSize = '0.95rem';
      prev.disabled = page <= 1;
      prev.addEventListener('click', () => { this.adminPage = Math.max(1, page - 1); this.renderAdminPage(main); });

      const next = document.createElement('button');
      next.className = 'btn btn-outline';
      next.textContent = 'Siguiente →';
      next.style.padding = '6px 10px';
      next.style.fontSize = '0.95rem';
      next.disabled = page >= pages;
      next.addEventListener('click', () => { this.adminPage = Math.min(pages, page + 1); this.renderAdminPage(main); });

      pager.appendChild(prev);
      pager.appendChild(document.createElement('span')).textContent = ` Página ${page} de ${pages} `;
      pager.appendChild(next);
      adminContent.appendChild(pager);

      // Search bindings
      const searchInput = document.getElementById('adminSearchInput');
      const searchBtn = document.getElementById('adminSearchBtn');
      if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
          this.adminSearch = searchInput.value.trim();
          this.adminPage = 1;
          this.renderAdminPage(main);
        });
        searchInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { searchBtn.click(); } });
      }
    } catch (err) {
      console.error('Error en renderAdminPage:', err);
      adminContent.innerHTML = `<div class="card" style="padding:16px; color:#b00020;">Error cargando panel de administración</div>`;
    }
  }

  async renderAdminFeaturesPage(main) {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      showAlert('Debes ser administrador para acceder a esta sección', 'error');
      this.currentPage = 'home';
      await this.renderPage();
      return;
    }

    this.currentFeatureType = 'subject';

    main.innerHTML = `
      <div class="container" style="max-width: 1100px; padding-top: var(--spacing-2xl);">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom: var(--spacing-2xl);">
          <button id="adminBackBtn" class="btn btn-outline" style="padding:6px 10px; font-size:0.95rem;">← Volver</button>
          <h1 style="color: var(--isotipo-dark); margin:0;">Modificar Características</h1>
        </div>
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap;">
          <button id="featTabSubjects" class="btn btn-outline">📚 Materias</button>
          <div style="flex:1"></div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input id="newCategoryInput" placeholder="Nueva categoría" style="padding:8px 12px; border-radius:8px; border:1px solid #ddd; min-width:220px;" />
            <button id="createCategoryBtn" class="btn btn-primary">Crear categoría</button>
          </div>
        </div>

        <div id="featuresContent"></div>
      </div>
    `;

    const adminBackBtn = document.getElementById('adminBackBtn');
    if (adminBackBtn) adminBackBtn.addEventListener('click', () => { this.showPage(this.previousPageBeforeAdmin || 'home'); this.previousPageBeforeAdmin = null; });

    const tabSubj = document.getElementById('featTabSubjects');
    const newCatInput = document.getElementById('newCategoryInput');
    const createCatBtn = document.getElementById('createCategoryBtn');
    const EMOJI_CATALOG = [
      '📘','📗','📙','📕','📚','📝','✏️','📐','🧮','🔬','🧪','⚗️','⚛️','🌍','🗺️','🏛️',
      '💻','⌨️','🖥️','🧠','🤖','📊','📈','📉','💼','⚖️','🏦','🗣️','🇬🇧','🇫🇷','🇩🇪','🇮🇹',
      '🇵🇹','🇯🇵','🇨🇳','🎨','🎭','🎵','🎬','📷','🧵','🧬','🌱','🔧','⚙️','🛠️','🔋','💡',
      '🚀','🛰️','☀️','🌙','⭐','🔥','💧','🌿','🍎','🧲','🧱','🏫','🎓','📌','✅','🔍',
      '🗂️','📎','📒','📔','📓','📰','🧾','📤','📥','🧭','🧊','⏱️','🕒','🟦','🟩','🟨'
    ];

    const createEmojiPickerButton = (targetInput) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-action-btn';
      btn.textContent = '😀 Emojis';
      btn.style.marginLeft = '0';
      btn.addEventListener('click', () => {
        const existing = document.querySelector('.emoji-picker-popover');
        if (existing) existing.remove();
        const pop = document.createElement('div');
        pop.className = 'emoji-picker-popover';
        pop.style.position = 'absolute';
        pop.style.background = '#fff';
        pop.style.border = '1px solid #ddd';
        pop.style.borderRadius = '10px';
        pop.style.padding = '8px';
        pop.style.maxWidth = '320px';
        pop.style.maxHeight = '180px';
        pop.style.overflowY = 'auto';
        pop.style.display = 'grid';
        pop.style.gridTemplateColumns = 'repeat(8, 1fr)';
        pop.style.gap = '4px';
        pop.style.zIndex = '3000';

        EMOJI_CATALOG.forEach((emoji) => {
          const eBtn = document.createElement('button');
          eBtn.type = 'button';
          eBtn.textContent = emoji;
          eBtn.style.padding = '4px';
          eBtn.style.border = '1px solid #eee';
          eBtn.style.borderRadius = '6px';
          eBtn.style.background = '#fafafa';
          eBtn.addEventListener('click', () => {
            targetInput.value = emoji;
            pop.remove();
          });
          pop.appendChild(eBtn);
        });

        const rect = btn.getBoundingClientRect();
        pop.style.left = `${rect.left + window.scrollX}px`;
        pop.style.top = `${rect.bottom + window.scrollY + 6}px`;
        document.body.appendChild(pop);
        setTimeout(() => {
          const close = (ev) => {
            if (!pop.contains(ev.target) && ev.target !== btn) {
              pop.remove();
              document.removeEventListener('click', close);
            }
          };
          document.addEventListener('click', close);
        }, 0);
      });
      return btn;
    };

    const loadAndRender = async () => {
      const resp = await AdminAPI.listFeatures(this.authToken, this.currentFeatureType);
      const container = document.getElementById('featuresContent');
      container.innerHTML = '';
      if (!resp || !resp.success) { container.innerHTML = '<div class="card" style="padding:16px">Error cargando características</div>'; return; }

      const categories = resp.categories || [];
      const listWrap = document.createElement('div');
      listWrap.className = 'features-grid';
      listWrap.style.display = 'flex';
      listWrap.style.flexWrap = 'wrap';
      listWrap.style.gap = '12px';

      categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.style.background = 'white';
        card.style.border = '1px solid #eee';
        card.style.borderRadius = '8px';
        card.style.padding = '12px';
        card.style.minWidth = '260px';
        card.style.flex = '1 1 280px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.innerHTML = `<strong>${cat.name}</strong>`;

        const headerBtns = document.createElement('div');
        const editBtn = document.createElement('button'); editBtn.className = 'admin-action-btn'; editBtn.textContent = 'Editar';
        const delBtn = document.createElement('button'); delBtn.className = 'admin-action-btn'; delBtn.textContent = 'Borrar'; delBtn.style.background = '#d9534f'; delBtn.style.color = 'white';
        headerBtns.appendChild(editBtn); headerBtns.appendChild(delBtn);
        header.appendChild(headerBtns);

        editBtn.addEventListener('click', async () => {
          const nv = prompt('Nuevo nombre de la categoría', cat.name);
          if (nv && nv.trim()) {
            const r = await AdminAPI.updateFeatureCategory(this.authToken, cat.id, nv.trim());
            if (r && r.success) { showAlert('Categoría actualizada', 'success'); await this.loadSubjectGroups(); loadAndRender(); } else showAlert(r && r.message ? r.message : 'Error', 'error');
          }
        });
        delBtn.addEventListener('click', async () => {
          this.showConfirmModal(
            `¿Eliminar categoría "${cat.name}" y todas sus materias?`,
            async () => {
              const r = await AdminAPI.deleteFeatureCategory(this.authToken, cat.id);
              if (r && r.success) { showAlert('Categoría eliminada', 'success'); await this.loadSubjectGroups(); loadAndRender(); } else showAlert(r && r.message ? r.message : 'Error', 'error');
            },
            'Eliminar'
          );
        });

        card.appendChild(header);

        const itemsWrap = document.createElement('div');
        itemsWrap.style.marginTop = '8px';
        (cat.items || []).forEach(it => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.flexWrap = 'wrap';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.gap = '8px';
          row.style.padding = '6px 0';
          row.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
              <span>${it.icon || '📘'}</span>
              <span>${it.name}</span>
            </div>
          `;
          const btns = document.createElement('div');
          const editItem = document.createElement('button'); editItem.className = 'admin-action-btn'; editItem.textContent = 'Editar';
          const delItem = document.createElement('button'); delItem.className = 'admin-action-btn'; delItem.textContent = 'Borrar'; delItem.style.background = '#d9534f'; delItem.style.color = 'white';
          btns.appendChild(editItem); btns.appendChild(delItem);
          row.appendChild(btns);
          editItem.addEventListener('click', async () => {
            row.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:8px; flex:1; min-width:260px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:12px; color:#666; min-width:58px;">Nombre</span>
                  <input class="edit-subject-name" value="${it.name}" style="flex:1; min-width:220px; padding:6px 8px; border:1px solid #ddd; border-radius:6px;" />
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:12px; color:#666; min-width:58px;">Emoji</span>
                  <input class="edit-subject-icon" value="${it.icon || '📘'}" maxlength="3" style="width:70px; padding:6px 8px; border:1px solid #ddd; border-radius:6px;" />
                  <span class="edit-subject-emoji-picker"></span>
                </div>
              </div>
              <div style="display:flex; gap:6px; align-items:flex-start; flex-wrap:wrap;">
                <button class="admin-action-btn save-edit-item" style="background:#3c8d40; color:white;">Guardar</button>
                <button class="admin-action-btn cancel-edit-item">Cancelar</button>
              </div>
            `;
            const saveBtn = row.querySelector('.save-edit-item');
            const cancelBtn = row.querySelector('.cancel-edit-item');
            const nameInput = row.querySelector('.edit-subject-name');
            const iconInput = row.querySelector('.edit-subject-icon');
            const emojiPickerSlot = row.querySelector('.edit-subject-emoji-picker');
            if (emojiPickerSlot && iconInput) emojiPickerSlot.appendChild(createEmojiPickerButton(iconInput));
            if (saveBtn) {
              saveBtn.addEventListener('click', async () => {
                const newName = (nameInput && nameInput.value ? nameInput.value : '').trim();
                const newIcon = (iconInput && iconInput.value ? iconInput.value : '📘').trim();
                if (!newName) return showAlert('Nombre requerido', 'error');
                const r = await AdminAPI.updateFeatureItem(this.authToken, it.id, { name: newName, categoryId: cat.id, icon: newIcon || '📘' });
                if (r && r.success) { showAlert('Materia actualizada', 'success'); await this.loadSubjectGroups(); loadAndRender(); } else showAlert(r && r.message ? r.message : 'Error', 'error');
              });
            }
            if (cancelBtn) {
              cancelBtn.addEventListener('click', () => loadAndRender());
            }
          });
          delItem.addEventListener('click', async () => {
            this.showConfirmModal(
              `¿Eliminar "${it.name}"?`,
              async () => {
                const r = await AdminAPI.deleteFeatureItem(this.authToken, it.id);
                if (r && r.success) { showAlert('Materia eliminada', 'success'); await this.loadSubjectGroups(); loadAndRender(); } else showAlert(r && r.message ? r.message : 'Error', 'error');
              },
              'Eliminar'
            );
          });
          itemsWrap.appendChild(row);
        });

        // Add new item input
        const addRow = document.createElement('div');
        addRow.style.display = 'flex';
        addRow.style.gap = '8px';
        addRow.style.marginTop = '8px';
        const input = document.createElement('input'); input.placeholder = 'Nueva materia'; input.style.flex = '1'; input.style.padding = '8px 10px'; input.style.border = '1px solid #ddd'; input.style.borderRadius = '6px';
        const iconInput = document.createElement('input'); iconInput.placeholder = '📘'; iconInput.maxLength = 3; iconInput.style.width = '72px'; iconInput.style.padding = '8px 10px'; iconInput.style.border = '1px solid #ddd'; iconInput.style.borderRadius = '6px';
        const emojiPickerBtn = createEmojiPickerButton(iconInput);
        const addBtn = document.createElement('button'); addBtn.className = 'btn btn-primary'; addBtn.textContent = 'Agregar'; addBtn.style.padding = '6px 10px';
        addRow.appendChild(input); addRow.appendChild(iconInput); addRow.appendChild(emojiPickerBtn); addRow.appendChild(addBtn);
        addBtn.addEventListener('click', async () => {
          const val = input.value && input.value.trim();
          if (!val) return showAlert('Nombre requerido', 'error');
          const icon = (iconInput.value || '📘').trim();
          const r = await AdminAPI.createFeatureItem(this.authToken, cat.id, val, icon);
          if (r && r.success) { showAlert('Materia creada', 'success'); input.value = ''; iconInput.value = ''; await this.loadSubjectGroups(); loadAndRender(); } else showAlert(r && r.message ? r.message : 'Error', 'error');
        });

        card.appendChild(itemsWrap);
        card.appendChild(addRow);
        listWrap.appendChild(card);
      });

      container.appendChild(listWrap);
    };

    // Tab buttons
    tabSubj.addEventListener('click', () => { this.currentFeatureType = 'subject'; loadAndRender(); });

    createCatBtn.addEventListener('click', async () => {
      const name = newCatInput.value && newCatInput.value.trim();
      if (!name) return showAlert('Nombre de categoría requerido', 'error');
      const r = await AdminAPI.createFeatureCategory(this.authToken, this.currentFeatureType, name);
      if (r && r.success) { showAlert('Categoría creada', 'success'); newCatInput.value = ''; await this.loadSubjectGroups(); loadAndRender(); } else showAlert(r && r.message ? r.message : 'Error', 'error');
    });

    // Inicial
    loadAndRender();
  }

  showAdminSetPasswordModal(user) {
    // Modal para que el admin setee nueva contraseña para otro usuario
    this.closeAdminSetPasswordModal();
    const overlay = document.createElement('div');
    overlay.id = 'adminSetPwModal';
    overlay.style.position = 'fixed';
    overlay.style.left = '0'; overlay.style.top = '0'; overlay.style.right = '0'; overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center'; overlay.style.zIndex = '9999';

    const container = document.createElement('div');
    container.style.background = 'white'; container.style.padding = '20px'; container.style.borderRadius = '12px'; container.style.width = '420px';
    container.innerHTML = `
      <h3>Cambiar contraseña de ${user.firstName} ${user.lastName}</h3>
      <form id="adminSetPwForm">
        <div class="form-group required" style="display:flex; align-items:center; gap:8px;"><label style="min-width:140px;">Nueva contraseña</label><input id="newPasswordInput" name="newPassword" type="password" required style="flex:1;" /><label style="font-size:0.9rem; margin-left:6px; display:flex; align-items:center; gap:6px;"><input id="showNewPw" type="checkbox" /> Mostrar</label></div>
        <div class="form-group required" style="display:flex; align-items:center; gap:8px;"><label style="min-width:140px;">Confirmar contraseña</label><input id="confirmPasswordInput" name="confirmPassword" type="password" required style="flex:1;" /></div>
        <div style="display:flex; gap:8px; margin-top:12px;"><button type="submit" class="btn btn-primary">Cambiar</button><button type="button" id="cancelAdminSetPw" class="btn btn-outline">Cancelar</button></div>
        <div id="adminSetPwErrors" style="margin-top:12px; color: #b00020;"></div>
      </form>
    `;
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const form = document.getElementById('adminSetPwForm');
    const cancel = document.getElementById('cancelAdminSetPw');
    if (cancel) cancel.addEventListener('click', () => this.closeAdminSetPasswordModal());

    // Toggle to show the new password while typing
    const newPwInputEl = document.getElementById('newPasswordInput');
    const showNewPwEl = document.getElementById('showNewPw');
    if (showNewPwEl && newPwInputEl) {
      showNewPwEl.addEventListener('change', () => {
        newPwInputEl.type = showNewPwEl.checked ? 'text' : 'password';
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const errEl = document.getElementById('adminSetPwErrors');
      errEl.textContent = '';
      if (!data.newPassword || !data.confirmPassword) { errEl.textContent = 'Ambos campos son requeridos'; return; }
      if (data.newPassword !== data.confirmPassword) { errEl.textContent = 'Las contraseñas no coinciden'; return; }
      const pwErrors = checkPasswordStrength(data.newPassword);
      if (pwErrors.length > 0) { errEl.innerHTML = pwErrors.join('<br/>'); return; }

      try {
        const resp = await AdminAPI.setUserPassword(this.authToken, user.id, data.newPassword);
        if (resp && resp.success) {
          showAlert('Contraseña actualizada', 'success');
          this.closeAdminSetPasswordModal();
        } else {
          errEl.textContent = (resp && resp.message) || 'No se pudo cambiar contraseña';
        }
      } catch (err) {
        console.error('Error admin set password:', err);
        errEl.textContent = err && err.message ? err.message : 'Error al cambiar contraseña';
      }
    });
  }

  closeAdminSetPasswordModal() { const m = document.getElementById('adminSetPwModal'); if (m) m.remove(); }

  showConfirmModal(message, onConfirm, confirmText = 'Confirmar') {
    this.closeConfirmModal();
    const overlay = document.createElement('div');
    overlay.id = 'confirmModal';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    const container = document.createElement('div');
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.borderRadius = '12px';
    container.style.width = '420px';
    container.style.maxWidth = '90vw';
    container.innerHTML = `
      <h3 style="margin-bottom: 12px;">Confirmación</h3>
      <p style="margin-bottom: 16px; color: #333;">${message}</p>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <button id="confirmModalCancel" class="btn btn-outline">Cancelar</button>
        <button id="confirmModalOk" class="btn btn-primary" style="background:#d9534f; border-color:#d9534f;">${confirmText}</button>
      </div>
    `;
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const cancelBtn = document.getElementById('confirmModalCancel');
    const okBtn = document.getElementById('confirmModalOk');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeConfirmModal());
    if (okBtn) {
      okBtn.addEventListener('click', async () => {
        try {
          await onConfirm();
        } finally {
          this.closeConfirmModal();
        }
      });
    }
  }

  closeConfirmModal() {
    const m = document.getElementById('confirmModal');
    if (m) m.remove();
  }

  showAdminDeleteConfirmation(user) {
    const main = document.querySelector('main');
    main.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-left">
          <span class="detail-header-back" onclick="window.history.back()">←</span>
          <h1>Confirmar eliminación de cuenta</h1>
        </div>
      </div>

      <div class="container" style="max-width: 600px; padding-top: var(--spacing-2xl); text-align: center;">
        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: var(--spacing-2xl); border-radius: var(--border-radius); margin-bottom: var(--spacing-2xl);">
          <h2 style="color: #8b6914; margin-bottom: var(--spacing-lg);">⚠️ ¿Eliminar cuenta?</h2>
          <p style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-lg); color: #333;">
            Se eliminará permanentemente la cuenta de <strong>${user.firstName} ${user.lastName}</strong> (<em>${user.email}</em>)
          </p>
          <p style="color: #666; margin-bottom: var(--spacing-2xl);">Esta acción no se puede deshacer.</p>

          <div style="display: flex; gap: var(--spacing-lg); justify-content: center;">
            <button onclick="window.history.back()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600; font-size: var(--font-size-sm);">
              Cancelar
            </button>
            <button id="confirmDeleteUserBtn" style="padding: 8px 16px; background: #d9534f; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600; font-size: var(--font-size-sm);">
              Sí, borrar cuenta
            </button>
          </div>
        </div>
      </div>
    `;

    const confirmBtn = document.getElementById('confirmDeleteUserBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        try {
          const res = await AdminAPI.deleteUser(this.authToken, user.id);
          if (res && res.success) {
            showAlert('Cuenta eliminada', 'success');
            setTimeout(() => this.renderAdminPage(document.querySelector('main')), 600);
          } else {
            showAlert((res && res.message) || 'No se pudo eliminar la cuenta', 'error');
          }
        } catch (err) {
          console.error('Error borrando cuenta:', err);
          showAlert('Error al eliminar cuenta', 'error');
        }
      });
    }
  }

  async renderHomePage(main) {
    const flatSubjects = this.getAllSubjectsFlat();
    const featuredSubjects = flatSubjects.slice(0, 5);
    const subjectIconMap = this.getSubjectIconMap();
    const featuredButtons = featuredSubjects.map((subject) => `<button class="category-btn pill-button" data-filter-subject="${subject}">${subjectIconMap.get(subject) || '📘'} ${subject}</button>`).join('');

    main.innerHTML = `
      <!-- Sección de búsqueda -->
      <div class="container-full search-section">
        <div class="container">
          <h2>Encuentra tu profesor ideal</h2>
          <div class="search-box">
            <input 
                type="text" 
                id="searchInput" 
                placeholder="Buscar por nombre..."
                class="search-input"
              />
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Filtros de Modalidad -->
        <section class="filter-panel">
          <h3 class="section-title" style="margin-bottom: var(--spacing-md);">Filtrar por Modalidad</h3>
          <div class="filter-chips">
            <button type="button" class="filter-chip modality-filter-btn" data-filter-modality="virtual">Virtual</button>
            <button type="button" class="filter-chip modality-filter-btn" data-filter-modality="presencial">Presencial</button>
          </div>
        </section>

        <!-- Sección de categorías -->
        <section class="categories-section">
          <h3 class="section-title">Explora por Materia</h3>
          <div class="categories-grid subjects-chip-grid">
            ${featuredButtons}
            <button class="category-btn pill-button" id="verTodasBtn">Ver Todas (${flatSubjects.length})</button>
          </div>
        </section>

        <!-- Botón para agregar profesor -->
        <section style="margin: var(--spacing-2xl) 0; text-align: center;">
          <a href="#add-teacher" class="btn btn-primary pill-button" style="display: inline-block; padding: var(--spacing-lg) var(--spacing-2xl); text-decoration: none; color: white;">
            Agregar un profesor
          </a>
        </section>

        <!-- Sección de recomendaciones -->
        <section class="recommendations-section">
          <h3 class="section-title">Profesores Recomendados</h3>
          <div id="recommendedTeachers" class="teachers-grid">
            <p>Cargando profesores...</p>
          </div>
        </section>

        <!-- Paginación -->
        <div id="pagination" class="pagination"></div>
      </div>
    `;

    // Cargar profesores recomendados (traer todos y paginar aleatoriamente)
    // Ocultar botón "Agregar un profesor" en la home si no es admin
    try {
      const addAnchor = main.querySelector('a[href="#add-teacher"]');
      if (addAnchor) addAnchor.style.display = (this.currentUser && this.currentUser.role === 'admin') ? '' : 'none';
    } catch (e) { /* ignore */ }

    await this.loadRecommendedTeachers();

    // Búsqueda dinámica (debounced) + autocomplete for home
    setTimeout(() => this.setupHomeSearch(), 0);

    // Event listeners para categorías
    document.querySelectorAll('.category-btn').forEach(btn => {
      if (btn.id !== 'verTodasBtn') {
        btn.addEventListener('click', (e) => {
          const subject = btn.dataset.filterSubject;
          const isActive = btn.classList.contains('active');
          if (isActive) {
            // Deselect: quitar marca y mostrar todos
            this.updateCategorySelectionUI(null);
            this.filterBySubject('all');
          } else {
            // Seleccionar esta materia (remover active de otros)
            this.updateCategorySelectionUI(subject);
            this.filterBySubject(subject);
          }
        });
      }
    });

    // Event listener para "Ver Todas" dropdown
    const verTodasBtn = document.getElementById('verTodasBtn');
    // Nuevo comportamiento: expandir/colapsar el grid de materias en el mismo lugar
    verTodasBtn.addEventListener('click', () => {
      const categoriesGrid = document.querySelector('.categories-grid');
      const isExpanded = categoriesGrid.classList.contains('expanded-all-subjects');

      if (!isExpanded) {
        // Construir HTML por categorías (ordenadas)
        const categoriesHtml = this.subjectGroups.map((category) => {
          const subjects = Array.isArray(category.items) ? [...category.items].sort((a, b) => a.name.localeCompare(b.name, 'es')) : [];
          const subjectsBtns = subjects.map((item) => `<button class="category-btn pill-button" data-filter-subject="${item.name}">${item.icon || '📘'} ${item.name}</button>`).join('');
          return `<div class="expanded-category" style="margin-bottom: var(--spacing-lg);">
                    <h4 style="margin-bottom: var(--spacing-sm); color: var(--isotipo-dark); font-weight: 800;">${category.name}</h4>
                    <div class="expanded-subjects subject-group-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-sm);">${subjectsBtns}</div>
                  </div>`;
        }).join('');

        categoriesGrid.innerHTML = categoriesHtml + `<div style="margin-top: var(--spacing-md); text-align:center;"><button id="verMenosBtn" class="category-btn pill-button">Ver menos</button></div>`;

        categoriesGrid.classList.add('expanded-all-subjects');

        // Re-agregar listeners a los botones generados
        categoriesGrid.querySelectorAll('.category-btn').forEach(btn => {
          if (btn.id === 'verMenosBtn') return;
          btn.addEventListener('click', (e) => {
            const subject = btn.dataset.filterSubject;
            const isActive = btn.classList.contains('active');
            if (isActive) {
              // Si ya estaba activa, deseleccionar
              this.updateCategorySelectionUI(null);
              this.filterBySubject('all');
            } else {
              this.updateCategorySelectionUI(subject);
              this.filterBySubject(subject);
            }
          });
        });

        // Listener para ver menos
        const verMenosBtn = document.getElementById('verMenosBtn');
        verMenosBtn.addEventListener('click', async (e) => {
          categoriesGrid.classList.remove('expanded-all-subjects');
          await this.renderPage();
        });
      }
    });

    // Event listeners para botones de modalidad
    document.querySelectorAll('.modality-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        this.currentPage_pagination = 1;
        const selectedModalities = Array.from(document.querySelectorAll('.modality-filter-btn.active')).map(b => b.dataset.filterModality);
        this.filters.modalities = selectedModalities;
        this.rebuildHomeTeacherGrid();
      });
    });
  }

  // Aplicar filtros actuales (NO USAR - se quedó obsoleto, usar filterBySubject directamente)
  applyFilters() {
    this.currentPage_pagination = 1;
    // Empezar con todos los profesores
    let filtered = [...this.allTeachers];

    // Filtrar por materia si hay seleccionada
    if (this.filters.subject) {
      filtered = filtered.filter(t => {
        // Asegurar que subjects siempre sea array
        let subjects = t.subjects;
        if (typeof subjects === 'string') {
          subjects = JSON.parse(subjects || '[]');
        }
        // Verificar que subjects sea realmente un array
        if (!Array.isArray(subjects)) {
          return false;
        }
        return subjects.includes(this.filters.subject);
      });
    }

    // Filtrar por modalidad si hay seleccionadas
    if (this.filters.modalities && this.filters.modalities.length > 0) {
      filtered = filtered.filter(t => {
        const modalities = Array.isArray(t.modalities) ? t.modalities : (typeof t.modalities === 'string' ? JSON.parse(t.modalities || '[]') : (t.modality ? [t.modality] : []));
        return Array.isArray(modalities) && modalities.some(m => this.filters.modalities.includes(m));
      });
    }

    this.displayTeachers(filtered);
  }

  filterBySubject(subject) {
    this.currentPage_pagination = 1;
    console.log('Filtrando por materia:', subject);

    this.filters.subject = subject === 'all' || !subject ? null : subject;
    this.rebuildHomeTeacherGrid();
  }

  updateCategorySelectionUI(subject) {
    // Remover 'active' de todos los botones de categoría (excepto Ver Todas)
    document.querySelectorAll('.category-btn').forEach(btn => {
      if (btn.id !== 'verTodasBtn') btn.classList.remove('active');
    });

    // Remover 'active' también de opciones del dropdown
    document.querySelectorAll('.subject-option').forEach(opt => opt.classList.remove('active'));

    if (!subject) return;

    // Agregar 'active' al botón que coincida con la materia (si existe en el grid principal)
    let found = false;
    document.querySelectorAll('.category-btn').forEach(btn => {
      if (btn.dataset && btn.dataset.filterSubject === subject) {
        btn.classList.add('active');
        found = true;
      }
    });

    // Si no está en los botones principales, marcar la opción del dropdown
    if (!found) {
      const dropdownBtn = document.querySelector(`.subject-option[data-subject="${subject}"]`);
      if (dropdownBtn) dropdownBtn.classList.add('active');
    }
  }

  async loadRecommendedTeachers() {
    try {
      const result = await TeacherAPI.getAllTeachers();
      const teachersGrid = document.getElementById('recommendedTeachers');

      if (result.data && result.data.length > 0) {
        // Parse subjects and modalities from JSON string to arrays
        this.allTeachers = result.data.map((teacher) => ({
          ...teacher,
          subjects: typeof teacher.subjects === 'string' ? JSON.parse(teacher.subjects) : teacher.subjects,
          modalities: teacher.modalities
            ? typeof teacher.modalities === 'string'
              ? JSON.parse(teacher.modalities)
              : teacher.modalities
            : teacher.modality
              ? [teacher.modality]
              : [],
          schedules: ScheduleUtils.parseSchedulesFromApi(teacher.schedules)
        }));

        // Inicialmente mezclar aleatoriamente la lista para la paginación
        this.shuffleAndDisplay();
      } else {
        teachersGrid.innerHTML = '<p>No hay profesores disponibles</p>';
      }
    } catch (error) {
      console.error('Error cargando profesores:', error);
      const el = document.getElementById('recommendedTeachers');
      if (el) el.innerHTML = '<p>Error al cargar profesores</p>';
    }
  }

  shuffleAndDisplay() {
    // Crear copia y mezclar (Fisher-Yates)
    const arr = Array.isArray(this.allTeachers) ? [...this.allTeachers] : [];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.currentDisplayedTeachers = arr;
    this.currentPage_pagination = 1;
    this.displayTeachers(this.currentDisplayedTeachers);
  }

  /**
   * Home: reconstruye la lista según materia, modalidad (chips), texto en buscador y filtro de horario.
   */
  rebuildHomeTeacherGrid() {
    if (this.currentPage !== 'home') return;
    let filtered = [...(this.allTeachers || [])];

    if (this.filters.subject) {
      filtered = filtered.filter((t) => {
        let subjects = t.subjects;
        if (typeof subjects === 'string') subjects = JSON.parse(subjects || '[]');
        return Array.isArray(subjects) && subjects.includes(this.filters.subject);
      });
    }

    const selectedModalities = Array.from(document.querySelectorAll('.modality-filter-btn.active')).map(
      (b) => b.dataset.filterModality
    );
    if (selectedModalities.length > 0) {
      filtered = filtered.filter((t) => {
        const modalities = Array.isArray(t.modalities)
          ? t.modalities
          : typeof t.modalities === 'string'
            ? JSON.parse(t.modalities || '[]')
            : t.modality
              ? [t.modality]
              : [];
        return Array.isArray(modalities) && modalities.some((m) => selectedModalities.includes(m));
      });
    }

    const qRaw = (document.getElementById('homeSearchInput')?.value || '').trim();
    if (qRaw) {
      filtered = filtered.filter((t) => {
        let subjects = t.subjects;
        if (typeof subjects === 'string') {
          try {
            subjects = JSON.parse(subjects || '[]');
          } catch (_) {
            subjects = [];
          }
        }
        const subjStr = (Array.isArray(subjects) ? subjects : []).join(' ');
        return (
          normalizedIncludes(`${t.firstName} ${t.lastName}`, qRaw) ||
          normalizedIncludes(t.description || '', qRaw) ||
          normalizedIncludes(t.curriculum || '', qRaw) ||
          normalizedIncludes(subjStr, qRaw)
        );
      });
    }

    this.currentPage_pagination = 1;
    this.displayTeachers(filtered);
  }

  attachBarScheduleListeners(pageKind) {
    const apply = document.getElementById('barSchApply');
    const clear = document.getElementById('barSchClear');
    if (!apply || !clear || apply.dataset.barBound === '1') return;
    apply.dataset.barBound = '1';

    apply.addEventListener('click', () => {
      const dowVal = document.getElementById('barSchDow')?.value;
      const t0 = document.getElementById('barSchFrom')?.value;
      const t1 = document.getElementById('barSchTo')?.value;
      if (!t0 || !t1) {
        showAlert('Completá hora desde y hasta', 'error');
        return;
      }
      const fs = ScheduleUtils.timeToMinutes(t0);
      const fe = ScheduleUtils.timeToMinutes(t1);
      if (fs == null || fe == null || fe <= fs) {
        showAlert('La hora hasta debe ser mayor que la hora desde', 'error');
        return;
      }
      if (dowVal === '' || dowVal == null) {
        this.barScheduleFilter = { active: true, anyDay: true, timeStart: t0, timeEnd: t1 };
      } else {
        const dow = parseInt(String(dowVal), 10);
        if (Number.isNaN(dow) || dow < 0 || dow > 6) {
          showAlert('Día inválido', 'error');
          return;
        }
        this.barScheduleFilter = { active: true, anyDay: false, dow, timeStart: t0, timeEnd: t1 };
      }
      if (pageKind === 'home') this.rebuildHomeTeacherGrid();
      else this.refreshListTeachersView();
    });

    clear.addEventListener('click', () => {
      this.barScheduleFilter = null;
      const dowSel = document.getElementById('barSchDow');
      if (dowSel) dowSel.value = '';
      const tFrom = document.getElementById('barSchFrom');
      const tTo = document.getElementById('barSchTo');
      if (tFrom) tFrom.value = '00:00';
      if (tTo) tTo.value = '23:59';
      if (pageKind === 'home') this.rebuildHomeTeacherGrid();
      else this.refreshListTeachersView();
    });

    this.syncBarScheduleUIFromState();
  }

  syncBarScheduleUIFromState() {
    const dowEl = document.getElementById('barSchDow');
    const t0 = document.getElementById('barSchFrom');
    const t1 = document.getElementById('barSchTo');
    if (!dowEl || !this.barScheduleFilter || !this.barScheduleFilter.active) return;
    if (this.barScheduleFilter.anyDay) {
      dowEl.value = '';
    } else {
      dowEl.value = String(this.barScheduleFilter.dow);
    }
    if (t0 && this.barScheduleFilter.timeStart) t0.value = this.barScheduleFilter.timeStart;
    if (t1 && this.barScheduleFilter.timeEnd) t1.value = this.barScheduleFilter.timeEnd;
  }

  displayTeachers(teachers) {
    const grid = document.getElementById('recommendedTeachers');
    grid.innerHTML = '';

    let list = [...(teachers || [])];
    if (this.barScheduleFilter && this.barScheduleFilter.active) {
      const { anyDay, dow, timeStart, timeEnd } = this.barScheduleFilter;
      if (timeStart && timeEnd) {
        const fs = ScheduleUtils.timeToMinutes(timeStart);
        const fe = ScheduleUtils.timeToMinutes(timeEnd);
        if (fs != null && fe != null && fe > fs) {
          if (anyDay) {
            const allDows = [0, 1, 2, 3, 4, 5, 6];
            list = list.filter((t) =>
              ScheduleUtils.teacherMatchesAvailability(t.schedules, allDows, fs, fe)
            );
          } else if (dow !== '' && dow != null) {
            const d = typeof dow === 'number' ? dow : parseInt(String(dow), 10);
            if (!Number.isNaN(d)) {
              list = list.filter((t) =>
                ScheduleUtils.teacherMatchesDowWindow(t.schedules, d, fs, fe)
              );
            }
          }
        }
      }
    }

    this.currentDisplayedTeachers = list;

    if (this.currentDisplayedTeachers.length === 0) {
      grid.innerHTML = '<p>No se encontraron profesores</p>';
      return;
    }

    // Paginar
    const start = (this.currentPage_pagination - 1) * this.teachersPerPage;
    const end = start + this.teachersPerPage;
    const paginatedTeachers = this.currentDisplayedTeachers.slice(start, end);

    paginatedTeachers.forEach(teacher => {
      grid.appendChild(createTeacherCard(teacher, this.filters.subject, this.favoriteTeacherIds));
    });

    // Renderizar paginación
    this.renderPagination(this.currentDisplayedTeachers.length);
  }

  renderPagination(total) {
    const pagination = document.getElementById('pagination');
    const pages = Math.ceil(total / this.teachersPerPage);

    if (pages <= 1) {
      pagination.innerHTML = '';
      return;
    }
    let html = '<button id="firstBtn" class="btn btn-outline">« Primera</button>';
    html += '<button id="prevBtn" class="btn btn-outline">← Anterior</button>';
    html += '<span style="margin: 0 var(--spacing-md);">Página <span id="pageDisplay" style="cursor:pointer; font-weight:700;">' + this.currentPage_pagination + '</span> de ' + pages + '</span>';
    html += '<button id="nextBtn" class="btn btn-outline">Siguiente →</button>';

    pagination.innerHTML = html;

    document.getElementById('firstBtn').addEventListener('click', () => {
      if (this.currentPage_pagination !== 1) {
        this.currentPage_pagination = 1;
        this.displayTeachers(this.currentDisplayedTeachers);
      }
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
      if (this.currentPage_pagination > 1) {
        this.currentPage_pagination--;
        this.displayTeachers(this.currentDisplayedTeachers);
      }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      if (this.currentPage_pagination < pages) {
        this.currentPage_pagination++;
        this.displayTeachers(this.currentDisplayedTeachers);
      }
    });

    // Click para convertir el número de página en input editable
    const pageDisplayEl = document.getElementById('pageDisplay');
    pageDisplayEl.addEventListener('click', (e) => {
      const parent = pageDisplayEl.parentElement;
      const input = document.createElement('input');
      input.type = 'number';
      input.id = 'pageInput';
      input.min = 1;
      input.max = pages;
      input.value = this.currentPage_pagination;
      input.style.width = '60px';
      input.style.textAlign = 'center';

      parent.replaceChild(input, pageDisplayEl);
      input.focus();

      const commit = () => {
        const page = parseInt(input.value);
        if (!isNaN(page) && page >= 1 && page <= pages) {
          this.currentPage_pagination = page;
          this.displayTeachers(this.currentDisplayedTeachers);
        } else {
          // Si inválido, re-renderizar para restaurar el display
          this.renderPagination(total);
        }
      };

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') commit(); });
    });
  }

  filterTeachers(filter) {
    this.currentPage_pagination = 1;

    if (filter === 'all') {
      this.displayTeachers(this.allTeachers);
    } else {
      const filtered = this.allTeachers.filter(t => {
        const modalities = Array.isArray(t.modalities) ? t.modalities : (typeof t.modalities === 'string' ? JSON.parse(t.modalities || '[]') : (t.modality ? [t.modality] : []));
        return Array.isArray(modalities) && modalities.includes(filter);
      });
      this.displayTeachers(filtered);
    }
  }


  filterByModality(modality) {
    this.currentPage_pagination = 1;

    if (!modality) {
      this.displayTeachers(this.allTeachers);
    } else {
      const filtered = this.allTeachers.filter(t => {
        const modalities = Array.isArray(t.modalities) ? t.modalities : (typeof t.modalities === 'string' ? JSON.parse(t.modalities || '[]') : (t.modality ? [t.modality] : []));
        return Array.isArray(modalities) && modalities.includes(modality);
      });
      this.displayTeachers(filtered);
    }
  }

  async searchTeachers(query) {
    this.currentPage_pagination = 1;
    const q = (query || '').trim();

    if (!q) {
      this.shuffleAndDisplay();
      return;
    }

    this.rebuildHomeTeacherGrid();
  }

  /**
   * Listado: combina búsqueda por texto (input) + filtro por calendario/horario si está activo.
   */
  getListTeachersFiltered() {
    const input = document.getElementById('teacherSearchInput');
    const qRaw = (input && input.value ? input.value : '').trim();
    let list = [...(Array.isArray(this.allTeachers) ? this.allTeachers : [])];

    if (qRaw) {
      list = list.filter((t) => {
        const fullName = `${t.firstName} ${t.lastName}`;
        let subjects = t.subjects;
        if (typeof subjects === 'string') {
          try {
            subjects = JSON.parse(subjects || '[]');
          } catch (_) {
            subjects = [];
          }
        }
        const subjectStr = (Array.isArray(subjects) ? subjects : []).join(' ');
        return (
          normalizedIncludes(fullName, qRaw) ||
          normalizedIncludes(subjectStr, qRaw) ||
          normalizedIncludes(t.description || '', qRaw) ||
          normalizedIncludes(t.curriculum || '', qRaw)
        );
      });
    }

    if (this.barScheduleFilter && this.barScheduleFilter.active) {
      const { anyDay, dow, timeStart, timeEnd } = this.barScheduleFilter;
      if (timeStart && timeEnd) {
        const fs = ScheduleUtils.timeToMinutes(timeStart);
        const fe = ScheduleUtils.timeToMinutes(timeEnd);
        if (fs != null && fe != null && fe > fs) {
          if (anyDay) {
            const allDows = [0, 1, 2, 3, 4, 5, 6];
            list = list.filter((t) =>
              ScheduleUtils.teacherMatchesAvailability(t.schedules, allDows, fs, fe)
            );
          } else if (dow !== '' && dow != null) {
            const d = typeof dow === 'number' ? dow : parseInt(String(dow), 10);
            if (!Number.isNaN(d)) {
              list = list.filter((t) =>
                ScheduleUtils.teacherMatchesDowWindow(t.schedules, d, fs, fe)
              );
            }
          }
        }
      }
    }

    return list;
  }

  refreshListTeachersView() {
    this.currentPage_pagination = 1;
    this.displayListTeachers(this.getListTeachersFiltered());
  }

  appendScheduleSlotRow(container, slot) {
    const row = document.createElement('div');
    row.className = 'schedule-slot-row';
    const dow = slot && Number.isFinite(slot.dow) ? slot.dow : 1;
    const start = (slot && slot.start) || '18:00';
    const end = (slot && slot.end) || '20:00';
    const opts = ScheduleUtils.DOW_LABELS_ES.map(
      (label, i) => `<option value="${i}" ${i === dow ? 'selected' : ''}>${label}</option>`
    ).join('');
    row.innerHTML = `
      <div class="schedule-slot-field">
        <label>Día</label>
        <select class="slot-dow form-control">${opts}</select>
      </div>
      <div class="schedule-slot-field">
        <label>Desde</label>
        <input type="time" class="slot-start form-control" value="${start}" />
      </div>
      <div class="schedule-slot-field">
        <label>Hasta</label>
        <input type="time" class="slot-end form-control" value="${end}" />
      </div>
      <button type="button" class="btn btn-outline btn-remove-slot" title="Quitar franja">✕</button>
    `;
    row.querySelector('.btn-remove-slot').addEventListener('click', () => {
      const slotsWrap = container.querySelector('[data-schedule-slots]');
      if (slotsWrap && slotsWrap.querySelectorAll('.schedule-slot-row').length > 1) row.remove();
    });
    const slotsHost = container.querySelector('[data-schedule-slots]');
    if (slotsHost) slotsHost.appendChild(row);
  }

  initScheduleBuilder(rootEl, initialSchedule) {
    if (!rootEl) return;
    const parsed = ScheduleUtils.parseSchedulesFromApi(initialSchedule);
    const sch = ScheduleUtils.canonicalSchedule(parsed);
    const slotsToShow = sch.slots && sch.slots.length ? sch.slots : [{ dow: 1, start: '18:00', end: '20:00' }];

    rootEl.innerHTML = `
      <div class="schedule-builder" data-schedule-builder>
        <p class="schedule-builder-intro">
          Indicá al menos un día con horario de inicio y fin. Podés sumar varias franjas si dictás en distintos momentos.
        </p>
        <div class="schedule-slots-wrap" data-schedule-slots-wrap>
          <div data-schedule-slots class="schedule-slots"></div>
          <button type="button" class="btn btn-outline" data-add-slot>+ Agregar otra franja</button>
        </div>
        <div class="form-group schedule-notes-group">
          <label for="scheduleNotesField">Notas opcionales (ej. feriados, excepciones)</label>
          <input type="text" id="scheduleNotesField" data-schedule-notes maxlength="500" placeholder="Opcional" value="${ScheduleUtils.escapeHtml(sch.notes)}" />
        </div>
      </div>
    `;
    const addBtn = rootEl.querySelector('[data-add-slot]');
    slotsToShow.forEach((sl) => this.appendScheduleSlotRow(rootEl, sl));
    addBtn.addEventListener('click', () => this.appendScheduleSlotRow(rootEl, { dow: 1, start: '18:00', end: '20:00' }));
  }

  collectSchedulePayloadFromBuilder(rootEl) {
    const builder = rootEl && rootEl.querySelector('[data-schedule-builder]');
    if (!builder) return { version: 1, slots: [{ dow: 1, start: '18:00', end: '20:00' }], flexible: false, notes: '' };
    const notesEl = builder.querySelector('[data-schedule-notes]');
    const notes = notesEl && notesEl.value ? notesEl.value.trim().slice(0, 500) : '';
    const slots = [];
    builder.querySelectorAll('.schedule-slot-row').forEach((row) => {
      const dowSel = row.querySelector('.slot-dow');
      const startInp = row.querySelector('.slot-start');
      const endInp = row.querySelector('.slot-end');
      if (!dowSel || !startInp || !endInp) return;
      const dow = parseInt(dowSel.value, 10);
      const start = startInp.value;
      const end = endInp.value;
      if (!Number.isFinite(dow) || dow < 0 || dow > 6) return;
      if (!start || !end) return;
      slots.push({ dow, start, end });
    });
    return { version: 1, slots, flexible: false, notes };
  }

  renderAddTeacherPage(main) {
    main.innerHTML = `
      <div class="container" style="max-width: 1000px; padding-top: var(--spacing-2xl);">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom: var(--spacing-2xl);">
          <button id="adminBackBtn" class="btn btn-outline" style="padding:6px 10px; font-size:0.95rem;">← Volver</button>
          <h1 style="color: var(--isotipo-dark); margin:0;">Agregar Nuevo Profesor</h1>
        </div>

        <div class="form-section">
          <form id="addTeacherForm">
            <!-- Información Personal -->
            <fieldset style="border: none; padding: 0;">
              <legend style="font-size: var(--font-size-lg); font-weight: 700; color: var(--isotipo-dark); margin-bottom: var(--spacing-lg);">Información Personal</legend>

              <div class="form-row">
                <div class="form-group required">
                  <label for="firstName">Nombre</label>
                  <input type="text" id="firstName" name="firstName" required />
                  <div class="form-error"></div>
                </div>

                <div class="form-group required">
                  <label for="lastName">Apellido</label>
                  <input type="text" id="lastName" name="lastName" required />
                  <div class="form-error"></div>
                </div>

                <div class="form-group required">
                  <label for="age">Edad</label>
                  <input type="number" id="age" name="age" min="18" max="100" required />
                  <div class="form-error"></div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group required">
                  <label for="email">Email</label>
                  <input type="email" id="email" name="email" required />
                  <div class="form-error"></div>
                </div>

                <div class="form-group">
                  <label for="phone">Teléfono</label>
                  <input type="tel" id="phone" name="phone" />
                  <div class="form-error"></div>
                </div>

                <div class="form-group">
                  <label for="photo">Foto</label>
                  <div style="display: flex; gap: var(--spacing-lg); align-items: flex-start;">
                    <div>
                      <input type="file" id="photo" name="photo" accept="image/*" />
                      <div class="form-error"></div>
                    </div>
                    <div id="photoPreview" style="display: none; border: 2px solid #ddd; border-radius: 24px; overflow: hidden; background: white;">
                      <img id="photoPreviewImg" src="" alt="Preview" style="max-width: 150px; max-height: 150px; object-fit: cover;" />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <hr style="margin: var(--spacing-lg) 0; border: none; border-top: 1px solid var(--color-gray-medium);">

            <!-- Información Académica -->
            <fieldset style="border: none; padding: 0;">
              <legend style="font-size: var(--font-size-lg); font-weight: 700; color: var(--isotipo-dark); margin-bottom: var(--spacing-lg);">Información Académica</legend>

              <!-- Botón para colapsar/expandir materias -->
              <div style="margin-bottom: var(--spacing-lg);">
                <button type="button" id="toggleSubjects" style="background: #587D71; color: white; border: none; padding: var(--spacing-md) var(--spacing-lg); border-radius: var(--border-radius); cursor: pointer; font-size: var(--font-size-sm); font-weight: 600; display: flex; align-items: center; gap: var(--spacing-sm);">
                  <span id="toggleIcon">▼</span> Seleccionar Materias
                </button>
              </div>

              <div id="subjectsContainer" class="form-group-checkbox" style="display: block;">
                <!-- Se llena dinámicamente -->
              </div>

              <div class="form-group required">
                <label for="description">Descripción del Profesor</label>
                <textarea id="description" name="description" placeholder="Cuéntanos sobre tu experiencia, metodología y cualidades..." required></textarea>
                <div class="form-error"></div>
              </div>

              <div class="form-group required">
                <label for="curriculum">Temario / Currículo</label>
                <textarea id="curriculum" name="curriculum" placeholder="Detalla los temas que cubres..." required></textarea>
                <div class="form-error"></div>
              </div>
            </fieldset>

            <hr style="margin: var(--spacing-lg) 0; border: none; border-top: 1px solid var(--color-gray-medium);">

            <!-- Información de Clases -->
            <fieldset style="border: none; padding: 0;">
              <legend style="font-size: var(--font-size-lg); font-weight: 700; color: var(--isotipo-dark); margin-bottom: var(--spacing-lg);">Información de Clases</legend>

              <div class="form-row">
                <div class="form-group required">
                  <label for="classSize">Cantidad de Alumnos</label>
                  <input type="number" id="classSize" name="classSize" min="1" max="40" required />
                  <div class="form-error"></div>
                </div>
              </div>

              <div class="form-group required modality-field-group">
                <span class="modality-field-label">Modalidad de las clases</span>
                <div class="modality-picker" role="group" aria-label="Modalidad">
                  <label class="modality-option">
                    <input type="checkbox" name="modalities" value="virtual" />
                    <span class="modality-option-text">Virtual</span>
                  </label>
                  <label class="modality-option">
                    <input type="checkbox" name="modalities" value="presencial" />
                    <span class="modality-option-text">Presencial</span>
                  </label>
                </div>
                <div class="form-error"></div>
              </div>

              <div class="form-group required" id="scheduleBuilderHost">
                <label>Franjas horarias en las que dictás clases</label>
                <div id="scheduleBuilderRoot"></div>
                <div class="form-error"></div>
              </div>

              <div class="form-group" id="locationGroup" style="display: none;">
                <label for="location">Ubicación</label>
                <input type="text" id="location" name="location" />
                <div class="form-error"></div>
              </div>
            </fieldset>

            <!-- Botones -->
            <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-xl);">
              <button type="submit" class="btn btn-primary" style="flex: 1;">Crear Profesor</button>
              <button type="reset" class="btn btn-outline" style="flex: 1;">Limpiar</button>
            </div>

            <!-- Advertencias de validación (se muestran debajo de los botones y persisten hasta limpiar o reintentar) -->
            <div id="formWarnings" style="display: none; background: #fff3cd; border: 1px solid #ffc107; border-radius: var(--border-radius); padding: var(--spacing-lg); margin: var(--spacing-lg) 0 0 0; color: #856404;">
              <h4 style="margin-top: 0; color: #856404;">⚠️ Errores en el formulario:</h4>
              <ul id="warningsList" style="margin: var(--spacing-sm) 0; padding-left: var(--spacing-lg);"></ul>
            </div>
          </form>
        </div>
      </div>
    `;

    // Llenar materias dinámicamente
    this.loadSubjectsForForm();

    // Event listeners del formulario
    const form = document.getElementById('addTeacherForm');
    const modalityCheckboxes = document.querySelectorAll('input[name="modalities"]');
    const toggleSubjectsBtn = document.getElementById('toggleSubjects');
    const subjectsContainer = document.getElementById('subjectsContainer');
    const toggleIcon = document.getElementById('toggleIcon');

    // Mostrar/ocultar materias
    toggleSubjectsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isVisible = subjectsContainer.style.display === 'block';
      subjectsContainer.style.display = isVisible ? 'none' : 'block';
      toggleIcon.textContent = isVisible ? '▶' : '▼';
    });

    // Mostrar/ocultar ubicación según modalidades seleccionadas
    modalityCheckboxes.forEach(cb => cb.addEventListener('change', () => {
      const locationGroup = document.getElementById('locationGroup');
      const checked = Array.from(document.querySelectorAll('input[name="modalities"]:checked')).map(c => c.value);
      if (checked.includes('presencial')) {
        locationGroup.style.display = 'block';
        locationGroup.classList.add('required');
        document.getElementById('location').required = true;
      } else {
        locationGroup.style.display = 'none';
        locationGroup.classList.remove('required');
        document.getElementById('location').required = false;
      }
    }));

    // Vista previa de foto
    const photoInput = document.getElementById('photo');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('photoPreview');
        const previewImg = document.getElementById('photoPreviewImg');
        
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            previewImg.src = event.target.result;
            preview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        } else {
          preview.style.display = 'none';
        }
      });
    }

    // Validar antes de enviar
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errors = this.validateAddTeacherForm();
      
      if (errors.length > 0) {
        this.showFormWarnings(errors);
      } else {
        this.handleAddTeacher(e);
      }
    });

    // Ocultar advertencias al resetear el formulario
    form.addEventListener('reset', () => {
      const warningsDiv = document.getElementById('formWarnings');
      const warningsList = document.getElementById('warningsList');
      if (warningsDiv) warningsDiv.style.display = 'none';
      if (warningsList) warningsList.innerHTML = '';
      // Limpiar errores visuales de campos
      clearFormErrors('addTeacherForm');
      setTimeout(() => {
        this.initScheduleBuilder(document.getElementById('scheduleBuilderRoot'), null);
      }, 0);
    });

    // Botón volver en páginas admin
    const adminBackBtn = document.getElementById('adminBackBtn');
    if (adminBackBtn) {
      adminBackBtn.addEventListener('click', () => {
        this.showPage(this.previousPageBeforeAdmin || 'home');
        this.previousPageBeforeAdmin = null;
      });
    }

    setTimeout(() => {
      this.initScheduleBuilder(document.getElementById('scheduleBuilderRoot'), null);
    }, 0);
  }

  validateAddTeacherForm() {
    const errors = [];
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const age = parseInt(document.getElementById('age').value);
    const email = document.getElementById('email').value.trim();
    const subject_checkboxes = document.querySelectorAll('input[name="subjects"]:checked');
    const description = document.getElementById('description').value.trim();
    const curriculum = document.getElementById('curriculum').value.trim();
    const classSize = parseInt(document.getElementById('classSize').value);
    const modalities = Array.from(document.querySelectorAll('input[name="modalities"]:checked')).map(cb => cb.value);
    const location = document.getElementById('location').value.trim();

    if (!firstName) errors.push('El nombre es requerido');
    if (!lastName) errors.push('El apellido es requerido');
    if (isNaN(age) || age < 1 || age > 149) errors.push('La edad debe estar entre 1 y 149 años');
    if (!email || !validateEmail(email)) errors.push('El mail no cumple el formato adecuado');
    if (subject_checkboxes.length === 0) errors.push('Debes seleccionar al menos una materia');
    if (!description) errors.push('La descripción del profesor es requerida');
    if (!curriculum) errors.push('El temario/currículo es requerido');
    if (isNaN(classSize) || classSize < 1 || classSize > 40) errors.push('La cantidad de alumnos debe estar entre 1 y 40');
    if (Array.isArray(modalities) && modalities.length === 0) errors.push('La modalidad es requerida');

    const schPayload = this.collectSchedulePayloadFromBuilder(document.getElementById('scheduleBuilderRoot'));
    if (!schPayload.slots || schPayload.slots.length === 0) {
      errors.push('Agregá al menos una franja con día y horario');
    }
    if (schPayload.slots && schPayload.slots.length) {
      for (const sl of schPayload.slots) {
        const a = ScheduleUtils.timeToMinutes(sl.start);
        const b = ScheduleUtils.timeToMinutes(sl.end);
        if (a == null || b == null || b <= a) {
          errors.push('En cada franja, la hora hasta debe ser mayor que la hora desde');
          break;
        }
      }
    }

    if (Array.isArray(modalities) && modalities.includes('presencial') && !location) errors.push('La ubicación es requerida para clases presenciales');

    return errors;
  }

  showFormWarnings(errors) {
    const warningsDiv = document.getElementById('formWarnings');
    const warningsList = document.getElementById('warningsList');
    
    warningsList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
    warningsDiv.style.display = 'block';
    // No cambiar el scroll automáticamente; el mensaje permanece visible justo debajo del formulario.
  }

  async loadSubjectsForForm() {
    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';
    
    for (const category of this.subjectGroups) {
      const categoryDiv = document.createElement('div');
      categoryDiv.style.marginBottom = 'var(--spacing-lg)';

      const categoryTitle = document.createElement('h4');
      categoryTitle.textContent = category.name;
      categoryTitle.style.color = 'var(--isotipo-dark)';
      categoryTitle.style.marginBottom = 'var(--spacing-sm)';
      categoryDiv.appendChild(categoryTitle);

      const subjectsDiv = document.createElement('div');
      subjectsDiv.style.display = 'grid';
      subjectsDiv.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
      subjectsDiv.style.gap = 'var(--spacing-md)';

      (category.items || []).forEach((subjectItem) => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.style.cursor = 'pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'subjects';
        checkbox.value = subjectItem.name;

        const labelText = document.createElement('span');
        labelText.style.margin = '0';
        labelText.style.fontWeight = '400';
        labelText.textContent = `${subjectItem.icon || '📘'} ${subjectItem.name}`;

        label.appendChild(checkbox);
        label.appendChild(labelText);
        subjectsDiv.appendChild(label);
      });

      categoryDiv.appendChild(subjectsDiv);
      container.appendChild(categoryDiv);
    }
  }

  async handleAddTeacher(e) {
    e.preventDefault();
    clearFormErrors('addTeacherForm');

    // Obtener foto como base64 si existe
    let photoBase64 = null;
    const photoFile = document.getElementById('photo').files[0];
    if (photoFile) {
      photoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(photoFile);
      });
    }

    const formData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      age: parseInt(document.getElementById('age').value),
      email: document.getElementById('email').value.trim().toLowerCase(),
      phone: document.getElementById('phone').value.trim() || null,
      description: document.getElementById('description').value.trim(),
      curriculum: document.getElementById('curriculum').value.trim(),
      classSize: parseInt(document.getElementById('classSize').value),
      modalities: Array.from(document.querySelectorAll('input[name="modalities"]:checked')).map(cb => cb.value),
      schedules: this.collectSchedulePayloadFromBuilder(document.getElementById('scheduleBuilderRoot')),
      location: document.getElementById('location').value.trim() || null,
      photo: photoBase64,
      subjects: Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(cb => cb.value)
    };

    // Validaciones locales
    let hasErrors = false;
    const errors = [];

    if (!formData.firstName) {
      errors.push('El nombre es requerido');
      setFieldError('firstName', 'Nombre requerido');
      hasErrors = true;
    }

    if (!formData.lastName) {
      errors.push('El apellido es requerido');
      setFieldError('lastName', 'Apellido requerido');
      hasErrors = true;
    }

    if (!validateAge(formData.age)) {
      errors.push('La edad debe ser un número entre 18 y 100');
      setFieldError('age', 'Edad debe estar entre 18 y 100');
      hasErrors = true;
    }

    if (!validateEmail(formData.email)) {
      errors.push('El mail no cumple el formato adecuado');
      setFieldError('email', 'Email inválido');
      hasErrors = true;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      errors.push('El teléfono no cumple el formato adecuado');
      setFieldError('phone', 'Teléfono inválido');
      hasErrors = true;
    }

    if (!validateClassSize(formData.classSize)) {
      errors.push('La cantidad de alumnos debe ser un número entre 1 y 40');
      setFieldError('classSize', 'Cantidad debe estar entre 1 y 40');
      hasErrors = true;
    }

    if (formData.subjects.length === 0) {
      errors.push('Debes seleccionar al menos una materia');
      setFieldError('subjects', 'Selecciona al menos una materia');
      hasErrors = true;
    }

    if (!formData.description) {
      errors.push('La descripción no puede quedar vacía');
      setFieldError('description', 'Descripción requerida');
      hasErrors = true;
    }

    if (!formData.curriculum) {
      errors.push('El temario/currículo es obligatorio');
      setFieldError('curriculum', 'Temario requerido');
      hasErrors = true;
    }

    if (!formData.modalities || formData.modalities.length === 0) {
      errors.push('Debes seleccionar al menos una modalidad de clase');
      setFieldError('modalities', 'Selecciona una modalidad');
      hasErrors = true;
    }

    const schFromForm = this.collectSchedulePayloadFromBuilder(document.getElementById('scheduleBuilderRoot'));
    if (!schFromForm.slots || schFromForm.slots.length === 0) {
      errors.push('Agregá al menos una franja con día y horario');
      hasErrors = true;
    }
    if (schFromForm.slots && schFromForm.slots.length) {
      for (const sl of schFromForm.slots) {
        const a = ScheduleUtils.timeToMinutes(sl.start);
        const b = ScheduleUtils.timeToMinutes(sl.end);
        if (a == null || b == null || b <= a) {
          errors.push('En cada franja, la hora hasta debe ser mayor que la hora desde');
          hasErrors = true;
          break;
        }
      }
    }

    if (Array.isArray(formData.modalities) && formData.modalities.includes('presencial') && !formData.location) {
      setFieldError('location', 'Ubicación requerida para clases presenciales');
      hasErrors = true;
    }

    if (hasErrors) {
      this.showFormWarnings(errors);
      return;
    }

    try {
      const result = await TeacherAPI.createTeacher(formData);
      
      if (result.success) {
        showAlert('Profesor creado exitosamente', 'success');
        clearForm('addTeacherForm');
        setTimeout(() => this.navigateToHome(), 1500);
      }
    } catch (error) {
      console.error('Error:', error);
      // Si el servidor devolvió detalles de validación, mostrarlos en el área de advertencias
      const warningsDiv = document.getElementById('formWarnings');
      const warningsList = document.getElementById('warningsList');

      if (error.details && typeof error.details === 'object') {
        const warnings = Object.values(error.details);
        // Marcar campos con errores si existen
        Object.entries(error.details).forEach(([field, msg]) => {
          try { setFieldError(field, msg); } catch (e) { /* ignore */ }
        });

        if (warningsDiv && warningsList) {
          warningsList.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
          warningsDiv.style.display = 'block';
        }
        return;
      }

      // Si hay mensaje simple del servidor, mostrarlo en warningsDiv
      if (error.message) {
        if (warningsDiv && warningsList) {
          warningsList.innerHTML = `<li>${error.message}</li>`;
          warningsDiv.style.display = 'block';
          return;
        }
      }

      showAlert('Error al crear profesor', 'error');
    }
  }

  renderListTeachersPage(main) {
    main.innerHTML = `
      <div class="container" style="padding-top: var(--spacing-2xl);">
        <h1 style="color: var(--isotipo-dark); margin-bottom: var(--spacing-md);">Listado de Profesores</h1>

        <div class="search-bar-row">
          <div class="search-bar-search">
            <div class="search-pill">
              <input id="teacherSearchInput" placeholder="Buscar por nombre o materia" autocomplete="off" />
              <button id="teacherSearchBtn" title="Buscar">🔍</button>
            </div>
            <div id="searchSuggestions" class="search-suggestions" style="display:none;"></div>
          </div>
          ${ScheduleUtils.inlineScheduleFilterMarkup()}
        </div>

        <div id="teachersList" class="teachers-grid">
          <p>Cargando profesores...</p>
        </div>

        <div id="listPagination" class="pagination"></div>
      </div>
    `;

    this.loadAllTeachers();
    setTimeout(() => {
      this.setupListSearch();
      this.attachBarScheduleListeners('list');
    }, 0);
  }

  setupListSearch() {
    const input = document.getElementById('teacherSearchInput');
    const btn = document.getElementById('teacherSearchBtn');
    let suggestions = document.getElementById('searchSuggestions');

    if (!input || !btn || !suggestions) return;

    // If the suggestions element exists but isn't a child of the pill, move it
    if (suggestions.parentElement !== input.parentElement) {
      input.parentElement.appendChild(suggestions);
      suggestions = document.getElementById('searchSuggestions');
    }

    const handleInput = debounce(async (e) => {
      const q = (e.target.value || '').trim();
      if (!q) {
        suggestions.style.display = 'none';
        return;
      }

      const items = this.getSearchSuggestions(q, 8);
      this.showSearchSuggestions(items, q);
    }, 250);

    input.addEventListener('input', handleInput);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = (input.value || '').trim();
        this.performListSearch(q);
      }
    });

    btn.addEventListener('click', () => {
      const q = (input.value || '').trim();
      this.performListSearch(q);
    });
  }

  setupHomeSearch() {
    const existing = document.getElementById('searchInput');
    if (!existing) return;

    const searchBox = existing.parentElement;
    if (!searchBox) return;

    const row = document.createElement('div');
    row.className = 'search-bar-row';

    const searchCol = document.createElement('div');
    searchCol.className = 'search-bar-search';

    const wrapper = document.createElement('div');
    wrapper.className = 'search-pill';

    const input = document.createElement('input');
    input.id = 'homeSearchInput';
    input.placeholder = existing.placeholder || 'Buscar por nombre o materia…';
    input.autocomplete = 'off';
    wrapper.appendChild(input);

    const btn = document.createElement('button');
    btn.id = 'homeSearchBtn';
    btn.title = 'Buscar';
    btn.textContent = '🔍';
    wrapper.appendChild(btn);

    const suggestions = document.createElement('div');
    suggestions.id = 'homeSearchSuggestions';
    suggestions.className = 'search-suggestions';
    suggestions.style.display = 'none';
    wrapper.appendChild(suggestions);

    searchCol.appendChild(wrapper);
    row.appendChild(searchCol);

    const filterWrap = document.createElement('div');
    filterWrap.innerHTML = ScheduleUtils.inlineScheduleFilterMarkup().trim();
    row.appendChild(filterWrap.firstElementChild);

    searchBox.innerHTML = '';
    searchBox.appendChild(row);

    const debounced = debounce((e) => {
      const q = (e.target.value || '').trim();
      if (!q) {
        suggestions.style.display = 'none';
        return;
      }
      const items = this.getSearchSuggestions(q, 8);
      this.showHomeSearchSuggestions(items, q);
    }, 250);

    input.addEventListener('input', debounced);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        suggestions.style.display = 'none';
        this.rebuildHomeTeacherGrid();
      }
    });

    btn.addEventListener('click', () => {
      suggestions.style.display = 'none';
      this.rebuildHomeTeacherGrid();
    });

    this.attachBarScheduleListeners('home');
  }

  showHomeSearchSuggestions(items, query) {
    const container = document.getElementById('homeSearchSuggestions');
    if (!container) return;
    const input = document.getElementById('homeSearchInput');

    this.renderSearchSuggestions(container, items, query, (item) => {
      if (input) input.value = item.value || item.label;
      container.style.display = 'none';
      this.rebuildHomeTeacherGrid();
    });
  }

  getSearchSuggestions(query, limit = 6) {
    const rawQuery = String(query || '').trim();
    const qn = normalizeSearchText(rawQuery);
    if (!qn) return [];

    const suggestions = [];
    const seen = new Set();
    const typeRank = { query: 0, teacher: 1, subject: 2 };

    const addSuggestion = (label, value, type, score) => {
      const key = `${type}|${normalizeSearchText(String(label || ''))}`;
      if (seen.has(key)) return;
      suggestions.push({ label, value, type, score });
      seen.add(key);
    };

    addSuggestion(`Buscar "${rawQuery}"`, rawQuery, 'query', 0);
    addSuggestion(`Buscar profesores de "${rawQuery}"`, rawQuery, 'query', 1);

    if (Array.isArray(this.allTeachers)) {
      for (const t of this.allTeachers) {
        const fullName = `${t.firstName} ${t.lastName}`.trim();
        const fullNameNorm = normalizeSearchText(fullName);
        if (fullNameNorm.includes(qn)) {
          addSuggestion(fullName, fullName, 'teacher', fullNameNorm.startsWith(qn) ? 1 : 2);
        }

        const subjects = Array.isArray(t.subjects)
          ? t.subjects
          : (() => {
              if (typeof t.subjects !== 'string') return [];
              try {
                return JSON.parse(t.subjects || '[]');
              } catch (_) {
                return [];
              }
            })();
        (subjects || []).forEach((subject) => {
          const subjectLabel = String(subject || '').trim();
          if (!subjectLabel) return;
          const subjectNorm = normalizeSearchText(subjectLabel);
          if (subjectNorm.includes(qn)) {
            addSuggestion(subjectLabel, subjectLabel, 'subject', subjectNorm.startsWith(qn) ? 1 : 2);
          }
        });
      }
    }

    suggestions.sort((a, b) => {
      const scoreDiff = a.score - b.score;
      if (scoreDiff !== 0) return scoreDiff;
      const typeDiff = typeRank[a.type] - typeRank[b.type];
      if (typeDiff !== 0) return typeDiff;
      return String(a.label || '').localeCompare(String(b.label || ''), 'es');
    });

    return suggestions.slice(0, limit).map(({ score, ...rest }) => rest);
  }

  renderSearchSuggestions(container, items, query, onSelect) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    const qRaw = String(query || '').trim();

    items.forEach((item) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'search-suggestion';

      const text = document.createElement('span');
      text.className = 'search-suggestion-text';
      this.applySuggestionHighlight(text, item.label, qRaw);

      const meta = document.createElement('span');
      meta.className = 'search-suggestion-meta';
      meta.textContent = this.getSuggestionMetaLabel(item.type);

      row.appendChild(text);
      row.appendChild(meta);

      row.addEventListener('click', () => {
        if (typeof onSelect === 'function') onSelect(item);
      });

      container.appendChild(row);
    });
  }

  applySuggestionHighlight(container, label, queryRaw) {
    const text = String(label || '');
    const raw = String(queryRaw || '').trim();
    if (!raw) {
      container.textContent = text;
      return;
    }

    const range = accentInsensitiveMatchRange(text, raw);
    if (range) {
      const [i, k] = range;
      container.textContent = '';
      container.appendChild(document.createTextNode(text.slice(0, i)));
      const mark = document.createElement('span');
      mark.className = 'suggestion-highlight';
      mark.textContent = text.slice(i, k);
      container.appendChild(mark);
      container.appendChild(document.createTextNode(text.slice(k)));
      return;
    }

    const lower = text.toLowerCase();
    const qLower = raw.toLowerCase();
    const index = lower.indexOf(qLower);
    if (index === -1) {
      container.textContent = text;
      return;
    }

    container.textContent = '';
    container.appendChild(document.createTextNode(text.slice(0, index)));
    const mark = document.createElement('span');
    mark.className = 'suggestion-highlight';
    mark.textContent = text.slice(index, index + qLower.length);
    container.appendChild(mark);
    container.appendChild(document.createTextNode(text.slice(index + qLower.length)));
  }

  getSuggestionMetaLabel(type) {
    if (type === 'teacher') return 'Profesor';
    if (type === 'subject') return 'Materia';
    return 'Busqueda';
  }

  showSearchSuggestions(items, query) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;
    const input = document.getElementById('teacherSearchInput');

    this.renderSearchSuggestions(container, items, query, (item) => {
      if (input) input.value = item.value || item.label;
      const q = (item.value || item.label || '').trim();
      this.performListSearch(q);
      container.style.display = 'none';
    });
  }

  performListSearch(query) {
    const input = document.getElementById('teacherSearchInput');
    if (typeof query === 'string' && input) {
      input.value = query;
    }
    this.currentPage_pagination = 1;
    this.displayListTeachers(this.getListTeachersFiltered());
    const s = document.getElementById('searchSuggestions');
    if (s) s.style.display = 'none';
  }

  async loadAllTeachers() {
    try {
      const result = await TeacherAPI.getAllTeachers();
      
      if (result.data && result.data.length > 0) {
        // Parse subjects, modalities y horarios estructurados
        this.allTeachers = result.data.map((teacher) => ({
          ...teacher,
          subjects: typeof teacher.subjects === 'string' ? JSON.parse(teacher.subjects) : teacher.subjects,
          modalities: teacher.modalities
            ? typeof teacher.modalities === 'string'
              ? JSON.parse(teacher.modalities)
              : teacher.modalities
            : teacher.modality
              ? [teacher.modality]
              : [],
          schedules: ScheduleUtils.parseSchedulesFromApi(teacher.schedules)
        }));
        this.refreshListTeachersView();
      } else {
        document.getElementById('teachersList').innerHTML = '<p>No hay profesores registrados</p>';
      }
    } catch (error) {
      console.error('Error:', error);
      document.getElementById('teachersList').innerHTML = '<p>Error al cargar profesores</p>';
    }
  }

  displayListTeachers(teachers) {
    const grid = document.getElementById('teachersList');
    grid.innerHTML = '';

    // Guardar la lista actual (para paginación en esta vista)
    this.currentDisplayedTeachers = teachers || [];

    if (this.currentDisplayedTeachers.length === 0) {
      grid.innerHTML = '<p>No se encontraron profesores</p>';
      return;
    }

    // Paginar
    const start = (this.currentPage_pagination - 1) * this.teachersPerPage;
    const end = start + this.teachersPerPage;
    const paginatedTeachers = this.currentDisplayedTeachers.slice(start, end);

    paginatedTeachers.forEach(teacher => {
      grid.appendChild(createTeacherCard(teacher, this.filters.subject, this.favoriteTeacherIds));
    });

    // Renderizar paginación
    this.renderListPagination(this.currentDisplayedTeachers.length);
  }

  renderListPagination(total) {
    const pagination = document.getElementById('listPagination');
    const pages = Math.ceil(total / this.teachersPerPage);

    if (pages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '<button id="firstBtn2" class="btn btn-outline">« Primera</button>';
    html += '<button id="prevBtn2" class="btn btn-outline">← Anterior</button>';
    html += '<span style="margin: 0 var(--spacing-md);">Página <span id="pageDisplay2" style="cursor:pointer; font-weight:700;">' + this.currentPage_pagination + '</span> de ' + pages + '</span>';
    html += '<button id="nextBtn2" class="btn btn-outline">Siguiente →</button>';

    pagination.innerHTML = html;

    document.getElementById('firstBtn2').addEventListener('click', () => {
      if (this.currentPage_pagination !== 1) {
        this.currentPage_pagination = 1;
        this.displayListTeachers(this.currentDisplayedTeachers);
      }
    });

    document.getElementById('prevBtn2').addEventListener('click', () => {
      if (this.currentPage_pagination > 1) {
        this.currentPage_pagination--;
        this.displayListTeachers(this.currentDisplayedTeachers);
      }
    });

    document.getElementById('nextBtn2').addEventListener('click', () => {
      if (this.currentPage_pagination < pages) {
        this.currentPage_pagination++;
        this.displayListTeachers(this.currentDisplayedTeachers);
      }
    });

    const pageDisplayEl = document.getElementById('pageDisplay2');
    pageDisplayEl.addEventListener('click', (e) => {
      const parent = pageDisplayEl.parentElement;
      const input = document.createElement('input');
      input.type = 'number';
      input.id = 'pageInput2';
      input.min = 1;
      input.max = pages;
      input.value = this.currentPage_pagination;
      input.style.width = '60px';
      input.style.textAlign = 'center';

      parent.replaceChild(input, pageDisplayEl);
      input.focus();

      const commit = () => {
        const page = parseInt(input.value);
        if (!isNaN(page) && page >= 1 && page <= pages) {
          this.currentPage_pagination = page;
          this.displayListTeachers(this.currentDisplayedTeachers);
        } else {
          this.renderListPagination(total);
        }
      };

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') commit(); });
    });
  }

  ymdTodayLocal() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }

  teacherDetailMonthBounds(year, month0) {
    const p = (n) => String(n).padStart(2, '0');
    const first = new Date(year, month0, 1);
    const last = new Date(year, month0 + 1, 0);
    return {
      fromYmd: `${first.getFullYear()}-${p(first.getMonth() + 1)}-01`,
      toYmd: `${last.getFullYear()}-${p(last.getMonth() + 1)}-${p(last.getDate())}`
    };
  }

  buildMonthGridHtml(year, monthIndex, daysMap, todayYmd, selectedYmd, opts = {}) {
    const hideMonthTitle = !!opts.hideMonthTitle;
    const userMineYmds = opts.userMineYmds instanceof Set ? opts.userMineYmds : null;
    const MES = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const first = new Date(year, monthIndex, 1);
    const lead = first.getDay();
    const dim = new Date(year, monthIndex + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="cal-cell cal-cell--empty"></div>';
    for (let d = 1; d <= dim; d++) {
      const ymd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const info = daysMap && daysMap[ymd];
      const past = ymd < todayYmd;
      const mine = userMineYmds && userMineYmds.has(ymd);
      const st = info ? info.status : 'no_class';
      let cls = 'cal-day cal-day--noclass';
      if (mine) {
        cls = past ? 'cal-day cal-day--mine cal-day--mine-past' : 'cal-day cal-day--mine';
      } else if (past) cls = 'cal-day cal-day--past';
      else if (info) {
        if (st === 'available') cls = 'cal-day cal-day--available';
        else if (st === 'partial') cls = 'cal-day cal-day--partial';
        else if (st === 'full') cls = 'cal-day cal-day--full';
        else cls = 'cal-day cal-day--noclass';
      }
      const dis = mine || past || !info || st === 'no_class' || st === 'full';
      const picked = selectedYmd === ymd ? ' cal-day--picked' : '';
      cells += `<button type="button" class="${cls}${picked}" data-cal-ymd="${ymd}" ${dis ? 'disabled' : ''}>${d}</button>`;
    }
    return `
      <div class="cal-month-wrap">
        ${hideMonthTitle ? '' : `<div class="cal-month-title">${MES[monthIndex]} ${year}</div>`}
        <div class="cal-dow-row">${DOW.map((x) => `<span>${x}</span>`).join('')}</div>
        <div class="cal-days-grid">${cells}</div>
      </div>`;
  }

  /** Mapa de días en [fromYmd,toYmd] según solo los horarios cargados del profesor (sin cupos del servidor). */
  buildDaysMapFromTeacherSchedule(teacher, fromYmd, toYmd) {
    const days = {};
    const from = ScheduleUtils.parseYMDLocal(fromYmd);
    const to = ScheduleUtils.parseYMDLocal(toYmd);
    if (!from || !to || from > to) return days;
    const cap = Math.max(1, parseInt(teacher.classSize, 10) || 1);
    const cur = new Date(from.getTime());
    const end = new Date(to.getTime());
    while (cur <= end) {
      const ymd = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const slot = ScheduleUtils.getSlotForCalendarDate(teacher.schedules, ymd);
      if (!slot) {
        days[ymd] = { status: 'no_class', start: null, end: null, bookedCount: 0, capacity: cap };
      } else {
        days[ymd] = { status: 'available', start: slot.start, end: slot.end, bookedCount: 0, capacity: cap };
      }
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  async initTeacherDetailCalendar(teacher, isUser) {
    const root = document.getElementById('teacherBookingCalRoot');
    const pickPanel = document.getElementById('teacherBookingPickPanel');
    const pickLabel = document.getElementById('teacherBookingPickLabel');
    const modalityWrap = document.getElementById('teacherBookingModalityWrap');
    const noteEl = document.getElementById('teacherBookingNote');
    const confirmBtn = document.getElementById('teacherBookingConfirmBtn');
    const inlineErr = document.getElementById('teacherBookingInlineErr');
    if (!root) return;

    const bookingTeacherId = Number(teacher && teacher.id);
    if (!Number.isFinite(bookingTeacherId) || bookingTeacherId < 1) {
      root.innerHTML = '<p class="inline-error" role="alert">No se pudo cargar el identificador del profesor para reservar. Volvé al listado e ingresá de nuevo.</p>';
      return;
    }

    const MES = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const now = new Date();
    let anchorY = now.getFullYear();
    let anchorM = now.getMonth();
    let daysMap = null;
    let loadError = false;
    let selectedYmd = null;

    const todayYmd = this.ymdTodayLocal();
    let userMineYmds = new Set();

    const loadMineSet = async () => {
      userMineYmds = new Set();
      if (!this.authToken || !isUser) return;
      try {
        const res = await BookingAPI.getMyBookings(this.authToken);
        if (!res || !res.success || !Array.isArray(res.data)) return;
        for (const b of res.data) {
          if (Number(b.teacherId) !== bookingTeacherId || !b.datetime) continue;
          const ymd = String(b.datetime).trim().substring(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) userMineYmds.add(ymd);
        }
      } catch (e) {
        console.warn('loadMineSet', e);
      }
    };

    const fetchDays = async () => {
      loadError = false;
      const { fromYmd, toYmd } = this.teacherDetailMonthBounds(anchorY, anchorM);
      const localMap = this.buildDaysMapFromTeacherSchedule(teacher, fromYmd, toYmd);
      daysMap = { ...localMap };
      try {
        const res = await TeacherAPI.getTeacherAvailability(bookingTeacherId, fromYmd, toYmd);
        if (res && res.success && res.data && res.data.days) {
          const serverDays = res.data.days;
          for (const ymd of Object.keys(serverDays)) {
            const s = serverDays[ymd];
            const base = localMap[ymd];
            if (base && base.status !== 'no_class') {
              daysMap[ymd] = { ...base, ...s };
            } else {
              daysMap[ymd] = s;
            }
          }
        } else {
          throw new Error('bad');
        }
      } catch (e) {
        console.warn(e);
        loadError = true;
        daysMap = { ...localMap };
      }
    };

    const modOptions = this.bookingModalityOptions(teacher);

    const paint = () => {
      const monthLabel = `${MES[anchorM]} ${anchorY}`;
      root.innerHTML = `
        <div class="booking-cal-toolbar">
          <button type="button" class="btn btn-outline btn-sm" id="teacherCalPrev" aria-label="Mes anterior">←</button>
          <span class="booking-cal-toolbar-label">${monthLabel}</span>
          <button type="button" class="btn btn-outline btn-sm" id="teacherCalNext" aria-label="Mes siguiente">→</button>
        </div>
        <div class="booking-cal-single">
          ${loadError ? '<p class="booking-cal-fallback" role="status">No se pudieron cargar los cupos desde el servidor; el calendario sigue mostrando los días con clase según el horario cargado. Usá <strong>Reintentar cupos</strong> para actualizar ocupación.</p>' : ''}
          ${daysMap ? this.buildMonthGridHtml(anchorY, anchorM, daysMap, todayYmd, selectedYmd, { hideMonthTitle: true, userMineYmds }) : ''}
        </div>
        ${loadError ? `<div class="booking-cal-toolbar booking-cal-toolbar--footer">
          <button type="button" class="btn btn-outline btn-sm" id="teacherCalRetryCupo">Reintentar cupos</button>
        </div>` : ''}
        <div class="booking-cal-legend">
          <span><i class="cal-leg cal-leg--noclass"></i> Sin clase (no coincide con sus días cargados)</span>
          <span><i class="cal-leg cal-leg--available"></i> Con cupo</span>
          <span><i class="cal-leg cal-leg--partial"></i> Cupos parciales</span>
          <span><i class="cal-leg cal-leg--full"></i> Completo / sin cupos (<span class="cal-leg-red-note">rojo</span>)</span>
          <span><i class="cal-leg cal-leg--mine"></i> Tu reserva (incluye clases ya dictadas)</span>
        </div>`;

      const prev = document.getElementById('teacherCalPrev');
      const next = document.getElementById('teacherCalNext');
      const retryCupo = document.getElementById('teacherCalRetryCupo');
      if (prev) {
        prev.onclick = () => {
          anchorM -= 1;
          if (anchorM < 0) {
            anchorM = 11;
            anchorY -= 1;
          }
          selectedYmd = null;
          if (pickPanel) pickPanel.style.display = 'none';
          if (inlineErr) inlineErr.textContent = '';
          void refetchAndPaint();
        };
      }
      if (next) {
        next.onclick = () => {
          anchorM += 1;
          if (anchorM > 11) {
            anchorM = 0;
            anchorY += 1;
          }
          selectedYmd = null;
          if (pickPanel) pickPanel.style.display = 'none';
          if (inlineErr) inlineErr.textContent = '';
          void refetchAndPaint();
        };
      }
      if (retryCupo) {
        retryCupo.onclick = () => {
          void refetchAndPaint();
        };
      }

      root.querySelectorAll('.cal-day:not([disabled])').forEach((btn) => {
        btn.addEventListener('click', () => {
          const ymd = btn.getAttribute('data-cal-ymd');
          if (!ymd || !daysMap || !daysMap[ymd]) return;
          const st = daysMap[ymd].status;
          if (st === 'no_class' || st === 'full') return;
          if (!this.currentUser) {
            showAlert('Iniciá sesión para reservar', 'info');
            this.showAuthModal('login');
            return;
          }
          if (!isUser) {
            showAlert('Solo los alumnos pueden reservar clases desde aquí.', 'info');
            return;
          }
          selectedYmd = ymd;
          root.querySelectorAll('.cal-day').forEach((b) => b.classList.remove('cal-day--picked'));
          btn.classList.add('cal-day--picked');
          const slot = daysMap[ymd];
          if (modalityWrap) {
            if (modOptions.length >= 2) {
              modalityWrap.style.display = 'block';
              const vIn = modalityWrap.querySelector('input[value="virtual"]');
              const pIn = modalityWrap.querySelector('input[value="presencial"]');
              if (vIn) vIn.checked = false;
              if (pIn) pIn.checked = false;
              if (modOptions.includes('virtual') && vIn) vIn.checked = true;
              else if (modOptions.includes('presencial') && pIn) pIn.checked = true;
            } else {
              modalityWrap.style.display = 'none';
            }
          }
          if (pickPanel && pickLabel) {
            pickLabel.textContent = `Día ${ymd} · ${slot.start} a ${slot.end}`;
            pickPanel.style.display = 'block';
          }
          if (inlineErr) inlineErr.textContent = '';
          if (noteEl) noteEl.value = '';
        });
      });
    };

    const refetchAndPaint = async () => {
      await fetchDays();
      await loadMineSet();
      paint();
    };

    await refetchAndPaint();

    if (confirmBtn && isUser) {
      confirmBtn.onclick = async () => {
        if (!selectedYmd) return;
        if (inlineErr) inlineErr.textContent = '';
        try {
          let sessionModality = null;
          if (modOptions.length >= 2) {
            const sel = modalityWrap && modalityWrap.querySelector('input[name="teacherBookingModality"]:checked');
            sessionModality = sel ? sel.value : null;
            if (!sessionModality) {
              if (inlineErr) inlineErr.textContent = 'Elegí si la clase será virtual o presencial.';
              return;
            }
          } else if (modOptions.length === 1) {
            sessionModality = modOptions[0];
          }
          await this.handleCreateBooking(bookingTeacherId, selectedYmd, noteEl ? noteEl.value : '', sessionModality);
          showAlert('Reserva confirmada', 'success');
          selectedYmd = null;
          if (pickPanel) pickPanel.style.display = 'none';
          await refetchAndPaint();
        } catch (err) {
          if (inlineErr) inlineErr.textContent = (err && err.message) || 'No se pudo reservar';
        }
      };
    } else if (confirmBtn) {
      confirmBtn.disabled = true;
    }
  }

  async showTeacherDetail(teacherId) {
    const main = document.querySelector('main');
    const renderLoadError = () => {
      main.innerHTML = `
        <div class="container detail-load-error">
          <p>No se pudo cargar la información del profesor.</p>
          <button type="button" class="btn btn-primary" id="retryTeacherDetailBtn">Reintentar</button>
        </div>`;
      const b = document.getElementById('retryTeacherDetailBtn');
      if (b) b.onclick = () => this.showTeacherDetail(teacherId);
    };

    try {
      const result = await TeacherAPI.getTeacherById(teacherId);
      if (!result || !result.success || !result.data) {
        renderLoadError();
        return;
      }
      const teacher = result.data;
      const teacherNumericId = Number(teacher.id);
      const teacherIdOk = Number.isFinite(teacherNumericId) && teacherNumericId > 0;

      const isAdmin = this.currentUser && this.currentUser.role === 'admin';
      const isUser = this.currentUser && this.currentUser.role === 'user';
      const favOn = teacherIdOk && this.favoriteTeacherIds.has(teacherNumericId);
      const heartSvg =
        '<svg class="detail-fav-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

      const subjectIconMap = this.getSubjectIconMap();
      const subjectsListHtml = (Array.isArray(teacher.subjects) ? teacher.subjects : []).map((subject) => `
        <div class="subject-detail-pill">
          <span>${subjectIconMap.get(subject) || '📘'}</span>
          <span>${subject}</span>
        </div>
      `).join('');

      const contactBlockHtml = isAdmin ? `
          <div class="detail-note">
            <strong>Información de contacto:</strong>
            <div style="margin-top: var(--spacing-sm);">
              <div class="detail-info-item">
                <span class="detail-info-label">Email:</span>
                <span class="detail-info-value">${teacher.email}</span>
              </div>
              ${teacher.phone ? `
              <div class="detail-info-item">
                <span class="detail-info-label">Teléfono:</span>
                <span class="detail-info-value">${teacher.phone}</span>
              </div>
              ` : ''}
            </div>
          </div>
      ` : ``;

      const bookingSectionHtml = !isAdmin
        ? `
              <div class="detail-info-section" id="teacherBookingSection">
                <h3>Reservar una clase</h3>
                <p class="booking-schedule-reminder"><strong>Horarios cargados de este profesor:</strong> ${ScheduleUtils.formatScheduleSummaryEs(teacher.schedules)}</p>
                <p class="booking-cal-intro">El calendario marca según esos horarios: días sin franja en gris; con cupo en verde; cupos parciales en amarillo; <strong>sin cupos / completo en rojo</strong>. Los días en <strong>violeta</strong> son tus reservas con este profesor (siguen visibles aunque la fecha ya haya pasado). Si el profesor ofrece virtual y presencial, elegí la modalidad al confirmar. Elegí un día con cupo para una nueva reserva.</p>
                <div id="teacherBookingCalRoot" class="teacher-booking-cal-root"></div>
                <div id="teacherBookingPickPanel" class="teacher-booking-pick" style="display:none;">
                  <p id="teacherBookingPickLabel"></p>
                  <div id="teacherBookingModalityWrap" class="teacher-booking-modality-wrap" style="display:none;">
                    <p class="teacher-booking-modality-title">Modalidad para esta clase</p>
                    <div class="teacher-booking-modality-radios" role="radiogroup" aria-label="Modalidad">
                      <label class="booking-modality-label"><input type="radio" name="teacherBookingModality" value="virtual" /> Virtual</label>
                      <label class="booking-modality-label"><input type="radio" name="teacherBookingModality" value="presencial" /> Presencial</label>
                    </div>
                  </div>
                  <div class="form-group"><label for="teacherBookingNote">Nota (opcional)</label><textarea id="teacherBookingNote" rows="2" maxlength="500" placeholder="Tema, duda u otro comentario"></textarea></div>
                  <button type="button" class="btn btn-primary" id="teacherBookingConfirmBtn">Confirmar reserva</button>
                  <div id="teacherBookingInlineErr" class="inline-error" role="alert"></div>
                </div>
              </div>`
        : '';

      const footerUserLink =
        !isAdmin && isUser
          ? `
              <div class="detail-footer-booking-hint" style="margin-top: var(--spacing-lg); padding-top: var(--spacing-md); border-top: 1px solid #e7e7e7;">
                <a href="#my-bookings" class="btn btn-link">Ver mis clases reservadas</a>
              </div>`
          : '';

      const adminActionsHtml = isAdmin
        ? `
              <div class="detail-admin-actions" style="display: flex; gap: var(--spacing-lg); margin-top: var(--spacing-2xl); padding-top: var(--spacing-xl); border-top: 2px solid #e7e7e7;">
                <button id="editTeacherBtn" class="btn btn-primary" style="flex: 1; padding: var(--spacing-md); background: #274580; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600; font-size: var(--font-size-sm);">Editar Profesor</button>
                <button id="deleteTeacherBtn" class="btn btn-danger" style="flex: 1; padding: var(--spacing-md); background: #d9534f; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600; font-size: var(--font-size-sm);">Eliminar Profesor</button>
              </div>`
        : '';

      main.innerHTML = `
        <div class="detail-header">
          <div class="detail-header-left detail-header-title-row">
            <h1>${teacher.firstName} ${teacher.lastName}</h1>
            <button type="button" class="detail-fav-btn${favOn ? ' is-favorite' : ''}" data-fav-teacher-id="${teacherIdOk ? teacherNumericId : ''}" aria-label="Marcar favorito" aria-pressed="${favOn ? 'true' : 'false'}" title="Favorito" ${teacherIdOk ? '' : 'disabled'}>${heartSvg}</button>
          </div>
          <div class="detail-header-right">
            <span class="detail-header-back" onclick="window.history.back()">←</span>
          </div>
        </div>

        <div class="container">
          <div class="detail-content">
              <div class="detail-images">
                <div class="detail-image"><img src="${teacher.photo || '/assets/uploads/default-avatar.svg'}" alt="${teacher.firstName}" onerror="this.onerror=null;this.src='/assets/uploads/default-avatar.svg'" /></div>
            </div>

            <div class="detail-info">
              <div class="detail-info-section">
                <h3>Información Personal</h3>
                <div class="detail-info-item">
                  <span class="detail-info-label">Edad:</span>
                  <span class="detail-info-value">${teacher.age} años</span>
                </div>
                ${contactBlockHtml}
              </div>

              <div class="detail-info-section">
                <h3>Clases</h3>
                <div class="detail-info-item">
                  <span class="detail-info-label">Modalidad:</span>
                  <span class="detail-info-value">${(Array.isArray(teacher.modalities) ? teacher.modalities : (teacher.modalities ? JSON.parse(teacher.modalities) : (teacher.modality ? [teacher.modality] : []))).map(m => m === 'virtual' ? 'Virtual' : 'Presencial').join(' • ')}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-label">Tipo de clase:</span>
                  <span class="detail-info-value">${parseInt(teacher.classSize) === 1 ? 'Clases particulares' : `Clases grupales • ${teacher.classSize} alumnos`}</span>
                </div>
                <div class="detail-info-item schedule-detail-block">
                  <span class="detail-info-label">Horarios:</span>
                  <div class="detail-info-value schedule-detail-wrap">${ScheduleUtils.formatScheduleDetailHtml(teacher.schedules)}</div>
                </div>
                ${teacher.location ? `
                <div class="detail-info-item">
                  <span class="detail-info-label">Ubicación:</span>
                  <span class="detail-info-value">${teacher.location}</span>
                </div>
                ` : ''}
              </div>

              <div class="detail-info-section subjects-section">
                <h3>Materias</h3>
                <div class="subject-detail-grid subject-detail-grid-large">${subjectsListHtml}</div>
              </div>

              <div class="detail-info-section">
                <h3>Descripción</h3>
                <p>${typeof sanitizeDescription === 'function' ? sanitizeDescription(teacher.description) : (teacher.description || '')}</p>
              </div>

              ${bookingSectionHtml}

              <div class="detail-info-section">
                <h3>Temario</h3>
                <p>${teacher.curriculum}</p>
              </div>

              ${footerUserLink}
              ${adminActionsHtml}
            </div>
          </div>
        </div>
      `;

      const favDetail = document.querySelector('.detail-fav-btn');
      if (favDetail && teacherIdOk) favDetail.addEventListener('click', (e) => this.onFavoriteClick(teacherNumericId, e));

      if (isAdmin) {
        const editBtn = document.getElementById('editTeacherBtn');
        const deleteBtn = document.getElementById('deleteTeacherBtn');
        if (editBtn) editBtn.addEventListener('click', () => this.showEditTeacherPage(teacher));
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.showDeleteConfirmation(teacher));
      } else {
        void this.initTeacherDetailCalendar(teacher, isUser);
      }
    } catch (error) {
      console.error('Error:', error);
      renderLoadError();
    }
  }

  async renderMyBookingsPage(main) {
    main.innerHTML = `
      <div class="container page-mis-clases">
        <div class="detail-header">
          <div class="detail-header-left">
            <h1>Mis clases reservadas</h1>
          </div>
        </div>
        <div id="myBookingsBody" class="my-bookings-body"><p>Cargando…</p></div>
      </div>`;
    const body = document.getElementById('myBookingsBody');
    try {
      const res = await BookingAPI.getMyBookings(this.authToken);
      if (!res || !res.success) throw new Error(res && res.message);
      const rows = res.data || [];
      if (!rows.length) {
        body.innerHTML = '<p class="muted">No tenés clases reservadas.</p>';
        return;
      }
      body.innerHTML = rows
        .map(
          (b) => `
        <article class="booking-card" data-booking-id="${b.id}">
          <div class="booking-card-main">
            <div class="booking-card-title">${b.teacherFirstName} ${b.teacherLastName}</div>
            <div class="booking-card-meta">${this.formatBookingWhen(b.datetime, b.timeEnd)}${b.sessionModality ? ` <span class="booking-modality-badge">${b.sessionModality === 'virtual' ? 'Virtual' : 'Presencial'}</span>` : ''}</div>
            <div class="booking-card-actions">
              <button type="button" class="btn btn-outline btn-sm booking-detail-btn" data-id="${b.id}">Ver detalle</button>
              <button type="button" class="btn btn-outline btn-sm booking-del-btn" data-id="${b.id}" data-start="${String(b.datetime || '').replace(/"/g, '&quot;')}">Cancelar reserva</button>
            </div>
          </div>
        </article>`
        )
        .join('');

      body.querySelectorAll('.booking-detail-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.getAttribute('data-id'), 10);
          await this.openBookingDetailModal(id);
        });
      });
      body.querySelectorAll('.booking-del-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'), 10);
          const start = btn.getAttribute('data-start') || '';
          if (!this.canCancelBooking(start)) {
            showAlert(
              'No podés cancelar con menos de un día de antelación. Si necesitás cambiar la clase, contactá al profesor.',
              'error'
            );
            return;
          }
          this.showConfirmModal(
            '¿Seguro que querés cancelar esta reserva? Esta acción no se puede deshacer.',
            async () => {
              try {
                await BookingAPI.deleteBooking(this.authToken, id);
                showAlert('Reserva cancelada', 'success');
                await this.renderMyBookingsPage(main);
              } catch (e) {
                showAlert((e && e.message) || 'No se pudo cancelar', 'error');
              }
            },
            'Sí, cancelar reserva'
          );
        });
      });
    } catch (e) {
      body.innerHTML = `
        <div class="availability-inline-error">
          <p>No se pudieron cargar tus reservas. Reintentá más tarde.</p>
          <button type="button" class="btn btn-outline" id="retryMyBookings">Reintentar</button>
        </div>`;
      const r = document.getElementById('retryMyBookings');
      if (r) r.onclick = () => this.renderMyBookingsPage(main);
    }
  }

  parseBookingStartLocal(datetimeStr) {
    const s = String(datetimeStr || '').trim();
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

  /** Cancelación permitida solo si falta más de 24 h hasta el inicio de la clase. */
  canCancelBooking(datetimeStr) {
    const d = this.parseBookingStartLocal(datetimeStr);
    if (!d) return false;
    return d.getTime() - Date.now() > 24 * 60 * 60 * 1000;
  }

  formatBookingWhen(datetime, timeEnd) {
    if (!datetime) return '';
    const d = this.parseBookingStartLocal(datetime);
    if (!d) return String(datetime).replace('T', ' ');
    const ds = d.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const ts = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const end = timeEnd && String(timeEnd).trim();
    if (end) return `${ds}, ${ts} – ${end}`;
    return `${ds}, ${ts}`;
  }

  async openBookingDetailModal(bookingId) {
    try {
      const res = await BookingAPI.getBooking(this.authToken, bookingId);
      if (!res || !res.success || !res.data) throw new Error();
      const d = res.data;
      const t = d.teacher || {};
      const esc = (s) =>
        String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/"/g, '&quot;');
      const modLabel =
        d.sessionModality === 'virtual'
          ? 'Virtual'
          : d.sessionModality === 'presencial'
            ? 'Presencial'
            : '';
      const modLine = modLabel ? `<p><strong>Modalidad de la clase:</strong> ${esc(modLabel)}</p>` : '';
      const contactBlock =
        (t.email || t.phone)
          ? `<div class="booking-detail-contact"><strong>Contacto del profesor (clase virtual)</strong>
            ${t.email ? `<div class="booking-detail-line"><span class="booking-detail-k">Email:</span> <span class="booking-detail-v">${esc(t.email)}</span></div>` : ''}
            ${t.phone ? `<div class="booking-detail-line"><span class="booking-detail-k">Teléfono:</span> <span class="booking-detail-v">${esc(t.phone)}</span></div>` : ''}
            </div>`
          : '';
      const loc =
        t.location && String(t.location).trim()
          ? `<p><strong>Ubicación:</strong> ${esc(String(t.location))}</p>`
          : '';

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-panel">
          <button type="button" class="modal-close" aria-label="Cerrar">×</button>
          <h3>Detalle de la reserva</h3>
          <p><strong>Profesor:</strong> ${esc(t.firstName)} ${esc(t.lastName)}</p>
          <p><strong>Fecha y hora:</strong> ${esc(this.formatBookingWhen(d.datetime, d.timeEnd))}</p>
          ${modLine}
          ${loc}
          ${d.message ? `<p><strong>Tu nota:</strong> ${esc(d.message)}</p>` : ''}
          ${contactBlock}
        </div>`;
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector('.modal-close').onclick = close;
      overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) close();
      });
    } catch (e) {
      showAlert('No se pudo cargar el detalle de la reserva', 'error');
    }
  }

  async renderFavoritesPage(main) {
    await this.refreshFavoriteIds();
    main.innerHTML = `
      <div class="container page-favoritos">
        <div class="detail-header">
          <div class="detail-header-left"><h1>Profesores favoritos</h1></div>
        </div>
        <div id="favoritesGrid" class="teachers-grid favorites-grid"><p>Cargando…</p></div>
      </div>`;
    const grid = document.getElementById('favoritesGrid');
    try {
      const res = await FavoriteAPI.listTeachers(this.authToken);
      if (!res || !res.success) throw new Error();
      const list = res.data || [];
      grid.innerHTML = '';
      if (!list.length) {
        grid.innerHTML = '<p class="muted">No tenés favoritos todavía.</p>';
        return;
      }
      list.forEach((teacher) => {
        grid.appendChild(createTeacherCard(teacher, null, this.favoriteTeacherIds));
      });
    } catch (e) {
      grid.innerHTML = `
        <div class="availability-inline-error">
          <p>No se pudieron cargar los favoritos.</p>
          <button type="button" class="btn btn-outline" id="retryFav">Reintentar</button>
        </div>`;
      const r = document.getElementById('retryFav');
      if (r) r.onclick = () => this.renderFavoritesPage(main);
    }
  }

  async showEditTeacherPage(teacher) {
    const main = document.querySelector('main');

    const subjectsOptions = this.subjectGroups.map((category) => {
      const items = (category.items || []).map((item) => `
        <label style="display: inline-flex; align-items: center; margin-right: var(--spacing-lg); margin-bottom: var(--spacing-sm);">
          <input type="checkbox" name="subjects" value="${item.name}" ${Array.isArray(teacher.subjects) && teacher.subjects.includes(item.name) ? 'checked' : ''} />
          <span style="margin-left: var(--spacing-sm); cursor: pointer;">${item.icon || '📘'} ${item.name}</span>
        </label>
      `).join('');
      return `
        <div style="margin-bottom: var(--spacing-lg);">
          <h4 style="margin-bottom: var(--spacing-sm); color: var(--isotipo-dark); font-weight: 700;">${category.name}</h4>
          <div style="display: flex; flex-wrap: wrap;">${items}</div>
        </div>
      `;
    }).join('');

    main.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-left">
          <span class="detail-header-back" onclick="window.history.back()">←</span>
          <h1>Editar Profesor</h1>
        </div>
      </div>

      <div class="container" style="max-width: 1000px; padding-top: var(--spacing-2xl);">
        <div class="form-section">
          <form id="editTeacherForm">
            <fieldset style="border: none; padding: 0;">
              <legend style="font-size: var(--font-size-lg); font-weight: 700; color: var(--isotipo-dark); margin-bottom: var(--spacing-lg);">Información Personal</legend>

              <div class="form-row">
                <div class="form-group required">
                  <label for="firstName">Nombre</label>
                  <input type="text" id="firstName" name="firstName" value="${teacher.firstName}" required />
                  <div class="form-error"></div>
                </div>

                <div class="form-group required">
                  <label for="lastName">Apellido</label>
                  <input type="text" id="lastName" name="lastName" value="${teacher.lastName}" required />
                  <div class="form-error"></div>
                </div>

                <div class="form-group required">
                  <label for="age">Edad</label>
                  <input type="number" id="age" name="age" min="18" max="100" value="${teacher.age}" required />
                  <div class="form-error"></div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group required">
                  <label for="email">Email</label>
                  <input type="email" id="email" name="email" value="${teacher.email}" required />
                  <div class="form-error"></div>
                </div>

                <div class="form-group">
                  <label for="phone">Teléfono</label>
                  <input type="tel" id="phone" name="phone" value="${teacher.phone || ''}" />
                  <div class="form-error"></div>
                </div>
              </div>
            </fieldset>

            <hr style="margin: var(--spacing-lg) 0; border: none; border-top: 1px solid var(--color-gray-medium);">

            <fieldset style="border: none; padding: 0;">
              <legend style="font-size: var(--font-size-lg); font-weight: 700; color: var(--isotipo-dark); margin-bottom: var(--spacing-lg);">Información Académica</legend>

              <div class="form-group required">
                <label>Materias</label>
                <button type="button" id="toggleEditSubjects" style="background: #587D71; color: white; border: none; padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--border-radius); cursor: pointer; margin-bottom: var(--spacing-md);">
                  <span id="toggleEditSubjectsIcon">▼</span> Seleccionar Materias
                </button>
                <div id="editSubjectsContainer" class="form-group-checkbox" style="display: block;">${subjectsOptions}</div>
                <div class="form-error"></div>
              </div>

              <div class="form-group required">
                <label for="description">Descripción</label>
                <textarea id="description" name="description" required>${teacher.description}</textarea>
                <div class="form-error"></div>
              </div>

              <div class="form-group required">
                <label for="curriculum">Temario</label>
                <textarea id="curriculum" name="curriculum" required>${teacher.curriculum}</textarea>
                <div class="form-error"></div>
              </div>

              <div class="form-group required modality-field-group">
                <span class="modality-field-label">Modalidad de las clases</span>
                <div class="modality-picker" role="group" aria-label="Modalidad">
                  <label class="modality-option">
                    <input type="checkbox" name="modalities" value="virtual" ${Array.isArray(teacher.modalities) && teacher.modalities.includes('virtual') ? 'checked' : ''} />
                    <span class="modality-option-text">Virtual</span>
                  </label>
                  <label class="modality-option">
                    <input type="checkbox" name="modalities" value="presencial" ${Array.isArray(teacher.modalities) && teacher.modalities.includes('presencial') ? 'checked' : ''} />
                    <span class="modality-option-text">Presencial</span>
                  </label>
                </div>
                <div class="form-error"></div>
              </div>

              <div class="form-row">
                <div class="form-group required">
                  <label for="classSize">Cantidad de Alumnos</label>
                  <input type="number" id="classSize" name="classSize" min="1" max="40" value="${teacher.classSize}" required />
                  <div class="form-error"></div>
                </div>
              </div>

              <div class="form-group required" id="scheduleBuilderHost">
                <label>Franjas horarias en las que dictás clases</label>
                <div id="scheduleBuilderRoot"></div>
                <div class="form-error"></div>
              </div>

              <div class="form-group">
                <label for="location">Ubicación</label>
                <input type="text" id="location" name="location" placeholder="ej: La Plata, Buenos Aires" value="${teacher.location || ''}" />
                <div class="form-error"></div>
              </div>
            </fieldset>

            <div style="margin-top: var(--spacing-2xl); display: flex; gap: var(--spacing-lg); justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" onclick="window.history.back()" style="padding: var(--spacing-md) var(--spacing-lg); background: #6c757d; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600;">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" style="padding: var(--spacing-md) var(--spacing-lg); background: #274580; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600;">
                Guardar Cambios
              </button>
            </div>

            <!-- Mostrar errores al pie del formulario -->
            <div id="formWarnings" style="margin-top: var(--spacing-lg); padding: var(--spacing-lg); background: #ffe7e7; border-left: 4px solid #d9534f; border-radius: var(--border-radius); color: #8b0000; display: none;"></div>
          </form>
        </div>
      </div>
    `;

    // Agregar listener para submit del formulario
    const editForm = document.getElementById('editTeacherForm');
    if (editForm) {
      const toggleEditSubjects = document.getElementById('toggleEditSubjects');
      const toggleEditSubjectsIcon = document.getElementById('toggleEditSubjectsIcon');
      const editSubjectsContainer = document.getElementById('editSubjectsContainer');
      if (toggleEditSubjects && toggleEditSubjectsIcon && editSubjectsContainer) {
        toggleEditSubjects.addEventListener('click', () => {
          const isVisible = editSubjectsContainer.style.display !== 'none';
          editSubjectsContainer.style.display = isVisible ? 'none' : 'block';
          toggleEditSubjectsIcon.textContent = isVisible ? '▶' : '▼';
        });
      }

      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleEditTeacher(teacher.id);
      });

      setTimeout(() => {
        this.initScheduleBuilder(document.getElementById('scheduleBuilderRoot'), teacher.schedules);
      }, 0);

      // Limpiar errores cuando se edita
      editForm.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', () => {
          const formGroup = field.closest('.form-group');
          if (formGroup) {
            formGroup.classList.remove('error');
            const error = formGroup.querySelector('.form-error');
            if (error) error.textContent = '';
          }
        });
      });
    }
  }

  async handleEditTeacher(teacherId) {
    const form = document.getElementById('editTeacherForm');
    const data = new FormData(form);
    
    const subjects = Array.from(form.querySelectorAll('input[name="subjects"]:checked')).map(cb => cb.value);
    const modalities = Array.from(form.querySelectorAll('input[name="modalities"]:checked')).map(cb => cb.value);

    const updateData = {
      firstName: data.get('firstName'),
      lastName: data.get('lastName'),
      age: parseInt(data.get('age')),
      email: data.get('email'),
      phone: data.get('phone') || null,
      description: data.get('description'),
      curriculum: data.get('curriculum'),
      modalities: modalities,
      classSize: parseInt(data.get('classSize')),
      schedules: this.collectSchedulePayloadFromBuilder(document.getElementById('scheduleBuilderRoot')),
      location: data.get('location') || null,
      subjects: subjects
    };

    // Validar
    const validations = {
      firstName: [!updateData.firstName, 'El nombre es requerido'],
      lastName: [!updateData.lastName, 'El apellido es requerido'],
      age: [!validateAge(updateData.age), 'La edad debe estar entre 18 y 100 años'],
      email: [!validateEmail(updateData.email), 'El email no es válido'],
      phone: [updateData.phone && !validatePhone(updateData.phone), 'El teléfono no es válido'],
      subjects: [subjects.length === 0, 'Debes seleccionar al menos una materia'],
      description: [!updateData.description, 'La descripción es requerida'],
      curriculum: [!updateData.curriculum, 'El temario es requerido'],
      classSize: [!validateClassSize(updateData.classSize), 'La cantidad de alumnos debe estar entre 1 y 40'],
      modalities: [!modalities || modalities.length === 0, 'Seleccioná al menos una modalidad']
    };

    let errors = [];
    for (const [field, [isInvalid, message]] of Object.entries(validations)) {
      if (isInvalid) {
        errors.push(message);
        setFieldError(field, message);
      }
    }

    const schEd = this.collectSchedulePayloadFromBuilder(document.getElementById('scheduleBuilderRoot'));
    if (!schEd.slots || schEd.slots.length === 0) {
      errors.push('Agregá al menos una franja con día y horario');
    } else {
      for (const sl of schEd.slots) {
        const a = ScheduleUtils.timeToMinutes(sl.start);
        const b = ScheduleUtils.timeToMinutes(sl.end);
        if (a == null || b == null || b <= a) {
          errors.push('En cada franja, la hora hasta debe ser mayor que la hora desde');
          break;
        }
      }
    }

    if (modalities.includes('presencial') && !(updateData.location && String(updateData.location).trim())) {
      errors.push('La ubicación es requerida para clases presenciales');
      setFieldError('location', 'Ubicación requerida');
    }

    if (errors.length > 0) {
      const warningsDiv = document.getElementById('formWarnings');
      if (warningsDiv) {
        warningsDiv.innerHTML = '<strong>Errores en el formulario:</strong><ul>' + 
          errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
        warningsDiv.style.display = 'block';
      }
      return;
    }

    try {
      await TeacherAPI.updateTeacher(teacherId, updateData);
      showAlert('✓ Profesor actualizado correctamente', 'success');
      setTimeout(() => {
        window.location.hash = `teacher/${teacherId}`;
      }, 1000);
    } catch (error) {
      showAlert('Error al actualizar profesor: ' + error.message, 'error');
    }
  }

  showDeleteConfirmation(teacher) {
    const main = document.querySelector('main');
    main.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-left">
          <span class="detail-header-back" onclick="window.history.back()">←</span>
          <h1>Confirmar eliminación</h1>
        </div>
      </div>

      <div class="container" style="max-width: 600px; padding-top: var(--spacing-2xl); text-align: center;">
        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: var(--spacing-2xl); border-radius: var(--border-radius); margin-bottom: var(--spacing-2xl);">
          <h2 style="color: #8b6914; margin-bottom: var(--spacing-lg);">⚠️ ¿Estás seguro?</h2>
          <p style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-lg); color: #333;">
            Se eliminará permanentemente a <strong>${teacher.firstName} ${teacher.lastName}</strong>
          </p>
          <p style="color: #666; margin-bottom: var(--spacing-2xl);">Esta acción no se puede deshacer.</p>

          <div style="display: flex; gap: var(--spacing-lg); justify-content: center;">
            <button onclick="window.history.back()" style="padding: var(--spacing-md) var(--spacing-xl); background: #6c757d; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600; font-size: var(--font-size-sm);">
              Cancelar
            </button>
            <button id="confirmDeleteBtn" style="padding: var(--spacing-md) var(--spacing-xl); background: #d9534f; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600; font-size: var(--font-size-sm);">
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    `;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        try {
          await TeacherAPI.deleteTeacher(teacher.id);
          showAlert('✓ Profesor eliminado correctamente', 'success');
          setTimeout(() => {
            window.location.hash = '/';
          }, 1000);
        } catch (error) {
          showAlert('Error al eliminar profesor: ' + error.message, 'error');
        }
      });
    }
  }

  async loadTeachers() {
    console.log('Cargando profesores inicialmente...');
  }
}

// Iniciar app cuando DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.app = new EstudiusApp();
});
