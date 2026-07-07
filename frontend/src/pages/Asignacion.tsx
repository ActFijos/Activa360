import React, { useState, useEffect } from 'react';
import { QRScannerModal } from '../components/QRScannerModal';

interface Asset {
  id: string;
  qrCode: string;
  name: string;
  status: string;
  location: string;
}

interface Employee {
  id: string;
  fullName: string;
  role: string;
}

export const Asignacion: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  // Feedback states
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load assets and employees
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, employeesRes] = await Promise.all([
        fetch('http://localhost:3000/activos'),
        fetch('http://localhost:3000/activos/empleados'),
      ]);

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        // Filter out retired assets
        const availableAssets = assetsData.filter(
          (a: Asset) => a.status !== 'Dado_De_Baja' && a.status !== 'En_Proceso_Baja'
        );
        setAssets(availableAssets);
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Error cargando datos de asignación', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
  };

  const handleSelectEmployee = (fullName: string) => {
    setSelectedEmployee(fullName);
    setSearchEmployeeQuery(fullName);
    setShowEmployeeSuggestions(false);
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
    setDestination('');
    setObservations('');
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) {
      setSubmitError('Por favor seleccione un activo válido.');
      return;
    }
    if (!selectedEmployee) {
      setSubmitError('Por favor seleccione un empleado responsable.');
      return;
    }
    if (!destination) {
      setSubmitError('Por favor especifique la ubicación de destino.');
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3000/activos/asignar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          responsible: selectedEmployee,
          date: assignmentDate,
          destination,
          observations: observations || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el servidor al realizar la asignación.');
      }

      setSubmitSuccess(true);
      // Reload assets to update their state and location
      await loadData();
      
      // Clear form inputs
      setSelectedAsset(null);
      setSelectedEmployee('');
      setSearchAssetQuery('');
      setSearchEmployeeQuery('');
      setDestination('');
      setObservations('');
    } catch (err: any) {
      setSubmitError(err.message || 'Error de red al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👤 Asignación de Activos
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
          Asigne activos del almacén a empleados responsables
        </p>
      </div>

      {/* Info Alert Box (Replica of Figma screenshot) */}
      <div style={{
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
          <strong style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.95rem' }}>Proceso de Asignación</strong>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#1565c0' }}>
            <li>Seleccione un activo disponible del almacén utilizando el código o nombre</li>
            <li>Seleccione el empleado que será responsable del activo</li>
            <li>Especifique la ubicación de destino donde se encontrará el activo</li>
            <li>La asignación quedará registrada en el historial del activo</li>
          </ul>
        </div>
      </div>

      {submitSuccess && (
        <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 'bold' }}>
          ✓ ¡Asignación realizada con éxito! El activo ha cambiado a estado "Asignado".
        </div>
      )}

      {submitError && (
        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', fontSize: '0.9rem' }}>
          ⚠️ {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #cfd8dc' }}>
        
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
            
            {/* Asset Autocomplete Suggestions */}
            {!selectedAsset && searchAssetQuery.trim() !== '' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #b0bec5',
                borderRadius: '6px',
                maxHeight: '200px',
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
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eceff1',
                        fontSize: '0.85rem'
                      }}
                      className="suggestion-item"
                    >
                      <strong style={{ color: '#1565c0' }}>[{asset.qrCode}]</strong> {asset.name}
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c', marginTop: '0.1rem' }}>
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
                }}
                onFocus={() => setShowEmployeeSuggestions(true)}
                required
              />
              
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
                onChange={(e) => setAssignmentDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Ubicación de Destino *</label>
              <input
                type="text"
                placeholder="Ej: Facultad de Ciencias - Oficina 302"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                placeholder="Observaciones adicionales sobre la asignación (opcional)"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
              />
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
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  );
};
