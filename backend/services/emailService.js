const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs')


// ======================================================
// CONFIGURACIÓN SMTP
// ======================================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})


// ======================================================
// RUTA DE LAS EVIDENCIAS
// ======================================================

const UPLOADS_DIR =
    path.join(__dirname, '..', 'uploads')


// ======================================================
// ESCAPAR HTML
// ======================================================

function escaparHtml(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
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
// FORMATEAR FECHA
// ======================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return 'No especificada'
    }

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


// ======================================================
// FORMATEAR ESTADO DEL PRÉSTAMO
// ======================================================

function formatearEstado(estado) {

    if (!estado) {
        return 'No especificado'
    }

    const estados = {
        activo: 'Activo',
        parcial: 'Parcial',
        devuelto: 'Devuelto'
    }

    return estados[String(estado).toLowerCase()] ||
        String(estado)
}


// ======================================================
// FORMATEAR ESTADO DEL EQUIPO
// ======================================================

function formatearEstadoEquipo(estado) {

    if (!estado) {
        return 'No especificado'
    }

    const estados = {
        disponible: 'Disponible',
        asignado: 'Asignado',
        'en mantenimiento': 'En mantenimiento',
        baja: 'Baja'
    }

    return estados[String(estado).toLowerCase()] ||
        String(estado)
}


// ======================================================
// GENERAR FILAS DE EQUIPOS
// ======================================================

function generarFilasEquipos(equipos) {

    if (
        !Array.isArray(equipos) ||
        equipos.length === 0
    ) {

        return `
            <tr>
                <td
                    colspan="8"
                    style="
                        padding: 15px;
                        text-align: center;
                        border: 1px solid #ddd;
                        color: #6b7280;
                    "
                >
                    No hay equipos registrados.
                </td>
            </tr>
        `
    }


    return equipos.map((equipo, index) => {

        return `
            <tr>

                <td
                    style="
                        padding: 10px;
                        border: 1px solid #ddd;
                        text-align: center;
                    "
                >
                    ${index + 1}
                </td>


                <td
                    style="
                        padding: 10px;
                        border: 1px solid #ddd;
                    "
                >
                    <strong>
                        ${escaparHtml(
                            equipo.equipo ||
                            'No especificado'
                        )}
                    </strong>

                    ${
                        equipo.descripcion
                            ? `
                                <br>

                                <span
                                    style="
                                        font-size: 12px;
                                        color: #6b7280;
                                    "
                                >
                                    ${escaparHtml(
                                        equipo.descripcion
                                    )}
                                </span>
                            `
                            : ''
                    }
                </td>


                <td
                    style="
                        padding: 10px;
                        border: 1px solid #ddd;
                    "
                >
                    ${escaparHtml(
                        equipo.num_serie ||
                        'N/A'
                    )}
                </td>


                <td
                    style="
                        padding: 10px;
                        border: 1px solid #ddd;
                    "
                >
                    ${escaparHtml(
                        equipo.equipo_area ||
                        'No especificada'
                    )}
                </td>


                <td
                    style="
                        padding: 10px;
                        border: 1px solid #ddd;
                    "
                >
                    ${escaparHtml(
                        formatearEstadoEquipo(
                            equipo.estado_equipo
                        )
                    )}
                </td>


                <td
                    style="
                        padding: 10px;
                        border: 1px solid #ddd;
                    "
                >
                    ${escaparHtml(
                        equipo.responsable ||
                        'No especificado'
                    )}
                </td>


                <td
                    style="
                        padding: 10px;
                        border: 1px solid #ddd;
                    "
                >
                    ${escaparHtml(
                        equipo.sistema_operativo ||
                        'No especificado'
                    )}
                </td>


                <td
                    style="
                        padding: 10px;
                        border: 1px solid #ddd;
                    "
                >
                    ${formatearFecha(
                        equipo.fecha_asignacion
                    )}
                </td>

            </tr>
        `
    }).join('')
}


// ======================================================
// GENERAR HTML DEL PRÉSTAMO
// ======================================================

