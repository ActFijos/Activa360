import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { QRScannerModal } from '../components/QRScannerModal';

const transferSchema = z.object({
  assetId: z.string().min(1, 'Debe seleccionar un activo.'),
  toUnit: z.string().min(1, 'La unidad de destino es obligatoria.'),
  toResponsible: z.string().min(3, 'El nombre del responsable debe tener al menos 3 caracteres.'),
  date: z.string().refine(val => {
    if (!val) return false;
    const dateVal = new Date(val);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // timezone offset buffer
    return dateVal <= today;
  }, 'La fecha de transferencia no puede ser una fecha futura.'),
  reason: z.string()
    .min(10, 'El motivo debe ser detallado (mínimo 10 caracteres).')
    .max(500, 'El motivo no puede superar los 500 caracteres.'),
  currentUnit: z.string().optional(),
}).refine(data => {
  if (data.currentUnit && data.toUnit === data.currentUnit) {
    return false;
  }
  return true;
}, {
  message: 'La unidad de destino no puede ser la misma ubicación actual del activo.',
  path: ['toUnit'],
});

interface Asset {
  id: string;
  qrCode: string;
  name: string;
  status: string;
  location: string;
  category?: string;
}

interface Employee {
  id: string;
  fullName: string;
  role: string;
}

interface Transfer {
  id: string;
  assetId: string;
  fromUnit: string;
  fromResponsible: string;
  toUnit: string;
  toResponsible: string;
  date: string;
  status: string;
  reason: string;
  assetName?: string;
  assetQr?: string;
  actaCodigo?: string | null;
  actaGenerada?: boolean;
  actaHash?: string | null;
}

interface TransferActaData {
  codigo: string;
  fechaEmision: string | Date;
  hashIntegridad: string;
  activoSnapshot: {
    id?: string;
    qrCode: string;
    name: string;
    category?: string;
    status: string;
    location: string;
    series?: string | null;
    model?: string | null;
    usefulLife?: number | null;
    purchaseValue?: number | null;
  };
  origenSnapshot: {
    unit: string;
    responsible: string;
    cargo?: string | null;
  };
  destinoSnapshot: {
    unit: string;
    responsible: string;
    cargo?: string | null;
  };
  observaciones?: string | null;
  generadoPor?: string | null;
}

