import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderOpen, ChevronUp, ChevronDown, UploadCloud, Download,
  AlertOctagon, CheckCircle2, FileCheck, Building2,
  Scale, ShieldAlert, ArrowRight, Loader2, Eye, Edit3, Check, X,
  ArrowLeft, ShieldCheck, RefreshCw, FileText, CreditCard, Send,
  Archive, CheckCircle, RotateCcw, ExternalLink, Trash2, Info
} from 'lucide-react';
import { fmtEur } from '../../lib/utils';

export interface ArchivoEntrada {
  nombre: string;
  tamano_bytes?: number;
  tamano_kb?: number;
  categoria?: string;
  rol?: string;
  extension?: string;
}

export interface ProveedorInfo {
  razon_social: string;
  cif: string;
  domicilio: string;
  iban?: string;
  acreditacion_titularidad?: boolean;
}

export interface FacturaInfo {
  numero: string;
  fecha?: string;
  fecha_emision?: string;
  concepto: string;
  base_imponible: number;
  tipo_iva: number;
  iva_pct?: number;
  cuota_iva?: number;
  iva_importe?: number;
  total: number;
  moneda?: string;
}

export interface PresupuestoInfo {
  investigador_principal: string;
  solicitante: string;
  proyecto?: string;
  proyecto_referencia?: string;
  organica: string;
  centro_gasto?: string;
  tipo_gasto: string;
  motivo?: string;
  concepto_motivado?: string;
  importe_solicitado: number;
}

export interface PagoInfo {
  modalidad: 'tarjeta' | 'transferencia';
  es_tarjeta?: boolean;
  fecha_pago?: string;
  importe_pagado?: number;
  num_tarjeta?: string;
  tarjeta_ultimos4?: string;
  justificante_asociado?: string;
  extracto_asociado?: string;
  iban_proveedor?: string;
}

export interface ExpedienteProveedor {
  caso_id: string;
  proveedor: ProveedorInfo;
  factura: FacturaInfo;
  presupuesto: PresupuestoInfo;
  pago: PagoInfo;
  archivos_entrada: ArchivoEntrada[];
}

export interface IncidenciaRoja {
  codigo: string;
  titulo: string;
  mensaje: string;
  bloqueante: boolean;
  actuacion_requerida?: string;
  documentos_implicados?: string[];
  importes?: {
    importe_factura: number;
    importe_solicitado: number;
    diferencia: number;
  };
}

export interface ComprobacionNormativa {
  etiqueta: string;
  detalle: string;
  estado: 'VERDE' | 'ROJO' | 'AMARILLO';
}

export interface DiagnosticoProveedor {
  semaforo: 'VERDE' | 'ROJO';
  es_tramitable: boolean;
  incidencias_rojas: IncidenciaRoja[];
  advertencias_amarillas: any[];
  comprobaciones: ComprobacionNormativa[];
  total_incidencias_rojas: number;
  total_advertencias_amarillas: number;
}

export interface DocumentoOficialSalida {
  id?: string;
  nombre?: string;
  titulo?: string;
  ruta?: string;
  tamano_kb: number;
  tipo?: string;
  descripcion: string;
  url_descarga?: string;
  download_url?: string;
  preview_url?: string;
}

export interface ResultadoDocumentos {
  ok: boolean;
  bloqueado: boolean;
  caso_id: string;
  documentos_info: DocumentoOficialSalida[];
  zip_nombre?: string;
  zip_url?: string;
}

export interface CasoDemo {
  id: string;
  nombre: string;
  descripcion: string;
  modalidad: 'tarjeta' | 'transferencia';
  semaforo_esperado: 'VERDE' | 'ROJO';
  num_archivos: number;
  archivos: string[];
  es_personalizado?: boolean;
}

const TIPOS_GASTO_OFICIALES = [
  'Material fungible',
  'Viajes y dietas',
  'Material inventariable',
  'Gastos Varios',
  'Servicios',
  'Gastos de personal'
];

function cleanTituloCaso(rawName?: string): string {
  if (!rawName) return '';
  return rawName.replace(/^Caso\s+[A-Z0-9]+\s*[·\-:]\s*/i, '').trim();
}

function getModalidadBadgeStyle(modalidad: string): { bg: string; color: string; border: string; label: string } {
  if (modalidad === 'tarjeta') {
    return {
      bg: '#FDF6EC',
      color: '#9A5B13',
      border: '#F2DCBA',
      label: 'Tarjeta Investigador'
    };
  }
  return {
    bg: '#EFF4FB',
    color: '#174F91',
    border: '#CEDDF0',
    label: 'Transferencia Bancaria'
  };
}

function getDocSalidaBadge(nombreDoc?: string): { bg: string; color: string; border: string; label: string } {
  const low = (nombreDoc || '').toLowerCase();
  if (low.includes('anexo_ii') || low.includes('anexo ii') || low.includes('aprobacion')) {
    return { bg: '#EFF4FB', color: '#174F91', border: '#CEDDF0', label: 'Anexo II' };
  }
  if (low.includes('anexo_a') || low.includes('anexo a') || low.includes('justificaci') || low.includes('propuesta')) {
    return { bg: '#EEF7F3', color: '#176B52', border: '#C6E3D7', label: 'Anexo A' };
  }
  return { bg: '#F1F5F9', color: '#334155', border: '#CBD5E1', label: 'Documento PDF' };
}

