const nodemailer = require('nodemailer')

// ======================================================
// CONFIGURACIÓN DEL TRANSPORTADOR
// ======================================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,

    secure:
        String(process.env.SMTP_SECURE).toLowerCase() === 'true',

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})


// ======================================================
// FORMATEAR FECHA
// ======================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return 'No especificada'
    }

    const fechaObj = new Date(fecha)

    if (Number.isNaN(fechaObj.getTime())) {
        return 'No especificada'
    }

    return fechaObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}


// ======================================================
// ESCAPAR HTML
// Evita insertar contenido no confiable directamente
// dentro del correo.
// ======================================================

function escaparHtml(valor) {

    if (valor === null || valor === undefined) {
        return ''
    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}


// ======================================================
// GENERAR FILAS DE EQUIPOS
// ======================================================

function generarFilasEquipos(equipos = []) {

    if (!Array.isArray(equipos) || equipos.length === 0) {

        return `
            <tr>
                <td colspan="5" style="
                    padding: 15px;
                    text-align: center;
                    color: #666;
                ">
                    No hay equipos registrados en este préstamo.
                </td>
            </tr>
        `
    }

    return equipos.map((equipo, index) => {

        return `
            <tr>
                <td style="
                    padding: 10px;
                    border: 1px solid #ddd;
                    text-align: center;
                ">
                    ${index + 1}
                </td>

                <td style="
                    padding: 10px;
                    border: 1px solid #ddd;
                ">
                    ${escaparHtml(equipo.equipo || 'No especificado')}
                </td>

                <td style="
                    padding: 10px;
                    border: 1px solid #ddd;
                ">
                    ${escaparHtml(equipo.num_serie || 'No especificado')}
                </td>

                <td style="
                    padding: 10px;
                    border: 1px solid #ddd;
                ">
                    ${escaparHtml(equipo.descripcion || 'Sin descripción')}
                </td>

                <td style="
                    padding: 10px;
                    border: 1px solid #ddd;
                ">
                    ${escaparHtml(equipo.estado_equipo || equipo.estado || 'No especificado')}
                </td>
            </tr>
        `
    }).join('')
}


// ======================================================
// GENERAR HTML DEL CORREO
// ======================================================

function generarHtmlPrestamo(prestamo) {

    const nombreDestinatario =
        prestamo.destinatario ||
        'Usuario'

    const area =
        prestamo.area ||
        'No especificada'

    const fechaPrestamo =
        formatearFecha(prestamo.fecha_prestamo)

    const fechaLimite =
        formatearFecha(
            prestamo.fecha_limite ||
            prestamo.fecha_devolucion
        )

    const observaciones =
        prestamo.observaciones ||
        'Sin observaciones'

    const equipos =
        Array.isArray(prestamo.equipos)
            ? prestamo.equipos
            : []

    return `
<!DOCTYPE html>

<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
        content="width=device-width, initial-scale=1.0">

    <title>Recibo de préstamo - Registech</title>

</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f4f6f8;
    font-family: Arial, Helvetica, sans-serif;
">

    <div style="
        max-width: 800px;
        margin: 30px auto;
        background-color: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    ">

        <!-- ==================================================
             ENCABEZADO
        =================================================== -->

        <div style="
            background-color: #1f2937;
            padding: 25px;
            text-align: center;
        ">

            <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 28px;
            ">
                Registech
            </h1>

            <p style="
                margin: 8px 0 0;
                color: #d1d5db;
                font-size: 15px;
            ">
                Recibo de préstamo de equipos tecnológicos
            </p>

        </div>


        <!-- ==================================================
             CONTENIDO
        =================================================== -->

        <div style="
            padding: 30px;
        ">

            <h2 style="
                margin-top: 0;
                color: #1f2937;
                font-size: 21px;
            ">
                Préstamo registrado correctamente
            </h2>


            <p style="
                color: #4b5563;
                font-size: 15px;
                line-height: 1.6;
            ">

                Hola
                <strong>
                    ${escaparHtml(nombreDestinatario)}
                </strong>,

                <br><br>

                Se ha registrado un préstamo de equipos
                tecnológicos a tu nombre. A continuación
                encontrarás toda la información correspondiente.

            </p>


            <!-- ==================================================
                 INFORMACIÓN DEL PRÉSTAMO
            =================================================== -->

            <div style="
                margin-top: 25px;
                margin-bottom: 25px;
                padding: 20px;
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            ">

                <h3 style="
                    margin-top: 0;
                    color: #1f2937;
                    font-size: 17px;
                ">
                    Información del préstamo
                </h3>


                <p style="
                    margin: 8px 0;
                    color: #4b5563;
                ">
                    <strong>Identificador:</strong>
                    ${escaparHtml(prestamo.id_prestamo)}
                </p>


                <p style="
                    margin: 8px 0;
                    color: #4b5563;
                ">
                    <strong>Destinatario:</strong>
                    ${escaparHtml(nombreDestinatario)}
                </p>


                <p style="
                    margin: 8px 0;
                    color: #4b5563;
                ">
                    <strong>Área:</strong>
                    ${escaparHtml(area)}
                </p>


                <p style="
                    margin: 8px 0;
                    color: #4b5563;
                ">
                    <strong>Fecha del préstamo:</strong>
                    ${escaparHtml(fechaPrestamo)}
                </p>


                <p style="
                    margin: 8px 0;
                    color: #4b5563;
                ">
                    <strong>Fecha límite de devolución:</strong>
                    ${escaparHtml(fechaLimite)}
                </p>


                <p style="
                    margin: 8px 0;
                    color: #4b5563;
                ">
                    <strong>Estado:</strong>
                    ${escaparHtml(prestamo.estado || 'Activo')}
                </p>


                <p style="
                    margin: 8px 0;
                    color: #4b5563;
                ">
                    <strong>Observaciones:</strong>
                    ${escaparHtml(observaciones)}
                </p>

            </div>


            <!-- ==================================================
                 EQUIPOS
            =================================================== -->

            <h3 style="
                color: #1f2937;
                font-size: 17px;
                margin-bottom: 12px;
            ">
                Equipos incluidos
            </h3>


            <div style="
                overflow-x: auto;
            ">

                <table style="
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                ">

                    <thead>

                        <tr style="
                            background-color: #f3f4f6;
                        ">

                            <th style="
                                padding: 10px;
                                border: 1px solid #ddd;
                            ">
                                #
                            </th>

                            <th style="
                                padding: 10px;
                                border: 1px solid #ddd;
                                text-align: left;
                            ">
                                Equipo
                            </th>

                            <th style="
                                padding: 10px;
                                border: 1px solid #ddd;
                                text-align: left;
                            ">
                                Número de serie
                            </th>

                            <th style="
                                padding: 10px;
                                border: 1px solid #ddd;
                                text-align: left;
                            ">
                                Descripción
                            </th>

                            <th style="
                                padding: 10px;
                                border: 1px solid #ddd;
                                text-align: left;
                            ">
                                Estado
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${generarFilasEquipos(equipos)}

                    </tbody>

                </table>

            </div>


            <p style="
                margin-top: 30px;
                color: #4b5563;
                font-size: 14px;
                line-height: 1.6;
            ">

                Recuerda conservar este correo como comprobante
                del préstamo y realizar la devolución de los
                equipos dentro de la fecha establecida.

            </p>

        </div>


        <!-- ==================================================
             PIE DE CORREO
        =================================================== -->

        <div style="
            padding: 20px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        ">

            <p style="
                margin: 0;
                color: #6b7280;
                font-size: 13px;
            ">
                Este correo fue generado automáticamente por Registech.
            </p>

            <p style="
                margin: 8px 0 0;
                color: #9ca3af;
                font-size: 12px;
            ">
                Por favor, no respondas directamente a este mensaje.
            </p>

        </div>

    </div>

</body>

</html>
`
}


// ======================================================
// VERIFICAR CONFIGURACIÓN DEL SERVIDOR SMTP
// ======================================================

exports.verificarConexion = async () => {

    try {

        await transporter.verify()

        console.log(
            'Servidor de correo configurado correctamente'
        )

        return true

    } catch (error) {

        console.error(
            'Error al verificar el servidor de correo:',
            error.message
        )

        return false
    }
}


// ======================================================
// ENVIAR RECIBO DE PRÉSTAMO
// ======================================================

exports.enviarReciboPrestamo = async (prestamo) => {

    if (!prestamo) {
        throw new Error(
            'INFORMACION_PRESTAMO_REQUERIDA'
        )
    }


    if (!prestamo.correo) {

        throw new Error(
            'CORREO_DESTINATARIO_REQUERIDO'
        )
    }


    const nombreDestinatario =
        prestamo.destinatario ||
        'Usuario'


    const asunto =
        `Recibo de préstamo de equipos - Registech`


    const html =
        generarHtmlPrestamo(prestamo)


    try {

        const resultado =
            await transporter.sendMail({

                from:
                    process.env.SMTP_FROM ||
                    process.env.SMTP_USER,

                to:
                    prestamo.correo,

                subject:
                    asunto,

                html
            })


        console.log(
            `Correo enviado correctamente a ${prestamo.correo}`
        )


        return {

            enviado: true,

            messageId:
                resultado.messageId,

            destinatario:
                prestamo.correo,

            nombre:
                nombreDestinatario
        }

    } catch (error) {

        console.error(
            'Error enviando correo:',
            error.message
        )

        throw new Error(
            'ERROR_ENVIO_CORREO'
        )
    }
}