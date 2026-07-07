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
    setNewUnit('');
    setReason('');
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) {
      setSubmitError('Por favor seleccione un activo válido.');
      return;
    }
    if (!newUnit) {
      setSubmitError('Por favor especifique la nueva unidad de destino.');
      return;
    }
    if (!selectedEmployee) {
      setSubmitError('Por favor seleccione el nuevo responsable.');
      return;
    }
    if (!reason) {
      setSubmitError('Por favor describa el motivo de la transferencia.');
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
          assetId: selectedAsset.id,
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
          ✓ ¡Transferencia registrada y aprobada con éxito! El activo ha sido reubicado y reasignado.
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
                <input
                  type="text"
                  placeholder="Buscar unidad o escribir destino..."
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  required
                />
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
                  }}
                  onFocus={() => setShowEmployeeSuggestions(true)}
                  required
                />
                
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
                  onChange={(e) => setTransferDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Motivo de la Transferencia *</label>
                <textarea
                  placeholder="Describa el motivo de la transferencia..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
                  required
                />
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
                    <span className={`badge ${t.status === 'Aprobada' ? 'badge-new' : 'badge-default'}`} style={{
                      backgroundColor: t.status === 'Aprobada' ? '#e8f5e9' : '#fff8e1',
                      color: t.status === 'Aprobada' ? '#2e7d32' : '#f57f17',
                      borderColor: t.status === 'Aprobada' ? '#c8e6c9' : '#ffe082'
                    }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
