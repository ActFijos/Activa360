import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { QRScannerModal } from '../components/QRScannerModal';

const assignmentSchema = z.object({
  assetId: z.string().min(1, 'Debe seleccionar un activo.'),
  responsible: z.string().min(3, 'El nombre del responsable debe tener al menos 3 caracteres.'),
  date: z.string().refine(val => {
    if (!val) return false;
    const dateVal = new Date(val);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // timezone offset buffer
    return dateVal <= today;
  }, 'La fecha de asignación no puede ser una fecha futura.'),
  destination: z.string().min(1, 'La ubicación de destino es requerida.'),
  observations: z.string().max(500, 'Las observaciones no pueden superar los 500 caracteres.').optional(),
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

interface Assignment {
  id: string;
  assetId: string;
  responsible: string;
  date: string;
  destination: string;
  observations?: string;
  assetName?: string;
  assetQr?: string;
  assetCategory?: string;
}

export const Asignacion: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchAssetQuery, setSearchAssetQuery] = useState('');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');

  // Selected entities
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Form states
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [destination, setDestination] = useState('');
  const [observations, setObservations] = useState('');

  // Print state
  const [activeActa, setActiveActa] = useState<Assignment | null>(null);

  // Feedback states
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validLocations, setValidLocations] = useState<string[]>([]);

  const validateField = (name: string, value: any) => {
    try {
      const fieldSchema = (assignmentSchema.shape as any)[name];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          const errMsg = result.error.issues[0]?.message || 'Entrada inválida';
          setFormErrors(prev => ({ ...prev, [name]: errMsg }));
        } else {
          setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, employeesRes, assignmentsRes] = await Promise.all([
        fetch('http://localhost:3000/activos'),
        fetch('http://localhost:3000/activos/empleados'),
        fetch('http://localhost:3000/activos/asignaciones'),
      ]);

      let allAssets: Asset[] = [];
      if (assetsRes.ok) {
        allAssets = await assetsRes.json();
        const availableAssets = allAssets.filter(
          (a: Asset) => a.status !== 'Dado_De_Baja' && a.status !== 'En_Proceso_Baja'
        );
        setAssets(availableAssets);
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        const mapped = assignmentsData.map((a: any) => {
          const assetObj = allAssets.find(as => as.id === a.assetId);
          return {
            ...a,
            assetName: assetObj ? assetObj.name : 'Activo Fijo',
            assetQr: assetObj ? assetObj.qrCode : 'S/QR',
            assetCategory: assetObj ? assetObj.category : 'Otros',
          };
        });
        setAssignments(mapped);
      }
    } catch (error) {
      console.error('Error cargando datos de asignación', error);
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
  };

  const handleSelectEmployee = (name: string) => {
    setSelectedEmployee(name);
    setSearchEmployeeQuery(name);
    setShowEmployeeSuggestions(false);
    setFormErrors(prev => {
      const next = { ...prev };
      delete next.responsible;
      return next;
    });
  };

  const handleScanSuccess = (qrCode: string) => {
    const asset = assets.find(a => a.qrCode === qrCode);
    if (asset) {
      handleSelectAsset(asset);
      setIsScannerOpen(false);
    } else {
      alert(`Activo con código QR ${qrCode} no encontrado o de baja.`);
    }
  };

  const handleCancel = () => {
    setSelectedAsset(null);
    setSelectedEmployee('');
    setSearchAssetQuery('');
    setSearchEmployeeQuery('');
    setDestination('');
    setObservations('');
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setSubmitError(null);

    const formData = {
      assetId: selectedAsset?.id || '',
      responsible: selectedEmployee,
      date: assignmentDate,
      destination,
      observations: observations || undefined,
    };

    const result = assignmentSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(iss => {
        const fieldName = iss.path[0] as string;
        errors[fieldName] = iss.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3000/activos/asignar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el servidor al realizar la asignación.');
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

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title Header */}
      <div className="no-print">
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👤 Asignación de Activos {isLoading && <span style={{ fontSize: '1rem', color: '#78909c', fontWeight: 'normal' }}>(Cargando...)</span>}
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
          Asigne activos del almacén a empleados responsables y genere las actas SABS
        </p>
      </div>

      {/* Info Alert Box */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        padding: '1.25rem',
        backgroundColor: '#e3f2fd',
        border: '1px solid #bbdefb',
        borderRadius: '10px',
        color: '#0d47a1',
        fontSize: '0.9rem',
      }}>
        <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>ℹ️</div>
        <div>
          <strong style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.95rem' }}>Proceso de Asignación y Actas</strong>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#1565c0' }}>
            <li>Seleccione un activo y un empleado responsable del listado de sugerencias.</li>
            <li>Al guardar la asignación, podrá imprimir el **Acta de Asignación y Custodia** desde la tabla histórica inferior.</li>
          </ul>
        </div>
      </div>

      {submitSuccess && (
        <div className="no-print" style={{ padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 'bold' }}>
          ✓ ¡Asignación realizada con éxito! El activo ha cambiado a estado "Asignado".
        </div>
      )}

      {submitError && (
        <div className="no-print" style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', fontSize: '0.9rem' }}>
          ⚠️ {submitError}
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #cfd8dc' }}>
        
        {/* Left Column: 1. Seleccionar Activo */}
        <div style={{ borderRight: '1px solid #eceff1', paddingRight: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e88e5', borderBottom: '2px solid #e3f2fd', paddingBottom: '0.5rem' }}>
            1. Seleccionar Activo
          </h3>
          
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Buscar Activo *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchAssetQuery}
                onChange={(e) => {
                  setSearchAssetQuery(e.target.value);
                  if (selectedAsset) {
                    setSelectedAsset(null);
                    validateField('assetId', '');
                  }
                }}
                style={{ flexGrow: 1, borderColor: formErrors.assetId ? '#d32f2f' : undefined }}
                required
              />
              <button 
                type="button" 
                onClick={() => setIsScannerOpen(true)}
                style={{ padding: '0.5rem 0.75rem', backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem' }}
                title="Escanear Código QR"
              >
                📷
              </button>
            </div>
            {formErrors.assetId && (
              <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.assetId}</span>
            )}

            {/* Asset Autocomplete Suggestions */}
            {searchAssetQuery.trim() !== '' && !selectedAsset && (
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
                    No se encontraron activos disponibles con ese criterio.
                  </div>
                ) : (
                  filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #eceff1', fontSize: '0.85rem' }}
                      className="suggestion-item"
                    >
                      <strong>{asset.qrCode}</strong> - {asset.name}
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c' }}>
                        Ubicación: {asset.location} | Estado: {asset.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedAsset && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f1f8e9',
              border: '1px solid #c5e1a5',
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}>
              <strong style={{ color: '#33691e', display: 'block', marginBottom: '0.5rem' }}>✓ Activo Seleccionado:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div><strong>Descripción:</strong> {selectedAsset.name}</div>
                <div><strong>Código QR:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedAsset.qrCode}</span></div>
                <div><strong>Ubicación Actual:</strong> {selectedAsset.location}</div>
                <div><strong>Estado Actual:</strong> {selectedAsset.status}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 2. Seleccionar Responsable */}
        <div>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e88e5', borderBottom: '2px solid #e3f2fd', paddingBottom: '0.5rem' }}>
            2. Seleccionar Responsable
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Buscar Empleado *</label>
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o unidad..."
                value={searchEmployeeQuery}
                onChange={(e) => {
                  setSearchEmployeeQuery(e.target.value);
                  setSelectedEmployee(e.target.value);
                  setShowEmployeeSuggestions(true);
                  validateField('responsible', e.target.value);
                }}
                onFocus={() => setShowEmployeeSuggestions(true)}
                style={{ borderColor: formErrors.responsible ? '#d32f2f' : undefined }}
                required
              />
              {formErrors.responsible && (
                <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.responsible}</span>
              )}
              
              {/* Employee Autocomplete Suggestions */}
              {showEmployeeSuggestions && searchEmployeeQuery.trim() !== '' && (
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
                  {filteredEmployees.length === 0 ? (
                    <div 
                      onClick={() => setShowEmployeeSuggestions(false)}
                      style={{ padding: '0.75rem', color: '#78909c', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      Usar: "{searchEmployeeQuery}" (Ingresar nuevo)
                    </div>
                  ) : (
                    filteredEmployees.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp.fullName)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eceff1',
                          fontSize: '0.85rem'
                        }}
                        className="suggestion-item"
                      >
                        <strong>{emp.fullName}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c' }}>
                          Cargo: {emp.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Fecha de Asignación *</label>
              <input
                type="date"
                value={assignmentDate}
                onChange={(e) => {
                  setAssignmentDate(e.target.value);
                  validateField('date', e.target.value);
                }}
                style={{ borderColor: formErrors.date ? '#d32f2f' : undefined }}
                required
              />
              {formErrors.date && (
                <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.date}</span>
              )}
            </div>

            <div className="form-group">
              <label>Ubicación de Destino *</label>
              <select
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  validateField('destination', e.target.value);
                }}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: formErrors.destination ? '1px solid #d32f2f' : '1px solid #cfd8dc', borderRadius: '6px', fontSize: '0.9rem' }}
                required
              >
                <option value="">Seleccione una ubicación...</option>
                {validLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              {formErrors.destination && (
                <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.destination}</span>
              )}
            </div>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                placeholder="Observaciones adicionales sobre la asignación (opcional)"
                value={observations}
                onChange={(e) => {
                  setObservations(e.target.value);
                  validateField('observations', e.target.value);
                }}
                style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: formErrors.observations ? '1px solid #d32f2f' : '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
              />
              {formErrors.observations && (
                <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.observations}</span>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions across grid */}
        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Asignando...' : 'Confirmar Asignación'}
          </button>
        </div>

      </form>

      {/* Assignments Table List (Historial de Asignaciones) */}
      <div className="no-print" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #cfd8dc', marginTop: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#263238' }}>Historial de Asignaciones y Custodia</h3>
        {assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#78909c' }}>No se registran asignaciones de activos fijos actualmente.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7f8', borderBottom: '2px solid #cfd8dc' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.85rem' }}>Fecha</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.85rem' }}>Código QR</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.85rem' }}>Activo Fijo</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.85rem' }}>Responsable Custodio</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.85rem' }}>Ubicación Destino</th>
                <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.85rem' }}>Acta SABS</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                  <td style={{ padding: '10px', fontSize: '0.85rem', color: '#546e7a' }}>{new Date(item.date).toLocaleDateString()}</td>
                  <td style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e88e5' }}>{item.assetQr}</td>
                  <td style={{ padding: '10px', fontSize: '0.85rem' }}>{item.assetName}</td>
                  <td style={{ padding: '10px', fontSize: '0.85rem', fontWeight: '500', color: '#263238' }}>{item.responsible}</td>
                  <td style={{ padding: '10px', fontSize: '0.85rem' }}>{item.destination}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setActiveActa(item)}
                      style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: '#1e88e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      📄 Generar Acta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Printable Acta Modal Template */}
      {activeActa && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '750px', width: '90%', padding: '2.5rem', backgroundColor: '#fff', borderRadius: '8px' }}>
            
            {/* Action buttons (hidden on print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eceff1', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Vista Previa del Acta</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveActa(null)} style={{ padding: '0.5rem 1rem', backgroundColor: '#c62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cerrar
                </button>
                <button type="button" className="btn-primary" onClick={triggerPrint} style={{ padding: '0.5rem 1.25rem', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🖨️ Imprimir Acta (PDF)
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div className="print-section" style={{ color: '#000', fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>
              
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Universidad Mayor de San Simón</h2>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: '#555', textTransform: 'uppercase' }}>Dirección de Activos Fijos - SCAF</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ACTA DE ASIGNACIÓN</div>
                  <div style={{ fontSize: '0.85rem', color: '#d32f2f', fontFamily: 'monospace' }}>CORRELATIVO: AS-{activeActa.id.substring(0, 8).toUpperCase()}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', textDecoration: 'underline' }}>
                  ACTA DE ASIGNACIÓN Y RESPONSABILIDAD DE CUSTODIA
                </h1>
              </div>

              {/* Custodio Details Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', border: '1px solid #000', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                <div>
                  <strong>FUNCIONARIO RESPONSABLE:</strong> {activeActa.responsible}
                </div>
                <div>
                  <strong>FECHA DE EMISIÓN:</strong> {new Date(activeActa.date).toLocaleDateString()}
                </div>
                <div>
                  <strong>UBICACIÓN DE DESTINO:</strong> {activeActa.destination}
                </div>
                <div>
                  <strong>CARGO DEL RESPONSABLE:</strong> Personal Administrativo / Académico
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', textAlign: 'justify', marginBottom: '1.5rem' }}>
                En cumplimiento con las Normas Básicas del Sistema de Administración de Bienes y Servicios (SABS) de la Universidad Mayor de San Simón, se hace entrega formal del activo fijo que se detalla a continuación, transfiriendo la custodia física y la responsabilidad legal de su conservación al funcionario mencionado anteriormente:
              </p>

              {/* Assets Details Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', backgroundColor: '#f2f2f2' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>CÓDIGO QR / BARRAS</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>DESCRIPCIÓN DEL ACTIVO</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>CATEGORÍA</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>UBICACIÓN ASIGNADA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #000', fontFamily: 'monospace', fontWeight: 'bold' }}>{activeActa.assetQr}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{activeActa.assetName}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{activeActa.assetCategory}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{activeActa.destination}</td>
                  </tr>
                </tbody>
              </table>

              {/* Disclaimer Legal Commitments */}
              <div style={{ border: '1px solid #000', padding: '1rem', backgroundColor: '#fafafa', fontSize: '0.8rem', textAlign: 'justify', marginBottom: '3rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Compromiso de Custodia y Conservación:</strong>
                El custodio declara recibir el bien descrito en condiciones óptimas para el ejercicio de sus funciones. Se compromete a velar por el buen uso, seguridad y mantenimiento preventivo del bien bajo su cargo directo, responsabilizándose civil y administrativamente ante la Dirección de Activos Fijos por cualquier pérdida, daño técnico o siniestro derivado de negligencia o mal uso del mismo, obligándose a dar parte inmediato a la unidad técnica correspondiente de acuerdo a las reglamentaciones vigentes.
              </div>

              {/* Signature Lines block */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '4rem', fontSize: '0.9rem' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                    <strong>Ing. Sonia Rojas</strong>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Entregué Conforme</div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Dpto. Activos Fijos</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                    <strong>{activeActa.responsible}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Recibí Conforme</div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Funcionario Custodio</div>
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
