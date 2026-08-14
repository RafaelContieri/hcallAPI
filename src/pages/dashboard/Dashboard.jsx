import React, { useState } from 'react'
import Render from '../Render'
import Sidebar from '../../components/layout/Sidebar'
import Titlebar from '../../components/layout/Titlebar'
import './Dashboard.css'

const PAGE_TITLES = {
    home: 'Home',
    tickets: 'Tickets',
    users: 'Usuários',
    account: 'Conta'
}

function Dashboard() {
    const [currentComponent, setCurrentComponent] = useState('home')
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [ticketFilter, setTicketFilter] = useState(null)

    const handleMenuClick = (componentId) => {
        setCurrentComponent(componentId)
        setSelectedUserId(null)
        setTicketFilter(null)
    }

    const handleNavigate = (componentId, options = {}) => {
        setCurrentComponent(componentId)
        setSelectedUserId(null)
        setTicketFilter(options.initialFilter ?? null)
    }

    const handleEditUser = (componentId, userId) => {
        setSelectedUserId(userId)
        setCurrentComponent(componentId)
        setTicketFilter(null)
    }

    const getNomeUsuario = () => {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuario'))
        const nomePadrao = 'Usuário'

        if (usuarioLogado) {
            return usuarioLogado.nome || usuarioLogado.name || nomePadrao
        }

        return nomePadrao
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-content">
                <Sidebar activeItem={currentComponent} onItemClick={handleMenuClick} />
                <div className="dashboard-main">
                    <Titlebar
                        userName={getNomeUsuario()}
                        pageTitle={PAGE_TITLES[currentComponent] ?? 'Home'}
                    />
                    <main className="main-content">
                        <Render
                            component={currentComponent}
                            onEditUser={handleEditUser}
                            userId={selectedUserId}
                            onNavigate={handleNavigate}
                            ticketFilter={ticketFilter}
                        />
                    </main>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
