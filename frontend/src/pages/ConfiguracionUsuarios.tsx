import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  fullName: string;
  ci: string;
  phone: string;
  role: string;
  username: string;
  cargo?: string;
  password?: string;
}

export const ConfiguracionUsuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Edit mode vs Create mode
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [ci, setCi] = useState('');
  const [phone, setPhone] = useState('');
  const [cargo, setCargo] = useState('');
  const [role, setRole] = useState('Seleccione un rol');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Password visibility
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/usuarios');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFullName('');
    setCi('');
    setPhone('');
    setCargo('');
    setRole('Seleccione un rol');
    setUsername('');
    setPassword('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setCi(user.ci);
    setPhone(user.phone);
    setCargo(user.cargo || '');
    setRole(user.role);
    setUsername(user.username);
    setPassword(user.password || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return;
    try {
      const response = await fetch(`http://localhost:3000/usuarios/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchUsers();
      } else {
        alert('No se pudo eliminar el usuario.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'Seleccione un rol') {
      setErrorMsg('Por favor seleccione un rol.');
      return;
    }

    const payload = {
      fullName,
      ci,
      phone,
      cargo,
      role,
      username,
      password,
    };

    try {
      let response;
      if (editingUser) {
        response = await fetch(`http://localhost:3000/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('http://localhost:3000/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const errData = await response.json();
        setErrorMsg(errData.message || 'Error al guardar el usuario.');
      }
    } catch (error) {
      setErrorMsg('Error de red al conectar con el servidor.');
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Action Header */}
      <div className="action-bar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👥 Gestión de Usuarios
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
            Administra los usuarios del sistema
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          + Agregar Usuario
        </button>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#78909c' }}>Cargando usuarios...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #cfd8dc', color: '#78909c' }}>
          <h3>No hay usuarios registrados</h3>
          <p style={{ fontSize: '0.9rem' }}>Haz clic en "+ Agregar Usuario" para registrar el primero.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Carnet</th>
                <th>Teléfono</th>
                <th>Cargo</th>
                <th>Rol</th>
                <th>Usuario</th>
                <th>Contraseña</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '600', color: '#263238' }}>{u.fullName}</td>
                  <td>{u.ci}</td>
                  <td>{u.phone}</td>
                  <td>{u.cargo || 'Funcionario'}</td>
                  <td>
                    <span className={`badge ${
                      u.role === 'Administrador' ? 'badge-new' : u.role === 'Supervisor' ? 'badge-default' : 'badge-retired'
                    }`} style={{
                      backgroundColor: u.role === 'Administrador' ? '#e3f2fd' : u.role === 'Supervisor' ? '#e8f5e9' : '#f3e5f5',
                      color: u.role === 'Administrador' ? '#1565c0' : u.role === 'Supervisor' ? '#2e7d32' : '#8e24aa',
                      borderColor: u.role === 'Administrador' ? '#90caf9' : u.role === 'Supervisor' ? '#a5d6a7' : '#ce93d8'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.username}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{visiblePasswords[u.id] ? u.password || '123456' : '••••••••'}</span>
                      <button 
                        type="button" 
                        onClick={() => togglePasswordVisibility(u.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        👁️
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleOpenEditModal(u)} style={{ background: 'none', border: 'none', color: '#1565c0', cursor: 'pointer', fontSize: '1.1rem' }}>✏️</button>
                      <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal (image14.png) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: '2rem',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ×
            </button>

            <h3 style={{ margin: '0 0 1.5rem 0', color: '#263238', fontSize: '1.3rem' }}>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>

            {errorMsg && (
              <div style={{ padding: '0.75rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ingrese el nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Carnet de Identidad *</label>
                  <input
                    type="text"
                    placeholder="Ej: 12345678"
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="text"
                    placeholder="Ej: 70123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Cargo *</label>
                  <input
                    type="text"
                    placeholder="Ej: Administrador de Sistemas"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rol *</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}>
                    <option value="Seleccione un rol">Seleccione un rol</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Inventariador">Inventariador</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Usuario *</label>
                  <input
                    type="text"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#c62828', color: '#fff' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#2e7d32', color: '#fff' }}>
                  Guardar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
