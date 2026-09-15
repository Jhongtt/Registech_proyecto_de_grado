const prestamosRepository = require('../repository/prestamosRepository')
const { enviarCorreo } = require('./emailService')


// ======================================================
// FORMATEAR FECHA
// ======================================================

function formatearFecha(fecha) {

    if (!fecha) return 'No definida'

    const fechaLocal = new Date(fecha)

    return fechaLocal.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}


// ======================================================
// OBTENER CORREO DEL DESTINATARIO
// ======================================================

function obtenerCorreo(prestamo) {

    return (
        prestamo.empleado?.correo ||
        prestamo.usuario?.correo ||
        null
    )
}


// ======================================================
// OBTENER NOMBRE DEL DESTINATARIO
// ======================================================

function obtenerNombre(prestamo) {

    return (
        prestamo.empleado?.nombre ||
        prestamo.usuario?.nombre ||
        'Usuario'
    )
}


// ======================================================
// GENERAR HTML DEL RECORDATORIO
// ======================================================

function generarHtmlRecordatorio(
    prestamo,
    titulo,
    mensaje
) {

    const nombre =
        obtenerNombre(prestamo)

    const fechaLimite =
        formatearFecha(
            prestamo.fecha_devolucion_programada
        )

    const equipos =
        prestamo.equipos
            .map(relacion =>
                `<li>
                    ${relacion.equipo?.equipo || 'Equipo tecnológico'}
                    - Serial: ${relacion.num_serie}
                </li>`
            )
            .join('')


    return `
        <div style="font-family: Arial, sans-serif;">

            <h2>${titulo}</h2>

            <p>
                Hola <strong>${nombre}</strong>,
            </p>

            <p>
                ${mensaje}
            </p>

            <h3>Información del préstamo</h3>

            <p>
                <strong>ID del préstamo:</strong>
                ${prestamo.id_prestamo}
            </p>

            <p>
                <strong>Fecha de devolución programada:</strong>
                ${fechaLimite}
            </p>

            <h3>Equipos asociados</h3>

            <ul>
                ${equipos}
            </ul>

            ${
                prestamo.observaciones
                    ? `
                        <p>
                            <strong>Observaciones:</strong>
                            ${prestamo.observaciones}
                        </p>
                    `
                    : ''
            }

            <p>
                Por favor, realiza la devolución de los equipos
                dentro del plazo establecido.
            </p>

            <p>
                <strong>Registech</strong>
            </p>

        </div>
    `
}


// ======================================================
// PROCESAR RECORDATORIOS
// ======================================================

exports.procesarRecordatorios = async () => {

    try {

        const prestamos =
            await prestamosRepository
                .findPrestamosParaRecordatorio()


        const hoy = new Date()

        hoy.setHours(
            0,
            0,
            0,
            0
        )


        for (const prestamo of prestamos) {

            const correo =
                obtenerCorreo(prestamo)

            if (!correo) {
                console.warn(
                    `El préstamo ${prestamo.id_prestamo} no tiene correo`
                )

                continue
            }


            const fechaDevolucion =
                new Date(
                    prestamo.fecha_devolucion_programada
                )

            fechaDevolucion.setHours(
                0,
                0,
                0,
                0
            )


            const diferencia =
                Math.round(
                    (
                        fechaDevolucion - hoy
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                )


            // ==================================================
            // 3 DÍAS ANTES
            // ==================================================

            if (
                diferencia === 3 &&
                !prestamo.recordatorio_3_dias
            ) {

                await enviarCorreo({

                    para: correo,

                    asunto:
                        'Recordatorio: devolución de equipo en 3 días',

                    html:
                        generarHtmlRecordatorio(

                            prestamo,

                            'Recordatorio de devolución',

                            'Tu préstamo tiene una devolución programada dentro de 3 días.'
                        )
                })


                await prestamosRepository
                    .marcarRecordatorioEnviado(
                        prestamo.id_prestamo,
                        'recordatorio_3_dias'
                    )


                continue
            }


            // ==================================================
            // 1 DÍA ANTES
            // ==================================================

            if (
                diferencia === 1 &&
                !prestamo.recordatorio_1_dia
            ) {

                await enviarCorreo({

                    para: correo,

                    asunto:
                        'Recordatorio: devolución de equipo mañana',

                    html:
                        generarHtmlRecordatorio(

                            prestamo,

                            'Devolución programada para mañana',

                            'Te recordamos que la devolución de tu equipo está programada para mañana.'
                        )
                })


                await prestamosRepository
                    .marcarRecordatorioEnviado(
                        prestamo.id_prestamo,
                        'recordatorio_1_dia'
                    )


                continue
            }


            // ==================================================
            // DÍA DE VENCIMIENTO
            // ==================================================

            if (
                diferencia === 0 &&
                !prestamo.recordatorio_vencimiento
            ) {

                await enviarCorreo({

                    para: correo,

                    asunto:
                        'Recordatorio: devolución de equipo hoy',

                    html:
                        generarHtmlRecordatorio(

                            prestamo,

                            'La devolución vence hoy',

                            'Te informamos que hoy es la fecha programada para la devolución del equipo.'
                        )
                })


                await prestamosRepository
                    .marcarRecordatorioEnviado(
                        prestamo.id_prestamo,
                        'recordatorio_vencimiento'
                    )


                continue
            }


            // ==================================================
            // PRÉSTAMO VENCIDO
            // ==================================================

            if (
                diferencia < 0 &&
                !prestamo.recordatorio_vencido
            ) {

                await enviarCorreo({

                    para: correo,

                    asunto:
                        'Aviso: préstamo vencido',

                    html:
                        generarHtmlRecordatorio(

                            prestamo,

                            'Préstamo vencido',

                            `La fecha de devolución programada fue el ${formatearFecha(prestamo.fecha_devolucion_programada)} y el préstamo aún aparece como pendiente de devolución.`
                        )
                })


                await prestamosRepository
                    .marcarRecordatorioEnviado(
                        prestamo.id_prestamo,
                        'recordatorio_vencido'
                    )
            }
        }

    } catch (error) {

        console.error(
            'Error procesando recordatorios:',
            error
        )
    }
}