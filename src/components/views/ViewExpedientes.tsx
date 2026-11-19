/**
 * UNIVERSIDAD DE EXTREMADURA (UEx) - SGTRI
 * Bandeja de Gestión y Archivo de Expedientes
 *
 * Ofrece la vista centralizada de expedientes del sistema:
 * - Listado y filtrado por tipo de trámite (dietas, honorarios, proveedores).
 * - Búsqueda en tiempo real por identificador, título o descripción.
 * - Operaciones CRUD: creación de nuevos expedientes, renombrado/edición y borrado seguro.
 * - Indicadores visuales de completitud documental y semáforo de validación previa.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, RefreshCw, Search, Eye, ArrowRight, Pencil, Trash2, Plus, X, FolderPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AlertErr } from '../ui/Alerts';
import { Btn } from '../ui/Btn';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';

export function ViewExpedientes({
  onProcesar,
  onInspeccionar
}: {
  onProcesar: (id: string, tipo?: string) => void;
  onInspeccionar: (id: string) => void;
}) {
  const [casos, setCasos] = useState<{ 
    id: string; 
    tipo: string; 
    codigo?: string;
    titulo?: string;
    descripcion?: string;
    total_archivos?: number; 
    porcentaje?: number; 
    completo?: boolean; 
    estado_validacion?: 'error' | 'valido_con_advertencias' | 'valido_completo' 
  }[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');

  // Modales
  const [editandoCaso, setEditandoCaso] = useState<{ id: string; titulo?: string; descripcion?: string } | null>(null);
  const [nuevoIdCarpeta, setNuevoIdCarpeta] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [tipoNuevo, setTipoNuevo] = useState('dietas');
  const [descNueva, setDescNueva] = useState('');
  const [creandoCaso, setCreandoCaso] = useState(false);

  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await api.getCasos();
      setCasos(data.casos || []);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Limpiar feedback tras 5 segundos
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const counts = useMemo(() => {
    let dietas = 0;
    let proveedores = 0;
    let honorarios = 0;
    let lotes = 0;
    for (const c of casos) {
      const t = (c.tipo || '').toLowerCase();
      if (t === 'dietas' || t === 'dieta') dietas++;
      else if (t === 'proveedores' || t === 'pago_proveedor' || t === 'proveedor') proveedores++;
      else if (t === 'honorarios' || t === 'honorario') honorarios++;
      else if (t === 'lote' || t === 'lotes' || (c as any).es_lote) lotes++;
    }
    return {
      todos: casos.length,
      dietas,
      pago_proveedor: proveedores,
      honorarios,
      lotes
    };
  }, [casos]);

  const filteredCasos = useMemo(() => {
    const q = search.toLowerCase().trim();
    return casos.filter(c => {
      const tipoNorm = (c.tipo || '').toLowerCase();
      let matchTipo = true;
      if (tipoFiltro === 'dietas') {
        matchTipo = tipoNorm === 'dietas' || tipoNorm === 'dieta';
      } else if (tipoFiltro === 'pago_proveedor') {
        matchTipo = tipoNorm === 'proveedores' || tipoNorm === 'pago_proveedor' || tipoNorm === 'proveedor';
      } else if (tipoFiltro === 'honorarios') {
        matchTipo = tipoNorm === 'honorarios' || tipoNorm === 'honorario';
      } else if (tipoFiltro === 'lotes') {
        matchTipo = tipoNorm === 'lote' || tipoNorm === 'lotes' || !!(c as any).es_lote;
      }
      if (!matchTipo) return false;

      if (!q) return true;
      return (
        (c.id && c.id.toLowerCase().includes(q)) || 
        (c.titulo && c.titulo.toLowerCase().includes(q)) || 
        (c.codigo && c.codigo.toLowerCase().includes(q)) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(q)) ||
        (c.tipo && c.tipo.toLowerCase().includes(q))
      );
    });
  }, [casos, search, tipoFiltro]);

  const getTipoBadge = (tipo: string) => {
    const t = (tipo || '').toLowerCase();
    if (t === 'dietas' || t === 'dieta') {
      return {
        label: 'Dietas y Desplazamientos',
        bg: '#EEF7F3',
        color: '#176B52',
        border: '#C6E3D7'
      };
    }
    if (t === 'proveedores' || t === 'pago_proveedor' || t === 'proveedor') {
      return {
        label: 'Pago a Proveedor',
        bg: '#FDF6EC',
        color: '#9A5B13',
        border: '#F2DCBA'
      };
    }
    if (t === 'honorarios' || t === 'honorario') {
      return {
        label: 'Honorarios SGTRI',
        bg: '#EFF4FB',
        color: '#174F91',
        border: '#CEDDF0'
      };
    }
    if (t === 'lote' || t === 'lotes') {
      return {
        label: 'Lote de Expedientes',
        bg: '#F5F3FF',
        color: '#6D28D9',
        border: '#DDD6FE'
      };
    }
    return {
      label: tipo || 'General',
      bg: '#F1F5F9',
      color: '#334155',
      border: '#CBD5E1'
    };
  };

  const handleAbrirEdicion = (c: { id: string; titulo?: string; descripcion?: string }) => {
    setEditandoCaso(c);
    setNuevoIdCarpeta(c.id);
    setNuevoTitulo(c.titulo || c.id);
    setNuevaDescripcion(c.descripcion || '');
  };

  const handleGuardarEdicion = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!editandoCaso || !nuevoTitulo.trim()) return;
    setGuardandoEdicion(true);
    try {
      const esLote = (editandoCaso as any).tipo === 'lote' || (editandoCaso as any).es_lote;
      if (esLote) {
        await api.editarLote(editandoCaso.id, {
          nuevo_id: nuevoIdCarpeta.trim() && nuevoIdCarpeta.trim() !== editandoCaso.id ? nuevoIdCarpeta.trim() : undefined,
          titulo: nuevoTitulo.trim(),
          descripcion: nuevaDescripcion.trim()
        });
      } else {
        await api.renombrarCaso(editandoCaso.id, {
          nuevoId: nuevoIdCarpeta.trim() && nuevoIdCarpeta.trim() !== editandoCaso.id ? nuevoIdCarpeta.trim() : undefined,
          titulo: nuevoTitulo.trim(),
          descripcion: nuevaDescripcion.trim()
        });
      }
      setFeedback({ tipo: 'success', texto: `${esLote ? 'Lote' : 'Expediente'} actualizado correctamente a "${nuevoTitulo.trim()}".` });
      setEditandoCaso(null);
      await cargar();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleEliminarCaso = async (c: { id: string; titulo?: string; tipo?: string }) => {
    const esLote = c.tipo === 'lote' || (c as any).es_lote;
    const tipoTexto = esLote ? 'el lote' : 'el expediente';
    const nombre = c.titulo || c.id;
    if (!window.confirm(`¿Está seguro de que desea eliminar definitivamente ${tipoTexto} "${nombre}"?\n\nEsta acción borrará la carpeta en el servidor y todos sus justificantes asociados.`)) {
      return;
    }
    try {
      if (esLote) {
        await api.eliminarLote(c.id);
      } else {
        await api.eliminarCaso(c.id);
      }
      setFeedback({ tipo: 'success', texto: `${esLote ? 'Lote' : 'Expediente'} "${nombre}" eliminado del sistema.` });
      await cargar();
    } catch (err: any) {
      alert(err.message || `Error al eliminar ${tipoTexto}`);
    }
  };

  const handleCrearExpediente = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!nombreNuevo.trim()) return;
    setCreandoCaso(true);
    try {
      const res = await api.crearCaso(nombreNuevo.trim(), tipoNuevo, descNueva.trim());
      setModalCrearOpen(false);
      setNombreNuevo('');
      setDescNueva('');
      setFeedback({ tipo: 'success', texto: `Nuevo expediente "${res.caso_id}" creado con éxito.` });
      await cargar();
      if (res.caso_id) {
        onInspeccionar(res.caso_id);
      }
    } catch (err: any) {
      alert(err.message || 'Error al crear el expediente');
    } finally {
      setCreandoCaso(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Encabezado Editorial */}
      <div className="view-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="view-breadcrumb">
            <span>BurocracIA</span>
            <span>/</span>
            <span>Intervención Económica</span>
            <span>/</span>
            <span>Bandeja de Expedientes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h1 className="view-title">Bandeja de expedientes</h1>
            {status === 'done' && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                {filteredCasos.length} expedientes
              </span>
            )}
          </div>
          <p className="view-desc">
            Expedientes de gasto digitalizados en cola de fiscalización para revisión documental, comprobación de requisitos normativos y expedición de modelos oficiales.
          </p>
        </div>

        <div className="view-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Btn variant="primary" size="sm" onClick={() => setModalCrearOpen(true)}>
            <FolderPlus size={13} />
            <span>Nuevo expediente</span>
          </Btn>
          <Btn variant="outline" size="sm" onClick={cargar} disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
            <span>Actualizar</span>
          </Btn>
        </div>
      </div>

      {/* Banner de feedback temporal */}
      {feedback && (
        <div 
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: feedback.tipo === 'success' ? '#EEF7F3' : '#FEF2F2',
            color: feedback.tipo === 'success' ? '#176B52' : '#DC2626',
            border: `1px solid ${feedback.tipo === 'success' ? '#C6E3D7' : '#FECACA'}`
          }}
        >
          {feedback.tipo === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{feedback.texto}</span>
        </div>
      )}

      {/* Zona de filtros y búsqueda editorial */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: `Todos (${counts.todos})` },
            { id: 'dietas', label: `Dietas y Desplazamientos (${counts.dietas})` },
            { id: 'pago_proveedor', label: `Pago a Proveedor (${counts.pago_proveedor})` },
            { id: 'honorarios', label: `Honorarios (${counts.honorarios})` },
            { id: 'lotes', label: `Lotes Masivos (${counts.lotes})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTipoFiltro(f.id)}
              className={cn("filter-btn", tipoFiltro === f.id && "active")}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="search-input-box" style={{ minWidth: '280px', position: 'relative' }}>
          <Search size={14} className="search-icon" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Filtrar por código de expediente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '38px', paddingRight: '12px' }}
          />
        </div>
      </div>

      {status === 'loading' && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Cargando expedientes registrados...</span>
        </div>
      )}

      {status === 'error' && (
        <AlertErr msg="Error al conectar con el servicio administrativo. Compruebe la conexión con el servidor local." />
      )}

      {status === 'done' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '360px' }}>Expediente / Asunto</th>
                <th>Procedimiento</th>
                <th style={{ width: '110px' }}>Documentos</th>
                <th style={{ width: '200px' }}>Estado documental</th>
                <th style={{ width: '230px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCasos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No se han encontrado expedientes que coincidan con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredCasos.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {c.codigo && (
                            <span style={{ 
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                              background: 'var(--bg-card-alt, #f1f5f9)',
                              color: 'var(--text-secondary, #475569)',
                              border: '1px solid var(--border-color, #e2e8f0)'
                            }}>
                              {c.codigo}
                            </span>
                          )}
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                            {c.titulo || c.id}
                          </span>
                        </div>
                        {c.descripcion ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.descripcion}>
                            {c.descripcion}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {c.id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const badge = getTipoBadge(c.tipo);
                        return (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                      {(c as any).es_lote || c.tipo === 'lote' 
                        ? `${(c as any).total_expedientes ?? 0} expedientes` 
                        : `${c.total_archivos || 0} archivo(s)`}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <span 
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: c.estado_validacion === 'error' ? 'var(--color-danger, #ef4444)' : c.estado_validacion === 'valido_con_advertencias' ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #22c55e)',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ 
                          color: c.estado_validacion === 'error' ? 'var(--color-danger, #ef4444)' : 'var(--text-secondary)',
                          fontWeight: c.estado_validacion === 'error' ? 600 : 400
                        }}>
                          {c.estado_validacion === 'error' ? 'Faltan obligatorios' : c.estado_validacion === 'valido_con_advertencias' ? 'Avisos opcionales' : 'Documentación completa'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => {
                            if (c.tipo === 'lote' || (c as any).es_lote) {
                              onProcesar(c.id, 'lote');
                            } else {
                              onInspeccionar(c.id);
                            }
                          }}
                          className="btn btn-secondary btn-sm"
                          type="button"
                          title={c.tipo === 'lote' || (c as any).es_lote ? "Abrir árbol del lote" : "Inspeccionar archivos y requisitos"}
                          style={{ padding: '4px 7px' }}
                        >
                          <Eye size={12} style={{ color: 'var(--text-muted)' }} />
                          <span className="hidden sm:inline">Detalle</span>
                        </button>

                        <button
                          onClick={() => handleAbrirEdicion(c)}
                          className="btn btn-secondary btn-sm"
                          type="button"
                          title="Editar título y descripción"
                          style={{ padding: '4px 7px' }}
                        >
                          <Pencil size={12} style={{ color: 'var(--text-muted)' }} />
                          <span className="hidden sm:inline">Editar</span>
                        </button>

                        <button
                          onClick={() => handleEliminarCaso(c)}
                          className="btn btn-secondary btn-sm"
                          type="button"
                          title={c.tipo === 'lote' || (c as any).es_lote ? "Eliminar lote completo" : "Eliminar expediente"}
                          style={{ padding: '4px 7px', color: '#DC2626' }}
                        >
                          <Trash2 size={12} />
                        </button>

                        <Btn
                          size="sm"
                          variant="primary"
                          onClick={() => onProcesar(c.id, c.tipo)}
                          style={{ padding: '4px 9px' }}
                        >
                          <span>Tramitar</span>
                          <ArrowRight size={12} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: EDITAR EXPEDIENTE */}
      {editandoCaso && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEditandoCaso(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#176B52] dark:text-emerald-300">
                  <Pencil size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Gestión de Expedientes</span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Editar Expediente</h3>
                </div>
              </div>
              <button 
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" 
                onClick={() => setEditandoCaso(null)} 
                type="button"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Identificador de Carpeta en Servidor *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoIdCarpeta}
                  onChange={e => setNuevoIdCarpeta(e.target.value)}
                  placeholder="Ej: 01_Comision_Transporte_Publico"
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                  Nombre técnico de la carpeta en disco. Si lo modifica, el sistema la renombrará automáticamente.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Título / Nombre Descriptivo del Expediente *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoTitulo}
                  onChange={e => setNuevoTitulo(e.target.value)}
                  placeholder="Ej: Comisión de Servicio — Transporte Público"
                  className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                  Título visible oficial mostrado en las tablas, listados y carátulas de tramitación.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción o Resumen del Gasto
                </label>
                <textarea
                  rows={3}
                  value={nuevaDescripcion}
                  onChange={e => setNuevaDescripcion(e.target.value)}
                  placeholder="Descripción resumida del desplazamiento, suministro o actividad..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52] resize-y"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50/70 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditandoCaso(null)}
                className="px-3 py-2 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                disabled={guardandoEdicion}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarEdicion}
                disabled={guardandoEdicion || !nuevoTitulo.trim()}
                style={{ backgroundColor: '#176B52', color: '#ffffff', border: 'none' }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#125842] disabled:opacity-50 text-white cursor-pointer shadow-xs transition-colors"
              >
                {guardandoEdicion ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />}
                <span>Guardar cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO EXPEDIENTE */}
      {modalCrearOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModalCrearOpen(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#176B52] dark:text-emerald-300">
                  <FolderPlus size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Sede Electrónica UEx</span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Alta de Nuevo Expediente</h3>
                </div>
              </div>
              <button 
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" 
                onClick={() => setModalCrearOpen(false)} 
                type="button"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Procedimiento Administrativo *
                </label>
                <select
                  value={tipoNuevo}
                  onChange={e => setTipoNuevo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                >
                  <option value="dietas">Dietas y Comisiones de Servicio (RD 462/2002)</option>
                  <option value="pago_proveedor">Pago a Proveedor y Facturas (Anexos II y A)</option>
                  <option value="honorarios">Honorarios Docentes y Premios (Modelo M-03)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Identificador / Título del Expediente *
                </label>
                <input
                  type="text"
                  required
                  value={nombreNuevo}
                  onChange={e => setNombreNuevo(e.target.value)}
                  placeholder="Ej: 05_Comision_Congreso_Sevilla o Factura_Servidor_AWS"
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                  Se creará una carpeta asociada en el repositorio de expedientes de la universidad.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción o Memoria Justificativa
                </label>
                <textarea
                  rows={3}
                  value={descNueva}
                  onChange={e => setDescNueva(e.target.value)}
                  placeholder="Objetivo del gasto, proyecto al que se imputa, etc."
                  className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52] resize-y"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50/70 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalCrearOpen(false)}
                className="px-3 py-2 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                disabled={creandoCaso}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrearExpediente}
                disabled={creandoCaso || !nombreNuevo.trim()}
                style={{ backgroundColor: '#176B52', color: '#ffffff', border: 'none' }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#125842] disabled:opacity-50 text-white cursor-pointer shadow-xs transition-colors"
              >
                {creandoCaso ? <Loader2 size={13} className="animate-spin" /> : <FolderPlus size={13} />}
                <span>Crear expediente</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
