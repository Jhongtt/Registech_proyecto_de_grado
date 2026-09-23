import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"
import Paginador from "./ui/Paginador"

// =========================================================
// FECHAS
// =========================================================

const formatDateTime = (isoString) => {
    if(!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleString('es-CO', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true});
}

const toISODate = (fecha) => {
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, "0")
    const d = String(fecha.getDate()).padStart(2, "0")

    return `${y}-${m}-${d}`
}

const diasRestantes = (fecha) => {
    if (!fecha) return null

    const limite = String(fecha).substring(0, 10)

    return Math.round(
        (new Date(limite) - new Date(new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16))) / 86400000
    )
}

// =========================================================
// FUNCIONES PARA OBTENER DATOS DEL EQUIPO
// =========================================================

const obtenerNumeroSerie = (equipo) => {
    if (!equipo) return ""

    return (
        equipo.num_serie ||
        equipo.numero_serie ||
        equipo.serie ||
        equipo.equipo?.num_serie ||
        equipo.equipo?.numero_serie ||
        equipo.equipo?.serie ||
        equipo.equipo?.equipo?.num_serie ||
        equipo.equipo?.equipo?.numero_serie ||
        ""
    )
}

const obtenerNombreEquipo = (equipo) => {
    if (!equipo) return "Equipo"

    if (typeof equipo.equipo === "string") {
        return equipo.equipo
    }

    return (
        equipo.nombre_equipo ||
        equipo.equipo?.nombre_equipo ||
        equipo.equipo?.equipo ||
        equipo.nombre ||
        "Equipo"
    )
}

// =========================================================
// COMPONENTE
// =========================================================

