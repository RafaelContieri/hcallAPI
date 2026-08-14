import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Titlebar.css'

const Titlebar = ({ userName, pageTitle = 'Home' }) => {
    const navigate = useNavigate()

    const handleLogout = () => {
        navigate('/login')
    }

    return (
        <header className="titlebar">
            <div className="titlebar-left">
                <div className="brand-block">
                    <div className="nameUSER">
                        {pageTitle === 'Home' ? (
                            <h1 className="page-title">
                                Bem-vindo de volta, <span className="user-name">{userName}</span>
                            </h1>
                        ) : (
                            <h1 className="page-title">{pageTitle}</h1>
                        )}
                    </div>
                </div>
            </div>
            <div className="titlebar-right">
                <div className="profile-block">
                    <div className="profile-avatar">
                        <img src="/imgs/usera.png" alt="Avatar" />
                    </div>
                    <div>
                        <p className="profile-name">{userName}</p>
                        <span className="profile-role">Administrador</span>
                    </div>
                </div>
                <button type="button" onClick={handleLogout} className="logout-button">
                    <img src="/imgs/btnexit.png" alt="Logout" width="32" height="32" />
                </button>
            </div>
        </header>
    )
}

export default Titlebar;
