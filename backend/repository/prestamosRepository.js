const prisma = require('../lib/prisma')


// ======================================================
// OBTENER TODOS LOS PRÉSTAMOS
// ======================================================

exports.findPrestamos = async () => {

    const prestamos = await prisma.prestamos.findMany({
        include: {
            empleado: true,
            usuario: true,

            equipos: {
                include: {
                    equipo: true
                }
            }
        },

        orderBy: {
            fecha_prestamo: 'desc'
        }
    })

    return prestamos.map(prestamo => ({

        id_prestamo: prestamo.id_prestamo,

        // ==================================================
        // DESTINATARIO - EMPLEADO
        // ==================================================

        id_empleado: prestamo.id_empleado,

        empleado:
            prestamo.empleado?.nombre ||
            null,

        documento_empleado:
            prestamo.empleado?.documento ||
            null,

        correo_empleado:
            prestamo.empleado?.correo ||
            null,


        // ==================================================
        // DESTINATARIO - USUARIO DEL SISTEMA
        // ==================================================

        id_usuario: prestamo.id_usuario,

        usuario:
            prestamo.usuario?.nombre ||
            null,

        correo_usuario:
            prestamo.usuario?.correo ||
            null,


        // ==================================================
        // DESTINATARIO GENERAL
        // ==================================================

        destinatario:
            prestamo.empleado?.nombre ||
            prestamo.usuario?.nombre ||
            null,


        // ==================================================
        // ÁREA
        // ==================================================

        area:
            prestamo.area ||
            prestamo.empleado?.area ||
            prestamo.usuario?.area ||
            null,


        estado: prestamo.estado,

        fecha_prestamo:
            prestamo.fecha_prestamo,

        // Fecha programada
        fecha_devolucion_programada:
            prestamo.fecha_devolucion_programada,

        // Fecha REAL de devolución
        fecha_devolucion:
            prestamo.fecha_devolucion,

        observaciones:
            prestamo.observaciones,

        evidencia:
            prestamo.evidencia,


        // ==================================================
        // EQUIPOS DEL PRÉSTAMO
        // ==================================================

        equipos: prestamo.equipos.map(relacion => ({

            num_serie:
                relacion.num_serie,

            estado:
                relacion.estado,

            equipo:
                relacion.equipo?.equipo ||
                null,

            equipo_area:
                relacion.equipo?.area ||
                null,

            descripcion:
                relacion.equipo?.descripcion ||
                null,

            estado_equipo:
                relacion.equipo?.estado ||
                null,

            responsable:
                relacion.equipo?.responsable ||
                null,

            fecha_adquisicion:
                relacion.equipo?.fecha_adquisicion ||
                null,

            fecha_asignacion:
                relacion.equipo?.fecha_asignacion ||
                null,

            fecha_baja:
                relacion.equipo?.fecha_baja ||
                null,

            sistema_operativo:
                relacion.equipo?.sistema_operativo ||
                null,

            imagen:
                relacion.equipo?.imagen ||
                null
        }))
    }))
}


// ======================================================
// OBTENER PRÉSTAMOS ACTIVOS
// ======================================================

