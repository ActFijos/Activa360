import React, { useState, useEffect } from 'react';

interface AssetStatus {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  assetCount: number;
}

export const ConfiguracionEstados: React.FC = () => {
  const [statuses, setStatuses] = useState<AssetStatus[]>([
    { id: '1', name: 'Disponible', colorName: 'Verde', colorHex: '#2e7d32', assetCount: 145 },
    { id: '2', name: 'En Uso', colorName: 'Azul', colorHex: '#1e88e5', assetCount: 287 },
    { id: '3', name: 'En Mantenimiento', colorName: 'Amarillo', colorHex: '#fbc02d', assetCount: 23 },
    { id: '4', name: 'Dado de Baja', colorName: 'Rojo', colorHex: '#c62828', assetCount: 8 },
    { id: '5', name: 'En Reparación', colorName: 'Naranja', colorHex: '#f57c00', assetCount: 12 },
    { id: '6', name: 'Reservado', colorName: 'Morado', colorHex: '#8e24aa', assetCount: 0 },
    { id: '7', name: 'Extraviado', colorName: 'Rojo', colorHex: '#c62828', assetCount: 3 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<AssetStatus | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState({ name: 'Azul', hex: '#1e88e5' });

  const colors = [
    { name: 'Azul', hex: '#1e88e5' },
    { name: 'Verde', hex: '#2e7d32' },
    { name: 'Amarillo', hex: '#fbc02d' },
    { name: 'Rojo', hex: '#c62828' },
    { name: 'Naranja', hex: '#f57c00' },
    { name: 'Morado', hex: '#8e24aa' },
    { name: 'Gris', hex: '#78909c' },
    { name: 'Rosa', hex: '#ec407a' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('cfg_asset_statuses');
    if (saved) {
      setStatuses(JSON.parse(saved));
    }
  }, []);

  const saveToLocal = (data: AssetStatus[]) => {
    setStatuses(data);
    localStorage.setItem('cfg_asset_statuses', JSON.stringify(data));
  };

  const handleOpenCreateModal = () => {
    setEditingStatus(null);
    setName('');
    setSelectedColor({ name: 'Azul', hex: '#1e88e5' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (status: AssetStatus) => {
    setEditingStatus(status);
    setName(status.name);
    const matchedColor = colors.find(c => c.hex === status.colorHex) || { name: status.colorName, hex: status.colorHex };
    setSelectedColor(matchedColor);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingStatus) {
      // Edit mode
      const updated = statuses.map(s => {
        if (s.id === editingStatus.id) {
          return {
            ...s,
            name,
            colorName: selectedColor.name,
            colorHex: selectedColor.hex,
          };
        }
        return s;
      });
      saveToLocal(updated);
    } else {
      // Create mode
      const newStatus: AssetStatus = {
        id: Date.now().toString(),
        name,
        colorName: selectedColor.name,
        colorHex: selectedColor.hex,
        assetCount: 0
      };
      saveToLocal([...statuses, newStatus]);
    }
    
    setIsModalOpen(false);
    setName('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este estado?')) return;
    saveToLocal(statuses.filter(s => s.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Action Header */}
      <div className="action-bar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏷️ Estado del Activo
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
            Gestión de estados de activos del sistema
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          + Agregar Estado
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Nro. de Activos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.colorHex }}></span>
                    <span>{s.name}</span>
                  </div>
                </td>
                <td>
                  <span className="badge" style={{ backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', borderRadius: '20px', padding: '0.25rem 0.75rem', fontWeight: 'bold' }}>
                    {s.assetCount}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenEditModal(s)} style={{ background: 'none', border: 'none', color: '#1565c0', cursor: 'pointer', fontSize: '1.1rem' }}>✏️</button>
                    <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal (image18.png / image33.png) */}
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
              {editingStatus ? 'Editar Estado' : 'Nuevo Estado'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label>Nombre del Estado *</label>
                <input
                  type="text"
                  placeholder="Ej: Disponible, En Uso, En Mantenimiento"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Color Identificador</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {colors.map(c => {
                    const isSelected = selectedColor.name === c.name;
                    return (
                      <div
                        key={c.name}
                        onClick={() => setSelectedColor(c)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #1e88e5' : '1px solid #cfd8dc',
                          backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.hex }}></span>
                        {c.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vista Previa box */}
              <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '8px', padding: '1rem 1.25rem', fontSize: '0.85rem' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#1565c0' }}>Vista Previa</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#263238' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: selectedColor.hex }}></span>
                  <span>{name || 'Nombre del estado'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#c62828', color: '#fff' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#2e7d32', color: '#fff' }}>
                  {editingStatus ? 'Actualizar' : 'Guardar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
