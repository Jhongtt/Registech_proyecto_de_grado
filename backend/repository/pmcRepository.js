const { pool } = require('../lib/db');

class PMCRepository {

    async getAll() {
        const result = await pool.query(
            'SELECT * FROM productos_menor_cuantia ORDER BY creado_en DESC'
        );

        return result.rows;
    }

    async getById(id) {
        const result = await pool.query(
            'SELECT * FROM productos_menor_cuantia WHERE id = $1',
            [id]
        );

        return result.rows[0];
    }

    async create(data) {
        const { nombre, descripcion, cantidad_total } = data;

        const result = await pool.query(
            `INSERT INTO productos_menor_cuantia
                (nombre, descripcion, cantidad_total, cantidad_disponible)
             VALUES ($1, $2, $3, $3)
             RETURNING *`,
            [nombre, descripcion, cantidad_total]
        );

        return result.rows[0];
    }

    async update(id, data) {
        const {
            nombre,
            descripcion,
            cantidad_total,
            cantidad_disponible
        } = data;

        const result = await pool.query(
            `UPDATE productos_menor_cuantia
             SET nombre = $1,
                 descripcion = $2,
                 cantidad_total = $3,
                 cantidad_disponible = $4
             WHERE id = $5
             RETURNING *`,
            [
                nombre,
                descripcion,
                cantidad_total,
                cantidad_disponible,
                id
            ]
        );

        return result.rows[0];
    }

    async delete(id) {
        await pool.query(
            'DELETE FROM productos_menor_cuantia WHERE id = $1',
            [id]
        );

        return true;
    }

    async updateStock(id, newStock) {
        const result = await pool.query(
            `UPDATE productos_menor_cuantia
             SET cantidad_disponible = $1
             WHERE id = $2
             RETURNING *`,
            [newStock, id]
        );

        return result.rows[0];
    }

    // =========================================================
    // REGISTRAR ENTREGA DE PMC
    // =========================================================
    async registrarEntrega(idProducto, data) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const {
                cantidad,
                id_empleado,
                id_usuario,
                area,
                fecha_entrega,
                observaciones
            } = data;

            // Bloqueamos el producto mientras se realiza la operación
            const productoResult = await client.query(
                `SELECT *
                 FROM productos_menor_cuantia
                 WHERE id = $1
                 FOR UPDATE`,
                [idProducto]
            );

            if (productoResult.rows.length === 0) {
                throw new Error('Producto PMC no encontrado');
            }

            const producto = productoResult.rows[0];

            // Validar stock
            if (producto.cantidad_disponible < cantidad) {
                throw new Error(
                    `Stock insuficiente. Disponible: ${producto.cantidad_disponible}`
                );
            }

            // Validar destinatario
            if (!id_empleado && !id_usuario) {
                throw new Error(
                    'Debe seleccionar un empleado o un usuario'
                );
            }

            if (id_empleado && id_usuario) {
                throw new Error(
                    'La entrega solo puede tener un destinatario'
                );
            }

            // Validar área
            if (!area || !area.trim()) {
                throw new Error(
                    'El área del destinatario es obligatoria'
                );
            }

            // Descontar stock
            const nuevoStock =
                producto.cantidad_disponible - cantidad;

            const stockResult = await client.query(
                `UPDATE productos_menor_cuantia
                 SET cantidad_disponible = $1
                 WHERE id = $2
                 RETURNING *`,
                [nuevoStock, idProducto]
            );

            // Registrar la entrega
            const entregaResult = await client.query(
                `INSERT INTO entregas_menor_cuantia
                    (
                        id_producto,
                        cantidad,
                        id_empleado,
                        id_usuario,
                        area,
                        fecha_entrega,
                        observaciones
                    )
                 VALUES
                    ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    idProducto,
                    cantidad,
                    id_empleado || null,
                    id_usuario || null,
                    area.trim(),
                    fecha_entrega || new Date(),
                    observaciones?.trim() || null
                ]
            );

            await client.query('COMMIT');

            return {
                producto: stockResult.rows[0],
                entrega: entregaResult.rows[0]
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // =========================================================
    // OBTENER HISTORIAL DE ENTREGAS DE UN EMPLEADO
    // =========================================================
    async getEntregasPorEmpleado(idEmpleado) {
        const result = await pool.query(
            `SELECT
                e.id_entrega,
                e.id_producto,
                p.nombre AS producto,
                p.descripcion,
                e.cantidad,
                e.area,
                e.fecha_entrega,
                e.observaciones
             FROM entregas_menor_cuantia e
             INNER JOIN productos_menor_cuantia p
                ON p.id = e.id_producto
             WHERE e.id_empleado = $1
             ORDER BY e.fecha_entrega DESC`,
            [idEmpleado]
        );

        return result.rows;
    }

    // =========================================================
    // OBTENER HISTORIAL DE ENTREGAS DE UN USUARIO
    // =========================================================
    async getEntregasPorUsuario(idUsuario) {
        const result = await pool.query(
            `SELECT
                e.id_entrega,
                e.id_producto,
                p.nombre AS producto,
                p.descripcion,
                e.cantidad,
                e.area,
                e.fecha_entrega,
                e.observaciones
             FROM entregas_menor_cuantia e
             INNER JOIN productos_menor_cuantia p
                ON p.id = e.id_producto
             WHERE e.id_usuario = $1
             ORDER BY e.fecha_entrega DESC`,
            [idUsuario]
        );

        return result.rows;
    }

    // =========================================================
    // HISTORIAL GENERAL DE ENTREGAS PMC
    // =========================================================
    async getTodasLasEntregas() {
        const result = await pool.query(
            `SELECT
                e.id_entrega,
                e.id_producto,
                p.nombre AS producto,
                e.cantidad,
                e.area,
                e.fecha_entrega,
                e.observaciones,

                e.id_empleado,
                emp.nombre AS empleado,

                e.id_usuario,
                u.nombre AS usuario,
                u.usuario AS nombre_usuario

             FROM entregas_menor_cuantia e

             INNER JOIN productos_menor_cuantia p
                ON p.id = e.id_producto

             LEFT JOIN empleados emp
                ON emp.id_empleado = e.id_empleado

             LEFT JOIN usuarios u
                ON u.id_usuario = e.id_usuario

             ORDER BY e.fecha_entrega DESC`
        );

        return result.rows;
    }
}

module.exports = new PMCRepository();