const fs = require('fs');

let modal = fs.readFileSync('frontend/src/components/equipos/ModalPrestamo.jsx', 'utf8');

const tz = 'new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)';
const tz7 = 'new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000 + 7 * 86400000).toISOString().slice(0, 16)';

modal = modal.replace(
    /useState\(toISODate\(new Date\(\)\)\)/g,
    `useState(${tz})`
);
modal = modal.replace(
    /useState\(\s*toISODate\(new Date\(Date\.now\(\) \+ 7 \* 86400000\)\)\s*\)/g,
    `useState(${tz7})`
);
modal = modal.replace(
    /min=\{toISODate\(new Date\(\)\)\}/g,
    `min={${tz}}`
);

fs.writeFileSync('frontend/src/components/equipos/ModalPrestamo.jsx', modal);
