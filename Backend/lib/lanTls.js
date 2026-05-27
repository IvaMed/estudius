const selfsigned = require('selfsigned');

/**
 * Certificado autofirmado para Wi‑Fi local (celular).
 * Incluye localhost y las IPv4 LAN detectadas en SAN.
 */
function createLanTlsCredentials(lanIps = []) {
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' }
  ];
  for (const ip of lanIps) {
    if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      altNames.push({ type: 7, ip });
    }
  }

  const attrs = [{ name: 'commonName', value: 'Estudius LAN' }];
  const pems = selfsigned.generate(attrs, {
    keySize: 2048,
    days: 825,
    algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames }]
  });

  return {
    key: pems.private,
    cert: pems.cert
  };
}

module.exports = { createLanTlsCredentials };
