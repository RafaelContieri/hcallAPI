import React, { useEffect, useMemo, useState } from 'react'
import Filters from '../filters/filters'
import ViewTickets from '../ViewTickets/ViewTickets'
import { getTickets } from '../../api/tickets'
import './Tickets.css'

const CARD_ICONS = {
    add: '/imgs/tickets/add.svg',
    id: '/imgs/tickets/ticket-id.svg',
    equipment: '/imgs/tickets/equipment.svg',
    location: '/imgs/tickets/location.svg',
    author: '/imgs/tickets/author.svg',
    calendar: '/imgs/tickets/calendar.svg'
}

const EMPTY_FILTERS = {
    name: '',
    author: '',
    date: '',
    status: ''
}

const STATUS_CONFIG = {
    pending: { label: 'Pendente', className: 'pending' },
    doing: { label: 'Andamento', className: 'doing' },
    conclued: { label: 'Resolvido', className: 'resolved' },
    concluded: { label: 'Resolvido', className: 'resolved' },
    completed: { label: 'Resolvido', className: 'resolved' },
    done: { label: 'Resolvido', className: 'resolved' }
}

const extractTickets = (response) => {
    const possibleLists = [
        response?.data?.data?.tickets,
        response?.data?.tickets,
        response?.tickets,
        response?.data?.data,
        response?.data,
        response
    ]

    return possibleLists.find(Array.isArray) ?? []
}

const getTicketId = (ticket) => (
    ticket?.id ?? ticket?._id ?? ticket?.ticketId ?? ticket?.ticket_id ?? 'Sem ID'
)

const getTicketStatus = (ticket) => String(
    ticket?.tickt_status ?? ticket?.status ?? ticket?.situacao ?? ''
).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const getNormalizedTicketStatus = (ticket) => {
    const status = getTicketStatus(ticket)

    if (['pending', 'pendente', 'pendentes', 'open', 'aberto'].includes(status)) return 'pending'
    if (['doing', 'in_progress', 'em_andamento', 'andamento'].includes(status)) return 'doing'
    if (['conclued', 'concluded', 'completed', 'done', 'concluido', 'resolvido'].includes(status)) return 'conclued'

    return status
}

const getStatusConfig = (ticket) => {
    const status = getNormalizedTicketStatus(ticket)

    return STATUS_CONFIG[status] ?? {
        label: status || 'Aguardando',
        className: 'neutral'
    }
}

const getTicketDate = (ticket) => (
    ticket?.date ?? ticket?.createdAt ?? ticket?.created_at ?? null
)

