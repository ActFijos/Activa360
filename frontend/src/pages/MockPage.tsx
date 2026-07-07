import React from 'react';
import { useLocation } from 'react-router-dom';

export const MockPage: React.FC = () => {
  const location = useLocation();
  const pageName = location.pathname.substring(1).toUpperCase() || 'PÁGINA';

  return (
    <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #eceff1', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
      <h2 style={{ color: '#263238', margin: '0 0 0.5rem 0' }}>Módulo {pageName}</h2>
      <p style={{ color: '#78909c', margin: 0 }}>Esta sección del prototipo de Figma está lista para ser conectada con la lógica de base de datos.</p>
    </div>
  );
};
