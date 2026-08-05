import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"

import Tecnologia from './Tecnologia'
import RecursosHumanos from "./RecursosHumano"
import Soportes from "./Soportes"
const Dashboard = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const { usuario } = location.state || { }

    if(!usuario) {
        navigate('/login')
        return null
    }

    // FUNCION PARA MANEJAR EL CIERRE DE SESION
    const handleLogout = () => {
        Swal.fire({
            icon: 'warning',
            title: '¿Estas seguro?',
            text: 'Quieres cerrar sesion',
            showCancelButton: true,
            confirmButtonText: 'Si, cerrar sesion',
            cancelButtonText: 'Cancelar'
        })
        .then((result) => {
            if(result.isConfirmed) {
            Swal.fire({
            icon: 'success',
            title: 'Hasta Luego',
            text: 'Gracias por usar la aplicacion',
            timer: 2000, // espera dos segundos antes de redirigir
            showConfirmButton: false
            })
            .then(() => {
                navigate('/login')
            })
            }
        })
    }

    const renderAreaComponent = () => {
        switch(usuario.area) {
        case 'Tecnologia': return <Tecnologia usuario= { usuario.usuario } /> // Pasamos el usuario como prop
        case 'Recursos Humanos': return <RecursosHumanos />
        case 'Soporte': return <Soportes usuario= { usuario.usuario } />
        default: return (
            <div className="text-center mt-5">
                <h4>Modulo en desarrollo</h4>
                <p>El modulo de tu area ({usuario.area}) se esta construyendo.</p>
            </div>
        )
        }
    }

    return (
        <div>
            {/* BARRA SUPERIOR */}
        <div className="d-flex justify-content-between align-items-center bg-dark text text-white p-3" >
            <div className="text-Center w-100">
                <p className="m-0">{usuario.nombre}</p> {/* Nombre centrado */}
                <p className="m-0">{usuario.area}</p>  {/* Area centrada de bajo del nombre */}
            </div>

            <button className="btn btn-danger" onClick={handleLogout}>
                <i className="bi bi box-arrow-rigth"></i> {/* Icono de Bootstrap */}

            </button>
    </div>

    { renderAreaComponent() }
</div>
    )

}

export default Dashboard
