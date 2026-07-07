import React, { useState, useEffect } from 'react';
import { QRScannerModal } from '../components/QRScannerModal';

interface Asset {
  id: string;
  qrCode: string;
  name: string;
  status: string;
  location: string;
  updatedAt: string;
  category: string;
  usefulLife: number;
  origin: string;
  purchaseValue: number;
}

export const Activos: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form step management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    qrCode: '',
    name: '', // Mapped to 'Descripción'
    category: 'Sistemas/TI',
    usefulLife: 5,
    status: 'Nuevo',
    origin: 'Compra',
    purchaseDate: new Date().toISOString().split('T')[0],
    entryDate: new Date().toISOString().split('T')[0],
    purchaseValue: 0.0,
    warrantyMonths: 12,
    location: '', // Mapped to default inventory location
    // Step 2 fields
    providerName: '',
    providerNit: '',
    providerPhone: '',
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/activos');
      if (!response.ok) {
        throw new Error('Error al cargar la lista de activos fijos');
      }
      const data = await response.json();
      setAssets(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleOpenModal = () => {
    // Generate a unique QR code on opening modal
    const generatedQr = `UMSS-SCAF-${Date.now().toString().slice(-6)}`;
    setFormData({
      qrCode: generatedQr,
      name: '',
      category: 'Sistemas/TI',
      usefulLife: 5,
      status: 'Nuevo',
      origin: 'Compra',
      purchaseDate: new Date().toISOString().split('T')[0],
      entryDate: new Date().toISOString().split('T')[0],
      purchaseValue: 0.0,
      warrantyMonths: 12,
      location: 'Almacén Central',
      providerName: '',
      providerNit: '',
      providerPhone: '',
    });
    setSubmitError(null);
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleScanSuccess = async (scannedQr: string) => {
    try {
      const res = await fetch(`http://localhost:3000/activos/qr/${scannedQr}`);
      if (res.ok) {
        setSubmitError('⚠️ El código QR ya está registrado en el inventario.');
      } else {
        setFormData(prev => ({ ...prev, qrCode: scannedQr }));
        setSubmitError(null);
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, qrCode: scannedQr }));
      setSubmitError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'usefulLife' || name === 'warrantyMonths' 
        ? value === '' ? undefined : parseInt(value) || undefined
        : name === 'purchaseValue' 
          ? value === '' ? 0.0 : parseFloat(value) || 0.0
          : value,
    });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      setSubmitError('Por favor complete todos los campos requeridos (*)');
      return;
    }
    setSubmitError(null);
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3000/activos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el activo');
      }

      await fetchAssets();
      handleCloseModal();
    } catch (err: any) {
      setSubmitError(err.message || 'Error al conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Nuevo':
        return 'badge-new';
      case 'Asignado':
        return 'badge-assigned';
      case 'Dañado':
        return 'badge-damaged';
      case 'Obsoleto':
        return 'badge-obsolete';
      case 'En_Proceso_Baja':
        return 'badge-in-progress';
      case 'Dado_De_Baja':
        return 'badge-retired';
      default:
        return 'badge-default';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="action-bar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Inventario de Activos Fijos
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
            Gestione y registre los activos fijos de la institución
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenModal}>
          <span>+</span> Registrar Nuevo Activo
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', fontSize: '0.9rem' }}>
          ⚠️ {error}. <button onClick={fetchAssets} style={{ background: 'none', border: 'none', color: '#c62828', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>Reintentar</button>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#78909c' }}>Cargando activos...</div>
      ) : assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #cfd8dc', color: '#78909c' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
          <h3>No hay activos registrados</h3>
          <p style={{ fontSize: '0.9rem' }}>Comience agregando su primer activo fijo haciendo clic en el botón superior.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código QR</th>
                <th>Descripción / Nombre</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Valor ($us)</th>
                <th>Ubicación Actual</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 'bold', color: '#1565c0', fontFamily: 'monospace' }}>
                    {asset.qrCode}
                  </td>
                  <td>{asset.name}</td>
                  <td>{asset.category}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(asset.status)}`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    ${asset.purchaseValue.toFixed(2)}
                  </td>
                  <td>{asset.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Registro Paso a Paso (Figma image3.png & image4) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', width: '90%' }}>
            
            {/* Progress Stepper Visualizer */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '1rem 0 2rem 0', borderBottom: '1px solid #eceff1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep === 1 ? 1 : 0.6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: currentStep === 1 ? '#1e88e5' : '#cfd8dc', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  1
                </span>
                <span style={{ fontWeight: '600', color: currentStep === 1 ? '#1e88e5' : '#78909c' }}>Datos del Activo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep === 2 ? 1 : 0.6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: currentStep === 2 ? '#1e88e5' : '#cfd8dc', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  2
                </span>
                <span style={{ fontWeight: '600', color: currentStep === 2 ? '#1e88e5' : '#78909c' }}>Datos del Proveedor</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#263238' }}>Registrar Nuevo Activo</h3>
              <p style={{ margin: '0.25rem 0 1.5rem 0', color: '#78909c', fontSize: '0.85rem' }}>Complete el formulario para agregar un nuevo activo al sistema</p>
            </div>

            {currentStep === 1 ? (
              /* PASO 1: Datos del Activo */
              <form onSubmit={handleNextStep}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Descripción *</label>
                    <textarea
                      name="name"
                      placeholder="Descripción detallada, marca, modelo, serie"
                      value={formData.name}
                      onChange={handleChange}
                      style={{ width: '100%', minHeight: '60px', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Categoría *</label>
                    <select name="category" value={formData.category} onChange={handleChange} required>
                      <option value="Sistemas/TI">Sistemas/TI</option>
                      <option value="Muebles y Enseres">Muebles y Enseres</option>
                      <option value="Vehículos">Vehículos</option>
                      <option value="Maquinaria">Maquinaria</option>
                      <option value="Equipos de Oficina">Equipos de Oficina</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Vida Útil (años)</label>
                    <input
                      type="number"
                      name="usefulLife"
                      value={formData.usefulLife || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Estado *</label>
                    <select name="status" value={formData.status} onChange={handleChange} required>
                      <option value="Nuevo">Nuevo</option>
                      <option value="Asignado">Asignado</option>
                      <option value="Dañado">Dañado</option>
                      <option value="Obsoleto">Obsoleto</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Origen *</label>
                    <select name="origin" value={formData.origin} onChange={handleChange} required>
                      <option value="Compra">Compra</option>
                      <option value="Donación">Donación</option>
                      <option value="Traspaso">Traspaso</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fecha de Compra *</label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de Ingreso Unidad/Almacén *</label>
                    <input
                      type="date"
                      name="entryDate"
                      value={formData.entryDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor de Adquisición ($us) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="purchaseValue"
                      value={formData.purchaseValue}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tiempo de garantía (meses)</label>
                    <input
                      type="number"
                      name="warrantyMonths"
                      value={formData.warrantyMonths || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Ubicación Física Inicial *</label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Ej: Almacén de Activos Fijos - Planta Baja"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Código QR (Autogenerado o Escaneado)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        name="qrCode"
                        value={formData.qrCode}
                        onChange={handleChange}
                        style={{ backgroundColor: '#f1f8e9', fontWeight: 'bold', flexGrow: 1 }}
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

                </div>

                {submitError && (
                  <div style={{ color: '#d32f2f', fontSize: '0.85rem', marginTop: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                    ⚠️ {submitError}
                  </div>
                )}

                <div className="modal-footer" style={{ marginTop: '2rem' }}>
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Siguiente &gt;
                  </button>
                </div>
              </form>
            ) : (
              /* PASO 2: Datos del Proveedor */
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div className="form-group">
                    <label>Nombre / Razón Social del Proveedor</label>
                    <input
                      type="text"
                      name="providerName"
                      placeholder="Ej: Distribuidora de Computación Bolivia S.R.L."
                      value={formData.providerName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>NIT / Factura</label>
                    <input
                      type="text"
                      name="providerNit"
                      placeholder="Ej: NIT-340192023"
                      value={formData.providerNit}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Teléfono del Proveedor</label>
                    <input
                      type="text"
                      name="providerPhone"
                      placeholder="Ej: +591 4 4123456"
                      value={formData.providerPhone}
                      onChange={handleChange}
                    />
                  </div>

                </div>

                {submitError && (
                  <div style={{ color: '#d32f2f', fontSize: '0.85rem', marginTop: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                    ⚠️ {submitError}
                  </div>
                )}

                <div className="modal-footer" style={{ marginTop: '2rem' }}>
                  <button type="button" className="btn-secondary" onClick={handlePrevStep} disabled={isSubmitting}>
                    &lt; Anterior
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrando...' : 'Confirmar Registro'}
                  </button>
                </div>
              </form>
            )}
          </div>
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
