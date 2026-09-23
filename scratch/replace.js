const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/equipos/EquipoCard.jsx', 'utf8');
content = content.replace(
  /\{registro\.fecha_prestamo\s*\?\s*String\(\s*registro\.fecha_prestamo\s*\)\.substring\(\s*0,\s*10\s*\)\s*:\s*'No registrada'\}/g,
  "{registro.fecha_prestamo ? formatDateTime(registro.fecha_prestamo) : 'No registrada'}"
);
content = content.replace(
  /\{registro\.fecha_devolucion\s*\?\s*String\(\s*registro\.fecha_devolucion\s*\)\.substring\(\s*0,\s*10\s*\)\s*:\s*'Actualmente'\}/g,
  "{registro.fecha_devolucion ? formatDateTime(registro.fecha_devolucion) : 'Actualmente'}"
);
fs.writeFileSync('frontend/src/components/equipos/EquipoCard.jsx', content);
