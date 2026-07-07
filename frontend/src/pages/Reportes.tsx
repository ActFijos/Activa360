import React, { useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [generationTime, setGenerationTime] = useState('');

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
    try {
      const response = await fetch('http://localhost:3000/activos/reportes/estadisticas');
      if (!response.ok) {
        throw new Error('Error al generar las estadísticas del reporte');
      }
      const data = await response.json();
      setStats(data);
      
      const now = new Date();
      setGenerationTime(`Generado el ${now.toLocaleDateString()} a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setViewState('dashboard');
    } catch (error) {
      alert('Error de conexión al generar el reporte');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '80vh' }}>
      
      {/* 1. INITIAL STATE (image9.png) */}
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

      {/* 2. CONFIGURATION PANEL STATE (image10.png) */}
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

            {/* Filtros opcionales accordion placeholder */}
            <div style={{
              border: '1px solid #eceff1',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              marginBottom: '2.5rem',
              fontSize: '0.9rem',
              color: '#546e7a'
            }}>
              <span>🔍 Filtros opcionales (Categoría, Ubicación, Fechas...)</span>
              <span>▼</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setViewState(stats ? 'dashboard' : 'initial')} style={{ backgroundColor: '#c62828', color: '#fff' }}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleGenerateReport} disabled={isLoading} style={{ backgroundColor: '#2e7d32', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isLoading ? 'Generando...' : '📊 Generar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. GENERATED DASHBOARD RESULTS STATE (image11.png) */}
      {viewState === 'dashboard' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Dashboard Header */}
          <div className="action-bar" style={{ borderBottom: '1px solid #eceff1', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📦 Reporte General de Activos
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.85rem' }}>
                {generationTime}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => setViewState('config')} style={{ backgroundColor: '#1e88e5', color: '#fff' }}>
                🔄 Nuevo Reporte
              </button>
              <button className="btn-primary" onClick={handleExportPDF} style={{ backgroundColor: '#2e7d32', color: '#fff' }}>
                📥 Exportar PDF
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#e3f2fd', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center' }}>📦</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Total de Activos</span>
                <strong style={{ fontSize: '1.6rem', color: '#263238' }}>{stats.totalAssets}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#e8f5e9', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center' }}>💵</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Valor Total (Bs.)</span>
                <strong style={{ fontSize: '1.6rem', color: '#2e7d32' }}>{stats.totalValue.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#f3e5f5', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center' }}>📈</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>Depreciación Mensual (Bs.)</span>
                <strong style={{ fontSize: '1.6rem', color: '#8e24aa' }}>{stats.monthlyDepreciation.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2rem', backgroundColor: '#fff3e0', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center' }}>🔧</div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', fontWeight: '500' }}>En Mantenimiento</span>
                <strong style={{ fontSize: '1.6rem', color: '#f57c00' }}>{stats.maintenanceCount}</strong>
              </div>
            </div>

          </div>

          {/* Charts Area Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            
            {/* Chart 1: Activos por Categoría */}
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc' }}>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#263238', fontSize: '1rem', fontWeight: 'bold' }}>Activos por Categoría</h4>
              
              {/* SVG Bar Chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                {stats.categoryDistribution.map((cat, idx) => {
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
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, gap: '2rem' }}>
                {/* SVG Donut Chart */}
                <svg width="150" height="150" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e8f5e9" strokeWidth="4"></circle>
                  
                  {/* Dynamic slices based on active vs inactive status */}
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

                    // Dash calculations
                    const stroke1 = activePct;
                    const stroke2 = maintPct;
                    const stroke3 = obsoletePct;

                    return (
                      <>
                        {/* Activos (Green) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#2e7d32" strokeWidth="4.2" 
                                strokeDasharray={`${stroke1} ${100 - stroke1}`} strokeDashoffset="0"></circle>
                        {/* En Mantenimiento (Orange) */}
                        {stroke2 > 0 && (
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f57c00" strokeWidth="4.2" 
                                  strokeDasharray={`${stroke2} ${100 - stroke2}`} strokeDashoffset={`-${stroke1}`}></circle>
                        )}
                        {/* Inactivos/Obsoletos (Grey) */}
                        {stroke3 > 0 && (
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#78909c" strokeWidth="4.2" 
                                  strokeDasharray={`${stroke3} ${100 - stroke3}`} strokeDashoffset={`-${stroke1 + stroke2}`}></circle>
                        )}
                      </>
                    );
                  })()}
                </svg>

                {/* Donut Legends */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#2e7d32' }}></span>
                    <span>Activo ({Math.round(((stats.statusDistribution.find(s => s.name === 'Nuevo')?.value || 0) + (stats.statusDistribution.find(s => s.name === 'Asignado')?.value || 0)) / (stats.totalAssets || 1) * 100)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f57c00' }}></span>
                    <span>En Mantenimiento ({Math.round((stats.statusDistribution.find(s => s.name === 'Dañado')?.value || 0) / (stats.totalAssets || 1) * 100)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#78909c' }}></span>
                    <span>Inactivo ({Math.round((stats.statusDistribution.find(s => s.name === 'Obsoleto')?.value || 0) / (stats.totalAssets || 1) * 100)}%)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Chart 3: Valor y Depreciación (Line Graph) */}
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc' }}>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#263238', fontSize: '1rem', fontWeight: 'bold' }}>Valor y Depreciación Acumulada</h4>
              
              <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #cfd8dc', borderLeft: '1px solid #cfd8dc', padding: '1rem', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.75rem', color: '#78909c' }}>Bs. {stats.totalValue.toLocaleString()}</span>
                
                {/* SVG trend line path simulation */}
                <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
                  <path d="M 0 45 L 20 40 L 40 38 L 60 30 L 80 25 L 100 20" fill="none" stroke="#2e7d32" strokeWidth="2"></path>
                  <path d="M 0 45 L 20 42 L 40 41 L 60 36 L 80 34 L 100 32" fill="none" stroke="#f57c00" strokeWidth="2"></path>
                </svg>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', position: 'absolute', bottom: '-22px', left: 0, right: 0, fontSize: '0.7rem', color: '#78909c', padding: '0 1rem' }}>
                  <span>Ene</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.8rem', marginTop: '2rem' }}>
                <span style={{ color: '#2e7d32' }}>— Valor Original</span>
                <span style={{ color: '#f57c00' }}>— Valor Depreciado</span>
              </div>
            </div>

            {/* Chart 4: Activos por Ubicación (Horizontal bar chart) */}
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cfd8dc' }}>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#263238', fontSize: '1rem', fontWeight: 'bold' }}>Activos por Ubicación (Top 5)</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.locationDistribution.slice(0, 5).map((loc) => {
                  const maxVal = Math.max(...stats.locationDistribution.map(l => l.value)) || 1;
                  const widthPct = (loc.value / maxVal) * 100;
                  return (
                    <div key={loc.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#37474f' }}>
                        <span>{loc.name}</span>
                        <strong>{loc.value}</strong>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#f1f3f4', height: '14px', borderRadius: '3px' }}>
                        <div style={{
                          width: `${widthPct}%`,
                          backgroundColor: '#2e7d32',
                          height: '100%',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease-out'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