exports.findPrestamosActivos = async () => {

    const prestamos = await prisma.prestamos.findMany({

        where: {
            estado: {
                in: ['activo', 'parcial']
            }
        },

        include: {

            empleado: true,

            usuario: true,

            equipos: {

                where: {
                    estado: 'prestado'
                },

                include: {
                    equipo: true
                }
            }
        },

        orderBy: {
            fecha_prestamo: 'desc'
        }
    })


    return prestamos

        .filter(prestamo =>
            prestamo.equipos.length > 0
        )

        .map(prestamo => ({

            id_prestamo:
                prestamo.id_prestamo,


            // ==================================================
            // EMPLEADO
            // ==================================================

            id_empleado:
                prestamo.id_empleado,

            empleado:
                prestamo.empleado?.nombre ||
                null,

            documento_empleado:
                prestamo.empleado?.documento ||
                null,

            correo_empleado:
                prestamo.empleado?.correo ||
                null,


            // ==================================================
            // USUARIO
            // ==================================================

            id_usuario:
                prestamo.id_usuario,

            usuario:
                prestamo.usuario?.nombre ||
                null,

            correo_usuario:
                prestamo.usuario?.correo ||
                null,


            // ==================================================
            // DESTINATARIO GENERAL
            // ==================================================

            destinatario:
                prestamo.empleado?.nombre ||
                prestamo.usuario?.nombre ||
                null,


            // ==================================================
            // ÁREA
            // ==================================================

            area:
                prestamo.area ||
                prestamo.empleado?.area ||
                prestamo.usuario?.area ||
                null,


            estado:
                prestamo.estado,


            fecha_prestamo:
                prestamo.fecha_prestamo,


            // Fecha programada
            fecha_devolucion_programada:
                prestamo.fecha_devolucion_programada,


            // Fecha REAL de devolución
            fecha_devolucion:
                prestamo.fecha_devolucion,


            observaciones:
                prestamo.observaciones,


            evidencia:
                prestamo.evidencia,


            // ==================================================
            // EQUIPOS
            // ==================================================

            equipos: prestamo.equipos.map(relacion => ({

                num_serie:
                    relacion.num_serie,

                estado:
                    relacion.estado,

                equipo:
                    relacion.equipo?.equipo ||
                    null,

                equipo_area:
                    relacion.equipo?.area ||
                    null,

                descripcion:
                    relacion.equipo?.descripcion ||
                    null,

                estado_equipo:
                    relacion.equipo?.estado ||
                    null,

                responsable:
                    relacion.equipo?.responsable ||
                    null,

                fecha_adquisicion:
                    relacion.equipo?.fecha_adquisicion ||
                    null,

                fecha_asignacion:
                    relacion.equipo?.fecha_asignacion ||
                    null,

                fecha_baja:
                    relacion.equipo?.fecha_baja ||
                    null,

                sistema_operativo:
                    relacion.equipo?.sistema_operativo ||
                    null,

                imagen:
                    relacion.equipo?.imagen ||
                    null
            }))
        }))
}


// ======================================================
// BUSCAR PRÉSTAMO ACTIVO POR EQUIPO
// ======================================================

exports.findPrestamoActivoPorEquipo = async (
    numSerieLimpio
) => {

    const relacion =
        await prisma.prestamo_equipos.findFirst({

            where: {

                num_serie:
                    numSerieLimpio,

                estado:
                    'prestado',

                prestamo: {

                    estado: {
                        in: [
                            'activo',
                            'parcial'
                        ]
                    }
                }
            },


            include: {

                prestamo: {

                    include: {

                        empleado: true,

                        usuario: true
                    }
                },

                equipo: true
            },


            orderBy: {

                prestamo: {

                    fecha_prestamo:
                        'desc'
                }
            }
        })


    if (!relacion) {
        return null
    }


    const prestamo =
        relacion.prestamo


    return {

        id_prestamo:
            prestamo.id_prestamo,


        num_serie:
            relacion.num_serie,


        estado:
            prestamo.estado,


        // ==================================================
        // EMPLEADO
        // ==================================================

        id_empleado:
            prestamo.id_empleado,

        empleado:
            prestamo.empleado?.nombre ||
            null,

        documento_empleado:
            prestamo.empleado?.documento ||
            null,

        correo_empleado:
            prestamo.empleado?.correo ||
            null,


        // ==================================================
        // USUARIO
        // ==================================================

        id_usuario:
            prestamo.id_usuario,

        usuario:
            prestamo.usuario?.nombre ||
            null,

        correo_usuario:
            prestamo.usuario?.correo ||
            null,


        // ==================================================
        // DESTINATARIO
        // ==================================================

        destinatario:
            prestamo.empleado?.nombre ||
            prestamo.usuario?.nombre ||
            null,


        // ==================================================
        // ÁREA
        // ==================================================

        area:
            prestamo.area ||
            prestamo.empleado?.area ||
            prestamo.usuario?.area ||
            null,


        fecha_prestamo:
            prestamo.fecha_prestamo,


        // Fecha programada
        fecha_devolucion_programada:
            prestamo.fecha_devolucion_programada,


        // Fecha REAL de devolución
        fecha_devolucion:
            prestamo.fecha_devolucion,


        observaciones:
            prestamo.observaciones,


        evidencia:
            prestamo.evidencia,


        // ==================================================
        // EQUIPO
        // ==================================================

        equipo:
            relacion.equipo?.equipo ||
            null,

        descripcion:
            relacion.equipo?.descripcion ||
            null,

        equipo_area:
            relacion.equipo?.area ||
            null,

        estado_equipo:
            relacion.equipo?.estado ||
            null,

        responsable:
            relacion.equipo?.responsable ||
            null,

        fecha_adquisicion:
            relacion.equipo?.fecha_adquisicion ||
            null,

        fecha_asignacion:
            relacion.equipo?.fecha_asignacion ||
            null,

        fecha_baja:
            relacion.equipo?.fecha_baja ||
            null,

        sistema_operativo:
            relacion.equipo?.sistema_operativo ||
            null,

        imagen:
            relacion.equipo?.imagen ||
            null
    }
}


