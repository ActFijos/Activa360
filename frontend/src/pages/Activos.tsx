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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validLocations, setValidLocations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(asset =>
    asset.qrCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Inspection states
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectTargetAsset, setInspectTargetAsset] = useState<Asset | null>(null);
  const [inspectFormData, setInspectFormData] = useState({
    diagnosis: '',
    estimatedCost: 0,
    action: 'Reparar',
  });
  const [inspectErrors, setInspectErrors] = useState<Record<string, string>>({});
  const [inspectSubmitError, setInspectSubmitError] = useState<string | null>(null);
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);

  const handleOpenInspectModal = (asset: Asset) => {
    setInspectTargetAsset(asset);
    setInspectFormData({
      diagnosis: '',
      estimatedCost: 0.0,
      action: 'Reparar',
    });
    setInspectErrors({});
    setInspectSubmitError(null);
    setIsInspectModalOpen(true);
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInspectSubmitError(null);

    const errors: Record<string, string> = {};
    if (inspectFormData.diagnosis.length < 10) {
      errors.diagnosis = 'El diagnóstico debe tener al menos 10 caracteres explicativos.';
    }
    if (inspectFormData.estimatedCost < 0) {
      errors.estimatedCost = 'El costo estimado de reparación no puede ser negativo.';
    }

    if (Object.keys(errors).length > 0) {
      setInspectErrors(errors);
      return;
    }

    setIsSubmittingInspection(true);
    try {
      const response = await fetch(`http://localhost:3000/activos/${inspectTargetAsset?.id}/inspeccionar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspectFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la inspección');
      }

      await fetchAssets();
      setIsInspectModalOpen(false);
    } catch (err: any) {
      setInspectSubmitError(err.message || 'Error al conectar con el servidor');
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('cfg_environments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const names = parsed.map((env: any) => `${env.name} - ${env.unit}`);
        setValidLocations(names);
      } catch (e) {
        // fallback
      }
    } else {
      setValidLocations([
        'Almacén Central',
        'Aula 345 - Facultad de Tecnología',
        'Oficina de Administración - Rectorado',
        'Laboratorio de Química - Facultad de Medicina',
        'Sala de Conferencias A - Facultad de Tecnología',
        'Biblioteca Principal - Rectorado',
        'Aula Magna - Facultad de Derecho',
        'Almacén General - Almacén Central',
        'Sala de Profesores - Facultad de Tecnología',
      ]);
    }
  }, []);

  const validateField = (name: string, value: any, currentFormData = formData) => {
    let errorMsg = '';
    const nowStr = new Date().toISOString().split('T')[0];

    switch (name) {
      case 'qrCode':
        if (!value) {
          errorMsg = 'El código QR es requerido.';
        } else if (!/^(ACT|QR)-[a-zA-Z0-9-]+$/.test(value)) {
          errorMsg = 'El código QR debe comenzar con "ACT-" o "QR-" seguido de letras, números o guiones.';
        }
        break;
      case 'name':
        if (!value || value.trim() === '') {
          errorMsg = 'La descripción es requerida.';
        }
        break;
      case 'location':
        if (!value || value.trim() === '') {
          errorMsg = 'La ubicación física es requerida.';
        } else if (validLocations.length > 0 && !validLocations.includes(value)) {
          errorMsg = 'La ubicación seleccionada no es una unidad/ambiente registrado.';
        }
        break;
      case 'status':
        if (value === 'Dañado' || value === 'Obsoleto' || value === 'Dado_De_Baja' || value === 'En_Proceso_Baja') {
          errorMsg = 'No se permite registrar un activo directamente en estado Dañado o Dado de Baja.';
        }
        break;
      case 'usefulLife':
        if (value !== undefined && value !== null && value < 1) {
          errorMsg = 'La vida útil debe ser al menos de 1 año.';
        }
        break;
      case 'purchaseValue':
        if (value === undefined || value === null || value <= 0) {
          errorMsg = 'El valor de adquisición debe ser mayor a 0.';
        }
        break;
      case 'purchaseDate':
        if (!value) {
          errorMsg = 'La fecha de compra es requerida.';
        } else if (value > nowStr) {
          errorMsg = 'La fecha de compra no puede ser una fecha futura.';
        }
        break;
      case 'entryDate':
        if (!value) {
          errorMsg = 'La fecha de ingreso es requerida.';
        } else if (value > nowStr) {
          errorMsg = 'La fecha de ingreso no puede ser una fecha futura.';
        } else if (currentFormData.purchaseDate && value < currentFormData.purchaseDate) {
          errorMsg = 'La fecha de ingreso no puede ser anterior a la de compra.';
        }
        break;
      default:
        break;
    }

    setFormErrors(prev => {
      const nextErrors = { ...prev };
      if (errorMsg) {
        nextErrors[name] = errorMsg;
      } else {
        delete nextErrors[name];
      }
      return nextErrors;
    });
  };

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
    // Generate a unique QR code on opening modal with compliant prefix
    const generatedQr = `ACT-2026-${Date.now().toString().slice(-6)}`;
    setFormData({
      qrCode: generatedQr,
      name: '',
      category: 'Sistemas/TI',
      usefulLife: 5,
      status: 'Nuevo',
      origin: 'Compra',
      purchaseDate: new Date().toISOString().split('T')[0],
      entryDate: new Date().toISOString().split('T')[0],
      purchaseValue: 10.0, // Start with a positive default
      warrantyMonths: 12,
      location: 'Almacén Central',
      providerName: '',
      providerNit: '',
      providerPhone: '',
    });
    setSubmitError(null);
    setFormErrors({});
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
  };

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
    
    let parsedValue: any = value;
    if (name === 'usefulLife' || name === 'warrantyMonths') {
      parsedValue = value === '' ? undefined : parseInt(value) || undefined;
    } else if (name === 'purchaseValue') {
      parsedValue = value === '' ? 0.0 : parseFloat(value) || 0.0;
    }

    const updatedFormData = {
      ...formData,
      [name]: parsedValue,
    };

    setFormData(updatedFormData);
    validateField(name, parsedValue, updatedFormData);

    // If purchaseDate changes, re-validate entryDate as it depends on it
    if (name === 'purchaseDate') {
      validateField('entryDate', updatedFormData.entryDate, updatedFormData);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger validation for all step 1 fields
    const fieldsToValidate = ['name', 'location', 'qrCode', 'usefulLife', 'purchaseValue', 'purchaseDate', 'entryDate'];
    let hasErrors = false;
    const nowStr = new Date().toISOString().split('T')[0];

    fieldsToValidate.forEach(field => {
      const value = (formData as any)[field];
      validateField(field, value, formData);

      // Manual check to block step since state updates are async
      if (field === 'qrCode' && (!value || !/^(ACT|QR)-[a-zA-Z0-9-]+$/.test(value))) {
        hasErrors = true;
      } else if (field === 'name' && (!value || value.trim() === '')) {
        hasErrors = true;
      } else if (field === 'location' && (!value || value.trim() === '')) {
        hasErrors = true;
      } else if (field === 'usefulLife' && value !== undefined && value !== null && value < 1) {
        hasErrors = true;
      } else if (field === 'purchaseValue' && (value === undefined || value === null || value <= 0)) {
        hasErrors = true;
      } else if (field === 'purchaseDate' && (!value || value > nowStr)) {
        hasErrors = true;
      } else if (field === 'entryDate' && (!value || value > nowStr || (formData.purchaseDate && value < formData.purchaseDate))) {
        hasErrors = true;
      }
    });

    if (hasErrors || Object.keys(formErrors).length > 0) {
      setSubmitError('Por favor corrija los errores en el formulario antes de continuar.');
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

      {/* Buscador de activos */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #cfd8dc' }}>
        <span style={{ fontSize: '1.2rem' }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar activo por código QR o descripción..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
        />
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Código QR</th>
                <th>Descripción / Nombre</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Valor ($us)</th>
                <th>Ubicación Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
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
                  <td>
                    {(asset.status === 'Nuevo' || asset.status === 'Asignado') && (
                      <button
                        onClick={() => handleOpenInspectModal(asset)}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#e0f7fa', border: '1px solid #00acc1', color: '#006064', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🔧 Inspección
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                      style={{ width: '100%', minHeight: '60px', padding: '0.75rem', border: formErrors.name ? '1px solid #d32f2f' : '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
                      required
                    />
                    {formErrors.name && (
                      <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.name}</span>
                    )}
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
                      style={{ borderColor: formErrors.usefulLife ? '#d32f2f' : undefined }}
                    />
                    {formErrors.usefulLife && (
                      <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.usefulLife}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Estado *</label>
                    <select name="status" value={formData.status} onChange={handleChange} required>
                      <option value="Nuevo">Nuevo</option>
                      <option value="Asignado">Asignado</option>
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
                      style={{ borderColor: formErrors.purchaseDate ? '#d32f2f' : undefined }}
                      required
                    />
                    {formErrors.purchaseDate && (
                      <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.purchaseDate}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Fecha de Ingreso Unidad/Almacén *</label>
                    <input
                      type="date"
                      name="entryDate"
                      value={formData.entryDate}
                      onChange={handleChange}
                      style={{ borderColor: formErrors.entryDate ? '#d32f2f' : undefined }}
                      required
                    />
                    {formErrors.entryDate && (
                      <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.entryDate}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Valor de Adquisición ($us) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="purchaseValue"
                      value={formData.purchaseValue}
                      onChange={handleChange}
                      style={{ borderColor: formErrors.purchaseValue ? '#d32f2f' : undefined }}
                      required
                    />
                    {formErrors.purchaseValue && (
                      <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.purchaseValue}</span>
                    )}
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
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', border: formErrors.location ? '1px solid #d32f2f' : '1px solid #cfd8dc', borderRadius: '6px', fontSize: '0.9rem' }}
                      required
                    >
                      <option value="">Seleccione un ambiente registrado...</option>
                      {validLocations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    {formErrors.location && (
                      <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.location}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Código QR (Autogenerado o Escaneado)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        name="qrCode"
                        value={formData.qrCode}
                        onChange={handleChange}
                        style={{ backgroundColor: '#f1f8e9', fontWeight: 'bold', flexGrow: 1, borderColor: formErrors.qrCode ? '#d32f2f' : undefined }}
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
                    {formErrors.qrCode && (
                      <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.qrCode}</span>
                    )}
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

      {isInspectModalOpen && inspectTargetAsset && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleInspectSubmit} style={{ maxWidth: '550px', width: '90%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #eceff1', paddingBottom: '1rem' }}>
              <h3>Registrar Inspección Técnica</h3>
              <button type="button" className="close-btn" onClick={() => setIsInspectModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#e0f7fa', borderRadius: '6px', fontSize: '0.85rem' }}>
                <strong>Activo a inspeccionar:</strong> {inspectTargetAsset.qrCode} - {inspectTargetAsset.name}
              </div>

              <div className="form-group">
                <label>Diagnóstico Técnico *</label>
                <textarea
                  placeholder="Detalle el estado del equipo y fallas encontradas..."
                  value={inspectFormData.diagnosis}
                  onChange={(e) => {
                    setInspectFormData(prev => ({ ...prev, diagnosis: e.target.value }));
                    if (e.target.value.length >= 10) {
                      setInspectErrors(prev => { const next = { ...prev }; delete next.diagnosis; return next; });
                    }
                  }}
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: inspectErrors.diagnosis ? '1px solid #d32f2f' : '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
                  required
                />
                {inspectErrors.diagnosis && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{inspectErrors.diagnosis}</span>
                )}
              </div>

              <div className="form-group">
                <label>Costo Estimado de Reparación ($us) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={inspectFormData.estimatedCost}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setInspectFormData(prev => ({ ...prev, estimatedCost: val }));
                    if (val >= 0) {
                      setInspectErrors(prev => { const next = { ...prev }; delete next.estimatedCost; return next; });
                    }
                  }}
                  style={{ borderColor: inspectErrors.estimatedCost ? '#d32f2f' : undefined }}
                  required
                />
                {inspectErrors.estimatedCost && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{inspectErrors.estimatedCost}</span>
                )}
              </div>

              <div className="form-group">
                <label>Decisión / Acción Sugerida *</label>
                <select
                  value={inspectFormData.action}
                  onChange={(e) => setInspectFormData(prev => ({ ...prev, action: e.target.value }))}
                  required
                >
                  <option value="Reparar">Reparar (El activo sigue operativo/asignado)</option>
                  <option value="Recomendar_Baja">Recomendar Baja (El activo está obsoleto o irreparable)</option>
                </select>
              </div>
            </div>

            {inspectSubmitError && (
              <div style={{ color: '#d32f2f', fontSize: '0.85rem', marginTop: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                ⚠️ {inspectSubmitError}
              </div>
            )}

            <div className="modal-footer" style={{ borderTop: '1px solid #eceff1', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsInspectModalOpen(false)} disabled={isSubmittingInspection}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={isSubmittingInspection}>
                {isSubmittingInspection ? 'Registrando...' : 'Registrar Inspección'}
              </button>
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
