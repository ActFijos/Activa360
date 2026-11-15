import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { QRScannerModal } from '../components/QRScannerModal';

const bajaSchema = z.object({
  assetId: z.string().min(1, 'Debe seleccionar un activo para dar de baja.'),
  justification: z.string().min(15, 'La justificación debe tener al menos 15 caracteres contables.'),
  evidence: z.string().min(5, 'Debe ingresar la referencia de acta o evidencia de soporte (min. 5 caract.).'),
  jefeId: z.string().min(1, 'Debe seleccionar un supervisor o jefe autorizado.'),
  date: z.string().refine(val => {
    if (!val) return false;
    const dateVal = new Date(val);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // timezone offset buffer
    return dateVal <= today;
  }, 'La fecha de baja no puede ser una fecha futura.'),
});

interface Baja {
  id: string;
  assetId: string;
  date: string;
  description: string;
  code: string;
  unit: string;
  responsible: string;
  reason: string;
  approvedBy: string;
  status: string;
  evidence: string;
  motivoRechazo?: string | null;
}

interface Employee {
  id: string;
  fullName: string;
  cargo?: string;
  role: string;
}

interface Asset {
  id: string;
  qrCode: string;
  name: string;
  status: string;
  location: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const Bajas: React.FC = () => {
  const [bajas, setBajas] = useState<Baja[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Print state
  const [activeActa, setActiveActa] = useState<Baja | null>(null);

  // Feature 1: Filter states
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterActivo, setFilterActivo] = useState<string>('');
  const [filterFechaDesde, setFilterFechaDesde] = useState<string>('');
  const [filterFechaHasta, setFilterFechaHasta] = useState<string>('');

  // Feature 2: Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limitPerPage, setLimitPerPage] = useState<number>(10);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Feature 3: Rejection modal state
  const [rejectingBaja, setRejectingBaja] = useState<Baja | null>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState<string>('');
  const [rejectModalError, setRejectModalError] = useState<string | null>(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState<boolean>(false);

  // Form search and selection states
  const [searchAssetQuery, setSearchAssetQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Form states matching backend entity
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    justification: '',
    evidence: '',
    jefeId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterEstado) queryParams.append('estado', filterEstado);
      if (filterActivo.trim()) queryParams.append('activo', filterActivo.trim());
      if (filterFechaDesde) queryParams.append('fechaDesde', new Date(filterFechaDesde + 'T00:00:00.000Z').toISOString());
      if (filterFechaHasta) queryParams.append('fechaHasta', new Date(filterFechaHasta + 'T23:59:59.999Z').toISOString());
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', limitPerPage.toString());

      const [assetsRes, employeesRes, bajasRes] = await Promise.all([
        fetch('http://localhost:3000/activos'),
        fetch('http://localhost:3000/activos/empleados'),
        fetch(`http://localhost:3000/bajas?${queryParams.toString()}`),
      ]);

      let bajasData: any[] = [];
      if (bajasRes.ok) {
        const json = await bajasRes.json();
        if (Array.isArray(json)) {
          bajasData = json;
          setPaginationMeta({
            total: json.length,
            page: 1,
            limit: json.length || 10,
            totalPages: 1,
          });
        } else if (json && json.data) {
          bajasData = json.data;
          if (json.meta) {
            setPaginationMeta(json.meta);
          }
        }
      }

      let allAssets: Asset[] = [];
      try {
        if (assetsRes.ok) {
          allAssets = await assetsRes.json();
          // Filter out assets that are NOT Dañado/Obsoleto, or that ALREADY have an active/approved Baja request
          const available = allAssets.filter(
            (a: Asset) => (a.status === 'Dañado' || a.status === 'Obsoleto') &&
                          !bajasData.some((b: any) => b.assetId === a.id && b.status !== 'RECHAZADA')
          );
          setAssets(available);
        }
      } catch (e) {
        console.error('Error parsing assets', e);
      }

      let allEmployees: Employee[] = [];
      try {
        if (employeesRes.ok) {
          allEmployees = await employeesRes.json();
          setEmployees(allEmployees);
        }
      } catch (e) {
        console.error('Error parsing employees', e);
      }

      try {
        const mapped = bajasData.map((b: any) => {
          const assetObj = allAssets.find(as => as.id === b.assetId);
          const jefeObj = allEmployees.find(em => em.id === b.jefeId);
          
          let dateStr = new Date().toISOString().split('T')[0];
          if (b.initiatedAt) {
            const d = new Date(b.initiatedAt);
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
            }
          }

          return {
            id: b.id,
            assetId: b.assetId,
            date: dateStr,
            description: assetObj ? assetObj.name : 'Activo Desconocido',
            code: assetObj ? assetObj.qrCode : 'S/QR',
            unit: assetObj ? assetObj.location : 'Almacén de Bajas',
            responsible: assetObj ? assetObj.location : 'Sin asignar',
            reason: b.justification,
            approvedBy: jefeObj ? jefeObj.fullName : 'Supervisor Autorizado',
            status: b.status,
            evidence: b.evidence,
            motivoRechazo: b.motivoRechazo || null,
          };
        });
        setBajas(mapped);
      } catch (e) {
        console.error('Error parsing mapped bajas', e);
      }
    } catch (error) {
      console.error('Error cargando datos para bajas', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterEstado, filterActivo, filterFechaDesde, filterFechaHasta, currentPage, limitPerPage]);

