const express = require('express');

const router = express.Router();

const pmcController = require('../controllers/pmcController');

const { authMiddleware, requireRol } = require('../middlewares/auth');

// Autenticado puede consultar; crear/modificar/gestión de stock solo admin o inventario
router.use(authMiddleware);

router.get('/', pmcController.obtenerTodos);

router.post('/', requireRol('admin', 'inventario'), pmcController.crearProducto);

router.put('/:id', requireRol('admin', 'inventario'), pmcController.actualizarProducto);

router.delete('/:id', requireRol('admin', 'inventario'), pmcController.eliminarProducto);

// Rutas rápidas de stock
router.post('/:id/entregar', requireRol('admin', 'inventario'), pmcController.entregarProducto);

router.post('/:id/devolver', requireRol('admin', 'inventario'), pmcController.devolverProducto);

module.exports = router;