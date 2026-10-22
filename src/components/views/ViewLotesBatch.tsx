import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderArchive, Play, Loader2, Download, FileText,
  RefreshCw, Eye, X, Check, FileCheck
} from 'lucide-react';
import { cn, pollTask, fmtEur } from '../../lib/utils';
import { Btn } from '../ui/Btn';
import { AlertErr } from '../ui/Alerts';

interface LoteInfo {
  id: string;
  ruta: string;
  tiene_contexto_comun: boolean;
  investigador: string;
  organica: string;
  proyecto: string;
  total_expedientes: number;
  expedientes: string[];
  procesado: boolean;
}

interface ResumenLote {
  timestamp?: string;
  directorio_raiz?: string;
  total_expedientes: number;
  importe_total_acumulado: number;
  datos_comunes_proyecto?: {
    investigador?: string;
    organica?: string;
    referencia_proyecto?: string;
    num_tarjeta?: string;
    forma_pago?: string;
    tipo_gasto?: string;
    centro?: string;
    campus?: string;
  };
  expedientes: Array<{
    expediente_id: string;
    tipo_procedimiento: string;
    caso_especifico?: string;
    esquema_extraccion?: string;
    proveedor?: string;
    beneficiario?: string;
    objeto?: string;
    importe: number;
    avisos_normativa?: string[];
    estado_validacion?: string;
    documentos_generados?: Record<string, string>;
  }>;
  markdown?: string;
}