// ======================================================
// CREAR PRÉSTAMO CON VARIOS EQUIPOS
// ======================================================

exports.crearPrestamoTransaction = async (
    numSeriesLimpios,
    idEmpleado = null,
    idUsuario = null,
    observacionesLimpias,
    fechaInicio = null,
    fechaLimite = null
) => {

    if (
        !Array.isArray(numSeriesLimpios) ||
        numSeriesLimpios.length === 0
    ) {
        throw new Error('EQUIPOS_REQUERIDOS')
    }


    if (!idEmpleado && !idUsuario) {
        throw new Error('DESTINATARIO_REQUERIDO')
    }


    if (idEmpleado && idUsuario) {
        throw new Error('DESTINATARIO_INVALIDO')
    }


    return await prisma.$transaction(async (tx) => {

        // ==================================================
        // 1. BUSCAR DESTINATARIO
        // ==================================================

        let empleado = null
        let usuario = null

        let nombreDestinatario = null
        let areaDestinatario = null


        // --------------------------------------------------
        // EMPLEADO
        // --------------------------------------------------

        if (idEmpleado) {

            empleado =
                await tx.empleados.findUnique({

                    where: {
                        id_empleado:
                            idEmpleado
                    }
                })


            if (!empleado) {
                throw new Error(
                    'EMPLEADO_NO_ENCONTRADO'
                )
            }


            nombreDestinatario =
                empleado.nombre

            areaDestinatario =
                empleado.area
        }


        // --------------------------------------------------
        // USUARIO DEL SISTEMA
        // --------------------------------------------------

        else if (idUsuario) {

            usuario =
                await tx.usuarios.findUnique({

                    where: {
                        id_usuario:
                            Number(idUsuario)
                    }
                })


            if (!usuario) {
                throw new Error(
                    'USUARIO_NO_ENCONTRADO'
                )
            }


            nombreDestinatario =
                usuario.nombre

            areaDestinatario =
                usuario.area
        }


        // ==================================================
        // 2. BUSCAR EQUIPOS
        // ==================================================

        const equipos =
            await tx.equipos.findMany({

                where: {

                    num_serie: {
                        in: numSeriesLimpios
                    }
                }
            })


        // ==================================================
        // 3. VERIFICAR QUE TODOS EXISTAN
        // ==================================================

        if (
            equipos.length !==
            numSeriesLimpios.length
        ) {

            throw new Error(
                'EQUIPO_NO_ENCONTRADO'
            )
        }


        // ==================================================
        // 4. VERIFICAR DISPONIBILIDAD
        // ==================================================

        const equipoNoDisponible =
            equipos.find(
                equipo =>
                    equipo.estado !==
                    'Disponible'
            )


        if (equipoNoDisponible) {

            throw new Error(
                'EQUIPO_NO_DISPONIBLE'
            )
        }


        // ==================================================
        // 5. CREAR PRÉSTAMO
        // ==================================================

        const prestamo =
            await tx.prestamos.create({

                data: {

                    id_empleado:
                        empleado?.id_empleado ||
                        null,

                    id_usuario:
                        usuario?.id_usuario ||
                        null,

                    area:
                        areaDestinatario,


                    // Fecha en la que se hizo el préstamo
                    fecha_prestamo:
                        fechaInicio
                            ? new Date(fechaInicio)
                            : new Date(),


                    // Fecha límite / programada
                    fecha_devolucion_programada:
                        fechaLimite
                            ? new Date(fechaLimite)
                            : null,


                    // Se llena solamente cuando
                    // realmente se devuelve
                    fecha_devolucion:
                        null,


                    estado:
                        'activo',


                    // Observaciones originales
                    observaciones:
                        observacionesLimpias ||
                        null
                }
            })


        // ==================================================
        // 6. RELACIONAR EQUIPOS
        // ==================================================

        await tx.prestamo_equipos.createMany({

            data:
                numSeriesLimpios.map(
                    numSerie => ({

                        id_prestamo:
                            prestamo.id_prestamo,

                        num_serie:
                            numSerie,

                        estado:
                            'prestado'
                    })
                )
        })


        // ==================================================
        // 7. MARCAR EQUIPOS COMO ASIGNADOS
        // ==================================================

        await tx.equipos.updateMany({

            where: {

                num_serie: {
                    in: numSeriesLimpios
                }
            },

            data: {

                estado:
                    'Asignado',

                responsable:
                    nombreDestinatario,

                fecha_asignacion:
                    fechaInicio
                        ? new Date(fechaInicio)
                        : new Date()
            }
        })


        return prestamo
    })
}


