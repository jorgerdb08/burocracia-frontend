import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderOpen, ChevronUp, ChevronDown, UploadCloud, Download, Sparkles,
  AlertOctagon, CheckCircle2, AlertTriangle, FileCheck, Building2,
  Scale, ShieldAlert, ArrowRight, Loader2, Eye, Edit3, Check, X,
  ArrowLeft, ShieldCheck, RefreshCw, FileText, CreditCard, Send,
  Archive, CheckCircle, RotateCcw, Play, ExternalLink
} from 'lucide-react';
import { fmtEur, cn } from '../../lib/utils';

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
}

const TIPOS_GASTO_OFICIALES = [
  'Material fungible',
  'Viajes y dietas',
  'Material inventariable',
  'Gastos Varios',
  'Servicios',
  'Gastos de personal'
];

export function GeneradorProveedoresInteligente() {
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

  // Cargar lista de casos de prueba precargados
  useEffect(() => {
    fetch('/api/proveedores/casos_precargados')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.casos)) {
          setCasosDemo(data.casos);
        }
      })
      .catch((err) => console.error('Error cargando casos demo proveedores:', err));
  }, []);

  const avisar = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 4000);
  };

  // Cargar caso de demostración
  const handleCargarCasoDemo = async (casoId: string) => {
    setCasoActivoId(casoId);
    setCargando(true);
    setMensajeCarga(`Analizando expediente ${casoId}...`);
    try {
      const res = await fetch(`/api/proveedores/cargar_demostracion/${encodeURIComponent(casoId)}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.ok) {
        setExpediente(data.expediente);
        setDiagnostico(data.diagnostico);
        setResultadoDocumentos(data.resultado_documentos || null);
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

  // Subida manual de archivos por el usuario
  const handleSubirArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCargando(true);
    setMensajeCarga('Subiendo y analizando documentación aportada...');
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append(`file_${i}`, files[i]);
    }
    const nuevoId = `exp_prov_${Date.now()}`;
    formData.append('caso_id', nuevoId);
    setCasoActivoId(nuevoId);

    try {
      const res = await fetch('/api/proveedores/analizar_expediente', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.ok) {
        setExpediente(data.expediente);
        setDiagnostico(data.diagnostico);
        setResultadoDocumentos(data.resultado_documentos || null);
        setPaso(2);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error al procesar archivos: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Previsualizar documento de entrada en modal
  const handleVerDocumento = async (archivo: { nombre: string; categoria?: string; tamano_kb?: number }) => {
    setCargandoVisor(true);
    const cid = casoActivoId || expediente?.caso_id || 'Caso_01_AWS_Tarjeta';
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

  // Previsualizar documento oficial de salida
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

  // Re-validar expediente tras edición
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

  // Subsanación automática del Caso 06: Alinear importe solicitado a factura
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

  // Subsanación convalidando Factura Rectificativa / Adenda
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

  // Generar documentos oficiales oficiales
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

  const archivosEntrada = expediente?.archivos_entrada || [];
  const incidenciasRojas = diagnostico?.incidencias_rojas || [];
  const comprobaciones = diagnostico?.comprobaciones || [];
  const docsGenerados = resultadoDocumentos?.documentos_info || [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notificación */}
      {notificacion && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-up text-sm">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notificacion}</span>
        </div>
      )}

      {/* Cabecera del Módulo */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#176B52]/10 border border-[#176B52]/20 text-[#176B52] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 size={30} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Pago a Proveedores
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-[#176B52] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  SGTRI UEx · Bases 2026
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                  Anexo II + Anexo A
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Gestión automatizada de facturas y gastos con proveedores de la Universidad de Extremadura.
                Identifica si el gasto fue <strong>abonado con tarjeta del investigador</strong> o está <strong>pendiente de transferencia</strong>, realiza la conciliación económica y genera la documentación oficial cumplimentada.
              </p>
            </div>
          </div>

          {/* Navegación y retorno de fase */}
          {paso > 1 ? (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (paso === 3) setPaso(2);
                  else if (paso === 2) setPaso(1);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>{paso === 2 ? 'Volver a Selección' : 'Volver a Conciliación'}</span>
              </button>
              {paso === 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setPaso(1);
                    setCasoActivoId(null);
                    setExpediente(null);
                    setResultadoDocumentos(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Nuevo Expediente</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#176B52] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Fase 1: Entrada y Análisis</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de Carga Global */}
      {cargando && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 text-center animate-fade-in shadow-xs">
          <div className="inline-flex items-center gap-3 text-[#176B52] dark:text-emerald-300 font-bold text-sm sm:text-base">
            <Loader2 className="animate-spin" size={20} />
            <span>{mensajeCarga || 'Procesando expediente con motor SGTRI...'}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 1: SELECCIÓN Y CARGA DEL EXPEDIENTE                                 */}
      {/* ========================================================================= */}
      {paso === 1 && (
        <div className="space-y-6">
          {/* Regla Universal de Factura Obligatoria */}
          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shrink-0">
              <FileCheck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-100">
                Regla Administrativa: La factura es el único documento universalmente obligatorio
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                Para iniciar el trámite sólo se exige la factura del proveedor. La justificación de tarjeta (justificante/extracto) o los datos bancarios (IBAN) se solicitan y validan dinámicamente según la modalidad identificada.
              </p>
            </div>
          </div>

          {/* Subida Manual */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <UploadCloud size={20} className="text-[#176B52]" />
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Aportar Documentación del Expediente
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Arrastra o selecciona la factura (PDF, DOCX, XLSX, imagen o texto) y, opcionalmente, el documento explicativo de imputación o justificantes de pago.
            </p>

            <label className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-[#176B52] dark:hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 dark:bg-zinc-800/30 transition-all group">
              <input
                type="file"
                multiple
                onChange={handleSubirArchivos}
                className="hidden"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.txt,.md"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#176B52] dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud size={24} />
              </div>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Seleccionar archivos o arrastrar aquí
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Formatos: PDF, DOCX, XLSX, imágenes (JPG/PNG), TXT
              </span>
            </label>
          </div>

          {/* Casos Oficiales de Demostración */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#176B52]" />
                  <span>Casos Oficiales de Demostración · Factura Real OpenAI</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Modalidad A (Abonado con tarjeta del investigador) y Modalidad B (Pendiente de pago por transferencia), con caso de control de discordancia económica.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                {casosDemo.length} expedientes preparados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casosDemo.map((c) => {
                const esVerde = c.semaforo_esperado === 'VERDE';
                const esTarjeta = c.modalidad === 'tarjeta';
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'border rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-md text-left relative overflow-hidden',
                      esVerde
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1',
                            esVerde
                              ? 'bg-emerald-100 text-[#176B52] dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          )}
                        >
                          {esVerde ? <CheckCircle2 size={10} /> : <AlertOctagon size={10} />}
                          {c.semaforo_esperado}
                        </span>

                        <span
                          className={cn(
                            'text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1',
                            esTarjeta
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                          )}
                        >
                          {esTarjeta ? <CreditCard size={11} /> : <Send size={11} />}
                          {esTarjeta ? 'Tarjeta Investigador' : 'Transferencia'}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {c.nombre}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {c.descripcion}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {c.num_archivos} archivo(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCargarCasoDemo(c.id)}
                        style={{
                          backgroundColor: esVerde ? '#176B52' : '#BE123C',
                          color: '#FFFFFF'
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer border-0"
                      >
                        <Play size={12} fill="#FFFFFF" />
                        <span>Cargar y Analizar</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: REVISIÓN DE DATOS EXTRAÍDOS Y CONCILIACIÓN                       */}
      {/* ========================================================================= */}
      {paso === 2 && expediente && (
        <div className="space-y-6 animate-fade-in">
          {/* Barra superior de retorno */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Volver a selección de expedientes</span>
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Expediente activo: <strong className="text-slate-800 dark:text-slate-200">{expediente.caso_id}</strong>
            </span>
          </div>

          {/* Banner de Semáforo y Conciliación */}
          {diagnostico && (
            <div
              className={cn(
                'rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs',
                diagnostico.semaforo === 'VERDE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-900 text-rose-950 dark:text-rose-100'
              )}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    'p-2.5 rounded-xl shrink-0 text-white shadow-xs',
                    diagnostico.semaforo === 'VERDE' ? 'bg-[#176B52]' : 'bg-rose-600'
                  )}
                >
                  {diagnostico.semaforo === 'VERDE' ? (
                    <ShieldCheck size={26} />
                  ) : (
                    <ShieldAlert size={26} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white',
                        diagnostico.semaforo === 'VERDE' ? 'bg-[#176B52]' : 'bg-rose-600'
                      )}
                    >
                      SEMÁFORO {diagnostico.semaforo}
                    </span>
                    <h3 className="font-bold text-base">
                      {diagnostico.semaforo === 'VERDE'
                        ? 'Expediente Conforme y Tramitable · Conciliación Correcta'
                        : 'Expediente Bloqueado por Intervención / SGTRI'}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed max-w-3xl">
                    {diagnostico.semaforo === 'VERDE'
                      ? 'Todos los requisitos normativos han sido verificados. La factura, el proveedor y la imputación presupuestaria están conciliados.'
                      : 'Se han detectado discordancias económicas que impiden la emisión de la orden de pago oficial.'}
                  </p>
                </div>
              </div>

              {/* Botón de Generación si está en Verde */}
              {diagnostico.semaforo === 'VERDE' ? (
                <button
                  type="button"
                  onClick={handleGenerarDocumentos}
                  style={{ backgroundColor: '#176B52', color: '#FFFFFF' }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 shrink-0 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer border-0"
                >
                  <FileCheck size={16} />
                  <span>Generar Documentos Oficiales SGTRI</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 shrink-0">
                  Generación bloqueada hasta subsanar
                </span>
              )}
            </div>
          )}

          {/* Tarjeta de Incidencias Bloqueantes (Caso 06) con Subsanación en 1 Clic */}
          {incidenciasRojas.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertOctagon size={20} />
                <h4 className="font-bold text-base">
                  Incidencia Bloqueante Detectada ({incidenciasRojas.length})
                </h4>
              </div>

              {incidenciasRojas.map((err, idx) => (
                <div key={idx} className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                        {err.codigo}
                      </span>
                      <p className="text-sm font-semibold text-rose-950 dark:text-rose-100 mt-1">
                        {err.mensaje}
                      </p>
                    </div>
                  </div>

                  {/* Comparativa económica visual */}
                  {err.importes && (
                    <div className="grid grid-cols-3 gap-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-rose-200 dark:border-zinc-800 text-center text-xs">
                      <div>
                        <span className="text-slate-500 block">Factura Proveedor</span>
                        <strong className="text-slate-800 dark:text-slate-200 text-sm">
                          {fmtEur(err.importes.importe_factura)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Memoria / Solicitud</span>
                        <strong className="text-rose-600 text-sm">
                          {fmtEur(err.importes.importe_solicitado)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Discordancia</span>
                        <strong className="text-rose-700 text-sm">
                          {fmtEur(Math.abs(err.importes.diferencia))}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Opciones de Subsanación */}
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Instrucción para subsanar:
                    </span>
                    <button
                      type="button"
                      onClick={handleSubsanarAlineando}
                      style={{ backgroundColor: '#176B52', color: '#FFFFFF' }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer border-0"
                      title="Ajusta el importe en la memoria para eliminar el descuadre con la factura oficial"
                    >
                      <Check size={14} />
                      <span>Ajustar Solicitud a {fmtEur(expediente.factura.total)} y Subsanar</span>
                    </button>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <input
                        type="text"
                        value={refRectificativa}
                        onChange={(e) => setRefRectificativa(e.target.value)}
                        className="input input-xs text-xs font-mono border border-slate-300 dark:border-zinc-700 rounded px-2 py-1 max-w-[200px]"
                        placeholder="Ref. Factura Rectificativa"
                      />
                      <button
                        type="button"
                        onClick={handleSubsanarConvalidando}
                        className="btn btn-sm btn-outline border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                        title="Convalida que existe factura rectificativa o adenda formal"
                      >
                        Convalidar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sección de Documentos de Entrada (2 Columnas Colapsables) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                      Documentación y Justificantes de Entrada
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                      {archivosEntrada.length} archivo(s)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Archivos originales analizados para este expediente de pago a proveedor.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMostrarDocumentosEntrada(!mostrarDocumentosEntrada)}
                  className="btn btn-ghost btn-xs text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
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
            </div>

            {/* Grid en 2 Columnas de Documentos */}
            {mostrarDocumentosEntrada && (
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {archivosEntrada.map((archivo, aIdx) => {
                    const ext = (archivo.extension || archivo.nombre.split('.').pop() || '').toLowerCase();
                    const esPdf = ext === 'pdf';
                    const cid = casoActivoId || expediente.caso_id;
                    const fileDownloadUrl = `/api/proveedores/descargar_documento/${encodeURIComponent(cid)}/${encodeURIComponent(archivo.nombre)}?download=1`;

                    let iconElem = <FileText size={16} className="text-slate-600" />;
                    let iconBg = 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700';
                    if (esPdf) {
                      iconElem = <FileText size={16} className="text-rose-600" />;
                      iconBg = 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900';
                    }

                    return (
                      <div
                        key={aIdx}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center shrink-0', iconBg)}>
                            {iconElem}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              onClick={() => handleVerDocumento(archivo)}
                              title={`Ver ${archivo.nombre}`}
                              className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block cursor-pointer hover:text-[#176B52]"
                            >
                              {archivo.nombre}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                                {archivo.categoria || 'Documento'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {archivo.tamano_kb ? `${archivo.tamano_kb} KB` : 'PDF'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerDocumento(archivo);
                            }}
                            className="btn btn-ghost btn-xs text-xs font-semibold text-[#176B52] dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950 flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>Ver</span>
                          </button>
                          <a
                            href={fileDownloadUrl}
                            download={archivo.nombre}
                            className="btn btn-ghost btn-xs text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded"
                            title="Descargar archivo original"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Formulario Interactivo y Editable con los Datos Extraídos */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit3 size={18} className="text-[#176B52]" />
                  <span>Datos Normalizados del Expediente</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Revise los datos extraídos por la IA y realice cualquier ajuste necesario antes de emitir los documentos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModoEdicion(!modoEdicion)}
                className="btn btn-sm btn-outline border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                {modoEdicion ? 'Bloquear Campos' : 'Editar Datos Manualmente'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bloque 1: Datos del Proveedor */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 bg-slate-50/40 dark:bg-zinc-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#176B52]" />
                  <span>1. Proveedor o Razón Social</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Razón Social</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.proveedor.razon_social || ''}
                      onChange={(e) => {
                        const nuevo = { ...expediente, proveedor: { ...expediente.proveedor, razon_social: e.target.value } };
                        setExpediente(nuevo);
                      }}
                      className="input input-sm w-full font-semibold bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">CIF / NIF / VAT</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.proveedor.cif || ''}
                        onChange={(e) => {
                          const nuevo = { ...expediente, proveedor: { ...expediente.proveedor, cif: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full font-mono bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Domicilio Fiscal</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.proveedor.domicilio || ''}
                        onChange={(e) => {
                          const nuevo = { ...expediente, proveedor: { ...expediente.proveedor, domicilio: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Datos de la Factura */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 bg-slate-50/40 dark:bg-zinc-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText size={14} className="text-[#176B52]" />
                  <span>2. Factura del Proveedor</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Número de Factura</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.factura.numero || ''}
                        onChange={(e) => {
                          const nuevo = { ...expediente, factura: { ...expediente.factura, numero: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full font-mono font-bold bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Fecha de Emisión</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.factura.fecha_emision || expediente.factura.fecha || ''}
                        onChange={(e) => {
                          const nuevo = { ...expediente, factura: { ...expediente.factura, fecha_emision: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Concepto Facturado</label>
                    <input
                      type="text"
                      disabled={!modoEdicion}
                      value={expediente.factura.concepto || ''}
                      onChange={(e) => {
                        const nuevo = { ...expediente, factura: { ...expediente.factura, concepto: e.target.value } };
                        setExpediente(nuevo);
                      }}
                      className="input input-sm w-full bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Base Imponible</label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!modoEdicion}
                        value={expediente.factura.base_imponible ?? 0}
                        onChange={(e) => {
                          const base = parseFloat(e.target.value) || 0;
                          const cuota = Math.round(base * (expediente.factura.tipo_iva / 100) * 100) / 100;
                          const total = Math.round((base + cuota) * 100) / 100;
                          const nuevo = {
                            ...expediente,
                            factura: { ...expediente.factura, base_imponible: base, cuota_iva: cuota, total }
                          };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full font-mono bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">IVA ({expediente.factura.tipo_iva}%)</label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!modoEdicion}
                        value={expediente.factura.cuota_iva ?? 0}
                        className="input input-sm w-full font-mono bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Total Factura</label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!modoEdicion}
                        value={expediente.factura.total ?? 0}
                        onChange={(e) => {
                          const total = parseFloat(e.target.value) || 0;
                          const nuevo = { ...expediente, factura: { ...expediente.factura, total } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full font-mono font-bold text-[#176B52] bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Datos Presupuestarios */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 bg-slate-50/40 dark:bg-zinc-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale size={14} className="text-[#176B52]" />
                  <span>3. Imputación Presupuestaria UEx</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Investigador Principal</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.presupuesto.investigador_principal || ''}
                        onChange={(e) => {
                          const nuevo = { ...expediente, presupuesto: { ...expediente.presupuesto, investigador_principal: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Solicitante</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.presupuesto.solicitante || ''}
                        onChange={(e) => {
                          const nuevo = { ...expediente, presupuesto: { ...expediente.presupuesto, solicitante: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Proyecto / Convenio</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.presupuesto.proyecto_referencia || expediente.presupuesto.proyecto || ''}
                        onChange={(e) => {
                          const nuevo = { ...expediente, presupuesto: { ...expediente.presupuesto, proyecto_referencia: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full font-mono bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Orgánica Presupuestaria</label>
                      <input
                        type="text"
                        disabled={!modoEdicion}
                        value={expediente.presupuesto.organica || ''}
                        onChange={(e) => {
                          const nuevo = { ...expediente, presupuesto: { ...expediente.presupuesto, organica: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full font-mono font-bold bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Tipo de Gasto Oficial</label>
                      <select
                        disabled={!modoEdicion}
                        value={expediente.presupuesto.tipo_gasto || 'Gastos Varios'}
                        onChange={(e) => {
                          const nuevo = { ...expediente, presupuesto: { ...expediente.presupuesto, tipo_gasto: e.target.value } };
                          setExpediente(nuevo);
                        }}
                        className="select select-sm w-full bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      >
                        {TIPOS_GASTO_OFICIALES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Importe Solicitado</label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!modoEdicion}
                        value={expediente.presupuesto.importe_solicitado ?? 0}
                        onChange={(e) => {
                          const imp = parseFloat(e.target.value) || 0;
                          const nuevo = { ...expediente, presupuesto: { ...expediente.presupuesto, importe_solicitado: imp } };
                          setExpediente(nuevo);
                        }}
                        className="input input-sm w-full font-mono font-bold bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 4: Modalidad de Pago y Conciliación */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 bg-slate-50/40 dark:bg-zinc-950/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {expediente.pago.modalidad === 'tarjeta' ? <CreditCard size={14} className="text-amber-600" /> : <Send size={14} className="text-blue-600" />}
                    <span>4. Modalidad de Pago</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
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
                          className={cn(
                            'btn btn-xs rounded-md text-[11px] font-bold border-0',
                            expediente.pago.modalidad === 'tarjeta' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-300'
                          )}
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
                          className={cn(
                            'btn btn-xs rounded-md text-[11px] font-bold border-0',
                            expediente.pago.modalidad === 'transferencia' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-300'
                          )}
                        >
                          Transferencia
                        </button>
                      </>
                    ) : (
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1 border shadow-xs',
                          expediente.pago.modalidad === 'tarjeta'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                            : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
                        )}
                      >
                        {expediente.pago.modalidad === 'tarjeta' ? 'Modalidad A · Tarjeta Investigador' : 'Modalidad B · Pendiente Transferencia'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {expediente.pago.modalidad === 'tarjeta' ? (
                    <>
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-100 text-[11px]">
                        <strong>Modalidad A: Gasto ya abonado con tarjeta del investigador.</strong> Se justificará el pago mediante Anexo A (tipo justificación) y comprobación del cargo bancario.
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Fecha de Pago</label>
                          <input
                            type="text"
                            disabled={!modoEdicion}
                            value={expediente.pago.fecha_pago || expediente.factura.fecha_emision || expediente.factura.fecha || ''}
                            onChange={(e) => {
                              const nuevo = { ...expediente, pago: { ...expediente.pago, fecha_pago: e.target.value } };
                              setExpediente(nuevo);
                            }}
                            className="input input-sm w-full bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Identificación Tarjeta (4 dígitos)</label>
                          <input
                            type="text"
                            disabled={!modoEdicion}
                            value={expediente.pago.tarjeta_ultimos4 || expediente.pago.num_tarjeta || '**** **** **** 4171'}
                            className="input input-sm w-full font-mono bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                            readOnly
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-100 text-[11px]">
                        <strong>Modalidad B: Factura pendiente de pago por transferencia.</strong> Corresponde a Gestión Económica tramitar el pago al proveedor mediante el Anexo A (propuesta de transferencia).
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">IBAN del Proveedor</label>
                        <input
                          type="text"
                          disabled={!modoEdicion}
                          value={expediente.pago.iban_proveedor || expediente.proveedor.iban || ''}
                          onChange={(e) => {
                            const nuevo = {
                              ...expediente,
                              pago: { ...expediente.pago, iban_proveedor: e.target.value },
                              proveedor: { ...expediente.proveedor, iban: e.target.value }
                            };
                            setExpediente(nuevo);
                          }}
                          className="input input-sm w-full font-mono bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de Recalcular o Guardar si está en edición */}
            {modoEdicion && (
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    ejecutarValidacion(expediente);
                    setModoEdicion(false);
                    avisar('Cambios guardados y validación recalculada.');
                  }}
                  className="btn btn-sm bg-[#176B52] text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw size={13} />
                  <span>Guardar y Re-validar</span>
                </button>
              </div>
            )}
          </div>

          {/* Barra inferior de navegación de Paso 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer self-start"
            >
              <ArrowLeft size={16} />
              <span>Volver a Selección de Expedientes</span>
            </button>

            {diagnostico?.semaforo === 'VERDE' ? (
              <button
                type="button"
                onClick={handleGenerarDocumentos}
                style={{ backgroundColor: '#176B52', color: '#FFFFFF' }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer border-0"
              >
                <FileCheck size={16} />
                <span>Generar Documentos Oficiales SGTRI</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800">
                Subsanar discrepancia para continuar
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: ENTREGA DE DOCUMENTOS OFICIALES SGTRI                             */}
      {/* ========================================================================= */}
      {paso === 3 && resultadoDocumentos && (
        <div className="space-y-6 animate-fade-in">
          {/* Cabecera de Entrega */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#176B52] text-white shrink-0 shadow-xs">
                <CheckCircle size={26} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-emerald-950 dark:text-emerald-100">
                  Documentación Oficial Cumplimentada con Éxito
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 mt-1 max-w-2xl leading-relaxed">
                  Se han generado los dos modelos oficiales exigidos por SGTRI UEx conforme a las bases presupuestarias 2026. Los archivos están listos para firma electrónica y remisión a Intervención.
                </p>
              </div>
            </div>

            {resultadoDocumentos.zip_url && (
              <a
                href={resultadoDocumentos.zip_url}
                download={resultadoDocumentos.zip_nombre || 'Pack_Oficial_Pago_Proveedores.zip'}
                className="btn btn-primary px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shrink-0 shadow-md text-white cursor-pointer hover:opacity-95 transition-all"
                style={{ backgroundColor: '#176B52', color: '#ffffff', borderColor: '#176B52' }}
              >
                <Archive size={16} className="text-white" />
                <span className="text-white font-bold">Descargar Pack Oficial (ZIP)</span>
              </a>
            )}
          </div>

          {/* Tarjetas de Documentos Oficiales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {docsGenerados.map((doc, dIdx) => (
              <div
                key={dIdx}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-[#176B52] dark:text-emerald-300">
                      Oficial SGTRI 2026
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">
                      {doc.nombre}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {doc.descripcion}
                    </p>
                    <span className="text-[11px] font-mono text-slate-400 block mt-2">
                      Tamaño: {doc.tamano_kb} KB · Formato AcroForm PDF
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerDocSalida(doc)}
                    className="btn btn-outline btn-sm border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    <Eye size={13} />
                    <span>Previsualizar</span>
                  </button>
                  <a
                    href={doc.url_descarga || doc.download_url || doc.preview_url || '#'}
                    download={doc.nombre}
                    className="btn btn-sm btn-primary text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-95 transition-all"
                    style={{ backgroundColor: '#176B52', color: '#ffffff', borderColor: '#176B52' }}
                  >
                    <Download size={14} className="text-white" />
                    <span className="text-white font-bold">Descargar PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Botón Volver a Revisar */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setPaso(2)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Volver a Revisión y Conciliación</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaso(1);
                setCasoActivoId(null);
                setExpediente(null);
                setDiagnostico(null);
                setResultadoDocumentos(null);
              }}
              style={{ backgroundColor: '#176B52', color: '#FFFFFF' }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer border-0"
            >
              <RotateCcw size={14} />
              <span>Tramitar Otro Expediente</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISOR MODAL DE DOCUMENTOS CON FONDO OSCURO BORROSO (BACKDROP BLUR)       */}
      {/* ========================================================================= */}
      {docEnVisor && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            margin: 0
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDocEnVisor(null);
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full flex flex-col overflow-hidden shadow-2xl"
            style={{
              width: '92vw',
              maxWidth: '1100px',
              height: '88vh',
              maxHeight: '88vh',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Visor */}
            <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-[#176B52] dark:text-emerald-300 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate" title={docEnVisor.nombre}>
                      {docEnVisor.nombre}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-[#176B52] dark:bg-emerald-950 dark:text-emerald-300">
                      {docEnVisor.categoria || 'Documento'}
                    </span>
                    {docEnVisor.tamano ? (
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {(docEnVisor.tamano / 1024).toFixed(0)} KB
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Visualizador de documentos SGTRI UEx
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={docEnVisor.url_raw}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-xs px-2.5 py-1 text-xs border-slate-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 rounded-md"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">Abrir en Pestaña</span>
                </a>
                <a
                  href={docEnVisor.download_url}
                  download={docEnVisor.nombre}
                  className="btn btn-outline btn-xs px-2.5 py-1 text-xs border-slate-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 rounded-md"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={() => setDocEnVisor(null)}
                  className="btn btn-ghost btn-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded-md"
                  title="Cerrar visor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Cuerpo del Visor con Hoja de Alto Contraste */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-100/80 dark:bg-zinc-950 flex flex-col items-center justify-start w-full">
              {cargandoVisor ? (
                <div className="flex items-center gap-2 text-zinc-500 py-16">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-sm font-medium">Cargando documento...</span>
                </div>
              ) : docEnVisor.tipo === 'pdf' ? (
                <div
                  className="w-full h-full min-h-[75vh] max-w-5xl mx-auto rounded-xl overflow-hidden shadow-xl"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #94A3B8'
                  }}
                >
                  <object
                    data={docEnVisor.url_raw}
                    type="application/pdf"
                    className="w-full h-full min-h-[75vh]"
                  >
                    <iframe
                      src={docEnVisor.url_raw}
                      title={`Visor ${docEnVisor.nombre}`}
                      className="w-full h-full min-h-[75vh] border-none"
                    >
                      <div className="p-8 text-center flex flex-col items-center justify-center gap-4">
                        <p className="text-sm text-zinc-600">Su navegador no soporta visualización incrustada de PDFs.</p>
                        <a
                          href={docEnVisor.url_raw}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          Abrir PDF en nueva pestaña
                        </a>
                      </div>
                    </iframe>
                  </object>
                </div>
              ) : docEnVisor.tipo === 'imagen' ? (
                <div className="w-full flex flex-col items-center justify-start py-4">
                  <img
                    src={docEnVisor.url_raw}
                    alt={docEnVisor.nombre}
                    className="max-w-4xl w-full h-auto rounded-xl shadow-xl border border-slate-300 dark:border-zinc-700 object-contain my-2 bg-white"
                  />
                </div>
              ) : (
                <div
                  className="p-6 rounded-xl w-full max-w-4xl mx-auto shadow-xl my-4"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #94A3B8'
                  }}
                >
                  <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
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
