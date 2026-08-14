import React from 'react';
import Home from '../components/home/Home'
import Users from '../components/users/Users'
import Tickets from '../components/tickets/Tickets'

const Render = ({ component, onEditUser, onNavigate, ticketFilter }) => {
    switch (component) {
        case 'home':
            return <Home onNavigate={onNavigate} />
        case 'tickets':
            return <Tickets initialFilter={ticketFilter} />
        case 'users':
            return <Users onEditUser={onEditUser} />
        case 'account':
        default:
            return <Home onNavigate={onNavigate} />
    }
}

export default Render