// ======================================================
// DEVOLVER PRÉSTAMO COMPLETO
// ======================================================

exports.devolverPrestamoTransaction = async (
    idLimpio,
    observaciones,
    evidencia
) => {

    return await prisma.$transaction(async (tx) => {

        // ==================================================
        // 1. BUSCAR PRÉSTAMO
        // ==================================================

        const prestamo =
            await tx.prestamos.findUnique({

                where: {
                    id_prestamo:
                        idLimpio
                },

                include: {
                    equipos: true
                }
            })


        if (!prestamo) {
            throw new Error(
                'PRESTAMO_NO_ENCONTRADO'
            )
        }


        if (
            !['activo', 'parcial']
                .includes(prestamo.estado)
        ) {

            throw new Error(
                'PRESTAMO_YA_DEVUELTO'
            )
        }


        // ==================================================
        // 2. EQUIPOS QUE SIGUEN PRESTADOS
        // ==================================================

        const equiposPrestados =
            prestamo.equipos.filter(
                relacion =>
                    relacion.estado ===
                    'prestado'
            )


        const numSeries =
            equiposPrestados.map(
                relacion =>
                    relacion.num_serie
            )


        // ==================================================
        // 3. MARCAR RELACIONES COMO DEVUELTAS
        // ==================================================

        if (numSeries.length > 0) {

            await tx.prestamo_equipos.updateMany({

                where: {

                    id_prestamo:
                        idLimpio,

                    estado:
                        'prestado'
                },

                data: {

                    estado:
                        'devuelto'
                }
            })
        }


        // ==================================================
        // 4. LIBERAR EQUIPOS
        // ==================================================

        if (numSeries.length > 0) {

            await tx.equipos.updateMany({

                where: {

                    num_serie: {
                        in: numSeries
                    }
                },

                data: {

                    estado:
                        'Disponible',

                    responsable:
                        null,

                    fecha_asignacion:
                        null
                }
            })
        }


        // ==================================================
        // 5. FINALIZAR PRÉSTAMO
        // ==================================================

        await tx.prestamos.update({

            where: {
                id_prestamo:
                    idLimpio
            },

            data: {

                // Fecha REAL de devolución
                fecha_devolucion:
                    new Date(),

                estado:
                    'devuelto',

                // IMPORTANTE:
                // NO modificamos las observaciones
                // originales del préstamo.

                evidencia:
                    evidencia ??
                    prestamo.evidencia
            }
        })


        return {

            equiposDevueltos:
                numSeries.length
        }
    })
}


// ======================================================
// DEVOLVER UN SOLO EQUIPO
// ======================================================

