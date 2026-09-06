const db = require('../lib/db')

exports.findAll = async () => {
    const { rows } = await db.query(`
        SELECT
            id_empleado,
            nombre,
            tipo_documento,
            documento,
            correo,
            area,
            estado
        FROM empleados
        ORDER BY nombre ASC
    `)

    return rows
}

exports.findById = async (id) => {
    const { rows } = await db.query(
        `SELECT * FROM empleados WHERE id_empleado = $1`,
        [id]
    )

    return rows[0] || null
}

exports.findByDocumento = async (documento) => {
    const { rows } = await db.query(
        `SELECT * FROM empleados WHERE documento = $1`,
        [documento]
    )

    return rows[0] || null
}

exports.create = async (data) => {
    const { rows } = await db.query(
        `INSERT INTO empleados
            (nombre, tipo_documento, documento, correo, area, estado)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
            data.nombre,
            data.tipo_documento,
            data.documento,
            data.correo || null,
            data.area,
            data.estado || 'activo'
        ]
    )

    return rows[0]
}

exports.update = async (id, data) => {
    const fields = []
    const values = []
    let idx = 1

    for (const [key, value] of Object.entries(data)) {
        fields.push(`${key} = $${idx}`)
        values.push(value)
        idx++
    }

    values.push(id)

    const { rows } = await db.query(
        `UPDATE empleados
         SET ${fields.join(', ')}
         WHERE id_empleado = $${idx}
         RETURNING *`,
        values
    )

    return rows[0]
}

exports.delete = async (id) => {

    // Verificar si el empleado tiene historial de préstamos
    const { rows } = await db.query(
        `SELECT COUNT(*) AS total
         FROM prestamos
         WHERE id_empleado = $1`,
        [id]
    )

    const totalPrestamos = Number(rows[0].total)

    // Si tiene cualquier préstamo, no se puede eliminar
    if (totalPrestamos > 0) {
        const error = new Error('EMPLEADO_CON_HISTORIAL')
        throw error
    }

    // Si nunca ha tenido préstamos, sí se puede eliminar
    const { rowCount } = await db.query(
        `DELETE FROM empleados
         WHERE id_empleado = $1`,
        [id]
    )

    if (rowCount === 0) {
        const error = new Error('NOT_FOUND')
        error.code = 'P2025'
        throw error
    }
}