function generarHtmlPrestamo(prestamo) {

    const destinatario =
        prestamo.destinatario ||
        prestamo.empleado ||
        prestamo.usuario ||
        prestamo.nombre_empleado ||
        prestamo.nombre_usuario ||
        prestamo.nombre_destinatario ||
        'Destinatario'


    const tipoDestinatario =
        prestamo.id_empleado
            ? 'Empleado'
            : prestamo.id_usuario
                ? 'Usuario del sistema'
                : 'No especificado'


    const documento =
        prestamo.documento_empleado ||
        'No aplica'


    const correo =
        prestamo.correo ||
        prestamo.correo_empleado ||
        prestamo.correo_usuario ||
        'No registrado'


    const area =
        prestamo.area ||
        prestamo.area_destinatario ||
        'No especificada'


    const equipos =
        Array.isArray(prestamo.equipos)
            ? prestamo.equipos
            : []


    const fechaPrestamo =
        formatearFecha(
            prestamo.fecha_prestamo
        )


    const fechaLimite =
        formatearFecha(
            prestamo.fecha_devolucion_programada
        )


    const fechaDevolucion =
        prestamo.fecha_devolucion
            ? formatearFecha(
                prestamo.fecha_devolucion
            )
            : 'Pendiente'


    const estadoPrestamo =
        formatearEstado(
            prestamo.estado
        )


    const observaciones =
        prestamo.observaciones ||
        'Sin observaciones'


    return `

<!DOCTYPE html>

<html lang="es">

<head>

    <meta charset="UTF-8">

    <title>
        Recibo de préstamo - Registech
    </title>

</head>


<body
    style="
        margin: 0;
        padding: 0;
        background-color: #f4f6f8;
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
    "
>

    <div
        style="
            max-width: 900px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        "
    >

        <div
            style="
                background-color: #1f2937;
                color: #ffffff;
                padding: 28px;
                text-align: center;
            "
        >

            <h1
                style="
                    margin: 0;
                    font-size: 28px;
                "
            >
                Registech
            </h1>


            <p
                style="
                    margin: 8px 0 0;
                    font-size: 15px;
                "
            >
                Comprobante de préstamo de recursos tecnológicos
            </p>

        </div>


        <div
            style="
                padding: 30px;
            "
        >

            <p
                style="
                    font-size: 16px;
                    margin-top: 0;
                "
            >

                Hola

                <strong>
                    ${escaparHtml(destinatario)}
                </strong>,

            </p>


            <p
                style="
                    line-height: 1.6;
                "
            >

                Se ha registrado correctamente un préstamo
                de recursos tecnológicos a tu nombre en
                <strong>Registech</strong>.

                A continuación encontrarás el detalle
                completo del préstamo y de los equipos
                asignados.

            </p>


            <h2
                style="
                    margin-top: 30px;
                    font-size: 20px;
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                "
            >
                Información del préstamo
            </h2>


            <table
                style="
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                "
            >

                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            width: 35%;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ID del préstamo
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(
                            prestamo.id_prestamo ||
                            'No disponible'
                        )}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Estado del préstamo
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(
                            estadoPrestamo
                        )}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Fecha del préstamo
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${fechaPrestamo}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Fecha límite de devolución
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${fechaLimite}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Fecha de devolución
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${fechaDevolucion}
                    </td>

                </tr>

            </table>


            <h2
                style="
                    margin-top: 35px;
                    font-size: 20px;
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                "
            >
                Información del destinatario
            </h2>


            <table
                style="
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                "
            >

                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            width: 35%;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Nombre
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(destinatario)}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Tipo de destinatario
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(tipoDestinatario)}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Documento
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(documento)}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Correo electrónico
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(correo)}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Área
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(area)}
                    </td>

                </tr>

            </table>


            <h2
                style="
                    margin-top: 35px;
                    font-size: 20px;
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                "
            >
                Equipos prestados
            </h2>


            <p
                style="
                    margin-bottom: 15px;
                    color: #4b5563;
                "
            >

                Total de equipos:
                <strong>
                    ${equipos.length}
                </strong>

            </p>


            <div
                style="
                    width: 100%;
                    overflow-x: auto;
                "
            >

                <table
                    style="
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13px;
                    "
                >

                    <thead>

                        <tr>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6;">
                                #
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Equipo
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Número de serie
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Área
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Estado
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Responsable
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Sistema operativo
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Fecha de asignación
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${generarFilasEquipos(equipos)}

                    </tbody>

                </table>

            </div>


            <h2
                style="
                    margin-top: 35px;
                    font-size: 20px;
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                "
            >
                Observaciones
            </h2>


            <div
                style="
                    margin-top: 15px;
                    padding: 16px;
                    background-color: #f9fafb;
                    border-left: 4px solid #1f2937;
                "
            >

                ${escaparHtml(observaciones)}

            </div>


            <div
                style="
                    margin-top: 30px;
                    padding: 18px;
                    background-color: #fff7ed;
                    border: 1px solid #fed7aa;
                    border-radius: 6px;
                "
            >

                <strong>
                    Importante:
                </strong>

                <p
                    style="
                        margin-bottom: 0;
                        line-height: 1.6;
                    "
                >

                    Los equipos relacionados en este comprobante
                    quedan registrados como prestados al
                    destinatario indicado. Por favor, conserva
                    este correo como comprobante del préstamo y
                    realiza la devolución dentro de la fecha
                    establecida.

                </p>

            </div>


            <p
                style="
                    margin-top: 30px;
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.5;
                "
            >

                Este correo fue generado automáticamente por
                <strong>Registech</strong>.

                Por favor, conserva este mensaje como comprobante
                del préstamo de los recursos tecnológicos.

            </p>

        </div>


        <div
            style="
                background-color: #f3f4f6;
                padding: 18px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
            "
        >

            Registech - Gestión de recursos tecnológicos

        </div>

    </div>

</body>

</html>

    `
}


