const notificacionesRepository = require('../repository/notificacionesRepository')
const prisma = require('../lib/prisma')

exports.notificarAdmins = async (tipo, mensaje, excluirUsuario = null) => {
    try {
        const administradores = await prisma.usuarios.findMany({
            where: {
                rol: 'admin',
                estado: { equals: 'activo', mode: 'insensitive' }
            }
        })
        for (const admin of administradores) {
            if (excluirUsuario && admin.usuario === excluirUsuario) {
                continue;
            }
            await notificacionesRepository.crear({
                usuario: admin.usuario,
                tipo,
                mensaje
            })
        }
    } catch (error) {
        console.error('Error al notificar a administradores:', error)
    }
}


exports.notificarTecnicos = async (tipo, mensaje) => {
    try {
        const tecnicos = await prisma.usuarios.findMany({
            where: {
                rol: 'soporte',
                estado: { equals: 'activo', mode: 'insensitive' }
            }
        })
        for (const tecnico of tecnicos) {
            await notificacionesRepository.crear({
                usuario: tecnico.usuario,
                tipo,
                mensaje
            })
        }
    } catch (error) {
        console.error('Error al notificar al personal de soporte:', error)
    }
}


exports.crear = async (usuario, tipo, mensaje) => {
    if (!usuario || !mensaje) return null

    return await notificacionesRepository.crear({
        usuario,
        tipo,
        mensaje
    })
}

exports.obtenerPorUsuario = async (usuario) => {
    return await notificacionesRepository.obtenerPorUsuario(usuario)
}

exports.obtenerNoLeidas = async (usuario) => {
    return await notificacionesRepository.obtenerNoLeidas(usuario)
}

exports.marcarLeida = async (id, usuario) => {
    return await notificacionesRepository.marcarLeida(id, usuario)
}

exports.marcarTodasLeidas = async (usuario) => {
    return await notificacionesRepository.marcarTodasLeidas(usuario)
}