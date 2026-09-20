
const { prisma } = require('../lib/prisma')

exports.getActividadReciente = async (limit = 15) => {

    const actividades = await prisma.auditoria.findMany({
        take: limit,

        orderBy: {
            fecha: 'desc'
        },

        select: {
            usuario: true,
            accion: true,
            fecha: true,

            usuarioRelacion: {
                select: {
                    nombre: true
                }
            }
        }
    })

    return actividades.map(actividad => ({
        usuario: actividad.usuario,
        nombre_usuario: actividad.usuarioRelacion?.nombre || null,
        accion: actividad.accion,
        fecha: actividad.fecha
    }))
}

