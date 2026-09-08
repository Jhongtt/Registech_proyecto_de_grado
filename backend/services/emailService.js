const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

function escaparHtml(valor) {
    if (valor === null || valor === undefined) return ''

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function formatearFecha(fecha) {
    if (!fecha) return 'No especificada'

    const fechaObj = new Date(fecha)

    if (isNaN(fechaObj.getTime())) {
        return 'No especificada'
    }

    return fechaObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

function generarFilasEquipos(equipos) {
    if (!Array.isArray(equipos) || equipos.length === 0) {
        return `
            <tr>
                <td colspan="3" style="padding: 12px; text-align: center;">
                    No hay equipos registrados.
                </td>
            </tr>
        `
    }

    return equipos.map(equipo => `
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">
                ${escaparHtml(
                    equipo.nombre_equipo ||
                    equipo.nombre ||
                    equipo.tipo ||
                    'Equipo'
                )}
            </td>

            <td style="padding: 10px; border: 1px solid #ddd;">
                ${escaparHtml(
                    equipo.num_serie ||
                    equipo.numero_serie ||
                    'N/A'
                )}
            </td>

            <td style="padding: 10px; border: 1px solid #ddd;">
                ${escaparHtml(
                    equipo.marca ||
                    'N/A'
                )}
            </td>
        </tr>
    `).join('')
}

function generarHtmlPrestamo(prestamo) {
    const destinatario =
        prestamo.empleado ||
        prestamo.usuario ||
        prestamo.nombre_empleado ||
        prestamo.nombre_usuario ||
        prestamo.nombre_destinatario ||
        'Destinatario'

    const area =
        prestamo.area ||
        prestamo.area_destinatario ||
        'No especificada'

    const equipos =
        prestamo.equipos ||
        prestamo.equipment ||
        []

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Recibo de préstamo - Registech</title>
        </head>

        <body style="
            margin: 0;
            padding: 0;
            background-color: #f4f6f8;
            font-family: Arial, Helvetica, sans-serif;
        ">

            <div style="
                max-width: 700px;
                margin: 30px auto;
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            ">

                <div style="
                    background-color: #1f2937;
                    color: white;
                    padding: 25px;
                    text-align: center;
                ">
                    <h1 style="margin: 0;">
                        Registech
                    </h1>

                    <p style="margin: 8px 0 0;">
                        Recibo de préstamo de equipos
                    </p>
                </div>

                <div style="padding: 25px;">

                    <h2 style="margin-top: 0;">
                        Información del préstamo
                    </h2>

                    <p>
                        Hola <strong>${escaparHtml(destinatario)}</strong>,
                    </p>

                    <p>
                        Se ha registrado correctamente el siguiente
                        préstamo de equipos en Registech.
                    </p>

                    <table style="
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    ">

                        <tr>
                            <td style="
                                padding: 10px;
                                background-color: #f3f4f6;
                                font-weight: bold;
                                width: 40%;
                            ">
                                Destinatario
                            </td>

                            <td style="padding: 10px;">
                                ${escaparHtml(destinatario)}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 10px;
                                background-color: #f3f4f6;
                                font-weight: bold;
                            ">
                                Área
                            </td>

                            <td style="padding: 10px;">
                                ${escaparHtml(area)}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 10px;
                                background-color: #f3f4f6;
                                font-weight: bold;
                            ">
                                Fecha del préstamo
                            </td>

                            <td style="padding: 10px;">
                                ${formatearFecha(prestamo.fecha_prestamo)}
                            </td>
                        </tr>

                        <tr>
                            <td style="
                                padding: 10px;
                                background-color: #f3f4f6;
                                font-weight: bold;
                            ">
                                Fecha límite de devolución
                            </td>

                            <td style="padding: 10px;">
                                ${formatearFecha(
                                    prestamo.fecha_devolucion_programada
                                )}
                            </td>
                        </tr>

                    </table>

                    <h3>
                        Equipos prestados
                    </h3>

                    <table style="
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    ">

                        <thead>
                            <tr>
                                <th style="
                                    padding: 10px;
                                    border: 1px solid #ddd;
                                    background-color: #f3f4f6;
                                    text-align: left;
                                ">
                                    Equipo
                                </th>

                                <th style="
                                    padding: 10px;
                                    border: 1px solid #ddd;
                                    background-color: #f3f4f6;
                                    text-align: left;
                                ">
                                    Número de serie
                                </th>

                                <th style="
                                    padding: 10px;
                                    border: 1px solid #ddd;
                                    background-color: #f3f4f6;
                                    text-align: left;
                                ">
                                    Marca
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            ${generarFilasEquipos(equipos)}
                        </tbody>

                    </table>

                    <div style="
                        margin-top: 25px;
                        padding: 15px;
                        background-color: #f9fafb;
                        border-left: 4px solid #1f2937;
                    ">
                        <strong>Observaciones:</strong>

                        <p style="margin-bottom: 0;">
                            ${escaparHtml(
                                prestamo.observaciones ||
                                'Sin observaciones'
                            )}
                        </p>
                    </div>

                    <p style="
                        margin-top: 30px;
                        font-size: 13px;
                        color: #6b7280;
                    ">
                        Este correo fue generado automáticamente por
                        Registech. Por favor, conserva este recibo como
                        comprobante del préstamo.
                    </p>

                </div>

                <div style="
                    background-color: #f3f4f6;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                ">
                    Registech - Gestión de recursos tecnológicos
                </div>

            </div>

        </body>
        </html>
    `
}

async function enviarCorreo({ para, asunto, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(
            'SMTP no configurado. Correo no enviado a:',
            para
        )

        return {
            enviado: false,
            razon: 'SMTP no configurado'
        }
    }

   const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: para,
    subject: asunto,
    html
})

    console.log(`📧 Correo enviado a ${para}`)

    return {
        enviado: true,
        messageId: info.messageId
    }
}

async function enviarReciboPrestamo(prestamo) {
    const correo =
        prestamo.correo ||
        prestamo.correo_empleado ||
        prestamo.correo_usuario

    if (!correo) {
        console.warn(
            'No se puede enviar el recibo: el destinatario no tiene correo.'
        )

        return {
            enviado: false,
            razon: 'Destinatario sin correo'
        }
    }

    const html = generarHtmlPrestamo(prestamo)

    return await enviarCorreo({
        para: correo,
        asunto: 'Recibo de préstamo de equipos - Registech',
        html
    })
}

async function verificarConexion() {
    try {
        await transporter.verify()

        console.log('✅ Conexión SMTP con Brevo correcta')

        return true
    } catch (error) {
        console.error(
            '❌ Error de conexión SMTP:',
            error.message
        )

        return false
    }
}

module.exports = {
    enviarCorreo,
    enviarReciboPrestamo,
    verificarConexion
}