// Cierre limpio de conexiones después de cada archivo de tests.
// Evita que Prisma y el cron de CSRF mantengan vivo el proceso
// y elimina el warning de "worker process failed to exit gracefully".
afterAll(async () => {
    try {
        const prisma = require('../lib/prisma')
        await prisma.$disconnect()
    } catch {}
    try {
        const { detenerCleanup } = require('../middlewares/csrf')
        detenerCleanup()
    } catch {}
})