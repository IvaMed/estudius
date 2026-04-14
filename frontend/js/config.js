// Configuración centralizada de recursos (ruta de logo, etc.)
// Ruta por defecto para el logo dentro de frontend/assets (puedes reemplazar el archivo manualmente)
const SITE_LOGO_PATH = 'assets/uploads/logo.svg';

// Asignar el logo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.getElementById('siteLogo');
  if (logo) logo.src = SITE_LOGO_PATH;

  const footerLogo = document.getElementById('footerLogo');
  if (footerLogo) footerLogo.src = SITE_LOGO_PATH;
});