// ======================================================
// GENERAR HTML DE DEVOLUCIÓN
// ======================================================

function generarHtmlDevolucion(prestamo) {

    const destinatario =
        prestamo.destinatario ||
        prestamo.empleado ||
        prestamo.usuario ||
        prestamo.nombre_empleado ||
        prestamo.nombre_usuario ||
        prestamo.nombre_destinatario ||
        'Destinatario'


    const tipoDestinatario =
        prestamo.id_empleado
            ? 'Empleado'
            : prestamo.id_usuario
                ? 'Usuario del sistema'
                : 'No especificado'


    const documento =
        prestamo.documento_empleado ||
        'No aplica'


    const correo =
        prestamo.correo ||
        prestamo.correo_empleado ||
        prestamo.correo_usuario ||
        'No registrado'


    const area =
        prestamo.area ||
        prestamo.area_destinatario ||
        'No especificada'


    const todosLosEquipos =
        Array.isArray(prestamo.equipos)
            ? prestamo.equipos
            : []


    const equiposDevueltos =
        Array.isArray(prestamo.equiposDevueltos)
            ? prestamo.equiposDevueltos
            : []


    const equipos =
        equiposDevueltos.length > 0
            ? todosLosEquipos.filter(
                equipo =>
                    equiposDevueltos.includes(
                        equipo.num_serie
                    )
            )
            : todosLosEquipos


    const fechaPrestamo =
        formatearFecha(
            prestamo.fecha_prestamo
        )


    const fechaLimite =
        formatearFecha(
            prestamo.fecha_devolucion_programada
        )


    const fechaDevolucion =
        formatearFecha(
            prestamo.fecha_devolucion_correo ||
            prestamo.fecha_devolucion ||
            new Date()
        )


    const estadoPrestamo =
        formatearEstado(
            prestamo.estado
        )


    const observaciones =
        prestamo.observaciones ||
        'Sin observaciones'


    return `

<!DOCTYPE html>

<html lang="es">

<head>

    <meta charset="UTF-8">

    <title>
        Comprobante de devolución - Registech
    </title>

</head>


<body
    style="
        margin: 0;
        padding: 0;
        background-color: #f4f6f8;
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
    "
>

    <div
        style="
            max-width: 900px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        "
    >

        <div
            style="
                background-color: #1f2937;
                color: #ffffff;
                padding: 28px;
                text-align: center;
            "
        >

            <h1
                style="
                    margin: 0;
                    font-size: 28px;
                "
            >
                Registech
            </h1>


            <p
                style="
                    margin: 8px 0 0;
                    font-size: 15px;
                "
            >
                Comprobante de devolución de recursos tecnológicos
            </p>

        </div>


        <div
            style="
                padding: 30px;
            "
        >

            <p
                style="
                    font-size: 16px;
                    margin-top: 0;
                "
            >

                Hola

                <strong>
                    ${escaparHtml(destinatario)}
                </strong>,

            </p>


            <p
                style="
                    line-height: 1.6;
                "
            >

                Se ha registrado correctamente la devolución
                de recursos tecnológicos asociados a tu préstamo
                en <strong>Registech</strong>.

                Este correo sirve como comprobante de la devolución
                realizada.

            </p>


            <h2
                style="
                    margin-top: 30px;
                    font-size: 20px;
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                "
            >
                Información de la devolución
            </h2>


            <table
                style="
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                "
            >

                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            width: 35%;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ID del préstamo
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(
                            prestamo.id_prestamo ||
                            'No disponible'
                        )}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Estado del préstamo
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(
                            estadoPrestamo
                        )}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Fecha del préstamo
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${fechaPrestamo}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Fecha límite de devolución
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${fechaLimite}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Fecha de devolución
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${fechaDevolucion}
                    </td>

                </tr>

            </table>


            <h2
                style="
                    margin-top: 35px;
                    font-size: 20px;
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                "
            >
                Información del destinatario
            </h2>


            <table
                style="
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                "
            >

                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            width: 35%;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Nombre
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(destinatario)}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Tipo de destinatario
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(tipoDestinatario)}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Documento
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(documento)}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Correo electrónico
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(correo)}
                    </td>

                </tr>


                <tr>

                    <td
                        style="
                            padding: 11px;
                            background-color: #f3f4f6;
                            font-weight: bold;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        Área
                    </td>

                    <td
                        style="
                            padding: 11px;
                            border: 1px solid #e5e7eb;
                        "
                    >
                        ${escaparHtml(area)}
                    </td>

                </tr>

            </table>


            <h2
                style="
                    margin-top: 35px;
                    font-size: 20px;
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                "
            >
                Equipos devueltos
            </h2>


            <p
                style="
                    margin-bottom: 15px;
                    color: #4b5563;
                "
            >

                Total de equipos devueltos:
                <strong>
                    ${equipos.length}
                </strong>

            </p>


            <div
                style="
                    width: 100%;
                    overflow-x: auto;
                "
            >

                <table
                    style="
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13px;
                    "
                >

                    <thead>

                        <tr>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6;">
                                #
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Equipo
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Número de serie
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Área
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Estado
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Responsable
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Sistema operativo
                            </th>

                            <th style="padding: 10px; border: 1px solid #ddd; background-color: #f3f4f6; text-align: left;">
                                Fecha de asignación
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${generarFilasEquipos(equipos)}

                    </tbody>

                </table>

            </div>


            <h2
                style="
                    margin-top: 35px;
                    font-size: 20px;
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                "
            >
                Observaciones
            </h2>


            <div
                style="
                    margin-top: 15px;
                    padding: 16px;
                    background-color: #f9fafb;
                    border-left: 4px solid #1f2937;
                "
            >

                ${escaparHtml(observaciones)}

            </div>


            ${
                prestamo.evidencia
                    ? `
                        <div
                            style="
                                margin-top: 30px;
                                padding: 18px;
                                background-color: #eff6ff;
                                border: 1px solid #bfdbfe;
                                border-radius: 6px;
                            "
                        >

                            <strong>
                                Evidencia de devolución:
                            </strong>

                            <p
                                style="
                                    margin-bottom: 0;
                                    line-height: 1.6;
                                "
                            >

                                Se adjuntó al correo la evidencia
                                registrada durante la devolución.

                            </p>

                        </div>
                    `
                    : ''
            }


            <div
                style="
                    margin-top: 30px;
                    padding: 18px;
                    background-color: #ecfdf5;
                    border: 1px solid #a7f3d0;
                    border-radius: 6px;
                "
            >

                <strong>
                    Devolución registrada:
                </strong>

                <p
                    style="
                        margin-bottom: 0;
                        line-height: 1.6;
                    "
                >

                    Los equipos relacionados anteriormente
                    fueron registrados como devueltos en
                    <strong>Registech</strong>.

                    Conserva este correo como comprobante
                    de la devolución realizada.

                </p>

            </div>


            <p
                style="
                    margin-top: 30px;
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.5;
                "
            >

                Este correo fue generado automáticamente por
                <strong>Registech</strong>.

            </p>

        </div>


        <div
            style="
                background-color: #f3f4f6;
                padding: 18px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
            "
        >

            Registech - Gestión de recursos tecnológicos

        </div>

    </div>

</body>

</html>

    `
}


