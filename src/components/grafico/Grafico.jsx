import React, { useEffect, useMemo, useState } from 'react'
import { countTickets } from '../../api/tickets'
import styles from './styles.module.css'

const SERIES = [
  { key: 'total', label: 'Total', color: '#1f3d63' },
  { key: 'doing', label: 'Em Andamento', color: '#12aee0' },
  { key: 'pending', label: 'Pendentes', color: '#f7ad00' },
  { key: 'conclued', label: 'Concluídos', color: '#08be83' }
]

const EMPTY_COUNTS = {
  total: 0,
  doing: 0,
  pending: 0,
  conclued: 0
}

const EMPTY_FILTERS = {
  startDate: '',
  endDate: ''
}

const toCount = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

const getFirstCount = (source, keys) => {
  const key = keys.find((item) => source?.[item] !== undefined)
  return key ? toCount(source[key]) : 0
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

  return Number.isFinite(timestamp) ? timestamp : null
}

/**
 * Calcula as séries do gráfico a partir de uma lista de chamados.
 * Aceita os campos `status`, `tickt_status` ou `situacao`.
 */
const calcularChamados = (chamados = []) => {
  if (!Array.isArray(chamados)) return EMPTY_COUNTS

  return chamados.reduce((counts, chamado) => {
    const status = normalizeStatus(
      chamado?.tickt_status ?? chamado?.status ?? chamado?.situacao
    )

    counts.total += 1

    if (['doing', 'in_progress', 'em_andamento', 'andamento'].includes(status)) {
      counts.doing += 1
    } else if (['pending', 'pendente', 'pendentes', 'open', 'aberto'].includes(status)) {
      counts.pending += 1
    } else if (
      ['conclued', 'concluded', 'completed', 'done', 'concluido', 'concluidos', 'fechado'].includes(status)
    ) {
      counts.conclued += 1
    }

    return counts
  }, { ...EMPTY_COUNTS })
}

const normalizeCounts = (payload) => {
  const source = payload?.data?.data ?? payload?.data ?? payload ?? {}
  const doing = getFirstCount(source, ['doing', 'inProgress', 'in_progress', 'new', 'andamento'])
  const pending = getFirstCount(source, ['pending', 'pendentes', 'pendente', 'open'])
  const conclued = getFirstCount(source, ['conclued', 'concluded', 'completed', 'done'])
  const informedTotal = getFirstCount(source, ['total', 'all'])

  return {
    total: informedTotal || doing + pending + conclued,
    doing,
    pending,
    conclued
  }
}

const getAxisMax = (highestValue) => {
  if (highestValue <= 4) return Math.max(highestValue, 1)

  const rawStep = highestValue / 4
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalizedStep = rawStep / magnitude
  const niceStep = [1, 2, 2.5, 5, 10].find((step) => step >= normalizedStep) ?? 10

  return niceStep * magnitude * 4
}

const formatTick = (value) => new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2
}).format(value)

