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

export const Reportes: React.FC = () => {
  // Navigation states: 'initial' | 'config' | 'dashboard'
  const [viewState, setViewState] = useState<'initial' | 'config' | 'dashboard'>('initial');
  const [selectedReportType, setSelectedReportType] = useState('General de Activos');
  const [stats, setStats] = useState<Stats | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generationTime, setGenerationTime] = useState('');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterLocation, setFilterLocation] = useState('Todas');
  const [validLocations, setValidLocations] = useState<string[]>([]);

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

  const reportTypes = [
    { name: 'General de Activos', icon: '📦', desc: 'Resumen global del inventario' },
    { name: 'Depreciación', icon: '📈', desc: 'Cálculo de depreciación lineal' },
    { name: 'Inventario', icon: '📊', desc: 'Cantidad de activos físicos' },
    { name: 'Valoración', icon: '💵', desc: 'Valor total del patrimonio' },
    { name: 'Por Ubicación', icon: '📍', desc: 'Distribución por facultades y oficinas' },
    { name: 'Por Categoría', icon: '🏷️', desc: 'Clasificación por tipo de bien' },
    { name: 'Mantenimiento', icon: '🔧', desc: 'Activos dañados o reparados' },
    { name: 'Bajas', icon: '⬇️', desc: 'Bajas SABS registradas' },
    { name: 'Transferencias', icon: '🔄', desc: 'Historial de traslados' },
  ];

  const handleGenerateReport = async () => {
    setIsLoading(true);
    let endpoint = 'estadisticas';
    if (selectedReportType === 'Depreciación') endpoint = 'depreciacion';
    else if (selectedReportType === 'Inventario') endpoint = 'inventario';
    else if (selectedReportType === 'Valoración') endpoint = 'valoracion';
    else if (selectedReportType === 'Por Ubicación') endpoint = 'inventario';
    else if (selectedReportType === 'Por Categoría') endpoint = 'inventario';
    else if (selectedReportType === 'Mantenimiento') endpoint = 'mantenimiento';
    else if (selectedReportType === 'Bajas') endpoint = 'bajas';
    else if (selectedReportType === 'Transferencias') endpoint = 'transferencias';

    const params = new URLSearchParams();
    if (filterStartDate) params.append('startDate', filterStartDate);
    if (filterEndDate) params.append('endDate', filterEndDate);
    if (filterLocation && filterLocation !== 'Todas') params.append('location', filterLocation);

    try {
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`http://localhost:3000/activos/reportes/${endpoint}${queryStr}`);
      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }
      const data = await response.json();
      setReportData(data);
      if (endpoint === 'estadisticas') {
        setStats(data);
      } else {
        setStats(null);
      }
      
      const now = new Date();
      setGenerationTime(`Generado el ${now.toLocaleDateString()} a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setViewState('dashboard');
    } catch (error) {
      alert('Error de conexión al generar el reporte. Asegúrate de que el backend esté corriendo.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (selectedReportType === 'General de Activos' && stats) {
      csvContent += "Metrica,Valor\n";
      csvContent += `Total Activos,${stats.totalAssets}\n`;
      csvContent += `Valor Total (Bs.),${stats.totalValue}\n`;
      csvContent += `Depreciacion Mensual (Bs.),${stats.monthlyDepreciation}\n`;
      csvContent += `En Mantenimiento,${stats.maintenanceCount}\n`;
    } else if (Array.isArray(reportData)) {
      if (reportData.length === 0) {
        alert("No hay datos para exportar.");
        return;
      }
      const headers = Object.keys(reportData[0]);
      csvContent += headers.join(",") + "\n";
      
      reportData.forEach(row => {
        const line = headers.map(header => {
          let val = row[header];
          if (val === null || val === undefined) return "";
          val = String(val).replace(/"/g, '""');
          return val.includes(",") || val.includes("\n") ? `"${val}"` : val;
        }).join(",");
        csvContent += line + "\n";
      });
    } else if (reportData.assets && Array.isArray(reportData.assets)) {
      const headers = Object.keys(reportData.assets[0]);
      csvContent += headers.join(",") + "\n";
      reportData.assets.forEach((row: any) => {
        const line = headers.map(header => {
          let val = row[header];
          if (val === null || val === undefined) return "";
          val = String(val).replace(/"/g, '""');
          return val.includes(",") || val.includes("\n") ? `"${val}"` : val;
        }).join(",");
        csvContent += line + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_${selectedReportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'activo' || s === 'aprobada' || s === 'nuevo' || s === 'asignado') {
      return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
    }
    if (s === 'pendiente' || s === 'iniciada' || s === 'mantenimiento' || s === 'en mantenimiento') {
      return { backgroundColor: '#fff3e0', color: '#f57c00' };
    }
    return { backgroundColor: '#ffebee', color: '#c62828' };
  };

  const renderReportContent = () => {
    if (!reportData) return <p>No hay datos disponibles para este reporte.</p>;

    // 1. GENERAL DE ACTIVOS
    if (selectedReportType === 'General de Activos' && stats) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#e3f2fd', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Total de Activos</span>
                <strong style={{ fontSize: '1.6rem', color: '#263238' }}>{stats.totalAssets}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#e8f5e9', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💵</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Valor Total (Bs.)</span>
                <strong style={{ fontSize: '1.6rem', color: '#2e7d32' }}>{stats.totalValue.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#f3e5f5', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📈</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Depreciación Mensual (Bs.)</span>
                <strong style={{ fontSize: '1.6rem', color: '#8e24aa' }}>{stats.monthlyDepreciation.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#fff3e0', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔧</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>En Mantenimiento</span>
                <strong style={{ fontSize: '1.6rem', color: '#f57c00' }}>{stats.maintenanceCount}</strong>
              </div>
            </div>
          </div>

          {/* Charts Area Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Chart 1: Activos por Categoría */}
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc' }}>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#263238', fontSize: '1rem', fontWeight: 'bold' }}>Activos por Categoría</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                {stats.categoryDistribution.map((cat) => {
                  const maxVal = Math.max(...stats.categoryDistribution.map(c => c.value)) || 1;
                  const percentage = (cat.value / maxVal) * 100;
                  return (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ width: '130px', fontSize: '0.8rem', color: '#37474f', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat.name}
                      </span>
                      <div style={{ flexGrow: 1, backgroundColor: '#f1f3f4', height: '24px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percentage}%`,
                          backgroundColor: '#1e88e5',
                          height: '100%',
                          transition: 'width 0.5s ease-out',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '8px'
                        }}>
                          {cat.value > 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 'bold' }}>{cat.value}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Estado de los Activos */}
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#263238', fontSize: '1rem', fontWeight: 'bold' }}>Estado de los Activos</h4>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, gap: '2rem', minHeight: '150px' }}>
                <svg width="150" height="150" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e8f5e9" strokeWidth="4"></circle>
                  {(() => {
                    const total = stats.totalAssets || 1;
                    const nuevo = stats.statusDistribution.find(s => s.name === 'Nuevo')?.value || 0;
                    const asignado = stats.statusDistribution.find(s => s.name === 'Asignado')?.value || 0;
                    const danado = stats.statusDistribution.find(s => s.name === 'Dañado')?.value || 0;
                    const obsoleto = stats.statusDistribution.find(s => s.name === 'Obsoleto')?.value || 0;

                    const activeCount = nuevo + asignado;
                    const activePct = (activeCount / total) * 100;
                    const maintPct = (danado / total) * 100;
                    const obsoletePct = (obsoleto / total) * 100;

                    const stroke1 = activePct;
                    const stroke2 = maintPct;
                    const stroke3 = obsoletePct;

                    return (
                      <>
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#2e7d32" strokeWidth="4.2" 
                                strokeDasharray={`${stroke1} ${100 - stroke1}`} strokeDashoffset="0"></circle>
                        {stroke2 > 0 && (
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f57c00" strokeWidth="4.2" 
                                  strokeDasharray={`${stroke2} ${100 - stroke2}`} strokeDashoffset={`-${stroke1}`}></circle>
                        )}
                        {stroke3 > 0 && (
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#78909c" strokeWidth="4.2" 
                                  strokeDasharray={`${stroke3} ${100 - stroke3}`} strokeDashoffset={`-${stroke1 + stroke2}`}></circle>
                        )}
                      </>
                    );
                  })()}
                </svg>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#2e7d32' }}></span>
                    <span>Activos ({Math.round(((stats.statusDistribution.find(s => s.name === 'Nuevo')?.value || 0) + (stats.statusDistribution.find(s => s.name === 'Asignado')?.value || 0)) / (stats.totalAssets || 1) * 100)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f57c00' }}></span>
                    <span>En Mantenimiento ({Math.round((stats.statusDistribution.find(s => s.name === 'Dañado')?.value || 0) / (stats.totalAssets || 1) * 100)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#78909c' }}></span>
                    <span>Obsoletos/Inactivos ({Math.round((stats.statusDistribution.find(s => s.name === 'Obsoleto')?.value || 0) / (stats.totalAssets || 1) * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. DEPRECIACIÓN
    if (selectedReportType === 'Depreciación' && Array.isArray(reportData)) {
      return (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', padding: '1.5rem', overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#263238' }}>Cálculo de Depreciación Lineal Acumulada (Gestión Actual)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#37474f', color: '#fff', borderBottom: '2px solid #cfd8dc' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Código QR</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Nombre / Descripción</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Categoría</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem' }}>Valor Adq. (Bs.)</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>Vida Útil (Años)</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem' }}>Dep. Acumulada (Bs.)</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem' }}>Valor Residual (Bs.)</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                  <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e88e5' }}>{item.qrCode}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{item.name}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#546e7a' }}>{item.category}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', fontWeight: '500' }}>{item.purchaseValue.toLocaleString()}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'center' }}>{item.usefulLife}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', color: '#c62828' }}>{item.accumulatedDepreciation.toLocaleString()}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>{item.currentValue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 3. INVENTARIO
    if (selectedReportType === 'Inventario' && Array.isArray(reportData)) {
      return (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', padding: '1.5rem', overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#263238' }}>Listado Físico del Inventario General</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#37474f', color: '#fff', borderBottom: '2px solid #cfd8dc' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Código QR</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Activo Fijo</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Categoría</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Ubicación</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>Origen</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                  <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e88e5' }}>{item.qrCode}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{item.name}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#546e7a' }}>{item.category}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{item.location}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'center' }}>{item.origin}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      ...getStatusBadgeStyle(item.status)
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 4. VALORACIÓN
    if (selectedReportType === 'Valoración' && reportData.assets) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Valoración KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#e3f2fd', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💵</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Costo de Adquisición</span>
                <strong style={{ fontSize: '1.6rem', color: '#1e88e5' }}>Bs. {reportData.totalPurchaseValue.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#ffebee', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📈</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Depreciación Acumulada</span>
                <strong style={{ fontSize: '1.6rem', color: '#c62828' }}>Bs. {reportData.totalAccumulatedDepreciation.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#e8f5e9', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏛️</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Valor Residual Neto</span>
                <strong style={{ fontSize: '1.6rem', color: '#2e7d32' }}>Bs. {reportData.totalCurrentValue.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', padding: '1.5rem', overflowX: 'auto' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#263238' }}>Valor Contable Individual</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#37474f', color: '#fff', borderBottom: '2px solid #cfd8dc' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Código QR</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Activo Fijo</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Categoría</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem' }}>Costo Original (Bs.)</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem' }}>Dep. Acumulada (Bs.)</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem' }}>Valor Residual Neto (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.assets.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e88e5' }}>{item.qrCode}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{item.name}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#546e7a' }}>{item.category}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right' }}>{item.purchaseValue.toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', color: '#c62828' }}>{item.accumulatedDepreciation.toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>{item.currentValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 5. POR UBICACIÓN
    if (selectedReportType === 'Por Ubicación' && Array.isArray(reportData)) {
      // Group by location
      const groups: Record<string, { count: number; totalValue: number; assets: any[] }> = {};
      reportData.forEach((asset: any) => {
        const loc = asset.location || 'Sin ubicación registrada';
        if (!groups[loc]) {
          groups[loc] = { count: 0, totalValue: 0, assets: [] };
        }
        groups[loc].count++;
        groups[loc].totalValue += asset.purchaseValue || 0;
        groups[loc].assets.push(asset);
      });

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ margin: 0, color: '#263238' }}>Distribución de Activos y Valor por Ubicación/Unidad</h4>
          {Object.entries(groups).map(([locName, group]) => (
            <div key={locName} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #cfd8dc', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eceff1', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#37474f' }}>📍 {locName}</span>
                <span style={{ fontSize: '0.85rem', color: '#78909c' }}>
                  Cantidad: <strong style={{ color: '#263238' }}>{group.count}</strong> | Valor Total: <strong style={{ color: '#2e7d32' }}>Bs. {group.totalValue.toLocaleString()}</strong>
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f7f8', borderBottom: '1px solid #cfd8dc' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', color: '#546e7a' }}>Código QR</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', color: '#546e7a' }}>Descripción</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', color: '#546e7a' }}>Categoría</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontSize: '0.8rem', color: '#546e7a' }}>Valor Adq. (Bs.)</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '0.8rem', color: '#546e7a' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {group.assets.map((asset: any) => (
                    <tr key={asset.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '8px', fontSize: '0.8rem', fontWeight: '500', color: '#1e88e5' }}>{asset.qrCode}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', color: '#37474f' }}>{asset.name}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', color: '#546e7a' }}>{asset.category}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', textAlign: 'right' }}>{asset.purchaseValue.toLocaleString()}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          ...getStatusBadgeStyle(asset.status)
                        }}>{asset.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      );
    }

    // 6. POR CATEGORÍA
    if (selectedReportType === 'Por Categoría' && Array.isArray(reportData)) {
      // Group by category
      const groups: Record<string, { count: number; totalValue: number; assets: any[] }> = {};
      reportData.forEach((asset: any) => {
        const cat = asset.category || 'Otros';
        if (!groups[cat]) {
          groups[cat] = { count: 0, totalValue: 0, assets: [] };
        }
        groups[cat].count++;
        groups[cat].totalValue += asset.purchaseValue || 0;
        groups[cat].assets.push(asset);
      });

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ margin: 0, color: '#263238' }}>Distribución de Activos por Categoría de Bienes</h4>
          {Object.entries(groups).map(([catName, group]) => (
            <div key={catName} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #cfd8dc', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eceff1', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#37474f' }}>🏷️ {catName}</span>
                <span style={{ fontSize: '0.85rem', color: '#78909c' }}>
                  Cantidad: <strong style={{ color: '#263238' }}>{group.count}</strong> | Valor Total: <strong style={{ color: '#2e7d32' }}>Bs. {group.totalValue.toLocaleString()}</strong>
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f7f8', borderBottom: '1px solid #cfd8dc' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', color: '#546e7a' }}>Código QR</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', color: '#546e7a' }}>Descripción</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', color: '#546e7a' }}>Ubicación</th>
                    <th style={{ padding: '8px', textAlign: 'right', fontSize: '0.8rem', color: '#546e7a' }}>Valor Adq. (Bs.)</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '0.8rem', color: '#546e7a' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {group.assets.map((asset: any) => (
                    <tr key={asset.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '8px', fontSize: '0.8rem', fontWeight: '500', color: '#1e88e5' }}>{asset.qrCode}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', color: '#37474f' }}>{asset.name}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', color: '#546e7a' }}>{asset.location}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', textAlign: 'right' }}>{asset.purchaseValue.toLocaleString()}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          ...getStatusBadgeStyle(asset.status)
                        }}>{asset.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      );
    }

    // 7. MANTENIMIENTO
    if (selectedReportType === 'Mantenimiento' && Array.isArray(reportData)) {
      return (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', padding: '1.5rem', overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#263238' }}>Historial de Inspecciones e Informes Técnicos de Mantenimiento</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#37474f', color: '#fff', borderBottom: '2px solid #cfd8dc' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Fecha Inspección</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Código QR</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Nombre / Descripción</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Diagnóstico Técnico</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem' }}>Costo Est. ($us)</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>Acción Recomendada</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#78909c' }}>No se registran informes técnicos de inspección actualmente.</td>
                </tr>
              ) : (
                reportData.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#546e7a' }}>
                      {item.inspectedAt ? new Date(item.inspectedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e88e5' }}>{item.assetCode || 'N/A'}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{item.assetName || 'N/A'}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f', fontStyle: 'italic' }}>"{item.diagnosis || ''}"</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>
                      ${typeof item.estimatedCost === 'number' ? item.estimatedCost.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: item.action === 'Recomendar_Baja' ? '#ffebee' : '#e8f5e9',
                        color: item.action === 'Recomendar_Baja' ? '#c62828' : '#2e7d32'
                      }}>{(item.action || '').replace('_', ' ')}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // 8. BAJAS
    if (selectedReportType === 'Bajas' && Array.isArray(reportData)) {
      return (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', padding: '1.5rem', overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#263238' }}>Historial de Bajas Registradas (Normativa SABS)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#37474f', color: '#fff', borderBottom: '2px solid #cfd8dc' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Fecha Solicitud</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Activo QR</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Nombre del Activo</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Justificación de Baja</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Informe de Evidencia</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>Estado Trámite</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{new Date(item.initiatedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e88e5' }}>{item.assetCode}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{item.assetName}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#546e7a', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.justification}>
                    {item.justification}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}>📄 {item.evidence}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      ...getStatusBadgeStyle(item.status)
                    }}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 9. TRANSFERENCIAS
    if (selectedReportType === 'Transferencias' && Array.isArray(reportData)) {
      return (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', padding: '1.5rem', overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#263238' }}>Historial de Traslados y Transferencias</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#37474f', color: '#fff', borderBottom: '2px solid #cfd8dc' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Fecha</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Activo QR</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Descripción del Activo</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Origen → Destino</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem' }}>Responsables</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eceff1' }}>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{new Date(item.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e88e5' }}>{item.assetCode}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#37474f' }}>{item.assetName}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#546e7a' }}>
                    <span style={{ fontWeight: '500' }}>{item.fromUnit}</span> → <span style={{ fontWeight: '500' }}>{item.toUnit}</span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.8rem', color: '#78909c' }}>
                    De: {item.fromResponsible} <br /> A: {item.toResponsible}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      ...getStatusBadgeStyle(item.status)
                    }}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '80vh' }}>
      
      {/* 1. INITIAL STATE */}
      {viewState === 'initial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="action-bar">
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238' }}>📈 Reportes y Análisis</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>Visualice estadísticas y tendencias de los activos fijos</p>
            </div>
            <button className="btn-primary" onClick={() => setViewState('config')}>
              Configurar Reporte
            </button>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '8rem 2rem',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #cfd8dc',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: '#1e88e5'
            }}>
              📊
            </div>
            <h3 style={{ margin: 0, color: '#263238', fontSize: '1.3rem' }}>Sin reporte configurado</h3>
            <p style={{ margin: 0, color: '#78909c', fontSize: '0.95rem', maxWidth: '400px' }}>
              Configure un reporte para visualizar estadísticas específicas sobre los activos de la universidad.
            </p>
            <button className="btn-primary" onClick={() => setViewState('config')} style={{ marginTop: '0.5rem' }}>
              Configurar Primer Reporte
            </button>
          </div>
        </div>
      )}

      {/* 2. CONFIGURATION PANEL STATE */}
      {viewState === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238' }}>📈 Reportes y Análisis</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>Visualice estadísticas y tendencias de los activos fijos</p>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', border: '1px solid #cfd8dc' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#263238', fontSize: '1.2rem' }}>Configuración de Reporte</h3>
            <p style={{ margin: '0 0 2rem 0', color: '#78909c', fontSize: '0.9rem' }}>Seleccione el tipo y los filtros que desea aplicar</p>

            <label style={{ fontWeight: '600', color: '#37474f', display: 'block', marginBottom: '1rem' }}>Tipo de Reporte *</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              {reportTypes.map((type) => {
                const isSelected = selectedReportType === type.name;
                return (
                  <div
                    key={type.name}
                    onClick={() => setSelectedReportType(type.name)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #1e88e5' : '1px solid #cfd8dc',
                      backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '1.8rem' }}>{type.icon}</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#263238' }}>{type.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#78909c' }}>{type.desc}</span>
                    </div>
                    {isSelected && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        color: '#1e88e5',
                        fontSize: '0.8rem'
                      }}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Filtros de Categoría, Ubicación y Fechas */}
            <div style={{
              border: '1px solid #cfd8dc',
              borderRadius: '8px',
              padding: '1.25rem',
              backgroundColor: '#f8f9fa',
              marginBottom: '2.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem'
            }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#37474f' }}>Fecha Desde</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid #cfd8dc', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#37474f' }}>Fecha Hasta</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid #cfd8dc', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#37474f' }}>Ubicación / Sede</label>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid #cfd8dc', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#fff' }}
                >
                  <option value="Todas">Todas las ubicaciones</option>
                  {validLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setViewState(reportData ? 'dashboard' : 'initial')} style={{ backgroundColor: '#c62828', color: '#fff' }}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleGenerateReport} disabled={isLoading} style={{ backgroundColor: '#2e7d32', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isLoading ? 'Generando...' : '📊 Generar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. GENERATED DASHBOARD RESULTS STATE */}
      {viewState === 'dashboard' && reportData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Dashboard Header */}
          <div className="action-bar" style={{ borderBottom: '1px solid #eceff1', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📊 Reporte: {selectedReportType}
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.85rem' }}>
                {generationTime}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => setViewState('config')} style={{ backgroundColor: '#1e88e5', color: '#fff' }}>
                🔄 Configurar Reporte
              </button>
              <button className="btn-primary" onClick={handleExportCSV} style={{ backgroundColor: '#ff9800', color: '#fff' }}>
                📥 Exportar Excel / CSV
              </button>
              <button className="btn-primary" onClick={handleExportPDF} style={{ backgroundColor: '#2e7d32', color: '#fff' }}>
                📥 Exportar PDF / Imprimir
              </button>
            </div>
          </div>

          {/* Dynamic Content Rendering */}
          {renderReportContent()}

        </div>
      )}

    </div>
  );
};
