const fs = require('fs');

// 1. Modificar backend/services/prestamosService.js
let svc = fs.readFileSync('backend/services/prestamosService.js', 'utf8');
svc = svc.replace(
    /function validarFecha\(valor\) \{\s*if \(\!valor\) return null\s*return \/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\.test\(String\(valor\)\)\s*\?\s*String\(valor\)\s*:\s*null\s*\}/,
    `function validarFecha(valor) {\n    if (!valor) return null;\n    const d = new Date(valor);\n    return isNaN(d.getTime()) ? null : d;\n}`
);
fs.writeFileSync('backend/services/prestamosService.js', svc);

// 2. Modificar frontend/src/components/equipos/ModalPrestamo.jsx
let modal = fs.readFileSync('frontend/src/components/equipos/ModalPrestamo.jsx', 'utf8');

modal = modal.replace(
    /const toISODate = \(fecha\) => \{[\s\S]*?return \`\$\{y\}-\$\{m\}-\$\{d\}\`\s*\}/,
    `const toISODate = (fecha) => {\n    const tzOffset = fecha.getTimezoneOffset() * 60000;\n    return new Date(fecha.getTime() - tzOffset).toISOString().slice(0, 16);\n}`
);
modal = modal.replace(/type="date"/g, 'type="datetime-local"');

fs.writeFileSync('frontend/src/components/equipos/ModalPrestamo.jsx', modal);
