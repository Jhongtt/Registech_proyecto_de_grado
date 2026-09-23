const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    try {
        await pool.query(`ALTER TABLE prestamos ALTER COLUMN fecha_prestamo TYPE TIMESTAMP WITH TIME ZONE;`);
        await pool.query(`ALTER TABLE prestamos ALTER COLUMN fecha_devolucion TYPE TIMESTAMP WITH TIME ZONE;`);
        console.log("Success");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
main();
