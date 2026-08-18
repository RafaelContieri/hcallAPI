import axios from 'axios';

// URL base da API obtida das variáveis de ambiente
const API_URL = import.meta.env.VITE_API_URL;

// Cria uma instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_URL,
  headers: {
    // 'Authorization': localStorage.getItem('@token'),
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Interceptor para adicionar o token automaticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('@token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const extractTicketList = (payload) => {
  const possibleLists = [
    payload?.data?.tickets,
    payload?.data?.list,
    payload?.data?.items,
    payload?.data?.results,
    payload?.data?.rows,
    payload?.tickets,
    payload?.list,
    payload?.items,
    payload?.results,
    payload?.rows,
    payload?.data,
    payload
  ];

  const directList = possibleLists.find(Array.isArray);
  if (directList) return directList;

  if (payload && typeof payload === 'object') {
    const nestedList = Object.values(payload).find(Array.isArray);
    if (nestedList) return nestedList;
  }

  return [];
};

const getTicketIdentifier = (ticket) => (
  ticket?.id ??
  ticket?._id ??
  ticket?.ticketId ??
  ticket?.ticket_id ??
  ticket?.tickt_id ??
  null
);

const getTicketUpdateTimestamp = (ticket) => {
  const date = (
    ticket?.updatedAt ??
    ticket?.updated_at ??
    ticket?.modifiedAt ??
    ticket?.modified_at ??
    ticket?.date
  );
  const timestamp = new Date(date).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const normalizeTicketList = (payload) => {
  const ticketsById = new Map();
  const ticketsWithoutId = [];

  extractTicketList(payload).forEach((ticket) => {
    const identifier = getTicketIdentifier(ticket);

    if (identifier === null || identifier === undefined || identifier === '') {
      ticketsWithoutId.push(ticket);
      return;
    }

    const key = String(identifier);
    const currentTicket = ticketsById.get(key);

    if (
      !currentTicket ||
      getTicketUpdateTimestamp(ticket) >= getTicketUpdateTimestamp(currentTicket)
    ) {
      ticketsById.set(key, ticket);
    }
  });

  return [...ticketsById.values(), ...ticketsWithoutId];
};

/**
 * Função para buscar todos os tickets do sistema
 * @returns {Promise<Array>} - Lista completa de tickets
 * @throws {Error} - Erro caso o token não seja encontrado ou a requisição falhe
 */
async function getTickets() {
  try {
    const response = await api.get('/ticket/all');
    return normalizeTicketList(response.data);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao buscar tickets');
  }
}

/**
 * Função para obter a contagem de tickets
 * @returns {Promise<Object>} - Contagem de tickets
 * @throws {Error} - Erro caso a requisição falhe
 */
async function countTickets(filters = {}) {
  try {
    const response = await api.get('/ticket/all', { params: filters });
    const tickets = normalizeTicketList(response.data);
    return {
      total: tickets.length,
      doing: tickets.filter(ticket => {
        const status = normalizeStatus(ticket?.tickt_status ?? ticket?.status ?? ticket?.situacao)
        return ['doing', 'in_progress', 'em_andamento', 'andamento'].includes(status)
      }).length,
      pending: tickets.filter(ticket => {
        const status = normalizeStatus(ticket?.tickt_status ?? ticket?.status ?? ticket?.situacao)
        return ['pending', 'pendente', 'pendentes', 'open', 'aberto'].includes(status)
      }).length,
      conclued: tickets.filter(ticket => {
        const status = normalizeStatus(ticket?.tickt_status ?? ticket?.status ?? ticket?.situacao)
        return ['conclued', 'concluded', 'completed', 'done', 'concluido', 'concluidos', 'fechado'].includes(status)
      }).length,
      all: tickets.length
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao contar tickets');
  }
}


/**
 * Função para buscar os detalhes de um ticket
 * @param {string} ticketId - ID do ticket que você deseja buscar os detalhes
 * @returns {Promise<Object>} - Detalhes do ticket
 * @throws {Error} - Erro caso o ID seja inválido ou a requisição falhe
 */
async function getTicketDetails(ticketId) {
  if (!ticketId) {
    throw new Error('ID do ticket não fornecido');
  }

  try {
    const response = await api.get('/ticket/details', {
      params: { id: ticketId }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao buscar detalhes do ticket');
  }
}

// Função para formatar a data e hora no estilo brasileiro
function formatarData(dataString) {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
}

/**
 * Função para adicionar uma anotação ao ticket
 * @param {string} ticketId - O ID do ticket ao qual a anotação será adicionada
 * @param {string} texto - O texto da anotação
 * @returns {Promise<Object>} - Retorna a nova anotação criada
 * @throws {Error} - Se o ID do ticket ou texto forem inválidos ou ocorrer um erro na requisição
 */
async function addAnotacao(ticketId, texto) {
  if (!ticketId) {
    throw new Error("ID do ticket não fornecido");
  }

  if (!texto || texto.trim() === "") {
    throw new Error("Texto da anotação não fornecido");
  }

  try {
    await api.put('/ticket/protected/', {
      id: ticketId,
      return: texto,
      data: new Date().toISOString()
    }, {
      params: { id: ticketId }
    });

    return {
      data: new Date().toISOString(),
      texto: texto.trim()
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao adicionar anotação');
  }
}


/**
 * Função para marcar um ticket como "em andamento" (doing)
 * @param {Object} ticket - Objeto do ticket a ser marcado como em andamento
 * @returns {Promise<Object>} - Retorna o ticket atualizado
 * @throws {Error} - Se o ticket for inválido ou ocorrer um erro na requisição
 */
const STATUS_ATUALIZAVEIS = ['doing', 'conclued'];

const updateTicketStatus = async (ticketId, status) => {
  if (!ticketId) {
    throw new Error('ID do ticket não fornecido');
  }

  if (!STATUS_ATUALIZAVEIS.includes(status)) {
    throw new Error('Status do ticket inválido');
  }

  try {
    const response = await api.patch('/ticket/protected/', {
      id: ticketId,
      status
    });

    const responseTicket =
      response.data?.data?.ticket ??
      response.data?.ticket ??
      response.data?.data ??
      response.data;

    return {
      ...(responseTicket && typeof responseTicket === 'object' ? responseTicket : {}),
      id: responseTicket?.id ?? ticketId,
      status: responseTicket?.status ?? responseTicket?.tickt_status ?? status,
      tickt_status: responseTicket?.tickt_status ?? responseTicket?.status ?? status
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao atualizar status do ticket');
  }
};

const handleIniciarTicket = async (ticket) => {
  if (!ticket?.id) {
    throw new Error('Ticket inválido');
  }

  return updateTicketStatus(ticket.id, 'doing');
};

/**
 * Função para concluir um ticket (status completed)
 * @param {Object} ticket - Objeto do ticket a ser concluído
 * @returns {Promise<Object>} - Retorna o ticket concluído
 * @throws {Error} - Se o ticket for inválido ou ocorrer um erro na requisição
 */
const handleConcluirTicket = async (ticket) => {
  if (!ticket?.id) {
    throw new Error('Ticket inválido');
  }

  return updateTicketStatus(ticket.id, 'conclued');
};


//----------------------------------------------------------------------------------------------------------------------------//

/**
 * Endpoint para buscar todos os dados do ticket em formato JSON
 * @param {string} ticketId - ID do ticket relacionado aos dados
 * @returns {Promise<Object>} - Objeto contendo todos os dados do ticket em JSON
 * @throws {Error} - Erro caso o ID seja inválido ou a requisição falhe
 */

const mensagemPadrao = "ticket deletado pelo usuário";

async function fetchTicketData(ticketId) {
  

  try {
    // 1. Faz a requisição para a API que retorna os detalhes do ticket
    const response = await api.get('/ticket/details', {
      params: { id: ticketId }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados do ticket:', error);
    throw error;
  }
}

/**
 * Função para deletar um ticket usando o endpoint DELETE /ticket (rota protegida)
 * @param {string} ticketId - ID do ticket a ser deletado (UUID ou número)
 * @returns {Promise<Object>} - Resposta do servidor após deletar o ticket
 * @throws {Error} - Se o ID não for fornecido ou ocorrer erro na requisição
 * @note O JWT é passado automaticamente no header Authorization pelo interceptor
 */
async function deleteTicket(ticketId) {
  if (!ticketId) throw new Error('ID do ticket não fornecido');
  try {
    const response = await api.delete('/ticket/', { 
      data: { id: ticketId } 
      // JWT é adicionado automaticamente pelo interceptor ao header Authorization
    });
    return response.data;
  } catch (err) {
    const serverMessage = err?.response?.data?.message || err?.response?.data || err?.message;
    throw new Error(serverMessage || 'Erro ao deletar ticket');
  }
}




// Exporta as funções para uso em outros arquivos
export {
  getTickets,
  countTickets,
  getTicketDetails,
  formatarData,
  addAnotacao,
  updateTicketStatus,
  handleConcluirTicket,
  handleIniciarTicket,
  fetchTicketData,
  deleteTicket
};
