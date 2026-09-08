const pmcRepository = require('../repository/pmcRepository');
const AppError = require('../utils/AppError');

class PMCService {

    // =========================================================
    // OBTENER TODOS LOS PRODUCTOS PMC
    // =========================================================
    async obtenerTodos() {
        return await pmcRepository.getAll();
    }

    // =========================================================
    // CREAR PRODUCTO PMC
    // =========================================================
    async crearProducto(data) {
        const cantidad = parseInt(data.cantidad_total, 10);

        if (!data.nombre || !data.nombre.trim()) {
            throw new AppError(
                'El nombre del producto es obligatorio',
                400
            );
        }

        if (!cantidad || cantidad < 1) {
            throw new AppError(
                'La cantidad total debe ser mayor a 0',
                400
            );
        }

        return await pmcRepository.create({
            nombre: data.nombre.trim(),
            descripcion: data.descripcion?.trim() || null,
            cantidad_total: cantidad
        });
    }

    // =========================================================
    // ACTUALIZAR PRODUCTO PMC
    // =========================================================
    async actualizarProducto(id, data) {
        const producto = await pmcRepository.getById(id);

        if (!producto) {
            throw new AppError(
                'Producto PMC no encontrado',
                404
            );
        }

        return await pmcRepository.update(id, data);
    }

    // =========================================================
    // ELIMINAR PRODUCTO PMC
    // =========================================================
    async eliminarProducto(id) {
        const producto = await pmcRepository.getById(id);

        if (!producto) {
            throw new AppError(
                'Producto PMC no encontrado',
                404
            );
        }

        return await pmcRepository.delete(id);
    }

    // =========================================================
    // REGISTRAR ENTREGA DE PMC
    // =========================================================
    async entregarProducto(id, data) {

        const producto = await pmcRepository.getById(id);

        if (!producto) {
            throw new AppError(
                'Producto PMC no encontrado',
                404
            );
        }

        const cantidad = parseInt(data.cantidad, 10);

        // -----------------------------------------------------
        // VALIDAR CANTIDAD
        // -----------------------------------------------------
        if (!cantidad || cantidad < 1) {
            throw new AppError(
                'La cantidad a entregar debe ser mayor a 0',
                400
            );
        }

        // -----------------------------------------------------
        // VALIDAR STOCK
        // -----------------------------------------------------
        if (producto.cantidad_disponible < cantidad) {
            throw new AppError(
                `Stock insuficiente. Solo hay ${producto.cantidad_disponible} unidad(es) disponible(s)`,
                400
            );
        }

        // -----------------------------------------------------
        // VALIDAR DESTINATARIO
        // -----------------------------------------------------
        const idEmpleado = data.id_empleado || null;
        const idUsuario = data.id_usuario || null;

        if (!idEmpleado && !idUsuario) {
            throw new AppError(
                'Debes seleccionar un empleado o un usuario como destinatario',
                400
            );
        }

        if (idEmpleado && idUsuario) {
            throw new AppError(
                'La entrega solo puede tener un destinatario',
                400
            );
        }

        // -----------------------------------------------------
        // VALIDAR ÁREA
        // -----------------------------------------------------
        if (!data.area || !data.area.trim()) {
            throw new AppError(
                'El área del destinatario es obligatoria',
                400
            );
        }

        // -----------------------------------------------------
        // VALIDAR FECHA
        // -----------------------------------------------------
        let fechaEntrega = data.fecha_entrega || null;

        if (fechaEntrega) {
            const fecha = new Date(fechaEntrega);

            if (isNaN(fecha.getTime())) {
                throw new AppError(
                    'La fecha de entrega no es válida',
                    400
                );
            }
        } else {
            fechaEntrega = new Date();
        }

        // -----------------------------------------------------
        // REGISTRAR ENTREGA
        // -----------------------------------------------------
        return await pmcRepository.registrarEntrega(id, {
            cantidad,
            id_empleado: idEmpleado,
            id_usuario: idUsuario,
            area: data.area.trim(),
            fecha_entrega: fechaEntrega,
            observaciones: data.observaciones?.trim() || null
        });
    }

    // =========================================================
    // HISTORIAL DE PMC DE UN EMPLEADO
    // =========================================================
    async obtenerEntregasPorEmpleado(idEmpleado) {
        return await pmcRepository.getEntregasPorEmpleado(
            idEmpleado
        );
    }

    // =========================================================
    // HISTORIAL DE PMC DE UN USUARIO
    // =========================================================
    async obtenerEntregasPorUsuario(idUsuario) {
        return await pmcRepository.getEntregasPorUsuario(
            idUsuario
        );
    }

    // =========================================================
    // HISTORIAL GENERAL DE PMC
    // =========================================================
    async obtenerTodasLasEntregas() {
        return await pmcRepository.getTodasLasEntregas();
    }
}

module.exports = new PMCService();