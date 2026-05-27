// ========================================
// UTILIDADES - Funciones auxiliares
// ========================================

/** Primera letra visible del perfil (nombre, apellido o email). */
function userAvatarInitial(user) {
  const letterFrom = (s) => {
    const t = String(s || '').trim();
    if (!t) return '';
    const m = t.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/);
    return m ? m[0] : t.charAt(0);
  };
  let ch = letterFrom(user && user.firstName) || letterFrom(user && user.lastName);
  if (!ch && user && user.email) {
    const local = String(user.email).split('@')[0] || '';
    ch = letterFrom(local) || (local ? local.charAt(0) : '');
  }
  return (ch || 'U').toUpperCase();
}

/** Relativo luminance 0–1 para hex #RRGGBB o rgb(). */
function relativeLuminanceFromCssColor(css) {
  const s = String(css || '').trim();
  let r = 0.2;
  let g = 0.2;
  let b = 0.2;
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    r = parseInt(h.slice(0, 2), 16) / 255;
    g = parseInt(h.slice(2, 4), 16) / 255;
    b = parseInt(h.slice(4, 6), 16) / 255;
  } else {
    const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
      r = parseInt(m[1], 10) / 255;
      g = parseInt(m[2], 10) / 255;
      b = parseInt(m[3], 10) / 255;
    }
  }
  const lin = (x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Texto legible sobre el color de fondo del avatar. */
function contrastingAvatarTextColor(backgroundCss) {
  const L = relativeLuminanceFromCssColor(backgroundCss);
  return L > 0.55 ? '#1a1d21' : '#ffffff';
}

/**
 * Hacer una solicitud HTTP
 */
async function httpRequest(method, url, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Agregar token si existe en localStorage
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // localStorage puede no estar disponible en algunos contextos
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const text = await response.text();
  let result;
  try {
    result = text ? JSON.parse(text) : {};
  } catch (e) {
    result = { raw: text };
  }

  if (!response.ok) {
    const message = (result && result.message) ? result.message : (text || 'Error en la solicitud');
    const error = new Error(message);
    // Adjuntar todo el resultado parseado para decisiones en UI
    error.details = result;
    throw error;
  }

  return result;
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
}

/**
 * Capitalizar primera letra
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Normalizar texto para búsqueda: minúsculas y sin tildes (NFD + quitar marcas combinantes).
 */
function normalizeSearchText(str) {
  if (str == null || str === '') return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** true si needle (texto crudo) aparece en haystack ignorando mayúsculas y tildes */
function normalizedIncludes(haystack, queryRaw) {
  const q = normalizeSearchText(queryRaw);
  if (!q) return true;
  return normalizeSearchText(haystack).includes(q);
}

/**
 * Primer rango [start, end) en label que coincide con queryRaw (acentos / mayúsculas).
 */
function accentInsensitiveMatchRange(label, queryRaw) {
  const h = String(label || '');
  const nq = normalizeSearchText(queryRaw);
  if (!nq) return null;
  for (let i = 0; i < h.length; i++) {
    if (!normalizeSearchText(h.slice(i)).startsWith(nq)) continue;
    for (let k = i + 1; k <= h.length; k++) {
      const sub = normalizeSearchText(h.slice(i, k));
      if (!sub.startsWith(nq)) break;
      if (sub.length >= nq.length) return [i, k];
    }
  }
  return null;
}

/**
 * Mostrar alerta
 */
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.display = 'block';

  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(alertDiv, main.firstChild);
  }

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

/**
 * Limpiar formulario
 */
function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    form.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('error');
      const errorMsg = group.querySelector('.form-error');
      if (errorMsg) {
        errorMsg.textContent = '';
      }
    });
  }
}

/**
 * Mostrar error en campo
 */
function setFieldError(fieldName, errorMessage) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (!field) return;

  const formGroup = field.closest('.form-group');
  if (formGroup) {
    formGroup.classList.add('error');
    const errorEl = formGroup.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = errorMessage;
    }
  }
}

/**
 * Limpiar errores de formulario
 */
function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('error');
      const errorMsg = group.querySelector('.form-error');
      if (errorMsg) {
        errorMsg.textContent = '';
      }
    });
  }
}

/**
 * Validar email
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validar teléfono
 */
function validatePhone(phone) {
  if (!phone) return true; // Opcional
  // Validar: mínimo 7 caracteres numéricos, puede incluir espacios, guiones, +, paréntesis
  const regex = /^[\d\s\-\+\(\)]{7,}$/;
  return regex.test(phone);
}

