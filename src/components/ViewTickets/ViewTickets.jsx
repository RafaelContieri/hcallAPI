import React, { useEffect, useMemo, useState } from 'react'
import './ViewTickets.css'
import {
    getTicketDetails,
    handleConcluirTicket,
    handleIniciarTicket
} from '../../api/tickets'

const DETAIL_ICONS = {
    download: '/imgs/ticket-details/download.svg',
    action: '/imgs/ticket-details/start.svg'
}

const STATUS_CONFIG = {
    pending: { label: 'Pendente', className: 'pending' },
    doing: { label: 'Andamento', className: 'doing' },
    conclued: { label: 'Resolvido', className: 'resolved' },
    completed: { label: 'Resolvido', className: 'resolved' },
    concluded: { label: 'Resolvido', className: 'resolved' },
    done: { label: 'Resolvido', className: 'resolved' }
}

const MIME_TYPES = {
    bmp: 'image/bmp',
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    pdf: 'application/pdf',
    png: 'image/png',
    svg: 'image/svg+xml',
    webp: 'image/webp'
}

const getTicketId = (ticket) => (
    ticket?.id ?? ticket?._id ?? ticket?.ticketId ?? ticket?.ticket_id ?? ticket
)

const normalizeStatus = (ticket) => String(
    ticket?.tickt_status ?? ticket?.status ?? ticket?.situacao ?? ''
).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const getNormalizedStatus = (ticket) => {
    const status = normalizeStatus(ticket)

    if (['pending', 'pendente', 'open', 'aberto'].includes(status)) return 'pending'
    if (['doing', 'in_progress', 'em_andamento', 'andamento'].includes(status)) return 'doing'
    if (['conclued', 'concluded', 'completed', 'done', 'concluido', 'resolvido'].includes(status)) return 'conclued'

    return status
}

const getStatusConfig = (ticket) => {
    const status = getNormalizedStatus(ticket)

    return STATUS_CONFIG[status] ?? {
        label: status || 'Aguardando',
        className: 'neutral'
    }
}

const extractTicket = (response) => (
    response?.data?.data?.ticket ??
    response?.data?.ticket ??
    response?.ticket ??
    response?.data?.data ??
    response?.data ??
    response
)

const parseJson = (value) => {
    if (typeof value !== 'string') return null

    try {
        return JSON.parse(value)
    } catch {
        return null
    }
}

const getMimeTypeFromName = (name = '') => {
    const extension = name.split('.').pop()?.toLowerCase()
    return MIME_TYPES[extension] ?? 'application/octet-stream'
}

const normalizeAttachment = (rawAttachment, index) => {
    const source = typeof rawAttachment === 'object' && rawAttachment !== null
        ? rawAttachment
        : { base64: rawAttachment }
    const parsedBase64 = typeof source.base64 === 'object' && source.base64 !== null
        ? source.base64
        : parseJson(source.base64)
    const payload = parsedBase64 && typeof parsedBase64 === 'object' ? parsedBase64 : {}
    const name = (
        source.name ?? source.fileName ?? source.filename ??
        payload.name ?? payload.fileName ?? payload.filename ??
        `anexo-${index + 1}`
    )
    const declaredType = (
        source.type ?? source.mimeType ?? source.mime ??
        payload.type ?? payload.mimeType ?? payload.mime
    )
    const content = (
        payload.content ?? payload.data ??
        source.content ?? source.data ??
        (parsedBase64 ? null : source.base64)
    )
    const remoteUrl = (
        source.url ?? source.src ?? source.href ?? source.downloadUrl ??
        payload.url ?? payload.src ?? payload.href ?? payload.downloadUrl
    )
    const type = declaredType || getMimeTypeFromName(name)

    let url = remoteUrl || ''

    if (!url && typeof content === 'string') {
        if (/^(data:|https?:|blob:)/i.test(content)) {
            url = content
        } else {
            url = `data:${type};base64,${content.replace(/^data:[^;]+;base64,/i, '')}`
        }
    }

    if (!url) return null

    const urlMimeType = url.match(/^data:([^;,]+)/i)?.[1]
    const resolvedType = urlMimeType || type

    return {
        id: source.id ?? source._id ?? `${name}-${index}`,
        name,
        type: resolvedType,
        url,
        isImage: resolvedType.startsWith('image/') || /\.(bmp|gif|jpe?g|png|svg|webp)$/i.test(name)
    }
}