const getDateInputValue = (ticket) => {
    const date = new Date(getTicketDate(ticket))

    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const formatTicketDate = (ticket) => {
    const date = new Date(getTicketDate(ticket))

    if (Number.isNaN(date.getTime())) return 'Data não informada'

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

const Tickets = ({ initialFilter, onCreateTicket }) => {
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [chamados, setChamados] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filtros, setFiltros] = useState({
        ...EMPTY_FILTERS,
        status: initialFilter || ''
    })

    useEffect(() => {
        setFiltros((current) => ({
            ...current,
            status: initialFilter || ''
        }))
    }, [initialFilter])

    useEffect(() => {
        let active = true

        const fetchTickets = async () => {
            try {
                setLoading(true)
                const response = await getTickets()

                if (active) {
                    setChamados(extractTickets(response))
                    setError(null)
                }
            } catch (fetchError) {
                console.error('Erro ao carregar tickets:', fetchError)
                if (active) {
                    setError('Não foi possível carregar os chamados.')
                    setChamados([])
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        fetchTickets()

        return () => {
            active = false
        }
    }, [])

    const handleFilterChange = (filterType, value) => {
        setFiltros((current) => ({
            ...current,
            [filterType]: value
        }))
    }

    const chamadosFiltrados = useMemo(() => chamados.filter((chamado) => {
        const ticketName = String(chamado?.name ?? chamado?.item ?? '').toLowerCase()
        const author = String(chamado?.author ?? chamado?.email ?? '').toLowerCase()

        if (filtros.name && !ticketName.includes(filtros.name.trim().toLowerCase())) return false
        if (filtros.author && !author.includes(filtros.author.trim().toLowerCase())) return false
        if (filtros.status && getNormalizedTicketStatus(chamado) !== filtros.status) return false
        if (filtros.date && getDateInputValue(chamado) !== filtros.date) return false

        return true
    }), [chamados, filtros])

    const handleTicketUpdated = (updatedTicket) => {
        const updatedId = String(getTicketId(updatedTicket))

        setChamados((currentTickets) => currentTickets.map((currentTicket) => (
            String(getTicketId(currentTicket)) === updatedId
                ? { ...currentTicket, ...updatedTicket }
                : currentTicket
        )))
    }

    if (selectedTicket) {
        return (
            <div className="tickets-details-view">
                <button className="back-button" onClick={() => setSelectedTicket(null)}>
                    ← Voltar para lista
                </button>
                <ViewTickets
                    ticketId={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onTicketUpdated={handleTicketUpdated}
                />
            </div>
        )
    }

    return (
        <section className="tickets-container">
            <header className="tickets-page-header">
                <div>
                    <h1>Lista de Chamados</h1>
                    <p>
                        {loading
                            ? 'Carregando chamados...'
                            : `${chamadosFiltrados.length} ${chamadosFiltrados.length === 1 ? 'chamado encontrado' : 'chamados encontrados'}`}
                    </p>
                </div>

                <button type="button" className="new-ticket-button" onClick={onCreateTicket}>
                    <img src={CARD_ICONS.add} alt="" aria-hidden="true" />
                    Novo Chamado
                </button>
            </header>

            <Filters filtros={filtros} onFiltroChange={handleFilterChange} />

            {loading ? (
                <div className="tickets-feedback" role="status">Carregando chamados...</div>
            ) : error ? (
                <div className="tickets-feedback tickets-error" role="alert">{error}</div>
            ) : chamadosFiltrados.length === 0 ? (
                <div className="tickets-feedback">Nenhum chamado encontrado.</div>
            ) : (
                <div className="tickets-list">
                    {chamadosFiltrados.map((chamado, index) => {
                        const status = getStatusConfig(chamado)

                        return (
                            <button
                                type="button"
                                key={`${getTicketId(chamado)}-${index}`}
                                className={`ticket-item ticket-item-${status.className}`}
                                onClick={() => setSelectedTicket(chamado)}
                            >
                                <span className="ticket-accent" aria-hidden="true" />

                                <span className="ticket-card-header">
                                    <span className="ticket-id">
                                        <img src={CARD_ICONS.id} alt="" aria-hidden="true" />
                                        <span>{getTicketId(chamado)}</span>
                                    </span>
                                    <span className={`ticket-status ticket-status-${status.className}`}>
                                        <span className="ticket-status-dot" />
                                        {status.label}
                                    </span>
                                </span>

                                <span className="ticket-card-details">
                                    <span className="ticket-detail-row">
                                        <img src={CARD_ICONS.equipment} alt="" aria-hidden="true" />
                                        <span className="ticket-detail-label">Equipamento:</span>
                                        <strong>{chamado?.item || 'Não informado'}</strong>
                                    </span>
                                    <span className="ticket-detail-row">
                                        <img src={CARD_ICONS.location} alt="" aria-hidden="true" />
                                        <span className="ticket-detail-label">Local:</span>
                                        <strong>{chamado?.department || chamado?.location || 'Não informado'}</strong>
                                    </span>
                                    <span className="ticket-detail-row">
                                        <img src={CARD_ICONS.author} alt="" aria-hidden="true" />
                                        <span className="ticket-detail-label">Autor:</span>
                                        <strong className="ticket-author-value">{chamado?.author || 'Não informado'}</strong>
                                    </span>
                                    <span className="ticket-detail-row">
                                        <img src={CARD_ICONS.calendar} alt="" aria-hidden="true" />
                                        <span className="ticket-detail-label">Data:</span>
                                        <strong className="ticket-date-value">{formatTicketDate(chamado)}</strong>
                                    </span>
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default Tickets