export function GeneradorProveedoresInteligente({ initialCasoId }: { initialCasoId?: string | null } = {}) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [casosDemo, setCasosDemo] = useState<CasoDemo[]>([]);
  const [casoActivoId, setCasoActivoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensajeCarga, setMensajeCarga] = useState<string>('');

  const [expediente, setExpediente] = useState<ExpedienteProveedor | null>(null);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoProveedor | null>(null);
  const [resultadoDocumentos, setResultadoDocumentos] = useState<ResultadoDocumentos | null>(null);

  const [mostrarDocumentosEntrada, setMostrarDocumentosEntrada] = useState<boolean>(true);
  const [docEnVisor, setDocEnVisor] = useState<any | null>(null);
  const [cargandoVisor, setCargandoVisor] = useState<boolean>(false);
  const [modoEdicion, setModoEdicion] = useState<boolean>(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [refRectificativa, setRefRectificativa] = useState<string>('RES-RECT-UEx-2026-004');

  // Gestión de nombre personalizado, renombrado y eliminación
  const [nombreNuevoCaso, setNombreNuevoCaso] = useState<string>('');
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[] | null>(null);
  const [modalNombrarOpen, setModalNombrarOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [casoObjetivoAccion, setCasoObjetivoAccion] = useState<{ id: string; nombre: string } | null>(null);
  const [modalRenombrarOpen, setModalRenombrarOpen] = useState<boolean>(false);
  const [nuevoNombreRenombrar, setNuevoNombreRenombrar] = useState<string>('');
  const [modalEliminarOpen, setModalEliminarOpen] = useState<boolean>(false);
  const [cargandoAccion, setCargandoAccion] = useState<boolean>(false);

  const recargarCasos = () => {
    fetch('/api/proveedores/casos_precargados')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.casos)) {
          setCasosDemo(data.casos);
        }
      })
      .catch((err) => console.error('Error cargando casos proveedores:', err));
  };

  useEffect(() => {
    recargarCasos();
  }, []);

  const avisar = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 4000);
  };

  const handleEliminarArchivo = async (nombreArchivo: string) => {
    const cid = casoActivoId || expediente?.caso_id;
    if (!cid) return;
    if (!window.confirm(`¿Desea eliminar el documento "${nombreArchivo}" de este expediente?`)) return;
    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(cid)}/archivo/${encodeURIComponent(nombreArchivo)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok && res.status !== 404) {
        throw new Error(data?.error || 'Error al eliminar el documento.');
      }
      setExpediente((prev) =>
        prev
          ? {
              ...prev,
              archivos_entrada: (prev.archivos_entrada || []).filter((a) => a.nombre !== nombreArchivo)
            }
          : prev
      );
      if (docEnVisor?.nombre === nombreArchivo) {
        setDocEnVisor(null);
      }
      recargarCasos();
      avisar(`Documento "${nombreArchivo}" eliminado del expediente.`);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el documento.');
    }
  };

  const handleCargarCasoDemo = async (casoId: string) => {
    setCasoActivoId(casoId);
    setCargando(true);
    setMensajeCarga(`Analizando expediente ${cleanTituloCaso(casoId)}...`);
    try {
      const res = await fetch(`/api/proveedores/cargar_demostracion/${encodeURIComponent(casoId)}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.ok) {
        setExpediente(data.expediente);
        setDiagnostico(data.diagnostico);
        setResultadoDocumentos(data.resultado_documentos || null);
        setModoEdicion(false);
        setPaso(2);
      } else {
        alert(`Error al analizar expediente: ${data.error || 'Error desconocido'}`);
      }
    } catch (err: any) {
      alert(`Error en la solicitud: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (initialCasoId) {
      handleCargarCasoDemo(initialCasoId);
    }
  }, [initialCasoId]);

  const ejecutarSubidaArchivos = async (filesArr: File[], nombrePersonalizado: string) => {
    if (!filesArr || filesArr.length === 0) return;
    setCargando(true);
    setMensajeCarga(
      nombrePersonalizado
        ? `Analizando y guardando expediente "${nombrePersonalizado}"...`
        : 'Subiendo y analizando documentación aportada...'
    );

    const formData = new FormData();
    filesArr.forEach((f, idx) => formData.append(`file_${idx}`, f));
    if (nombrePersonalizado.trim()) {
      formData.append('nombre_caso', nombrePersonalizado.trim());
    }

    try {
      const res = await fetch('/api/proveedores/analizar_expediente', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.ok) {
        setCasoActivoId(data.caso_id);
        setExpediente(data.expediente);
        setDiagnostico(data.diagnostico);
        setResultadoDocumentos(data.resultado_documentos || null);
        setModoEdicion(false);
        setNombreNuevoCaso('');
        setPendingUploadFiles(null);
        setModalNombrarOpen(false);
        recargarCasos();
        setPaso(2);
        avisar(`Expediente "${data.caso_id}" analizado y guardado correctamente.`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error al procesar archivos: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionarArchivos = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const filesArr = Array.from(filesList);
    if (nombreNuevoCaso.trim()) {
      ejecutarSubidaArchivos(filesArr, nombreNuevoCaso.trim());
    } else {
      const baseName = filesArr[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      setNombreNuevoCaso(baseName || 'Expediente_Proveedor_2026');
      setPendingUploadFiles(filesArr);
      setModalNombrarOpen(true);
    }
  };

  const handleSubirArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSeleccionarArchivos(e.target.files);
    e.target.value = '';
  };

  const handleConfirmarRenombrar = async () => {
    if (!casoObjetivoAccion || !nuevoNombreRenombrar.trim()) return;
    setCargandoAccion(true);
    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(casoObjetivoAccion.id)}/renombrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevo_nombre: nuevoNombreRenombrar.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al renombrar el expediente.');
      const nuevoId = data.caso_id || casoObjetivoAccion.id;
      if (casoActivoId === casoObjetivoAccion.id) {
        setCasoActivoId(nuevoId);
        setExpediente((prev) => (prev ? { ...prev, caso_id: nuevoId } : prev));
      }
      setModalRenombrarOpen(false);
      setCasoObjetivoAccion(null);
      recargarCasos();
      avisar(`Expediente renombrado a "${nuevoNombreRenombrar.trim()}".`);
    } catch (err: any) {
      alert(err.message || 'No se pudo renombrar el expediente.');
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!casoObjetivoAccion) return;
    setCargandoAccion(true);
    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(casoObjetivoAccion.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar el expediente.');
      if (casoActivoId === casoObjetivoAccion.id) {
        setPaso(1);
        setCasoActivoId(null);
        setExpediente(null);
        setDiagnostico(null);
        setResultadoDocumentos(null);
      }
      setModalEliminarOpen(false);
      setCasoObjetivoAccion(null);
      recargarCasos();
      avisar('Expediente eliminado correctamente.');
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el expediente.');
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleVerDocumento = async (archivo: { nombre: string; categoria?: string; tamano_kb?: number }) => {
    setCargandoVisor(true);
    const cid = casoActivoId || expediente?.caso_id || 'Caso_A_Tarjeta';
    try {
      const res = await fetch(`/api/proveedores/archivo_preview/${encodeURIComponent(cid)}/${encodeURIComponent(archivo.nombre)}`);
      if (res.ok) {
        const info = await res.json();
        setDocEnVisor({
          nombre: archivo.nombre,
          categoria: archivo.categoria || 'Documento de Entrada',
          tamano: (archivo.tamano_kb || 0) * 1024,
          tipo: info.tipo || 'pdf',
          url_raw: info.url_raw || `/api/proveedores/descargar_documento/${encodeURIComponent(cid)}/${encodeURIComponent(archivo.nombre)}?inline=1`,
          download_url: `/api/proveedores/descargar_documento/${encodeURIComponent(cid)}/${encodeURIComponent(archivo.nombre)}?download=1`,
          texto: info.texto || ''
        });
      } else {
        const urlRaw = `/api/proveedores/descargar_documento/${encodeURIComponent(cid)}/${encodeURIComponent(archivo.nombre)}`;
        const ext = archivo.nombre.split('.').pop()?.toLowerCase();
        setDocEnVisor({
          nombre: archivo.nombre,
          categoria: archivo.categoria || 'Documento',
          tipo: ext === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(ext || '') ? 'imagen' : 'texto',
          url_raw: urlRaw,
          download_url: `${urlRaw}?download=1`
        });
      }
    } catch (err) {
      console.error('Error previsualizando documento:', err);
    } finally {
      setCargandoVisor(false);
    }
  };

  const handleVerDocSalida = (doc: DocumentoOficialSalida) => {
    const docNombre = doc.nombre || doc.titulo || '01_Anexo_II_Aprobacion_del_Gasto.pdf';
    const rawUrl = doc.preview_url || doc.url_descarga || doc.download_url || '';
    const dlUrl = doc.download_url || doc.url_descarga || `${rawUrl}?download=1`;
    setDocEnVisor({
      nombre: docNombre,
      categoria: 'Documento Oficial SGTRI Generado',
      tipo: 'pdf',
      tamano: (doc.tamano_kb || 320) * 1024,
      url_raw: rawUrl,
      download_url: dlUrl
    });
  };

  const ejecutarValidacion = async (expActualizado: ExpedienteProveedor) => {
    try {
      const res = await fetch('/api/proveedores/validar_expediente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caso_id: casoActivoId || expActualizado.caso_id,
          expediente: expActualizado
        })
      });
      const data = await res.json();
      if (data.ok) {
        setDiagnostico(data.diagnostico);
      }
    } catch (err) {
      console.error('Error validando expediente:', err);
    }
  };

  const handleSubsanarAlineando = async () => {
    if (!expediente) return;
    const nuevoExp: any = {
      ...expediente,
      presupuesto: {
        ...expediente.presupuesto,
        importe_solicitado: expediente.factura.total
      },
      pago: {
        ...expediente.pago,
        importe_solicitado: expediente.factura.total
      }
    };
    setExpediente(nuevoExp);
    await ejecutarValidacion(nuevoExp);
    avisar(`Discordancia subsanada: Importe solicitado alineado a ${fmtEur(expediente.factura.total)}.`);
  };

  const handleSubsanarConvalidando = async () => {
    if (!expediente) return;
    const nuevoExp: any = {
      ...expediente,
      rectificacion_justificada: true,
      rectificacion_referencia: refRectificativa
    };
    setExpediente(nuevoExp);
    await ejecutarValidacion(nuevoExp);
    avisar(`Convalidada rectificación con ref: ${refRectificativa}.`);
  };

  const handleGenerarDocumentos = async () => {
    if (!expediente) return;
    if (diagnostico && diagnostico.semaforo === 'ROJO') {
      alert('No es posible generar los documentos oficiales: El expediente tiene un bloqueo rojo de Intervención.');
      return;
    }

    setCargando(true);
    setMensajeCarga('Generando Anexo II y Anexo A oficiales en PDF con motor determinista UEx...');
    try {
      const res = await fetch('/api/proveedores/generar_documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caso_id: casoActivoId || expediente.caso_id,
          expediente
        })
      });
      const data = await res.json();
      if (data.ok) {
        setResultadoDocumentos(data);
        setPaso(3);
        avisar('Documentos oficiales generados correctamente.');
      } else {
        alert(`Error generando documentos: ${data.error || 'Bloqueo normativo'}`);
      }
    } catch (err: any) {
      alert(`Error en la solicitud: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (initialCasoId) {
      handleCargarCasoDemo(initialCasoId);
    }
  }, [initialCasoId]);

  const archivosEntrada = expediente?.archivos_entrada || [];
  const incidenciasRojas = diagnostico?.incidencias_rojas || [];
  const docsGenerados = resultadoDocumentos?.documentos_info || [];
  const casosPersonalizados = casosDemo.filter((c) => c.es_personalizado);
  const casosReferencia = casosDemo.filter((c) => !c.es_personalizado);

  const casoActualMeta = casosDemo.find((c) => c.id === (casoActivoId || expediente?.caso_id));
  const nombreActivoVisible = cleanTituloCaso(casoActualMeta?.nombre) || casoActivoId || expediente?.caso_id || '';

  const getFieldStyle = (enabled: boolean, mono = false): React.CSSProperties => ({
    width: '100%',
    padding: '0.45rem 0.65rem',
    fontSize: '0.82rem',
    fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    backgroundColor: enabled ? '#FFFFFF' : '#F8FAFC',
    color: '#0F172A',
    outline: 'none'
  });

  const fieldLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#526783',
    marginBottom: '0.25rem'
  };

  return (
    <div style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', padding: '1.25rem 1.5rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notificación */}
      {notificacion && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '0.75rem 1.1rem',
            borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            fontSize: '0.84rem',
            fontWeight: 600,
            border: '1px solid #334155'
          }}
        >
          <CheckCircle2 size={16} color="#34D399" />
          <span>{notificacion}</span>
        </div>
      )}

      {/* Encabezado Editorial SGTRI */}
      <div className="view-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="view-breadcrumb">
            <span>Sede Electrónica UEx</span>
            <span>/</span>
            <span>Gestión Económica</span>
            <span>/</span>
            <span>Pago a Proveedores</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h1 className="view-title">Pago a Proveedores</h1>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
              SGTRI UEx
            </span>
          </div>
          <p className="view-desc">
            Conciliación económica de facturas de compras y servicios (Tarjeta del Investigador o Transferencia Bancaria) y expedición de modelos oficiales Anexo II y Anexo A.
          </p>
        </div>

        <div className="view-actions">
          <span className="badge">
            <span className="badge-dot badge-dot-accent" />
            Plantillas Oficiales 2026
          </span>
        </div>
      </div>

      {/* Indicador de Carga */}
      {cargando && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            color: 'var(--color-navy, #14213D)',
            fontWeight: 600,
            fontSize: '0.86rem'
          }}
        >
          <Loader2 className="animate-spin" size={16} />
          <span>{mensajeCarga || 'Procesando expediente con motor SGTRI...'}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 1: SELECCIÓN Y CARGA EN MODO LISTA                                  */}
      {/* ========================================================================= */}
      {paso === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Panel de Subida de Nuevo Expediente */}
          <div
            className="panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: isDragging ? '#F0FDF4' : 'var(--bg-surface, #FFFFFF)',
              borderColor: isDragging ? 'var(--brand-accent, #176B52)' : 'var(--border-color, #DFE4EB)'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleSeleccionarArchivos(e.dataTransfer.files);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-navy, #14213D)' }}>
                  Aportar documentación del expediente
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '0.79rem', color: 'var(--text-secondary, #526783)' }}>
                  Arrastra o selecciona la factura (PDF, imágenes, Word) y, opcionalmente, justificantes de cargo o documento explicativo.
                </p>
              </div>

              <label
                className="btn btn-sm btn-outline"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <UploadCloud size={14} />
                <span>Examinar archivos...</span>
                <input
                  type="file"
                  multiple
                  onChange={handleSubirArchivos}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.txt,.md"
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-subtle, #F1F5F9)' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #526783)', whiteSpace: 'nowrap' }}>
                Nombre del expediente <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span>:
              </label>
              <input
                type="text"
                value={nombreNuevoCaso}
                onChange={(e) => setNombreNuevoCaso(e.target.value)}
                placeholder="Ej: Factura_OpenAI_Mayo_2026 o Licencia_Software_UEx"
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '6px 10px',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--border-color, #CBD5E1)',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A'
                }}
              />
            </div>
          </div>

          {/* Lista de Expedientes Guardados por el Usuario */}
          {casosPersonalizados.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Expedientes Guardados ({casosPersonalizados.length})
                </span>
                <span style={{ fontSize: '0.77rem', color: '#526783' }}>
                  Expedientes propios subidos y conservados en el sistema
                </span>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '190px' }}>Modalidad</th>
                      <th>Expediente</th>
                      <th style={{ width: '130px' }}>Documentación</th>
                      <th style={{ width: '160px' }}>Estado</th>
                      <th style={{ width: '210px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casosPersonalizados.map((c) => {
                      const modStyle = getModalidadBadgeStyle(c.modalidad);
                      const esVerde = c.semaforo_esperado !== 'ROJO';
                      return (
                        <tr key={c.id}>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                whiteSpace: 'nowrap',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                backgroundColor: modStyle.bg,
                                color: modStyle.color,
                                border: `1px solid ${modStyle.border}`
                              }}
                            >
                              {c.modalidad === 'tarjeta' ? <CreditCard size={12} color={modStyle.color} /> : <Send size={12} color={modStyle.color} />}
                              {modStyle.label}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-navy, #14213D)', fontSize: '0.86rem' }}>
                              {cleanTituloCaso(c.nombre)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#526783', marginTop: '0.15rem' }}>
                              {c.descripcion}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                fontFamily: 'var(--font-mono, monospace)',
                                fontSize: '0.75rem',
                                color: '#475569',
                                fontWeight: 600
                              }}
                            >
                              {c.num_archivos} archivo(s)
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: esVerde ? '#15803D' : '#B91C1C'
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: esVerde ? '#16A34A' : '#DC2626', display: 'inline-block' }} />
                              <span>{esVerde ? 'Listo para tramitar' : 'Requiere revisión'}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="action-btn-edit"
                                title="Renombrar expediente"
                                onClick={() => {
                                  setCasoObjetivoAccion({ id: c.id, nombre: cleanTituloCaso(c.nombre) });
                                  setNuevoNombreRenombrar(cleanTituloCaso(c.nombre));
                                  setModalRenombrarOpen(true);
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="action-btn-delete"
                                title="Eliminar expediente"
                                onClick={() => {
                                  setCasoObjetivoAccion({ id: c.id, nombre: cleanTituloCaso(c.nombre) });
                                  setModalEliminarOpen(true);
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => handleCargarCasoDemo(c.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.25rem' }}
                              >
                                <span>Abrir</span>
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lista de Casos de Referencia */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Casos de Referencia ({casosReferencia.length})
              </span>
              <span style={{ fontSize: '0.77rem', color: '#526783' }}>
                Expedientes de prueba SGTRI con factura real para ambas modalidades de pago
              </span>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '190px' }}>Modalidad</th>
                    <th>Expediente</th>
                    <th style={{ width: '130px' }}>Documentación</th>
                    <th style={{ width: '160px' }}>Estado</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {casosReferencia.map((c) => {
                    const modStyle = getModalidadBadgeStyle(c.modalidad);
                    const esVerde = c.semaforo_esperado !== 'ROJO';
                    return (
                      <tr key={c.id}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              whiteSpace: 'nowrap',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: modStyle.bg,
                              color: modStyle.color,
                              border: `1px solid ${modStyle.border}`
                            }}
                          >
                            {c.modalidad === 'tarjeta' ? <CreditCard size={12} color={modStyle.color} /> : <Send size={12} color={modStyle.color} />}
                            {modStyle.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-navy, #14213D)', fontSize: '0.86rem' }}>
                            {cleanTituloCaso(c.nombre)}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#526783', marginTop: '0.15rem', lineHeight: 1.4 }}>
                            {c.descripcion}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily: 'var(--font-mono, monospace)',
                              fontSize: '0.75rem',
                              color: '#475569',
                              fontWeight: 600
                            }}
                          >
                            {c.num_archivos} archivo(s)
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: esVerde ? '#15803D' : '#B91C1C'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: esVerde ? '#16A34A' : '#DC2626', display: 'inline-block' }} />
                            <span>{esVerde ? 'Listo para tramitar' : 'Control de bloqueo'}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => handleCargarCasoDemo(c.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <span>Cargar</span>
                            <ArrowRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: REVISIÓN DE DATOS EXTRAÍDOS Y CONCILIACIÓN                       */}
      {/* ========================================================================= */}
      {paso === 2 && expediente && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Barra superior de retorno y acciones sobre el expediente */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="btn btn-sm btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ArrowLeft size={14} />
              <span>Volver a selección de expedientes</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#526783' }}>
                Expediente activo:{' '}
                <strong
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    color: '#14213D',
                    backgroundColor: '#F1F5FA',
                    padding: '0.18rem 0.5rem',
                    borderRadius: '5px',
                    border: '1px solid #DFE4EB'
                  }}
                >
                  {nombreActivoVisible}
                </strong>
              </span>
              <button
                type="button"
                className="action-btn-edit"
                title="Renombrar expediente"
                onClick={() => {
                  const currentId = casoActivoId || expediente.caso_id;
                  setCasoObjetivoAccion({ id: currentId, nombre: nombreActivoVisible });
                  setNuevoNombreRenombrar(nombreActivoVisible);
                  setModalRenombrarOpen(true);
                }}
              >
                <Edit3 size={14} />
              </button>
              <button
                type="button"
                className="action-btn-delete"
                title="Eliminar expediente"
                onClick={() => {
                  const currentId = casoActivoId || expediente.caso_id;
                  setCasoObjetivoAccion({ id: currentId, nombre: nombreActivoVisible });
                  setModalEliminarOpen(true);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Banner de Semáforo y Conciliación */}
          {diagnostico && (
            <div
              className="panel"
              style={{
                padding: '14px 18px',
                borderLeft: `3px solid ${diagnostico.semaforo === 'VERDE' ? '#166534' : '#DC2626'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: diagnostico.semaforo === 'VERDE' ? '#F0FDF4' : '#FEF2F2',
                    color: diagnostico.semaforo === 'VERDE' ? '#166534' : '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${diagnostico.semaforo === 'VERDE' ? '#BBF7D0' : '#FECACA'}`
                  }}
                >
                  {diagnostico.semaforo === 'VERDE' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: diagnostico.semaforo === 'VERDE' ? '#166534' : '#DC2626' }}>
                      DICTAMEN {diagnostico.semaforo}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy, #14213D)' }}>
                      {diagnostico.semaforo === 'VERDE' ? 'Expediente conforme y tramitable' : 'Expediente con observaciones de intervención'}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary, #526783)' }}>
                    {diagnostico.semaforo === 'VERDE'
                      ? 'Requisitos normativos verificados. Factura, proveedor e imputación presupuestaria conciliados.'
                      : 'Se han detectado discordancias económicas que impiden la emisión automática de la orden de pago.'}
                  </p>
                </div>
              </div>

              {diagnostico.semaforo === 'VERDE' ? (
                <button
                  type="button"
                  onClick={handleGenerarDocumentos}
                  className="btn btn-sm btn-uex"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileCheck size={14} />
                  <span>Generar Documentos Oficiales</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B' }}>
                  Subsanación requerida
                </span>
              )}
            </div>
          )}

          {/* Bloque de Incidencias Bloqueantes (Diseño claro SGTRI) */}
          {incidenciasRojas.length > 0 && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #FECDD3',
                borderLeft: '4px solid #DC2626',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(153, 27, 27, 0.05)'
              }}
            >
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  borderBottom: '1px solid #FECACA',
                  padding: '0.8rem 1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#991B1B' }}>
                  <AlertOctagon size={18} />
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>
                    Incidencia Bloqueante Detectada ({incidenciasRojas.length})
                  </h4>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991B1B', backgroundColor: '#FEE2E2', padding: '0.18rem 0.55rem', borderRadius: '6px' }}>
                  Subsanación requerida
                </span>
              </div>

              <div style={{ padding: '1.1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {incidenciasRojas.map((err, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div
                      style={{
                        backgroundColor: '#FFF5F5',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        padding: '0.85rem 1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#991B1B' }}>
                          Motivo detectado
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontFamily: 'ui-monospace, monospace',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B'
                          }}
                        >
                          {err.codigo}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#7F1D1D', lineHeight: 1.45 }}>
                        {err.mensaje}
                      </div>
                    </div>

                    {err.importes && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #DFE4EB', borderRadius: '8px', padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#526783', display: 'block' }}>Factura Proveedor</span>
                          <strong style={{ fontSize: '0.95rem', color: '#14213D', fontFamily: 'ui-monospace, monospace' }}>
                            {fmtEur(err.importes.importe_factura)}
                          </strong>
                        </div>
                        <div style={{ backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '8px', padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#9F1239', display: 'block' }}>Memoria / Solicitud</span>
                          <strong style={{ fontSize: '0.95rem', color: '#BE123C', fontFamily: 'ui-monospace, monospace' }}>
                            {fmtEur(err.importes.importe_solicitado)}
                          </strong>
                        </div>
                        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#991B1B', display: 'block' }}>Discordancia</span>
                          <strong style={{ fontSize: '0.95rem', color: '#991B1B', fontFamily: 'ui-monospace, monospace' }}>
                            {fmtEur(Math.abs(err.importes.diferencia))}
                          </strong>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #DFE4EB',
                        borderRadius: '8px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155' }}>
                        Solución y acciones disponibles
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleSubsanarAlineando}
                          className="btn btn-sm btn-uex"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Ajusta el importe en la memoria para eliminar el descuadre con la factura oficial"
                        >
                          <Check size={14} />
                          <span>Ajustar Solicitud a {fmtEur(expediente.factura.total)} y Subsanar</span>
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={refRectificativa}
                            onChange={(e) => setRefRectificativa(e.target.value)}
                            placeholder="Ref. Factura Rectificativa"
                            style={{
                              padding: '0.35rem 0.6rem',
                              fontSize: '0.78rem',
                              fontFamily: 'ui-monospace, monospace',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF',
                              color: '#0F172A'
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleSubsanarConvalidando}
                            className="btn btn-sm btn-outline"
                            title="Convalida que existe factura rectificativa o adenda formal"
                          >
                            Convalidar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentación y Justificantes de Entrada */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-color, #DFE4EB)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(20, 33, 61, 0.04)'
            }}
          >
            <div
              style={{
                padding: '0.9rem 1.2rem',
                borderBottom: mostrarDocumentosEntrada ? '1px solid #DFE4EB' : 'none',
                backgroundColor: '#F7F9FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1E40AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <FolderOpen size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#14213D' }}>
                      Documentación y Justificantes de Entrada
                    </h4>
                    <span
                      style={{
                        padding: '0.12rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#EFF6FF',
                        color: '#1E40AF',
                        border: '1px solid #BFDBFE'
                      }}
                    >
                      {archivosEntrada.length} archivo(s)
                    </span>
                  </div>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.76rem', color: '#526783' }}>
                    Archivos originales analizados para este expediente de pago a proveedor.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostrarDocumentosEntrada(!mostrarDocumentosEntrada)}
                className="btn btn-sm btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {mostrarDocumentosEntrada ? (
                  <>
                    <span>Ocultar lista</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>Ver lista ({archivosEntrada.length})</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>

            {mostrarDocumentosEntrada && (
              <div
                style={{
                  padding: '0.95rem 1.2rem',
                  backgroundColor: '#FFFFFF',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                  gap: '0.7rem'
                }}
              >
                {archivosEntrada.map((archivo, aIdx) => {
                  const ext = (archivo.extension || archivo.nombre.split('.').pop() || '').toLowerCase();
                  const esPdf = ext === 'pdf';
                  const cid = casoActivoId || expediente.caso_id;
                  const fileDownloadUrl = `/api/proveedores/descargar_documento/${encodeURIComponent(cid)}/${encodeURIComponent(archivo.nombre)}?download=1`;

                  return (
                    <div
                      key={aIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #DFE4EB',
                        borderRadius: '8px',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            backgroundColor: esPdf ? '#FEF2F2' : '#F1F5F9',
                            border: `1px solid ${esPdf ? '#FECACA' : '#CBD5E1'}`,
                            color: esPdf ? '#DC2626' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <FileText size={15} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span
                            onClick={() => handleVerDocumento(archivo)}
                            title={`Ver ${archivo.nombre}`}
                            style={{
                              display: 'block',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#14213D',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer'
                            }}
                          >
                            {archivo.nombre}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.12rem' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                padding: '0.08rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: '#E2E8F0',
                                color: '#334155'
                              }}
                            >
                              {archivo.categoria || 'Documento'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'ui-monospace, monospace' }}>
                              {archivo.tamano_kb ? `${archivo.tamano_kb} KB` : 'PDF'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerDocumento(archivo);
                          }}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Eye size={12} />
                          <span>Ver</span>
                        </button>
                        <a
                          href={fileDownloadUrl}
                          download={archivo.nombre}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0.25rem 0.45rem', display: 'inline-flex', alignItems: 'center' }}
                          title="Descargar archivo original"
                        >
                          <Download size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarArchivo(archivo.nombre);
                          }}
                          className="action-btn-delete"
                          style={{ width: '26px', height: '26px', borderRadius: '6px' }}
                          title={`Eliminar ${archivo.nombre} del expediente`}
                          aria-label={`Eliminar ${archivo.nombre}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulario Interactivo y Editable con los Datos Extraídos */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-color, #DFE4EB)',
              borderRadius: '10px',
              padding: '1.25rem 1.4rem',
              boxShadow: '0 1px 2px rgba(20, 33, 61, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #DFE4EB', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#14213D', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Edit3 size={17} color="#176B52" />
                  <span>Datos Normalizados del Expediente</span>
                </h3>
                <p style={{ margin: '0.18rem 0 0', fontSize: '0.78rem', color: '#526783' }}>
                  Revise los datos extraídos de la documentación y realice cualquier ajuste antes de emitir los anexos oficiales.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModoEdicion(!modoEdicion)}
                className={modoEdicion ? 'btn btn-sm btn-uex' : 'btn btn-sm btn-outline'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Edit3 size={13} />
                <span>{modoEdicion ? 'Modo Edición Activo' : 'Editar Datos Manualmente'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1rem' }}>
              {/* Bloque 1: Proveedor */}
              <div style={{ border: '1px solid #DFE4EB', borderRadius: '8px', padding: '1rem', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={14} color="#176B52" />
                  <span>1. Proveedor o Razón Social</span>
                </h4>
                <div>
                  <label style={fieldLabelStyle}>Razón Social</label>
                  <input
                    type="text"
                    disabled={!modoEdicion}
                    value={expediente.proveedor.razon_social || ''}
                    onChange={(e) => setExpediente({ ...expediente, proveedor: { ...expediente.proveedor, razon_social: e.target.value } })}
                    style={{ ...getFieldStyle(modoEdicion), fontWeight: 600 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={fieldLabelStyle}>CIF / NIF / VAT</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.proveedor.cif || ''}
                      onChange={(e) => setExpediente({ ...expediente, proveedor: { ...expediente.proveedor, cif: e.target.value } })}
                      style={getFieldStyle(modoEdicion, true)}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Domicilio Fiscal</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.proveedor.domicilio || ''}
                      onChange={(e) => setExpediente({ ...expediente, proveedor: { ...expediente.proveedor, domicilio: e.target.value } })}
                      style={getFieldStyle(modoEdicion)}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Factura */}
              <div style={{ border: '1px solid #DFE4EB', borderRadius: '8px', padding: '1rem', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={14} color="#176B52" />
                  <span>2. Factura del Proveedor</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={fieldLabelStyle}>Número de Factura</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.factura.numero || ''}
                      onChange={(e) => setExpediente({ ...expediente, factura: { ...expediente.factura, numero: e.target.value } })}
                      style={{ ...getFieldStyle(modoEdicion, true), fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Fecha de Emisión</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.factura.fecha_emision || expediente.factura.fecha || ''}
                      onChange={(e) => setExpediente({ ...expediente, factura: { ...expediente.factura, fecha_emision: e.target.value } })}
                      style={getFieldStyle(modoEdicion)}
                    />
                  </div>
                </div>
                <div>
                  <label style={fieldLabelStyle}>Concepto Facturado</label>
                  <input
                    type="text"
                    disabled={!modoEdicion}
                    value={expediente.factura.concepto || ''}
                    onChange={(e) => setExpediente({ ...expediente, factura: { ...expediente.factura, concepto: e.target.value } })}
                    style={getFieldStyle(modoEdicion)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  <div>
                    <label style={fieldLabelStyle}>Base Imponible</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!modoEdicion}
                      value={expediente.factura.base_imponible ?? 0}
                      onChange={(e) => {
                        const base = parseFloat(e.target.value) || 0;
                        const cuota = Math.round(base * (expediente.factura.tipo_iva / 100) * 100) / 100;
                        const total = Math.round((base + cuota) * 100) / 100;
                        setExpediente({
                          ...expediente,
                          factura: { ...expediente.factura, base_imponible: base, cuota_iva: cuota, total }
                        });
                      }}
                      style={getFieldStyle(modoEdicion, true)}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>IVA ({expediente.factura.tipo_iva}%)</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!modoEdicion}
                      value={expediente.factura.cuota_iva ?? 0}
                      readOnly
                      style={getFieldStyle(modoEdicion, true)}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Total Factura</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!modoEdicion}
                      value={expediente.factura.total ?? 0}
                      onChange={(e) => {
                        const total = parseFloat(e.target.value) || 0;
                        setExpediente({ ...expediente, factura: { ...expediente.factura, total } });
                      }}
                      style={{ ...getFieldStyle(modoEdicion, true), fontWeight: 800, color: '#176B52' }}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 3: Imputación Presupuestaria */}
              <div style={{ border: '1px solid #DFE4EB', borderRadius: '8px', padding: '1rem', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Scale size={14} color="#176B52" />
                  <span>3. Imputación Presupuestaria UEx</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={fieldLabelStyle}>Investigador Principal</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.presupuesto.investigador_principal || ''}
                      onChange={(e) => setExpediente({ ...expediente, presupuesto: { ...expediente.presupuesto, investigador_principal: e.target.value } })}
                      style={getFieldStyle(modoEdicion)}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Solicitante</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.presupuesto.solicitante || ''}
                      onChange={(e) => setExpediente({ ...expediente, presupuesto: { ...expediente.presupuesto, solicitante: e.target.value } })}
                      style={getFieldStyle(modoEdicion)}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={fieldLabelStyle}>Proyecto / Convenio</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.presupuesto.proyecto_referencia || expediente.presupuesto.proyecto || ''}
                      onChange={(e) => setExpediente({ ...expediente, presupuesto: { ...expediente.presupuesto, proyecto_referencia: e.target.value } })}
                      style={getFieldStyle(modoEdicion, true)}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Orgánica Presupuestaria</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.presupuesto.organica || ''}
                      onChange={(e) => setExpediente({ ...expediente, presupuesto: { ...expediente.presupuesto, organica: e.target.value } })}
                      style={{ ...getFieldStyle(modoEdicion, true), fontWeight: 700 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={fieldLabelStyle}>Tipo de Gasto Oficial</label>
                    <select
                      disabled={!modoEdicion}
                      value={expediente.presupuesto.tipo_gasto || 'Gastos Varios'}
                      onChange={(e) => setExpediente({ ...expediente, presupuesto: { ...expediente.presupuesto, tipo_gasto: e.target.value } })}
                      style={getFieldStyle(modoEdicion)}
                    >
                      {TIPOS_GASTO_OFICIALES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Importe Solicitado</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!modoEdicion}
                      value={expediente.presupuesto.importe_solicitado ?? 0}
                      onChange={(e) => {
                        const imp = parseFloat(e.target.value) || 0;
                        setExpediente({ ...expediente, presupuesto: { ...expediente.presupuesto, importe_solicitado: imp } });
                      }}
                      style={{ ...getFieldStyle(modoEdicion, true), fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 4: Modalidad de Pago */}
              <div style={{ border: '1px solid #DFE4EB', borderRadius: '8px', padding: '1rem', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {expediente.pago.modalidad === 'tarjeta' ? <CreditCard size={14} color="#D97706" /> : <Send size={14} color="#2563EB" />}
                    <span>4. Modalidad de Pago</span>
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {modoEdicion ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const nuevo: ExpedienteProveedor = {
                              ...expediente,
                              pago: { ...expediente.pago, modalidad: 'tarjeta' }
                            };
                            setExpediente(nuevo);
                            ejecutarValidacion(nuevo);
                          }}
                          style={{
                            padding: '0.24rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: expediente.pago.modalidad === 'tarjeta' ? '#D97706' : '#E2E8F0',
                            color: expediente.pago.modalidad === 'tarjeta' ? '#FFFFFF' : '#334155'
                          }}
                        >
                          Tarjeta
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nuevo: ExpedienteProveedor = {
                              ...expediente,
                              pago: { ...expediente.pago, modalidad: 'transferencia' }
                            };
                            setExpediente(nuevo);
                            ejecutarValidacion(nuevo);
                          }}
                          style={{
                            padding: '0.24rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: expediente.pago.modalidad === 'transferencia' ? '#2563EB' : '#E2E8F0',
                            color: expediente.pago.modalidad === 'transferencia' ? '#FFFFFF' : '#334155'
                          }}
                        >
                          Transferencia
                        </button>
                      </>
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#F8FAFC',
                          color: '#1E293B',
                          border: '1px solid #CBD5E1'
                        }}
                      >
                        {expediente.pago.modalidad === 'tarjeta' ? 'Modalidad A · Tarjeta Investigador' : 'Modalidad B · Pendiente Transferencia'}
                      </span>
                    )}
                  </div>
                </div>

                {expediente.pago.modalidad === 'tarjeta' ? (
                  <>
                    <div style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', fontSize: '0.75rem', lineHeight: 1.4 }}>
                      <strong>Modalidad A: Gasto ya abonado con tarjeta del investigador.</strong> Se justificará el pago mediante Anexo A (tipo justificación) y comprobación del cargo bancario.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={fieldLabelStyle}>Fecha de Pago</label>
                        <input
                          type="text"
                          disabled={!modoEdicion}
                          value={expediente.pago.fecha_pago || expediente.factura.fecha_emision || expediente.factura.fecha || ''}
                          onChange={(e) => setExpediente({ ...expediente, pago: { ...expediente.pago, fecha_pago: e.target.value } })}
                          style={getFieldStyle(modoEdicion)}
                        />
                      </div>
                      <div>
                        <label style={fieldLabelStyle}>Identificación Tarjeta (4 dígitos)</label>
                        <input
                          type="text"
                          disabled={!modoEdicion}
                          value={expediente.pago.tarjeta_ultimos4 || expediente.pago.num_tarjeta || '**** **** **** 4171'}
                          readOnly
                          style={getFieldStyle(modoEdicion, true)}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', fontSize: '0.75rem', lineHeight: 1.4 }}>
                      <strong>Modalidad B: Factura pendiente de pago por transferencia.</strong> Corresponde a Gestión Económica tramitar el pago al proveedor mediante el Anexo A (propuesta de transferencia).
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>IBAN del Proveedor</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.pago.iban_proveedor || expediente.proveedor.iban || ''}
                        onChange={(e) => {
                          setExpediente({
                            ...expediente,
                            pago: { ...expediente.pago, iban_proveedor: e.target.value },
                            proveedor: { ...expediente.proveedor, iban: e.target.value }
                          });
                        }}
                        style={getFieldStyle(modoEdicion, true)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {modoEdicion && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.85rem', borderTop: '1px solid #DFE4EB' }}>
                <button
                  type="button"
                  onClick={() => {
                    ejecutarValidacion(expediente);
                    setModoEdicion(false);
                    avisar('Cambios guardados y validación recalculada.');
                  }}
                  className="btn btn-md btn-uex"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Guardar y Re-validar</span>
                </button>
              </div>
            )}
          </div>

          {/* Barra inferior de navegación de Paso 2 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="btn btn-md btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <ArrowLeft size={15} />
              <span>Volver a Selección de Expedientes</span>
            </button>

            {diagnostico?.semaforo === 'VERDE' ? (
              <button
                type="button"
                onClick={handleGenerarDocumentos}
                className="btn btn-md btn-uex"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <FileCheck size={16} />
                <span>Generar Documentos Oficiales SGTRI</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#991B1B',
                  backgroundColor: '#FEE2E2',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #FECACA'
                }}
              >
                Subsanar discrepancia para continuar
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: ENTREGA DE DOCUMENTOS OFICIALES SGTRI (ESTILO HONORARIOS/DIETAS)  */}
      {/* ========================================================================= */}
      {paso === 3 && resultadoDocumentos && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Cabecera limpia de confirmación + resumen */}
          <div
            className="panel"
            style={{
              padding: '18px 22px',
              borderLeft: '3px solid #166534',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy, #14213D)' }}>
                    Documentación Oficial Generada
                  </h2>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #526783)' }}>
                    Modelos oficiales SGTRI UEx cumplimentados conforme a las Bases de Ejecución 2026, listos para firma electrónica y remisión a Intervención.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPaso(1);
                    setCasoActivoId(null);
                    setExpediente(null);
                    setDiagnostico(null);
                    setResultadoDocumentos(null);
                  }}
                  className="btn btn-sm btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RotateCcw size={14} />
                  <span>Nuevo Expediente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="btn btn-sm btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ArrowLeft size={14} />
                  <span>Revisar Expediente</span>
                </button>
                {resultadoDocumentos.zip_url && (
                  <a
                    href={resultadoDocumentos.zip_url}
                    download={resultadoDocumentos.zip_nombre || 'Pack_Oficial_Pago_Proveedores.zip'}
                    className="btn btn-sm btn-uex"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                  >
                    <Archive size={14} />
                    <span>Descargar Lote Completo (ZIP)</span>
                  </a>
                )}
              </div>
            </div>

            {expediente && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem', borderTop: '1px solid #F1F5FA', paddingTop: '0.9rem' }}>
                <div style={{ backgroundColor: '#F7F9FC', border: '1px solid #DFE4EB', borderRadius: '8px', padding: '0.65rem 0.9rem' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#526783' }}>Expediente</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#14213D', marginTop: '0.15rem' }}>{nombreActivoVisible}</div>
                </div>
                <div style={{ backgroundColor: '#F7F9FC', border: '1px solid #DFE4EB', borderRadius: '8px', padding: '0.65rem 0.9rem' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#526783' }}>Proveedor y Modalidad</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#14213D', marginTop: '0.15rem' }}>
                    {expediente.proveedor.razon_social} · {expediente.pago.modalidad === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}
                  </div>
                </div>
                <div style={{ backgroundColor: '#F7F9FC', border: '1px solid #DFE4EB', borderRadius: '8px', padding: '0.65rem 0.9rem' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#526783' }}>Importe Total</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#176B52', marginTop: '0.15rem', fontFamily: 'ui-monospace, monospace' }}>
                    {fmtEur(expediente.factura.total)} ({docsGenerados.length} documentos)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lista / Tabla Completa de Documentos Oficiales */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Modelo</th>
                  <th>Documento Oficial</th>
                  <th style={{ width: '205px' }}>Formato</th>
                  <th style={{ width: '215px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docsGenerados.map((doc, dIdx) => {
                  const badge = getDocSalidaBadge(doc.nombre || doc.titulo);
                  return (
                    <tr key={dIdx}>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#14213D', fontSize: '0.86rem' }}>
                          {doc.titulo || doc.nombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#526783', marginTop: '0.15rem' }}>
                          {doc.descripcion}
                        </div>
                        {doc.titulo && doc.nombre && doc.titulo !== doc.nombre && (
                          <div style={{ fontSize: '0.71rem', color: '#64748B', fontFamily: 'ui-monospace, monospace', marginTop: '0.18rem' }}>
                            {doc.nombre}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.76rem', color: '#526783', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>
                          {doc.tamano_kb} KB · PDF AcroForm
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => handleVerDocSalida(doc)}
                            className="btn btn-sm btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Eye size={13} />
                            <span>Ver</span>
                          </button>
                          <a
                            href={doc.url_descarga || doc.download_url || doc.preview_url || '#'}
                            download={doc.nombre}
                            className="btn btn-sm btn-uex"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                          >
                            <Download size={13} />
                            <span>Descargar</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOMBRE DEL NUEVO EXPEDIENTE                                        */}
      {/* ========================================================================= */}
      {modalNombrarOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #DFE4EB',
              width: '100%',
              maxWidth: '460px',
              padding: '1.3rem 1.4rem',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#14213D' }}>
              Nombre del Nuevo Expediente
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#526783', lineHeight: 1.45 }}>
              Asigna un nombre identificativo para guardar y consultar este expediente de pago a proveedor ({pendingUploadFiles?.length || 0} archivo(s)).
            </p>
            <div>
              <label style={fieldLabelStyle}>Nombre del expediente</label>
              <input
                type="text"
                autoFocus
                value={nombreNuevoCaso}
                onChange={(e) => setNombreNuevoCaso(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pendingUploadFiles && nombreNuevoCaso.trim()) {
                    ejecutarSubidaArchivos(pendingUploadFiles, nombreNuevoCaso.trim());
                  }
                }}
                style={getFieldStyle(true)}
                placeholder="Ej: Factura_OpenAI_Mayo_2026"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setModalNombrarOpen(false);
                  setPendingUploadFiles(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-sm btn-uex"
                disabled={!pendingUploadFiles || !nombreNuevoCaso.trim()}
                onClick={() => {
                  if (pendingUploadFiles && nombreNuevoCaso.trim()) {
                    ejecutarSubidaArchivos(pendingUploadFiles, nombreNuevoCaso.trim());
                  }
                }}
              >
                Analizar y Guardar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: RENOMBRAR EXPEDIENTE                                               */}
      {/* ========================================================================= */}
      {modalRenombrarOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #DFE4EB',
              width: '100%',
              maxWidth: '440px',
              padding: '1.3rem 1.4rem',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#14213D' }}>
              Renombrar Expediente
            </h3>
            <div>
              <label style={fieldLabelStyle}>Nuevo nombre del expediente</label>
              <input
                type="text"
                autoFocus
                value={nuevoNombreRenombrar}
                onChange={(e) => setNuevoNombreRenombrar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmarRenombrar();
                }}
                style={getFieldStyle(true)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setModalRenombrarOpen(false)}
                disabled={cargandoAccion}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-sm btn-uex"
                onClick={handleConfirmarRenombrar}
                disabled={cargandoAccion || !nuevoNombreRenombrar.trim()}
              >
                {cargandoAccion ? 'Guardando...' : 'Guardar Nombre'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: ELIMINAR EXPEDIENTE                                                */}
      {/* ========================================================================= */}
      {modalEliminarOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #FECACA',
              borderLeft: '4px solid #DC2626',
              width: '100%',
              maxWidth: '440px',
              padding: '1.3rem 1.4rem',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#991B1B' }}>
              Eliminar Expediente Permanentemente
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
              ¿Seguro que deseas eliminar el expediente <strong>"{casoObjetivoAccion?.nombre}"</strong> y todos sus archivos asociados? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setModalEliminarOpen(false)}
                disabled={cargandoAccion}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={handleConfirmarEliminar}
                disabled={cargandoAccion}
              >
                {cargandoAccion ? 'Eliminando...' : 'Eliminar Permanentemente'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* VISOR MODAL DE DOCUMENTOS                                                 */}
      {/* ========================================================================= */}
      {docEnVisor && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDocEnVisor(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              width: '92vw',
              maxWidth: '1100px',
              height: '88vh',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '0.85rem 1.25rem',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #DFE4EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    backgroundColor: '#ECFDF5',
                    color: '#176B52',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <FileText size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#14213D' }}>
                      {docEnVisor.nombre}
                    </span>
                    <span style={{ padding: '0.12rem 0.45rem', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#065F46' }}>
                      {docEnVisor.categoria || 'Documento'}
                    </span>
                    {docEnVisor.tamano ? (
                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'ui-monospace, monospace' }}>
                        {(docEnVisor.tamano / 1024).toFixed(0)} KB
                      </span>
                    ) : null}
                  </div>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#526783' }}>
                    Visualizador de documentos SGTRI UEx
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                <a
                  href={docEnVisor.url_raw}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                >
                  <ExternalLink size={13} />
                  <span>Abrir en Pestaña</span>
                </a>
                <a
                  href={docEnVisor.download_url}
                  download={docEnVisor.nombre}
                  className="btn btn-sm btn-uex"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                >
                  <Download size={13} />
                  <span>Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={() => setDocEnVisor(null)}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '0.35rem 0.5rem' }}
                  title="Cerrar visor"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {cargandoVisor ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#526783', padding: '4rem 0' }}>
                  <Loader2 className="animate-spin" size={22} />
                  <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Cargando documento...</span>
                </div>
              ) : docEnVisor.tipo === 'pdf' ? (
                <div style={{ width: '100%', height: '100%', minHeight: '72vh', maxWidth: '1040px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #94A3B8', boxShadow: '0 8px 25px rgba(15, 23, 42, 0.12)' }}>
                  <object data={docEnVisor.url_raw} type="application/pdf" style={{ width: '100%', height: '100%', minHeight: '72vh' }}>
                    <iframe src={docEnVisor.url_raw} title={`Visor ${docEnVisor.nombre}`} style={{ width: '100%', height: '100%', minHeight: '72vh', border: 'none' }}>
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <p>Su navegador no soporta visualización incrustada de PDFs.</p>
                        <a href={docEnVisor.url_raw} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-uex">
                          Abrir PDF en nueva pestaña
                        </a>
                      </div>
                    </iframe>
                  </object>
                </div>
              ) : docEnVisor.tipo === 'imagen' ? (
                <img
                  src={docEnVisor.url_raw}
                  alt={docEnVisor.nombre}
                  style={{ maxWidth: '900px', width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF' }}
                />
              ) : (
                <div style={{ padding: '1.5rem', borderRadius: '8px', width: '100%', maxWidth: '900px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                  <pre style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: 1.55, margin: 0 }}>
                    {docEnVisor.texto || 'Sin contenido textual.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
