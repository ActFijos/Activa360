import React, { useState, useEffect } from 'react';

export const ConfiguracionGeneral: React.FC = () => {
  const [currency, setCurrency] = useState('BOB - Boliviano');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY (31/12/2024)');
  const [language, setLanguage] = useState('Español');
  const [showNotification, setShowNotification] = useState(false);

  // Load configuration from local storage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('cfg_currency');
    const savedDateFormat = localStorage.getItem('cfg_dateFormat');
    const savedLanguage = localStorage.getItem('cfg_language');
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedDateFormat) setDateFormat(savedDateFormat);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  const handleSave = () => {
    localStorage.setItem('cfg_currency', currency);
    localStorage.setItem('cfg_dateFormat', dateFormat);
    localStorage.setItem('cfg_language', language);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleReset = () => {
    setCurrency('BOB - Boliviano');
    setDateFormat('DD/MM/YYYY (31/12/2024)');
    setLanguage('Español');
    localStorage.removeItem('cfg_currency');
    localStorage.removeItem('cfg_dateFormat');
    localStorage.removeItem('cfg_language');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚙️ Configuración General
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
          Personaliza las preferencias del sistema
        </p>
      </div>

      {showNotification && (
        <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
          ✓ Configuración guardada correctamente
        </div>
      )}

      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div className="form-group">
          <label>Tipo de Moneda</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}>
            <option value="BOB - Boliviano">BOB - Boliviano</option>
            <option value="USD - Dólar Estadounidense">USD - Dólar Estadounidense</option>
          </select>
        </div>

        <div className="form-group">
          <label>Formato de Fecha</label>
          <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}>
            <option value="DD/MM/YYYY (31/12/2024)">DD/MM/YYYY (31/12/2024)</option>
            <option value="MM/DD/YYYY (12/31/2024)">MM/DD/YYYY (12/31/2024)</option>
            <option value="YYYY-MM-DD (2024-12-31)">YYYY-MM-DD (2024-12-31)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Idioma del Sistema</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}>
            <option value="Español">Español</option>
            <option value="Inglés">Inglés</option>
          </select>
        </div>

        {/* Vista Previa box */}
        <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '8px', padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#1565c0' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Vista Previa</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div><strong>Moneda:</strong> {currency.split(' - ')[0]}</div>
            <div><strong>Fecha:</strong> {dateFormat.includes('DD/MM/YYYY') ? '31/12/2024' : dateFormat.includes('MM/DD/YYYY') ? '12/31/2024' : '2024-12-31'}</div>
            <div><strong>Idioma:</strong> {language}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid #eceff1', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn-secondary" onClick={handleReset} style={{ backgroundColor: '#c62828', color: '#fff' }}>
            Restablecer
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} style={{ backgroundColor: '#2e7d32', color: '#fff' }}>
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
};
