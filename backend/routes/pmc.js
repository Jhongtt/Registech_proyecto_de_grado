const express = require('express');

const router = express.Router();

const pmcController = require('../controllers/pmcController');

const { authMiddleware, requireRol } = require('../middlewares/auth');

// =========================================================
// AUTENTICACIÓN
// =========================================================

router.use(authMiddleware);


// =========================================================
// PRODUCTOS PMC
// =========================================================

// Cualquier usuario autenticado puede consultar el inventario
router.get('/', pmcController.obtenerTodos);


// Crear producto
router.post(
    '/',
    requireRol('admin', 'inventario'),
    pmcController.crearProducto
);


// Actualizar producto
router.put(
    '/:id',
    requireRol('admin', 'inventario'),
    pmcController.actualizarProducto
);


// Eliminar producto
router.delete(
    '/:id',
    requireRol('admin', 'inventario'),
    pmcController.eliminarProducto
);


// =========================================================
// ENTREGAS PMC
// =========================================================

// Registrar entrega de PMC
// Recibe:
// - cantidad
// - id_empleado o id_usuario
// - area
// - fecha_entrega
// - observaciones
router.post(
    '/:id/entregar',
    requireRol('admin', 'inventario'),
    pmcController.entregarProducto
);


// =========================================================
// HISTORIAL DE ENTREGAS PMC
// =========================================================

// Historial general de todas las entregas
router.get(
    '/entregas/historial',
    requireRol('admin', 'inventario'),
    pmcController.obtenerTodasLasEntregas
);


// Historial de entregas de un empleado
router.get(
    '/entregas/empleado/:id',
    pmcController.obtenerEntregasPorEmpleado
);


// Historial de entregas de un usuario
router.get(
    '/entregas/usuario/:id',
    pmcController.obtenerEntregasPorUsuario
);


module.exports = router;