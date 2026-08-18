import React, { useEffect, useState } from 'react'
import { MdFormatListBulleted, MdOutlineNewReleases, MdPendingActions, MdTaskAlt } from 'react-icons/md'
import './Home.css'
import { getTickets } from '../../api/tickets'
import Grafico from '../grafico/Grafico'

const EMPTY_TICKET_COUNTS = {
  all: 0,
  new: 0,
  pending: 0,
  completed: 0
}

const DASHBOARD_REFRESH_INTERVAL = 30000

const STATUS_GROUPS = {
  new: ['doing', 'in_progress', 'em_andamento', 'andamento'],
  pending: ['pending', 'pendente', 'pendentes', 'open', 'aberto'],
  completed: ['conclued', 'concluded', 'completed', 'done', 'concluido', 'concluidos', 'fechado']
}

const normalizeStatus = (status) => String(status || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/[\s-]+/g, '_')

const getTicketTimestamp = (ticket) => {
  const date = ticket?.date ?? ticket?.createdAt ?? ticket?.created_at
  const timestamp = new Date(date).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

const formatTicketDate = (ticket) => {
  const timestamp = getTicketTimestamp(ticket)

  return timestamp
    ? new Date(timestamp).toLocaleDateString('pt-BR')
    : '—'
}

const getRecentTickets = (tickets) => tickets
  .map((ticket, index) => ({ ticket, index }))
  .sort((first, second) => (
    getTicketTimestamp(second.ticket) - getTicketTimestamp(first.ticket) || first.index - second.index
  ))
  .slice(0, 5)
  .map(({ ticket }) => ticket)

const calculateCountsFromTickets = (tickets) => tickets.reduce((counts, ticket) => {
  const status = normalizeStatus(
    ticket?.tickt_status ?? ticket?.status ?? ticket?.situacao
  )

  counts.all += 1

  if (STATUS_GROUPS.new.includes(status)) counts.new += 1
  else if (STATUS_GROUPS.pending.includes(status)) counts.pending += 1
  else if (STATUS_GROUPS.completed.includes(status)) counts.completed += 1

  return counts
}, { ...EMPTY_TICKET_COUNTS })

const normalizeCountPayload = (payload = {}) => {
  const source = payload?.data?.data ?? payload?.data ?? payload ?? {}

  const toNumber = (value) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
  }

  const total = toNumber(source.total ?? source.all ?? source.count ?? 0)
  const newValue = toNumber(source.doing ?? source.inProgress ?? source.in_progress ?? source.new ?? source.andamento ?? 0)
  const pending = toNumber(source.pending ?? source.pendente ?? source.pendentes ?? source.open ?? source.aberto ?? 0)
  const completed = toNumber(
    source.conclued ?? source.concluded ?? source.completed ?? source.done ?? source.concluido ?? source.concluidos ?? source.fechado ?? 0
  )

  const finalTotal = total || newValue + pending + completed

  return {
    all: finalTotal,
    new: newValue,
    pending,
    completed
  }
}