const Prestamos = () => {

    const [prestamos, setPrestamos] = useState([])
    const [equiposDisponibles, setEquiposDisponibles] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [empleados, setEmpleados] = useState([])
    const [loading, setLoading] = useState(true)

    // =====================================================
    // BUSCADOR
    // =====================================================

    const [busqueda, setBusqueda] = useState("")
    const [page, setPage] = useState(1)

    // =====================================================
    // MODAL NUEVO PRÉSTAMO
    // =====================================================

    const [modalNuevo, setModalNuevo] = useState(false)

    const [numSeries, setNumSeries] = useState([])

    const [usuarioDestino, setUsuarioDestino] = useState("")
    const [tipoDestino, setTipoDestino] = useState("")

    const [idEmpleadoSeleccionado, setIdEmpleadoSeleccionado] =
        useState("")

    const [idUsuarioSeleccionado, setIdUsuarioSeleccionado] =
        useState("")

    const [areaPrestamo, setAreaPrestamo] = useState("")

    const [fechaInicio, setFechaInicio] = useState(
        new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    )

    const [fechaLimite, setFechaLimite] = useState(
        new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000 + 7 * 86400000).toISOString().slice(0, 16)
    )

    const [observaciones, setObservaciones] = useState("")
    const [enviarCorreo, setEnviarCorreo] = useState(true)
    const [guardando, setGuardando] = useState(false)

    // =====================================================
    // MODAL VER PRÉSTAMO
    // =====================================================

    const [prestamoSeleccionado, setPrestamoSeleccionado] =
        useState(null)

    const [equiposSeleccionados, setEquiposSeleccionados] =
        useState([])

    const [datosDevolucion, setDatosDevolucion] = useState({})

    const [enviarCorreoDevolucion, setEnviarCorreoDevolucion] =
        useState(true)

    // =====================================================
    // CARGAR DATOS
    // =====================================================

    useEffect(() => {
        cargarDatos()
    }, [])

    async function cargarDatos() {

        setLoading(true)

        try {

            const [
                resPrestamos,
                resEquipos,
                resUsuarios,
                resEmpleados
            ] = await Promise.all([
                axios.get(API_ROUTES.PRESTAMOS_ACTIVOS),
                axios.get(API_ROUTES.EQUIPOS),
                axios.get(API_ROUTES.OBTENER_USUARIOS),
                axios.get(API_ROUTES.OBTENER_EMPLEADOS)
            ])

            console.log("PRESTAMOS:", resPrestamos.data)
            console.log("EQUIPOS:", resEquipos.data)
            console.log("USUARIOS:", resUsuarios.data)
            console.log("EMPLEADOS:", resEmpleados.data)

            // -------------------------------------------------
            // PRÉSTAMOS
            // -------------------------------------------------

            setPrestamos(
                Array.isArray(resPrestamos.data)
                    ? resPrestamos.data
                    : []
            )

            // -------------------------------------------------
            // EQUIPOS DISPONIBLES
            // -------------------------------------------------

            setEquiposDisponibles(
                Array.isArray(resEquipos.data)
                    ? resEquipos.data.filter(
                        e => e.estado === "Disponible"
                    )
                    : []
            )

            // -------------------------------------------------
            // USUARIOS DEL SISTEMA
            // -------------------------------------------------

            setUsuarios(
                Array.isArray(resUsuarios.data)
                    ? resUsuarios.data.filter(
                        u => u.estado === "activo"
                    )
                    : []
            )

            // -------------------------------------------------
            // EMPLEADOS
            // -------------------------------------------------

            setEmpleados(
                Array.isArray(resEmpleados.data)
                    ? resEmpleados.data.filter(
                        e => e.estado === "activo"
                    )
                    : []
            )

        } catch (error) {

            console.error(
                "ERROR CARGANDO DATOS:",
                error
            )

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los datos de préstamos"
            })

        } finally {

            setLoading(false)

        }
    }

    // =====================================================
    // NUEVO PRÉSTAMO
    // =====================================================

    const abrirModalNuevo = () => {

        setNumSeries([])

        setUsuarioDestino("")
        setTipoDestino("")

        setIdEmpleadoSeleccionado("")
        setIdUsuarioSeleccionado("")

        setAreaPrestamo("")

        setFechaInicio(
            new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        )

        setFechaLimite(
            new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000 + 7 * 86400000).toISOString().slice(0, 16)
        )

        setObservaciones("")

        setEnviarCorreo(true)

        setModalNuevo(true)
    }

    // =====================================================
    // SELECCIONAR EQUIPO PARA PRÉSTAMO
    // =====================================================

    const handleSelectEquipo = (serie) => {

        if (!serie) return

        setNumSeries(prev => {

            if (prev.includes(serie)) {
                return prev
            }

            return [
                ...prev,
                serie
            ]
        })
    }

    // =====================================================
    // SELECCIONAR USUARIO / EMPLEADO
    // =====================================================

    const handleSelectUsuario = (valor) => {

        if (!valor) {

            setUsuarioDestino("")
            setTipoDestino("")

            setIdEmpleadoSeleccionado("")
            setIdUsuarioSeleccionado("")

            setAreaPrestamo("")

            return
        }

        const [tipo, id] = valor.split(":")

        setTipoDestino(tipo)

        // =================================================
        // EMPLEADO
        // =================================================

        if (tipo === "empleado") {

            const empleado = empleados.find(
                e =>
                    String(e.id_empleado) ===
                    String(id)
            )

            if (!empleado) {

                console.error(
                    "Empleado no encontrado:",
                    id
                )

                return
            }

            console.log(
                "EMPLEADO SELECCIONADO:",
                empleado
            )

            setUsuarioDestino(
                empleado.nombre || ""
            )

            setIdEmpleadoSeleccionado(
                empleado.id_empleado
            )

            setIdUsuarioSeleccionado("")

            setAreaPrestamo(
                empleado.area || ""
            )

            return
        }

        // =================================================
        // USUARIO DEL SISTEMA
        // =================================================

        if (tipo === "usuario") {

            const usuario = usuarios.find(
                u =>
                    String(u.id_usuario) ===
                    String(id)
            )

            if (!usuario) {

                console.error(
                    "Usuario no encontrado:",
                    id
                )

                console.log(
                    "Usuarios disponibles:",
                    usuarios
                )

                return
            }

            console.log(
                "USUARIO SELECCIONADO:",
                usuario
            )

            setUsuarioDestino(
                usuario.nombre || ""
            )

            setIdEmpleadoSeleccionado("")

            setIdUsuarioSeleccionado(
                String(usuario.id_usuario)
            )

            setAreaPrestamo(
                usuario.area || ""
            )

            return
        }
    }

    // =====================================================
    // CREAR PRÉSTAMO
    // =====================================================

    const crearPrestamo = async () => {

        if (numSeries.length === 0) {

            Swal.fire({
                icon: "warning",
                title: "Equipos requeridos",
                text: "Selecciona al menos un equipo."
            })

            return
        }

        if (!usuarioDestino) {

            Swal.fire({
                icon: "warning",
                title: "Destinatario requerido",
                text: "Selecciona un usuario o empleado."
            })

            return
        }

        if (
            !idEmpleadoSeleccionado &&
            !idUsuarioSeleccionado
        ) {

            Swal.fire({
                icon: "warning",
                title: "Destinatario requerido",
                text: "Selecciona un usuario o empleado."
            })

            return
        }

        try {

            setGuardando(true)

            const obsFinal =
                observaciones.trim() ||
                `Préstamo del ${fechaInicio} al ${fechaLimite}`

            const datosPrestamo = {

                num_series: numSeries,

                id_empleado:
                    idEmpleadoSeleccionado || null,

                id_usuario:
                    idUsuarioSeleccionado
                        ? Number(idUsuarioSeleccionado)
                        : null,

                fecha_inicio:
                    fechaInicio,

                fecha_limite:
                    fechaLimite,

                observaciones:
                    obsFinal,

                enviarCorreo:
                    enviarCorreo
            }

            console.log(
                "DATOS ENVIADOS AL BACKEND:",
                datosPrestamo
            )

            await axios.post(
                API_ROUTES.CREAR_PRESTAMO,
                datosPrestamo
            )

            setModalNuevo(false)

            Swal.fire({
                icon: "success",
                title: "Préstamo registrado",
                text: "Los equipos fueron asignados correctamente.",
                timer: 2000,
                showConfirmButton: false
            })

            cargarDatos()

        } catch (error) {

            console.error(
                "ERROR CREANDO PRÉSTAMO:",
                error
            )

            console.error(
                "RESPUESTA DEL BACKEND:",
                error.response?.data
            )

            Swal.fire({
                icon: "error",
                title: "Error al registrar préstamo",
                text:
                    error.response?.data?.error ||
                    "No se pudo crear el préstamo"
            })

        } finally {

            setGuardando(false)

        }
    }

    // =====================================================
    // PRÉSTAMOS AGRUPADOS
    // =====================================================

    const prestamosAgrupados = prestamos

    // =====================================================
    // PRÉSTAMOS ACTIVOS
    // =====================================================

    const prestamosActivos = prestamosAgrupados.filter(
        p =>
            p.estado === "activo" ||
            p.estado === "parcial"
    )

    // =====================================================
    // BUSCADOR
    // =====================================================

    const filteredPrestamos =
        prestamosActivos.filter(p => {

            const texto =
                busqueda
                    .toLowerCase()
                    .trim()

            if (!texto) return true

            return (

                String(
                    p.id_prestamo
                )
                    .toLowerCase()
                    .includes(texto)

                ||

                p.empleado
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.destinatario
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.usuario
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.documento_empleado
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.area
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.observaciones
                    ?.toLowerCase()
                    .includes(texto)

                ||

                p.equipos?.some(e => {

                    const serie =
                        obtenerNumeroSerie(e)

                    const nombre =
                        obtenerNombreEquipo(e)

                    return (

                        serie
                            .toLowerCase()
                            .includes(texto)

                        ||

                        nombre
                            .toLowerCase()
                            .includes(texto)

                    )
                })
            )
        })

    const ROWS = 8
    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredPrestamos.length /
                ROWS
            )
        )

    const paginaActual =
        Math.min(
            page,
            totalPages
        )

    const prestamosPagina =
        filteredPrestamos.slice(
            (paginaActual - 1) * ROWS,
            paginaActual * ROWS
        )

    // =====================================================
    // ABRIR PRÉSTAMO
    // =====================================================

    const verPrestamo = (prestamo) => {

        console.log(
            "PRÉSTAMO SELECCIONADO:",
            prestamo
        )

        console.log(
            "EQUIPOS:",
            prestamo.equipos
        )

        setPrestamoSeleccionado(
            prestamo
        )

        setEquiposSeleccionados([])

        setDatosDevolucion({})

        setEnviarCorreoDevolucion(true)
    }

    // =====================================================
    // CERRAR PRÉSTAMO
    // =====================================================

    const cerrarPrestamo = () => {

        setPrestamoSeleccionado(null)

        setEquiposSeleccionados([])

        setDatosDevolucion({})

        setEnviarCorreoDevolucion(true)
    }

    // =====================================================
    // SELECCIONAR EQUIPO
    // =====================================================

    const seleccionarEquipo = (numSerie) => {

        setEquiposSeleccionados(prev => {

            if (
                prev.includes(numSerie)
            ) {

                return prev.filter(
                    serie =>
                        serie !== numSerie
                )
            }

            return [
                ...prev,
                numSerie
            ]
        })
    }

    // =====================================================
    // SELECCIONAR TODOS
    // =====================================================

    const seleccionarTodos = () => {

        if (!prestamoSeleccionado) {
            return
        }

        const equipos =
            prestamoSeleccionado.equipos || []

        const series =
            equipos
                .map(e =>
                    obtenerNumeroSerie(e)
                )
                .filter(Boolean)

        if (
            equiposSeleccionados.length ===
            series.length
        ) {

            setEquiposSeleccionados([])

        } else {

            setEquiposSeleccionados(
                series
            )
        }
    }

    // =====================================================
    // OBSERVACIÓN DEVOLUCIÓN
    // =====================================================

    const cambiarObservacion = (
        numSerie,
        valor
    ) => {

        setDatosDevolucion(prev => ({

            ...prev,

            [numSerie]: {

                ...prev[numSerie],

                observaciones:
                    valor

            }

        }))
    }

    // =====================================================
    // IMAGEN DEVOLUCIÓN
    // =====================================================

    const cambiarImagen = (
        numSerie,
        archivo
    ) => {

        setDatosDevolucion(prev => ({

            ...prev,

            [numSerie]: {

                ...prev[numSerie],

                evidencia:
                    archivo

            }

        }))
    }

    // =====================================================
    // DEVOLVER UN EQUIPO
    // =====================================================

    const devolverEquipo = async (
        prestamo,
        equipo,
        enviarCorreo = false,
        equiposDevueltosCorreo = []
    ) => {

        const numSerie =
            obtenerNumeroSerie(equipo)

        const nombreEquipo =
            obtenerNombreEquipo(equipo)

        console.log(
            "DEVOLVIENDO EQUIPO:",
            {
                idPrestamo:
                    prestamo.id_prestamo,

                numSerie,

                equipo:
                    nombreEquipo,

                enviarCorreo,

                equiposDevueltosCorreo
            }
        )

        if (!numSerie) {

            Swal.fire({
                icon: "error",
                title: "Número de serie no encontrado",
                text:
                    "El backend no está enviando el número de serie de este equipo."
            })

            console.error(
                "EQUIPO SIN NUMERO DE SERIE:",
                equipo
            )

            return false
        }

        const datos =
            datosDevolucion[numSerie] || {}

        const formData =
            new FormData()

        if (
            datos.observaciones &&
            datos.observaciones.trim()
        ) {

            formData.append(
                "observaciones",
                datos.observaciones.trim()
            )
        }

        if (datos.evidencia) {

            formData.append(
                "evidencia",
                datos.evidencia
            )
        }

        // ==============================================
        // CORREO DE DEVOLUCIÓN
        // ==============================================

        formData.append(
            "enviarCorreo",
            String(enviarCorreo)
        )

        formData.append(
            "equiposDevueltosCorreo",
            JSON.stringify(
                equiposDevueltosCorreo
            )
        )

        try {

            const url =
                API_ROUTES.DEVOLVER_EQUIPO(
                    prestamo.id_prestamo,
                    numSerie
                )

            console.log(
                "URL DEVOLUCIÓN:",
                url
            )

            await axios.post(
                url,
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data"
                    }
                }
            )

            return true

        } catch (error) {

            console.error(
                "ERROR DEVOLVIENDO:",
                error
            )

            console.error(
                "RESPUESTA:",
                error.response?.data
            )

            Swal.fire({
                icon: "error",
                title: "Error al devolver",
                text:
                    error.response?.data?.error ||
                    `No se pudo devolver ${numSerie}`
            })

            return false
        }
    }

    // =====================================================
    // DEVOLVER SELECCIONADOS
    // =====================================================

    const devolverSeleccionados = async () => {

        if (!prestamoSeleccionado) {
            return
        }

        const seleccionados =
            prestamoSeleccionado.equipos?.filter(
                equipo => {

                    const serie =
                        obtenerNumeroSerie(
                            equipo
                        )

                    return equiposSeleccionados.includes(
                        serie
                    )
                }
            ) || []

        if (
            seleccionados.length === 0
        ) {

            Swal.fire({
                icon: "warning",
                title: "Selecciona un equipo",
                text:
                    "Debes seleccionar al menos un equipo."
            })

            return
        }

        const resultado =
            await Swal.fire({

                icon: "question",

                title:
                    "Confirmar devolución",

                text:
                    `¿Deseas devolver ${seleccionados.length} equipo(s)?`,

                showCancelButton:
                    true,

                confirmButtonText:
                    "Sí, devolver",

                cancelButtonText:
                    "Cancelar",

                confirmButtonColor:
                    "#16a34a"
            })

        if (
            !resultado.isConfirmed
        ) {
            return
        }

        try {

            setGuardando(true)

            let exitosos = 0

            const seriesSeleccionadas =
                seleccionados
                    .map(equipo =>
                        obtenerNumeroSerie(equipo)
                    )
                    .filter(Boolean)

            for (
                let i = 0;
                i < seleccionados.length;
                i++
            ) {

                const equipo =
                    seleccionados[i]

                const esUltimaDevolucion =
                    i === seleccionados.length - 1

                const resultadoDevolucion =
                    await devolverEquipo(
                        prestamoSeleccionado,
                        equipo,
                        enviarCorreoDevolucion &&
                        esUltimaDevolucion,
                        seriesSeleccionadas
                    )

                if (
                    resultadoDevolucion
                ) {

                    exitosos++

                }
            }

            if (
                exitosos ===
                seleccionados.length
            ) {

                Swal.fire({
                    icon: "success",
                    title: "Devolución registrada",
                    text:
                        enviarCorreoDevolucion
                            ? "Los equipos fueron devueltos correctamente y se envió el comprobante por correo."
                            : "Los equipos fueron devueltos correctamente.",
                    timer: 2500,
                    showConfirmButton:
                        false
                })

            } else if (
                exitosos > 0
            ) {

                Swal.fire({
                    icon: "warning",
                    title: "Devolución parcial",
                    text:
                        `${exitosos} de ${seleccionados.length} equipos fueron devueltos.`
                })
            }

            cerrarPrestamo()

            cargarDatos()

        } catch (error) {

            console.error(
                error
            )

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    "No se pudieron procesar las devoluciones."
            })

        } finally {

            setGuardando(false)

        }
    }

    // =====================================================
    // DEVOLVER TODO
    // =====================================================

    const devolverTodo = async () => {

        if (!prestamoSeleccionado) {
            return
        }

        const equipos =
            prestamoSeleccionado.equipos || []

        if (
            equipos.length === 0
        ) {

            Swal.fire({
                icon: "warning",
                title: "Sin equipos",
                text:
                    "Este préstamo no tiene equipos."
            })

            return
        }

        const sinSerie =
            equipos.filter(
                equipo =>
                    !obtenerNumeroSerie(
                        equipo
                    )
            )

        if (
            sinSerie.length > 0
        ) {

            console.error(
                "EQUIPOS SIN SERIE:",
                sinSerie
            )

            Swal.fire({
                icon: "error",
                title:
                    "Falta el número de serie",
                text:
                    "Uno o más equipos no tienen número de serie en los datos recibidos por el frontend."
            })

            return
        }

        const resultado =
            await Swal.fire({

                icon: "warning",

                title:
                    "Devolver todos",

                text:
                    `¿Deseas devolver los ${equipos.length} equipos de este préstamo?`,

                showCancelButton:
                    true,

                confirmButtonText:
                    "Sí, devolver todo",

                cancelButtonText:
                    "Cancelar",

                confirmButtonColor:
                    "#16a34a"
            })

        if (
            !resultado.isConfirmed
        ) {

            return
        }

        try {

            setGuardando(true)

            let exitosos = 0

            const seriesEquipos =
                equipos
                    .map(equipo =>
                        obtenerNumeroSerie(equipo)
                    )
                    .filter(Boolean)

            for (
                let i = 0;
                i < equipos.length;
                i++
            ) {

                const equipo =
                    equipos[i]

                const esUltimaDevolucion =
                    i === equipos.length - 1

                const resultadoDevolucion =
                    await devolverEquipo(
                        prestamoSeleccionado,
                        equipo,
                        enviarCorreoDevolucion &&
                        esUltimaDevolucion,
                        seriesEquipos
                    )

                if (
                    resultadoDevolucion
                ) {

                    exitosos++

                }
            }

            if (
                exitosos ===
                equipos.length
            ) {

                Swal.fire({
                    icon: "success",
                    title:
                        "Préstamo devuelto",
                    text:
                        enviarCorreoDevolucion
                            ? "Todos los equipos fueron devueltos correctamente y se envió el comprobante por correo."
                            : "Todos los equipos fueron devueltos correctamente.",
                    timer: 2500,
                    showConfirmButton:
                        false
                })

            } else if (
                exitosos > 0
            ) {

                Swal.fire({
                    icon: "warning",
                    title:
                        "Devolución parcial",
                    text:
                        `${exitosos} de ${equipos.length} equipos fueron devueltos.`
                })
            }

            cerrarPrestamo()

            cargarDatos()

        } catch (error) {

            console.error(
                error
            )

            Swal.fire({
                icon: "error",
                title:
                    "Error",
                text:
                    "No se pudieron devolver todos los equipos."
            })

        } finally {

            setGuardando(false)

        }
    }

    // =====================================================
    // DESTINATARIO SELECCIONADO
    // =====================================================

    const usuarioSeleccionadoObj =
        usuarios.find(
            u =>
                String(u.id_usuario) ===
                String(idUsuarioSeleccionado)
        )

    const empleadoSeleccionadoObj =
        empleados.find(
            e =>
                String(e.id_empleado) ===
                String(idEmpleadoSeleccionado)
        )

    // =====================================================
    // CORREO DEL DESTINATARIO
    // =====================================================

    const correoDestino =
        tipoDestino === "empleado"
            ? empleadoSeleccionadoObj?.correo
            : tipoDestino === "usuario"
                ? usuarioSeleccionadoObj?.correo
                : null

    // =====================================================
    // CONTADORES
    // =====================================================

    const totalVencidos =
        prestamosActivos.filter(
            p =>
                (
                    diasRestantes(
                        p.fecha_devolucion
                    ) ?? 0
                ) < 0
        ).length

    const totalPorVencer =
        prestamosActivos.filter(
            p => {

                const d =
                    diasRestantes(
                        p.fecha_devolucion
                    )

                return (
                    d !== null &&
                    d >= 0 &&
                    d <= 3
                )
            }
        ).length

    // =====================================================
    // CORREO DEL PRÉSTAMO SELECCIONADO
    // =====================================================

    const correoDevolucion =
        prestamoSeleccionado?.correo_empleado ||
        prestamoSeleccionado?.correo_usuario ||
        null

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="card shadow-sm border">

            <div className="card-body">

                {/* =========================================
                    ENCABEZADO
                ========================================= */}

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">

                    <div className="d-flex align-items-center gap-2 flex-wrap">

                        <h4 className="mb-0 fw-bold">
                            Préstamos Activos
                        </h4>

                        <span className="chip-alerta chip-alerta--ok">
                            {prestamosActivos.length} activos
                        </span>

                        {totalPorVencer > 0 && (

                            <span className="chip-alerta chip-alerta--pronto">
                                {totalPorVencer} por vencer
                            </span>

                        )}

                        {totalVencidos > 0 && (

                            <span className="chip-alerta chip-alerta--vencido">
                                {totalVencidos} vencidos
                            </span>

                        )}

                    </div>

                    <button
                        className="btn btn-success btn-sm"
                        onClick={abrirModalNuevo}
                    >
                        + Nuevo Préstamo
                    </button>

                </div>

                {/* =========================================
                    BUSCADOR
                ========================================= */}

                <div className="mb-3">

                    <div className="input-group">

                        <span className="input-group-text bg-light">
                            <i className="bi bi-search"></i>
                        </span>

                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por préstamo, usuario, área o equipo..."
                            value={busqueda}
                            onChange={e =>
                                setBusqueda(
                                    e.target.value
                                )
                            }
                        />

                        {busqueda && (

                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() =>
                                    setBusqueda("")
                                }
                            >
                                Limpiar
                            </button>

                        )}

                    </div>

                </div>

                {/* =========================================
                    TABLA
                ========================================= */}

                <div className="table-responsive">

                    <table className="table table-striped table-hover align-middle mb-0">

                        <thead className="table-header">

                            <tr>

                                <th>Préstamo</th>

                                <th>Usuario Destino</th>

                                <th>Área</th>

                                <th>Fecha Inicio</th>

                                <th>Fecha Límite</th>

                                <th>Observaciones</th>

                                <th className="text-center">
                                    Acción
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="text-center py-4"
                                    >
                                        Cargando préstamos...
                                    </td>

                                </tr>

                            ) : filteredPrestamos.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="text-center py-4 text-muted"
                                    >
                                        No hay préstamos registrados
                                    </td>

                                </tr>

                            ) : (

                                prestamosPagina.map(p => (

                                    <tr
                                        key={p.id_prestamo}
                                    >

                                        <td className="fw-semibold">

                                            <code>
                                                #{p.id_prestamo}
                                            </code>

                                        </td>

                                        <td>
                                            {p.destinatario ||
                                                p.empleado ||
                                                p.usuario ||
                                                "-"
                                            }
                                        </td>

                                        <td>
                                            {p.area || "-"}
                                        </td>

                                        <td>
                                            {p.fecha_prestamo ? formatDateTime(p.fecha_prestamo) : "—"}
                                        </td>

                                        <td>
                                            {p.fecha_devolucion ? formatDateTime(p.fecha_devolucion) : "—"}

                                            {(() => {

                                                const d =
                                                    diasRestantes(
                                                        p.fecha_devolucion
                                                    )

                                                if (
                                                    d === null ||
                                                    d > 3
                                                ) {
                                                    return null
                                                }

                                                if (
                                                    d < 0
                                                ) {

                                                    return (

                                                        <div className="mt-1">

                                                            <span className="chip-alerta chip-alerta--vencido">

                                                                VENCIDO (
                                                                {Math.abs(d)}
                                                                d)

                                                            </span>

                                                        </div>

                                                    )
                                                }

                                                return (

                                                    <div className="mt-1">

                                                        <span className="chip-alerta chip-alerta--pronto">

                                                            {d === 0
                                                                ? "Vence hoy"
                                                                : `Vence en ${d}d`
                                                            }

                                                        </span>

                                                    </div>

                                                )

                                            })()}

                                        </td>

                                        <td>
                                            {p.observaciones || "-"}
                                        </td>

                                        <td className="text-center">

                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={() =>
                                                    verPrestamo(p)
                                                }
                                            >
                                                Ver
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                <Paginador
                    page={paginaActual}
                    setPage={setPage}
                    totalItems={filteredPrestamos.length}
                    size={ROWS}
                />

            </div>

            {/* =================================================
                MODAL VER PRÉSTAMO
            ================================================= */}

            {prestamoSeleccionado && (

                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)",
                        zIndex: 1060
                    }}
                    onClick={cerrarPrestamo}
                >

                    <div
                        className="modal-dialog modal-dialog-centered modal-lg"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-content">

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title fw-bold mb-1">

                                        Préstamo #
                                        {prestamoSeleccionado.id_prestamo}

                                    </h5>

                                    <small className="text-muted">

                                        {prestamoSeleccionado.destinatario ||
                                            prestamoSeleccionado.empleado ||
                                            prestamoSeleccionado.usuario ||
                                            "Sin destinatario"
                                        }

                                        {" • "}

                                        {prestamoSeleccionado.area ||
                                            "Sin área"
                                        }

                                    </small>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={cerrarPrestamo}
                                ></button>

                            </div>

                            <div className="modal-body">

                                <div className="row mb-3">

                                    <div className="col-md-6">

                                        <small className="text-muted d-block">
                                            Fecha de inicio
                                        </small>

                                        <strong>
                                            {prestamoSeleccionado.fecha_prestamo ? formatDateTime(prestamoSeleccionado.fecha_prestamo) : "—"}
                                        </strong>

                                    </div>

                                    <div className="col-md-6">

                                        <small className="text-muted d-block">
                                            Fecha límite
                                        </small>

                                        <strong>
                                            {prestamoSeleccionado.fecha_devolucion ? formatDateTime(prestamoSeleccionado.fecha_devolucion) : "—"}
                                        </strong>

                                    </div>

                                </div>

                                <hr />

                                <div className="d-flex justify-content-between align-items-center mb-3">

                                    <div>

                                        <strong>
                                            Equipos del préstamo
                                        </strong>

                                        <div className="small text-muted">
                                            Selecciona los equipos que deseas devolver.
                                        </div>

                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={seleccionarTodos}
                                        disabled={
                                            !prestamoSeleccionado.equipos?.length
                                        }
                                    >

                                        {equiposSeleccionados.length ===
                                            prestamoSeleccionado.equipos.length
                                            ? "Deseleccionar todos"
                                            : "Seleccionar todos"
                                        }

                                    </button>

                                </div>

                                {/* =========================================
                                    CORREO DE DEVOLUCIÓN
                                ========================================= */}

                                <div className="form-check mb-3">

                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="checkCorreoDevolucion"
                                        checked={
                                            enviarCorreoDevolucion
                                        }
                                        onChange={e =>
                                            setEnviarCorreoDevolucion(
                                                e.target.checked
                                            )
                                        }
                                    />

                                    <label
                                        className="form-check-label small"
                                        htmlFor="checkCorreoDevolucion"
                                    >

                                        Enviar comprobante de devolución por correo electrónico

                                    </label>

                                    {correoDevolucion && (

                                        <div className="small text-muted ps-1 mt-1">

                                            Correo:
                                            {" "}

                                            <strong>
                                                {correoDevolucion}
                                            </strong>

                                        </div>

                                    )}

                                    {!correoDevolucion && (

                                        <div className="small text-danger ps-1 mt-1">

                                            El destinatario no tiene un correo registrado.

                                        </div>

                                    )}

                                </div>

                                {/* =========================================
                                    LISTA DE EQUIPOS
                                ========================================= */}

                                {prestamoSeleccionado.equipos?.map(
                                    (equipo, index) => {

                                        const numSerie =
                                            obtenerNumeroSerie(
                                                equipo
                                            )

                                        const nombreEquipo =
                                            obtenerNombreEquipo(
                                                equipo
                                            )

                                        const seleccionado =
                                            equiposSeleccionados.includes(
                                                numSerie
                                            )

                                        const datos =
                                            datosDevolucion[
                                            numSerie
                                            ] || {}

                                        return (

                                            <div
                                                key={
                                                    numSerie ||
                                                    `equipo-${index}`
                                                }
                                                className={`border rounded p-3 mb-3 ${
                                                    seleccionado
                                                        ? "border-success bg-light"
                                                        : ""
                                                }`}
                                            >

                                                <div className="d-flex align-items-start gap-3">

                                                    <div className="pt-1">

                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={
                                                                seleccionado
                                                            }
                                                            onChange={() => {

                                                                if (!numSerie) {

                                                                    Swal.fire({
                                                                        icon: "error",
                                                                        title: "Sin número de serie",
                                                                        text:
                                                                            "Este equipo no tiene un número de serie recibido desde el backend."
                                                                    })

                                                                    return
                                                                }

                                                                seleccionarEquipo(
                                                                    numSerie
                                                                )

                                                            }}
                                                            style={{
                                                                width: "20px",
                                                                height: "20px",
                                                                cursor: "pointer"
                                                            }}
                                                        />

                                                    </div>

                                                    <div className="flex-grow-1">

                                                        <div className="d-flex justify-content-between">

                                                            <div>

                                                                <strong>
                                                                    {nombreEquipo}
                                                                </strong>

                                                                <div className="small text-muted">

                                                                    Serie:
                                                                    {" "}
                                                                    {numSerie || (

                                                                        <span className="text-danger fw-bold">
                                                                            SIN NÚMERO DE SERIE
                                                                        </span>

                                                                    )}

                                                                </div>

                                                            </div>

                                                            {seleccionado && (

                                                                <span className="badge bg-success">
                                                                    Seleccionado
                                                                </span>

                                                            )}

                                                        </div>

                                                        {seleccionado && (

                                                            <div className="mt-3">

                                                                <div className="mb-2">

                                                                    <label className="form-label small fw-semibold">

                                                                        Descripción / Observaciones

                                                                    </label>

                                                                    <textarea
                                                                        className="form-control form-control-sm"
                                                                        rows="2"
                                                                        placeholder="Ej. Se entrega con una tecla dañada..."
                                                                        value={
                                                                            datos.observaciones ||
                                                                            ""
                                                                        }
                                                                        onChange={e =>
                                                                            cambiarObservacion(
                                                                                numSerie,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />

                                                                </div>

                                                                <div>

                                                                    <label className="form-label small fw-semibold">

                                                                        Evidencia fotográfica

                                                                    </label>

                                                                    <input
                                                                        type="file"
                                                                        className="form-control form-control-sm"
                                                                        accept="image/*"
                                                                        onChange={e =>
                                                                            cambiarImagen(
                                                                                numSerie,
                                                                                e.target.files[0]
                                                                            )
                                                                        }
                                                                    />

                                                                    {datos.evidencia && (

                                                                        <div className="small text-success mt-1">

                                                                            ✓{" "}
                                                                            {
                                                                                datos.evidencia.name
                                                                            }

                                                                        </div>

                                                                    )}

                                                                </div>

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        )
                                    }
                                )}

                            </div>

                            <div className="modal-footer d-flex justify-content-between">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cerrarPrestamo}
                                    disabled={guardando}
                                >
                                    Cerrar
                                </button>

                                <div className="d-flex gap-2">

                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={
                                            devolverSeleccionados
                                        }
                                        disabled={
                                            guardando ||
                                            equiposSeleccionados.length === 0
                                        }
                                    >

                                        {guardando
                                            ? "Procesando..."
                                            : `Devolver seleccionados (${equiposSeleccionados.length})`
                                        }

                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={devolverTodo}
                                        disabled={
                                            guardando ||
                                            !prestamoSeleccionado.equipos?.length
                                        }
                                    >
                                        Devolver todo
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                MODAL NUEVO PRÉSTAMO
            ================================================= */}

            {modalNuevo && (

                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,0.5)",
                        zIndex: 1050
                    }}
                    onClick={() =>
                        !guardando &&
                        setModalNuevo(false)
                    }
                >

                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-content">

                            <div className="modal-header">

                                <h5 className="modal-title fw-bold">
                                    Registrar Préstamo
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        !guardando &&
                                        setModalNuevo(false)
                                    }
                                    disabled={guardando}
                                ></button>

                            </div>

                            <div className="modal-body">

                                <form
                                    onSubmit={e =>
                                        e.preventDefault()
                                    }
                                >

                                    {/* =================================
                                        EQUIPOS
                                    ================================= */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Equipos ({numSeries.length} seleccionados)

                                        </label>

                                        <select
                                            className="form-select"
                                            value=""
                                            onChange={e =>
                                                handleSelectEquipo(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Seleccionar equipo...
                                            </option>

                                            {equiposDisponibles
                                                .filter(
                                                    e =>
                                                        !numSeries.includes(
                                                            obtenerNumeroSerie(e)
                                                        )
                                                )
                                                .map(e => {

                                                    const serie =
                                                        obtenerNumeroSerie(e)

                                                    const nombre =
                                                        obtenerNombreEquipo(e)

                                                    return (

                                                        <option
                                                            key={serie}
                                                            value={serie}
                                                        >

                                                            {nombre}
                                                            {" "}
                                                            ({serie})

                                                        </option>

                                                    )
                                                })
                                            }

                                        </select>

                                        {equiposDisponibles.length === 0 && (

                                            <div className="small text-danger mt-1">

                                                No hay equipos disponibles.

                                            </div>

                                        )}

                                        {numSeries.length > 0 && (

                                            <div className="mt-2">

                                                {numSeries.map(
                                                    serie => {

                                                        const equipo =
                                                            equiposDisponibles.find(
                                                                e =>
                                                                    obtenerNumeroSerie(e) ===
                                                                    serie
                                                            )

                                                        return (

                                                            <div
                                                                key={serie}
                                                                className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light"
                                                            >

                                                                <div>

                                                                    <strong>

                                                                        {
                                                                            obtenerNombreEquipo(
                                                                                equipo
                                                                            )
                                                                        }

                                                                    </strong>

                                                                    <div className="small text-muted">

                                                                        {serie}

                                                                    </div>

                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() =>
                                                                        setNumSeries(
                                                                            prev =>
                                                                                prev.filter(
                                                                                    s =>
                                                                                        s !==
                                                                                        serie
                                                                                )
                                                                        )
                                                                    }
                                                                    disabled={guardando}
                                                                >
                                                                    Quitar
                                                                </button>

                                                            </div>

                                                        )
                                                    }
                                                )}

                                            </div>

                                        )}

                                    </div>

                                    {/* =================================
                                        USUARIO / EMPLEADO
                                    ================================= */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">

                                            Usuario Destino

                                        </label>

                                        <select
                                            className="form-select"
                                            value={
                                                tipoDestino === "empleado"
                                                    ? `empleado:${idEmpleadoSeleccionado}`
                                                    : tipoDestino === "usuario"
                                                        ? `usuario:${idUsuarioSeleccionado}`
                                                        : ""
                                            }
                                            onChange={e =>
                                                handleSelectUsuario(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Seleccionar usuario o empleado...
                                            </option>

                                            <optgroup label="Usuarios">

                                                {usuarios.map(u => (

                                                    <option
                                                        key={`usuario-${u.id_usuario}`}
                                                        value={`usuario:${u.id_usuario}`}
                                                    >

                                                        {u.nombre}

                                                        {u.area
                                                            ? ` (${u.area})`
                                                            : ""
                                                        }

                                                    </option>

                                                ))}

                                            </optgroup>

                                            <optgroup label="Empleados">

                                                {empleados.map(e => (

                                                    <option
                                                        key={`empleado-${e.id_empleado}`}
                                                        value={`empleado:${e.id_empleado}`}
                                                    >

                                                        {e.nombre}

                                                        {e.area
                                                            ? ` (${e.area})`
                                                            : ""
                                                        }

                                                    </option>

                                                ))}

                                            </optgroup>

                                        </select>

                                    </div>

                                    {/* =================================
                                        ÁREA AUTOMÁTICA
                                    ================================= */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Área / Departamento
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            value={areaPrestamo}
                                            readOnly
                                            placeholder="Se asignará automáticamente"
                                        />

                                    </div>

                                    {/* =================================
                                        FECHAS
                                    ================================= */}

                                    <div className="row g-2 mb-3">

                                        <div className="col-6">

                                            <label className="form-label fw-semibold">
                                                Fecha Inicio
                                            </label>

                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={fechaInicio}
                                                min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                                onChange={e => {

                                                    setFechaInicio(
                                                        e.target.value
                                                    )

                                                    if (
                                                        fechaLimite <
                                                        e.target.value
                                                    ) {

                                                        setFechaLimite(
                                                            e.target.value
                                                        )
                                                    }

                                                }}
                                            />

                                        </div>

                                        <div className="col-6">

                                            <label className="form-label fw-semibold">
                                                Fecha Devolución
                                            </label>

                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={fechaLimite}
                                                min={fechaInicio}
                                                onChange={e =>
                                                    setFechaLimite(
                                                        e.target.value
                                                    )
                                                }
                                            />

                                        </div>

                                    </div>

                                    {/* =================================
                                        OBSERVACIONES
                                    ================================= */}

                                    <div className="mb-3">

                                        <label className="form-label fw-semibold">
                                            Observaciones
                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Opcional..."
                                            value={observaciones}
                                            onChange={e =>
                                                setObservaciones(
                                                    e.target.value
                                                )
                                            }
                                        ></textarea>

                                    </div>

                                    {/* =================================
                                        CORREO
                                    ================================= */}

                                    <div className="form-check mb-2">

                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="checkCorreo"
                                            checked={enviarCorreo}
                                            onChange={e =>
                                                setEnviarCorreo(
                                                    e.target.checked
                                                )
                                            }
                                        />

                                        <label
                                            className="form-check-label small"
                                            htmlFor="checkCorreo"
                                        >

                                            Enviar recibo por correo electrónico al usuario

                                        </label>

                                        {enviarCorreo &&
                                            correoDestino && (

                                                <div className="small text-muted ps-1 mt-1">

                                                    Correo:
                                                    {" "}

                                                    <strong>
                                                        {correoDestino}
                                                    </strong>

                                                </div>

                                            )}

                                    </div>

                                </form>

                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setModalNuevo(false)
                                    }
                                    disabled={guardando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={crearPrestamo}
                                    disabled={
                                        guardando ||
                                        numSeries.length === 0 ||
                                        (
                                            !idEmpleadoSeleccionado &&
                                            !idUsuarioSeleccionado
                                        )
                                    }
                                >

                                    {guardando
                                        ? "Registrando..."
                                        : "Registrar Préstamo"
                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    )
}

export default Prestamos