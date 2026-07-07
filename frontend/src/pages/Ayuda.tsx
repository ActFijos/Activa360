import React, { useState } from 'react';

export const Ayuda: React.FC = () => {
  // Navigation tabs: 'rapida' | 'documentacion' | 'soporte'
  const [activeTab, setActiveTab] = useState<'rapida' | 'documentacion' | 'soporte'>('documentacion');

  // Accordion states: maps key of the accordion to its open/closed boolean
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    intro: true, // Expanded by default in image21.png
    dashboard: false,
    activos: false,
    transferencias: false,
    bajas: false,
    configuracion: false,
    faq: false,
  });

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSearchChipClick = (targetAccordion: string) => {
    setActiveTab('documentacion');
    setOpenAccordions(prev => {
      const reset = Object.keys(prev).reduce((acc, k) => {
        acc[k] = false;
        return acc;
      }, {} as Record<string, boolean>);
      return {
        ...reset,
        [targetAccordion]: true
      };
    });
    // Scroll to the accordion element smoothly
    setTimeout(() => {
      const el = document.getElementById(`accordion-${targetAccordion}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const popularSearches = [
    { label: 'Registrar activo', target: 'activos' },
    { label: 'Editar activo', target: 'activos' },
    { label: 'Transferir activo', target: 'transferencias' },
    { label: 'Dar de baja', target: 'bajas' },
    { label: 'Cambiar moneda', target: 'configuracion' },
    { label: 'Ver historial', target: 'dashboard' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Title */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ❔ Centro de Ayuda
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
          Manual de usuario del Sistema de Control de Activos Fijos (SCAF)
        </p>
      </div>

      {/* Categories Cards Tabs (image21.png top) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        
        <div 
          onClick={() => setActiveTab('rapida')}
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: activeTab === 'rapida' ? '2px solid #1e88e5' : '1px solid #cfd8dc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '2rem', color: '#1e88e5' }}>🔍</div>
          <div>
            <strong style={{ display: 'block', color: '#263238', fontSize: '1rem' }}>Guía Rápida</strong>
            <span style={{ fontSize: '0.8rem', color: '#78909c' }}>Búsqueda rápida de respuestas</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('documentacion')}
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: activeTab === 'documentacion' ? '2px solid #1e88e5' : '1px solid #cfd8dc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '2rem', color: '#8e24aa' }}>📄</div>
          <div>
            <strong style={{ display: 'block', color: '#263238', fontSize: '1rem' }}>Documentación</strong>
            <span style={{ fontSize: '0.8rem', color: '#78909c' }}>Manual completo del sistema</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('soporte')}
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: activeTab === 'soporte' ? '2px solid #1e88e5' : '1px solid #cfd8dc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '2rem', color: '#f57c00' }}>💬</div>
          <div>
            <strong style={{ display: 'block', color: '#263238', fontSize: '1rem' }}>Soporte</strong>
            <span style={{ fontSize: '0.8rem', color: '#78909c' }}>Contacta con el área de sistemas</span>
          </div>
        </div>

      </div>

      {/* Tab Contents: Guía Rápida (image22.png) */}
      {activeTab === 'rapida' && (
        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0, color: '#263238', fontSize: '1.15rem' }}>🔍 Búsqueda Rápida</h3>
          
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="¿Qué necesitas hacer? Ej: registrar activo, cambiar moneda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#546e7a', display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Búsquedas populares:</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {popularSearches.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => handleSearchChipClick(chip.target)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    border: '1px solid #cfd8dc',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#37474f',
                    transition: 'all 0.2s'
                  }}
                  className="suggestion-item"
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c', marginTop: '0.75rem' }}>
              💡 Tip: Haz clic en cualquier búsqueda para ir directamente a esa sección del manual.
            </span>
          </div>
        </div>
      )}

      {/* Tab Contents: Soporte Técnico (image24.png) */}
      {activeTab === 'soporte' && (
        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #cfd8dc', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#263238', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💬 Contacto con Soporte Técnico
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.8rem' }}>Área de Sistemas - UMSS</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            
            <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>✉️</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#5d4037' }}>Correo Electrónico</strong>
                <span style={{ fontSize: '0.9rem', color: '#ff8f00', fontWeight: 'bold' }}>soporte.sistemas@umss.edu.bo</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#8d6e63' }}>Respuesta en 24-48 horas hábiles</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>📞</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#5d4037' }}>Teléfono</strong>
                <span style={{ fontSize: '0.9rem', color: '#ff8f00', fontWeight: 'bold' }}>+591 4 4234567</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#8d6e63' }}>Interno: 1500 (Área de Sistemas)</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>🕒</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#5d4037' }}>Horario de Atención</strong>
                <span style={{ fontSize: '0.85rem', color: '#3e2723', fontWeight: '500' }}>Lunes a Viernes</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#8d6e63' }}>8:00 - 12:00 y 14:30 - 18:30</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '1.8rem' }}>🏢</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#5d4037' }}>Ubicación Física</strong>
                <span style={{ fontSize: '0.85rem', color: '#3e2723', fontWeight: '500' }}>Campus Central - UMSS</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#8d6e63' }}>Edificio Administrativo, Piso 2, Oficina 215</span>
              </div>
            </div>

          </div>

          {/* Como reportar un problema recuadro azul */}
          <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '8px', padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: '#1565c0' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>📋 ¿Cómo reportar un problema?</strong>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Describe el problema detalladamente</li>
              <li>Incluye capturas de pantalla si es posible</li>
              <li>Indica en qué módulo ocurre el error (Dashboard, Gestión de Activos, etc.)</li>
              <li>Menciona tu usuario y rol en el sistema</li>
            </ul>
          </div>

          {/* Equipo de Soporte */}
          <div style={{ borderTop: '1px solid #eceff1', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#78909c', display: 'block', marginBottom: '0.75rem', fontWeight: 'bold' }}>👤 Equipo de Soporte</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div>
                <strong>Ing. Carlos Mendoza</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c' }}>Jefe de Área de Sistemas</span>
                <span style={{ fontSize: '0.8rem', color: '#1565c0' }}>carlos.mendoza@umss.edu.bo</span>
              </div>
              <div>
                <strong>Tec. Ana Torres</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c' }}>Soporte Técnico SCAF</span>
                <span style={{ fontSize: '0.8rem', color: '#1565c0' }}>ana.torres@umss.edu.bo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accordions Section: Documentación (image23.png) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Accordion 1: Introducción al Sistema */}
        <div id="accordion-intro" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('intro')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📖 Introducción al Sistema</strong>
              <span style={{ fontSize: '0.75rem', color: '#78909c', marginLeft: '1.8rem' }}>Conoce el SCAF y sus objetivos</span>
            </div>
            <span>{openAccordions.intro ? '▲' : '▼'}</span>
          </div>

          {openAccordions.intro && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #eceff1', fontSize: '0.9rem', color: '#37474f', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#263238', display: 'block', marginBottom: '0.5rem' }}>¿Qué es el SCAF?</strong>
                <p style={{ margin: 0, lineHeight: '1.5' }}>
                  El Sistema de Control de Activos Fijos (SCAF) es una herramienta diseñada para la Universidad Mayor de San Simón (UMSS) que permite gestionar, controlar y dar seguimiento a todos los activos fijos de la institución.
                </p>
              </div>

              <div>
                <strong style={{ fontSize: '0.95rem', color: '#263238', display: 'block', marginBottom: '0.5rem' }}>Objetivos del Sistema:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <li>Registrar y catalogar todos los activos fijos de la institución</li>
                  <li>Controlar las transferencias de activos entre unidades</li>
                  <li>Gestionar el proceso de bajas de activos</li>
                  <li>Generar reportes sobre el estado y ubicación de los activos</li>
                  <li>Mantener un historial completo de cada activo</li>
                </ul>
              </div>

              <div>
                <strong style={{ fontSize: '0.95rem', color: '#263238', display: 'block', marginBottom: '0.75rem' }}>Roles de Usuario:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                    <strong style={{ color: '#1565c0', display: 'block', fontSize: '0.85rem' }}>Administrador</strong>
                    <span style={{ fontSize: '0.8rem', color: '#0d47a1' }}>Acceso completo al sistema, puede configurar usuarios, roles y gestionar todos los módulos.</span>
                  </div>

                  <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                    <strong style={{ color: '#2e7d32', display: 'block', fontSize: '0.85rem' }}>Supervisor</strong>
                    <span style={{ fontSize: '0.8rem', color: '#1b5e20' }}>Supervisa las operaciones, aprueba transferencias y bajas de activos.</span>
                  </div>

                  <div style={{ backgroundColor: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                    <strong style={{ color: '#8e24aa', display: 'block', fontSize: '0.85rem' }}>Inventariador</strong>
                    <span style={{ fontSize: '0.8rem', color: '#4a148c' }}>Registra nuevos activos, realiza transferencias y actualiza información de activos.</span>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Dashboard */}
        <div id="accordion-dashboard" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('dashboard')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💻 Dashboard</strong>
              <span style={{ fontSize: '0.75rem', color: '#78909c', marginLeft: '1.8rem' }}>Panel de control principal</span>
            </div>
            <span>{openAccordions.dashboard ? '▲' : '▼'}</span>
          </div>

          {openAccordions.dashboard && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #eceff1', fontSize: '0.9rem', color: '#37474f' }}>
              <p style={{ margin: '0 0 1rem 0' }}>El panel principal ofrece una visión consolidada en tiempo real de todos los bienes de la UMSS:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li><strong>Tarjetas KPI:</strong> Total de Activos, Activos en Depósito, Asignados y Dados de Baja.</li>
                <li><strong>Ubicación Geográfica:</strong> Mapa interactivo con pines que marcan dónde fueron escaneados los QR de los activos por última vez.</li>
                <li><strong>Buscador Global:</strong> Caja de texto superior que filtra activos de inmediato por código QR o nombre.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 3: Gestión de Activos */}
        <div id="accordion-activos" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('activos')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📦 Gestión de Activos</strong>
              <span style={{ fontSize: '0.75rem', color: '#78909c', marginLeft: '1.8rem' }}>Registro y administración de activos</span>
            </div>
            <span>{openAccordions.activos ? '▲' : '▼'}</span>
          </div>

          {openAccordions.activos && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #eceff1', fontSize: '0.9rem', color: '#37474f' }}>
              <p style={{ margin: '0 0 1rem 0' }}>Esta sección permite incorporar nuevos activos fijos al catálogo de la universidad:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li><strong>Registro de Datos:</strong> Código QR, Descripción, Categoría, Origen, Fechas y Valores de Adquisición.</li>
                <li><strong>Garantías y Vida Útil:</strong> Campos configurables según las directivas del SABS.</li>
                <li><strong>Asignación de Responsables:</strong> Asocia un activo a un docente, administrativo o director de carrera.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 4: Transferencias de Activos */}
        <div id="accordion-transferencias" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('transferencias')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔄 Transferencias de Activos</strong>
              <span style={{ fontSize: '0.75rem', color: '#78909c', marginLeft: '1.8rem' }}>Mover activos entre unidades</span>
            </div>
            <span>{openAccordions.transferencias ? '▲' : '▼'}</span>
          </div>

          {openAccordions.transferencias && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #eceff1', fontSize: '0.9rem', color: '#37474f' }}>
              <p style={{ margin: '0 0 1rem 0' }}>Permite el traslado ordenado y trazable de bienes institucionales:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li><strong>Historial de Traslado:</strong> Registra la Unidad y el Responsable de origen y destino de cada movimiento.</li>
                <li><strong>Actualización Automática:</strong> Al procesar la transferencia, el activo adopta la nueva ubicación física de inmediato.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 5: Bajas de Activos */}
        <div id="accordion-bajas" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('bajas')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🗑️ Bajas de Activos</strong>
              <span style={{ fontSize: '0.75rem', color: '#78909c', marginLeft: '1.8rem' }}>Dar de baja activos del sistema</span>
            </div>
            <span>{openAccordions.bajas ? '▲' : '▼'}</span>
          </div>

          {openAccordions.bajas && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #eceff1', fontSize: '0.9rem', color: '#37474f' }}>
              <p style={{ margin: '0 0 1rem 0' }}>Gestione el retiro definitivo de bienes del balance de la universidad:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li><strong>Criterios SABS:</strong> Justificación de bajas por obsolescencia, daño técnico irreparable, robo o extravío.</li>
                <li><strong>Flujo de Aprobación:</strong> Generación del formulario de pre-baja que requiere la firma digital o aprobación del Supervisor.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 6: Configuración del Sistema */}
        <div id="accordion-configuracion" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('configuracion')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚙️ Configuración del Sistema</strong>
              <span style={{ fontSize: '0.75rem', color: '#78909c', marginLeft: '1.8rem' }}>Administrar parámetros del sistema</span>
            </div>
            <span>{openAccordions.configuracion ? '▲' : '▼'}</span>
          </div>

          {openAccordions.configuracion && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #eceff1', fontSize: '0.9rem', color: '#37474f' }}>
              <p style={{ margin: '0 0 1rem 0' }}>Configuración de catálogos y parámetros globales:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li><strong>Usuarios:</strong> Registro y control de credenciales, roles y cargos.</li>
                <li><strong>Unidades y Ambientes:</strong> Definición de facultades, carreras y aulas de la UMSS.</li>
                <li><strong>Categorías de Activos:</strong> Prefijos que rigen el etiquetado de los códigos QR.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 7: Preguntas Frecuentes */}
        <div id="accordion-faq" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cfd8dc', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('faq')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>❓ Preguntas Frecuentes</strong>
              <span style={{ fontSize: '0.75rem', color: '#78909c', marginLeft: '1.8rem' }}>Respuestas a dudas comunes</span>
            </div>
            <span>{openAccordions.faq ? '▲' : '▼'}</span>
          </div>

          {openAccordions.faq && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid #eceff1', fontSize: '0.9rem', color: '#37474f', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong>¿Quién puede autorizar una Baja SABS?</strong>
                <p style={{ margin: '0.25rem 0 0 0' }}>Únicamente el usuario con el rol de Supervisor de Inventarios puede firmar y autorizar una baja definitiva.</p>
              </div>
              <div>
                <strong>¿Cómo puedo imprimir una etiqueta QR?</strong>
                <p style={{ margin: '0.25rem 0 0 0' }}>En la sección Registro de Activos, selecciona el bien y presiona "Imprimir QR". La etiqueta se adaptará al formato estándar de impresión física.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
