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
    
    // Estado de filtros
    this.filters = {
      subject: null,
      modalities: [] // array de modalidades seleccionadas
    };
    
    this.init();
  }

  init() {
    console.log('Inicializando Estudius...');
    this.setupEventListeners();
    this.renderPage();
    this.loadTeachers();
  }

  setupEventListeners() {
    // Header logo - ir a home
    const headerLogo = document.querySelector('.header-left');
    if (headerLogo) {
      headerLogo.addEventListener('click', () => this.navigateToHome());
    }

    // Menú de navegación
    const addTeacherBtn = document.querySelector('[data-page="add-teacher"]');
    const listTeachersBtn = document.querySelector('[data-page="list-teachers"]');

    if (addTeacherBtn) {
      addTeacherBtn.addEventListener('click', () => this.showPage('add-teacher'));
    }

    if (listTeachersBtn) {
      listTeachersBtn.addEventListener('click', () => this.showPage('list-teachers'));
    }

    // Manejo de cambio de hash (URL)
    window.addEventListener('hashchange', () => this.handleRouteChange());
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1) || '/';
    
    if (hash.startsWith('teacher/')) {
      const teacherId = hash.replace('teacher/', '');
      this.showTeacherDetail(parseInt(teacherId));
    } else {
      this.showPage(hash || 'home');
    }
  }

  navigateToHome() {
    window.location.hash = '';
    this.showPage('home');
  }

  showPage(pageName) {
    this.currentPage = pageName;
    this.renderPage();
  }

  renderPage() {
    const main = document.querySelector('main');
    
    switch (this.currentPage) {
      case 'add-teacher':
        this.renderAddTeacherPage(main);
        break;
      case 'list-teachers':
        this.renderListTeachersPage(main);
        break;
      case 'teacher-detail':
        if (this.currentTeacher) {
          this.showTeacherDetail(this.currentTeacher.id);
        }
        break;
      case 'home':
      default:
        this.renderHomePage(main);
    }
  }

  async renderHomePage(main) {
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
        <section class="filter-section" style="margin-bottom: var(--spacing-xl); padding: var(--spacing-lg); background: #f5f5f5; border-radius: var(--border-radius);">
          <h3 class="section-title" style="margin-bottom: var(--spacing-md);">Filtrar por Modalidad</h3>
          <div style="display: flex; gap: var(--spacing-lg); flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
              <input type="checkbox" name="modality-filter" value="virtual" /> 
              🖥️ Virtual
            </label>
            <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
              <input type="checkbox" name="modality-filter" value="presencial" /> 
              📍 Presencial
            </label>
          </div>
        </section>

        <!-- Sección de categorías -->
        <section class="categories-section">
          <h3 class="section-title">Explora por Materia</h3>
          <div class="categories-grid">
            <button class="category-btn" data-filter-subject="Programación">💻 Programación</button>
            <button class="category-btn" data-filter-subject="Matemática">📐 Matemática</button>
            <button class="category-btn" data-filter-subject="Inglés">🌐 Inglés</button>
            <button class="category-btn" data-filter-subject="Historia">📚 Historia</button>
            <button class="category-btn" data-filter-subject="Física">⚛️ Física</button>
            <button class="category-btn" id="verTodasBtn" style="font-weight: bold;">👁️ Ver Todas (41)</button>
          </div>
          <!-- Dropdown menu para Ver Todas -->
          <div id="subjectsDropdown" style="display: none; margin-top: var(--spacing-lg); padding: var(--spacing-lg); background: #f9f9f9; border: 1px solid #ddd; border-radius: var(--border-radius); max-height: 400px; overflow-y: auto;">
            <h4 style="margin-bottom: var(--spacing-md);">Selecciona una materia:</h4>
            <div id="subjectsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--spacing-md);">
              <!-- Se llena dinámicamente -->
            </div>
          </div>
        </section>

        <!-- Botón para agregar profesor -->
        <section style="margin: var(--spacing-2xl) 0; text-align: center;">
          <a href="#add-teacher" class="btn btn-primary" style="display: inline-block; padding: var(--spacing-lg) var(--spacing-2xl); text-decoration: none; color: white;">
            ➕ Agregar un profesor
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
    await this.loadRecommendedTeachers();

    // Búsqueda dinámica (debounced)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      const debounced = debounce((e) => {
        const q = (e.target.value || '').trim();
        this.searchTeachers(q);
      }, 250);
      searchInput.addEventListener('input', debounced);
    }

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
    const subjectsDropdown = document.getElementById('subjectsDropdown');
    const subjectsGrid = document.getElementById('subjectsGrid');

    // Nuevo comportamiento: expandir/colapsar el grid de materias en el mismo lugar
    verTodasBtn.addEventListener('click', () => {
      const categoriesGrid = document.querySelector('.categories-grid');
      const isExpanded = categoriesGrid.classList.contains('expanded-all-subjects');

      if (!isExpanded) {
        // Construir HTML por categorías (ordenadas)
        const categoriesHtml = Object.keys(SUBJECTS).map(category => {
          const subjects = Array.isArray(SUBJECTS[category]) ? [...SUBJECTS[category]].sort((a,b) => a.localeCompare(b, 'es')) : [];
          const subjectsBtns = subjects.map(s => `<button class="category-btn" data-filter-subject="${s}">${s}</button>`).join('');
          return `<div class="expanded-category" style="margin-bottom: var(--spacing-lg);">
                    <h4 style="margin-bottom: var(--spacing-sm); color: var(--isotipo-dark);">${category}</h4>
                    <div class="expanded-subjects" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-sm);">${subjectsBtns}</div>
                  </div>`;
        }).join('');

        categoriesGrid.innerHTML = categoriesHtml + `<div style="margin-top: var(--spacing-md); text-align:center;"><button id="verMenosBtn" class="category-btn" style="font-weight: bold;">▲ Ver menos</button></div>`;

        categoriesGrid.classList.add('expanded-all-subjects');

        // Re-agregar listeners a los botones generados
        categoriesGrid.querySelectorAll('.category-btn').forEach(btn => {
          if (btn.id === 'verMenosBtn') return;
          btn.addEventListener('click', (e) => {
            const subject = btn.dataset.filterSubject;
            this.updateCategorySelectionUI(subject);
            this.filterBySubject(subject);
          });
        });

        // Listener para ver menos
        const verMenosBtn = document.getElementById('verMenosBtn');
        verMenosBtn.addEventListener('click', (e) => {
          // Restaurar grid original (las 6 botones y Ver Todas)
          categoriesGrid.innerHTML = `
            <button class="category-btn" data-filter-subject="Programación">💻 Programación</button>
            <button class="category-btn" data-filter-subject="Matemática">📐 Matemática</button>
            <button class="category-btn" data-filter-subject="Inglés">🌐 Inglés</button>
            <button class="category-btn" data-filter-subject="Historia">📚 Historia</button>
            <button class="category-btn" data-filter-subject="Física">⚛️ Física</button>
            <button class="category-btn" id="verTodasBtn" style="font-weight: bold;">👁️ Ver Todas</button>
          `;

          categoriesGrid.classList.remove('expanded-all-subjects');
          // Rebind original event listeners (simple approach: re-render page controls)
          this.renderPage();
        });
      }
    });

    // Event listeners para checkboxes de modalidad
    document.querySelectorAll('input[name="modality-filter"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.currentPage_pagination = 1;
        const selectedModalities = Array.from(document.querySelectorAll('input[name="modality-filter"]:checked')).map(cb => cb.value);
        
        let filtered = [...this.allTeachers];
        
        // Primero filtrar por materia si hay una seleccionada
        const currentSubjectBtn = document.querySelector('.category-btn[data-filter-subject]');
        if (currentSubjectBtn && this.filters.subject) {
          filtered = filtered.filter(t => {
            let subjects = t.subjects;
            if (typeof subjects === 'string') {
              subjects = JSON.parse(subjects || '[]');
            }
            return Array.isArray(subjects) && subjects.includes(this.filters.subject);
          });
        }
        
        // Luego filtrar por modalidad (soporta teacher.modalities array)
        if (selectedModalities.length > 0) {
          filtered = filtered.filter(t => {
            const modalities = Array.isArray(t.modalities) ? t.modalities : (typeof t.modalities === 'string' ? JSON.parse(t.modalities || '[]') : (t.modality ? [t.modality] : []));
            return Array.isArray(modalities) && modalities.some(m => selectedModalities.includes(m));
          });
        }
        
        this.displayTeachers(filtered);
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
    
    // Guardar el filtro
    this.filters.subject = subject === 'all' || !subject ? null : subject;
    
    // Si es "all", mostrar todos
    if (!this.filters.subject) {
      this.displayTeachers(this.allTeachers);
      return;
    }

    // Filtrar solo por la materia seleccionada
    const filtered = this.allTeachers.filter(teacher => {
      // Parsear subjects
      let subjects = teacher.subjects;
      if (typeof subjects === 'string') {
        subjects = JSON.parse(subjects || '[]');
      }
      
      // Verificar que sea array y contenga la materia
      if (Array.isArray(subjects)) {
        const hasSubject = subjects.includes(this.filters.subject);
        return hasSubject;
      }
      
      return false;
    });

    console.log(`Resultado: ${filtered.length} profesores de "${this.filters.subject}"`);
    this.displayTeachers(filtered);
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
        this.allTeachers = result.data.map(teacher => ({
          ...teacher,
          subjects: typeof teacher.subjects === 'string' ? JSON.parse(teacher.subjects) : teacher.subjects,
          modalities: teacher.modalities ? (typeof teacher.modalities === 'string' ? JSON.parse(teacher.modalities) : teacher.modalities) : (teacher.modality ? [teacher.modality] : [])
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

  displayTeachers(teachers) {
    const grid = document.getElementById('recommendedTeachers');
    grid.innerHTML = '';

    // Guardar la lista actual (para paginación y acciones posteriores)
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
      grid.appendChild(createTeacherCard(teacher, this.filters.subject));
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

    let html = '<button id="prevBtn" class="btn btn-outline">← Anterior</button>';
    html += '<span style="margin: 0 var(--spacing-md);">Página ';
    html += `<input type="number" id="pageInput" min="1" max="${pages}" value="${this.currentPage_pagination}" style="width: 50px; text-align: center;"> `;
    html += `de ${pages}</span>`;
    html += '<button id="nextBtn" class="btn btn-outline">Siguiente →</button>';

    pagination.innerHTML = html;

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

    document.getElementById('pageInput').addEventListener('change', (e) => {
      const page = parseInt(e.target.value);
      if (page >= 1 && page <= pages) {
        this.currentPage_pagination = page;
        this.displayTeachers(this.currentDisplayedTeachers);
      }
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

    // If query is empty or only spaces, treat as no search: show shuffled results
    if (!q) {
      this.shuffleAndDisplay();
      return;
    }

    const queryLower = q.toLowerCase();
    const filtered = this.allTeachers.filter(t => {
      const name = `${t.firstName} ${t.lastName}`.toLowerCase();
      const desc = (t.description || '').toLowerCase();
      return name.includes(queryLower) || desc.includes(queryLower);
    });
    this.displayTeachers(filtered);
  }

  renderAddTeacherPage(main) {
    main.innerHTML = `
      <div class="container" style="max-width: 1000px; padding-top: var(--spacing-2xl);">
        <h1 style="color: var(--isotipo-dark); margin-bottom: var(--spacing-2xl);">Agregar Nuevo Profesor</h1>

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
                    <div id="photoPreview" style="display: none; border: 2px solid #ddd; border-radius: var(--border-radius); overflow: hidden; background: white;">
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
                  <input type="number" id="classSize" name="classSize" min="1" max="29" required />
                  <div class="form-error"></div>
                </div>

                <div class="form-group required">
                  <label>Modalidad</label>
                  <div style="display: flex; gap: var(--spacing-md); align-items: center;">
                    <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                      <input type="checkbox" name="modalities" value="virtual" />
                      🖥️ Virtual
                    </label>
                    <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                      <input type="checkbox" name="modalities" value="presencial" />
                      📍 Presencial
                    </label>
                  </div>
                  <div class="form-error"></div>
                </div>
              </div>

              <div class="form-group required">
                <label for="schedules">Horarios</label>
                <textarea id="schedules" name="schedules" placeholder="Ej: Lunes a viernes 18:00-19:00"></textarea>
                <div class="form-error"></div>
              </div>

              <div class="form-group" id="locationGroup" style="display: none;">
                <label for="location">Ubicación <span style="color: red;">*</span></label>
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
        document.getElementById('location').required = true;
      } else {
        locationGroup.style.display = 'none';
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
    });
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
    const schedules = document.getElementById('schedules').value.trim();
    const location = document.getElementById('location').value.trim();

    if (!firstName) errors.push('El nombre es requerido');
    if (!lastName) errors.push('El apellido es requerido');
    if (isNaN(age) || age < 1 || age > 149) errors.push('La edad debe estar entre 1 y 149 años');
    if (!email || !validateEmail(email)) errors.push('El mail no cumple el formato adecuado');
    if (subject_checkboxes.length === 0) errors.push('Debes seleccionar al menos una materia');
    if (!description) errors.push('La descripción del profesor es requerida');
    if (!curriculum) errors.push('El temario/currículo es requerido');
    if (isNaN(classSize) || classSize < 1 || classSize > 29) errors.push('La cantidad de alumnos debe estar entre 1 y 29');
    if (!modalities || modalities.length === 0) errors.push('La modalidad es requerida');
    if (!schedules) errors.push('Los horarios son requeridos');
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
    
    for (const [category, subjects] of Object.entries(SUBJECTS)) {
      const categoryDiv = document.createElement('div');
      categoryDiv.style.marginBottom = 'var(--spacing-lg)';

      const categoryTitle = document.createElement('h4');
      categoryTitle.textContent = category;
      categoryTitle.style.color = 'var(--isotipo-dark)';
      categoryTitle.style.marginBottom = 'var(--spacing-sm)';
      categoryDiv.appendChild(categoryTitle);

      const subjectsDiv = document.createElement('div');
      subjectsDiv.style.display = 'grid';
      subjectsDiv.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
      subjectsDiv.style.gap = 'var(--spacing-md)';

      subjects.forEach(subject => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.style.cursor = 'pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'subjects';
        checkbox.value = subject;

        const labelText = document.createElement('span');
        labelText.style.margin = '0';
        labelText.style.fontWeight = '400';
        labelText.textContent = subject;

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
      schedules: document.getElementById('schedules').value.trim(),
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
      errors.push('La cantidad de alumnos debe ser un número entre 1 y 29');
      setFieldError('classSize', 'Cantidad debe estar entre 1 y 29');
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

    if (!formData.schedules) {
      errors.push('Los horarios son requeridos');
      setFieldError('schedules', 'Horarios requeridos');
      hasErrors = true;
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
        <h1 style="color: var(--isotipo-dark); margin-bottom: var(--spacing-2xl);">Listado de Profesores</h1>

        <div id="teachersList" class="teachers-grid">
          <p>Cargando profesores...</p>
        </div>

        <div id="listPagination" class="pagination"></div>
      </div>
    `;

    this.loadAllTeachers();
  }

  async loadAllTeachers() {
    try {
      const result = await TeacherAPI.getAllTeachers();
      
      if (result.data && result.data.length > 0) {
        // Parse subjects and modalities
        this.allTeachers = result.data.map(teacher => ({
          ...teacher,
          subjects: typeof teacher.subjects === 'string' ? JSON.parse(teacher.subjects) : teacher.subjects,
          modalities: teacher.modalities ? (typeof teacher.modalities === 'string' ? JSON.parse(teacher.modalities) : teacher.modalities) : (teacher.modality ? [teacher.modality] : [])
        }));
        this.displayListTeachers(this.allTeachers);
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
      grid.appendChild(createTeacherCard(teacher, this.filters.subject));
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

    let html = '<button id="prevBtn2" class="btn btn-outline">← Anterior</button>';
    html += '<span style="margin: 0 var(--spacing-md);">Página ';
    html += `<input type="number" id="pageInput2" min="1" max="${pages}" value="${this.currentPage_pagination}" style="width: 50px; text-align: center;"> `;
    html += `de ${pages}</span>`;
    html += '<button id="nextBtn2" class="btn btn-outline">Siguiente →</button>';

    pagination.innerHTML = html;

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

    document.getElementById('pageInput2').addEventListener('change', (e) => {
      const page = parseInt(e.target.value);
      if (page >= 1 && page <= pages) {
        this.currentPage_pagination = page;
        this.displayListTeachers(this.currentDisplayedTeachers);
      }
    });
  }

  async showTeacherDetail(teacherId) {
    try {
      const result = await TeacherAPI.getTeacherById(teacherId);
      const teacher = result.data;

      const main = document.querySelector('main');
      main.innerHTML = `
        <div class="detail-header">
          <div class="detail-header-left">
            <span class="detail-header-back" onclick="window.history.back()">←</span>
            <h1>${teacher.firstName} ${teacher.lastName}</h1>
          </div>
        </div>

        <div class="container">
          <div class="detail-content">
            <div class="detail-images">
              ${teacher.photo ? `<div class="detail-image"><img src="${teacher.photo}" alt="${teacher.firstName}"></div>` : '<div class="detail-image">📚</div>'}
            </div>

            <div class="detail-info">
              <div class="detail-info-section">
                <h3>Información Personal</h3>
                <div class="detail-info-item">
                  <span class="detail-info-label">Edad:</span>
                  <span class="detail-info-value">${teacher.age} años</span>
                </div>
                <div style="background: #e7f3ff; border-left: 4px solid #0066cc; padding: var(--spacing-md); border-radius: 4px; margin: var(--spacing-md) 0; font-size: var(--font-size-sm); color: #004499;">
                  <strong>ℹ️ Información de contacto (visible solo para administradores):</strong>
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
              </div>

              <div class="detail-info-section">
                <h3>Clases</h3>
                <div class="detail-info-item">
                  <span class="detail-info-label">Modalidad:</span>
                  <span class="detail-info-value">${(Array.isArray(teacher.modalities) ? teacher.modalities : (teacher.modalities ? JSON.parse(teacher.modalities) : (teacher.modality ? [teacher.modality] : []))).map(m => m === 'virtual' ? '📱 Virtual' : '📍 Presencial').join(' • ')}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-label">Tipo de clase:</span>
                  <span class="detail-info-value">${parseInt(teacher.classSize) === 1 ? 'Clases particulares' : `Clases grupales • ${teacher.classSize} alumnos`}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-label">Materias:</span>
                  <span class="detail-info-value">${teacher.subjects.join(', ')}</span>
                </div>
                <div class="detail-info-item">
                  <span class="detail-info-label">Horarios:</span>
                  <span class="detail-info-value">${teacher.schedules}</span>
                </div>
                ${teacher.location ? `
                <div class="detail-info-item">
                  <span class="detail-info-label">Ubicación:</span>
                  <span class="detail-info-value">${teacher.location}</span>
                </div>
                ` : ''}
              </div>

              <div class="detail-info-section">
                <h3>Descripción</h3>
                <p>${teacher.description}</p>
              </div>

              <div class="detail-info-section">
                <h3>Temario</h3>
                <p>${teacher.curriculum}</p>
              </div>

              <div class="detail-admin-actions" style="display: flex; gap: var(--spacing-lg); margin-top: var(--spacing-2xl); padding-top: var(--spacing-xl); border-top: 2px solid #e7e7e7;">
                <button id="editTeacherBtn" class="btn btn-primary" style="flex: 1; padding: var(--spacing-md); background: #274580; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600; font-size: var(--font-size-sm);">
                  ✏️ Editar Profesor
                </button>
                <button id="deleteTeacherBtn" class="btn btn-danger" style="flex: 1; padding: var(--spacing-md); background: #d9534f; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-weight: 600; font-size: var(--font-size-sm);">
                  🗑️ Eliminar Profesor
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Agregar event listeners para botones de admin
      const editBtn = document.getElementById('editTeacherBtn');
      const deleteBtn = document.getElementById('deleteTeacherBtn');

      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.showEditTeacherPage(teacher);
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          this.showDeleteConfirmation(teacher);
        });
      }
    } catch (error) {
      console.error('Error:', error);
      document.querySelector('main').innerHTML = '<p>Error al cargar detalles del profesor</p>';
    }
  }

  async showEditTeacherPage(teacher) {
    const main = document.querySelector('main');

    // Construir las opciones de materias con marcado según el profesor
    const subjectsOptions = SUBJECTS_FLAT.map(subject => `
      <label style="display: inline-flex; align-items: center; margin-right: var(--spacing-lg); margin-bottom: var(--spacing-sm);">
        <input type="checkbox" name="subjects" value="${subject}" ${Array.isArray(teacher.subjects) && teacher.subjects.includes(subject) ? 'checked' : ''} />
        <span style="margin-left: var(--spacing-sm); cursor: pointer;">${subject}</span>
      </label>
    `).join('');

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
                <div class="form-group-checkbox" style="display: flex; flex-wrap: wrap;">${subjectsOptions}</div>
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

              <div class="form-row">
                <div class="form-group">
                  <label>Modalidad</label>
                  <div style="display: flex; gap: var(--spacing-md); align-items: center;">
                    <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                      <input type="checkbox" name="modalities" value="virtual" ${Array.isArray(teacher.modalities) && teacher.modalities.includes('virtual') ? 'checked' : ''} />
                      🖥️ Virtual
                    </label>
                    <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                      <input type="checkbox" name="modalities" value="presencial" ${Array.isArray(teacher.modalities) && teacher.modalities.includes('presencial') ? 'checked' : ''} />
                      📍 Presencial
                    </label>
                  </div>
                  <div class="form-error"></div>
                </div>

                <div class="form-group required">
                  <label for="classSize">Cantidad de Alumnos</label>
                  <input type="number" id="classSize" name="classSize" min="1" max="30" value="${teacher.classSize}" required />
                  <div class="form-error"></div>
                </div>

                <div class="form-group required">
                  <label for="schedules">Horarios</label>
                  <input type="text" id="schedules" name="schedules" placeholder="ej: Lu-Mi-Vie 15:00-17:00" value="${teacher.schedules}" required />
                  <div class="form-error"></div>
                </div>
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

    // Cargar materias dinámicamente
    const subjectsContainer = document.querySelector('.form-group-checkbox');
    if (subjectsContainer) {
      subjectsContainer.innerHTML = SUBJECTS_FLAT.map(subject => `
        <label style="display: inline-flex; align-items: center; margin-right: var(--spacing-lg); margin-bottom: var(--spacing-sm);">
          <input type="checkbox" name="subjects" value="${subject}" ${teacher.subjects.includes(subject) ? 'checked' : ''} />
          <span style="margin-left: var(--spacing-sm); cursor: pointer;">${subject}</span>
        </label>
      `).join('');
    }

    // Agregar listener para submit del formulario
    const editForm = document.getElementById('editTeacherForm');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleEditTeacher(teacher.id);
      });

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
      schedules: data.get('schedules'),
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
      classSize: [!validateClassSize(updateData.classSize), 'La cantidad de alumnos debe estar entre 1 y 30'],
      schedules: [!updateData.schedules, 'Los horarios son requeridos']
    };

    let errors = [];
    for (const [field, [isInvalid, message]] of Object.entries(validations)) {
      if (isInvalid) {
        errors.push(message);
        setFieldError(field, message);
      }
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
        window.location.hash = `/teacher/${teacherId}`;
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
