
const { prisma } = require('../lib/prisma')


// ======================================================
// ESTADÍSTICAS GENERALES
// ======================================================

exports.getStats = async () => {

    const [
        totalEquipos,
        disponibles,
        asignados,
        mantenimiento,
        baja
    ] = await Promise.all([

        prisma.equipos.count(),

        prisma.equipos.count({
            where: {
                estado: 'Disponible'
            }
        }),

        prisma.equipos.count({
            where: {
                estado: 'Asignado'
            }
        }),

        prisma.equipos.count({
            where: {
                estado: 'En mantenimiento'
            }
        }),

        prisma.equipos.count({
            where: {
                estado: 'Baja'
            }
        })
    ])

    return {
        total: totalEquipos,
        disponibles,
        asignados,
        mantenimiento,
        baja
    }
}


// ======================================================
// EQUIPOS POR ÁREA
// ======================================================

exports.getEquiposPorArea = async () => {

    const registros = await prisma.prestamo_equipos.findMany({
        where: {
            prestamo: {
                estado: 'activo',
                area: {
                    not: null
                }
            }
        },

        select: {
            num_serie: true,

            prestamo: {
                select: {
                    area: true
                }
            }
        }
    })


    const equiposPorArea = {}

    for (const registro of registros) {

        const area = registro.prestamo?.area

        if (!area) continue

        if (!equiposPorArea[area]) {
            equiposPorArea[area] = new Set()
        }

        equiposPorArea[area].add(registro.num_serie)
    }


    return Object.entries(equiposPorArea)
        .map(([area, equipos]) => ({
            area,
            total: equipos.size
        }))
        .sort((a, b) => b.total - a.total)
}


// ======================================================
// PRÉSTAMOS POR ÁREA
// ======================================================

exports.getPrestamosPorArea = async () => {

    const prestamos = await prisma.prestamos.findMany({
        where: {
            area: {
                not: null
            }
        },

        select: {
            id_prestamo: true,
            area: true
        }
    })


    const prestamosPorArea = {}

    for (const prestamo of prestamos) {

        const area = prestamo.area

        if (!area) continue

        if (!prestamosPorArea[area]) {
            prestamosPorArea[area] = new Set()
        }

        prestamosPorArea[area].add(prestamo.id_prestamo)
    }


    return Object.entries(prestamosPorArea)
        .map(([area, prestamosArea]) => ({
            area,
            total: prestamosArea.size
        }))
        .sort((a, b) => b.total - a.total)
}


// ======================================================
// EQUIPOS POR ESTADO
// ======================================================

exports.getEquiposPorEstado = async () => {

    const resultados = await prisma.equipos.groupBy({
        by: ['estado'],

        _count: {
            _all: true
        }
    })


    return resultados
        .map(resultado => ({
            estado: resultado.estado,
            total: resultado._count._all
        }))
        .sort((a, b) => b.total - a.total)
}


// ======================================================
// PRÉSTAMOS RECIENTES
// ======================================================

exports.getPrestamosRecientes = async (limit = 10) => {

    const prestamos = await prisma.prestamos.findMany({

        take: limit,

        orderBy: {
            fecha_prestamo: 'desc'
        },

        include: {
            equipos: {
                include: {
                    equipo: true
                }
            }
        }
    })


    return prestamos.map(prestamo => {

        const equipos = prestamo.equipos || []

        return {

            id_prestamo: prestamo.id_prestamo,

            num_serie: equipos
                .map(item => item.equipo?.num_serie)
                .filter(Boolean)
                .join(', '),

            fecha_prestamo: prestamo.fecha_prestamo,

            fecha_devolucion: prestamo.fecha_devolucion,

            estado: prestamo.estado,

            observaciones: prestamo.observaciones,

            equipo_area: prestamo.area,

            equipo: equipos
                .map(item => item.equipo?.equipo)
                .filter(Boolean)
                .join(', '),

            descripcion: equipos
                .map(item => item.equipo?.descripcion)
                .filter(Boolean)
                .join(', ')
        }
    })
}

