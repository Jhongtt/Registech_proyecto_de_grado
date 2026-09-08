const pmcService = require('../services/pmcService');
const notificacionesService = require('../services/notificacionesService');

// =========================================================
// OBTENER TODOS LOS PRODUCTOS PMC
// =========================================================
exports.obtenerTodos = async (req, res, next) => {
    try {
        const pmcs = await pmcService.obtenerTodos();
        res.json(pmcs);
    } catch (error) {
        next(error);
    }
};

// =========================================================
// CREAR PRODUCTO PMC
// =========================================================
exports.crearProducto = async (req, res, next) => {
    try {
        const nuevoProducto = await pmcService.crearProducto(req.body);

        res.status(201).json({
            mensaje: 'Producto PMC creado exitosamente',
            producto: nuevoProducto
        });
    } catch (error) {
        next(error);
    }
};

// =========================================================
// ACTUALIZAR PRODUCTO PMC
// =========================================================
exports.actualizarProducto = async (req, res, next) => {
    try {
        const productoActualizado =
            await pmcService.actualizarProducto(
                req.params.id,
                req.body
            );

        res.json({
            mensaje: 'Producto PMC actualizado exitosamente',
            producto: productoActualizado
        });
    } catch (error) {
        next(error);
    }
};

// =========================================================
// ELIMINAR PRODUCTO PMC
// =========================================================
exports.eliminarProducto = async (req, res, next) => {
    try {
        await pmcService.eliminarProducto(req.params.id);

        res.json({
            mensaje: 'Producto PMC eliminado exitosamente'
        });
    } catch (error) {
        next(error);
    }
};

// =========================================================
// REGISTRAR ENTREGA DE PMC
// =========================================================
exports.entregarProducto = async (req, res, next) => {
    try {
        const resultado = await pmcService.entregarProducto(
            req.params.id,
            req.body
        );

        const producto = resultado.producto;
        const entrega = resultado.entrega;

        // Obtener nombre del destinatario para la notificación
        const destinatario =
            req.body.id_empleado
                ? `empleado ${req.body.id_empleado}`
                : `usuario ${req.body.id_usuario}`;

        await notificacionesService.notificarAdmins(
            'pmc',
            `Se registró una entrega de ${entrega.cantidad} unidad(es) del PMC "${producto.nombre}" al ${destinatario}, área: ${entrega.area}.`
        );

        res.json({
            mensaje: 'Entrega de PMC registrada exitosamente',
            producto,
            entrega
        });

    } catch (error) {
        next(error);
    }
};

// =========================================================
// HISTORIAL DE ENTREGAS PMC DE UN EMPLEADO
// =========================================================
exports.obtenerEntregasPorEmpleado = async (req, res, next) => {
    try {
        const entregas =
            await pmcService.obtenerEntregasPorEmpleado(
                req.params.id
            );

        res.json(entregas);
    } catch (error) {
        next(error);
    }
};

// =========================================================
// HISTORIAL DE ENTREGAS PMC DE UN USUARIO
// =========================================================
exports.obtenerEntregasPorUsuario = async (req, res, next) => {
    try {
        const entregas =
            await pmcService.obtenerEntregasPorUsuario(
                req.params.id
            );

        res.json(entregas);
    } catch (error) {
        next(error);
    }
};

// =========================================================
// HISTORIAL GENERAL DE ENTREGAS PMC
// =========================================================
exports.obtenerTodasLasEntregas = async (req, res, next) => {
    try {
        const entregas =
            await pmcService.obtenerTodasLasEntregas();

        res.json(entregas);
    } catch (error) {
        next(error);
    }
};