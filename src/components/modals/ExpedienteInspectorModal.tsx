import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, FileText, Download, Trash2, Plus, Loader2, Play
} from 'lucide-react';
import { AlertErr } from '../ui/Alerts';
import { Btn } from '../ui/Btn';
import type { DetalleCaso } from '../../lib/types';

export function ExpedienteInspectorModal({
  casoId,
  onClose,
  onTramitar
}: {
  casoId: string;
  onClose: () => void;
  onTramitar: (id: string) => void;
}) {
  const [detalle, setDetalle] = useState<DetalleCaso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const archivosValidos = useMemo(() => {
    return (detalle?.archivos || []).filter(a => {
      const nm = (a.name || '').toLowerCase();
      return !nm.endsWith('.json') && nm !== 'resultado_esperado.txt' && !nm.startsWith('.');
    });
  }, [detalle?.archivos]);

  const cargarDetalle = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(casoId)}/detalle`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDetalle(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los detalles del expediente');
    } finally {
      setLoading(false);
    }
  }, [casoId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const handleUploadMissing = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const res = await fetch(`/api/caso/${casoId}/adjuntar`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDetalle(data.detalle);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEliminarArchivo = async (filename: string) => {
    if (!window.confirm(`¿Desea eliminar el archivo "${filename}" del expediente?`)) return;
    try {
      const res = await fetch(`/api/caso/${casoId}/archivo/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDetalle(data.detalle);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getProcedimientoNombre = (tipo?: string) => {
    switch (tipo) {
      case 'dietas': return 'Dietas y Comisiones de Servicio';
      case 'pago_proveedor': return 'Pago a Proveedor y Facturas';
      case 'honorarios': return 'Abono de Honorarios Docentes';
      case 'adquisiciones': return 'Contratos Menores y Suministros';
      default: return tipo || 'General';
    }
  };

  const getNormativaNombre = (tipo?: string) => {
    switch (tipo) {
      case 'dietas': return 'R.D. 462/2002 · Art. 32 Bases Ejecución Presupuestos UEx 2026';
      case 'pago_proveedor': return 'Normativa SGTRI · Instrucción de Pagos con Tarjeta Investigador UEx';
      case 'honorarios': return 'Art. 19.4 Bases de Ejecución UEx 2026 (Límite 300 €/h) · Ley IRPF';
      case 'adquisiciones': return 'Art. 30 Bases UEx · LCSP (< 15.000 € en servicios y suministros)';
      default: return 'Bases de Ejecución Presupuestos UEx 2026';
    }
  };

  return (
    <div onClick={onClose} className="modal-backdrop">
      <div onClick={e => e.stopPropagation()} className="modal-dialog" style={{ maxWidth: '780px' }}>

        {/* 1. CABECERA: IDENTIFICACIÓN Y ESTADO */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expediente de gasto</span>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>·</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{getProcedimientoNombre(detalle?.tipo)}</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: 0 }}>
              {casoId}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="uex-theme-btn"
            title="Cerrar modal"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* CUERPO AGRUPADO EN SECCIONES CLARAS */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13px' }}>Cargando datos y cotejo normativo...</span>
            </div>
          ) : error ? (
            <AlertErr msg={error} />
          ) : detalle && (
            <>
              {/* SECCIÓN 1: DATOS ADMINISTRATIVOS Y MARCO NORMATIVO */}
              <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Órgano gestor</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                    SGTRI · Universidad de Extremadura
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estado preceptivo</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '13px', fontWeight: 500 }}>
                    <span 
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: detalle.estado_validacion === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ color: detalle.estado_validacion === 'error' ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                      {detalle.estado_validacion === 'error' ? 'Incompleto (Faltan obligatorios)' : 'Conforme para liquidación'}
                    </span>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Normativa de aplicación</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {getNormativaNombre(detalle.tipo)}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DOCUMENTACIÓN APORTADA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0 }}>
                    Documentación aportada ({archivosValidos.length})
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Digitalizada en servidor</span>
                </div>

                {archivosValidos.length === 0 ? (
                  <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No hay documentos asociados a este expediente.
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    {archivosValidos.map((archivo, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          borderBottom: idx < archivosValidos.length - 1 ? '1px solid var(--border-color)' : 'none',
                          backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, paddingRight: '8px' }}>
                          <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{archivo.name}</span>
                            <span style={{ color: 'var(--text-faint)', marginLeft: '8px', fontSize: '11px' }}>
                              {(archivo.size / 1024).toFixed(0)} KB · {archivo.categoria}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <a
                            href={`/api/caso/${casoId}/archivo/${encodeURIComponent(archivo.name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            title="Descargar documento"
                          >
                            <Download size={11} />
                            <span>Descargar</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleEliminarArchivo(archivo.name)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--color-danger)' }}
                            title="Eliminar archivo"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Zona discreta para adjuntar */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '8px 12px',
                    border: '1px dashed var(--border-hover)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                    onChange={handleUploadMissing}
                    style={{ display: 'none' }}
                  />
                  {uploading ? (
                    <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo archivo...</>
                  ) : (
                    <><Plus size={13} /> Adjuntar documento complementario a este expediente</>
                  )}
                </div>
              </div>

              {/* SECCIÓN 3: CHECKLIST Y VALIDACIONES PRECEPTIVAS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0 }}>
                  Comprobaciones normativas y preceptivas
                </h4>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Requisito preceptivo</th>
                        <th style={{ width: '120px' }}>Carácter</th>
                        <th style={{ width: '120px', textAlign: 'right' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.requisitos.map((req) => (
                        <tr key={req.id}>
                          <td style={{ color: 'var(--text-primary)' }}>
                            {req.label}
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {req.obligatorio ? 'Obligatorio' : 'Opcional'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                              <span 
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: req.cumplido ? 'var(--color-success)' : req.obligatorio ? 'var(--color-danger)' : 'var(--color-warning)',
                                  flexShrink: 0
                                }}
                              />
                              <span style={{ color: req.cumplido ? 'var(--color-success-text)' : req.obligatorio ? 'var(--color-danger-text)' : 'var(--color-warning-text)' }}>
                                {req.cumplido ? 'Acreditado' : req.obligatorio ? 'Ausente' : 'Pendiente'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* PIE: ACCIONES DISPONIBLES */}
        <div className="modal-footer">
          <Btn variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Btn>

          <Btn
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              onTramitar(casoId);
            }}
            disabled={loading}
          >
            <Play size={12} style={{ fill: 'currentColor' }} />
            <span>Tramitar este expediente</span>
          </Btn>
        </div>

      </div>
    </div>
  );
}
