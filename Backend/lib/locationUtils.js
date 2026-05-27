/**
 * Ubicación presencial: calle, número y departamento (opcional).
 */

function formatTeacherAddress({ locationStreet, locationNumber, locationApartment, location } = {}) {
  const street = String(locationStreet || '').trim();
  const number = String(locationNumber || '').trim();
  const apt = String(locationApartment || '').trim();
  if (street && number) {
    return apt ? `${street} ${number}, Dpto. ${apt}` : `${street} ${number}`;
  }
  const legacy = String(location || '').trim();
  return legacy || null;
}

function normalizeLocationPayload(data = {}) {
  const street = data.locationStreet != null ? String(data.locationStreet).trim() : '';
  const number = data.locationNumber != null ? String(data.locationNumber).trim() : '';
  const apt =
    data.locationApartment != null ? String(data.locationApartment).trim() : '';
  const location = formatTeacherAddress({
    locationStreet: street,
    locationNumber: number,
    locationApartment: apt,
    location: data.location
  });
  return {
    locationStreet: street || null,
    locationNumber: number || null,
    locationApartment: apt || null,
    location
  };
}

function locationMatchesSearch(teacher, searchNorm) {
  if (!searchNorm) return false;
  const parts = [
    teacher.locationStreet,
    teacher.locationNumber,
    teacher.locationApartment,
    teacher.location
  ]
    .filter(Boolean)
    .map((p) =>
      String(p)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    );
  const hay = parts.join(' ');
  return hay.includes(searchNorm);
}

function validatePresencialLocation(data) {
  const { locationStreet, locationNumber } = normalizeLocationPayload(data);
  if (!locationStreet) return { ok: false, message: 'La calle es obligatoria para clases presenciales' };
  if (!locationNumber) return { ok: false, message: 'El número es obligatorio para clases presenciales' };
  return { ok: true };
}

module.exports = {
  formatTeacherAddress,
  normalizeLocationPayload,
  locationMatchesSearch,
  validatePresencialLocation
};
