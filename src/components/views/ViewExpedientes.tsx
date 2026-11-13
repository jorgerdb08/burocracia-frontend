import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, RefreshCw, Search, Eye, ArrowRight } from 'lucide-react';
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

  const counts = useMemo(() => {
    let dietas = 0;
    let proveedores = 0;
    let honorarios = 0;
    for (const c of casos) {
      const t = (c.tipo || '').toLowerCase();
      if (t === 'dietas' || t === 'dieta') dietas++;
      else if (t === 'proveedores' || t === 'pago_proveedor' || t === 'proveedor') proveedores++;
      else if (t === 'honorarios' || t === 'honorario') honorarios++;
    }
    return {
      todos: casos.length,
      dietas,
      pago_proveedor: proveedores,
      honorarios
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
    return {
      label: tipo || 'General',
      bg: '#F1F5F9',
      color: '#334155',
      border: '#CBD5E1'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Encabezado Editorial */}
      <div className="view-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="view-breadcrumb">
            <span>Sede Electrónica UEx</span>
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

        <div className="view-actions">
          <Btn variant="outline" size="sm" onClick={cargar} disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
            <span>Actualizar</span>
          </Btn>
        </div>
      </div>

      {/* Zona de filtros y búsqueda editorial */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: `Todos (${counts.todos})` },
            { id: 'dietas', label: `Dietas y Desplazamientos (${counts.dietas})` },
            { id: 'pago_proveedor', label: `Pago a Proveedor (${counts.pago_proveedor})` },
            { id: 'honorarios', label: `Honorarios (${counts.honorarios})` },
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
                <th style={{ width: '380px' }}>Expediente / Asunto</th>
                <th>Procedimiento</th>
                <th style={{ width: '130px' }}>Documentos</th>
                <th style={{ width: '220px' }}>Estado documental</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Acciones</th>
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
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.descripcion}>
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
                      {c.total_archivos || 0} archivo(s)
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onInspeccionar(c.id)}
                          className="btn btn-secondary btn-sm"
                          type="button"
                          title="Inspeccionar archivos y requisitos"
                        >
                          <Eye size={12} style={{ color: 'var(--text-muted)' }} />
                          <span>Detalle</span>
                        </button>
                        <Btn
                          size="sm"
                          variant="primary"
                          onClick={() => onProcesar(c.id, c.tipo)}
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

    </div>
  );
}
