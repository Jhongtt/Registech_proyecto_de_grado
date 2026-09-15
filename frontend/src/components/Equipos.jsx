import { useState, useEffect, useCallback } from "react"
import { useLocation } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"
import EquipoCard from "./equipos/EquipoCard"
import ModalPrestamo from "./equipos/ModalPrestamo"
import ModalRegistroEquipo from "./equipos/ModalRegistroEquipo"
import ModalDevolucion from "./equipos/ModalDevolucion"
import Paginador from "./ui/Paginador"
import { useAuth } from "../context/AuthContext"

const Equipos = ({ usuario }) => {
    const { usuario: usuarioAuth } = useAuth()

    const esAdmin = usuarioAuth?.rol === 'admin'
    const esInventario = usuarioAuth?.rol === 'inventario'

    console.log('ROL ACTUAL:', usuarioAuth?.rol)

    const [equipos, setEquipos] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [empleados, setEmpleados] = useState([])
    const [areas, setAreas] = useState([])
    const [prestamosActivos, setPrestamosActivos] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [modalPrestamo, setModalPrestamo] = useState(false)
    const [equipoSeleccionado, setEquipoSeleccionado] = useState({})
    const [modalRegistro, setModalRegistro] = useState(false)

    const [modalDevolucion, setModalDevolucion] = useState(false)
    const [prestamoParaDevolucion, setPrestamoParaDevolucion] = useState(null)

  
    const [filter, setFilter] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [page, setPage] = useState(1)

    const location = useLocation()

    // ======================================================
    // CARGAR DATOS
    // ======================================================

    const cargarDatos = useCallback(() => {
        setLoading(true)
        setError(null)

        Promise.all([
            axios.get(API_ROUTES.EQUIPOS),
            axios.get(API_ROUTES.OBTENER_USUARIOS),
            axios.get(API_ROUTES.OBTENER_AREAS),
            axios.get(API_ROUTES.PRESTAMOS_ACTIVOS)
        ])
            .then(([resEquipos, resUsuarios, resAreas, resPrestamos]) => {

                setEquipos(
                    Array.isArray(resEquipos.data)
                        ? resEquipos.data
                        : []
                )

                setUsuarios(
                    Array.isArray(resUsuarios.data)
                        ? resUsuarios.data.filter(
                            u =>
                                (u.estado || '').toLowerCase() ===
                                'activo'
                        )
                        : []
                )

                setAreas(
                    Array.isArray(resAreas.data)
                        ? resAreas.data
                        : []
                )

                setPrestamosActivos(
                    Array.isArray(resPrestamos.data)
                        ? resPrestamos.data
                        : []
                )

                // Cargar empleados por separado
                axios.get(API_ROUTES.OBTENER_EMPLEADOS)
                    .then(res => {
                        setEmpleados(
                            Array.isArray(res.data)
                                ? res.data.filter(
                                    e =>
                                        (e.estado || '').toLowerCase() ===
                                        'activo'
                                )
                                : []
                        )
                    })
                    .catch(err => {
                        console.error(
                            'Error al cargar empleados en Equipos:',
                            err
                        )

                        setEmpleados([])
                    })
            })
            .catch(err => {
                console.error(
                    'Error al cargar datos de equipos:',
                    err
                )

                setError(
                    'Hubo un error al obtener los equipos'
                )
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        cargarDatos()
    }, [location.pathname, cargarDatos])

    // ======================================================
    // CARGANDO
    // ======================================================

    if (loading) {
        return (
            <div className="text-center py-5 text-secondary">

                <div
                    className="spinner-border text-primary mb-2"
                    role="status"
                ></div>

                <div>
                    Cargando equipos...
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
    // FILTRO DE EQUIPOS
    // ======================================================

    const filteredEquipos = equipos.filter(equipo => {

        const texto = filter.toLowerCase()

        const matchTexto =
            equipo.num_serie
                ?.toLowerCase()
                .includes(texto) ||

            equipo.responsable
                ?.toLowerCase()
                .includes(texto) ||

            equipo.equipo
                ?.toLowerCase()
                .includes(texto)

        const matchEstado =
            !filtroEstado ||
            equipo.estado === filtroEstado

        return matchTexto && matchEstado
    })

    // ======================================================
    // AGRUPAR EQUIPOS POR MODELO
    // ======================================================

    const gruposEquipos = Object.values(
        filteredEquipos.reduce((grupos, equipo) => {

            const nombreModelo =
                equipo.equipo?.trim() ||
                'Equipo sin modelo'

            const clave =
                nombreModelo.toLowerCase()

            if (!grupos[clave]) {
                grupos[clave] = {
                    modelo: nombreModelo,
                    unidades: []
                }
            }

            grupos[clave].unidades.push(equipo)

            return grupos

        }, {})
    )

    // ======================================================
    // PAGINACIÓN
    // ======================================================

    const ROWS = 6

    const totalPages = Math.max(
        1,
        Math.ceil(gruposEquipos.length / ROWS)
    )

    const paginaActual = Math.min(
        page,
        totalPages
    )

    const gruposPagina = gruposEquipos.slice(
        (paginaActual - 1) * ROWS,
        paginaActual * ROWS
    )

    // ======================================================
    // OBTENER VENCIMIENTO
    // ======================================================

    const getVencimiento = (numSerie) => {

        const prestamo =
            prestamosActivos.find(
                p => p.num_serie === numSerie
            )

        const fechaDev =
            prestamo?.fecha_devolucion_programada ||
            prestamo?.fecha_devolucion

        if (!fechaDev) {
            return null
        }

        const hoy = new Date()

        hoy.setHours(0, 0, 0, 0)

        const limite = new Date(
            `${String(fechaDev).substring(0, 10)}T00:00:00`
        )

        const dias = Math.round(
            (limite - hoy) / 86400000
        )

        if (dias < 0) {
            return {
                tipo: 'vencido',
                dias: Math.abs(dias),
                fecha: limite
            }
        }

        if (dias <= 2) {
            return {
                tipo: 'por_vencer',
                dias,
                fecha: limite
            }
        }

        return null
    }

    // ======================================================
    // ABRIR MODAL DE PRÉSTAMO
    // ======================================================

    const abrirModalPrestamo = (equipo) => {

        setEquipoSeleccionado({
            ...equipo
        })

        setModalPrestamo(true)
    }

    // ======================================================
    // DEVOLVER EQUIPO
    // ======================================================

    const devolverEquipo = async (equipo) => {

        let prestamo

        try {

            const res = await axios.get(
                API_ROUTES.PRESTAMOS_ACTIVOS_POR_EQUIPO(
                    equipo.num_serie
                )
            )

            prestamo = res.data
           
            setPrestamoParaDevolucion(prestamo)
            setModalDevolucion(true)
            return;

        } catch {

            Swal.fire({
                icon: 'warning',
                title: 'Sin préstamo activo',
                html: `
                    No se encontró un préstamo activo para
                    <strong>${equipo.num_serie}</strong>.
                    <br/><br/>
                    El equipo quedó marcado como asignado sin registro
                    de préstamo. Puedes liberarlo para dejarlo disponible.
                `,
                showCancelButton: true,
                confirmButtonText:
                    '<i class="bi bi-unlock me-1"></i>Liberar equipo',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#2563eb'
            })
                .then(result => {

                    if (!result.isConfirmed) {
                        return
                    }

                    axios.post(
                        API_ROUTES.LIBERAR_EQUIPO(
                            equipo.num_serie
                        )
                    )
                        .then(() => {

                            cargarDatos()

                            Swal.fire({
                                icon: 'success',
                                title: 'Equipo liberado',
                                text:
                                    `${equipo.equipo} está disponible nuevamente`,
                                timer: 2500,
                                showConfirmButton: false
                            })
                        })
                        .catch(err => {

                            Swal.fire({
                                icon: 'error',
                                title: 'Error al liberar',
                                text:
                                    err.response?.data?.error ||
                                    'Hubo un error al liberar el equipo'
                            })

                        })
                })

            return
        }

        Swal.fire({
            icon: 'question',
            title: '¿Registrar devolución?',
            html: `
                <strong>${equipo.equipo}</strong>
                volverá a estar
                <span class="text-success fw-bold">
                    Disponible
                </span>
            `,
            showCancelButton: true,
            confirmButtonText:
                '<i class="bi bi-arrow-return-left me-1"></i>Sí, devolver',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#16a34a'
        })
            .then(result => {

                if (!result.isConfirmed) {
                    return
                }

                axios.post(
                    API_ROUTES.DEVOLVER_EQUIPO(
                        prestamo.id_prestamo,
                        equipo.num_serie
                    )
                )
                    .then(() => {

                        cargarDatos()

                        Swal.fire({
                            icon: 'success',
                            title: 'Devolución registrada',
                            text:
                                `${equipo.equipo} está disponible nuevamente`,
                            timer: 2500,
                            showConfirmButton: false
                        })

                    })
                    .catch(err => {

                        Swal.fire({
                            icon: 'error',
                            title: 'Error al devolver',
                            text:
                                err.response?.data?.error ||
                                'Hubo un error al registrar la devolución'
                        })

                    })
            })
    }

    // ======================================================
    // PRÉSTAMO CONFIRMADO
    // ======================================================

    const handlePrestamoConfirmado = async () => {

        setModalPrestamo(false)

        cargarDatos()
    }

    // ======================================================
    // EQUIPO REGISTRADO
    // ======================================================

    const handleEquipoRegistrado = (nuevoEquipo) => {

        setModalRegistro(false)

        setEquipos(prev => [
            nuevoEquipo,
            ...prev
        ])
    }

    // ======================================================
    // EQUIPO ACTUALIZADO
    // ======================================================

    const handleEquipoActualizado = (equipoActualizado) => {

        setEquipos(prev =>
            prev.map(e =>
                e.num_serie === equipoActualizado.num_serie
                    ? equipoActualizado
                    : e
            )
        )
    }

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div className="card">

            <div className="card-body">

                {/* ==================================================
                    ENCABEZADO
                ================================================== */}

                <div className="module-header">

                    <h4 className="module-title mb-0">
                        Inventario de Equipos
                    </h4>

                    <div className="d-flex gap-2 align-items-center">

                        <span className="badge text-bg-primary">
                            {gruposEquipos.length} modelos
                        </span>

                        {(esAdmin || esInventario) && (
                            <button
                                className="btn btn-sm btn-success rounded-pill"
                                onClick={() =>
                                    setModalRegistro(true)
                                }
                            >
                                <i className="bi bi-plus-lg me-1"></i>
                                Agregar Equipo
                            </button>
                        )}

                    </div>

                </div>

                {/* ==================================================
                    FILTROS
                ================================================== */}

                <div className="mb-3">

                    <div className="row g-2">

                        <div className="col-md-8">

                            <div className="input-group">

                                <span className="input-group-text">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar por número de serie, equipo o responsable..."
                                    value={filter}
                                    onChange={(e) => {
                                        setFilter(e.target.value)
                                        setPage(1)
                                    }}
                                />

                            </div>

                        </div>

                        <div className="col-md-4">

                            <select
                                className="form-select"
                                value={filtroEstado}
                                onChange={(e) => {
                                    setFiltroEstado(e.target.value)
                                    setPage(1)
                                }}
                            >

                                <option value="">
                                    Todos los estados
                                </option>

                                <option value="Disponible">
                                    Disponible
                                </option>

                                <option value="Asignado">
                                    En Préstamo
                                </option>

                                <option value="En mantenimiento">
                                    En mantenimiento
                                </option>

                                <option value="Baja">
                                    Baja
                                </option>

                            </select>

                        </div>

                    </div>

                </div>

                {/* ==================================================
                    TARJETAS AGRUPADAS
                ================================================== */}

                {gruposEquipos.length === 0 ? (

                    <div className="empty-state">

                        <p className="text-muted my-3">
                            No se encontraron equipos
                        </p>

                    </div>

                ) : (

                    <div className="row g-3">

                        {gruposPagina.map(grupo => {

                            const equipoPrincipal =
                                grupo.unidades[0]

                            return (
                                <div
                                    className="col-xl-4 col-md-6"
                                    key={
                                        grupo.modelo
                                    }
                                >

                                    <EquipoCard
                                        equipo={
                                            equipoPrincipal
                                        }

                                        unidades={
                                            grupo.unidades
                                        }

                                        onPrestamo={
                                            abrirModalPrestamo
                                        }

                                        onDevolver={
                                            devolverEquipo
                                        }

                                        vencimiento={
                                            getVencimiento(
                                                equipoPrincipal.num_serie
                                            )
                                        }

                                        onEquipoActualizado={
                                            handleEquipoActualizado
                                        }
                                    />

                                </div>
                            )
                        })}

                    </div>

                )}

                {/* ==================================================
                    PAGINADOR
                ================================================== */}

                <Paginador
                    page={paginaActual}
                    setPage={setPage}
                    totalItems={gruposEquipos.length}
                    size={ROWS}
                />

                {/* ==================================================
                    MODAL PRÉSTAMO
                ================================================== */}

                {modalPrestamo && (

                    <ModalPrestamo
                        equipo={equipoSeleccionado}
                        usuarios={usuarios}
                        empleados={empleados}
                        areas={areas}

                        onClose={() =>
                            setModalPrestamo(false)
                        }

                        onConfirmado={
                            handlePrestamoConfirmado
                        }
                    />

                )}

                {/* ==================================================
                    MODAL REGISTRO
                ================================================== */}

                {modalRegistro && (

                    <ModalRegistroEquipo
                        areas={areas}

                        onClose={() =>
                            setModalRegistro(false)
                        }

                        onRegistrado={
                            handleEquipoRegistrado
                        }
                    />

                )}

                {/* <-- AGREGA ESTE BLOQUE AL FINAL DE LOS MODALES --> */}
                {modalDevolucion && (
                    <ModalDevolucion 
                        prestamo={prestamoParaDevolucion}
                        onClose={() => setModalDevolucion(false)}
                        onSuccess={() => {
                            setModalDevolucion(false)
                            cargarDatos() // Refresca la tabla
                        }}
                    />
                )}

            </div>

        </div>
    )
}

export default Equipos