/**
 * Verificar seguridad de contraseña (cliente)
 * Devuelve un array de mensajes de error (vacío si es segura)
 */
function checkPasswordStrength(password) {
  const errors = [];
  if (typeof password !== 'string' || password.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres');
  if (!/[A-Za-z]/.test(password)) errors.push('La contraseña debe incluir al menos una letra');
  if (!/[0-9]/.test(password)) errors.push('La contraseña debe incluir al menos un número');
  return errors;
}

/**
 * Sanitizar descripción: eliminar emails, teléfonos y etiquetas de contacto
 */
function sanitizeDescription(text) {
  if (!text) return '';
  let s = String(text);
  // Emails
  s = s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/ig, '');
  // Teléfonos (secuencias largas de números con signos comunes)
  s = s.replace(/(\+?\d[\d\-\s\(\)]{6,}\d)/g, '');
  // Palabras clave de contacto
  s = s.replace(/\b(contacto|tel[eé]fono|telefono|celular)\b:?\s*/ig, '');
  // Colapsar espacios
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

/**
 * Ir a página específica
 */
function navigateTo(path) {
  window.location.hash = path;
  window.scrollTo(0, 0);
}

/**
 * Obtener parámetro de URL
 */
function getUrlParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

/**
 * Crear elemento de etiqueta
 */
function createBadge(text, color = 'primary') {
  const badge = document.createElement('span');
  badge.className = `badge badge-${color}`;
  badge.textContent = text;
  return badge;
}

/**
 * Mostrar loading
 */
function showLoading(element) {
  element.innerHTML = '<div class="loader">Cargando...</div>';
}

/**
 * Ocultar loading
 */
function hideLoading(element) {
  element.innerHTML = '';
}

/**
 * Debounce function
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Crear grid de profesores
 * @param {object} teacher
 * @param {string|null} highlightSubject
 * @param {Set<number>|null} favoriteIds ids de profesores favoritos
 */
function createTeacherCard(teacher, highlightSubject = null, favoriteIds = null) {
  const card = document.createElement('div');
  card.className = 'teacher-card';
  card.style.cursor = 'pointer';
  const numericId = Number(teacher && teacher.id);
  const idOk = Number.isFinite(numericId) && numericId > 0;
  card.dataset.teacherId = idOk ? String(numericId) : '';

  const favSet = favoriteIds instanceof Set ? favoriteIds : null;
  const isFav = favSet && idOk ? favSet.has(numericId) : false;
  const heartSvg =
    '<svg class="teacher-card-fav-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  
  // Parsear subjects si es string
  const subjects = Array.isArray(teacher.subjects) 
    ? teacher.subjects 
    : JSON.parse(teacher.subjects || '[]');
  
  // Compute subject display for thumbnail: prefer highlighted subject if present,
  // otherwise show up to 2 subjects and indicate if there are more.
  let subjectDisplay = 'Profesor';
  if (Array.isArray(subjects) && subjects.length > 0) {
    if (highlightSubject && subjects.includes(highlightSubject)) {
      const remaining = subjects.length - 1;
      subjectDisplay = highlightSubject + (remaining > 0 ? ` • y ${remaining} más` : '');
    } else {
      if (subjects.length <= 2) {
        subjectDisplay = subjects.join(' • ');
      } else {
        subjectDisplay = `${subjects[0]} • ${subjects[1]} • +${subjects.length - 2} más`;
      }
    }
  }

  // Soporta varias modalidades en `teacher.modalities` o compatibilidad con `teacher.modality`
  const _modalities = Array.isArray(teacher.modalities)
    ? teacher.modalities
    : (typeof teacher.modalities === 'string' ? JSON.parse(teacher.modalities) : (teacher.modality ? [teacher.modality] : []));

  const modality = (_modalities || []).map(m => m === 'virtual' ? 'Virtual' : 'Presencial').join(' • ');

  // Class size label: if only one student -> particulares, otherwise grupales
  const classLabel = parseInt(teacher.classSize) === 1 ? 'Clases particulares' : 'Clases grupales';

  // Sanitizar descripción antes de mostrar (no mostrar números/contacto)
  const cleanDescFull = sanitizeDescription(teacher.description || '');
  const descPreview = cleanDescFull.substring(0, 120) + (cleanDescFull.length > 120 ? '...' : '');

  const photoSrc = teacher.photo || '/assets/uploads/default-avatar.svg';
  card.innerHTML = `
    <div class="teacher-card-image">
      <img src="${photoSrc}" alt="${teacher.firstName} ${teacher.lastName}" onerror="this.onerror=null;this.src='/assets/uploads/default-avatar.svg'" />
    </div>
    <div class="teacher-card-content">
      <div class="teacher-card-head">
        <div class="teacher-card-name">${teacher.firstName} ${teacher.lastName}</div>
        <button type="button" class="teacher-card-fav${isFav ? ' is-favorite' : ''}" data-fav-teacher-id="${idOk ? numericId : ''}" aria-label="Marcar favorito" aria-pressed="${isFav ? 'true' : 'false'}" title="Favorito" ${idOk ? '' : 'disabled'}>${heartSvg}</button>
      </div>
      <div class="teacher-card-subject">${subjectDisplay}</div>
      <div class="teacher-card-meta">
        <span>${modality}</span>
        <span>${classLabel}</span>
      </div>
      <div class="teacher-card-description">${descPreview}</div>
    </div>
  `;

  const favBtn = card.querySelector('.teacher-card-fav');
  if (favBtn && idOk) {
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.app && typeof window.app.onFavoriteClick === 'function') {
        window.app.onFavoriteClick(numericId, e);
      }
    });
  }

  card.addEventListener('click', (e) => {
    if (e.target.closest('.teacher-card-fav')) return;
    if (idOk) window.location.hash = `teacher/${numericId}`;
  });

  return card;
}

