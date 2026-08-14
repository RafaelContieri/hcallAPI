import React, { useState, useEffect } from 'react';
import './Users.css';
import AccountCreate from '../account-create/Account-create';
import { getUsers, deleteUser } from '../../api/createUser';
import Modal from '../modal/Modal';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

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
            setError('Falha ao carregar usuários');
        }
    };

    const handleDeleteClick = (user) => {
        console.log("Usuário para deletar:", user);

        // Verifica APENAS id (não verifica _id)
        if (!user.id) {
            console.error("Usuário não tem ID válido:", user);
            setError('Usuário não possui identificador válido');
            return;
        }

        setUserToDelete(user);
        setShowDeleteModal(true);
    };
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            const userId = userToDelete.email;
            if (!userId) throw new Error('ID do usuário não encontrado');

            const result = await deleteUser(userId);

            if (result.success) {
                setUsers(users.filter(u => u.email !== userId));
            } else {
                setError(result.error || 'Erro ao excluir usuário');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            setError(error.message || 'Erro ao excluir usuário');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
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

            {error && <div className="error-message">{error}</div>}

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
                                    {isDeleting && userToDelete &&
                                        (user._id === userToDelete.id || user.id === userToDelete.id)
                                        ? 'Excluindo...'
                                        : 'Excluir'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir ${userToDelete?.name} (${userToDelete?.email})?`}
                confirmText={isDeleting ? 'Excluindo...' : 'Confirmar'}
                cancelText="Cancelar"
                isConfirmDisabled={isDeleting || !userToDelete}
            />
        </div>
    );
};

export default Users;
