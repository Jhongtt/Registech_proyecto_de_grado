const express = require('express')
const router = express.Router()
const { getDashboard, exportarEquipos } = require('../controllers/dashboardController')
const { authMiddleware } = require('../middlewares/auth')

router.get('/dashboard', authMiddleware, getDashboard)
router.get('/dashboard/exportar-equipos', authMiddleware, exportarEquipos)

module.exports = router
