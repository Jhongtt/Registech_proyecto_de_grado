const fs = require('fs');

let pres = fs.readFileSync('frontend/src/components/Prestamos.jsx', 'utf8');

const tz = 'new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)';
const tz7 = 'new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000 + 7 * 86400000).toISOString().slice(0, 16)';

pres = pres.replace(
    /toISODate\(new Date\(\)\)/g,
    tz
);
pres = pres.replace(
    /toISODate\(\s*new Date\(\s*Date\.now\(\) \+ 7 \* 86400000\s*\)\s*\)/g,
    tz7
);
pres = pres.replace(/type="date"/g, 'type="datetime-local"');

fs.writeFileSync('frontend/src/components/Prestamos.jsx', pres);
