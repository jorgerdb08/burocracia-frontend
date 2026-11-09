import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderArchive, Play, Loader2, Download, FileText,
  RefreshCw, Eye, X, Check, FileCheck, Plus, UploadCloud,
  Building2, Scale, Wallet, AlertTriangle, CheckCircle2,
  ShieldCheck, Trash2, Layers, FileCode, ArrowRight, ArrowLeft,
  FolderOpen, CheckCircle, FileCheck2, Sparkles, Folder, HelpCircle,
  LayoutGrid, List
} from 'lucide-react';
import { cn, pollTask, fmtEur } from '../../lib/utils';
import { Btn } from '../ui/Btn';
import { AlertErr, AlertSucc } from '../ui/Alerts';

interface TipoFinanciacionConfig {
  id: string;
  nombre: string;
  normativa: string;
  marcoLegal: string;
  badgeColor: string;
  badgeBg: string;
}

const TIPOS_FINANCIACION_CONFIG: Record<string, TipoFinanciacionConfig> = {
  G24: {
    id: 'G24',
    nombre: 'Ayudas Grupos GR24/IB24',
    normativa: 'Decreto 42/2025 (Junta)',
    marcoLegal: 'Decreto 42/2025 de la Junta de Extremadura y Bases UEx 2026',
    badgeColor: '#166534',
    badgeBg: '#DCFCE7'
  },
  UEX: {
    id: 'UEX',
    nombre: 'Contratos / OTRI',
    normativa: 'R.D. 462/2002 / Art. 60 LOSU',
    marcoLegal: 'R.D. 462/2002 del Estado y Art. 60 LOSU (Transferencia Empresa)',
    badgeColor: '#1E40AF',
    badgeBg: '#DBEAFE'
  },
  PEI: {
    id: 'PEI',
    nombre: 'Plan Estatal (AEI / MCIN)',
    normativa: 'R.D. 462/2002',
    marcoLegal: 'R.D. 462/2002 y Guías de Justificación AEI / NextGenEU',
    badgeColor: '#854D0E',
    badgeBg: '#FEF9C3'
  },
  PCO: {
    id: 'PCO',
    nombre: 'Planes Complementarios',
    normativa: 'R.D. 462/2002',
    marcoLegal: 'R.D. 462/2002 y Componente 17 PRTR',
    badgeColor: '#3730A3',
    badgeBg: '#E0E7FF'
  },
  NAL: {
    id: 'NAL',
    nombre: 'Plan Propio / Deptos',
    normativa: 'Régimen General UEx',
    marcoLegal: 'Fondos propios de Centros/Departamentos UEx',
    badgeColor: '#475569',
    badgeBg: '#F1F5F9'
  },
  JEX: {
    id: 'JEX',
    nombre: 'Autonómicos Junta Extremadura',
    normativa: 'Decreto 42/2025',
    marcoLegal: 'Decreto 42/2025 de la Junta de Extremadura',
    badgeColor: '#115E59',
    badgeBg: '#CCFBF1'
  }
};

interface LoteInfo {
  id: string;
  ruta: string;
  tiene_contexto_comun: boolean;
  investigador: string;
  organica: string;
  proyecto: string;
  tipo_financiacion?: string;
  total_expedientes: number;
  expedientes: string[];
  procesado: boolean;
}

interface LoteDetalle {
  ok: boolean;
  lote_id: string;
  ruta: string;
  archivo_comun: string | null;
  datos_comunes: Record<string, any>;
  expedientes: Array<{
    nombre: string;
    archivos: string[];
    total_archivos: number;
    proveedor_detectado: string;
    tipo_procedimiento: string;
    importe: number;
    estado: string;
    procesado: boolean;
  }>;
  total_expedientes: number;
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
    tipo_financiacion?: string;
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
    estado_procesamiento?: string;
    documentos_generados?: Record<string, string>;
    conflictos_detectados?: any[];
  }>;
  markdown?: string;
}

