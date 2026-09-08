const empleadosRepository = require('../repository/empleadosRepository')
const { sanitizarTexto } = require('../utils/sanitize')

exports.getEmpleados = async () => {
    return await empleadosRepository.findAll()
}

exports.createEmpleado = async (data) => {
    const nombre = sanitizarTexto(data.nombre, 200)
    const tipo_documento = sanitizarTexto(data.tipo_documento, 30)
    const documento = sanitizarTexto(data.documento, 30)
    const correo = data.correo
        ? sanitizarTexto(data.correo, 100).toLowerCase()
        : null
    const area = sanitizarTexto(data.area, 100)

    if (!nombre || !tipo_documento || !documento || !area) {
        throw new Error('REQUERIDOS')
    }

    const empleadoExistente =
        await empleadosRepository.findByDocumento(documento)

    if (empleadoExistente) {
        throw new Error('DUPLICATE')
    }

    return await empleadosRepository.create({
        nombre,
        tipo_documento,
        documento,
        correo,
        area,
        estado: 'activo'
    })
}

exports.updateEmpleado = async (id, data) => {
    const dataActualizar = {}

    if (data.nombre !== undefined) {
        dataActualizar.nombre = sanitizarTexto(data.nombre, 200)
    }

    if (data.tipo_documento !== undefined) {
        dataActualizar.tipo_documento =
            sanitizarTexto(data.tipo_documento, 30)
    }

    if (data.documento !== undefined) {
        const documento = sanitizarTexto(data.documento, 30)

        const existente =
            await empleadosRepository.findByDocumento(documento)

        if (existente && existente.id_empleado !== String(id)) {
            throw new Error('DUPLICATE')
        }

        dataActualizar.documento = documento
    }

    if (data.correo !== undefined) {
        dataActualizar.correo = data.correo
            ? sanitizarTexto(data.correo, 100).toLowerCase()
            : null
    }

    if (data.area !== undefined) {
        dataActualizar.area = sanitizarTexto(data.area, 100)
    }

    if (data.estado !== undefined) {
        dataActualizar.estado = sanitizarTexto(data.estado, 15)
    }

    return await empleadosRepository.update(id, dataActualizar)
}

exports.deleteEmpleado = async (id) => {
    return await empleadosRepository.delete(id)
}