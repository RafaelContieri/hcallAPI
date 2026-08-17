import React, { useState, useEffect } from 'react';
import './Users.css';
import AccountCreate from '../account-create/Account-create';
import { getUsers, deleteUser } from '../../api/createUser';
import useFeedback from '../feedback/useFeedback';

const Users = () => {
    const { showConfirmation, showError, showSuccess, showWarning } = useFeedback();
    const [users, setUsers] = useState([]);
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            console.log("Dados completos recebidos:", data); // Verifique a estrutura real
            setUsers(data);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            showError({
                title: 'Falha ao carregar usuários',
                message: error.message || 'Não foi possível carregar a lista de usuários.'
            });
        }
    };

    const handleDeleteClick = async (user) => {
        console.log("Usuário para deletar:", user);

        if (!user.email) {
            console.error("Usuário não tem e-mail válido:", user);
            showWarning({
                title: 'Não foi possível continuar',
                message: 'Usuário não possui um e-mail válido para exclusão.'
            });
            return;
        }

        const confirmed = await showConfirmation({
            title: `Tem certeza que deseja excluir ${user.name || 'este usuário'}?`
        });

        if (!confirmed) return;

        setUserToDelete(user);
        setIsDeleting(true);

        try {
            const userId = user.email;
            if (!userId) throw new Error('ID do usuário não encontrado');

            const result = await deleteUser(userId);

            if (result.success) {
                setUsers((currentUsers) => currentUsers.filter(u => u.email !== userId));
                showSuccess({
                    title: 'Sucesso !',
                    message: 'Usuário excluído com sucesso.'
                });
            } else {
                showError({
                    title: 'Falha ao excluir usuário',
                    message: result.error || 'Não foi possível excluir o usuário.'
                });
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showError({
                title: 'Falha ao excluir usuário',
                message: error.message || 'Não foi possível excluir o usuário.'
            });
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };
    const handleCreateUser = () => {
        setShowCreateAccount(true);
    };

    const handleBackToUsers = () => {
        setShowCreateAccount(false);
        fetchUsers();
    };

    if (showCreateAccount) {
        return (
            <AccountCreate
                onCancel={handleBackToUsers}
                onCreated={handleBackToUsers}
            />
        );
    }

    return (
        <div className="users-container">
            <div className="title-info">
                <h2>Usuários</h2>
                <button className="action-btn create-user" onClick={handleCreateUser}>
                    Criar Usuário
                </button>
            </div>

            <div className="users-grid">
                {Array.isArray(users) && users.map(user => (
                    <div className="user-block" key={user._id || user.id || user.email}>
                        <div className="user-header">
                            <div className="user-id">#{user._id || user.id || 'N/A'}</div>
                            <div className="user-role" data-role={user.role?.toLowerCase()}>
                                {user.role}
                            </div>
                        </div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-footer">
                            <div className="user-info-left">
                                <div className="user-email">
                                    <span className="email-icon">📧</span>
                                    {user.email}
                                </div>
                            </div>
                            <div className="user-actions">
                                <button
                                    onClick={() => handleDeleteClick(user)} // Passa o objeto completo
                                    className="action-btn delete"
                                    disabled={isDeleting}
                                >
                                    {isDeleting && userToDelete?.email === user.email
                                        ? 'Excluindo...'
                                        : 'Excluir'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default Users;
