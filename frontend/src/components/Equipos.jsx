import React, {useState, useEffect} from "react";
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES} from "../api/apiRoutes"

const Equipos = ({ usuario }) => {
    const [ equipos, setEquipos ] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [ equipoSeleccionado, setEquipoSeleccionado] = useState({})
    
    const [ modalAsignacion, setModalAsignacion] = useState(false)
    const [ usuarioAsignado, setUsuarioAsignado] = useState('')

    const [ modalEquipo, setModalEquipo] = useState(false)

    const [ filter, setFilter] = useState('')

    useEffect(() => {
        axios.get(API_ROUTES.EQUIPOS)
        .then(response => {
            setEquipos(response.data)
            setLoading(false)
        })
        .catch(err => {
            setError('Hubo un error al obtener los equipos')
            setLoading(false)
        })
    }, [])

    if(loading){
        return <div className="text-center">Cargando . . .</div>
    }

    if(error){
        return <div className="text-center text-danger">{error}</div>
    }

    const handleFilterChange = (e) => {
        setFilter(e.target.value)
    }

    const filteredEquipos = equipos.filter(equipo =>
        equipo.num_serie?.toLowerCase().includes(filter.toLowerCase()) ||
        equipo.responsable?.toLowerCase().includes(filter.toLowerCase())
    )

    // FUNCION PARA ABRIR EL MODAL DE ASIGNACION DE USUARIO AL EQUIPO
    const asignarUsuario = (equipo) => {
        setEquipoSeleccionado({...equipo})
        setUsuarioAsignado(equipo.responsable || '')
        setModalAsignacion(true)
    }

    // FUNCION PARA MANEJAR LOS CAMBIOS EN EL CAMPO DE USUARIO
    const handleUsuarioChange = (e) => {
        setUsuarioAsignado(e.target.value)
    }

    // FUNCION PARA ASIGNAR EL USUARIO AL EQUIPO
    const asignarResponsable = () => {
        const { num_serie } = equipoSeleccionado

        axios.post(API_ROUTES.ASIGNAR_USUARIO, {
            num_serie,
            usuario: usuarioAsignado
        })
        .then(response => {
            const updateEquipos = equipos.map(equipo => {
                if(equipo.num_serie === num_serie) {
                    return {...equipo, responsable: usuarioAsignado}
                }
                return equipo
            })
            setEquipos(updateEquipos)
            setModalAsignacion(false)
            Swal.fire({
                icon: 'success',
                title: 'Usuario asignado correctamente',
                timer: 2000,
                showConfirmButton: false
            })
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Error al asignar usuario',
                text: 'Hubo un error al asignar el usuario al equipo'
            })
        })
    }

    // FUNCION PARA EDITAR EQUIPO
    const editarEquipo = (equipo) => {
        setEquipoSeleccionado({...equipo})
        console.log('Editar equipo:', equipo)
    }

    // FUNCION PARA ABRIR MODAL REPORTE DE FALLA
    const reportarFalla = (equipo) => {
        setEquipoSeleccionado({...equipo})
        setModalEquipo(true)
    }

    // FUNCION PARA MANEJAR CAMBIOS EN LOS CAMPOS
    const handleChange = (e) => {
        setEquipoSeleccionado({
            ...equipoSeleccionado,
            [e.target.name]: e.target.value
        })
    }

    // FUNCION PARA GUARDAR REPORTE DE FALLA
    const guardarReporteFalla = () => {
        const { num_serie, falla } = equipoSeleccionado

        axios.post(API_ROUTES.REPORTE_FALLA, {
            num_serie,
            falla
        })
        .then(response => {
            const updateEquipos = equipos.map(equipo => {
                if(equipo.num_serie === num_serie) {
                    return {...equipo, estado: 'Mantenimiento'}
                }
                return equipo
            })
            setEquipos(updateEquipos)
            setModalEquipo(false)
            Swal.fire({
                icon: 'success',
                title: 'Reporte enviado correctamente',
                timer: 2000,
                showConfirmButton: false
            })
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Error al enviar reporte',
                text: 'Hubo un error al enviar el reporte de falla'
            })
        })
    }

    // FUNCION PARA ASIGNAR CLASES DE COLOR SEGUN EL ESTADO
    const getEstadoClass = (estado) => {
        switch(estado?.toLowerCase()) {
            case 'baja': return 'bg-danger text-white'
            case 'activo': return 'bg-success text-white'
            case 'mantenimiento': return 'bg-warning text-white'
            default: return ''
        }
    }

    return (
        <div className="container mt-4">
            <h3>Equipos</h3>

            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por numero de serie o responsable..."
                    value={filter}
                    onChange={handleFilterChange}
                />
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>Numero de Serie</th>
                            <th>Tipo</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Estado</th>
                            <th>Responsable</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEquipos.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center">No se encontraron equipos</td>
                            </tr>
                        ) : (
                            filteredEquipos.map(equipo => (
                                <tr key={equipo.num_serie}>
                                    <td>{equipo.num_serie}</td>
                                    <td>{equipo.tipo || '-'}</td>
                                    <td>{equipo.marca || '-'}</td>
                                    <td>{equipo.modelo || '-'}</td>
                                    <td>
                                        <span className={`badge ${getEstadoClass(equipo.estado)}`}>
                                            {equipo.estado}
                                        </span>
                                    </td>
                                    <td>{equipo.responsable || 'Sin asignar'}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => asignarUsuario(equipo)}
                                        >
                                            <i className="bi-bi-person-plus"></i>
                                            Asignar
                                        </button>

                                        <button
                                            className="btn warning btn-sm me-2"
                                            onClick={() => reportarFalla(equipo)}
                                        >
                                            <i className="bi-bi-pencil-square"></i>
                                            Reportar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL ASIGNACION DE USUARIO */}
            {modalAsignacion && (
                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{display: 'block', zIndex: '1050'}}
                    onClick={() => setModalAsignacion(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Asignar Usuario</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalAsignacion(false)}
                                >
                                </button>
                            </div>

                            <div className="modal-body">
                                <form>
                                    <div className="form-group mb-3">
                                        <label>Numero de Serie</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="num_serie"
                                            value={equipoSeleccionado.num_serie}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Usuario</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="usuario"
                                            value={usuarioAsignado}
                                            onChange={handleUsuarioChange}
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalAsignacion(false)}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={asignarResponsable}
                                >
                                    Asignar Usuario
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REPORTE FALLA */}
            {modalEquipo && (
                <div
                    className="modal fade show d-block"
                    role="dialog"
                    tabIndex="-1"
                    style={{display: 'block', zIndex: '1050'}}
                    onClick={() => setModalEquipo(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nuevo reporte de falla</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalEquipo(false)}
                                >
                                </button>
                            </div>

                            <div className="modal-body">
                                <form>
                                    <div className="form-group mb-3">
                                        <label>Numero de Serie</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="num_serie"
                                            value={equipoSeleccionado.num_serie}
                                            onChange={handleChange}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Falla del Equipo</label>
                                        <textarea
                                            className="form-control"
                                            name="falla"
                                            value={equipoSeleccionado.falla || ''}
                                            onChange={handleChange}
                                            rows="3"
                                        >
                                        </textarea>
                                    </div>
                                </form>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalEquipo(false)}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={guardarReporteFalla}
                                >
                                    Enviar Reporte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Equipos
