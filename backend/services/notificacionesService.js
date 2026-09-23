const notificacionesRepository = require('../repository/notificacionesRepository')
const prisma = require('../lib/prisma')
const emailService = require('./emailService')

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
            
            // Enviar correo de alerta al admin en background
            if (admin.correo) {
                emailService.enviarCorreo({
                    para: admin.correo,
                    asunto: `Registech - Alerta de Sistema: ${tipo}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                            <h2 style="color: #2b3a4a; text-align: center;">Alerta de Registech</h2>
                            <p style="font-size: 16px; color: #333;">Hola <strong>${admin.nombre}</strong>,</p>
                            <p style="font-size: 16px; color: #333;">Se ha registrado una nueva actividad en el sistema:</p>
                            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0d6efd; margin: 20px 0;">
                                <p style="margin: 0; font-size: 16px;">${mensaje}</p>
                            </div>
                            <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
                                Puedes revisar más detalles ingresando al panel de administración.
                            </p>
                        </div>
                    `
                }).catch(err => console.error("Error enviando correo a admin:", err.message))
            }

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