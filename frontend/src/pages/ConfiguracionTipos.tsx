import React, { useState, useEffect } from 'react';

interface AssetType {
  id: string;
  name: string;
  description: string;
  prefix: string;
  assetCount: number;
}

export const ConfiguracionTipos: React.FC = () => {
  const [types, setTypes] = useState<AssetType[]>([
    { id: '1', name: 'Equipos de Cómputo', description: 'Computadoras, laptops, tablets y equipos informáticos', prefix: 'EQC', assetCount: 156 },
    { id: '2', name: 'Muebles y Enseres', description: 'Escritorios, sillas, estanterías y mobiliario', prefix: 'MUE', assetCount: 243 },
    { id: '3', name: 'Vehículos', description: 'Automóviles, motocicletas y vehículos institucionales', prefix: 'VEH', assetCount: 12 },
    { id: '4', name: 'Equipos de Laboratorio', description: 'Microscopios, centrífugas, equipos científicos', prefix: 'LAB', assetCount: 87 },
    { id: '5', name: 'Equipos Audiovisuales', description: 'Proyectores, pantallas, equipos de sonido', prefix: 'AUD', assetCount: 45 },
    { id: '6', name: 'Herramientas', description: 'Herramientas manuales y eléctricas', prefix: 'HER', assetCount: 0 },
    { id: '7', name: 'Equipos Médicos', description: 'Equipamiento médico y de salud', prefix: 'MED', assetCount: 32 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('cfg_asset_types');
    if (saved) {
      setTypes(JSON.parse(saved));
    }
  }, []);

  const saveToLocal = (data: AssetType[]) => {
    setTypes(data);
    localStorage.setItem('cfg_asset_types', JSON.stringify(data));
  };

  const handleOpenCreateModal = () => {
    setEditingType(null);
    setName('');
    setPrefix('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (type: AssetType) => {
    setEditingType(type);
    setName(type.name);
    setPrefix(type.prefix);
    setDescription(type.description);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !prefix) return;

    if (editingType) {
      // Edit mode
      const updated = types.map(t => {
        if (t.id === editingType.id) {
          return {
            ...t,
            name,
            prefix: prefix.toUpperCase().substring(0, 3),
            description,
          };
        }
        return t;
      });
      saveToLocal(updated);
    } else {
      // Create mode
      const newType: AssetType = {
        id: Date.now().toString(),
        name,
        description,
        prefix: prefix.toUpperCase().substring(0, 3),
        assetCount: 0
      };
      saveToLocal([...types, newType]);
    }
    
    setIsModalOpen(false);
    setName('');
    setPrefix('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este tipo de activo?')) return;
    saveToLocal(types.filter(t => t.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Action Header */}
      <div className="action-bar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📋 Tipos de Activos
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
            Gestión de tipos y categorías de activos
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          + Agregar Tipo
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo de Activo</th>
              <th>Descripción</th>
              <th>Prefijo</th>
              <th>Nro. de Activos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {types.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600' }}>
                    <span style={{ fontSize: '1.3rem' }}>📦</span>
                    <span style={{ color: '#263238' }}>{t.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem', color: '#546e7a', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.description}
                </td>
                <td style={{ fontWeight: 'bold', color: '#78909c', fontFamily: 'monospace' }}>{t.prefix}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', borderRadius: '20px', padding: '0.25rem 0.75rem', fontWeight: 'bold' }}>
                    {t.assetCount}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenEditModal(t)} style={{ background: 'none', border: 'none', color: '#1565c0', cursor: 'pointer', fontSize: '1.1rem' }}>✏️</button>
                    <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal (image20.png / image31.png) */}
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
              {editingType ? 'Editar Tipo de Activo' : 'Nuevo Tipo de Activo'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label>Nombre del Tipo *</label>
                <input
                  type="text"
                  placeholder="Ej: Equipos de Cómputo, Muebles y Enseres"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Prefijo (Código) *</label>
                <input
                  type="text"
                  placeholder="Ej: EQC, MUE, VEH"
                  value={prefix}
                  maxLength={3}
                  onChange={(e) => setPrefix(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#78909c', marginTop: '0.25rem', display: 'block' }}>
                  Máximo 3 caracteres. Se usará en los códigos de activos.
                </span>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  placeholder="Descripción del tipo de activo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>

              {/* Vista Previa box */}
              <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '8px', padding: '1.25rem', fontSize: '0.85rem' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#1565c0' }}>Vista Previa</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📦</span>
                  <div>
                    <strong style={{ display: 'block', color: '#263238' }}>{name || 'Nombre del tipo'}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#78909c' }}>{description || 'Descripción del tipo de activo'}</span>
                    {prefix && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c', marginTop: '0.25rem' }}>
                        Código de ejemplo: <strong>{prefix.toUpperCase()}-2024-001</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#c62828', color: '#fff' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#2e7d32', color: '#fff' }}>
                  {editingType ? 'Actualizar' : 'Guardar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
