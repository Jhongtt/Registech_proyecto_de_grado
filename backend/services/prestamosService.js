const prestamosRepository = require('../repository/prestamosRepository')
const { sanitizarTexto, sanitizarHtml } = require('../utils/sanitize')

// Valida formato YYYY-MM-DD; devuelve null si viene vacío o inválido
function validarFecha(valor) {
    if (!valor) return null

    return /^\d{4}-\d{2}-\d{2}$/.test(String(valor))
        ? String(valor)
        : null
}


// ======================================================
// OBTENER PRÉSTAMOS
// ======================================================

exports.getPrestamos = async () => {
    return await prestamosRepository.findPrestamos()
}


// ======================================================
// OBTENER PRÉSTAMOS ACTIVOS
// ======================================================

exports.getPrestamosActivos = async () => {
    return await prestamosRepository.findPrestamosActivos()
}


// ======================================================
// BUSCAR PRÉSTAMO ACTIVO POR EQUIPO
// ======================================================

exports.getPrestamoActivoPorEquipo = async (num_serie) => {

    const numSerieLimpio = sanitizarTexto(num_serie, 50)

    if (!numSerieLimpio) {
        throw new Error('REQUERIDOS')
    }

    return await prestamosRepository.findPrestamoActivoPorEquipo(
        numSerieLimpio
    )
}


// ======================================================
// CREAR PRÉSTAMO CON VARIOS EQUIPOS
// ======================================================

exports.crearPrestamo = async (
    num_series,
    id_empleado,
    id_usuario,
    observaciones,
    fecha_inicio,
    fecha_limite
) => {

    // ==================================================
    // 1. SANITIZAR DESTINATARIO
    // ==================================================

    const idEmpleadoLimpio = id_empleado
        ? sanitizarTexto(id_empleado, 50)
        : null

    const idUsuarioLimpio = id_usuario
        ? Number(id_usuario)
        : null

    // ==================================================
    // 2. SANITIZAR NÚMEROS DE SERIE
    // ==================================================

    const numSeriesLimpios = Array.isArray(num_series)
        ? num_series
            .map(numSerie => sanitizarTexto(numSerie, 50))
            .filter(Boolean)
        : []

    // ==================================================
    // 3. SANITIZAR OBSERVACIONES
    // ==================================================

    const observacionesLimpias = observaciones
        ? sanitizarHtml(observaciones, 500)
        : null

    // ==================================================
    // 4. VALIDAR FECHAS
    // ==================================================

    const fechaInicioLimpia = validarFecha(fecha_inicio)

    const fechaLimiteLimpia = validarFecha(fecha_limite)

    // ==================================================
    // 5. VALIDAR CAMPOS REQUERIDOS
    // ==================================================

    if (
        numSeriesLimpios.length === 0 ||
        (!idEmpleadoLimpio && !idUsuarioLimpio)
    ) {
        throw new Error('REQUERIDOS')
    }

    // ==================================================
    // 6. VALIDAR QUE NO SE ENVÍEN AMBOS
    // ==================================================

    if (idEmpleadoLimpio && idUsuarioLimpio) {
        throw new Error('DESTINATARIO_INVALIDO')
    }

    // ==================================================
    // 7. VALIDAR FECHAS
    // ==================================================

    if (
        fechaInicioLimpia &&
        fechaLimiteLimpia &&
        fechaLimiteLimpia < fechaInicioLimpia
    ) {
        throw new Error('FECHAS_INVALIDAS')
    }

    // ==================================================
    // 8. CREAR PRÉSTAMO
    // ==================================================

    return await prestamosRepository.crearPrestamoTransaction(
        numSeriesLimpios,
        idEmpleadoLimpio,
        idUsuarioLimpio,
        observacionesLimpias,
        fechaInicioLimpia,
        fechaLimiteLimpia
    )
}


// ======================================================
// DEVOLVER PRÉSTAMO COMPLETO
// ======================================================

exports.devolverPrestamo = async (
    id,
    observaciones,
    evidencia
) => {

    const idLimpio = sanitizarTexto(id, 50)

    const obsLimpia = observaciones
        ? sanitizarTexto(observaciones, 500)
        : null

    if (!idLimpio) {
        throw new Error('REQUERIDOS')
    }

    return await prestamosRepository.devolverPrestamoTransaction(
        idLimpio,
        obsLimpia,
        evidencia
    )
}


// ======================================================
// DEVOLVER UN EQUIPO
// ======================================================

exports.devolverEquipo = async (
    id,
    num_serie,
    observaciones,
    evidencia
) => {

    const idLimpio = sanitizarTexto(id, 50)

    const numSerieLimpio = sanitizarTexto(
        num_serie,
        50
    )

    const obsLimpia = observaciones
        ? sanitizarTexto(observaciones, 500)
        : null

    if (!idLimpio || !numSerieLimpio) {
        throw new Error('REQUERIDOS')
    }

    return await prestamosRepository.devolverEquipoTransaction(
        idLimpio,
        numSerieLimpio,
        obsLimpia,
        evidencia
    )
}


// ======================================================
// HISTORIAL DE EQUIPO
// ======================================================

exports.historialEquipo = async (num_serie) => {

    const numSerieLimpio = sanitizarTexto(
        num_serie,
        50
    )

    if (!numSerieLimpio) {
        throw new Error('REQUERIDOS')
    }

    return await prestamosRepository.findHistorialEquipo(
        numSerieLimpio
    )
}


// ======================================================
// ESTADÍSTICAS
// ======================================================

exports.getEstadisticas = async () => {
    return await prestamosRepository.getEstadisticasData()
}