import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Save, FileSpreadsheet, FileText, Plus, Trash2,
  Loader2, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';

interface FilaExcel {
  campo: string;
  valor: string;
}

interface ModalEditorDatosPersonalesProps {
  isOpen: boolean;
  onClose: () => void;
  casoId: string;
  archivoNombre?: string;
  focusOrganica?: boolean;
  onGuardado: (detalleActualizado: any) => void;
}

export function ModalEditorDatosPersonales({
  isOpen,
  onClose,
  casoId,
  archivoNombre,
  focusOrganica,
  onGuardado
}: ModalEditorDatosPersonalesProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [archivoActivo, setArchivoActivo] = useState<string>('DatosPersonales.xlsx');
  const [modo, setModo] = useState<'xlsx' | 'txt'>('xlsx');
  const [archivosDisponibles, setArchivosDisponibles] = useState<Array<{ nombre: string; tipo: 'xlsx' | 'txt' }>>([]);

  // Estados de edición directa
  const [filas, setFilas] = useState<FilaExcel[]>([]);
  const [textoPlano, setTextoPlano] = useState<string>('');

  // Nueva fila para el Excel
  const [nuevoCampo, setNuevoCampo] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');
  const [mostrarAddFila, setMostrarAddFila] = useState(false);

  const organicaInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar contenido real del archivo desde el backend
  useEffect(() => {
    if (!isOpen || !casoId) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const targetUrl = archivoNombre
      ? `/api/caso/${encodeURIComponent(casoId)}/archivo_editor?archivo=${encodeURIComponent(archivoNombre)}`
      : `/api/caso/${encodeURIComponent(casoId)}/archivo_editor`;

    fetch(targetUrl)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setArchivoActivo(data.archivo_nombre || 'DatosPersonales.xlsx');
          setModo(data.tipo || (data.archivo_nombre?.endsWith('.txt') ? 'txt' : 'xlsx'));
          setArchivosDisponibles(data.archivos_disponibles || []);
          setFilas(data.filas || []);
          setTextoPlano(data.texto || '');
        } else {
          setError(data.error || 'No se pudo cargar el archivo para edición.');
        }
      })
      .catch(err => {
        setError(err.message || 'Error de comunicación con el servidor.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, casoId, archivoNombre]);

  // Posicionar foco en la Orgánica si se solicitó
  useEffect(() => {
    if (isOpen && !loading && focusOrganica) {
      const timer = setTimeout(() => {
        if (modo === 'xlsx' && organicaInputRef.current) {
          organicaInputRef.current.focus();
          organicaInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (modo === 'txt' && textareaRef.current) {
          textareaRef.current.focus();
          const txt = textareaRef.current.value;
          const pos = txt.toLowerCase().indexOf('orgánica');
          if (pos !== -1) {
            textareaRef.current.setSelectionRange(pos, pos + 25);
          }
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loading, focusOrganica, modo]);

  if (!isOpen) return null;

  // Cambiar valor de celda en modo Excel
  const handleCambioValorFila = (index: number, nuevoVal: string) => {
    setFilas(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], valor: nuevoVal };
      return copy;
    });
  };

  // Cambiar nombre de campo en modo Excel
  const handleCambioCampoFila = (index: number, nuevoCmp: string) => {
    setFilas(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], campo: nuevoCmp };
      return copy;
    });
  };

  // Eliminar fila
  const handleEliminarFila = (index: number) => {
    setFilas(prev => prev.filter((_, idx) => idx !== index));
  };

  // Añadir nueva fila
  const handleAddFila = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCampo.trim()) return;
    setFilas(prev => [...prev, { campo: nuevoCampo.trim(), valor: nuevoValor.trim() }]);
    setNuevoCampo('');
    setNuevoValor('');
    setMostrarAddFila(false);
  };

  // Alternar archivo
  const handleSeleccionarArchivo = (nombre: string, tipo: 'xlsx' | 'txt') => {
    setArchivoActivo(nombre);
    setModo(tipo);
    setLoading(true);
    setError('');

    fetch(`/api/caso/${encodeURIComponent(casoId)}/archivo_editor?archivo=${encodeURIComponent(nombre)}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setFilas(data.filas || []);
          setTextoPlano(data.texto || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Guardar archivo
  const handleGuardar = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        archivo_nombre: archivoActivo,
        tipo: modo,
        filas: modo === 'xlsx' ? filas : undefined,
        texto: modo === 'txt' ? textoPlano : undefined
      };

      const res = await fetch(`/api/caso/${encodeURIComponent(casoId)}/archivo_editor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al guardar las modificaciones.');
      }

      setSuccessMsg('Archivo guardado correctamente y expediente actualizado.');
      setTimeout(() => {
        if (data.detalle) {
          onGuardado(data.detalle);
        }
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Oficial UEx */}
        <div
          style={{
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1E293B',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: modo === 'xlsx' ? '#176B52' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              {modo === 'xlsx' ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Editor de {modo === 'xlsx' ? 'Hoja de Cálculo Excel (.xlsx)' : 'Documento de Texto (.txt)'}
              </h3>
              <span style={{ fontSize: '11.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                {archivoActivo} · Expediente: {casoId}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Selector de archivos disponibles si hay más de uno o para alternar formato */}
            {archivosDisponibles.length > 1 && (
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1E293B', padding: '3px', borderRadius: '6px' }}>
                {archivosDisponibles.map((a, aIdx) => (
                  <button
                    key={aIdx}
                    type="button"
                    onClick={() => handleSeleccionarArchivo(a.nombre, a.tipo)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: archivoActivo === a.nombre ? 700 : 500,
                      backgroundColor: archivoActivo === a.nombre ? '#334155' : 'transparent',
                      color: archivoActivo === a.nombre ? '#FFFFFF' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {a.nombre}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Cerrar editor"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra Informativa Superior */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#475569',
            flexShrink: 0
          }}
        >
          <span>
            {modo === 'xlsx'
              ? 'Edite directamente los valores de las celdas de la hoja Excel. Al guardar, se actualizará el archivo en el expediente.'
              : 'Edite directamente el texto del archivo. Cada línea debe seguir el formato «Propiedad: Valor».'}
          </span>
          <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', fontSize: '11px' }}>
            {modo === 'xlsx' ? `${filas.length} filas` : `${textoPlano.split('\n').length} líneas`}
          </span>
        </div>

        {/* Mensaje de error o éxito */}
        {error && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', borderRadius: '6px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', borderRadius: '6px', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Cuerpo Principal del Editor */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px', color: '#64748B' }}>
              <Loader2 size={24} className="animate-spin" />
              <span style={{ fontSize: '13px' }}>Cargando contenido del archivo...</span>
            </div>
          ) : modo === 'xlsx' ? (
            /* ======================================================== */
            /* MODO TABLA EXCEL: Celdas de [Campo | Valor]              */
            /* ======================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#176B52', color: '#FFFFFF', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: '38%', fontWeight: 700, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        Campo (Propiedad UEx)
                      </th>
                      <th style={{ padding: '8px 12px', width: '54%', fontWeight: 700 }}>
                        Valor en la Celda
                      </th>
                      <th style={{ padding: '8px 8px', width: '8%', textAlign: 'center', fontWeight: 700 }}>
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, idx) => {
                      const kLower = fila.campo.toLowerCase();
                      const esOrganica = kLower.includes('orgánica') || kLower.includes('organica');
                      const esProyecto = kLower.includes('proyecto') || kLower.includes('referencia');
                      const estaVacio = !fila.valor || fila.valor.trim() === '';
                      const esFocoDestacado = (esOrganica || esProyecto) && focusOrganica;

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid #E2E8F0',
                            backgroundColor: esFocoDestacado
                              ? '#FEF2F2'
                              : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                          }}
                        >
                          {/* Columna Campo */}
                          <td style={{ padding: '6px 12px', borderRight: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: esFocoDestacado ? '#991B1B' : '#1E293B' }}>
                                {fila.campo}
                              </span>
                              {esOrganica && estaVacio && (
                                <span style={{ fontSize: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                                  Falta
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Columna Valor */}
                          <td style={{ padding: '4px 8px' }}>
                            <input
                              ref={esOrganica ? organicaInputRef : undefined}
                              type="text"
                              value={fila.valor}
                              onChange={(e) => handleCambioValorFila(idx, e.target.value)}
                              placeholder={
                                esOrganica
                                  ? 'Ej: 18.IW.A8.FA'
                                  : esProyecto
                                  ? 'Ej: GR24099'
                                  : 'Valor...'
                              }
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '5px',
                                border: esFocoDestacado
                                  ? '2px solid #DC2626'
                                  : '1px solid #CBD5E1',
                                backgroundColor: esFocoDestacado ? '#FFFFFF' : '#FFFFFF',
                                fontSize: '12px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                color: '#0F172A',
                                outline: 'none'
                              }}
                            />
                          </td>

                          {/* Columna Eliminar */}
                          <td style={{ padding: '4px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleEliminarFila(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                              title="Eliminar fila"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botón para añadir nueva fila personalizada */}
              {!mostrarAddFila ? (
                <button
                  type="button"
                  onClick={() => setMostrarAddFila(true)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#176B52',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={13} />
                  <span>Añadir fila al Excel</span>
                </button>
              ) : (
                <form
                  onSubmit={handleAddFila}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1'
                  }}
                >
                  <input
                    type="text"
                    value={nuevoCampo}
                    onChange={(e) => setNuevoCampo(e.target.value)}
                    placeholder="Nombre del campo (ej: Subvención)"
                    style={{ flex: 1, padding: '5px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                    placeholder="Valor"
                    style={{ flex: 1, padding: '5px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                  <button
                    type="submit"
                    style={{ padding: '5px 10px', borderRadius: '4px', backgroundColor: '#176B52', color: '#fff', fontSize: '11.5px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Insertar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarAddFila(false)}
                    style={{ padding: '5px 8px', borderRadius: '4px', backgroundColor: 'transparent', color: '#64748B', fontSize: '11.5px', border: 'none', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* MODO TEXTO PLANO: Editor Textarea (.txt)                 */
            /* ======================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                ref={textareaRef}
                value={textoPlano}
                onChange={(e) => setTextoPlano(e.target.value)}
                rows={15}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: focusOrganica ? '2px solid #DC2626' : '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '12.5px',
                  lineHeight: '1.6',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '280px'
                }}
                placeholder="Fecha de salida: 2026-06-15\nComisionado: Dr. Juan Pérez Ejemplo\nOrgánica Presupuestaria: 18.IW.A8.FA"
              />
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
            Archivo destino: <strong style={{ color: '#0F172A' }}>{archivoActivo}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving || loading}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#176B52',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(23, 107, 82, 0.25)',
                opacity: (saving || loading) ? 0.7 : 1
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Guardar cambios en {archivoActivo}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
