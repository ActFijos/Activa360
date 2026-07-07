import React, { useState } from 'react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (qrCode: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    if (!manualCode.trim()) {
      setError('Por favor ingrese o seleccione un código QR.');
      return;
    }
    onScanSuccess(manualCode.trim());
    onClose();
  };

  const handleQuickSelect = (code: string) => {
    onScanSuccess(code);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#90a4ae' }}
        >
          ×
        </button>

        <h3 style={{ margin: '0 0 1rem 0', color: '#263238', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📷 Escáner de Código QR
        </h3>

        {/* Video feed simulation */}
        <div style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#263238',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#eceff1',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '1.25rem',
          border: '2px solid #b0bec5'
        }}>
          {/* Laser scanning line simulation */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: '#ff1744',
            boxShadow: '0 0 8px #ff1744',
            animation: 'scanAnimation 2s infinite linear'
          }}></div>

          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
          <span style={{ fontSize: '0.8rem', color: '#b0bec5' }}>Cámara activa... Apunte al código QR</span>

          <style>{`
            @keyframes scanAnimation {
              0% { top: 10%; }
              50% { top: 90%; }
              100% { top: 10%; }
            }
          `}</style>
        </div>

        {/* Fallback manual input / simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {error && (
            <div style={{ color: '#c62828', fontSize: '0.8rem', fontWeight: '500' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: '#546e7a', fontWeight: 'bold' }}>Simular lectura (Escribir QR):</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Ej: QR-UMSS-2026-0482"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setError(null);
                }}
                style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #cfd8dc', borderRadius: '6px', fontSize: '0.85rem' }}
              />
              <button 
                type="button" 
                onClick={handleSimulateScan}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#1e88e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                Escanear
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eceff1', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#78909c', display: 'block', marginBottom: '0.4rem', fontWeight: 'bold' }}>Atajos de prueba:</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => handleQuickSelect('UMSS-COMP-001')}
                style={{ padding: '0.3rem 0.6rem', border: '1px solid #cfd8dc', borderRadius: '15px', fontSize: '0.75rem', backgroundColor: '#f5f5f5', cursor: 'pointer' }}
              >
                Laptop i7
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickSelect('UMSS-COMP-002')}
                style={{ padding: '0.3rem 0.6rem', border: '1px solid #cfd8dc', borderRadius: '15px', fontSize: '0.75rem', backgroundColor: '#f5f5f5', cursor: 'pointer' }}
              >
                Impresora HP
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickSelect('QR-NUEVO-099')}
                style={{ padding: '0.3rem 0.6rem', border: '1px solid #cfd8dc', borderRadius: '15px', fontSize: '0.75rem', backgroundColor: '#f5f5f5', cursor: 'pointer' }}
              >
                Código Nuevo
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid #eceff1', paddingTop: '1rem' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#f5f5f5', color: '#37474f', border: '1px solid #cfd8dc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