const extractAttachments = (response, ticket) => {
    const containers = [ticket, response?.data?.data, response?.data, response]
    const collectionKeys = ['images', 'attachments', 'anexos', 'files']
    const rawAttachments = []
    const seen = new Set()

    containers.forEach((container) => {
        if (!container || typeof container !== 'object') return

        collectionKeys.forEach((key) => {
            const collection = container[key]
            const items = Array.isArray(collection)
                ? collection
                : collection != null
                    ? [collection]
                    : []

            items.forEach((item) => {
                if (seen.has(item)) return
                seen.add(item)
                rawAttachments.push(item)
            })
        })
    })

    return rawAttachments
        .map(normalizeAttachment)
        .filter(Boolean)
}

const formatDate = (dateValue) => {
    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return 'Não informado'

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

const downloadAttachment = (attachment) => {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    link.rel = 'noopener noreferrer'

    if (/^https?:/i.test(attachment.url)) link.target = '_blank'

    document.body.appendChild(link)
    link.click()
    link.remove()
}

const ViewTickets = ({ ticketId, onClose, onTicketUpdated }) => {
    const [ticket, setTicket] = useState(null)
    const [attachments, setAttachments] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [actionError, setActionError] = useState('')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    useEffect(() => {
        let active = true
        const identifier = getTicketId(ticketId)

        if (!identifier) {
            setIsLoading(false)
            setError('Nenhum ticket selecionado.')
            return () => {
                active = false
            }
        }

        const loadTicket = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await getTicketDetails(identifier)
                const ticketData = extractTicket(response)

                if (!ticketData || typeof ticketData !== 'object') {
                    throw new Error('O endpoint não retornou os dados do chamado.')
                }

                if (active) {
                    setTicket(ticketData)
                    setAttachments(extractAttachments(response, ticketData))
                }
            } catch (loadError) {
                console.error('Erro ao buscar detalhes do ticket:', loadError)
                if (active) setError(loadError.message || 'Falha ao carregar os detalhes do ticket.')
            } finally {
                if (active) setIsLoading(false)
            }
        }

        loadTicket()

        return () => {
            active = false
        }
    }, [ticketId])

    const informationFields = useMemo(() => ticket ? [
        { label: 'ID Chamado', value: `#${getTicketId(ticket)}`, mono: true },
        { label: 'Cliente', value: ticket.clientName || ticket.name || 'Não informado' },
        { label: 'Equipamento', value: ticket.item || 'Não informado' },
        { label: 'Referência do Equipamento', value: ticket.reference || 'Não informado' },
        { label: 'Local', value: ticket.department || ticket.location || 'Não informado' },
        { label: 'Tempo', value: formatDate(ticket.date ?? ticket.createdAt ?? ticket.created_at), mono: true },
        { label: 'Autor', value: ticket.author || 'Não informado' }
    ] : [], [ticket])

    const updateTicketStatus = async (nextStatus) => {
        setIsUpdatingStatus(true)
        setActionError('')

        try {
            const requestTicket = {
                ...ticket,
                id: getTicketId(ticket)
            }
            const updatedTicket = nextStatus === 'doing'
                ? await handleIniciarTicket(requestTicket)
                : await handleConcluirTicket(requestTicket)
            const mergedTicket = {
                ...ticket,
                ...updatedTicket,
                tickt_status: updatedTicket.tickt_status || updatedTicket.status || nextStatus,
                status: updatedTicket.status || updatedTicket.tickt_status || nextStatus
            }

            setTicket(mergedTicket)
            onTicketUpdated?.(mergedTicket)
        } catch (statusError) {
            console.error('Erro ao atualizar o status do ticket:', statusError)
            setActionError(statusError.message || 'Não foi possível atualizar o chamado.')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const downloadAllAttachments = () => {
        attachments.forEach((attachment, index) => {
            window.setTimeout(() => downloadAttachment(attachment), index * 120)
        })
    }

    if (isLoading) {
        return (
            <div className="ticket-detail-feedback" role="status">
                <span className="ticket-detail-spinner" />
                Carregando detalhes do chamado...
            </div>
        )
    }

    if (error || !ticket) {
        return (
            <div className="ticket-detail-feedback ticket-detail-error" role="alert">
                <p>{error || 'Não foi possível carregar os dados do chamado.'}</p>
                <button type="button" onClick={onClose}>Voltar</button>
            </div>
        )
    }

    const status = getStatusConfig(ticket)
    const normalizedStatus = getNormalizedStatus(ticket)

    return (
        <article className={`ticket-detail-card ticket-detail-${status.className}`}>
            <span className="ticket-detail-accent" aria-hidden="true" />

            <div className="ticket-detail-body">
                <header className="ticket-detail-header">
                    <div>
                        <h1>Descrição do Problema</h1>
                        <p>#{getTicketId(ticket)}</p>
                    </div>
                    <span className={`ticket-detail-status ticket-detail-status-${status.className}`}>
                        <span />
                        {status.label}
                    </span>
                </header>

                <section className="ticket-problem-description" aria-label="Descrição do problema">
                    {ticket.explain || ticket.description || 'Descrição não informada.'}
                </section>

                <section className="ticket-information-panel" aria-labelledby="ticket-information-title">
                    <h2 id="ticket-information-title">Informações do chamado</h2>
                    <dl>
                        {informationFields.map((field) => (
                            <div key={field.label} className="ticket-information-row">
                                <dt>{field.label}</dt>
                                <dd className={field.mono ? 'ticket-information-mono' : ''}>{field.value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="ticket-attachments-panel" aria-labelledby="ticket-attachments-title">
                    <div className="ticket-section-heading">
                        <div>
                            <h2 id="ticket-attachments-title">Fotos e anexos</h2>
                            <p>{attachments.length} {attachments.length === 1 ? 'arquivo recebido' : 'arquivos recebidos'}</p>
                        </div>
                        <button
                            type="button"
                            className="ticket-download-button"
                            onClick={downloadAllAttachments}
                            disabled={attachments.length === 0}
                        >
                            <img src={DETAIL_ICONS.download} alt="" aria-hidden="true" />
                            Baixar anexos
                        </button>
                    </div>

                    <div className="ticket-attachments-space" aria-label="Espaço reservado para fotos e anexos" />

                    {attachments.length > 0 && (
                        <div className="ticket-attachments-list">
                            {attachments.map((attachment) => (
                                <div key={attachment.id} className="ticket-attachment-row">
                                    <span title={attachment.name}>{attachment.name}</span>
                                    <button type="button" onClick={() => downloadAttachment(attachment)}>
                                        Baixar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <footer className="ticket-detail-footer">
                {actionError && <p role="alert">{actionError}</p>}

                {normalizedStatus === 'pending' && (
                    <button
                        type="button"
                        className="ticket-primary-action"
                        onClick={() => updateTicketStatus('doing')}
                        disabled={isUpdatingStatus}
                    >
                        <img src={DETAIL_ICONS.action} alt="" aria-hidden="true" />
                        {isUpdatingStatus ? 'Atualizando...' : 'Iniciar Chamado'}
                    </button>
                )}

                {normalizedStatus === 'doing' && (
                    <button
                        type="button"
                        className="ticket-primary-action"
                        onClick={() => updateTicketStatus('conclued')}
                        disabled={isUpdatingStatus}
                    >
                        <img src={DETAIL_ICONS.action} alt="" aria-hidden="true" />
                        {isUpdatingStatus ? 'Atualizando...' : 'Finalizar Chamado'}
                    </button>
                )}

                {normalizedStatus === 'conclued' && (
                    <span className="ticket-resolved-message">Chamado concluído</span>
                )}
            </footer>
        </article>
    )
}

export default ViewTickets