/**
 * Validar edad
 */
function validateAge(age) {
  const ageInt = parseInt(age);
  return ageInt >= 18 && ageInt <= 100;
}

/**
 * Validar cantidad de alumnos
 */
function validateClassSize(size) {
  const sizeInt = parseInt(size);
  return sizeInt > 0 && sizeInt <= 40;
}

function isPositiveIntegerString(value) {
  if (value == null) return false;
  const t = String(value).trim();
  return /^[1-9]\d*$/.test(t);
}

function isApartmentValueValid(value) {
  if (value == null) return true;
  const t = String(value).trim();
  if (!t) return true;
  return /^[A-Za-z0-9\s]+$/.test(t);
}

/**
 * Smooth scroll
 */
function smoothScroll(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Copiar al portapapeles
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showAlert('Copiado al portapapeles', 'success');
  } catch (err) {
    showAlert('Error al copiar', 'error');
  }
}

/** Dirección presencial: calle + número (+ dpto). */
function formatTeacherLocation(teacher) {
  if (!teacher) return '';
  const street = String(teacher.locationStreet || '').trim();
  const number = String(teacher.locationNumber || '').trim();
  const apt = String(teacher.locationApartment || '').trim();
  if (street && number) return apt ? `${street} ${number}, Dpto. ${apt}` : `${street} ${number}`;
  return String(teacher.location || '').trim();
}

function collectLocationFromForm(prefix = '') {
  const p = prefix ? `${prefix}` : '';
  return {
    locationStreet: (document.getElementById(`${p}locationStreet`)?.value || '').trim(),
    locationNumber: (document.getElementById(`${p}locationNumber`)?.value || '').trim(),
    locationApartment: (document.getElementById(`${p}locationApartment`)?.value || '').trim() || null
  };
}

function locationFieldsHtml(values = {}, idPrefix = '') {
  const p = idPrefix;
  const street = values.locationStreet || '';
  const number = values.locationNumber || '';
  const apt = values.locationApartment || '';
  return `
    <div class="location-fields-grid">
      <div class="form-group required">
        <label for="${p}locationStreet">Calle</label>
        <input type="text" id="${p}locationStreet" name="locationStreet" value="${street}" placeholder="Ej: Av. Corrientes" />
        <div class="form-error"></div>
      </div>
      <div class="form-group required">
        <label for="${p}locationNumber">Número</label>
        <input type="text" id="${p}locationNumber" name="locationNumber" value="${number}" placeholder="Ej: 1234" inputmode="numeric" pattern="[0-9]*" />
        <div class="form-error"></div>
      </div>
      <div class="form-group">
        <label for="${p}locationApartment">Depto / Piso (opcional)</label>
        <input type="text" id="${p}locationApartment" name="locationApartment" value="${apt}" placeholder="Ej: 4B" />
        <div class="form-error"></div>
      </div>
    </div>`;
}
