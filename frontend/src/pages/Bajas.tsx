import React, { useState } from 'react';
import { QRScannerModal } from '../components/QRScannerModal';

interface Baja {
  id: string;
  date: string;
  description: string;
  code: string;
  unit: string;
  responsible: string;
  reason: string;
  approvedBy: string;
}

export const Bajas: React.FC = () => {
  const [bajas, setBajas] = useState<Baja[]>([
    {
      id: 'BJ001',
      date: '2026-03-15',
      description: 'Impresora HP LaserJet 2015',
      code: 'UMSS-EI-2024-1015',
      unit: 'Fac. Ciencias y Tec. - Oficina Decanato',
      responsible: 'Lic. Roberto Pérez',
      reason: 'Obsolescencia',
      approvedBy: 'Director Administrativo',
    },
    {
      id: 'BJ002',
      date: '2026-02-28',
      description: 'Monitor CRT Samsung 17"',
      code: 'UMSS-EI-2022-0832',
      unit: 'Fac. Humanidades - Lab. Informática',
      responsible: 'Prof. Maria Gutiérrez',
      reason: 'Daño irreparable',
      approvedBy: 'Gerente de TI',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    searchQuery: '',
    date: new Date().toISOString().split('T')[0],
    reason: 'Obsolescencia',
    approvedBy: 'Director Administrativo',
  });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleScanSuccess = async (scannedQr: string) => {
    try {
      const res = await fetch(`http://localhost:3000/activos/qr/${scannedQr}`);
      if (res.ok) {
        const asset = await res.json();
        if (asset.status === 'Dado_De_Baja' || asset.status === 'En_Proceso_Baja') {
          alert('⚠️ Este activo ya ha sido dado de baja o tiene un proceso de baja en curso.');
        } else {
          setFormData(prev => ({
            ...prev,
            searchQuery: `${asset.qrCode} - ${asset.name}`
          }));
        }
      } else {
        alert('⚠️ Código QR de activo no encontrado.');
      }
    } catch (err) {
      alert('⚠️ Error de conexión al buscar el activo.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.searchQuery) return;

    const newBaja: Baja = {
      id: `BJ00${bajas.length + 1}`,
      date: formData.date,
      description: formData.searchQuery,
      code: `UMSS-EI-2026-0${100 + bajas.length}`,
      unit: 'Fac. Ciencias y Tec. - Laboratorio Central',
      responsible: 'Usuario Autenticado',
      reason: formData.reason,
      approvedBy: formData.approvedBy,
    };

    setBajas([newBaja, ...bajas]);
    setFormData({
      searchQuery: '',
      date: new Date().toISOString().split('T')[0],
      reason: 'Obsolescencia',
      approvedBy: 'Director Administrativo',
    });
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="action-bar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#d32f2f' }}>⚠️</span> Bajas de Activos Fijos
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>Registre activos que serán dados de baja del sistema</p>
        </div>
        <button className="btn-primary" onClick={handleOpenModal}>
          <span>+</span> Registrar Nueva Baja
        </button>
      </div>

      {/* Warning Notice Banner */}
      <div className="notice-banner">
        <h4>Importante</h4>
        <p>La baja de un activo es una acción permanente. Asegúrese de que toda la documentación necesaria esté completa antes de proceder.</p>
      </div>

      {/* Compliance Write-offs List */}
      <div className="compliance-list">
        {bajas.map((baja) => (
          <article key={baja.id} className="compliance-card">
            <div className="comp-header">
              <span className="comp-id">
                🗑️ {baja.id}
              </span>
              <span className="comp-date">{baja.date}</span>
            </div>
            
            <p className="comp-description">{baja.code} - {baja.description}</p>
            
            <div className="comp-details-grid">
              <div>
                <span className="comp-field-label">Unidad</span>
                <span className="comp-field-value">{baja.unit}</span>
              </div>
              <div>
                <span className="comp-field-label">Responsable</span>
                <span className="comp-field-value">{baja.responsible}</span>
              </div>
              <div>
                <span className="comp-field-label">Motivo</span>
                <span className="comp-field-value">{baja.reason}</span>
              </div>
            </div>

            <div className="comp-footer">
              Aprobado por: <strong>{baja.approvedBy}</strong>
            </div>
          </article>
        ))}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h3>Registrar Baja de Activo</h3>
              <button type="button" className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Buscar Activo por Código o Descripción *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    name="searchQuery"
                    value={formData.searchQuery}
                    onChange={handleChange}
                    placeholder="Ingrese código (ej: UMSS-COMP-001) o descripción del activo..."
                    style={{ flexGrow: 1 }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsScannerOpen(true)}
                    style={{ padding: '0.5rem 0.75rem', backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem' }}
                    title="Escanear QR"
                  >
                    📷
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de Baja *</label>
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Motivo de Baja *</label>
                  <select name="reason" value={formData.reason} onChange={handleChange}>
                    <option value="Obsolescencia">Obsolescencia</option>
                    <option value="Daño irreparable">Daño irreparable</option>
                    <option value="Extraviado">Extraviado</option>
                    <option value="Robo">Robo / Hurto</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Aprobado Por *</label>
                <select name="approvedBy" value={formData.approvedBy} onChange={handleChange}>
                  <option value="Director Administrativo">Director Administrativo</option>
                  <option value="Gerente de TI">Gerente de TI</option>
                  <option value="Responsable de Activos Fijos">Responsable de Activos Fijos</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
              <button type="submit" className="btn-primary">Registrar Baja</button>
            </div>
          </form>
        </div>
      )}
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  );
};
