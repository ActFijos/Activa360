import React, { useState, useEffect } from 'react';

interface Stats {
  totalAssets: number;
  totalValue: number;
  monthlyDepreciation: number;
  maintenanceCount: number;
  categoryDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  locationDistribution: { name: string; value: number }[];
}

interface Transfer {
  id: string;
  date: string;
  fromUnit: string;
  fromResponsible: string;
  toUnit: string;
  toResponsible: string;
  status: string;
  reason: string;
  assetCode: string;
  assetName: string;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bajasCount, setBajasCount] = useState(0);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drill-down modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, transfersRes, bajasRes] = await Promise.all([
        fetch('http://localhost:3000/activos/reportes/estadisticas'),
        fetch('http://localhost:3000/activos/reportes/transferencias'),
        fetch('http://localhost:3000/activos/reportes/bajas'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        setRecentTransfers(transfersData.slice(0, 5));
      }
      if (bajasRes.ok) {
        const bajasData = await bajasRes.json();
        setBajasCount(bajasData.length);
      }
    } catch (e) {
      console.error('Error loading dashboard stats', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCardClick = async (type: string) => {
    setIsLoadingModal(true);
    setActiveModal(type);
    setModalData([]);

    try {
      if (type === 'totalAssets') {
        setModalTitle('Desglose de Activos Totales');
        const res = await fetch('http://localhost:3000/activos');
        if (res.ok) setModalData(await res.json());
      } else if (type === 'totalValue') {
        setModalTitle('Desglose de Valoración y Depreciación de Activos');
        const res = await fetch('http://localhost:3000/activos/reportes/valoracion');
        if (res.ok) {
          const valData = await res.json();
          setModalData(valData.assets || []);
        }
      } else if (type === 'inspections') {
        setModalTitle('Desglose de Revisiones Técnicas (Mantenimiento)');
        const res = await fetch('http://localhost:3000/activos/reportes/mantenimiento');
        if (res.ok) setModalData(await res.json());
      } else if (type === 'retired') {
        setModalTitle('Desglose de Activos Dados de Baja (SABS)');
        const res = await fetch('http://localhost:3000/activos/reportes/bajas');
        if (res.ok) setModalData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching drill-down data', err);
    } finally {
      setIsLoadingModal(false);
    }
  };

  // Donut chart calculations
  const total = stats?.totalAssets || 0;
  const nuevo = stats?.statusDistribution.find(s => s.name === 'Nuevo')?.value || 0;
  const asignado = stats?.statusDistribution.find(s => s.name === 'Asignado')?.value || 0;
  const danado = stats?.statusDistribution.find(s => s.name === 'Dañado')?.value || 0;
  const obsoleto = stats?.statusDistribution.find(s => s.name === 'Obsoleto')?.value || 0;
  const deBaja = stats?.statusDistribution.find(s => s.name === 'Dado_De_Baja')?.value || 0;
  const enProceso = stats?.statusDistribution.find(s => s.name === 'En_Proceso_Baja')?.value || 0;

  const disponiblePct = total > 0 ? ((nuevo + asignado) / total) * 100 : 0;
  const danadoPct = total > 0 ? ((danado + obsoleto) / total) * 100 : 0;
  const bajasPct = total > 0 ? ((deBaja + enProceso) / total) * 100 : 0;

  // Circumference of r=70 is ~439.8
  const stroke1 = disponiblePct * 4.398;
  const stroke2 = danadoPct * 4.398;
  const stroke3 = bajasPct * 4.398;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#78909c' }}>
        <h3>Cargando indicadores del Dashboard...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238' }}>Dashboard</h1>
      </div>

      {/* KPI Cards Grid */}
      <section className="cards-grid">
        
        <div onClick={() => handleCardClick('totalAssets')} style={{ cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }} className="kpi-card hover-lift">
          <div className="kpi-header">
            <span className="kpi-title">Activos Totales</span>
            <span className="kpi-icon" style={{ color: '#1e88e5' }}>📦</span>
          </div>
          <p className="kpi-value">{stats?.totalAssets || 0}</p>
          <span style={{ fontSize: '0.7rem', color: '#1e88e5', display: 'block', marginTop: '0.25rem' }}>👉 Click para ver detalle</span>
        </div>

        <div onClick={() => handleCardClick('totalValue')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} className="kpi-card hover-lift">
          <div className="kpi-header">
            <span className="kpi-title">Valor Total de Activos</span>
            <span className="kpi-icon" style={{ color: '#4caf50' }}>💵</span>
          </div>
          <p className="kpi-value">${(stats?.totalValue || 0).toLocaleString()} Bs.</p>
          <span style={{ fontSize: '0.7rem', color: '#2e7d32', display: 'block', marginTop: '0.25rem' }}>👉 Click para ver detalle financiero</span>
        </div>

        <div onClick={() => handleCardClick('inspections')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} className="kpi-card hover-lift">
          <div className="kpi-header">
            <span className="kpi-title">Revisiones Técnicas</span>
            <span className="kpi-icon" style={{ color: '#ff9800' }}>⚠️</span>
          </div>
          <p className="kpi-value">{stats?.maintenanceCount || 0}</p>
          <span style={{ fontSize: '0.7rem', color: '#f57c00', display: 'block', marginTop: '0.25rem' }}>👉 Click para ver reportes de inspección</span>
        </div>

        <div onClick={() => handleCardClick('retired')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} className="kpi-card hover-lift">
          <div className="kpi-header">
            <span className="kpi-title">Activos con Baja</span>
            <span className="kpi-icon" style={{ color: '#e53935' }}>🗑️</span>
          </div>
          <p className="kpi-value">{bajasCount}</p>
          <span style={{ fontSize: '0.7rem', color: '#c62828', display: 'block', marginTop: '0.25rem' }}>👉 Click para ver bajas aprobadas</span>
        </div>
      </section>

      {/* Split Section */}
      <section className="dashboard-split">
        
        {/* Recent Movements Table */}
        <div className="panel-card">
          <h3 className="panel-title">Últimos Movimientos</h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Fecha Movimiento</th>
              </tr>
            </thead>
            <tbody>
              {recentTransfers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#78909c' }}>No se registran movimientos ni traspasos actualmente.</td>
                </tr>
              ) : (
                recentTransfers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.assetName}</strong>
                      <span className="asset-badge-info">{item.assetCode}</span>
                    </td>
                    <td>{item.fromUnit}</td>
                    <td>{item.toUnit}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Donut Chart */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="panel-title">Distribución de Estados</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, padding: '1rem' }}>
            <svg width="180" height="180" viewBox="0 0 200 200">
              {/* background circle */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#eceff1" strokeWidth="26" />
              {/* Disponible part (green) */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#10b981" strokeWidth="28" 
                      strokeDasharray={`${stroke1} 439.8`} strokeDashoffset="0" />
              {/* Dañado/Obsolescencia part (yellow) */}
              {stroke2 > 0 && (
                <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f59e0b" strokeWidth="28" 
                        strokeDasharray={`${stroke2} 439.8`} strokeDashoffset={`-${stroke1}`} />
              )}
              {/* De Baja part (red) */}
              {stroke3 > 0 && (
                <circle cx="100" cy="100" r="70" fill="transparent" stroke="#ef4444" strokeWidth="28" 
                        strokeDasharray={`${stroke3} 439.8`} strokeDashoffset={`-${stroke1 + stroke2}`} />
              )}
              <circle cx="100" cy="100" r="55" fill="#ffffff" />
            </svg>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: '#546e7a', marginTop: '1rem', borderTop: '1px solid #eceff1', paddingTop: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }}></span> Disponible ({disponiblePct.toFixed(0)}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></span> Dañado/Obsoleto ({danadoPct.toFixed(0)}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', gridColumn: 'span 2' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span> Dado de Baja ({bajasPct.toFixed(0)}%)
            </span>
          </div>
        </div>
      </section>

      {/* Drill-down Detail Modal Overlay */}
      {activeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #eceff1', paddingBottom: '1rem' }}>
              <h3>{modalTitle}</h3>
              <button type="button" className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>

            <div className="modal-body" style={{ flexGrow: 1, overflowY: 'auto', marginTop: '1rem', maxHeight: '55vh' }}>
              {isLoadingModal ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#78909c' }}>Cargando detalles...</div>
              ) : modalData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#78909c' }}>No se registran datos para este indicador.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  
                  {activeModal === 'totalAssets' && (
                    <>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f7f8', borderBottom: '2px solid #cfd8dc' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Código QR</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Descripción</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Categoría</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Ubicación</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.map((asset: any) => (
                          <tr key={asset.id} style={{ borderBottom: '1px solid #eceff1' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e88e5' }}>{asset.qrCode}</td>
                            <td style={{ padding: '10px' }}>{asset.name}</td>
                            <td style={{ padding: '10px' }}>{asset.category}</td>
                            <td style={{ padding: '10px' }}>{asset.location}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <span className={`badge badge-${asset.status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>
                                {asset.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {activeModal === 'totalValue' && (
                    <>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f7f8', borderBottom: '2px solid #cfd8dc' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Código QR</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Nombre / Descripción</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Categoría</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Valor Compra ($us)</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Dep. Acumulada</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Valor en Libros</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.map((item: any) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e88e5' }}>{item.qrCode}</td>
                            <td style={{ padding: '10px' }}>{item.name}</td>
                            <td style={{ padding: '10px' }}>{item.category}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>${(item.purchaseValue || 0).toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#c62828' }}>-${(item.accumulatedDepreciation || 0).toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>${(item.currentValue || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {activeModal === 'inspections' && (
                    <>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f7f8', borderBottom: '2px solid #cfd8dc' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Activo QR</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Nombre Activo</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Diagnóstico</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Costo Est. ($us)</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.map((item: any) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                            <td style={{ padding: '10px', color: '#546e7a' }}>{new Date(item.inspectedAt).toLocaleDateString()}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e88e5' }}>{item.assetCode}</td>
                            <td style={{ padding: '10px' }}>{item.assetName}</td>
                            <td style={{ padding: '10px', fontStyle: 'italic' }}>"{item.diagnosis}"</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>${(item.estimatedCost || 0).toFixed(2)}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                backgroundColor: item.action === 'Recomendar_Baja' ? '#ffebee' : '#e8f5e9',
                                color: item.action === 'Recomendar_Baja' ? '#c62828' : '#2e7d32'
                              }}>{(item.action || '').replace('_', ' ')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {activeModal === 'retired' && (
                    <>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f7f8', borderBottom: '2px solid #cfd8dc' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Fecha Baja</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Activo QR</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Descripción</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Justificación</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Acta / Soporte</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.map((item: any) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                            <td style={{ padding: '10px', color: '#546e7a' }}>{new Date(item.initiatedAt).toLocaleDateString()}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e88e5' }}>{item.assetCode}</td>
                            <td style={{ padding: '10px' }}>{item.assetName}</td>
                            <td style={{ padding: '10px', fontStyle: 'italic' }}>"{item.justification}"</td>
                            <td style={{ padding: '10px', fontWeight: '500' }}>{item.evidence}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                backgroundColor: '#ffebee',
                                color: '#c62828'
                              }}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                </table>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #eceff1', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
