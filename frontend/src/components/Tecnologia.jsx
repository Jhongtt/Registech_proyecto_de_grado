import { useState } from "react"

import Equipos from './Equipos'
import Usuarios from './RecursosHumano'
import Empleados from './Empleados'

const Tecnologia = ({ usuario }) => {
    const [vista, setVista] = useState('equipos')

    return (
        <div>
            {/* HEADER DEL MODULO */}
            <div className="module-header">
                <h2 className="module-title">
                    Panel de Administración
                </h2>

                <div className="badge bg-primary-subtle text-primary-emphasis">
                    Admin: {usuario}
                </div>
            </div>

            {/* PESTAÑAS PARA CAMBIAR DE VISTA */}
            <ul className="nav nav-pills mb-4 gap-2 flex-wrap">

                {/* EQUIPOS */}
                <li className="nav-item">
                    <button
                        className={`nav-link ${
                            vista === 'equipos' ? 'active' : ''
                        }`}
                        onClick={() => setVista('equipos')}
                    >
                        <i className="bi bi-pc-display me-1"></i>
                        Equipos
                    </button>
                </li>

                {/* USUARIOS */}
                <li className="nav-item">
                    <button
                        className={`nav-link ${
                            vista === 'usuarios' ? 'active' : ''
                        }`}
                        onClick={() => setVista('usuarios')}
                    >
                        <i className="bi bi-person me-1"></i>
                        Usuarios
                    </button>
                </li>

                {/* EMPLEADOS */}
                <li className="nav-item">
                    <button
                        className={`nav-link ${
                            vista === 'empleados' ? 'active' : ''
                        }`}
                        onClick={() => setVista('empleados')}
                    >
                        <i className="bi bi-people me-1"></i>
                        Empleados
                    </button>
                </li>

            </ul>

            {/* MOSTRAR EL COMPONENTE CORRESPONDIENTE */}
            <div>
                {vista === 'equipos' && <Equipos />}

                {vista === 'usuarios' && <Usuarios />}

                {vista === 'empleados' && <Empleados />}
            </div>
        </div>
    )
}

export default Tecnologia