const Home = ({ onNavigate }) => {
  const [ticketCounts, setTicketCounts] = useState(EMPTY_TICKET_COUNTS)
  const [allTickets, setAllTickets] = useState([])
  const [recentTickets, setRecentTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoadingTickets(true)

    const fetchDashboardData = async () => {
      try {
        const tickets = await getTickets()

        if (!active) return

        const nextCounts = calculateCountsFromTickets(tickets)
        setTicketCounts(nextCounts)
        setAllTickets(tickets)
        setRecentTickets(getRecentTickets(tickets))
      } catch (error) {
        console.error('Erro ao buscar a lista de tickets:', error)

        if (active) {
          setTicketCounts(EMPTY_TICKET_COUNTS)
          setAllTickets([])
          setRecentTickets([])
        }
      } finally {
        if (active) {
          setLoadingTickets(false)
        }
      }
    }

    fetchDashboardData()
    const refreshInterval = window.setInterval(fetchDashboardData, DASHBOARD_REFRESH_INTERVAL)
    window.addEventListener('focus', fetchDashboardData)

    return () => {
      active = false
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', fetchDashboardData)
    }
  }, [reloadVersion])

  const handleTicketClick = (status) => {
    onNavigate?.('tickets', { initialFilter: status })
  }

  const reloadDashboard = () => setReloadVersion((version) => version + 1)

  const renderStatusBadge = (status) => {
    const normalized = String(status || '').toLowerCase()

    if (normalized.includes('doing') || normalized.includes('em andamento')) {
      return <span className="status-badge in-progress">Em andamento</span>
    }

    if (normalized.includes('pending') || normalized.includes('pendente')) {
      return <span className="status-badge pending">Pendente</span>
    }

    if (normalized.includes('conclued') || normalized.includes('concluído') || normalized.includes('conclud')) {
      return <span className="status-badge completed">Concluído</span>
    }

    return <span className="status-badge other">Aguardando</span>
  }

  return (
    <div className="home-container">

      <section className="stats-grid">
        <article className="stat-card stat-total" onClick={() => handleTicketClick(null)}>
          <div className="stat-card-top">
            <span>Total de Chamados</span>
            <div className="stat-icon">
              <MdFormatListBulleted />
            </div>
          </div>
          <div className="stat-value">{ticketCounts.all}</div>
        </article>

        <article className="stat-card stat-in-progress" onClick={() => handleTicketClick('doing')}>
          <div className="stat-card-top">
            <span>Em Andamento</span>
            <div className="stat-icon">
              <MdOutlineNewReleases />
            </div>
          </div>
          <div className="stat-value">{ticketCounts.new}</div>
        </article>

        <article className="stat-card stat-pending" onClick={() => handleTicketClick('pending')}>
          <div className="stat-card-top">
            <span>Pendentes</span>
            <div className="stat-icon">
              <MdPendingActions />
            </div>
          </div>
          <div className="stat-value">{ticketCounts.pending}</div>
        </article>

        <article className="stat-card stat-completed" onClick={() => handleTicketClick('conclued')}>
          <div className="stat-card-top">
            <span>Concluídos</span>
            <div className="stat-icon">
              <MdTaskAlt />
            </div>
          </div>
          <div className="stat-value">{ticketCounts.completed}</div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-header">
          <h2>Painel de Desempenho e Histórico</h2>
        </div>
        <div className="panel-body">
          <Grafico
            chamados={allTickets}
            contagens={{
              total: ticketCounts.all,
              doing: ticketCounts.new,
              pending: ticketCounts.pending,
              conclued: ticketCounts.completed
            }}
            carregando={loadingTickets}
            onClearFilters={reloadDashboard}
          />
        </div>
      </section>

      <section className="panel-card panel-table">
        <div className="panel-header">
          <h2>Chamados Recentes</h2>
          <button className="view-all-button" onClick={() => handleTicketClick(null)}>Ver todos</button>
        </div>

        <div className="recent-table">
          <div className="table-row table-head">
            <span>Chamado</span>
            <span>Status</span>
            <span>Usuários</span>
            <span>Data criação</span>
          </div>

          {loadingTickets ? (
            <div className="table-loading">Carregando chamados...</div>
          ) : recentTickets.length === 0 ? (
            <div className="table-empty">Nenhum chamado recente disponível.</div>
          ) : (
            recentTickets.map((item) => (
              <div key={item.id || item._id || `${item.date}-${item.name}`} className="table-row table-item">
                <div className="table-cell ticket-title-cell">
                  <span className="ticket-date">
                    {formatTicketDate(item)}
                  </span>
                  <strong>{item.name || item.item || 'Centro Chamado'}</strong>
                </div>
                <div className="table-cell status-cell">
                  {renderStatusBadge(item.tickt_status ?? item.status)}
                </div>
                <div className="table-cell user-cell">
                  <div className="user-badge">P</div>
                  <span>{item.author || 'Paula Master'}</span>
                </div>
                <div className="table-cell">
                  {formatTicketDate(item)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