// ======================================================
// ENVIAR CORREO
// ======================================================

async function enviarCorreo({
    para,
    asunto,
    html,
    attachments = []
}) {

    if (
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS
    ) {

        console.warn(
            'SMTP no configurado. Correo no enviado a:',
            para
        )

        return {
            enviado: false,
            razon: 'SMTP no configurado'
        }
    }


    const info =
        await transporter.sendMail({

            from:
                process.env.SMTP_FROM,

            to:
                para,

            subject:
                asunto,

            html,

            attachments
        })


    console.log(
        `📧 Correo enviado a ${para}`
    )


    return {

        enviado: true,

        messageId:
            info.messageId
    }
}


// ======================================================
// ENVIAR RECIBO DEL PRÉSTAMO
// ======================================================

async function enviarReciboPrestamo(
    prestamo
) {

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

            razon:
                'Destinatario sin correo'
        }
    }


    const html =
        generarHtmlPrestamo(
            prestamo
        )


    return await enviarCorreo({

        para:
            correo,

        asunto:
            'Comprobante de préstamo de equipos - Registech',

        html
    })
}


// ======================================================
// ENVIAR RECIBO DE DEVOLUCIÓN
// ======================================================

async function enviarReciboDevolucion(
    prestamo
) {

    const correo =
        prestamo.correo ||
        prestamo.correo_empleado ||
        prestamo.correo_usuario


    if (!correo) {

        console.warn(
            'No se puede enviar el comprobante de devolución: el destinatario no tiene correo.'
        )

        return {

            enviado: false,

            razon:
                'Destinatario sin correo'
        }
    }


    const html =
        generarHtmlDevolucion(
            prestamo
        )


    // ==============================================
    // PREPARAR EVIDENCIA COMO ADJUNTO
    // ==============================================

    const attachments = []


    if (prestamo.evidencia) {

        const nombreArchivo =
            path.basename(
                prestamo.evidencia
            )

        const rutaEvidencia =
            path.join(
                UPLOADS_DIR,
                nombreArchivo
            )


        if (fs.existsSync(rutaEvidencia)) {

            attachments.push({
                filename: nombreArchivo,
                path: rutaEvidencia
            })

            console.log(
                `📎 Evidencia adjuntada al correo: ${rutaEvidencia}`
            )

        } else {

            console.warn(
                `⚠️ No se encontró la evidencia en: ${rutaEvidencia}`
            )
        }
    }


    return await enviarCorreo({

        para:
            correo,

        asunto:
            'Comprobante de devolución de equipos - Registech',

        html,

        attachments
    })
}


// ======================================================
// VERIFICAR CONEXIÓN SMTP
// ======================================================

async function verificarConexion() {

    try {

        await transporter.verify()

        console.log(' Conexión SMTP con Brevo correcta')

        console.log(
            '✅ Conexión SMTP con Brevo correcta'
        )

        return true

    } catch (error) {

        console.error(
            ' Error de conexión SMTP:',
            error.message
        )

        return false
    }
}


// ======================================================
// EXPORTAR FUNCIONES
// ======================================================

module.exports = {

    enviarCorreo,

    enviarReciboPrestamo,

    enviarReciboDevolucion,

    verificarConexion
}