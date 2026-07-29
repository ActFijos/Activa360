import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../keycloak-config';

export const Layout: React.FC = () => {
  const { username, logout } = useAuth();
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:3000/activos/reportes/alertas-notificaciones');
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="logo-text">
            <h2>SCAF</h2>
            <p>Sistema de Gestión</p>
          </div>
        </div>

        <nav style={{ flexGrow: 1, marginTop: '1rem' }}>
          <div className="nav-label">Navegación</div>
          <ul className="sidebar-nav">
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`} end>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/registro" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                Registro de Activos
              </NavLink>
            </li>
            <li>
              <NavLink to="/asignacion" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Asignación de Activos
              </NavLink>
            </li>
            <li>
              <NavLink to="/transferencias" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
                Transferencias
              </NavLink>
            </li>
            <li>
              <NavLink to="/bajas" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Bajas
              </NavLink>
            </li>
            <li>
              <NavLink to="/reportes" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Reportes
              </NavLink>
            </li>
            <li>
              <div 
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="nav-item-link"
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Configuración
                </div>
                <span style={{ fontSize: '0.7rem' }}>{isConfigOpen ? '▼' : '▶'}</span>
              </div>
              {isConfigOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <li>
                    <NavLink to="/configuracion/general" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem' }}>
                      ⚙️ General
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/configuracion/usuarios" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem' }}>
                      👥 Usuarios
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/configuracion/unidades" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem' }}>
                      🏢 Unidades/Ambientes
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/configuracion/estados" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem' }}>
                      🏷️ Estados
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/configuracion/tipos" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '0.4rem 0.5rem' }}>
                      📋 Tipos de Activos
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <NavLink to="/ayuda" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Ayuda
              </NavLink>
            </li>
          </ul>
        </nav>

        <div style={{ padding: '0 1.5rem', marginTop: 'auto' }}>
          <button 
            onClick={logout} 
            className="btn-danger" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#78909c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Buscar activos por código, nombre, categoría..." />
          </div>

          <div className="header-right">
            <div style={{ position: 'relative' }}>
              <button className="icon-button" onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsDropdownOpen(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notifications.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#e53935',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 2px #fff'
                  }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#fff',
                  border: '1px solid #cfd8dc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  width: '320px',
                  marginTop: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#37474f', borderBottom: '1px solid #eceff1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🔔 Notificaciones Activas</span>
                    <span style={{ fontSize: '0.7rem', color: '#78909c', backgroundColor: '#eceff1', padding: '2px 6px', borderRadius: '10px' }}>
                      {notifications.length} pendientes
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#78909c', fontSize: '0.85rem' }}>
                        No hay tareas pendientes en este momento.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <Link
                          key={item.id}
                          to={item.link}
                          onClick={() => setIsNotificationsOpen(false)}
                          style={{
                            display: 'block',
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid #eceff1',
                            textDecoration: 'none',
                            transition: 'background-color 0.2s',
                          }}
                          className="dropdown-link-hover"
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#263238', marginBottom: '0.2rem' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#546e7a', lineHeight: '1.25' }}>
                            {item.message}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#90a4ae', display: 'block', marginTop: '0.4rem' }}>
                            {new Date(item.date).toLocaleDateString()} a las {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            
            <div style={{ position: 'relative' }}>
              <button className="icon-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#fff',
                  border: '1px solid #cfd8dc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  width: '200px',
                  marginTop: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.5rem 0'
                }}>
                  <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#78909c', borderBottom: '1px solid #eceff1', marginBottom: '0.25rem' }}>
                    CONFIGURACIÓN RÁPIDA
                  </div>
                  <Link to="/configuracion/general" onClick={() => setIsDropdownOpen(false)} style={{ display: 'block', padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#37474f', textDecoration: 'none', transition: 'background-color 0.2s' }} className="dropdown-link-hover">
                    ⚙️ General
                  </Link>
                  <Link to="/configuracion/usuarios" onClick={() => setIsDropdownOpen(false)} style={{ display: 'block', padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#37474f', textDecoration: 'none', transition: 'background-color 0.2s' }} className="dropdown-link-hover">
                    👥 Usuarios
                  </Link>
                  <Link to="/configuracion/unidades" onClick={() => setIsDropdownOpen(false)} style={{ display: 'block', padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#37474f', textDecoration: 'none', transition: 'background-color 0.2s' }} className="dropdown-link-hover">
                    🏢 Unidades/Ambientes
                  </Link>
                  <Link to="/configuracion/estados" onClick={() => setIsDropdownOpen(false)} style={{ display: 'block', padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#37474f', textDecoration: 'none', transition: 'background-color 0.2s' }} className="dropdown-link-hover">
                    🏷️ Estados
                  </Link>
                  <Link to="/configuracion/tipos" onClick={() => setIsDropdownOpen(false)} style={{ display: 'block', padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#37474f', textDecoration: 'none', transition: 'background-color 0.2s' }} className="dropdown-link-hover">
                    📋 Tipos de Activos
                  </Link>
                </div>
              )}
            </div>

            <div className="user-profile">
              <div className="profile-avatar">
                {username ? username.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="profile-details">
                <p className="profile-name">{username || 'Usuario'}</p>
                <p className="profile-role">Administrador</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
