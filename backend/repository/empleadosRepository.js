const { prisma } = require('../lib/prisma')


// ======================================================
// OBTENER TODOS LOS EMPLEADOS
// ======================================================

exports.findAll = async () => {

    return await prisma.empleados.findMany({
        select: {
            id_empleado: true,
            nombre: true,
            tipo_documento: true,
            documento: true,
            correo: true,
            area: true,
            estado: true
        },

        orderBy: {
            nombre: 'asc'
        }
    })
}


// ======================================================
// BUSCAR EMPLEADO POR ID
// ======================================================

exports.findById = async (id) => {

    return await prisma.empleados.findUnique({
        where: {
            id_empleado: id
        }
    })
}


// ======================================================
// BUSCAR EMPLEADO POR DOCUMENTO
// ======================================================

exports.findByDocumento = async (documento) => {

    return await prisma.empleados.findFirst({
        where: {
            documento
        }
    })
}


// ======================================================
// CREAR EMPLEADO
// ======================================================

exports.create = async (data) => {

    return await prisma.empleados.create({
        data: {
            nombre: data.nombre,
            tipo_documento: data.tipo_documento,
            documento: data.documento,
            correo: data.correo || null,
            area: data.area,
            estado: data.estado || 'activo'
        }
    })
}


// ======================================================
// ACTUALIZAR EMPLEADO
// ======================================================

exports.update = async (id, data) => {

    return await prisma.empleados.update({
        where: {
            id_empleado: id
        },

        data
    })
}


// ======================================================
// ELIMINAR EMPLEADO
// ======================================================

exports.delete = async (id) => {

    // ==================================================
    // VERIFICAR SI TIENE HISTORIAL DE PRÉSTAMOS
    // ==================================================

    const totalPrestamos = await prisma.prestamos.count({
        where: {
            id_empleado: id
        }
    })


    // ==================================================
    // SI TIENE PRÉSTAMOS, NO SE PUEDE ELIMINAR
    // ==================================================

    if (totalPrestamos > 0) {

        const error = new Error('EMPLEADO_CON_HISTORIAL')

        throw error
    }


    // ==================================================
    // ELIMINAR EMPLEADO
    // ==================================================

    try {

        await prisma.empleados.delete({
            where: {
                id_empleado: id
            }
        })

    } catch (error) {

        // Prisma P2025 = registro no encontrado

        if (error.code === 'P2025') {

            const notFoundError = new Error('NOT_FOUND')

            notFoundError.code = 'P2025'

            throw notFoundError
        }

        throw error
    }
}

