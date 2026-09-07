const db = require('../lib/db')

exports.getActividadReciente = async (limit = 15) => {
    const { rows } = await db.query(
        `SELECT
            a.usuario,
            u.nombre AS nombre_usuario,
            a.accion,
            a.fecha
        FROM auditoria a
        LEFT JOIN usuarios u ON u.usuario = a.usuario
        ORDER BY a.fecha DESC
        LIMIT $1`,
        [limit]
    )
    return rows
}
