import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { AlertErr } from '../ui/Alerts';
import { Btn } from '../ui/Btn';
import { cn } from '../../lib/utils';

export function ViewExpedientes({
  onProcesar,
  onInspeccionar
}: {
  onProcesar: (id: string) => void;
  onInspeccionar: (id: string) => void;
}) {
  const [casos, setCasos] = useState<{ id: string, tipo: string, total_archivos?: number, porcentaje?: number, completo?: boolean }[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');

  const cargar = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/casos');
      const data = await res.json();
      setCasos(data.casos || []);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filteredCasos = useMemo(() => {
    return casos.filter(c => {
      const matchSearch = c.id.toLowerCase().includes(search.toLowerCase()) || c.tipo.toLowerCase().includes(search.toLowerCase());
      const matchTipo = tipoFiltro === 'todos' || c.tipo === tipoFiltro;
      return matchSearch && matchTipo;
    });
  }, [casos, search, tipoFiltro]);

  const getTipoNombre = (tipo: string) => {
    switch (tipo) {
      case 'dietas': return 'Dietas y Desplazamientos';
      case 'pago_proveedor': return 'Pago a Proveedor';
      case 'honorarios': return 'Honorarios de Conferencia';
      case 'adquisiciones': return 'Contrato Menor';
      default: return tipo;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado: ¿Dónde estoy? + Acción principal */}
      <div className="view-header">
        <div>
          <div className="view-breadcrumb">
            <span>Gestión Económica UEx</span>
            <span>/</span>
            <span>Catálogo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h1 className="view-title">Expedientes de gasto</h1>
            {status === 'done' && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                ({filteredCasos.length} registrados)
              </span>
            )}
          </div>
          <p className="view-desc">
            Bandeja de expedientes digitalizados para su fiscalización, comprobación de requisitos normativos y liquidación económica.
          </p>
        </div>

        <div className="view-actions">
          <Btn variant="outline" size="sm" onClick={cargar} disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
            <span>Actualizar</span>
          </Btn>
        </div>
      </div>

      {/* Zona compacta de filtros y búsqueda */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'dietas', label: 'Dietas y Viajes' },
            { id: 'pago_proveedor', label: 'Proveedores' },
            { id: 'honorarios', label: 'Honorarios' },
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

        <div className="search-input-box" style={{ minWidth: '220px' }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {status === 'loading' && (
        <div className="panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Cargando expedientes...</span>
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
                <th style={{ width: '280px' }}>Código de Expediente</th>
                <th>Procedimiento</th>
                <th style={{ width: '140px' }}>Documentos</th>
                <th style={{ width: '200px' }}>Estado documental</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCasos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No hay expedientes que coincidan con el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                filteredCasos.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.id}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {getTipoNombre(c.tipo)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {c.total_archivos || 0} archivo(s)
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <span 
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: c.completo ? 'var(--color-success)' : 'var(--color-warning)',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ color: c.completo ? 'var(--color-success-text)' : 'var(--color-warning-text)', fontWeight: 500 }}>
                          {c.completo ? 'Documentación completa' : 'Pendiente de completar'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => onInspeccionar(c.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            textDecoration: 'underline'
                          }}
                          type="button"
                        >
                          Ver detalle
                        </button>
                        <Btn
                          size="sm"
                          variant="primary"
                          onClick={() => onProcesar(c.id)}
                        >
                          Tramitar
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
