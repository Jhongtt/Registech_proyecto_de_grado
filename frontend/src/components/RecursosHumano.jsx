import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const RecursosHumanos = () => {

    const [usuarios, setUsuarios] = useState([])
    const [areas, setAreas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [modalUsuario, setModalUsuario] = useState(false)

    const [filteredUsuarios, setFilteredUsuarios] = useState([])

    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState({
        nombre: '',
        usuario: '',
        contrasena: '',
        area: '',
        correo: '',
        estado: '',
        isEditing: false
    })

    const [filter, setFilter] = useState('')

    // ======================================================
    // ESTADOS DEL HISTORIAL
    // ======================================================

    const [modalHistorial, setModalHistorial] = useState(false)
    const [historialUsuario, setHistorialUsuario] = useState([])
    const [usuarioHistorialSeleccionado, setUsuarioHistorialSeleccionado] = useState(null)
    const [loadingHistorial, setLoadingHistorial] = useState(false)

    // ======================================================
    // OBTENER USUARIOS
    // ======================================================

    useEffect(() => {

        axios.get(API_ROUTES.OBTENER_USUARIOS)

            .then(response => {

                setUsuarios(response.data)
                setFilteredUsuarios(response.data)
                setLoading(false)

            })

            .catch(err => {

                console.error(err)

                setError(
                    'Hubo un error al obtener los usuarios'
                )

                setLoading(false)

            })

    }, [])

    // ======================================================
    // OBTENER ÁREAS
    // ======================================================

    useEffect(() => {

        axios.get(API_ROUTES.OBTENER_AREAS)

            .then(response => {

                setAreas(response.data)

            })

            .catch(err => {

                console.error(err)

                setError(
                    'Hubo un error al obtener las áreas'
                )

            })

    }, [])

    // ======================================================
    // FILTRAR USUARIOS
    // ======================================================

    const handleFilterChange = (e) => {

        const value = e.target.value

        setFilter(value)

        const filtered = usuarios.filter(usuario =>
            usuario.nombre
                .toLowerCase()
                .includes(value.toLowerCase()) ||

            usuario.usuario
                .toLowerCase()
                .includes(value.toLowerCase()) ||

            usuario.area
                .toLowerCase()
                .includes(value.toLowerCase()) ||

            usuario.estado
                .toLowerCase()
                .includes(value.toLowerCase())
        )

        setFilteredUsuarios(filtered)

    }

    // ======================================================
    // NUEVO USUARIO
    // ======================================================

    const nuevoUsuario = () => {

        setUsuarioSeleccionado({

            nombre: '',
            usuario: '',
            contrasena: '',
            area: '',
            correo: '',
            estado: 'activo',
            isEditing: false

        })

        setModalUsuario(true)

    }

    // ======================================================
    // EDITAR USUARIO
    // ======================================================

    const editarUsuario = (usuario) => {

        setUsuarioSeleccionado({

            ...usuario,
            isEditing: true

        })

        setModalUsuario(true)

    }

    // ======================================================
    // CAMBIOS EN FORMULARIO
    // ======================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target

        setUsuarioSeleccionado({

            ...usuarioSeleccionado,
            [name]: value

        })

    }

    // ======================================================
    // GUARDAR USUARIO
    // ======================================================

    const guardarUsuario = () => {

        if (usuarioSeleccionado.isEditing) {

            axios.put(

                API_ROUTES.ACTUALIZAR_USUARIO(
                    usuarioSeleccionado.usuario
                ),

                {
                    nombre: usuarioSeleccionado.nombre,
                    contrasena: usuarioSeleccionado.contrasena,
                    area: usuarioSeleccionado.area,
                    correo: usuarioSeleccionado.correo,
                    estado: usuarioSeleccionado.estado
                }

            )

                .then(response => {

                    const updateUsuarios =
                        usuarios.map(usuario =>

                            usuario.usuario ===
                                usuarioSeleccionado.usuario

                                ? {
                                    ...usuarioSeleccionado,
                                    ...response.data
                                }

                                : usuario

                        )

                    setUsuarios(updateUsuarios)
                    setFilteredUsuarios(updateUsuarios)
                    setModalUsuario(false)

                    Swal.fire({

                        icon: 'success',

                        title:
                            'Usuario actualizado correctamente',

                        showConfirmButton: false,

                        timer: 1500

                    })

                })

                .catch(err => {

                    console.error(err)

                    setError(
                        'Error al actualizar el usuario'
                    )

                    Swal.fire({

                        icon: 'error',

                        title:
                            'Hubo un error al actualizar el usuario',

                        showConfirmButton: false,

                        timer: 1500

                    })

                })

        } else {

            axios.post(

                API_ROUTES.CREAR_USUARIO,

                usuarioSeleccionado

            )

                .then(response => {

                    const newUsuarios = [

                        ...usuarios,
                        response.data

                    ]

                    setUsuarios(newUsuarios)
                    setFilteredUsuarios(newUsuarios)
                    setModalUsuario(false)

                    Swal.fire({

                        icon: 'success',

                        title:
                            'Usuario creado correctamente',

                        showConfirmButton: false,

                        timer: 1500

                    })

                })

                .catch(err => {

                    console.error(err)

                    setError(
                        'Error al crear el usuario'
                    )

                    Swal.fire({

                        icon: 'error',

                        title:
                            'Error al crear el usuario',

                        text:
                            err.response?.data?.error ||
                            'Hubo un problema al crear el usuario'

                    })

                })

        }

    }

    // ======================================================
    // ELIMINAR / DESACTIVAR USUARIO
    // ======================================================

    const borrarUsuario = async (usuario) => {

        try {

            const response = await axios.get(

                API_ROUTES.VERIFICAR_ELIMINACION(
                    usuario.usuario
                )

            )

            // ==================================================
            // TIENE PRÉSTAMO ACTIVO O PARCIAL
            // ==================================================

            if (response.data.tienePrestamoActivo) {

                Swal.fire({

                    icon: 'error',

                    title:
                        'No se puede eliminar',

                    text:
                        'Este usuario tiene un préstamo activo y no puede ser eliminado.',

                    confirmButtonText:
                        'Aceptar'

                })

                return

            }

            // ==================================================
            // TIENE HISTORIAL
            // ==================================================

            if (response.data.tieneHistorial) {

                const result = await Swal.fire({

                    icon: 'warning',

                    title:
                        'Usuario con historial',

                    text:
                        `El usuario ${usuario.nombre} tiene historial de préstamos. No se puede eliminar y será desactivado.`,

                    showCancelButton: true,

                    confirmButtonText:
                        'Sí, desactivar',

                    cancelButtonText:
                        'Cancelar'

                })

                if (!result.isConfirmed) {

                    return

                }

            } else {

                // ==================================================
                // NUNCA HA TENIDO PRÉSTAMOS
                // ==================================================

                const result = await Swal.fire({

                    icon: 'warning',

                    title:
                        '¿Estás seguro?',

                    text:
                        `¿Deseas eliminar definitivamente al usuario ${usuario.nombre}?`,

                    showCancelButton: true,

                    confirmButtonText:
                        'Sí, eliminar',

                    cancelButtonText:
                        'Cancelar'

                })

                if (!result.isConfirmed) {

                    return

                }

            }

            // ==================================================
            // EJECUTAR ELIMINACIÓN O DESACTIVACIÓN
            // ==================================================

            const resultado = await axios.delete(

                API_ROUTES.ELIMINAR_USUARIO(
                    usuario.usuario
                )

            )

            // ==================================================
            // FUE DESACTIVADO
            // ==================================================

            if (resultado.data?.desactivado) {

                const updateUsuarios =
                    usuarios.map(u =>

                        u.usuario === usuario.usuario

                            ? {
                                ...u,
                                estado: 'inactivo'
                            }

                            : u

                    )

                setUsuarios(updateUsuarios)
                setFilteredUsuarios(updateUsuarios)

                Swal.fire({

                    icon: 'warning',

                    title:
                        'Usuario desactivado',

                    text:
                        'El usuario tiene historial de préstamos y ha sido desactivado correctamente.',

                    confirmButtonText:
                        'Aceptar'

                })

                return

            }

            // ==================================================
            // FUE ELIMINADO
            // ==================================================

            const updateUsuarios =
                usuarios.filter(
                    u =>
                        u.usuario !== usuario.usuario
                )

            setUsuarios(updateUsuarios)
            setFilteredUsuarios(updateUsuarios)

            Swal.fire({

                icon: 'success',

                title:
                    'Usuario eliminado',

                text:
                    'El usuario fue eliminado correctamente.',

                showConfirmButton: false,

                timer: 1500

            })

        } catch (err) {

            console.error(err)

            // ==================================================
            // ERROR DE PRÉSTAMO ACTIVO
            // ==================================================

            if (err.response?.status === 409) {

                Swal.fire({

                    icon: 'error',

                    title:
                        'No se puede eliminar',

                    text:
                        err.response?.data?.error ||
                        'Este usuario tiene un préstamo activo y no puede ser eliminado.',

                    confirmButtonText:
                        'Aceptar'

                })

                return

            }

            // ==================================================
            // OTRO ERROR
            // ==================================================

            Swal.fire({

                icon: 'error',

                title:
                    'Error',

                text:
                    err.response?.data?.error ||
                    'Hubo un problema al procesar la solicitud.'

            })

        }

    }

    // ======================================================
    // VER HISTORIAL DEL USUARIO
    // ======================================================

    const verHistorial = async (usuario) => {

        setUsuarioHistorialSeleccionado(usuario)

        setModalHistorial(true)

        setLoadingHistorial(true)

        setHistorialUsuario([])

        try {

            const [
                prestamosResponse,
                pmcResponse
            ] = await Promise.all([

                // ==========================================
                // HISTORIAL DE PRÉSTAMOS
                // ==========================================

                axios.get(

                    API_ROUTES.HISTORIAL_USUARIO(
                        usuario.id_usuario
                    )

                ),

                // ==========================================
                // HISTORIAL DE ENTREGAS PMC
                // ==========================================

                axios.get(

                    API_ROUTES.PMC_ENTREGAS_USUARIO(
                        usuario.id_usuario
                    )

                )

            ])

            // ==============================================
            // PRÉSTAMOS
            // ==============================================

            const prestamos =

                Array.isArray(
                    prestamosResponse.data
                )

                    ? prestamosResponse.data.map(
                        prestamo => ({

                            ...prestamo,

                            tipo: 'prestamo'

                        })
                    )

                    : []

            // ==============================================
            // PMC
            // ==============================================

            const entregasPMC =

                Array.isArray(
                    pmcResponse.data
                )

                    ? pmcResponse.data.map(
                        entrega => ({

                            ...entrega,

                            tipo: 'pmc'

                        })
                    )

                    : []

            // ==============================================
            // UNIR HISTORIALES
            // ==============================================

            const historialCompleto = [

                ...prestamos,
                ...entregasPMC

            ]

            // ==============================================
            // ORDENAR DEL MÁS RECIENTE AL MÁS ANTIGUO
            // ==============================================

            historialCompleto.sort((a, b) => {

                const fechaA =
                    new Date(
                        a.fecha_prestamo ||
                        a.fecha_entrega
                    ).getTime()

                const fechaB =
                    new Date(
                        b.fecha_prestamo ||
                        b.fecha_entrega
                    ).getTime()

                return fechaB - fechaA

            })

            setHistorialUsuario(
                historialCompleto
            )

        } catch (error) {

            console.error(
                'Error al obtener historial del usuario:',
                error
            )

            Swal.fire({

                icon: 'error',

                title:
                    'Error',

                text:
                    error.response?.data?.error ||
                    'No se pudo obtener el historial del usuario.'

            })

        } finally {

            setLoadingHistorial(false)

        }

    }

    // ======================================================
    // CLASE SEGÚN ESTADO
    // ======================================================

    const getEstadoClass = (estado) => {

        switch (
            estado?.toLowerCase()
        ) {

            case 'inactivo':

                return 'text-bg-danger'

            case 'activo':

                return 'text-bg-success'

            default:

                return 'text-bg-light'

        }

    }

    // ======================================================
    // FORMATEAR FECHA
    // ======================================================

    const formatearFecha = (fecha) => {

        if (!fecha) {
            return '—'
        }

        const fechaFormateada =
            new Date(fecha)

        if (isNaN(fechaFormateada.getTime())) {
            return '—'
        }

        return fechaFormateada.toLocaleDateString(
            'es-CO',
            {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }
        )

    }

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (

            <div className="text-center py-5 text-secondary">

                <div
                    className="spinner-border text-primary mb-2"
                    role="status"
                ></div>

                <div>
                    Cargando usuarios...
                </div>

            </div>

        )

    }

    // ======================================================
    // ERROR
    // ======================================================

    if (error) {

        return (

            <div className="alert alert-danger text-center">

                {error}

            </div>

        )

    }

    // ======================================================
    // VISTA
    // ======================================================

    return (

        <div className="card">

            <div className="card-body">

                {/* ==================================================
                    ENCABEZADO
                ================================================== */}

                <div className="module-header">

                    <h4 className="module-title mb-0">

                        Gestión de Usuarios

                    </h4>

                    <span className="badge text-bg-primary">

                        {filteredUsuarios.length} usuarios

                    </span>

                </div>


                {/* ==================================================
                    FILTRO Y BOTÓN
                ================================================== */}

                <div className="d-flex justify-content-between align-items-center mb-3">

                    <div
                        className="input-group"
                        style={{
                            maxWidth: '400px'
                        }}
                    >

                        <span className="input-group-text">

                            <i className="bi bi-search"></i>

                        </span>

                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtrar por nombre, usuario o área..."
                            value={filter}
                            onChange={handleFilterChange}
                        />

                    </div>


                    <button
                        className="btn btn-primary btn-sm"
                        onClick={nuevoUsuario}
                    >

                        + Nuevo Usuario

                    </button>

                </div>


                {/* ==================================================
                    TABLA DE USUARIOS
                ================================================== */}

                <div className="table-responsive">

                    <table className="table table-striped table-hover align-middle">

                        <thead className="table-header">

                            <tr>

                                <th>
                                    Nombre
                                </th>

                                <th>
                                    Usuario
                                </th>

                                <th>
                                    Área
                                </th>

                                <th>
                                    Correo
                                </th>

                                <th>
                                    Estado
                                </th>

                                <th className="text-center">
                                    Acciones
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredUsuarios.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="text-center py-4 text-secondary"
                                    >

                                        No se encontraron usuarios

                                    </td>

                                </tr>

                            ) : (

                                filteredUsuarios.map(
                                    (usuario) => (

                                        <tr
                                            key={
                                                usuario.usuario
                                            }
                                        >

                                            <td>
                                                {usuario.nombre}
                                            </td>

                                            <td>
                                                {usuario.usuario}
                                            </td>

                                            <td>
                                                {usuario.area}
                                            </td>

                                            <td>
                                                {usuario.correo}
                                            </td>

                                            <td>

                                                <span
                                                    className={`badge ${getEstadoClass(
                                                        usuario.estado
                                                    )}`}
                                                >

                                                    {
                                                        usuario.estado ===
                                                            'activo'

                                                            ? 'Activo'

                                                            : 'Inactivo'
                                                    }

                                                </span>

                                            </td>


                                           <td className="text-center">

    {/* ==========================================
        EDITAR
    ========================================== */}

    <button
        className="btn btn-warning btn-sm me-1"
        onClick={() =>
            editarUsuario(
                usuario
            )
        }
        title="Editar usuario"
    >

        <i className="bi bi-pencil"></i>

    </button>


    {/* ==========================================
        HISTORIAL
    ========================================== */}

    <button
        className="btn btn-secondary btn-sm me-1"
        onClick={() =>
            verHistorial(
                usuario
            )
        }
        title="Ver historial de préstamos y entregas"
    >

        <i className="bi bi-clipboard"></i>

    </button>


    {/* ==========================================
        ELIMINAR
    ========================================== */}

    <button
        className="btn btn-danger btn-sm"
        onClick={() =>
            borrarUsuario(
                usuario
            )
        }
        title="Eliminar usuario"
    >

        <i className="bi bi-trash"></i>

    </button>

</td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>


                {/* ==================================================
                    MODAL USUARIO
                ================================================== */}

                {modalUsuario && (

                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{
                            display: 'block',
                            zIndex: '1050'
                        }}
                        onClick={() =>
                            setModalUsuario(false)
                        }
                    >

                        <div
                            className="modal-dialog modal-dialog-centered"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="modal-content">

                                <div className="modal-header">

                                    <h5 className="modal-title">

                                        {
                                            usuarioSeleccionado.isEditing

                                                ? "Editar Usuario"

                                                : "Nuevo Usuario"
                                        }

                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() =>
                                            setModalUsuario(false)
                                        }
                                    ></button>

                                </div>


                                <div className="modal-body">

                                    <form>

                                        {/* NOMBRE */}

                                        <div className="form-group mb-3">

                                            <label>
                                                Nombre
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                name="nombre"
                                                value={
                                                    usuarioSeleccionado.nombre
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>


                                        {/* USUARIO */}

                                        <div className="form-group mb-3">

                                            <label>
                                                Usuario
                                            </label>

                                            <input
                                                type="text"
                                                autoComplete="username"
                                                className="form-control"
                                                name="usuario"
                                                value={
                                                    usuarioSeleccionado.usuario ||
                                                    ''
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>


                                        {/* CONTRASEÑA */}

                                        <div className="form-group mb-3">

                                            <label>
                                                Contraseña
                                            </label>

                                            <input
                                                type="password"
                                                autoComplete={
                                                    usuarioSeleccionado.isEditing
                                                        ? "current-password"
                                                        : "new-password"
                                                }
                                                className="form-control"
                                                name="contrasena"
                                                value={
                                                    usuarioSeleccionado.contrasena ||
                                                    ""
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>


                                        {/* ÁREA */}

                                        <div className="form-group mb-3">

                                            <label>
                                                Área
                                            </label>

                                            <select
                                                className="form-control"
                                                name="area"
                                                value={
                                                    usuarioSeleccionado.area
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >

                                                <option value="">

                                                    Seleccionar área

                                                </option>

                                                {areas.map(
                                                    (area, index) => (

                                                        <option
                                                            key={index}
                                                            value={
                                                                area.area
                                                            }
                                                        >

                                                            {area.area}

                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </div>


                                        {/* CORREO */}

                                        <div className="form-group mb-3">

                                            <label>
                                                Correo
                                            </label>

                                            <input
                                                type="email"
                                                className="form-control"
                                                name="correo"
                                                value={
                                                    usuarioSeleccionado.correo
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>


                                        {/* ESTADO */}

                                        <div className="form-group mb-3">

                                            <label>
                                                Estado
                                            </label>

                                            <select
                                                className="form-control"
                                                name="estado"
                                                value={
                                                    usuarioSeleccionado.estado
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >

                                                <option value="activo">
                                                    activo
                                                </option>

                                                <option value="inactivo">
                                                    inactivo
                                                </option>

                                            </select>

                                        </div>

                                    </form>

                                </div>


                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setModalUsuario(false)
                                        }
                                    >

                                        Cancelar

                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={
                                            guardarUsuario
                                        }
                                    >

                                        {
                                            usuarioSeleccionado.isEditing

                                                ? "Guardar cambios"

                                                : "Guardar usuario"
                                        }

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}


                {/* ==================================================
                    MODAL HISTORIAL
                ================================================== */}

                {modalHistorial && (

                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{
                            display: 'block',
                            zIndex: '1060',
                            backgroundColor:
                                'rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={() =>
                            setModalHistorial(false)
                        }
                    >

                        <div
                            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="modal-content">

                                {/* ==================================================
                                    HEADER
                                ================================================== */}

                                <div className="modal-header">

                                    <div>

                                        <h5 className="modal-title mb-1">

                                            Historial de préstamos y entregas

                                        </h5>

                                        {usuarioHistorialSeleccionado && (

                                            <small className="text-secondary">

                                                Usuario:{' '}

                                                <strong>
                                                    {
                                                        usuarioHistorialSeleccionado.nombre
                                                    }
                                                </strong>

                                            </small>

                                        )}

                                    </div>


                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() =>
                                            setModalHistorial(false)
                                        }
                                    ></button>

                                </div>


                                {/* ==================================================
                                    BODY
                                ================================================== */}

                                <div className="modal-body">

                                    {loadingHistorial ? (

                                        <div className="text-center py-5">

                                            <div
                                                className="spinner-border text-primary mb-3"
                                                role="status"
                                            ></div>

                                            <div className="text-secondary">

                                                Cargando historial...

                                            </div>

                                        </div>

                                    ) : historialUsuario.length === 0 ? (

                                        <div className="text-center py-5 text-secondary">

                                            <i
                                                className="bi bi-clipboard-x"
                                                style={{
                                                    fontSize:
                                                        '3rem'
                                                }}
                                            ></i>

                                            <p className="mt-3 mb-0">

                                                Este usuario no tiene préstamos
                                                ni entregas registradas.

                                            </p>

                                        </div>

                                    ) : (

                                        <div className="table-responsive">

                                            <table className="table table-striped table-hover align-middle">

                                                <thead className="table-header">

                                                    <tr>

                                                        <th>
                                                            Tipo
                                                        </th>

                                                        <th>
                                                            Producto
                                                        </th>

                                                        <th>
                                                            Área
                                                        </th>

                                                        <th>
                                                            Fecha
                                                        </th>

                                                        <th>
                                                            Fecha de devolución
                                                        </th>

                                                        <th>
                                                            Observaciones
                                                        </th>

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {historialUsuario.map(
                                                        (registro, index) => (

                                                            <tr
                                                                key={
                                                                    registro.id_prestamo ||
                                                                    registro.id_entrega ||
                                                                    index
                                                                }
                                                            >

                                                                {/* ======================================
                                                                    TIPO
                                                                ====================================== */}

                                                                <td>

                                                                    {registro.tipo === 'prestamo' ? (

                                                                        <span className="badge text-bg-primary">

                                                                            <i className="bi bi-laptop me-1"></i>

                                                                            Préstamo

                                                                        </span>

                                                                    ) : (

                                                                        <span className="badge text-bg-info">

                                                                            <i className="bi bi-box-seam me-1"></i>

                                                                            PMC

                                                                        </span>

                                                                    )}

                                                                </td>


                                                                {/* ======================================
                                                                    PRODUCTO
                                                                ====================================== */}

                                                                <td>

                                                                    {registro.tipo === 'prestamo' ? (

                                                                        <div>

                                                                            {registro.equipos?.length > 0 ? (

                                                                                registro.equipos.map(
                                                                                    (equipo, equipoIndex) => (

                                                                                        <div
                                                                                            key={
                                                                                                equipo.num_serie ||
                                                                                                equipoIndex
                                                                                            }
                                                                                            className="mb-2"
                                                                                        >

                                                                                            <strong>
                                                                                                {
                                                                                                    equipo.equipo ||
                                                                                                    'Equipo'
                                                                                                }
                                                                                            </strong>

                                                                                            <br />

                                                                                            <small className="text-secondary">

                                                                                                Serie:{' '}

                                                                                                {
                                                                                                    equipo.num_serie
                                                                                                }

                                                                                            </small>

                                                                                        </div>

                                                                                    )
                                                                                )

                                                                            ) : (

                                                                                '—'

                                                                            )}

                                                                        </div>

                                                                    ) : (

                                                                        <div>

                                                                            <strong>

                                                                                {
                                                                                    registro.producto ||
                                                                                    'Producto PMC'
                                                                                }

                                                                            </strong>

                                                                        </div>

                                                                    )}

                                                                </td>


                                                                {/* ======================================
                                                                    ÁREA
                                                                ====================================== */}

                                                                <td>

                                                                    {
                                                                        registro.area ||
                                                                        '—'
                                                                    }

                                                                </td>


                                                                {/* ======================================
                                                                    FECHA
                                                                ====================================== */}

                                                                <td>

                                                                    {registro.tipo === 'prestamo'

                                                                        ? (

                                                                            registro.fecha_prestamo

                                                                                ? formatearFecha(
                                                                                    registro.fecha_prestamo
                                                                                )

                                                                                : '—'

                                                                        )

                                                                        : (

                                                                            registro.fecha_entrega

                                                                                ? formatearFecha(
                                                                                    registro.fecha_entrega
                                                                                )

                                                                                : '—'

                                                                        )}

                                                                </td>


                                                                {/* ======================================
                                                                    FECHA REAL DE DEVOLUCIÓN
                                                                ====================================== */}

                                                                <td>

                                                                    {registro.tipo === 'prestamo'

                                                                        ? (

                                                                            registro.fecha_devolucion

                                                                                ? (

                                                                                    <span className="text-success">

                                                                                        {
                                                                                            formatearFecha(
                                                                                                registro.fecha_devolucion
                                                                                            )
                                                                                        }

                                                                                    </span>

                                                                                )

                                                                                : (

                                                                                    <span className="text-warning">

                                                                                        Pendiente

                                                                                    </span>

                                                                                )

                                                                        )

                                                                        : (

                                                                            <span className="text-secondary">

                                                                                No aplica

                                                                            </span>

                                                                        )}

                                                                </td>


                                                                {/* ======================================
                                                                    OBSERVACIONES
                                                                ====================================== */}

                                                                <td>

                                                                    {
                                                                        registro.observaciones ||
                                                                        '—'
                                                                    }

                                                                </td>

                                                            </tr>

                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>


                                {/* ==================================================
                                    FOOTER
                                ================================================== */}

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setModalHistorial(false)
                                        }
                                    >

                                        Cerrar

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </div>

    )

}

export default RecursosHumanos