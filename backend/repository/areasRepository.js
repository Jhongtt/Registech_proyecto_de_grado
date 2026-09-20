
const { prisma } = require('../lib/prisma')


// ======================================================
// OBTENER TODAS LAS ÁREAS
// ======================================================

exports.findAll = async () => {

    return await prisma.areas.findMany({
        select: {
            area: true
        },
        orderBy: {
            area: 'asc'
        }
    })
}


// ======================================================
// VERIFICAR SI EXISTE UN ÁREA
// ======================================================

exports.exists = async (area) => {

    const cantidad = await prisma.areas.count({
        where: {
            area: {
                equals: area,
                mode: 'insensitive'
            }
        }
    })

    return cantidad > 0
}


// ======================================================
// CREAR ÁREA
// ======================================================

exports.create = async (area) => {

    await prisma.areas.create({
        data: {
            area
        }
    })
}


// ======================================================
// RENOMBRAR ÁREA
// ======================================================
//
// NO modificamos equipos.area.
//
// Los equipos disponibles pertenecen al inventario general,
// por lo que NO deben considerarse pertenecientes a un
// departamento.
//
// Cuando un equipo está prestado, su departamento se obtiene
// desde prestamos.area.
//
// Al renombrar un departamento actualizamos:
//
//   - usuarios.area
//   - empleados.area
//   - prestamos.area
//   - areas.area
//
// ======================================================

exports.rename = async (viejaLimpia, nuevaLimpia) => {

    return await prisma.$transaction(async (tx) => {

        // ==================================================
        // ACTUALIZAR USUARIOS
        // ==================================================

        await tx.usuarios.updateMany({
            where: {
                area: {
                    equals: viejaLimpia,
                    mode: 'insensitive'
                }
            },
            data: {
                area: nuevaLimpia
            }
        })


        // ==================================================
        // ACTUALIZAR EMPLEADOS
        // ==================================================

        await tx.empleados.updateMany({
            where: {
                area: {
                    equals: viejaLimpia,
                    mode: 'insensitive'
                }
            },
            data: {
                area: nuevaLimpia
            }
        })


        // ==================================================
        // ACTUALIZAR PRÉSTAMOS
        // ==================================================

        await tx.prestamos.updateMany({
            where: {
                area: {
                    equals: viejaLimpia,
                    mode: 'insensitive'
                }
            },
            data: {
                area: nuevaLimpia
            }
        })


        // ==================================================
        // ACTUALIZAR EL ÁREA
        // ==================================================

        const resultado = await tx.areas.updateMany({
            where: {
                area: {
                    equals: viejaLimpia,
                    mode: 'insensitive'
                }
            },
            data: {
                area: nuevaLimpia
            }
        })


        return resultado.count > 0
    })
}


// ======================================================
// ELIMINAR ÁREA
// ======================================================

exports.remove = async (area) => {

    const resultado = await prisma.areas.deleteMany({
        where: {
            area: {
                equals: area,
                mode: 'insensitive'
            }
        }
    })

    return resultado.count > 0
}


// ======================================================
// CONTAR USO DEL ÁREA
// ======================================================
//
// Un departamento se considera ocupado si tiene:
//
//   1. Usuarios pertenecientes al departamento.
//   2. Empleados pertenecientes al departamento.
//   3. Equipos relacionados con el departamento.
//
// IMPORTANTE:
//
// NO usamos equipos.area para determinar la pertenencia
// de un equipo.
//
// Los equipos disponibles pertenecen al inventario general.
// Los equipos prestados toman el área desde prestamos.area.
//
// ======================================================

exports.contarUso = async (area) => {

    const [
        usuarios,
        empleados,
        prestamos
    ] = await Promise.all([

        // ==============================================
        // USUARIOS
        // ==============================================

        prisma.usuarios.count({
            where: {
                area: {
                    equals: area,
                    mode: 'insensitive'
                }
            }
        }),


        // ==============================================
        // EMPLEADOS
        // ==============================================

        prisma.empleados.count({
            where: {
                area: {
                    equals: area,
                    mode: 'insensitive'
                }
            }
        }),


        // ==============================================
        // EQUIPOS PRESTADOS
        // ==============================================

        prisma.prestamo_equipos.count({
            where: {
                prestamo: {
                    area: {
                        equals: area,
                        mode: 'insensitive'
                    },
                    estado: 'activo'
                },
                equipo: {
                    estado: {
                        not: 'Baja'
                    }
                }
            }
        })
    ])


    return {
        usuarios,
        empleados,
        equipos: prestamos
    }
}