  const handleClearFilters = () => {
    setFilterEstado('');
    setFilterActivo('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setCurrentPage(1);
  };

  const validateField = (name: string, value: any) => {
    try {
      const fieldSchema = (bajaSchema.shape as any)[name];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          const errMsg = result.error.issues[0]?.message || 'Entrada inválida';
          setFormErrors(prev => ({ ...prev, [name]: errMsg }));
        } else {
          setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleOpenModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      justification: '',
      evidence: '',
      jefeId: '',
    });
    setSelectedAsset(null);
    setSearchAssetQuery('');
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setSearchAssetQuery(`${asset.qrCode} - ${asset.name}`);
    setFormErrors(prev => {
      const next = { ...prev };
      delete next.assetId;
      return next;
    });
  };

  const handleScanSuccess = async (scannedQr: string) => {
    try {
      const res = await fetch(`http://localhost:3000/activos/qr/${scannedQr}`);
      if (res.ok) {
        const asset = await res.json();
        if (asset.status !== 'Dañado' && asset.status !== 'Obsoleto') {
          setSubmitError('⚠️ El activo debe encontrarse en estado Dañado u Obsoleto (Inspeccionado) para iniciar la baja.');
          setSelectedAsset(null);
        } else {
          setSelectedAsset(asset);
          setSearchAssetQuery(`${asset.qrCode} - ${asset.name}`);
          setSubmitError(null);
          setFormErrors(prev => {
            const next = { ...prev };
            delete next.assetId;
            return next;
          });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const dataToValidate = {
      assetId: selectedAsset?.id || '',
      justification: formData.justification,
      evidence: formData.evidence,
      jefeId: formData.jefeId,
      date: formData.date,
    };

    const result = bajaSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      setSubmitError('Por favor complete todos los datos requeridos correctamente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3000/bajas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: selectedAsset!.id,
          jefeId: formData.jefeId,
          justification: formData.justification,
          evidence: formData.evidence,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el servidor al registrar la baja.');
      }

      await loadData();
      handleCloseModal();
    } catch (err: any) {
      setSubmitError(err.message || 'Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveBaja = async (id: string) => {
    if (!window.confirm('¿Está seguro de autorizar la baja definitiva de este activo? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`http://localhost:3000/bajas/${id}/aprobar`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Baja autorizada con éxito.');
        loadData();
      } else {
        alert('Error al autorizar la baja.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión.');
    }
  };

  // Feature 3: Open rejection modal
  const handleOpenRejectModal = (baja: Baja) => {
    setRejectingBaja(baja);
    setMotivoRechazoInput('');
    setRejectModalError(null);
  };

  const handleCloseRejectModal = () => {
    setRejectingBaja(null);
    setMotivoRechazoInput('');
    setRejectModalError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBaja) return;

    if (!motivoRechazoInput.trim() || motivoRechazoInput.trim().length < 5) {
      setRejectModalError('El motivo de rechazo es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    setIsSubmittingReject(true);
    setRejectModalError(null);
    try {
      const res = await fetch(`http://localhost:3000/bajas/${rejectingBaja.id}/rechazar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivoRechazo: motivoRechazoInput.trim(),
        }),
      });

      if (res.ok) {
        handleCloseRejectModal();
        await loadData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setRejectModalError(errData.message || 'Error al procesar el rechazo de la baja.');
      }
    } catch (e: any) {
      setRejectModalError(e.message || 'Error de conexión con el servidor.');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/bajas/${id}/acta-pdf`);
      if (!res.ok) {
        let msg = 'Error al descargar el acta en PDF.';
        try {
          const err = await res.json();
          msg = err.message || msg;
        } catch (_) {}
        alert(msg);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Acta-Baja-${id.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Error de conexión al descargar el PDF.');
    }
  };

  // Autocomplete filtering for form
  const filteredAssets = searchAssetQuery.trim() === ''
    ? []
    : assets.filter(asset =>
        asset.name.toLowerCase().includes(searchAssetQuery.toLowerCase()) ||
        asset.qrCode.toLowerCase().includes(searchAssetQuery.toLowerCase())
      );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="action-bar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#263238', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#d32f2f' }}>⚠️</span> Bajas de Activos Fijos (SABS)
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#78909c', fontSize: '0.9rem' }}>
            Registro, fiscalización, filtros avanzados y control normativo de bajas patrimoniales
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenModal} style={{ backgroundColor: '#d32f2f', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          <span>+</span> Registrar Nueva Baja
        </button>
      </div>

      {/* Warning Notice Banner */}
      <div className="notice-banner no-print" style={{ backgroundColor: '#ffebee', borderLeft: '5px solid #d32f2f', padding: '0.75rem 1rem', borderRadius: '4px', color: '#c62828' }}>
        <h4 style={{ margin: '0 0 0.25rem 0' }}>Normativa D.S. 0181 - SABS</h4>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>
          La baja de un activo es definitiva e irreversible. Verifique la justificación contable y peritaje técnico antes de autorizar o rechazar.
        </p>
      </div>

      {/* Feature 1: Filter Bar */}
      <div className="filter-bar no-print" style={{ backgroundColor: '#ffffff', border: '1px solid #cfd8dc', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '0.9rem', color: '#37474f' }}>🔍 Filtros de Búsqueda</strong>
          <button
            type="button"
            onClick={handleClearFilters}
            style={{ fontSize: '0.8rem', color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Limpiar filtros
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#546e7a', marginBottom: '0.25rem' }}>Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => { setFilterEstado(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #b0bec5', fontSize: '0.85rem' }}
            >
              <option value="">Todos los Estados</option>
              <option value="INICIADA">Iniciada</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#546e7a', marginBottom: '0.25rem' }}>Buscar Activo (ID, QR o Nombre)</label>
            <input
              type="text"
              placeholder="Ej: ACT-UMSS-001 o Laptop..."
              value={filterActivo}
              onChange={(e) => { setFilterActivo(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #b0bec5', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#546e7a', marginBottom: '0.25rem' }}>Fecha Desde</label>
            <input
              type="date"
              value={filterFechaDesde}
              onChange={(e) => { setFilterFechaDesde(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #b0bec5', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#546e7a', marginBottom: '0.25rem' }}>Fecha Hasta</label>
            <input
              type="date"
              value={filterFechaHasta}
              onChange={(e) => { setFilterFechaHasta(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #b0bec5', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Compliance Write-offs List */}
      <div className="compliance-list no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {bajas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #cfd8dc', color: '#78909c', gridColumn: '1 / -1' }}>
            No se encontraron trámites de bajas con los criterios seleccionados.
          </div>
        ) : (
          bajas.map((baja) => (
            <article key={baja.id} className="compliance-card" style={{ backgroundColor: '#fff', border: '1px solid #eceff1', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
              <div>
                <div className="comp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="comp-id" style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    🗑️ BJ-{baja.id.substring(0, 6).toUpperCase()}
                  </span>
                  <span className={`badge`} style={{
                    backgroundColor: baja.status === 'APROBADA' || baja.status === 'Aprobada' ? '#e8f5e9' : baja.status === 'RECHAZADA' || baja.status === 'Rechazada' ? '#ffebee' : '#fff8e1',
                    color: baja.status === 'APROBADA' || baja.status === 'Aprobada' ? '#2e7d32' : baja.status === 'RECHAZADA' || baja.status === 'Rechazada' ? '#c62828' : '#f57f17',
                    border: '1px solid',
                    borderColor: baja.status === 'APROBADA' || baja.status === 'Aprobada' ? '#c8e6c9' : baja.status === 'RECHAZADA' || baja.status === 'Rechazada' ? '#ffcdd2' : '#ffe082',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}>
                    {baja.status}
                  </span>
                </div>
                
                <p className="comp-description" style={{ fontWeight: 'bold', margin: '0.75rem 0', color: '#263238' }}>{baja.code} - {baja.description}</p>
                
                <div className="comp-details-grid" style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#546e7a' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#90a4ae' }}>Unidad de Origen</span>
                    <strong style={{ color: '#37474f' }}>{baja.unit}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#90a4ae' }}>Evidencia SABS</span>
                    <strong style={{ fontFamily: 'monospace', color: '#37474f' }}>{baja.evidence}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', marginTop: '0.25rem' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#90a4ae' }}>Justificación</span>
                    <span style={{ fontStyle: 'italic', color: '#455a64' }}>"{baja.reason}"</span>
                  </div>
                </div>

                {/* Feature 3: Rejection Reason Display */}
                {(baja.status === 'RECHAZADA' || baja.status === 'Rechazada') && baja.motivoRechazo && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#ffebee', borderLeft: '3px solid #c62828', borderRadius: '4px', fontSize: '0.75rem' }}>
                    <strong style={{ color: '#c62828', display: 'block' }}>Motivo de Rechazo:</strong>
                    <span style={{ color: '#b71c1c', fontStyle: 'italic' }}>"{baja.motivoRechazo}"</span>
                  </div>
                )}
              </div>

              <div className="comp-footer" style={{ borderTop: '1px solid #f5f5f5', marginTop: '1rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#78909c' }}>Supervisor: <strong style={{ color: '#37474f' }}>{baja.approvedBy}</strong></span>
                
                {(baja.status === 'Iniciada' || baja.status === 'INICIADA') && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleApproveBaja(baja.id)}
                      style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#2e7d32', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✔️ Autorizar
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(baja)}
                      style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#c62828', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                )}

                {(baja.status === 'APROBADA' || baja.status === 'Aprobada') && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => setActiveActa(baja)}
                      style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      👁️ Ver Acta
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(baja.id)}
                      style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: '#1e88e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ⬇️ Descargar PDF
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Feature 2: Pagination Bar */}
      <div className="pagination-bar no-print" style={{ backgroundColor: '#fff', border: '1px solid #cfd8dc', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#546e7a' }}>
        <div>
          <span>
            Mostrando página <strong>{paginationMeta.page}</strong> de <strong>{paginationMeta.totalPages}</strong> ({paginationMeta.total} trámites en total)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Por página:</span>
            <select
              value={limitPerPage}
              onChange={(e) => { setLimitPerPage(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #b0bec5', fontSize: '0.85rem' }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              disabled={paginationMeta.page <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid #cfd8dc', backgroundColor: paginationMeta.page <= 1 ? '#f5f5f5' : '#fff', color: paginationMeta.page <= 1 ? '#b0bec5' : '#37474f', cursor: paginationMeta.page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={paginationMeta.page >= paginationMeta.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(paginationMeta.totalPages, prev + 1))}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid #cfd8dc', backgroundColor: paginationMeta.page >= paginationMeta.totalPages ? '#f5f5f5' : '#fff', color: paginationMeta.page >= paginationMeta.totalPages ? '#b0bec5' : '#37474f', cursor: paginationMeta.page >= paginationMeta.totalPages ? 'not-allowed' : 'pointer' }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {/* Feature 3: Rejection Modal */}
      {rejectingBaja && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500 }}>
          <form onSubmit={handleConfirmReject} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.75rem', width: '90%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ borderBottom: '1px solid #eceff1', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#c62828', fontSize: '1.2rem' }}>Rechazar Solicitud de Baja SABS</h3>
              <button type="button" onClick={handleCloseRejectModal} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#78909c' }}>&times;</button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#546e7a' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Está por rechazar el trámite de baja del activo: <strong>{rejectingBaja.code} - {rejectingBaja.description}</strong>.
              </p>
              <p style={{ margin: 0 }}>
                El bien retornará al inventario con su estado técnico anterior. Ingrese obligatoriamente la justificación del rechazo:
              </p>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.35rem', color: '#37474f' }}>
                Motivo de Rechazo (Mínimo 5 caracteres) *
              </label>
              <textarea
                value={motivoRechazoInput}
                onChange={(e) => setMotivoRechazoInput(e.target.value)}
                placeholder="Describa el motivo técnico por el cual no procede la baja..."
                style={{ width: '100%', minHeight: '90px', padding: '0.6rem', borderRadius: '6px', border: '1px solid #b0bec5', fontSize: '0.85rem' }}
                required
              />
            </div>

            {rejectModalError && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.8rem' }}>
                ⚠️ {rejectModalError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #eceff1', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={handleCloseRejectModal}
                disabled={isSubmittingReject}
                style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #cfd8dc', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingReject}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '4px', border: 'none', backgroundColor: '#c62828', color: '#fff', fontWeight: 'bold', cursor: isSubmittingReject ? 'not-allowed' : 'pointer' }}
              >
                {isSubmittingReject ? 'Procesando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Dialog Nueva Baja */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500 }}>
          <form className="modal-content" onSubmit={handleSubmit} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.75rem', maxWidth: '650px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #eceff1', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Registrar Baja de Activo (SABS)</h3>
              <button type="button" className="close-btn" onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#78909c' }}>&times;</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Buscar Activo Dañado / Obsoleto *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Ingrese código o descripción del activo..."
                    value={searchAssetQuery}
                    onChange={(e) => {
                      setSearchAssetQuery(e.target.value);
                      if (selectedAsset) {
                        setSelectedAsset(null);
                        validateField('assetId', '');
                      }
                    }}
                    style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '6px', border: formErrors.assetId ? '1px solid #d32f2f' : '1px solid #b0bec5' }}
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
                {formErrors.assetId && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.assetId}</span>
                )}

                {/* Suggestions Autocomplete */}
                {!selectedAsset && searchAssetQuery.trim() !== '' && (
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
                    {filteredAssets.length === 0 ? (
                      <div style={{ padding: '0.75rem', color: '#78909c', fontSize: '0.9rem' }}>
                        No se encontraron activos recomendados para baja.
                      </div>
                    ) : (
                      filteredAssets.map(asset => (
                        <div
                          key={asset.id}
                          onClick={() => handleSelectAsset(asset)}
                          style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #eceff1', fontSize: '0.85rem' }}
                        >
                          <strong style={{ color: '#1565c0' }}>[{asset.qrCode}]</strong> {asset.name}
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#78909c' }}>
                            Ubicación: {asset.location} | Estado: {asset.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedAsset && (
                <div style={{ padding: '0.75rem', backgroundColor: '#efebe9', border: '1px solid #d7ccc8', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#5d4037', display: 'block', marginBottom: '0.25rem' }}>Activo seleccionado para Baja:</strong>
                  <strong>Descripción:</strong> {selectedAsset.name} | <strong>Ubicación Actual:</strong> {selectedAsset.location} | <strong>Estado:</strong> {selectedAsset.status}
                </div>
              )}

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Fecha de Baja *</label>
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: formErrors.date ? '1px solid #d32f2f' : '1px solid #b0bec5' }}
                    required
                  />
                  {formErrors.date && (
                    <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.date}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Autorizado Por (Supervisor) *</label>
                  <select 
                    name="jefeId" 
                    value={formData.jefeId} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: formErrors.jefeId ? '1px solid #d32f2f' : '1px solid #b0bec5' }}
                    required
                  >
                    <option value="">Seleccione supervisor...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.cargo || emp.role})
                      </option>
                    ))}
                  </select>
                  {formErrors.jefeId && (
                    <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.jefeId}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Evidencia / Acta Soporte Físico (Código de Documento) *</label>
                <input 
                  type="text" 
                  name="evidence"
                  placeholder="Ej: ACTA-BAJA-2026-FCT-012 o INF-TEC-103"
                  value={formData.evidence}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: formErrors.evidence ? '1px solid #d32f2f' : '1px solid #b0bec5' }}
                  required
                />
                {formErrors.evidence && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.evidence}</span>
                )}
              </div>

              <div className="form-group">
                <label>Justificación del Proceso *</label>
                <textarea 
                  name="justification"
                  placeholder="Escriba el detalle técnico contable que justifica la baja definitiva del activo..."
                  value={formData.justification}
                  onChange={handleChange}
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: formErrors.justification ? '1px solid #d32f2f' : '1px solid #b0bec5', borderRadius: '6px', fontSize: '0.9rem' }}
                  required
                />
                {formErrors.justification && (
                  <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.justification}</span>
                )}
              </div>

            </div>

            {submitError && (
              <div style={{ color: '#d32f2f', fontSize: '0.85rem', marginTop: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                ⚠️ {submitError}
              </div>
            )}

            <div className="modal-footer" style={{ borderTop: '1px solid #eceff1', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #cfd8dc', backgroundColor: '#fff', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ backgroundColor: '#d32f2f', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? 'Registrando...' : 'Registrar Baja'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Acta de Baja Modal Template */}
      {activeActa && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '750px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', backgroundColor: '#fff', borderRadius: '8px' }}>
            
            {/* Action buttons (hidden on print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eceff1', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Vista Previa de Acta de Baja</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveActa(null)} style={{ padding: '0.5rem 1rem', backgroundColor: '#c62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cerrar
                </button>
                <button type="button" className="btn-secondary" onClick={triggerPrint} style={{ padding: '0.5rem 1rem', backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                  🖨️ Imprimir
                </button>
                <button type="button" className="btn-primary" onClick={() => handleDownloadPdf(activeActa.id)} style={{ padding: '0.5rem 1.25rem', backgroundColor: '#1e88e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ⬇️ Descargar PDF Oficial
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div className="print-section" style={{ color: '#000', fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>
              
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Universidad Mayor de San Simón</h2>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: '#555', textTransform: 'uppercase' }}>Dirección de Activos Fijos - SCAF</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ACTA DE BAJA SABS</div>
                  <div style={{ fontSize: '0.85rem', color: '#d32f2f', fontFamily: 'monospace' }}>EXPEDIENTE: BJ-{activeActa.id.substring(0, 8).toUpperCase()}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', textDecoration: 'underline' }}>
                  ACTA DE BAJA DEFINITIVA Y RETIRO DE BIENES
                </h1>
              </div>

              {/* Custodio Details Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', border: '1px solid #000', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                <div>
                  <strong>UNIDAD DE PROCEDENCIA:</strong> {activeActa.unit}
                </div>
                <div>
                  <strong>FECHA DE RETIRO:</strong> {new Date(activeActa.date).toLocaleDateString()}
                </div>
                <div>
                  <strong>DOCUMENTO DE RESPALDO:</strong> {activeActa.evidence}
                </div>
                <div>
                  <strong>AUTORIZADO POR:</strong> {activeActa.approvedBy}
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', textAlign: 'justify', marginBottom: '1.5rem' }}>
                La Comisión de Activos Fijos y Control de Bienes de la Universidad Mayor de San Simón certifica que se ha procedido a la desincorporación física e inventariada del siguiente bien, resolviendo su retiro de inventarios activos y disponiendo su destrucción/reciclaje final conforme al reglamento general del SABS:
              </p>

              {/* Assets Details Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', backgroundColor: '#f2f2f2' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>CÓDIGO QR / BARRAS</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>DESCRIPCIÓN DEL ACTIVO</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #000' }}>UBICACIÓN DE RETIRO</th>
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #000' }}>ESTADO DE RETIRO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #000', fontFamily: 'monospace', fontWeight: 'bold' }}>{activeActa.code}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{activeActa.description}</td>
                    <td style={{ padding: '8px', border: '1px solid #000' }}>{activeActa.unit}</td>
                    <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', color: '#c62828' }}>RETIRADO (BAJA)</td>
                  </tr>
                </tbody>
              </table>

              {/* Justification Text */}
              <div style={{ border: '1px solid #000', padding: '1rem', backgroundColor: '#fafafa', fontSize: '0.85rem', textAlign: 'justify', marginBottom: '3.5rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Justificación Técnica de la Desincorporación:</strong>
                "{activeActa.reason}"
              </div>

              {/* Signature Lines block */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '4rem', fontSize: '0.9rem' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                    <strong>Responsable de Almacén</strong>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Procesó Conforme</div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Dpto. Activos Fijos</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                    <strong>{activeActa.approvedBy}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Autorizó Conforme</div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Supervisor / Comisión Activos</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
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
