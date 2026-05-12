// ========================================
// UTILIDADES - Funciones auxiliares
// ========================================

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
 */
function createTeacherCard(teacher, highlightSubject = null) {
  const card = document.createElement('div');
  card.className = 'teacher-card';
  card.style.cursor = 'pointer';
  
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
      <div class="teacher-card-name">${teacher.firstName} ${teacher.lastName}</div>
      <div class="teacher-card-subject">${subjectDisplay}</div>
      <div class="teacher-card-meta">
        <span>${modality}</span>
        <span>${classLabel}</span>
      </div>
      <div class="teacher-card-description">${descPreview}</div>
    </div>
  `;

  // Navegar al detalle - toda la tarjeta es clickeable
  card.addEventListener('click', () => {
    window.location.hash = `teacher/${teacher.id}`;
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
