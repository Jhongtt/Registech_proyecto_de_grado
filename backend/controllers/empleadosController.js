const empleadosService = require('../services/empleadosService')

exports.getEmpleados = async (req, res) => {
    try {
        const empleados = await empleadosService.getEmpleados()
        res.json(empleados)
    } catch (error) {
        console.error('Error al obtener empleados:', error)
        res.status(500).json({
            error: 'Error al obtener empleados'
        })
    }
}

exports.createEmpleado = async (req, res) => {
    try {
        const empleado = await empleadosService.createEmpleado(req.body)

        res.status(201).json({
            mensaje: 'Empleado creado correctamente',
            empleado
        })
    } catch (error) {
        console.error('Error al crear empleado:', error)

        if (error.message === 'REQUERIDOS') {
            return res.status(400).json({
                error: 'Nombre, tipo de documento, documento y área son obligatorios'
            })
        }

        if (error.message === 'DUPLICATE') {
            return res.status(409).json({
                error: 'Ya existe un empleado con ese documento'
            })
        }

        if (error.code === '23503') {
            return res.status(400).json({
                error: 'El área seleccionada no existe'
            })
        }

        res.status(500).json({
            error: 'Error al crear empleado'
        })
    }
}

exports.updateEmpleado = async (req, res) => {
    try {
        const empleado = await empleadosService.updateEmpleado(
            req.params.id,
            req.body
        )

        if (!empleado) {
            return res.status(404).json({
                error: 'Empleado no encontrado'
            })
        }

        res.json({
            mensaje: 'Empleado actualizado correctamente',
            empleado
        })
    } catch (error) {
        console.error('Error al actualizar empleado:', error)

        if (error.message === 'DUPLICATE') {
            return res.status(409).json({
                error: 'Ya existe un empleado con ese documento'
            })
        }

        res.status(500).json({
            error: 'Error al actualizar empleado'
        })
    }
}

exports.deleteEmpleado = async (req, res) => {
    try {
        await empleadosService.deleteEmpleado(req.params.id)

        res.json({
            mensaje: 'Empleado eliminado correctamente'
        })
    } catch (error) {
        console.error('Error al eliminar empleado:', error)

        if (error.message === 'EMPLEADO_CON_HISTORIAL') {
            return res.status(400).json({
                error: 'Este empleado tiene historial de préstamos y no puede ser eliminado. Debe ser inactivado.'
            })
        }

        if (error.code === 'P2025' || error.message === 'NOT_FOUND') {
            return res.status(404).json({
                error: 'Empleado no encontrado'
            })
        }

        res.status(500).json({
            error: 'Error al eliminar empleado'
        })
    }
}