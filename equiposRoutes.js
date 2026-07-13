const express = require('express')
const router = require('express').Router()
const db = require('./conexion')

// RUTA PARA OBTENER TODOS LOS ESTADOS DE LOS EQUIPOS
router.get('/estados_equipo', (req, res) => {
    db.query('SELECT * FROM estados_equipos', (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }

        res.json(results)
    })
})    

// RUTA PARA OBTENER TODOS LOS EQUIPOS
router.get('/equipos', (req, res) => {
    db.query('SELECT * FROM equipos', (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }

        res.json(results)
    })
})    

// RUTA PARA ASIGNAR USUARIO A UN EQUIPO
router.post('/equipos/asignacion', (req, res) => {
    const { num_serie, usuario } = req.body

    // SI EL USUARIO NO EXISTE O ESTA VACIO, ASIGNAMOS NULL
    const responsable = usuario && usuario.trim() !== '' ? usuario : null
    const query = 'UPDATE equipos SET responsable = ? WHERE num_serie = ?'

    db.query(query, [responsable, num_serie], (err, results) => {
        if (err) {
            console.error('Error al asignar usuario al equipo', err)
            return res.status(500).send('Error al asignar usuario al equipo')
        }

        res.status(200).send('Se asigno exitosamente el usuario al equipo correspondiente')
    })
})

// RUTA PARA REGISTRAR UN NUEVO REPORTE DE FALLA
router.post('/equipos/reporte/add', (req, res) => {
    const { num_serie, falla } = req.body
    if (!num_serie || !falla) {
        return res.status(400).send('El numero de serie y la falla son requeridos')
    }

    // OBTENER LA FECHA ACTUAL CON FORMATO DD/MM/YYYY
    const fecha = new Date()

    // FORMATEAR LA FECHA EN YYYY-MM-DD
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')

    // CREAR EL STRING EN EL FORMATO DESEADO
    const fecha_reporte = `${anio}-${mes}-${dia}`

    // INICIAR LA TRANSACCION
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).send('Error al iniciar la transaccion')
        }

        // ACTUALIZAMOS EL ESTADO DEL EQUIPO A MANTENIMIENTO
        const updateEstadoQuery = 'UPDATE equipos SET estado="Mantenimiento" WHERE num_serie=?'
        db.query(updateEstadoQuery, [num_serie], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error al actualizar el estado del equipo', err)
                    return res.status(500).send('Error al actualizar el estado del equipo')
                })
            }

            const id_historial = Date.now()
            // INSERTAR EL NUEVO REGISTRO EN LA TABLA HISTORIAL_MANTENIMIENTOS
            const insertHistorialQuery = 'INSERT INTO historial_mantenimientos(id_historial, num_serie, fecha_reporte, falla) VALUES(?, ?, ?, ?)'
            
            db.query(insertHistorialQuery, [id_historial, num_serie, fecha_reporte, falla], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al insertar el registro en la tabla historial de mantenimientos', err)
                        return res.status(500).send('Error al insertar el registro en la tabla historial de mantenimientos')
                    })
                }

                // CONFIRMAR LA TRANSACCION
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al confirmar la transaccion', err)
                            return res.status(500).send('Error al confirmar la transaccion')    
                        })
                    } 
                    res.status(200).send('Estad actualizado a mantenimiento y reporte registrado exitosamente ')   
                }) 
            })
        })
    })
})

// RUTA PARA OBTENER LOS MANTENIMINENTOS ORDENADOS POR FECHAS DE REPORTE Y FALTA DE SOLUCION 
router.get('/equipos/reporte', (req, res) => {
    const query = 'SELECT * FROM historial_mantenimientos WHERE fecha_solucion IS NULL ORDER BY fecha_reporte ASC'
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }

        res.json(results)
    })
})

// RUTA PARA ACTUALIZAR LA SOLUCION EN EL HISTORIAL Y CAMBIAR EL ESTADO DEL EQUIPO
router.post('/equipos/reporte/solucion', (req, res) => {
    const { num_serie, id_historial, tecnico, solucion } = req.body

    if (!num_serie || !id_historial || !tecnico || !solucion) {
        return res.status(400).send('El numero de serie, id_historial, tecnico y solucion son requeridos')
    }

    // OBTENER LA FECHA ACTUAL CON EL FORMATO DESEADO 
    const fecha = new Date()
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')

    const fecha_solucion = `${anio}-${mes}-${dia}`

    // INICIAR LA TRANSACCION
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).send('Error al iniciar la transaccion')
        }

        // ACTUALIZAR EL ESTADO DEL EQUIPO A ACTIVO
        const updateEstadoQuery = 'UPDATE equipos SET estado="activo" WHERE num_serie=?'
        db.query(updateEstadoQuery, [num_serie], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error al actualizar el estado del equipo', err)
                    return res.status(500).send('Error al actualizar el estado del equipo')
                })
            }

            // ACTUALIZAMOS EL REGISTRO DE LA TABLA HISTORIAL_MANTENIMIENTOS
            const updateHistorialQuery = 'UPDATE historial_mantenimientos SET fecha_solucion=?, usuario_tecnico=?, solucion=? WHERE id_historial=?'
            db.query(updateHistorialQuery, [fecha_solucion, tecnico, solucion, id_historial], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al actualizar el historial', err)    
                        return res.status(500).send('Error al actualizar el historia ')
                    })
                }

                // CONFIRMAR LA TRANSACCION
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al confirmar la transaccion', err)
                            return res.status(500).send('Error al confirmar la transaccion')    
                        })
                    }
                    
                    res.status(200).send('Estado del equipo actualizado a activo y mantenimiento actualizado')
                })
            })
        })
    })
})

// RUTA PARA BUSCAR MANTENIMIENTOS
router.post('/equipos/mantenimientos/find', (req, res) => {
    const { filter } = req.body

    if (!filter) {
        return res.status(400).json({
            error: 'Se debe proporcionar al menos uno de los elementos'
        })
    }

    const query = `SELECT * FROM historial_mantenimientos WHERE (id_historial = ?
    OR num_serie = ?
    OR usuario_tecnico = ?)
    AND solucion IS NOT NULL`
    
    db.query(query, [filter, filter, filter], (err, result) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }
        res.json(result)
    })
})

module.exports = router