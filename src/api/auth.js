import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const PROXY_URL = "https://cors-anywhere.herokuapp.com/";

const api_login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/enter`, {
            email: email,
            password: password

        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('Resposta do servidor:', response.data.data);

        if (response.data.data.token) {
            console.log('Login bem-sucedido, token recebido');
            localStorage.setItem('@token', `Bearer ${response.data.data.token}`);
            localStorage.setItem('usuario', JSON.stringify(response.data.data.user));
            return {
                success: true,
                data: response.data
            };
        } else {
            console.log('Login falhou: Token não encontrado na resposta');
            return {
                success: false,
                error: 'Token não encontrado na resposta'
            };
        }
    } catch (error) {
        console.error('Erro durante o login:', error);
        console.log('Detalhes do erro:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        return {
            success: false,
            error: error.response?.data?.message || 'Erro ao fazer login'
        };
    }
};

export { api_login };