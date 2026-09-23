const fs = require('fs');
let content = fs.readFileSync('backend/controllers/prestamosController.js', 'utf8');

// Replace `await emailService.enviarReciboPrestamo` for CREAR PRESTAMO
content = content.replace(
    /await\s+emailService\.enviarReciboPrestamo\(\{([\s\S]*?)\}\)/,
    `emailService.enviarReciboPrestamo({$1}).catch(e => console.error('Background email error:', e))`
);

// Replace `await emailService.enviarReciboDevolucion` for DEVOLVER PRESTAMO
content = content.replace(
    /await\s+emailService\.enviarReciboDevolucion\(\{([\s\S]*?)\}\)/g,
    `emailService.enviarReciboDevolucion({$1}).catch(e => console.error('Background email error:', e))`
);

fs.writeFileSync('backend/controllers/prestamosController.js', content);
