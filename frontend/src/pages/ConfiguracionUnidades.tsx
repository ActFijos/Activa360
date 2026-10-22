import React, { useState, useEffect } from 'react';

interface Environment {
  id: string;
  name: string;
  unit: string;
  assetCount: number;
}

export const ConfiguracionUnidades: React.FC = () => {
  const [environments, setEnvironments] = useState<Environment[]>([
    { id: '1', name: 'Aula 345', unit: 'Facultad de Tecnología', assetCount: 25 },
    { id: '2', name: 'Oficina de Administración', unit: 'Rectorado', assetCount: 15 },
    { id: '3', name: 'Laboratorio de Química', unit: 'Facultad de Medicina', assetCount: 42 },
    { id: '4', name: 'Sala de Conferencias A', unit: 'Facultad de Tecnología', assetCount: 8 },
    { id: '5', name: 'Biblioteca Principal', unit: 'Rectorado', assetCount: 0 },
    { id: '6', name: 'Aula Magna', unit: 'Facultad de Derecho', assetCount: 18 },
    { id: '7', name: 'Almacén General', unit: 'Almacén Central', assetCount: 120 },
    { id: '8', name: 'Sala de Profesores', unit: 'Facultad de Tecnología', assetCount: 0 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Seleccione una unidad');

  // Load from local storage if exists
  useEffect(() => {
    const saved = localStorage.getItem('cfg_environments');
    if (saved) {
      setEnvironments(JSON.parse(saved));
    }
  }, []);

  const saveToLocal = (data: Environment[]) => {
    setEnvironments(data);
    localStorage.setItem('cfg_environments', JSON.stringify(data));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (unit === 'Seleccione una unidad') {
      alert('Seleccione una unidad válida.');
      return;
    }

    const newEnv: Environment = {
      id: Date.now().toString(),
      name,
      unit,
      assetCount: 0
    };

    saveToLocal([...environments, newEnv]);
    setIsModalOpen(false);
    setName('');
    setUnit('Seleccione una unidad');
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este ambiente?')) return;
    saveToLocal(environments.filter(env => env.id !== id));
  };

  const filtered = environments.filter(env =>
    env.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    env.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header bar */}
      <div className="action-bar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏢 Unidades/Ambientes
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
            Gestión de unidades y ambientes del sistema
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o unidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.6rem 1rem', border: '1px solid #cfd8dc', borderRadius: '8px', fontSize: '0.85rem', width: '220px' }}
          />
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Agregar Ambiente
          </button>
        </div>
      </div>

      {/* Tabs placeholder */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #eceff1', paddingBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
        <span style={{ color: '#1565c0', borderBottom: '2px solid #1565c0', paddingBottom: '0.5rem', cursor: 'pointer' }}>📍 Ambientes</span>
        <span style={{ color: '#78909c', cursor: 'pointer' }}>🏢 Gestión de Unidades</span>
      </div>

      {/* Environments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ambiente</th>
              <th>Cantidad de Activos</th>
              <th>Unidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(env => (
              <tr key={env.id}>
                <td style={{ fontWeight: '600', color: '#263238' }}>{env.name}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', borderRadius: '20px', padding: '0.25rem 0.75rem', fontWeight: 'bold' }}>
                    {env.assetCount}
                  </span>
                </td>
                <td>{env.unit}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ background: 'none', border: 'none', color: '#1565c0', cursor: 'pointer', fontSize: '1.1rem' }}>✏️</button>
                    <button onClick={() => handleDelete(env.id)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal (image16.png) */}
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
            maxWidth: '440px',
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
              Nuevo Ambiente
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label>Nombre del Ambiente *</label>
                <input
                  type="text"
                  placeholder="Ej: Aula 345, Oficina de Administración"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Unidad *</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}>
                  <option value="Seleccione una unidad">Seleccione una unidad</option>
                  <option value="Facultad de Tecnología">Facultad de Tecnología</option>
                  <option value="Rectorado">Rectorado</option>
                  <option value="Facultad de Medicina">Facultad de Medicina</option>
                  <option value="Facultad de Derecho">Facultad de Derecho</option>
                  <option value="Almacén Central">Almacén Central</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#fff', color: '#37474f', border: '1px solid #b0bec5' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#1e88e5', color: '#fff' }}>
                  Guardar Ambiente
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