const Grafico = ({ chamados, contagens, carregando = false, onClearFilters }) => {
  const hasReceivedData = Array.isArray(chamados) || contagens != null
  const [apiCounts, setApiCounts] = useState(EMPTY_COUNTS)
  const [loading, setLoading] = useState(!hasReceivedData)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  useEffect(() => {
    let active = true

    if (hasReceivedData) {
      setLoading(false)
      setError('')
      return () => {
        active = false
      }
    }

    const fetchCounts = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await countTickets()
        if (active) setApiCounts(normalizeCounts(result))
      } catch (fetchError) {
        console.error('Erro ao buscar os dados do gráfico:', fetchError)
        if (active) setError('Não foi possível carregar os dados do gráfico.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchCounts()

    return () => {
      active = false
    }
  }, [hasReceivedData, requestVersion])

  const filteredTickets = useMemo(() => {
    if (!Array.isArray(chamados)) return null

    const startTimestamp = filters.startDate
      ? new Date(`${filters.startDate}T00:00:00`).getTime()
      : null
    const endTimestamp = filters.endDate
      ? new Date(`${filters.endDate}T23:59:59.999`).getTime()
      : null

    return chamados.filter((chamado) => {
      if (startTimestamp !== null || endTimestamp !== null) {
        const ticketTimestamp = getTicketTimestamp(chamado)

        if (ticketTimestamp === null) return false
        if (startTimestamp !== null && ticketTimestamp < startTimestamp) return false
        if (endTimestamp !== null && ticketTimestamp > endTimestamp) return false
      }

      return true
    })
  }, [chamados, filters])

  const counts = useMemo(() => {
    const hasDateFilter = Boolean(filters.startDate || filters.endDate)

    if (hasDateFilter && Array.isArray(filteredTickets)) return calcularChamados(filteredTickets)
    if (contagens != null) return normalizeCounts(contagens)
    if (Array.isArray(filteredTickets)) return calcularChamados(filteredTickets)
    return apiCounts
  }, [apiCounts, contagens, filteredTickets, filters.endDate, filters.startDate])

  const chartData = useMemo(() => SERIES.map((series) => ({
    ...series,
    value: counts[series.key]
  })), [counts])

  const highestValue = Math.max(...chartData.map(({ value }) => value), 0)
  const axisMax = getAxisMax(highestValue)
  const ticks = Array.from({ length: 5 }, (_, index) => axisMax - (axisMax / 4) * index)
  const chartDescription = chartData
    .map(({ label, value }) => `${label}: ${formatTick(value)}`)
    .join('. ')

  const handleClearFilters = () => {
    setFilters({ ...EMPTY_FILTERS })
    onClearFilters?.()
  }

  if (loading || carregando) {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        <span className={styles.loadingDot} />
        Carregando dados do gráfico...
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        <span>{error}</span>
        <button type="button" onClick={() => setRequestVersion((version) => version + 1)}>
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <section className={styles.graficoContainer} aria-label="Gráfico de chamados por status">
      <div className={styles.filters}>
        <label className={styles.filterGroup}>
          <span>Data inicial</span>
          <input
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(event) => setFilters((current) => ({
              ...current,
              startDate: event.target.value
            }))}
          />
        </label>

        <label className={styles.filterGroup}>
          <span>Data final</span>
          <input
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(event) => setFilters((current) => ({
              ...current,
              endDate: event.target.value
            }))}
          />
        </label>

        <button
          type="button"
          className={styles.clearFilters}
          onClick={handleClearFilters}
          disabled={!filters.startDate && !filters.endDate}
        >
          Limpar filtros
        </button>
      </div>

      <div className={styles.chartLegend} aria-hidden="true">
        {chartData.map(({ key, label, color }) => (
          <span key={key} className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className={styles.chart} role="img" aria-label={chartDescription}>
        <div className={styles.yAxis} aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{formatTick(tick)}</span>
          ))}
        </div>

        <div className={styles.plotArea}>
          <div className={styles.gridLines} aria-hidden="true">
            {ticks.map((tick) => <span key={tick} />)}
          </div>

          <div className={styles.bars}>
            {chartData.map(({ key, label, value, color }) => (
              <div key={key} className={styles.barColumn}>
                <div className={styles.barTrack}>
                  {value > 0 && (
                    <div
                      className={styles.bar}
                      style={{
                        height: `${(value / axisMax) * 100}%`,
                        backgroundColor: color
                      }}
                    >
                      <span className={styles.barValue}>{formatTick(value)}</span>
                    </div>
                  )}
                </div>
                <span className={styles.barLabel}>{label}</span>
              </div>
            ))}
          </div>

          {highestValue === 0 && (
            <span className={styles.emptyMessage}>Nenhum chamado encontrado</span>
          )}
        </div>
      </div>
    </section>
  )
}

export default Grafico
