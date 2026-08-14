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

/**
 * Função para buscar todos os tickets do usuário
 * @returns {Promise<Array>} - Lista de tickets do usuário
 * @throws {Error} - Erro caso o token não seja encontrado ou a requisição falhe
 */
async function getTickets() {
  try {
    const response = await api.get('/ticket/');
    return response.data;
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
    const response = await api.get('/ticket/count', { params: filters });
    return response.data;
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
async function fetchTicketData(ticketId) {
  try {
    // 1. Faz a requisição para a API que retorna os detalhes do ticket
    const response = await api.get('/ticket/details', {
      params: { id: ticketId }
    });

    // 2. Verifica se a resposta contém dados válidos
    if (!response.data) {
      throw new Error('Nenhum dado encontrado para o ticket especificado');
    }

    // 3. Retorna todos os dados em formato JSON
    return response.data;

  } catch (error) {
    console.error('Erro ao buscar dados do ticket:', error);
    throw error; // Rejeita a promise com o erro para tratamento externo
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
  fetchTicketData
};
