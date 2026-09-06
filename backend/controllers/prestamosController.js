const prestamosService = require('../services/prestamosService')
const notificacionesService = require('../services/notificacionesService')
const auditoriaService = require('../services/auditoriaService')


// ======================================================
// OBTENER TODOS LOS PRÉSTAMOS
// ======================================================

exports.getPrestamos = async (req, res) => {
    try {
        const prestamos = await prestamosService.getPrestamos()
        res.json(prestamos)
    } catch (error) {
        console.error('Error al obtener prestamos:', error)

        res.status(500).json({
            error: 'Error al obtener prestamos'
        })
    }
}


// ======================================================
// OBTENER PRÉSTAMOS ACTIVOS
// ======================================================

exports.getPrestamosActivos = async (req, res) => {
    try {
        const prestamos = await prestamosService.getPrestamosActivos()
        res.json(prestamos)
    } catch (error) {
        console.error('Error al obtener prestamos activos:', error)

        res.status(500).json({
            error: 'Error al obtener prestamos activos'
        })
    }
}


// ======================================================
// BUSCAR PRÉSTAMO ACTIVO POR EQUIPO
// ======================================================

exports.getPrestamoActivoPorEquipo = async (req, res) => {

    try {

        const prestamo =
            await prestamosService.getPrestamoActivoPorEquipo(
                req.params.num_serie
            )

        if (!prestamo) {
            return res.status(404).json({
                error: 'No hay préstamo activo para este equipo'
            })
        }

        res.json(prestamo)

    } catch (error) {

        console.error(
            'Error al buscar préstamo activo:',
            error
        )

        res.status(500).json({
            error: 'Error al buscar préstamo activo'
        })
    }
}


// ======================================================
// CREAR PRÉSTAMO
// ======================================================

exports.crearPrestamo = async (req, res) => {

    try {

        const {
            num_series,
            id_empleado,
            id_usuario,
            observaciones,
            fecha_inicio,
            fecha_limite
        } = req.body


        // ==============================================
        // CREAR PRÉSTAMO
        // ==============================================

        await prestamosService.crearPrestamo(
            num_series,
            id_empleado,
            id_usuario,
            observaciones,
            fecha_inicio,
            fecha_limite
        )


        // ==============================================
        // DATOS PARA AUDITORÍA
        // ==============================================

        const equipos = Array.isArray(num_series)
            ? num_series.join(', ')
            : ''


        const destinatario =
            id_empleado
                ? `empleado ${id_empleado}`
                : `usuario del sistema ${id_usuario}`


        const rangoFechas =
            fecha_inicio && fecha_limite
                ? ` del ${fecha_inicio} al ${fecha_limite}`
                : ''


        await auditoriaService.registrar(
            req.usuario.usuario,
            `Prestó los equipos ${equipos} al ${destinatario}${rangoFechas}`
        )


        // ==============================================
        // NOTIFICACIÓN
        // ==============================================

        await notificacionesService.notificarAdmins(
            'prestamos',
            `Se registró un préstamo de los equipos ${equipos} al ${destinatario}.`
        )


        // ==============================================
        // RESPUESTA
        // ==============================================

        res.status(201).json({
            mensaje: 'Préstamo registrado exitosamente'
        })


    } catch (error) {

        // ==============================================
        // ERRORES DE VALIDACIÓN
        // ==============================================

        if (error.message === 'REQUERIDOS') {

            return res.status(400).json({
                error: 'Debe seleccionar al menos un equipo y un destinatario'
            })
        }


        if (error.message === 'DESTINATARIO_REQUERIDO') {

            return res.status(400).json({
                error: 'Debe seleccionar un empleado o un usuario'
            })
        }


        if (error.message === 'DESTINATARIO_INVALIDO') {

            return res.status(400).json({
                error: 'Solo puede seleccionar un empleado o un usuario'
            })
        }


        if (error.message === 'EMPLEADO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'El empleado seleccionado no existe'
            })
        }


        if (error.message === 'USUARIO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'El usuario seleccionado no existe'
            })
        }


        if (error.message === 'EQUIPOS_REQUERIDOS') {

            return res.status(400).json({
                error: 'Debe seleccionar al menos un equipo'
            })
        }


        if (error.message === 'EQUIPO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'Uno de los equipos no fue encontrado'
            })
        }


        if (error.message === 'EQUIPO_NO_DISPONIBLE') {

            return res.status(400).json({
                error: 'Uno de los equipos no está disponible para préstamo'
            })
        }


        if (error.message === 'FECHAS_INVALIDAS') {

            return res.status(400).json({
                error: 'La fecha límite no puede ser anterior a la fecha de inicio'
            })
        }


        console.error(
            'Error al crear prestamo:',
            error
        )


        res.status(500).json({
            error: 'Error al crear prestamo'
        })
    }
}