export function ViewLotesBatch() {
  const [lotes, setLotes] = useState<LoteInfo[]>([]);
  const [selectedLote, setSelectedLote] = useState<string>('');
  const [loadingLotes, setLoadingLotes] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenLote | null>(null);
  const [loadingResumen, setLoadingResumen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [vistaModo, setVistaModo] = useState<'tabla' | 'informe_md'>('tabla');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<{ url: string; titulo: string } | null>(null);

  const cargarLotes = useCallback(async () => {
    setLoadingLotes(true);
    setError('');
    try {
      const res = await fetch('/api/batch/lotes');
      const data = await res.json();
      const lotesList = data.lotes || [];
      setLotes(lotesList);
      if (lotesList.length > 0 && !selectedLote) {
        setSelectedLote(lotesList[0].id);
      }
    } catch {
      setError('Error al conectar con el servidor para obtener los lotes.');
    } finally {
      setLoadingLotes(false);
    }
  }, [selectedLote]);

  const cargarResumen = useCallback(async (loteId: string) => {
    if (!loteId) return;
    setLoadingResumen(true);
    try {
      const res = await fetch(`/api/batch/resumen/${encodeURIComponent(loteId)}`);
      if (res.ok) {
        const data = await res.json();
        setResumen(data);
      } else {
        setResumen(null);
      }
    } catch {
      setResumen(null);
    } finally {
      setLoadingResumen(false);
    }
  }, []);

  useEffect(() => {
    cargarLotes();
  }, [cargarLotes]);

  useEffect(() => {
    if (selectedLote) {
      cargarResumen(selectedLote);
    }
  }, [selectedLote, cargarResumen]);

  const ejecutarProcesamiento = async () => {
    if (!selectedLote) return;
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/batch/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lote_id: selectedLote })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al iniciar el lote');

      setActiveTaskId(data.task_id);
      const resultado = await pollTask<ResumenLote>(data.task_id);
      setResumen(resultado);
      await cargarLotes();
    } catch (e: any) {
      setError(e.message || 'Fallo durante el procesamiento en lote.');
    } finally {
      setRunning(false);
      setActiveTaskId(null);
    }
  };

  const loteActual = lotes.find(l => l.id === selectedLote);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ENCABEZADO DE PÁGINA */}
      <div className="view-header">
        <div>
          <div className="view-breadcrumb">
            <span>Gestión Económica UEx</span>
            <span>/</span>
            <span>Procesamiento Masivo</span>
          </div>
          <h1 className="view-title">Tramitación por lotes de expedientes</h1>
          <p className="view-desc">
            Fiscalización simultánea de conjuntos de expedientes con imputación y contexto común de proyecto de investigación.
          </p>
        </div>

        <div className="view-actions">
          <Btn variant="outline" size="sm" onClick={cargarLotes} disabled={loadingLotes || running}>
            {loadingLotes ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
            <span>Actualizar</span>
          </Btn>
        </div>
      </div>

      {error && <AlertErr msg={error} />}

      {/* 1. SELECCIÓN DEL LOTE DE EXPEDIENTES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', margin: 0 }}>
            1. Selección del lote de trabajo
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Directorios detectados en <code>dataset/lotes_prueba/</code>
          </span>
        </div>

        {loadingLotes ? (
          <div className="panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '6px' }} />
            Examinando directorios de lotes...
          </div>
        ) : lotes.length === 0 ? (
          <div className="panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No se encontraron lotes de prueba en el servidor.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Directorio del lote</th>
                  <th>Investigador Principal</th>
                  <th>Orgánica / Referencia</th>
                  <th style={{ width: '140px' }}>Expedientes en cola</th>
                  <th style={{ width: '120px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote) => {
                  const isSel = selectedLote === lote.id;
                  return (
                    <tr
                      key={lote.id}
                      onClick={() => setSelectedLote(lote.id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSel ? 'var(--uex-burgundy-subtle)' : undefined
                      }}
                    >
                      <td>
                        <input
                          type="radio"
                          name="lote_selector"
                          checked={isSel}
                          onChange={() => setSelectedLote(lote.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {lote.id}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {lote.investigador || 'Contexto automático'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {lote.organica ? `Org: ${lote.organica}` : 'Org: N/D'} · {lote.proyecto ? `Ref: ${lote.proyecto}` : 'Ref: N/D'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {lote.total_expedientes} expedientes
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <span 
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: lote.procesado ? 'var(--color-success)' : 'var(--color-warning)'
                            }}
                          />
                          <span style={{ color: lote.procesado ? 'var(--color-success-text)' : 'var(--color-warning-text)' }}>
                            {lote.procesado ? 'Fiscalizado' : 'Pendiente'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. CONTEXTO COMÚN HEREDADO Y PARÁMETROS */}
      {selectedLote && (
        <div className="panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', margin: 0 }}>
              2. Parámetros del proyecto e imputación presupuestaria
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Archivo: <code>datos_comunes_expedientes.md</code>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Investigador Principal</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                {resumen?.datos_comunes_proyecto?.investigador || loteActual?.investigador || 'Pedro Clemente'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Orgánica presupuestaria</div>
              <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                {resumen?.datos_comunes_proyecto?.organica || loteActual?.organica || '18.IW.97.89'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Referencia del proyecto</div>
              <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                {resumen?.datos_comunes_proyecto?.referencia_proyecto || loteActual?.proyecto || '256/21'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Régimen económico</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                Bases de Ejecución UEx 2026
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. EJECUCIÓN DEL LOTE */}
      {selectedLote && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {running ? 'Fiscalizando lote en proceso...' : resumen ? 'Lote procesado y validado' : 'Listo para iniciar fiscalización'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Se verificarán los justificantes, se aplicarán topes de gasto UEx 2026 y se expedirán los modelos PDF oficiales.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {resumen && (
              <a
                href={`/api/batch/descargar_zip/${encodeURIComponent(selectedLote)}`}
                download
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <Download size={13} />
                <span>Descargar paquete (.ZIP)</span>
              </a>
            )}

            <Btn
              variant="primary"
              size="md"
              onClick={ejecutarProcesamiento}
              disabled={running || !selectedLote}
            >
              {running ? (
                <>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Play size={13} style={{ fill: 'currentColor' }} />
                  <span>{resumen ? 'Reprocesar lote' : 'Procesar lote'}</span>
                </>
              )}
            </Btn>
          </div>
        </div>
      )}

      {/* 4. RESULTADOS CONTABLES Y MODELOS EXPEDIDOS */}
      {!running && resumen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', margin: 0 }}>
              4. Desglose de expedientes y modelos generados ({resumen.total_expedientes})
            </h2>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setVistaModo('tabla')}
                className={`filter-btn ${vistaModo === 'tabla' ? 'active' : ''}`}
              >
                Tabla de expedientes
              </button>
              <button
                type="button"
                onClick={() => setVistaModo('informe_md')}
                className={`filter-btn ${vistaModo === 'informe_md' ? 'active' : ''}`}
              >
                Informe Markdown
              </button>
            </div>
          </div>

          {/* Resumen contable sobrio */}
          <div className="panel" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-subtle)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total expedientes tramitados: </span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{resumen.total_expedientes}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Importe total imputado al proyecto: </span>
              <strong style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {fmtEur(resumen.importe_total_acumulado)}
              </strong>
            </div>
          </div>

          {vistaModo === 'tabla' && (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '180px' }}>Expediente</th>
                    <th style={{ width: '180px' }}>Procedimiento</th>
                    <th>Beneficiario / Proveedor</th>
                    <th>Concepto de gasto</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Importe</th>
                    <th style={{ width: '220px', textAlign: 'center' }}>Modelos oficiales generados</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.expedientes.map((exp, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {exp.expediente_id}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {exp.tipo_procedimiento === 'pago_proveedor' ? 'Pago a Proveedor' :
                         exp.tipo_procedimiento === 'honorarios' ? 'Honorarios' : 'Dietas'}
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {exp.proveedor || exp.beneficiario || 'N/D'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {exp.objeto || 'Gasto justificado de investigación'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {fmtEur(exp.importe)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {exp.documentos_generados && Object.entries(exp.documentos_generados).map(([docKey, docRuta]) => {
                            const filename = docRuta.split('\\').pop()?.split('/').pop() || docKey;
                            const pdfUrl = `/api/batch/archivo?lote_id=${encodeURIComponent(selectedLote)}&expediente_id=${encodeURIComponent(exp.expediente_id)}&archivo=${encodeURIComponent(filename)}`;
                            return (
                              <button
                                key={docKey}
                                type="button"
                                onClick={() => setPdfPreviewUrl({ url: pdfUrl, titulo: `${exp.expediente_id} — ${filename}` })}
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '11px', padding: '2px 6px' }}
                                title={`Ver ${filename}`}
                              >
                                <FileCheck size={11} style={{ color: 'var(--color-success)' }} />
                                <span>{filename.replace('.pdf', '')}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {vistaModo === 'informe_md' && (
            <div className="panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Resumen ejecutivo en formato Markdown</span>
                <a
                  href={`/api/batch/archivo?lote_id=${encodeURIComponent(selectedLote)}&expediente_id=salida&archivo=resumen_procesamiento_lote.md`}
                  download="resumen_procesamiento_lote.md"
                  className="btn btn-outline btn-sm"
                >
                  <Download size={12} />
                  <span>Descargar .md</span>
                </a>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
                {resumen.markdown || 'No se encontró el archivo de resumen.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE PREVISUALIZACIÓN DE MODELO PDF */}
      {pdfPreviewUrl && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ width: '92vw', maxWidth: '1000px', height: '88vh' }}>
            <div className="modal-header">
              <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {pdfPreviewUrl.titulo}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <a
                  href={pdfPreviewUrl.url}
                  download
                  className="btn btn-outline btn-sm"
                  title="Descargar PDF"
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => setPdfPreviewUrl(null)}
                  className="uex-theme-btn"
                  title="Cerrar"
                  type="button"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--bg-subtle)' }}>
              <iframe
                src={pdfPreviewUrl.url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={pdfPreviewUrl.titulo}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