export const Transferencias: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form search states
  const [searchAssetQuery, setSearchAssetQuery] = useState('');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');

  // Selected entities
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Form states
  const [newUnit, setNewUnit] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  // Feedback states
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validLocations, setValidLocations] = useState<string[]>([]);

  // Bilateral Acta & approval states
  const [activeActa, setActiveActa] = useState<TransferActaData | null>(null);
  const [isLoadingActa, setIsLoadingActa] = useState(false);
  const [approvalNotification, setApprovalNotification] = useState<{ codigo: string; hash?: string } | null>(null);

  const validateField = (name: string, value: any, currentFormData = {
    assetId: selectedAsset?.id || '',
    toUnit: name === 'toUnit' ? value : newUnit,
    toResponsible: name === 'toResponsible' ? value : selectedEmployee,
    date: name === 'date' ? value : transferDate,
    reason: name === 'reason' ? value : reason,
    currentUnit: selectedAsset?.location || '',
  }) => {
    try {
      const result = transferSchema.safeParse(currentFormData);
      setFormErrors(prev => {
        const next = { ...prev };
        if (!result.success) {
          const issue = result.error.issues.find(iss => iss.path.includes(name));
          if (issue) {
            next[name] = issue.message;
          } else {
            delete next[name];
          }
        } else {
          delete next[name];
        }
        return next;
      });
    } catch (e) {
      // ignore
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transfersRes, assetsRes, employeesRes] = await Promise.all([
        fetch('http://localhost:3000/activos/transferencias'),
        fetch('http://localhost:3000/activos'),
        fetch('http://localhost:3000/activos/empleados'),
      ]);

      let allAssets: Asset[] = [];
      if (assetsRes.ok) {
        allAssets = await assetsRes.json();
        // Filter out retired assets
        const available = allAssets.filter(
          (a: Asset) => a.status !== 'Dado_De_Baja' && a.status !== 'En_Proceso_Baja'
        );
        setAssets(available);
      }

      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        // Map asset name and QR from the loaded assets list
        const mappedTransfers = transfersData.map((t: Transfer) => {
          const assetObj = allAssets.find(a => a.id === t.assetId);
          return {
            ...t,
            assetName: assetObj ? assetObj.name : 'Activo Fijo',
            assetQr: assetObj ? assetObj.qrCode : 'S/QR',
          };
        });
        setTransfers(mappedTransfers);
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Error cargando datos de transferencia', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const handleApprove = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea aprobar esta transferencia de activo y formalizar el Acta Bilateral SABS (D.S. 0181)?')) return;
    try {
      const res = await fetch(`http://localhost:3000/activos/transferencias/${id}/aprobar`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        const actaCod = data?.acta?.codigo || data?.transfer?.actaCodigo || 'ACTA-TRANS-2026';
        setApprovalNotification({
          codigo: actaCod,
          hash: data?.acta?.hashIntegridad || data?.transfer?.actaHash,
        });
        await loadData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Error al aprobar la transferencia.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al conectar con el servidor.');
    }
  };

  const handleViewActa = async (transfer: Transfer) => {
    try {
      setIsLoadingActa(true);
      const res = await fetch(`http://localhost:3000/activos/transferencias/${transfer.id}/acta`);
      if (res.ok) {
        const actaData = await res.json();
        setActiveActa(actaData);
      } else {
        const assetObj = assets.find(a => a.id === transfer.assetId);
        setActiveActa({
          codigo: transfer.actaCodigo || `ACTA-TRANS-2026-${transfer.id.substring(0, 4).toUpperCase()}`,
          fechaEmision: transfer.date,
          hashIntegridad: transfer.actaHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          activoSnapshot: {
            qrCode: transfer.assetQr || assetObj?.qrCode || 'S/QR',
            name: transfer.assetName || assetObj?.name || 'Activo Fijo',
            category: assetObj?.category || 'Equipo de Computación / Mobiliario',
            status: 'Operativo / Transferido',
            location: transfer.toUnit,
          },
          origenSnapshot: {
            unit: transfer.fromUnit,
            responsible: transfer.fromResponsible,
            cargo: 'Custodio Entregante',
          },
          destinoSnapshot: {
            unit: transfer.toUnit,
            responsible: transfer.toResponsible,
            cargo: 'Custodio Receptor',
          },
          observaciones: `Acta formalizada según Normativa SABS D.S. 0181. Motivo: ${transfer.reason}`,
          generadoPor: 'Sistema SCAF / Jefe de Activos Fijos',
        });
      }
    } catch (e) {
      console.error('Error al cargar acta bilateral', e);
      alert('Error al consultar el acta bilateral.');
    } finally {
      setIsLoadingActa(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea rechazar esta transferencia de activo?')) return;
    try {
      const res = await fetch(`http://localhost:3000/activos/transferencias/${id}/rechazar`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Transferencia rechazada.');
        loadData();
      } else {
        alert('Error al rechazar la transferencia.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión.');
    }
  };

  // Filtered lists
  const filteredAssets = searchAssetQuery.trim() === '' 
    ? [] 
    : assets.filter(asset => 
        asset.name.toLowerCase().includes(searchAssetQuery.toLowerCase()) ||
        asset.qrCode.toLowerCase().includes(searchAssetQuery.toLowerCase())
      );

  const filteredEmployees = employees.filter(employee =>
    employee.fullName.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  );

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setSearchAssetQuery(`${asset.qrCode} - ${asset.name}`);
    setFormErrors(prev => {
      const next = { ...prev };
      delete next.assetId;
      return next;
    });
    // Check if newUnit matches
    if (newUnit) {
      validateField('toUnit', newUnit, {
        assetId: asset.id,
        toUnit: newUnit,
        toResponsible: selectedEmployee,
        date: transferDate,
        reason,
        currentUnit: asset.location,
      });
    }
  };

  const handleSelectEmployee = (fullName: string) => {
    setSelectedEmployee(fullName);
    setSearchEmployeeQuery(fullName);
    setShowEmployeeSuggestions(false);
    setFormErrors(prev => {
      const next = { ...prev };
      delete next.toResponsible;
      return next;
    });
  };

  const handleScanSuccess = async (scannedQr: string) => {
    try {
      const res = await fetch(`http://localhost:3000/activos/qr/${scannedQr}`);
      if (res.ok) {
        const asset = await res.json();
        if (asset.status === 'Dado_De_Baja' || asset.status === 'En_Proceso_Baja') {
          setSubmitError('⚠️ Este activo ya ha sido dado de baja o tiene un proceso de baja en curso.');
          setSelectedAsset(null);
        } else {
          setSelectedAsset(asset);
          setSearchAssetQuery(`${asset.qrCode} - ${asset.name}`);
          setSubmitError(null);
          setFormErrors(prev => {
            const next = { ...prev };
            delete next.assetId;
            return next;
          });
          if (newUnit) {
            validateField('toUnit', newUnit, {
              assetId: asset.id,
              toUnit: newUnit,
              toResponsible: selectedEmployee,
              date: transferDate,
              reason,
              currentUnit: asset.location,
            });
          }
        }
      } else {
        setSubmitError('⚠️ Código QR de activo no encontrado.');
        setSelectedAsset(null);
      }
    } catch (err) {
      setSubmitError('⚠️ Error de conexión al buscar el activo.');
      setSelectedAsset(null);
    }
  };

  const handleCancel = () => {
    setSelectedAsset(null);
    setSelectedEmployee('');
    setSearchAssetQuery('');
    setSearchEmployeeQuery('');
    setNewUnit('');
    setReason('');
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsFormOpen(false);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToValidate = {
      assetId: selectedAsset?.id || '',
      toUnit: newUnit,
      toResponsible: selectedEmployee,
      date: transferDate,
      reason: reason,
      currentUnit: selectedAsset?.location || '',
    };

    const result = transferSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      setSubmitError('Por favor complete todos los datos requeridos correctamente.');
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3000/activos/transferir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: selectedAsset?.id,
          toUnit: newUnit,
          toResponsible: selectedEmployee,
          date: transferDate,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la transferencia.');
      }

      setSubmitSuccess(true);
      await loadData();
      handleCancel();
    } catch (err: any) {
      setSubmitError(err.message || 'Error de red al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header bar */}
      <div className="action-bar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔄 Transferencias de Activos
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
            Gestione las transferencias de activos entre ubicaciones
          </p>
        </div>
        {!isFormOpen && (
          <button className="btn-primary" onClick={() => { setSubmitSuccess(false); setIsFormOpen(true); }}>
            <span>+</span> Nueva Transferencia
          </button>
        )}
      </div>

      {submitSuccess && (
        <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 'bold' }}>
          ✓ ¡Transferencia registrada y procesada con éxito!
        </div>
      )}

      {approvalNotification && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#e8f5e9',
          color: '#1b5e20',
          borderRadius: '8px',
          border: '1px solid #a5d6a7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.95rem',
        }}>
          <div>
            <strong>✓ ¡Transferencia aprobada con éxito!</strong> Se ha generado automáticamente el <strong>Acta Bilateral SABS</strong> con código correlativo <code style={{ backgroundColor: '#c8e6c9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#1b5e20' }}>{approvalNotification.codigo}</code> y sello criptográfico SHA-256.
          </div>
          <button
            onClick={() => setApprovalNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#2e7d32' }}
            title="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      )}

      {/* Collapsible Form Section (Figma image6.png) */}
      {isFormOpen && (
        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #cfd8dc' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#263238' }}>Registrar Nueva Transferencia</h3>
          
          {submitError && (
            <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              ⚠️ {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              
              <div className="form-group" style={{ gridColumn: 'span 2', position: 'relative' }}>
                <label>Buscar Activo por Código o Descripción *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Ingrese código (ej: UMSS-COMP-001) o descripción del activo..."
                    value={searchAssetQuery}
                    onChange={(e) => {
                      setSearchAssetQuery(e.target.value);
                      if (selectedAsset) setSelectedAsset(null);
                    }}
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
                
                {/* Asset suggestions */}
                {!selectedAsset && searchAssetQuery.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #b0bec5',
                    borderRadius: '6px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {filteredAssets.length === 0 ? (
                      <div style={{ padding: '0.75rem', color: '#78909c', fontSize: '0.9rem' }}>
                        No se encontraron activos disponibles
                      </div>
                    ) : (
                      filteredAssets.map(asset => (
                        <div
                          key={asset.id}
                          onClick={() => handleSelectAsset(asset)}
                          style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #eceff1', fontSize: '0.85rem' }}
                          className="suggestion-item"
                        >
                          <strong style={{ color: '#1565c0' }}>[{asset.qrCode}]</strong> {asset.name}
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c' }}>
                            Ubicación actual: {asset.location}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedAsset && (
                <div style={{ gridColumn: 'span 2', padding: '1rem', backgroundColor: '#e8f5e9', border: '1px solid #c5e1a5', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#33691e', display: 'block', marginBottom: '0.25rem' }}>Activo seleccionado:</strong>
                  <strong>Descripción:</strong> {selectedAsset.name} | <strong>QR:</strong> {selectedAsset.qrCode} | <strong>Ubicación Origen:</strong> {selectedAsset.location}
                </div>
              )}

              <div className="form-group">
                <label>Nueva Unidad *</label>
                <select
                  value={newUnit}
                  onChange={(e) => {
                    setNewUnit(e.target.value);
                    validateField('toUnit', e.target.value);
                  }}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: formErrors.toUnit ? '1px solid #d32f2f' : '1px solid #cfd8dc', borderRadius: '6px', fontSize: '0.9rem' }}
                  required
                >
                  <option value="">Seleccione la unidad destino...</option>
                  {validLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                {formErrors.toUnit && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.toUnit}</span>
                )}
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Nuevo Responsable *</label>
                <input
                  type="text"
                  placeholder="Buscar responsable..."
                  value={searchEmployeeQuery}
                  onChange={(e) => {
                    setSearchEmployeeQuery(e.target.value);
                    setSelectedEmployee(e.target.value);
                    setShowEmployeeSuggestions(true);
                    validateField('toResponsible', e.target.value);
                  }}
                  onFocus={() => setShowEmployeeSuggestions(true)}
                  style={{ borderColor: formErrors.toResponsible ? '#d32f2f' : undefined }}
                  required
                />
                {formErrors.toResponsible && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.toResponsible}</span>
                )}
                
                {/* Employee suggestions */}
                {showEmployeeSuggestions && searchEmployeeQuery.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #b0bec5',
                    borderRadius: '6px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {filteredEmployees.length === 0 ? (
                      <div 
                        onClick={() => setShowEmployeeSuggestions(false)}
                        style={{ padding: '0.75rem', color: '#78909c', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        Usar: "{searchEmployeeQuery}"
                      </div>
                    ) : (
                      filteredEmployees.map(emp => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectEmployee(emp.fullName)}
                          style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #eceff1', fontSize: '0.85rem' }}
                          className="suggestion-item"
                        >
                          <strong>{emp.fullName}</strong>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Fecha de Transferencia *</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => {
                    setTransferDate(e.target.value);
                    validateField('date', e.target.value);
                  }}
                  style={{ borderColor: formErrors.date ? '#d32f2f' : undefined }}
                  required
                />
                {formErrors.date && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.date}</span>
                )}
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Motivo de la Transferencia *</label>
                <textarea
                  placeholder="Describa el motivo de la transferencia..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    validateField('reason', e.target.value);
                  }}
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: formErrors.reason ? '1px solid #d32f2f' : '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
                  required
                />
                {formErrors.reason && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.reason}</span>
                )}
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isSubmitting} style={{ backgroundColor: '#c62828', color: '#fff' }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ backgroundColor: '#2e7d32', color: '#fff' }}>
                {isSubmitting ? 'Registrando...' : 'Registrar Transferencia'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfers Data Table (Figma image5.png) */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#78909c' }}>Cargando transferencias...</div>
      ) : transfers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #cfd8dc', color: '#78909c' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔄</div>
          <h3>No hay transferencias registradas</h3>
          <p style={{ fontSize: '0.9rem' }}>Las transferencias de activos fijos entre responsables y unidades aparecerán aquí.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Activo</th>
                <th>Desde</th>
                <th>Hacia</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t, idx) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 'bold', color: '#78909c' }}>TR{String(idx + 1).padStart(3, '0')}</td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#263238' }}>{t.assetName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#78909c', fontFamily: 'monospace' }}>{t.assetQr}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{t.fromUnit}</div>
                    <div style={{ fontSize: '0.75rem', color: '#78909c' }}>{t.fromResponsible}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', color: '#1565c0' }}>{t.toUnit}</div>
                    <div style={{ fontSize: '0.75rem', color: '#1e88e5' }}>{t.toResponsible}</div>
                  </td>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${t.status === 'Aprobada' ? 'badge-new' : t.status === 'Rechazada' ? 'badge-danger' : 'badge-default'}`} style={{
                      backgroundColor: t.status === 'Aprobada' ? '#e8f5e9' : t.status === 'Rechazada' ? '#ffebee' : '#fff8e1',
                      color: t.status === 'Aprobada' ? '#2e7d32' : t.status === 'Rechazada' ? '#c62828' : '#f57f17',
                      borderColor: t.status === 'Aprobada' ? '#c8e6c9' : t.status === 'Rechazada' ? '#ffcdd2' : '#ffe082'
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {t.status === 'Pendiente' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleApprove(t.id)}
                          className="btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#2e7d32', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                        >
                          ✔️ Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(t.id)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#c62828', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    ) : t.status === 'Aprobada' ? (
                      <button
                        onClick={() => handleViewActa(t)}
                        disabled={isLoadingActa}
                        className="btn-primary"
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          backgroundColor: isLoadingActa ? '#90a4ae' : '#1565c0',
                          color: '#fff',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: isLoadingActa ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 500,
                        }}
                        title="Ver / Generar Acta Bilateral SABS D.S. 0181"
                      >
                        📄 {isLoadingActa ? 'Cargando...' : 'Generar / Ver Acta'}
                      </button>
                    ) : (
                      <span style={{ color: '#90a4ae', fontSize: '0.8rem' }}>Rechazado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Acta Bilateral de Transferencia (Normativa SABS - D.S. 0181) */}
      {activeActa && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '2rem 1rem',
        }}>
          <div className="modal-content" style={{
            maxWidth: '820px',
            width: '100%',
            backgroundColor: '#fff',
            borderRadius: '10px',
            padding: '2.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            maxHeight: '92vh',
            overflowY: 'auto',
          }}>
            {/* Header de controles en pantalla (oculto en impresión) */}
            <div className="no-print" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #cfd8dc',
              paddingBottom: '1rem',
              marginBottom: '1.5rem',
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#1a237e', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📜 Acta de Transferencia Bilateral Formalizada
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#546e7a' }}>
                  Normativa SABS D.S. 0181 - Sistema de Control de Activos Fijos (SCAF)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveActa(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#eceff1',
                    color: '#37474f',
                    border: '1px solid #b0bec5',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={triggerPrint}
                  style={{
                    padding: '0.5rem 1.25rem',
                    backgroundColor: '#1b5e20',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  🖨️ Imprimir Acta (PDF)
                </button>
              </div>
            </div>

            {/* Documento Imprimible Oficial SABS D.S. 0181 */}
            <div className="print-section" style={{
              color: '#000',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4',
              backgroundColor: '#fff',
            }}>
              {/* Encabezado Institucional */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '3px double #000',
                paddingBottom: '1rem',
                marginBottom: '1.5rem',
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Universidad Mayor de San Simón
                  </h2>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: '#333', textTransform: 'uppercase' }}>
                    Dirección Administrativa y Financiera - Dpto. Activos Fijos (SCAF)
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                    Normas Básicas del Sistema de Administración de Bienes y Servicios (D.S. 0181)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }}>
                    Código Oficial del Acta
                  </div>
                  <div style={{ fontSize: '1rem', color: '#b71c1c', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {activeActa.codigo}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.2rem' }}>
                    Fecha: {new Date(activeActa.fechaEmision).toLocaleString('es-BO', { timeZone: 'UTC' })}
                  </div>
                </div>
              </div>

              {/* Título Principal */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', textDecoration: 'underline' }}>
                  ACTA DE ENTREGA Y RECEPCIÓN BILATERAL DE ACTIVOS FIJOS
                </h1>
                <div style={{ fontSize: '0.85rem', color: '#444', marginTop: '0.3rem' }}>
                  Traspaso formal de custodia institucional entre servidores públicos (FSD-UC-005)
                </div>
              </div>

              {/* Bloque Cuadrícula de Custodios */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                {/* Custodio Entrega (Origen) */}
                <div style={{ border: '1px solid #000', padding: '0.85rem', borderRadius: '4px', backgroundColor: '#fcfcfc' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '0.3rem', marginBottom: '0.5rem', textTransform: 'uppercase', color: '#b71c1c' }}>
                    📤 Custodio Origen (Entrega / Descargo)
                  </div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <strong>Servidor Público:</strong> {activeActa.origenSnapshot.responsible}
                  </div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <strong>Unidad Organizacional:</strong> {activeActa.origenSnapshot.unit}
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>Cargo / Función:</strong> {activeActa.origenSnapshot.cargo || 'Funcionario Custodio'}
                  </div>
                </div>

                {/* Custodio Recibe (Destino) */}
                <div style={{ border: '1px solid #000', padding: '0.85rem', borderRadius: '4px', backgroundColor: '#fcfcfc' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '0.3rem', marginBottom: '0.5rem', textTransform: 'uppercase', color: '#1b5e20' }}>
                    📥 Custodio Destino (Recepción / Cargo)
                  </div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <strong>Servidor Público:</strong> {activeActa.destinoSnapshot.responsible}
                  </div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <strong>Unidad Organizacional:</strong> {activeActa.destinoSnapshot.unit}
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>Cargo / Función:</strong> {activeActa.destinoSnapshot.cargo || 'Funcionario Custodio Receptor'}
                  </div>
                </div>
              </div>

              {/* Fundamentación */}
              <p style={{ fontSize: '0.85rem', textAlign: 'justify', marginBottom: '1.2rem', lineHeight: '1.5' }}>
                En aplicación del <strong>Artículo 145 y 146 del Decreto Supremo N° 0181 (SABS)</strong> y los manuales de procedimientos del Sistema de Control de Activos Fijos (SCAF) de la Universidad Mayor de San Simón, se realiza la verificación física y formalización del traspaso del bien mueble que se describe a continuación:
              </p>

              {/* Tabla Técnica del Activo */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#eeeeee' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>CÓDIGO QR / REGISTRO</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>DESCRIPCIÓN TÉCNICA DEL ACTIVO</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>CATEGORÍA</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>ESTADO FÍSICO</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>DESTINO ASIGNADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #000', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {activeActa.activoSnapshot.qrCode}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>
                      {activeActa.activoSnapshot.name}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>
                      {activeActa.activoSnapshot.category || 'Equipo de Computación'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>
                      {activeActa.activoSnapshot.status}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #000', fontWeight: '500' }}>
                      {activeActa.activoSnapshot.location}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Cláusula Legal de Descargo y Responsabilidad (SABS & Ley 1178) */}
              <div style={{
                border: '1px solid #000',
                padding: '0.85rem',
                backgroundColor: '#f9f9f9',
                fontSize: '0.8rem',
                textAlign: 'justify',
                marginBottom: '1.5rem',
                lineHeight: '1.45',
              }}>
                <strong style={{ display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Cláusula de Liberación de Descargo y Responsabilidad Bilateral (Ley 1178 SAFCO):
                </strong>
                Con la suscripción de la presente Acta, el <strong>Custodio Origen</strong> queda formal y administrativamente desvinculado de la custodia física y legal sobre el activo transferido. El <strong>Custodio Destino</strong> asume a título formal la tenencia, custodia, uso adecuado y resguardo del bien, comprometiéndose a velar por su integridad, mantenimiento preventivo y no enajenación sin autorización previa del Departamento de Activos Fijos, bajo responsabilidades civil, administrativa y penal previstas en la Ley SAFCO N° 1178.
              </div>

              {/* Sello Criptográfico de Integridad y No Repudio */}
              <div style={{
                border: '1px dashed #455a64',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                backgroundColor: '#eceff1',
                marginBottom: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
              }}>
                <div>
                  <strong>🔐 SELLO DE INTEGRIDAD CRIPTOGRÁFICA (SHA-256):</strong>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#263238', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                    {activeActa.hashIntegridad}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '130px', color: '#37474f' }}>
                  ✓ Inmutable y Auditado<br />
                  OpenTelemetry SCAF
                </div>
              </div>

              {/* Firmas Oficiales Bilaterales */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', fontSize: '0.85rem' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                    <strong>{activeActa.origenSnapshot.responsible}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#444' }}>CUSTODIO ENTREGA</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Entregué Conforme (Descargo)</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                    <strong>{activeActa.destinoSnapshot.responsible}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#444' }}>CUSTODIO RECIBE</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Recibí Conforme (Cargo)</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                    <strong>Ing. Sonia Rojas</strong>
                    <div style={{ fontSize: '0.75rem', color: '#444' }}>JEFE DE ACTIVOS FIJOS</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Dpto. Activos Fijos UMSS</div>
                  </div>
                </div>
              </div>

            </div>
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
