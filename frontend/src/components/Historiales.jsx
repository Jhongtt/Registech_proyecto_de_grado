import React, { useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../api/apiRoutes"

const Historiales = ({ usuario }) => {
    const [mantenimientos, setMantenimientos] = useState([])
    const [filter, setFilter] = useState("")

    // FUNCION PARA MANEJAR LOS CAMBIOS EN EL CAMPO FILTRO
    const handleFilterChange = (e) => {
        const value = e.target.value
        setFilter(value)
    }

    // FUNCION PARA SOLICITAR EL HISTORIAL
    const obtenerHistorial = () => {
        // VALIDAR QUE NO ESTE VACIO EL CAMPO DE FILTRO
        if (!filter) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Por favor introduce el id del historial, el numero de serie o el tecnico'
            })
            return
        }

        // ENVIAMOS LA SOLICITUD AL BACKEND
        axios.post(API_ROUTES.MANTENIMIENTOS_FIND, { filter })
            .then(response => {
                if (response.data.length == 0) {
                    setMantenimientos([])
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sin registros',
                        text: 'No existen reportes de mantenimientos'
                    })
                } else {
                    setMantenimientos(response.data)
                }
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar la solicitud',
                    text: 'Hubo un problema al enviar la solicitud, intentalo nuevamente'
                })
            })
    }

    return (
        <div className="container mt-4">
            <h5 className="text-center mb-4">Historial de Mantenimientos</h5>

            {/* CONTENEDOR ADICIONAL PARA CENTAR EL INPUT Y LOS BOTONES */}
            <div className="d-flex justify-content-center">
                <div className="input-group mb-3" style={{ maxWidth: '600px', width: '100%' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Filtrar por id mantenimiento, numero de serie o tecnico"
                        value={filter}
                        onChange={handleFilterChange}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={obtenerHistorial}
                    >
                        Buscar
                    </button>
                </div>
            </div>

            <table className="table table-bordered table-striped">
                <thead>
                    <tr className="text-center" style={{ textTransform: 'uppercase' }}>
                        <th>ID MANTENIMIENTO</th>
                        <th>NUMERO SERIE</th>
                        <th>FALLA</th>
                        <th>SOLUCION</th>
                        <th>TECNICO</th>
                        <th>FECHA REPORTE</th>
                        <th>FECHA SOLUCION</th>
                    </tr>
                </thead>
                <tbody>
                    {mantenimientos.map((equipo, index) => (
                        <tr key={index}>
                            <td>{equipo.id_historial}</td>
                            <td>{equipo.num_serie}</td>
                            <td>{equipo.falla}</td>
                            <td>{equipo.solucion}</td>
                            <td>{equipo.usuario_tecnico}</td>
                            <td>{equipo.fecha_reporte.slice(0, 10)}</td>
                            <td>{equipo.fecha_solucion.slice(0, 10)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Historiales
