
const { prisma } = require('../lib/prisma')


// ======================================================
// CREAR SOLICITUD
// ======================================================

exports.crearSolicitud = async (
    usuario,
    tipoEquipo,
    descripcion,
    justificacion
) => {

    const detalle = [
        tipoEquipo,
        descripcion,
        justificacion && `Justificación: ${justificacion}`
    ]
        .filter(Boolean)
        .join(' | ')


    return await prisma.solicitudes.create({
        data: {
            usuario,
            detalles: detalle
        }
    })
}


// ======================================================
// OBTENER SOLICITUDES
// ======================================================

exports.findSolicitudes = async (estado) => {

    return await prisma.solicitudes.findMany({

        where: estado
            ? {
                estado
            }
            : undefined,

        orderBy: {
            creado_en: 'desc'
        }
    })
}


// ======================================================
// OBTENER MIS SOLICITUDES
// ======================================================

exports.findMisSolicitudes = async (usuario) => {

    return await prisma.solicitudes.findMany({

        where: {
            usuario
        },

        orderBy: {
            creado_en: 'desc'
        }
    })
}


// ======================================================
// RESPONDER SOLICITUD
// ======================================================

exports.responderSolicitud = async (
    id,
    estado,
    respuesta
) => {

    // ==============================================
    // SI HAY RESPUESTA
    // ==============================================

    if (respuesta) {

        const solicitud =
            await prisma.solicitudes.findUnique({
                where: { id: parseInt(id, 10) }
            })


        if (!solicitud) {
            return null
        }


        const nuevosDetalles =
            !solicitud.detalles ||
            solicitud.detalles === ''
                ? respuesta
                : `${solicitud.detalles} | Respuesta: ${respuesta}`


        return await prisma.solicitudes.update({

            where: { id: parseInt(id, 10) },

            data: {
                estado,
                detalles: nuevosDetalles
            }
        })
    }


    // ==============================================
    // SI NO HAY RESPUESTA
    // ==============================================

    return await prisma.solicitudes.update({

        where: { id: parseInt(id, 10) },

        data: {
            estado
        }
    })
}


// ======================================================
// CONTAR SOLICITUDES PENDIENTES
// ======================================================

exports.contarPendientes = async () => {

    return await prisma.solicitudes.count({

        where: {
            estado: 'pendiente'
        }
    })
}

