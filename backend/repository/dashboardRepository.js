const db = require('../lib/db')

exports.getStats = async () => {
    const [totalEquipos, disponibles, asignados, mantenimiento, baja] = await Promise.all([
        db.query('SELECT COUNT(*)::int as count FROM equipos'),
        db.query(`SELECT COUNT(*)::int as count FROM equipos WHERE estado = 'Disponible'`),
        db.query(`SELECT COUNT(*)::int as count FROM equipos WHERE estado = 'Asignado'`),
        db.query(`SELECT COUNT(*)::int as count FROM equipos WHERE estado = 'En mantenimiento'`),
        db.query(`SELECT COUNT(*)::int as count FROM equipos WHERE estado = 'Baja'`),
    ])

    return {
        total: totalEquipos.rows[0].count,
        disponibles: disponibles.rows[0].count,
        asignados: asignados.rows[0].count,
        mantenimiento: mantenimiento.rows[0].count,
        baja: baja.rows[0].count,
    }
}

exports.getEquiposPorArea = async () => {
    const { rows } = await db.query(
        `SELECT area, COUNT(*)::int as total
         FROM equipos
         GROUP BY area
         ORDER BY total DESC`
    )

    return rows
}

exports.getPrestamosPorArea = async () => {
    const { rows } = await db.query(
        `SELECT p.area, COUNT(DISTINCT p.id_prestamo)::int as total
         FROM prestamos p
         WHERE p.area IS NOT NULL
         GROUP BY p.area
         ORDER BY total DESC`
    )

    return rows
}

exports.getEquiposPorEstado = async () => {
    const { rows } = await db.query(
        `SELECT estado, COUNT(*)::int as total
         FROM equipos
         GROUP BY estado
         ORDER BY total DESC`
    )

    return rows
}

exports.getPrestamosRecientes = async (limit = 10) => {
    const { rows } = await db.query(
        `SELECT 
            p.id_prestamo,
            STRING_AGG(pe.num_serie, ', ') AS num_serie,
            p.fecha_prestamo,
            p.fecha_devolucion,
            p.estado,
            p.observaciones,
            p.area AS equipo_area,
            STRING_AGG(e.equipo, ', ') AS equipo,
            STRING_AGG(e.descripcion, ', ') AS descripcion
         FROM prestamos p
         JOIN prestamo_equipos pe 
            ON p.id_prestamo = pe.id_prestamo
         JOIN equipos e 
            ON pe.num_serie = e.num_serie
         GROUP BY 
            p.id_prestamo,
            p.fecha_prestamo,
            p.fecha_devolucion,
            p.estado,
            p.observaciones,
            p.area
         ORDER BY p.fecha_prestamo DESC
         LIMIT $1`,
        [limit]
    )

    return rows
}