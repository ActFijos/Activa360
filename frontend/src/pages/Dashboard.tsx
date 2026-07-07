import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238' }}>Dashboard</h1>
      </div>

      {/* KPI Cards Grid */}
      <section className="cards-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Activos Totales</span>
            <span className="kpi-icon" style={{ color: '#1e88e5' }}>📦</span>
          </div>
          <p className="kpi-value">1,250</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Valor Total de Activos</span>
            <span className="kpi-icon" style={{ color: '#4caf50' }}>💵</span>
          </div>
          <p className="kpi-value">$1,500,000</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Revisiones Pendientes</span>
            <span className="kpi-icon" style={{ color: '#ff9800' }}>⚠️</span>
          </div>
          <p className="kpi-value">15</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Progreso de Inventario</span>
            <span className="kpi-icon" style={{ color: '#9c27b0' }}>📈</span>
          </div>
          <p className="kpi-value">85%</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Activos con Baja</span>
            <span className="kpi-icon" style={{ color: '#e53935' }}>🗑️</span>
          </div>
          <p className="kpi-value">45</p>
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
              <tr>
                <td>
                  <strong>Laptop Dell XPS</strong>
                  <span className="asset-badge-info">AF-001</span>
                </td>
                <td>Lab. Redes</td>
                <td>Oficina Decanato</td>
                <td>2024-07-20</td>
              </tr>
              <tr>
                <td>
                  <strong>Proyector Epson</strong>
                  <span className="asset-badge-info">AF-102</span>
                </td>
                <td>Aula 101</td>
                <td>Almacén Central</td>
                <td>2024-07-18</td>
              </tr>
              <tr>
                <td>
                  <strong>Silla Ergonómica</strong>
                  <span className="asset-badge-info">AF-340</span>
                </td>
                <td>Oficina RRHH</td>
                <td>Oficina Contabilidad</td>
                <td>2024-07-15</td>
              </tr>
              <tr>
                <td>
                  <strong>Servidor HP ProLiant</strong>
                  <span className="asset-badge-info">AF-005</span>
                </td>
                <td>Centro de Datos</td>
                <td>Mantenimiento</td>
                <td>2024-07-12</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Donut Chart */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="panel-title">Estados de Activos</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, padding: '1rem' }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Green part: 70% */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#10b981" strokeWidth="30" strokeDasharray="307.8 439.8" strokeDashoffset="0" />
              {/* Blue part: 15% */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#3b82f6" strokeWidth="30" strokeDasharray="66 439.8" strokeDashoffset="-307.8" />
              {/* Yellow/Orange part: 10% */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f59e0b" strokeWidth="30" strokeDasharray="44 439.8" strokeDashoffset="-373.8" />
              {/* Red part: 5% */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#ef4444" strokeWidth="30" strokeDasharray="22 439.8" strokeDashoffset="-417.8" />
              <circle cx="100" cy="100" r="55" fill="#ffffff" />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.8rem', color: '#546e7a', marginTop: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }}></span> Disponible (70%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></span> En Uso (15%)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.8rem', color: '#546e7a', marginTop: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></span> Reparación (10%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span> De Baja (5%)
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
