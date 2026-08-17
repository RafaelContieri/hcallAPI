import React from 'react'
import './filters.css'

const FILTER_ICONS = {
    name: '/imgs/tickets/search.svg',
    author: '/imgs/tickets/author.svg',
    date: '/imgs/tickets/calendar-filter.svg'
}

function Filters({ filtros, onFiltroChange }) {
    return (
        <section className="tickets-filters" aria-label="Filtros de chamados">
            <label className="ticket-filter-field">
                <span className="sr-only">Código Chamado</span>
                <img src={FILTER_ICONS.name} alt="" aria-hidden="true" />
                <input
                    type="search"
                    placeholder="Código Chamado"
                    value={filtros.name}
                    onChange={(event) => onFiltroChange('name', event.target.value)}
                />
            </label>

            <label className="ticket-filter-field">
                <span className="sr-only">Nome do autor</span>
                <img src={FILTER_ICONS.author} alt="" aria-hidden="true" />
                <input
                    type="text"
                    placeholder="Autor..."
                    value={filtros.author}
                    onChange={(event) => onFiltroChange('author', event.target.value)}
                />
            </label>

            <label className="ticket-filter-field ticket-filter-date">
                <span className="sr-only">Data de criação</span>
                <img src={FILTER_ICONS.date} alt="" aria-hidden="true" />
                <input
                    type="date"
                    value={filtros.date}
                    onChange={(event) => onFiltroChange('date', event.target.value)}
                />
            </label>

            <label className="ticket-filter-field ticket-filter-select">
                <span className="sr-only">Status do chamado</span>
                <select
                    value={filtros.status}
                    onChange={(event) => onFiltroChange('status', event.target.value)}
                >
                    <option value="">Todos os status</option>
                    <option value="pending">Pendente</option>
                    <option value="doing">Em andamento</option>
                    <option value="conclued">Resolvido</option>
                </select>
            </label>
        </section>
    )
}

export default Filters
