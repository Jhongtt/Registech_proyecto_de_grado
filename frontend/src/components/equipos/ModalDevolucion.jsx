import { useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { API_ROUTES } from "../../api/apiRoutes"

const ModalDevolucion = ({ prestamo, onClose, onSuccess }) => {
    const [observacion, setObservacion] = useState("")
    const [evidencia, setEvidencia] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.append("observacion", observacion)
        if (evidencia) {
            formData.append("evidencia", evidencia)
        }

        try {
            await axios.post(
                API_ROUTES.DEVOLVER_EQUIPO(
                    prestamo.id_prestamo,
                    prestamo.num_serie
                ),
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            )

            Swal.fire({
                icon: "success",
                title: "Devolución registrada",
                text: "El equipo ha sido devuelto exitosamente.",
                timer: 2000,
                showConfirmButton: false
            })

            onSuccess()
        } catch (err) {
            console.error("Error al registrar devolución:", err)
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.error || "Hubo un problema al procesar la devolución."
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            Registrar Devolución - {prestamo?.num_serie}
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                            disabled={loading}
                        ></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Equipo:</label>
                                <p className="text-muted mb-1">{prestamo?.equipo || "N/A"}</p>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="observacion" className="form-label">
                                    Observaciones de la devolución
                                </label>
                                <textarea
                                    id="observacion"
                                    className="form-control"
                                    rows="3"
                                    value={observacion}
                                    onChange={(e) => setObservacion(e.target.value)}
                                    placeholder="Detalla el estado en el que se recibe el equipo..."
                                ></textarea>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="evidencia" className="form-label">
                                    Evidencia fotográfica (opcional)
                                </label>
                                <input
                                    type="file"
                                    id="evidencia"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => setEvidencia(e.target.files[0])}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-success"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg me-1"></i> Confirmar Devolución
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ModalDevolucion