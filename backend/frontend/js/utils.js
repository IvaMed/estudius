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

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result.message || 'Error en la solicitud');
    // Adjuntar detalles de validación si vienen del servidor
    error.details = result.errors || result.details || null;
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

  card.innerHTML = `
    <div class="teacher-card-image">
      ${teacher.photo ? `<img src="${teacher.photo}" alt="${teacher.firstName} ${teacher.lastName}">` : '👨‍🏫'}
    </div>
    <div class="teacher-card-content">
      <div class="teacher-card-name">${teacher.firstName} ${teacher.lastName}</div>
      <div class="teacher-card-subject">${subjectDisplay}</div>
      <div class="teacher-card-meta">
        <span>${modality}</span>
        <span>${classLabel}</span>
      </div>
      <div class="teacher-card-description">${(teacher.description || '').substring(0, 120)}${(teacher.description && teacher.description.length > 120) ? '...' : ''}</div>
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
  return sizeInt > 0 && sizeInt < 30;
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
