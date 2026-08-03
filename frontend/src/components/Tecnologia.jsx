import React, { useState } from "react";


import Equipos from './Equipos'
import Soportes from './Soportes'
import Historiales from './Historiales'

const Tecnologia = ({ usuario }) => { //recibimos el usuario como prop
    const [vista, setVista ] = useState('equipos')
    const mostrarEquipos = () => setVista('equipos')
    const mostrarSoportes = () => setVista('soportes')
    const mostrarHistoriales = () => setVista('historiales')

    return(
        <div className="container-mt-4">
            {/* BOTONES PARA CAMBIAR DE VISTA*/}
            <div className="text-center mb-4">
                <button className="btn btn-primary me-2" onClick={mostrarEquipos}>
                Equipos
                </button>
            </div>

            <div className="text-center mb-4">
                <button className="btn btn-secondary me-2" onClick={mostrarSoportes}>
                Soportes
                </button>
            </div>

            <div className="text-center mb-4">
                <button className="btn btn-dark me-2" onClick={mostrarHistoriales}>
                Historiales
                </button>
            </div>

            {/* MOSTRAR EL COMPONENTE CORRESPONDIENTE */}
            <div>
                { vista === 'equipos' && <Equipos />}
                { vista === 'soportes' && <Soportes usuario={ usuario}/>}
                { vista === 'historiales' && <Historiales usuario={ usuario}/>}
            </div>
        </div>
    )

}


export default Tecnologia