exports.devolverEquipoTransaction = async (
    idPrestamo,
    numSerie,
    observaciones,
    evidencia
) => {

    return await prisma.$transaction(async (tx) => {

        // ==================================================
        // 1. BUSCAR PRÉSTAMO
        // ==================================================

        const prestamo =
            await tx.prestamos.findUnique({

                where: {
                    id_prestamo:
                        idPrestamo
                }
            })


        if (!prestamo) {
            throw new Error(
                'PRESTAMO_NO_ENCONTRADO'
            )
        }


        if (
            !['activo', 'parcial']
                .includes(prestamo.estado)
        ) {

            throw new Error(
                'PRESTAMO_YA_DEVUELTO'
            )
        }


        // ==================================================
        // 2. BUSCAR RELACIÓN
        // ==================================================

        const relacion =
            await tx.prestamo_equipos.findUnique({

                where: {

                    id_prestamo_num_serie: {

                        id_prestamo:
                            idPrestamo,

                        num_serie:
                            numSerie
                    }
                }
            })


        if (!relacion) {
            throw new Error(
                'EQUIPO_NO_PERTENECE'
            )
        }


        if (relacion.estado === 'devuelto') {

            throw new Error(
                'EQUIPO_YA_DEVUELTO'
            )
        }


        // ==================================================
        // 3. MARCAR EQUIPO COMO DEVUELTO
        // ==================================================

        await tx.prestamo_equipos.update({

            where: {

                id_prestamo_num_serie: {

                    id_prestamo:
                        idPrestamo,

                    num_serie:
                        numSerie
                }
            },

            data: {

                estado:
                    'devuelto'
            }
        })


        // ==================================================
        // 4. LIBERAR EQUIPO
        // ==================================================

        await tx.equipos.update({

            where: {
                num_serie:
                    numSerie
            },

            data: {

                estado:
                    'Disponible',

                responsable:
                    null,

                fecha_asignacion:
                    null
            }
        })


        // ==================================================
        // 5. CONTAR EQUIPOS PENDIENTES
        // ==================================================

        const equiposPendientes =
            await tx.prestamo_equipos.count({

                where: {

                    id_prestamo:
                        idPrestamo,

                    estado:
                        'prestado'
                }
            })


        // ==================================================
        // 6. ACTUALIZAR ESTADO DEL PRÉSTAMO
        // ==================================================

        if (equiposPendientes === 0) {

            await tx.prestamos.update({

                where: {
                    id_prestamo:
                        idPrestamo
                },

                data: {

                    estado:
                        'devuelto',

                    // Fecha REAL de devolución
                    fecha_devolucion:
                        new Date(),

                    // Conservamos las observaciones
                    // originales del préstamo.

                    evidencia:
                        evidencia ??
                        prestamo.evidencia
                }
            })

        } else {

            await tx.prestamos.update({

                where: {
                    id_prestamo:
                        idPrestamo
                },

                data: {

                    estado:
                        'parcial',

                    // Conservamos las observaciones
                    // originales del préstamo.

                    evidencia:
                        evidencia ??
                        prestamo.evidencia
                }
            })
        }


        return {

            equiposRestantes:
                equiposPendientes,

            prestamoFinalizado:
                equiposPendientes === 0
        }
    })
}


// ======================================================
// HISTORIAL DE UN EQUIPO
// ======================================================

exports.findHistorialEquipo = async (
    numSerieLimpio
) => {

    const relaciones =
        await prisma.prestamo_equipos.findMany({

            where: {
                num_serie:
                    numSerieLimpio
            },

            include: {

                prestamo: {

                    include: {

                        empleado: true,

                        usuario: true
                    }
                },

                equipo: true
            },

            orderBy: {

                prestamo: {

                    fecha_prestamo:
                        'desc'
                }
            }
        })


    return relaciones.map(relacion => ({

        id_prestamo:
            relacion.prestamo.id_prestamo,


        num_serie:
            relacion.num_serie,


        estado:
            relacion.prestamo.estado,


        estado_equipo_prestamo:
            relacion.estado,


        // ==================================================
        // EMPLEADO
        // ==================================================

        id_empleado:
            relacion.prestamo.id_empleado,

        empleado:
            relacion.prestamo.empleado?.nombre ||
            null,

        documento_empleado:
            relacion.prestamo.empleado?.documento ||
            null,

        correo_empleado:
            relacion.prestamo.empleado?.correo ||
            null,


        // ==================================================
        // USUARIO
        // ==================================================

        id_usuario:
            relacion.prestamo.id_usuario,

        usuario:
            relacion.prestamo.usuario?.nombre ||
            null,

        correo_usuario:
            relacion.prestamo.usuario?.correo ||
            null,


        // ==================================================
        // DESTINATARIO
        // ==================================================

        destinatario:
            relacion.prestamo.empleado?.nombre ||
            relacion.prestamo.usuario?.nombre ||
            null,


        // ==================================================
        // ÁREA
        // ==================================================

        area:
            relacion.prestamo.area ||
            relacion.prestamo.empleado?.area ||
            relacion.prestamo.usuario?.area ||
            null,


        fecha_prestamo:
            relacion.prestamo.fecha_prestamo,


        // Fecha programada
        fecha_devolucion_programada:
            relacion.prestamo.fecha_devolucion_programada,


        // Fecha REAL
        fecha_devolucion:
            relacion.prestamo.fecha_devolucion,


        observaciones:
            relacion.prestamo.observaciones,


        evidencia:
            relacion.prestamo.evidencia,


        // ==================================================
        // EQUIPO
        // ==================================================

        equipo:
            relacion.equipo?.equipo ||
            null,

        descripcion:
            relacion.equipo?.descripcion ||
            null,

        equipo_area:
            relacion.equipo?.area ||
            null,

        estado_equipo:
            relacion.equipo?.estado ||
            null,

        responsable:
            relacion.equipo?.responsable ||
            null,

        fecha_adquisicion:
            relacion.equipo?.fecha_adquisicion ||
            null,

        fecha_asignacion:
            relacion.equipo?.fecha_asignacion ||
            null,

        fecha_baja:
            relacion.equipo?.fecha_baja ||
            null,

        sistema_operativo:
            relacion.equipo?.sistema_operativo ||
            null,

        imagen:
            relacion.equipo?.imagen ||
            null
    }))
}


