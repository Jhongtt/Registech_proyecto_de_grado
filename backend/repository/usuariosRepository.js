
const { prisma } = require('../lib/prisma')


// ======================================================
// BUSCAR USUARIO POR NOMBRE DE USUARIO
// ======================================================

exports.findByUsuario = async (usuarioLimpio) => {

    return await prisma.usuarios.findUnique({
        where: {
            usuario: usuarioLimpio
        }
    })
}


// ======================================================
// BUSCAR USUARIO POR CORREO
// ======================================================

exports.findByCorreo = async (correo) => {

    return await prisma.usuarios.findUnique({
        where: {
            correo
        }
    })
}


// ======================================================
// OBTENER TODOS LOS USUARIOS
// ======================================================

exports.findAll = async () => {

    return await prisma.usuarios.findMany({

        select: {
            id_usuario: true,
            usuario: true,
            nombre: true,
            area: true,
            rol: true,
            correo: true,
            estado: true
        }
    })
}


// ======================================================
// CREAR USUARIO
// ======================================================

exports.create = async (data) => {

    return await prisma.usuarios.create({

        data: {
            usuario: data.usuario,
            nombre: data.nombre,
            correo: data.correo,
            contrasena: data.contrasena,
            area: data.area,
            rol: data.rol || 'inventario',
            estado: data.estado || 'activo'
        }
    })
}


// ======================================================
// ACTUALIZAR USUARIO
// ======================================================

exports.update = async (usuarioParam, data) => {

    return await prisma.usuarios.update({

        where: {
            usuario: usuarioParam
        },

        data
    })
}


// ======================================================
// VERIFICAR SI TIENE PRÉSTAMO ACTIVO
// ======================================================

exports.tienePrestamoActivo = async (usuarioParam) => {

    const usuario = await prisma.usuarios.findUnique({

        where: {
            usuario: usuarioParam
        },

        select: {
            id_usuario: true
        }
    })


    if (!usuario) {
        return false
    }


    const prestamosActivos = await prisma.prestamos.count({

        where: {
            id_usuario: usuario.id_usuario,

            estado: {
                in: ['activo', 'parcial']
            }
        }
    })


    return prestamosActivos > 0
}


// ======================================================
// VERIFICAR SI TIENE HISTORIAL DE PRÉSTAMOS
// ======================================================

exports.tieneHistorialPrestamos = async (usuarioParam) => {

    const usuario = await prisma.usuarios.findUnique({

        where: {
            usuario: usuarioParam
        },

        select: {
            id_usuario: true
        }
    })


    if (!usuario) {
        return false
    }


    const totalPrestamos = await prisma.prestamos.count({

        where: {
            id_usuario: usuario.id_usuario
        }
    })


    return totalPrestamos > 0
}


// ======================================================
// ELIMINAR USUARIO
// ======================================================

exports.delete = async (usuarioParam) => {

    try {

        await prisma.$transaction(async (tx) => {

            // Los reset_tokens dependen del usuario
            await tx.reset_tokens.deleteMany({

                where: {
                    usuario: usuarioParam
                }
            })


            const usuarioEliminado =
                await tx.usuarios.delete({

                    where: {
                        usuario: usuarioParam
                    }
                })


            return usuarioEliminado
        })

    } catch (e) {

        // Prisma utiliza P2025 cuando el registro no existe
        if (e.code === 'P2025') {

            const err = new Error('NOT_FOUND')
            err.code = 'P2025'

            throw err
        }

        throw e
    }
}


// ======================================================
// CREAR TOKEN DE RECUPERACIÓN
// ======================================================

exports.createResetToken = async (
    usuario,
    codigo,
    expiraEn
) => {

    const minutosValidez = Math.max(
        1,
        Math.round(
            (new Date(expiraEn) - Date.now()) / 60000
        )
    )


    return await prisma.$transaction(async (tx) => {

        // Eliminar tokens anteriores del usuario
        await tx.reset_tokens.deleteMany({

            where: {
                usuario
            }
        })


        // Crear nuevo token
        return await tx.reset_tokens.create({

            data: {
                usuario,
                codigo,
                expira_en: new Date(
                    Date.now() + minutosValidez * 60000
                )
            }
        })
    })
}


// ======================================================
// BUSCAR TOKEN VÁLIDO
// ======================================================

exports.findValidResetToken = async (
    usuario,
    codigo
) => {

    return await prisma.reset_tokens.findFirst({

        where: {

            usuario,

            codigo,

            usado: false,

            expira_en: {
                gt: new Date()
            }
        }
    })
}


// ======================================================
// MARCAR TOKEN COMO USADO
// ======================================================

exports.markTokenUsed = async (tokenId) => {

    return await prisma.reset_tokens.update({

        where: {
            id: tokenId
        },

        data: {
            usado: true
        }
    })
}


// ======================================================
// ACTUALIZAR CONTRASEÑA
// ======================================================

exports.updatePassword = async (
    usuario,
    hashContrasena
) => {

    return await prisma.usuarios.update({

        where: {
            usuario
        },

        data: {
            contrasena: hashContrasena
        }
    })
}