// ======================================================
// DEVOLVER PRÉSTAMO COMPLETO
// ======================================================

exports.devolverPrestamo = async (req, res) => {

    try {

        const observaciones =
            req.body.observaciones || null

        const evidencia =
            req.file
                ? req.file.filename
                : null


        const resultado =
            await prestamosService.devolverPrestamo(
                req.params.id,
                observaciones,
                evidencia
            )


        // ==============================================
        // AUDITORÍA
        // ==============================================

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Registró la devolución total del préstamo ${req.params.id}`
        )


        // ==============================================
        // NOTIFICACIÓN
        // ==============================================

        await notificacionesService.notificarAdmins(
            'prestamos',
            `El usuario ${req.usuario.usuario} registró la devolución total del préstamo #${req.params.id}.`
        )


        res.status(200).json({
            mensaje: 'Devolución registrada exitosamente',
            ...resultado
        })


    } catch (error) {

        if (error.message === 'REQUERIDOS') {

            return res.status(400).json({
                error: 'El id del préstamo es requerido'
            })
        }


        if (error.message === 'PRESTAMO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'Préstamo no encontrado'
            })
        }


        if (error.message === 'PRESTAMO_YA_DEVUELTO') {

            return res.status(400).json({
                error: 'Este préstamo ya fue devuelto'
            })
        }


        console.error(
            'Error al devolver prestamo:',
            error
        )


        res.status(500).json({
            error: 'Error al devolver prestamo'
        })
    }
}


// ======================================================
// DEVOLVER UN SOLO EQUIPO
// ======================================================

exports.devolverEquipo = async (req, res) => {

    try {

        const observaciones =
            req.body.observaciones || null

        const evidencia =
            req.file
                ? req.file.filename
                : null


        const resultado =
            await prestamosService.devolverEquipo(
                req.params.id,
                req.params.num_serie,
                observaciones,
                evidencia
            )


        // ==============================================
        // AUDITORÍA
        // ==============================================

        await auditoriaService.registrar(
            req.usuario.usuario,
            `Registró la devolución del equipo ${req.params.num_serie} del préstamo ${req.params.id}`
        )


        // ==============================================
        // NOTIFICACIÓN
        // ==============================================

        await notificacionesService.notificarAdmins(
            'prestamos',
            `El usuario ${req.usuario.usuario} devolvió el equipo ${req.params.num_serie} del préstamo #${req.params.id}.`
        )


        res.status(200).json({
            mensaje: 'Equipo devuelto exitosamente',
            ...resultado
        })


    } catch (error) {

        if (error.message === 'PRESTAMO_NO_ENCONTRADO') {

            return res.status(404).json({
                error: 'Préstamo no encontrado'
            })
        }


        if (error.message === 'PRESTAMO_YA_DEVUELTO') {

            return res.status(400).json({
                error: 'Este préstamo ya fue devuelto'
            })
        }


        if (error.message === 'EQUIPO_NO_PERTENECE') {

            return res.status(400).json({
                error: 'El equipo no pertenece a este préstamo'
            })
        }


        if (error.message === 'EQUIPO_YA_DEVUELTO') {

            return res.status(400).json({
                error: 'Este equipo ya fue devuelto'
            })
        }


        console.error(
            'Error al devolver equipo:',
            error
        )


        res.status(500).json({
            error: 'Error al devolver equipo'
        })
    }
}


// ======================================================
// HISTORIAL DE EQUIPO
// ======================================================

exports.historialEquipo = async (req, res) => {

    try {

        const historial =
            await prestamosService.historialEquipo(
                req.params.num_serie
            )

        res.json(historial)

    } catch (error) {

        if (error.message === 'REQUERIDOS') {

            return res.status(400).json({
                error: 'El número de serie es requerido'
            })
        }


        console.error(
            'Error al obtener historial:',
            error
        )


        res.status(500).json({
            error: 'Error al obtener historial'
        })
    }
}


// ======================================================
// ESTADÍSTICAS
// ======================================================

exports.getEstadisticas = async (req, res) => {

    try {

        const stats =
            await prestamosService.getEstadisticas()

        res.json(stats)

    } catch (error) {

        console.error(
            'Error al obtener estadisticas:',
            error
        )

        res.status(500).json({
            error: 'Error al obtener estadisticas'
        })
    }
}