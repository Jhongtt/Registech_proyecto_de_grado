import React, { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const Soportes = ({ usuario }) => {
    const [mantenimientos, setMantenimientos] = useState([])
    const [totalRegistros, setTotalRegistros] = useState(0)

    const [modalVisible, setModalVisible] = useState(false)
    const [selectedFalla, setSelectedFalla] = useState("")
    const [selectedNumSerie, setSelectedNumSerie] = useState("")
    const [selectedIdHistorial, setSelectedIdHistorial] = useState("")
    const [solucion, setSolucion] = useState("")

    // USE EFFECT PARA OBTENER LOS EQUIPOS EN MANTENIMIENTO Y EL TOTAL DE REGISTROS
    useEffect(() => {
        axios.get(API_ROUTES.OBTENER_MANTENIMIENTOS)
            .then(response => {
                setMantenimientos(response.data)
                setTotalRegistros(response.data.length)
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron obtener los datos',
                    confirmButtonText: 'Ok'
                })
            })
    }, [])

    // FUNCION PARA MANEJAR LA APERTURA DEL MODAL
    const handleOpenModal = (falla, idHistorial, num_serie) => {
        setSelectedFalla(falla)
        setSelectedIdHistorial(idHistorial)
        setSelectedNumSerie(num_serie)
        setModalVisible(true)
    }

    // FUNCION PARA MANEJAR EL CIERRE DEL MODAL
    const handleCloseModal = () => {
        setModalVisible(false)
        setSolucion("")
    }

    // FUNCION PARA REGISTRAR LA SOLUCION AL BACKEND
    const registrarSolucion = (e) => {
        e.preventDefault()

        // VERIFICAMOS QUE LA SOLUCION EXISTA
        if (!solucion.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, ingresa la solucion',
                confirmButtonText: 'Ok'
            })
            return
        }

        // VERIFICAMOS QUE TODOS LOS PARAMETROS NECESARIOS ESTEN PRESENTES
        if (!selectedNumSerie || !selectedIdHistorial || !usuario) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Faltan datos requeridos',
                confirmButtonText: 'Ok'
            })
            return
        }

        // ENVIAR LA SOLICITUD POST AL BACKEND
        axios.post(API_ROUTES.ACTUALIZAR_MANTENIMIENTOS, {
            num_serie: selectedNumSerie,
            id_historial: selectedIdHistorial,
            tecnico: usuario,
            solucion: solucion
        })
            .then((response) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Exito',
                    text: response.data,
                    confirmButtonText: 'Ok'
                })

                // CERRAR EL MODAL Y ACTUALIZAR LA LISTA DE MANTENIMIENTOS
                handleCloseModal()
            })
    }

    return (
        <div className="container mt-4">
            <h3>Soportes - Mantenimientos Pendientes</h3>
            <p>Total de reportes pendientes: <strong>{totalRegistros}</strong></p>

            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>ID Historial</th>
                            <th>Numero de Serie</th>
                            <th>Fecha Reporte</th>
                            <th>Falla</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mantenimientos.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center">No hay reportes pendientes</td>
                            </tr>
                        ) : (
                            mantenimientos.map(m => (
                                <tr key={m.id_historial}>
                                    <td>{m.id_historial}</td>
                                    <td>{m.num_serie}</td>
                                    <td>{m.fecha_reporte}</td>
                                    <td>{m.falla}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleOpenModal(m.falla, m.id_historial, m.num_serie)}
                                        >
                                            Resolver
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL REGISTRAR SOLUCION */}
            {modalVisible && (
                <div
                    className="modal fade show"
                    tabIndex="-1"
                    style={{ display: 'block' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Registrar solucion</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCloseModal}
                                >
                                </button>
                            </div>

                            <div className="modal-body">
                                <p><strong>Falla: </strong>{selectedFalla}</p>
                                <p><strong>Numero de Serie: </strong>{selectedNumSerie}</p>
                                <p><strong>Tecnico: </strong>{usuario}</p>

                                <form onSubmit={registrarSolucion}>
                                    <div className="mb-3">
                                        <label htmlFor="solucion" className="form-label">Solucion</label>
                                        <textarea
                                            className="form-control"
                                            id="solucion"
                                            value={solucion}
                                            onChange={(e) => setSolucion(e.target.value)}
                                            required
                                        >
                                        </textarea>
                                    </div>

                                    <div className="text-center">
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                        >
                                            Registrar Solucion
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Soportes