export function ViewLotesBatch() {
  const [lotes, setLotes] = useState<LoteInfo[]>([]);
  const [selectedLote, setSelectedLote] = useState<string>('');
  const [loadingLotes, setLoadingLotes] = useState<boolean>(true);
  const [loteDetalle, setLoteDetalle] = useState<LoteDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // ARQUITECTURA DE PANTALLAS SEPARADAS (NO TODO EN LA MISMA)
  // 'menu' -> Pantalla limpia de selección con únicamente las 2 opciones
  // 'cargar_nuevo' -> Pantalla dedicada al asistente de carga
  // 'precargados' -> Pantalla dedicada a consultar/ejecutar lotes existentes
  // -------------------------------------------------------------------------
  const [pantallaActual, setPantallaActual] = useState<'menu' | 'cargar_nuevo' | 'precargados'>('menu');

  // Sub-pantallas del asistente "Cargar Nuevo":
  // 'subida': Paso 1 (Subida de .ZIP o justificantes)
  // 'arbol': Paso 2 (Ver árbol de directorios físico)
  // 'comprobar': Paso 3 (Recuadro de comprobación y datos comunes)
  // 'proceso': Paso 4 (Ejecución en tiempo real)
  // 'resultados': Paso 5 (Resultados contables y modelos)
  const [pasoCarga, setPasoCarga] = useState<'subida' | 'arbol' | 'comprobar' | 'proceso' | 'resultados'>('subida');

  // Estados de subida / creación
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevosArchivos, setNuevosArchivos] = useState<File[]>([]);
  const [creandoLote, setCreandoLote] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [crearError, setCrearError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estados del formulario (Datos Comunes de Proyecto)
    const [formInvestigador, setFormInvestigador] = useState<string>('');
  const [formOrganica, setFormOrganica] = useState<string>('');
  const [formReferencia, setFormReferencia] = useState<string>('');
  const [formTipoFinanciacion, setFormTipoFinanciacion] = useState<string>('');
  const [formFormaPago, setFormFormaPago] = useState<string>('Transferencia');
  const [formCentro, setFormCentro] = useState<string>('');
  const [formCampus, setFormCampus] = useState<string>('');
  const [formContacto, setFormContacto] = useState<string>('');
  const [guardandoDatos, setGuardandoDatos] = useState<boolean>(false);

  // Estados de ejecución y resultados
  const [running, setRunning] = useState<boolean>(false);
  const [resumen, setResumen] = useState<ResumenLote | null>(null);
  const [vistaModo, setVistaModo] = useState<'tabla' | 'informe_md'>('tabla');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<{ url: string; titulo: string } | null>(null);
  const [expedienteArchivosModal, setExpedienteArchivosModal] = useState<{ nombre: string; archivos: string[] } | null>(null);

  const [notifExito, setNotifExito] = useState<string>('');
  const [error, setError] = useState<string>('');

  const getDocsUnicos = (exp: ResumenLote['expedientes'][0]) => {
    if (!exp.documentos_generados) return [];
    const map = new Map<string, { key: string; filename: string; ruta: string; desc: string }>();
    
    for (const [key, ruta] of Object.entries(exp.documentos_generados)) {
      const filename = (ruta || key).split(/[\\/]/).pop() || key;
      if (!map.has(filename)) {
        let desc = "Modelo oficial emitido en formato AcroForm PDF";
        const fLower = filename.toLowerCase();
        if (fLower.includes('anexo_ii') || fLower.includes('aprobacion')) {
          desc = "Aprobación del Gasto (SGTRI UEx)";
        } else if (fLower.includes('anexo_i_propuesta')) {
          desc = "Propuesta de Pago Oficial — Modelo Anexo I";
        } else if (fLower.includes('anexo_a')) {
          desc = fLower.includes('tarjeta') 
            ? "Propuesta de Pago / Justificación con Tarjeta Institucional"
            : "Propuesta de Pago / Transferencia a Favor del Perceptor";
        } else if (fLower.includes('honorarios')) {
          desc = "Liquidación Oficial SGTRI — Honorarios y Asistencias";
        } else if (fLower.includes('dietas')) {
          desc = "Liquidación Oficial SGTRI — Dietas y Desplazamientos";
        } else if (fLower.includes('declaracion_responsable')) {
          desc = "Declaración Responsable — Incompatibilidades y Límites";
        } else if (fLower.includes('certificacion_actividad')) {
          desc = "Certificación Oficial — Actividad y Ponencia Impartida";
        }
        
        map.set(filename, { key, filename, ruta, desc });
      }
    }
    return Array.from(map.values());
  };

  const getProcInfo = (tipo: string) => {
    switch (tipo) {
      case 'pago_proveedor':
        return {
          label: 'Pago a Proveedor',
          bg: '#ECFDF5',
          color: '#065F46',
          border: '#A7F3D0',
          icon: '🏢'
        };
      case 'honorarios':
        return {
          label: 'Honorarios y Asistencias',
          bg: '#EEF2FF',
          color: '#3730A3',
          border: '#C7D2FE',
          icon: '🎓'
        };
      case 'dietas':
      default:
        return {
          label: 'Dietas y Desplazamientos',
          bg: '#FFFBEB',
          color: '#92400E',
          border: '#FDE68A',
          icon: '✈️'
        };
    }
  };

  const renderModelosOficiales = () => {
    if (!resumen) return null;

    return (
      <div className="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Expedientes Fiscalizados y Modelos Oficiales
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Modelos oficiales AcroForm PDF generados por expediente, listos para previsualización y descarga.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
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

        {/* MODO TABLA: MODELOS ABAJO EN FILA */}
        {vistaModo === 'tabla' && (
          <div className="admin-table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ width: '220px', padding: '10px 14px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Expediente</th>
                  <th style={{ width: '190px', padding: '10px 14px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Procedimiento</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Beneficiario / Proveedor</th>
                  <th style={{ width: '120px', textAlign: 'right', padding: '10px 14px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Importe</th>
                  <th style={{ width: '130px', textAlign: 'center', padding: '10px 14px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dictamen</th>
                </tr>
              </thead>
              <tbody>
                {resumen.expedientes.map((exp, idx) => {
                  const procInfo = getProcInfo(exp.tipo_procedimiento);
                  const docs = getDocsUnicos(exp);
                  const titular = exp.proveedor || exp.beneficiario || 'N/D';

                  return (
                    <React.Fragment key={exp.expediente_id || idx}>
                      {/* Fila Principal del Expediente */}
                      <tr style={{
                        backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-app)',
                        borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none'
                      }}>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                            {exp.expediente_id}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: procInfo.bg,
                            color: procInfo.color,
                            border: `1px solid ${procInfo.border}`
                          }}>
                            <span>{procInfo.icon}</span>
                            <span>{procInfo.label}</span>
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {titular}
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13.5px' }}>
                          {fmtEur(exp.importe)}
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#DCFCE7',
                            color: '#166534',
                            border: '1px solid #BBF7D0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 size={12} />
                            <span>Conforme SGTRI</span>
                          </span>
                        </td>
                      </tr>

                      {/* Subfila: Modelos Oficiales en Fila Horizontal Abajo */}
                      <tr style={{
                        backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-app)',
                        borderBottom: '1px solid var(--border-color)'
                      }}>
                        <td colSpan={5} style={{ padding: '0 14px 12px 14px', paddingTop: '0px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            backgroundColor: 'var(--bg-subtle)',
                            padding: '7px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '4px', flexShrink: 0 }}>
                              <FileText size={13} style={{ color: 'var(--text-muted)' }} />
                              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
                                Modelos emitidos ({docs.length}):
                              </span>
                            </div>

                            {docs.length === 0 ? (
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Sin modelos generados</span>
                            ) : (
                              docs.map((doc, dIdx) => {
                                const pdfUrl = `/api/batch/archivo?lote_id=${encodeURIComponent(selectedLote)}&expediente_id=${encodeURIComponent(exp.expediente_id)}&archivo=${encodeURIComponent(doc.filename)}`;
                                return (
                                  <div
                                    key={dIdx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      backgroundColor: 'var(--bg-surface)',
                                      border: '1px solid var(--border-color)',
                                      padding: '3px 8px',
                                      borderRadius: '5px',
                                      fontSize: '11px',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                    }}
                                  >
                                    <FileText size={12} style={{ color: '#DC2626', flexShrink: 0 }} />
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} title={doc.desc}>
                                      {doc.filename}
                                    </span>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={() => setPdfPreviewUrl({ url: pdfUrl, titulo: `${exp.expediente_id} — ${doc.filename}` })}
                                        className="btn btn-ghost btn-xs"
                                        style={{ padding: '1px 5px', fontSize: '10.5px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '2px', height: '22px' }}
                                        title="Previsualizar PDF"
                                      >
                                        <Eye size={11} />
                                        <span>Ver</span>
                                      </button>
                                      <a
                                        href={pdfUrl}
                                        download={doc.filename}
                                        className="btn btn-ghost btn-xs"
                                        style={{ padding: '1px 5px', fontSize: '10.5px', color: '#176B52', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none', height: '22px' }}
                                        title="Descargar PDF"
                                      >
                                        <Download size={11} />
                                        <span>Descargar</span>
                                      </a>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODO INFORME MARKDOWN */}
        {vistaModo === 'informe_md' && (
          <div style={{
            padding: '1.25rem',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            maxHeight: '480px',
            overflowY: 'auto'
          }}>
            {resumen.markdown || 'No se encontró el archivo de resumen.'}
          </div>
        )}
      </div>
    );
  };

  // Carga lista de lotes
  const cargarLotes = useCallback(async (loteToSelect?: string) => {
    setLoadingLotes(true);
    setError('');
    try {
      const res = await fetch('/api/batch/lotes');
      const data = await res.json();
      const lotesList = data.lotes || [];
      setLotes(lotesList);
      if (loteToSelect) {
        setSelectedLote(loteToSelect);
      } else if (lotesList.length > 0 && !selectedLote) {
        setSelectedLote(lotesList[0].id);
      }
    } catch {
      setError('Error al conectar con el servidor para obtener los lotes.');
    } finally {
      setLoadingLotes(false);
    }
  }, [selectedLote]);

  // Carga detalle e inspección de subcarpetas
  const cargarDetalleLote = useCallback(async (loteId: string) => {
    if (!loteId) return;
    setLoadingDetalle(true);
    try {
      const res = await fetch(`/api/batch/detalle/${encodeURIComponent(loteId)}`);
      if (res.ok) {
        const data = await res.json();
        setLoteDetalle(data);
        if (data.datos_comunes) {
          const dc = data.datos_comunes;
          setFormInvestigador(dc.investigador || '');
          setFormOrganica(dc.organica || '');
          setFormReferencia(dc.referencia_proyecto || '');
          setFormTipoFinanciacion(dc.tipo_financiacion || dc.tipo_de_financiación || '');
          setFormFormaPago(dc.forma_pago || 'Transferencia');
          setFormCentro(dc.centro || '');
          setFormCampus(dc.campus || '');
          setFormContacto(dc.contacto || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetalle(false);
    }
  }, []);

  // Carga resumen procesado
  const cargarResumen = useCallback(async (loteId: string) => {
    if (!loteId) return;
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
    }
  }, []);

  useEffect(() => {
    cargarLotes();
  }, [cargarLotes]);

  useEffect(() => {
    if (selectedLote) {
      cargarDetalleLote(selectedLote);
      cargarResumen(selectedLote);
    }
  }, [selectedLote, cargarDetalleLote, cargarResumen]);

  // Guardar datos comunes
  const handleGuardarDatosComunes = async () => {
    if (!selectedLote) return false;
    setGuardandoDatos(true);
    setError('');
    try {
      const res = await fetch('/api/batch/actualizar_datos_comunes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lote_id: selectedLote,
          investigador: formInvestigador,
          organica: formOrganica,
          referencia_proyecto: formReferencia,
          tipo_financiacion: formTipoFinanciacion,
          forma_pago: formFormaPago,
          centro: formCentro,
          campus: formCampus,
          contacto: formContacto
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al guardar datos comunes');
      setNotifExito('✓ Contexto del proyecto guardado en datos_comunes_expedientes.md');
      await cargarDetalleLote(selectedLote);
      await cargarLotes(selectedLote);
      return true;
    } catch (e: any) {
      setError(e.message || 'Error al actualizar los datos comunes.');
      return false;
    } finally {
      setGuardandoDatos(false);
    }
  };

  // Ejecución en lote asíncrona
  const ejecutarProcesamiento = async (targetLoteId?: string) => {
    const loteId = targetLoteId || selectedLote;
    if (!loteId) return;
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/batch/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lote_id: loteId })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al iniciar el lote');

      const resultado = await pollTask<ResumenLote>(data.task_id);
      setResumen(resultado);
      await cargarLotes(loteId);
      await cargarDetalleLote(loteId);
      setNotifExito(`¡Lote "${loteId}" fiscalizado con éxito! Modelos emitidos.`);
      
      if (pantallaActual === 'cargar_nuevo') {
        setPasoCarga('resultados');
      }
    } catch (e: any) {
      setError(e.message || 'Fallo durante el procesamiento en lote.');
      if (pantallaActual === 'cargar_nuevo') {
        setPasoCarga('comprobar');
      }
    } finally {
      setRunning(false);
    }
  };

  // Creación de nuevo lote
  const handleCrearNuevoLote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nuevoNombre.trim()) {
      setCrearError('Indica un nombre o identificador para la carpeta del lote.');
      return;
    }
    setCreandoLote(true);
    setCrearError('');
    try {
      const formData = new FormData();
      formData.append('nombre_lote', nuevoNombre.trim());
      formData.append('investigador', formInvestigador.trim());
      formData.append('organica', formOrganica.trim());
      formData.append('referencia_proyecto', formReferencia.trim());
      formData.append('tipo_financiacion', formTipoFinanciacion);
      formData.append('forma_pago', formFormaPago);
      formData.append('centro', formCentro);
      formData.append('campus', formCampus);

      for (const f of nuevosArchivos) {
        formData.append('files', f);
      }

      const res = await fetch('/api/batch/crear', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al crear el lote');

      setNotifExito(`Lote "${data.lote_id}" creado con ${data.total_expedientes} expedientes.`);
      await cargarLotes(data.lote_id);
      setSelectedLote(data.lote_id);
      await cargarDetalleLote(data.lote_id);

      // Avanzar al Paso 2: Ver Árbol de Directorios
      setPasoCarga('arbol');
    } catch (err: any) {
      setCrearError(err.message || 'Error al crear el lote.');
    } finally {
      setCreandoLote(false);
    }
  };

  const loteActual = lotes.find((l) => l.id === selectedLote);
  const finCode = formTipoFinanciacion || loteActual?.tipo_financiacion || 'UEX';
  const finConfig = TIPOS_FINANCIACION_CONFIG[finCode] || TIPOS_FINANCIACION_CONFIG['UEX'];
  const totalExpedientes = loteDetalle?.total_expedientes ?? loteActual?.total_expedientes ?? 0;
  const isLoteProcesado = !!(loteActual?.procesado || resumen);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>

      {notifExito && (
        <AlertSucc msg={notifExito} onClose={() => setNotifExito('')} />
      )}

      {error && <AlertErr msg={error} onClose={() => setError('')} />}

      {/* ========================================================================= */}
      {/* PANTALLA 1: MENÚ INICIAL LIMPIO (ÚNICAMENTE 2 OPCIONES, NADA DEBAJO)      */}
      {/* ========================================================================= */}
      {pantallaActual === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="view-header" style={{ marginBottom: 0 }}>
            <div>
              <div className="view-breadcrumb">
                <span>Gestión Económica UEx</span>
                <span>/</span>
                <span>Liquidación Masiva</span>
              </div>
              <h1 className="view-title">Procesamiento por Lotes de Expedientes</h1>
              <p className="view-desc">
                Selecciona la modalidad de trabajo para continuar.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginTop: '0.5rem'
          }}>
            {/* OPCIÓN 1: CARGAR NUEVO LOTE */}
            <div
              onClick={() => {
                setPantallaActual('cargar_nuevo');
                setPasoCarga('subida');
              }}
              className="panel"
              style={{
                padding: '2.5rem 2rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.5rem',
                border: '1.5px solid var(--border-color)',
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                backgroundColor: 'var(--bg-surface)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-blue-inst)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 64, 175, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-blue-soft)',
                  color: 'var(--color-blue-inst)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UploadCloud size={30} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    1. Cargar Nuevo Lote
                  </h2>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-blue-inst)', marginTop: '2px' }}>
                    Paquete .ZIP o carpetas con justificantes
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                  Sube un archivo comprimido <strong>.ZIP</strong> con las subcarpetas de tus expedientes o documentos sueltos. El sistema extraerá la estructura física, te mostrará el árbol de directorios y te permitirá comprobar los datos del proyecto antes de fiscalizar.
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--color-blue-inst)'
              }}>
                <span>Comenzar Asistente de Carga</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* OPCIÓN 2: VER LOTES PRECARGADOS */}
            <div
              onClick={() => {
                setPantallaActual('precargados');
              }}
              className="panel"
              style={{
                padding: '2.5rem 2rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.5rem',
                border: '1.5px solid var(--border-color)',
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                backgroundColor: 'var(--bg-surface)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-blue-inst)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 64, 175, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FolderArchive size={30} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      2. Ver Lotes Precargados
                    </h2>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534' }}>
                      {lotes.length} disponibles
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Consultar expedientes y descargar modelos
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                  Accede a los lotes que ya residen en el servidor (ej. <em>Cátedra Telefónica</em>). Podrás consultar las auditorías realizadas, visualizar los modelos oficiales PDF emitidos o descargar el archivo ZIP final.
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                <span>Explorar Lotes Precargados</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PANTALLA 2: ASISTENTE DE CARGA GUIADA ("CARGAR NUEVO LOTE")               */}
      {/* ========================================================================= */}
      {pantallaActual === 'cargar_nuevo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* BARRA SUPERIOR DE NAVEGACIÓN */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setPantallaActual('menu')}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={13} />
              <span>Volver a Selección de Lotes</span>
            </button>

            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Asistente de Carga de Nuevo Lote
            </span>
          </div>

          {/* INDICADOR DE PASOS DEL ASISTENTE */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            overflowX: 'auto',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {[
              { id: 'subida', num: 1, label: '1. Subida (.ZIP / Archivos)' },
              { id: 'arbol', num: 2, label: '2. Árbol de Directorios' },
              { id: 'comprobar', num: 3, label: '3. Comprobación y Datos' },
              { id: 'proceso', num: 4, label: '4. Fiscalización' },
              { id: 'resultados', num: 5, label: '5. Modelos Oficiales' }
            ].map((st, idx) => {
              const stepKeys = ['subida', 'arbol', 'comprobar', 'proceso', 'resultados'];
              const currentIdx = stepKeys.indexOf(pasoCarga);
              const thisIdx = stepKeys.indexOf(st.id);
              const isPast = thisIdx < currentIdx;
              const isCurrent = thisIdx === currentIdx;

              return (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--color-blue-inst)' : isPast ? '#DCFCE7' : 'var(--bg-subtle)',
                    color: isCurrent ? '#FFFFFF' : isPast ? '#166534' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {isPast ? '✓' : st.num}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--color-blue-inst)' : isPast ? 'var(--text-primary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap'
                  }}>
                    {st.label}
                  </span>
                  {idx < 4 && (
                    <span style={{ color: 'var(--border-color)', margin: '0 4px' }}>—</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* SUB-PANTALLA 1: SUBIDA */}
          {pasoCarga === 'subida' && (
            <div className="panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Paso 1: Nombre del Lote y Archivo .ZIP
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Indica un nombre para la carpeta y arrastra tu archivo comprimido .ZIP con las carpetas de los justificantes.
                </p>
              </div>

              {crearError && <AlertErr msg={crearError} onClose={() => setCrearError('')} />}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Nombre de la Carpeta del Lote <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Lote_Congreso_Madrid_2026 o Pendientes_Investigacion_Q3"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                />
              </div>

              {/* ZONA DRAG & DROP */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) setNuevosArchivos(Array.from(e.dataTransfer.files));
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? 'var(--color-blue-inst)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: isDragging ? 'var(--bg-blue-soft)' : 'var(--bg-app)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <UploadCloud size={42} style={{ color: 'var(--color-blue-inst)', margin: '0 auto 12px auto' }} />
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Arrastra aquí tu paquete .ZIP de expedientes
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  o haz clic para examinar archivos (soporta .ZIP, .PDF, imágenes y facturas)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) setNuevosArchivos(Array.from(e.target.files));
                  }}
                  accept=".zip,.pdf,.txt,.md,.png,.jpg"
                />
              </div>

              {nuevosArchivos.length > 0 && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Archivos seleccionados ({nuevosArchivos.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {nuevosArchivos.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={13} style={{ color: 'var(--color-blue-inst)' }} />
                          <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{file.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNuevosArchivos((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <Btn variant="outline" size="md" onClick={() => setPantallaActual('menu')}>
                  Cancelar
                </Btn>

                <Btn
                  variant="primary"
                  size="md"
                  onClick={handleCrearNuevoLote}
                  disabled={creandoLote || !nuevoNombre.trim() || nuevosArchivos.length === 0}
                >
                  {creandoLote ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Extrayendo estructura...</span>
                    </>
                  ) : (
                    <>
                      <span>Subir y Ver Árbol de Directorios</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </Btn>
              </div>
            </div>
          )}

          {/* SUB-PANTALLA 2: ÁRBOL DE DIRECTORIOS FÍSICO */}
          {pasoCarga === 'arbol' && (
            <div className="panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Paso 2: Árbol de Directorios Físico Detectado
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Esta es la estructura real de carpetas y archivos detectada tras la descompresión.
                  </p>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 9px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534' }}>
                  {loteDetalle?.total_expedientes ?? 0} Subcarpetas detectadas
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                <FolderOpen size={15} style={{ color: 'var(--color-blue-inst)', flexShrink: 0 }} />
                <span>{loteDetalle?.ruta || `dataset/lotes_prueba/${selectedLote}`}</span>
              </div>

              {/* VISUALIZADOR DE ÁRBOL */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '18px 22px', fontFamily: 'var(--font-mono)', fontSize: '12.5px', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <FolderOpen size={15} style={{ color: 'var(--color-blue-inst)' }} />
                  <span>{selectedLote}/</span>
                </div>

                <div style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-green)' }}>
                  <FileCode size={13} />
                  <span>datos_comunes_expedientes.md</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(contexto global de proyecto)</span>
                </div>

                {loteDetalle?.expedientes.map((exp) => (
                  <div key={exp.nombre} style={{ paddingLeft: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                      <FolderArchive size={14} style={{ color: '#D97706' }} />
                      <span style={{ fontWeight: 600 }}>{exp.nombre}/</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({exp.total_archivos} archivo{exp.total_archivos === 1 ? '' : 's'})
                      </span>
                    </div>
                    {exp.archivos.map((a) => (
                      <div key={a} style={{ paddingLeft: '24px', color: 'var(--text-secondary)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <Btn variant="outline" size="md" onClick={() => setPasoCarga('subida')}>
                  <ArrowLeft size={14} />
                  <span>Volver a Subida</span>
                </Btn>

                <Btn variant="primary" size="md" onClick={() => setPasoCarga('comprobar')}>
                  <span>Siguiente: Comprobar Datos y Expedientes</span>
                  <ArrowRight size={14} />
                </Btn>
              </div>
            </div>
          )}

          {/* SUB-PANTALLA 3: RECUADRO DE COMPROBACIÓN Y DATOS COMUNES */}
          {pasoCarga === 'comprobar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* RECUADRO DE COMPROBACIÓN */}
              <div className="panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Recuadro de Comprobación: Expedientes Detectados ({totalExpedientes})
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    Verifica los justificantes y perceptores encontrados antes de aplicar la normativa.
                  </p>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '220px' }}>Expediente</th>
                        <th style={{ width: '130px' }}>Documentos</th>
                        <th>Proveedor / Beneficiario</th>
                        <th>Trámite Estimado</th>
                        <th style={{ width: '120px', textAlign: 'right' }}>Importe</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loteDetalle?.expedientes.map((exp) => (
                        <tr key={exp.nombre}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FolderArchive size={14} style={{ color: '#D97706' }} />
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{exp.nombre}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                              {exp.total_archivos} archivo{exp.total_archivos === 1 ? '' : 's'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {exp.proveedor_detectado || 'Pendiente de extracción'}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {exp.tipo_procedimiento === 'pago_proveedor' ? 'Pago a Proveedor' :
                             exp.tipo_procedimiento === 'honorarios' ? 'Honorarios y Asistencias' :
                             exp.tipo_procedimiento === 'dietas' ? 'Viajes y Desplazamientos' : 'Gastos varios'}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {exp.importe > 0 ? fmtEur(exp.importe) : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setExpedienteArchivosModal({ nombre: exp.nombre, archivos: exp.archivos })}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '11px', padding: '2px 8px' }}
                            >
                              <Eye size={12} />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RECUADRO DE DATOS COMUNES (HERENCIA) */}
              <div className="panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Datos Comunes del Proyecto (Herencia a Todo el Lote)
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                      Se estamparán en todos los modelos oficiales PDF y liquidaciones contables.
                    </p>
                  </div>

                  <Btn variant="outline" size="sm" onClick={handleGuardarDatosComunes} disabled={guardandoDatos}>
                    {guardandoDatos ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FileCheck size={13} />}
                    <span>Guardar Cambios</span>
                  </Btn>
                </div>

                {/* FORMULARIO */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Proyecto / Cátedra <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formReferencia}
                      onChange={(e) => setFormReferencia(e.target.value)}
                      placeholder="GR24099 o 256/21"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Orgánica Presupuestaria UEx <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formOrganica}
                      onChange={(e) => setFormOrganica(e.target.value)}
                      placeholder="18.IW.97.89"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Investigador Principal (IP) <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formInvestigador}
                      onChange={(e) => setFormInvestigador(e.target.value)}
                      placeholder="Pedro Clemente"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Campus UEx <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '6px' }}>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer',
                        padding: '4px 10px', borderRadius: '4px',
                        backgroundColor: formCampus.toLowerCase().includes('cáceres') || formCampus.toLowerCase().includes('caceres') ? 'var(--bg-blue-soft)' : 'var(--bg-subtle)',
                        border: `1px solid ${formCampus.toLowerCase().includes('cáceres') || formCampus.toLowerCase().includes('caceres') ? 'var(--color-blue-inst)' : 'var(--border-color)'}`
                      }}>
                        <input
                          type="radio"
                          name="campus_recuadro"
                          checked={formCampus.toLowerCase().includes('cáceres') || formCampus.toLowerCase().includes('caceres')}
                          onChange={() => setFormCampus('Cáceres')}
                        />
                        <span style={{ fontWeight: 600 }}>Cáceres</span>
                      </label>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer',
                        padding: '4px 10px', borderRadius: '4px',
                        backgroundColor: formCampus.toLowerCase().includes('badajoz') ? 'var(--bg-blue-soft)' : 'var(--bg-subtle)',
                        border: `1px solid ${formCampus.toLowerCase().includes('badajoz') ? 'var(--color-blue-inst)' : 'var(--border-color)'}`
                      }}>
                        <input
                          type="radio"
                          name="campus_recuadro"
                          checked={formCampus.toLowerCase().includes('badajoz')}
                          onChange={() => setFormCampus('Badajoz')}
                        />
                        <span style={{ fontWeight: 600 }}>Badajoz</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 6 OPCIONES SGTRI */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Régimen Normativo de Financiación SGTRI (Baremos e IRPF)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
                    {Object.values(TIPOS_FINANCIACION_CONFIG).map((tipo) => {
                      const isSel = formTipoFinanciacion === tipo.id;
                      return (
                        <div
                          key={tipo.id}
                          onClick={() => setFormTipoFinanciacion(tipo.id)}
                          style={{
                            border: `1.5px solid ${isSel ? 'var(--color-blue-inst)' : 'var(--border-color)'}`,
                            backgroundColor: isSel ? 'var(--bg-blue-soft)' : 'var(--bg-surface)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: tipo.badgeBg, color: tipo.badgeColor }}>
                              {tipo.id}
                            </span>
                            {isSel && <Check size={14} style={{ color: 'var(--color-blue-inst)' }} />}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {tipo.nombre}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {tipo.normativa}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <Btn variant="outline" size="md" onClick={() => setPasoCarga('arbol')}>
                    <ArrowLeft size={14} />
                    <span>Volver al Árbol</span>
                  </Btn>

                  <Btn
                    variant="primary"
                    size="lg"
                    onClick={async () => {
                      await handleGuardarDatosComunes();
                      setPasoCarga('proceso');
                      ejecutarProcesamiento();
                    }}
                    disabled={running}
                    style={{ minWidth: '220px', justifyContent: 'center' }}
                  >
                    <Play size={16} style={{ fill: 'currentColor' }} />
                    <span>Iniciar Fiscalización Masiva</span>
                  </Btn>
                </div>
              </div>

            </div>
          )}

          {/* SUB-PANTALLA 4: PROCESO EN VIVO */}
          {pasoCarga === 'proceso' && (
            <div className="panel" style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: 'var(--bg-blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-blue-inst)' }}>
                <Loader2 size={36} style={{ animation: 'spin 1.2s linear infinite' }} />
              </div>

              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Fiscalizando expediente por expediente en el servidor...
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: '6px auto 0' }}>
                  Extrayendo datos de facturas, cotejando con la normativa <strong>{finConfig.normativa}</strong> y emitiendo los modelos PDF oficiales.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', width: '100%', maxWidth: '440px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-green)' }}>
                  <span>✓</span>
                  <span>Estructura de directorios y contexto de proyecto leídos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-green)' }}>
                  <span>✓</span>
                  <span>Extracción OCR e Inteligencia Artificial de justificantes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-blue-inst)', fontWeight: 600 }}>
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Generando modelos PDF oficiales (Anexos UEx) y empaquetando ZIP...</span>
                </div>
              </div>
            </div>
          )}

          {/* SUB-PANTALLA 5: RESULTADOS Y MODELOS OFICIALES */}
          {pasoCarga === 'resultados' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    ¡Lote Fiscalizado con Éxito!
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Se han generado todos los modelos oficiales PDF para los expedientes del lote.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <a
                    href={`/api/batch/descargar_zip/${encodeURIComponent(selectedLote)}`}
                    download
                    className="btn btn-primary btn-md"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} />
                    <span>Descargar Lote Completo (.ZIP)</span>
                  </a>

                  <Btn variant="outline" size="md" onClick={() => setPantallaActual('menu')}>
                    <span>Finalizar y Volver al Menú</span>
                    <ArrowRight size={14} />
                  </Btn>
                </div>
              </div>

              {/* 4 KPIS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-blue-inst)' }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Expedientes</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{resumen?.total_expedientes ?? totalExpedientes}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-success-text)' }}>✓ 100% Tramitados</div>
                  </div>
                </div>

                <div className="panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-green)' }}>
                    <Wallet size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Importe Imputado</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{resumen ? fmtEur(resumen.importe_total_acumulado) : '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Base contable auditada</div>
                  </div>
                </div>

                <div className="panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-orange-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-orange)' }}>
                    <Scale size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Financiación</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{finConfig.id} - {finConfig.normativa}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Org: {formOrganica}</div>
                  </div>
                </div>

                <div className="panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={22} style={{ color: 'var(--color-success)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Dictamen</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px' }}>Fiscalizado Conforme</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sin reparos</div>
                  </div>
                </div>
              </div>

              {/* MODELOS OFICIALES */}
              {renderModelosOficiales()}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* PANTALLA 3: VER LOTES PRECARGADOS (PANTALLA COMPLETA DEDICADA)            */}
      {/* ========================================================================= */}
      {pantallaActual === 'precargados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setPantallaActual('menu')}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={13} />
              <span>Volver a Selección de Lotes</span>
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => {
                  cargarLotes(selectedLote);
                  if (selectedLote) {
                    cargarDetalleLote(selectedLote);
                    cargarResumen(selectedLote);
                  }
                }}
                disabled={loadingLotes}
              >
                <RefreshCw size={13} />
                <span>Actualizar</span>
              </Btn>

              <Btn
                variant="primary"
                size="sm"
                onClick={() => {
                  setPantallaActual('cargar_nuevo');
                  setPasoCarga('subida');
                }}
              >
                <Plus size={13} />
                <span>Cargar Nuevo Lote</span>
              </Btn>
            </div>
          </div>

          {/* SELECTOR DEL LOTE ACTIVO */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderArchive size={18} style={{ color: 'var(--color-blue-inst)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Lote de Trabajo:
                </span>
              </div>

              <select
                value={selectedLote}
                onChange={(e) => setSelectedLote(e.target.value)}
                disabled={running}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  minWidth: '290px'
                }}
              >
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} ({l.total_expedientes} exp.) {l.procesado ? '✓ Fiscalizado' : '⌛ Pendiente'}
                  </option>
                ))}
              </select>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '9999px',
                backgroundColor: isLoteProcesado ? '#DCFCE7' : '#FEF3C7',
                color: isLoteProcesado ? '#166534' : '#92400E'
              }}>
                {isLoteProcesado ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                <span>{isLoteProcesado ? 'Fiscalizado con Modelos' : 'Pendiente de Fiscalización'}</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isLoteProcesado && (
                <a
                  href={`/api/batch/descargar_zip/${encodeURIComponent(selectedLote)}`}
                  download
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={13} />
                  <span>Descargar ZIP Completo</span>
                </a>
              )}

              <Btn
                variant="outline"
                size="sm"
                onClick={() => ejecutarProcesamiento(selectedLote)}
                disabled={running || !selectedLote}
              >
                {running ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
                <span>{isLoteProcesado ? 'Reprocesar Lote' : 'Fiscalizar Lote'}</span>
              </Btn>
            </div>
          </div>

          {/* CONTENIDO DEL LOTE: SI ESTÁ FISCALIZADO */}
          {isLoteProcesado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 4 KPIS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-blue-inst)' }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Expedientes</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{resumen?.total_expedientes ?? totalExpedientes}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-success-text)' }}>✓ 100% Tramitados</div>
                  </div>
                </div>

                <div className="panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-green)' }}>
                    <Wallet size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Importe Imputado</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{resumen ? fmtEur(resumen.importe_total_acumulado) : '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Base contable auditada</div>
                  </div>
                </div>

                <div className="panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-orange-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-orange)' }}>
                    <Scale size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Financiación</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{finConfig.id} - {finConfig.normativa}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Org: {formOrganica}</div>
                  </div>
                </div>

                <div className="panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={22} style={{ color: 'var(--color-success)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Dictamen</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px' }}>Fiscalizado Conforme</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sin reparos</div>
                  </div>
                </div>
              </div>

              {/* MODELOS OFICIALES */}
              {renderModelosOficiales()}
            </div>
          ) : (
            /* SI EL LOTE ESTÁ PENDIENTE */
            <div className="panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Expedientes en Cola de Fiscalización ({totalExpedientes})
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Este lote aún no ha sido fiscalizado. Revisa los justificantes y pulsa en "Iniciar Fiscalización Masiva".
                </p>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '220px' }}>Expediente</th>
                      <th style={{ width: '130px' }}>Documentos</th>
                      <th>Proveedor / Beneficiario</th>
                      <th>Trámite Estimado</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Importe</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loteDetalle?.expedientes.map((exp) => (
                      <tr key={exp.nombre}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FolderArchive size={14} style={{ color: '#D97706' }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{exp.nombre}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            {exp.total_archivos} archivo{exp.total_archivos === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{exp.proveedor_detectado || 'Pendiente'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {exp.tipo_procedimiento === 'pago_proveedor' ? 'Pago a Proveedor' :
                           exp.tipo_procedimiento === 'honorarios' ? 'Honorarios y Asistencias' : 'Dietas y Desplazamientos'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {exp.importe > 0 ? fmtEur(exp.importe) : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setExpedienteArchivosModal({ nombre: exp.nombre, archivos: exp.archivos })}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '11px', padding: '2px 8px' }}
                          >
                            <Eye size={12} />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <Btn
                  variant="primary"
                  size="lg"
                  onClick={() => ejecutarProcesamiento(selectedLote)}
                  disabled={running || !selectedLote || totalExpedientes === 0}
                >
                  {running ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Fiscalizando lote en proceso...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} style={{ fill: 'currentColor' }} />
                      <span>Iniciar Fiscalización Masiva</span>
                    </>
                  )}
                </Btn>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VER ARCHIVOS DE UN SUBEXPEDIENTE                                 */}
      {/* ========================================================================= */}
      {expedienteArchivosModal && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="modal-dialog" style={{ maxWidth: '480px', width: '92vw' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderArchive size={16} style={{ color: 'var(--color-blue-inst)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {expedienteArchivosModal.nombre}
                </span>
              </div>
              <button
                type="button"
                className="uex-theme-btn"
                onClick={() => setExpedienteArchivosModal(null)}
                title="Cerrar"
              >
                <X size={15} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Justificantes detectados en este subexpediente:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {expedienteArchivosModal.archivos.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '4px', backgroundColor: 'var(--bg-subtle)', fontSize: '12px' }}>
                    <FileText size={13} style={{ color: 'var(--color-blue-inst)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <Btn variant="outline" size="sm" onClick={() => setExpedienteArchivosModal(null)}>
                Cerrar
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PREVISUALIZACIÓN DE MODELO OFICIAL PDF                            */}
      {/* ========================================================================= */}
      {pdfPreviewUrl && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
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
            <div style={{ flex: 1, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <object
                data={pdfPreviewUrl.url}
                type="application/pdf"
                style={{ width: '100%', height: '100%', minHeight: '75vh' }}
              >
                <iframe
                  src={pdfPreviewUrl.url}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={pdfPreviewUrl.titulo}
                />
              </object>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
