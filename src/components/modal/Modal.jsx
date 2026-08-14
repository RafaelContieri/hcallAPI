import React from 'react';
import './Modal.css';

const Modal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Deseja excluir o usuário?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Deseja excluir o usuário?</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <div className="modal-content">
                    <div className="modal-actions">
                        <button 
                            className="btn-delete" 
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </button>
                        <button 
                            className="btn-confirma" 
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processando...' : confirmText}
                            
                            
                        </button>
                    </div>

                    <div>
                        djkcjklsdnclsd
                        cvnsdvnsdlv
                        dvjsdvsdjv

                        sidebar
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;