// ======================================================
// ESTADÍSTICAS
// ======================================================

exports.getEstadisticasData = async () => {

    const [
        total,
        disponibles,
        prestados,
        mantenimiento,
        baja
    ] = await Promise.all([

        prisma.equipos.count(),

        prisma.equipos.count({
            where: {
                estado:
                    'Disponible'
            }
        }),

        prisma.prestamo_equipos.count({
            where: {
                estado:
                    'prestado'
            }
        }),

        prisma.equipos.count({
            where: {
                estado:
                    'En mantenimiento'
            }
        }),

        prisma.equipos.count({
            where: {
                estado:
                    'Baja'
            }
        })
    ])


    return {

        total,

        disponibles,

        prestados,

        mantenimiento,

        baja
    }
}


// ======================================================
// HISTORIAL DE PRÉSTAMOS DE UN EMPLEADO
// ======================================================

exports.findHistorialEmpleado = async (idEmpleado) => {

    const prestamos =
        await prisma.prestamos.findMany({

            where: {
                id_empleado:
                    idEmpleado
            },

            include: {

                equipos: {

                    include: {
                        equipo: true
                    }
                }
            },

            orderBy: {

                fecha_prestamo:
                    'desc'
            }
        })


    return prestamos.map(prestamo => ({

        tipo:
            'prestamo',

        id_prestamo:
            prestamo.id_prestamo,

        estado:
            prestamo.estado,

        // Fecha en la que se hizo el préstamo
        fecha_prestamo:
            prestamo.fecha_prestamo,

        // Fecha programada
        fecha_devolucion_programada:
            prestamo.fecha_devolucion_programada,

        // Fecha REAL en la que se devolvió
        fecha_devolucion:
            prestamo.fecha_devolucion,

        area:
            prestamo.area,

        // Observaciones originales
        observaciones:
            prestamo.observaciones,

        evidencia:
            prestamo.evidencia,

        equipos:
            prestamo.equipos.map(relacion => ({

                num_serie:
                    relacion.num_serie,

                estado:
                    relacion.estado,

                equipo:
                    relacion.equipo?.equipo ||
                    null,

                descripcion:
                    relacion.equipo?.descripcion ||
                    null
            }))
    }))
}


// ======================================================
// HISTORIAL DE PRÉSTAMOS DE UN USUARIO
// ======================================================

exports.findHistorialUsuario = async (idUsuario) => {

    const prestamos =
        await prisma.prestamos.findMany({

            where: {
                id_usuario:
                    Number(idUsuario)
            },

            include: {

                equipos: {

                    include: {
                        equipo: true
                    }
                }
            },

            orderBy: {

                fecha_prestamo:
                    'desc'
            }
        })


    return prestamos.map(prestamo => ({

        tipo:
            'prestamo',

        id_prestamo:
            prestamo.id_prestamo,

        estado:
            prestamo.estado,

        // Fecha en la que se hizo el préstamo
        fecha_prestamo:
            prestamo.fecha_prestamo,

        // Fecha programada
        fecha_devolucion_programada:
            prestamo.fecha_devolucion_programada,

        // Fecha REAL en la que se devolvió
        fecha_devolucion:
            prestamo.fecha_devolucion,

        area:
            prestamo.area,

        // Observaciones originales
        observaciones:
            prestamo.observaciones,

        evidencia:
            prestamo.evidencia,

        equipos:
            prestamo.equipos.map(relacion => ({

                num_serie:
                    relacion.num_serie,

                estado:
                    relacion.estado,

                equipo:
                    relacion.equipo?.equipo ||
                    null,

                descripcion:
                    relacion.equipo?.descripcion ||
                    null
            }))
    }))
}