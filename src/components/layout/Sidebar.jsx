import React from 'react';
import { MdHome, MdListAlt, MdPeople } from 'react-icons/md';
import './Sidebar.css';

const Sidebar = ({ activeItem, onItemClick }) => {
    const menuItems = [
        { id: 'home', label: 'Home', icon: <MdHome /> },
        { id: 'tickets', label: 'Tickets', icon: <MdListAlt /> },
        { id: 'users', label: 'Usuários', icon: <MdPeople /> }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src="/imgs/logo.svg" alt="H-Call" className="sidebar-logo" />
            </div>
            <div className="sidebar-menu">
                {menuItems.map(item => (
                    <div
                        key={item.id}
                        className={`menu-item ${activeItem === item.id ? 'active' : ''}`}
                        onClick={() => onItemClick(item.id)}
                    >
                        <span className="icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar; 