const Paginador = ({ page, setPage, totalItems, size = 10 }) => {
    if (totalItems <= size) return null

    const totalPages = Math.ceil(totalItems / size)
    const desde = (page - 1) * size + 1
    const hasta = Math.min(page * size, totalItems)

    const MAX_VISIBLES = 5
    let inicio = Math.max(1, page - Math.floor(MAX_VISIBLES / 2))
    let fin = Math.min(totalPages, inicio + MAX_VISIBLES - 1)
    inicio = Math.max(1, fin - MAX_VISIBLES + 1)

    const paginas = []
    for (let i = inicio; i <= fin; i++) paginas.push(i)

    const elemento = (n, label, accion, extra = '') => (
        <li key={n} className={`page-item ${extra}`}>
            <button
                type="button"
                className="page-link"
                onClick={accion}
                disabled={extra.includes('disabled')}
            >
                {label}
            </button>
        </li>
    )

    return (
        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <small className="text-muted">
                Mostrando {desde}-{hasta} de {totalItems}
            </small>
            <nav aria-label="Paginación">
                <ul className="pagination pagination-sm mb-0">
                    {elemento('prev', <i className="bi bi-chevron-left"></i>, () => setPage(p => p - 1), page <= 1 ? 'disabled' : '')}
                    {inicio > 1 && elemento('ellipsis-inicio', '…', undefined, 'disabled')}
                    {paginas.map(n => elemento(n, n, () => setPage(n), n === page ? 'active' : ''))}
                    {fin < totalPages && elemento('ellipsis-fin', '…', undefined, 'disabled')}
                    {elemento('next', <i className="bi bi-chevron-right"></i>, () => setPage(p => p + 1), page >= totalPages ? 'disabled' : '')}
                </ul>
            </nav>
        </div>
    )
}

export default Paginador