import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderArchive, Play, Loader2, Download, FileText,
  RefreshCw, Eye, X, Check, FileCheck, Plus, UploadCloud,
  Building2, Scale, Wallet, AlertTriangle, CheckCircle2,
  ShieldCheck, Trash2, Layers, FileCode, ArrowRight, ArrowLeft,
  FolderOpen, FileSpreadsheet, CheckCircle, FileCheck2, Sparkles, Folder, HelpCircle,
  LayoutGrid, List, Clock, ChevronLeft, ChevronRight
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
    modelos_generados?: string[];
  }>;
  total_expedientes: number;
  procesado: boolean;
}

interface ArchivoModalInfo {
  loteId: string;
  expedienteId?: string;
  nombreArchivo: string;
  url: string;
  tipo: 'pdf' | 'imagen' | 'texto' | 'excel' | 'word' | 'office' | 'otro';
  contenidoTexto?: string;
  cargando?: boolean;
  officeData?: {
    tipo: 'excel' | 'word';
    sheets?: Array<{ name: string; rows: string[][] }>;
    elements?: Array<{ type: string; text?: string; bold?: boolean; rows?: string[][] }>;
  };
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

interface PasoProcesoInfo {
  id: number;
  titulo: string;
  subtitulo: string;
}

const PASOS_PROCESAMIENTO_LOTE: PasoProcesoInfo[] = [
  {
    id: 1,
    titulo: 'Estructura de directorios y datos comunes leídos',
    subtitulo: 'Parseo de datos_comunes_expedientes.md (Investigador, Orgánica, Proyecto)'
  },
  {
    id: 2,
    titulo: 'Extracción OCR e Inteligencia Artificial de justificantes',
    subtitulo: 'Análisis de facturas, billetes, liquidaciones y hojas Excel'
  },
  {
    id: 3,
    titulo: 'Fiscalización y validación presupuestaria SGTRI 2026',
    subtitulo: 'Cálculo de IRPF, topes RD 462/2002 y régimen económico UEx'
  },
  {
    id: 4,
    titulo: 'Generación de modelos oficiales PDF AcroForm y empaquetado ZIP',
    subtitulo: 'Rellenado de campos oficiales, firmas y consolidación final'
  }
];

interface LoteProcesandoOverlayProps {
  progresoPaso: number;
  progresoPorcentaje: number;
  progresoSubexpediente: string | null;
  progresoMensaje: string | null;
  subdirectorios?: string[];
  normativaFinanciacion?: string;
}

function LoteProcesandoOverlay({
  progresoPaso,
  progresoPorcentaje,
  progresoSubexpediente,
  progresoMensaje,
  subdirectorios = [],
  normativaFinanciacion,
}: LoteProcesandoOverlayProps) {
  const esCompletadoTotal = progresoPorcentaje === 100 || progresoPaso >= 5;

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto'
      }}
    >
      <div
        className="modal-dialog"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          margin: 'auto'
        }}
      >
      {/* CÍRCULO GIRANDO CON EFECTO DE DOBLE ANILLO Y PULSO */}
      <div style={{ position: 'relative', width: '84px', height: '84px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            animation: esCompletadoTotal ? 'none' : 'spin 1.8s linear infinite',
            transition: 'all 0.5s ease'
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke={esCompletadoTotal ? '#BBF7D0' : '#DBEAFE'}
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke={esCompletadoTotal ? '#16A34A' : 'var(--color-blue-inst, #1E40AF)'}
            strokeWidth="5.5"
            strokeDasharray={esCompletadoTotal ? '270 270' : '85 185'}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.4s ease, stroke-dasharray 0.6s ease' }}
          />
        </svg>

        <div
          style={{
            width: '62px',
            height: '62px',
            borderRadius: '50%',
            backgroundColor: esCompletadoTotal ? '#DCFCE7' : 'var(--bg-blue-soft, #EFF6FF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: esCompletadoTotal ? '0 4px 14px rgba(22, 163, 74, 0.2)' : '0 4px 14px rgba(37, 99, 235, 0.15)',
            transition: 'all 0.4s ease'
          }}
        >
          {esCompletadoTotal ? (
            <CheckCircle2 size={32} style={{ color: '#16A34A' }} />
          ) : (
            <Loader2 size={30} style={{ color: 'var(--color-blue-inst, #1E40AF)', animation: 'spin 1.2s linear infinite' }} />
          )}
        </div>
      </div>

      {/* TÍTULO, SUBTÍTULO Y BARRA DE PROGRESO */}
      <div style={{ maxWidth: '540px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {esCompletadoTotal ? '¡Lote fiscalizado con éxito!' : 'Fiscalizando lote en el servidor...'}
          </h3>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: esCompletadoTotal ? '#15803D' : '#1E40AF',
              backgroundColor: esCompletadoTotal ? '#DCFCE7' : 'var(--bg-blue-soft, #EFF6FF)',
              padding: '2px 10px',
              borderRadius: '12px',
              border: `1px solid ${esCompletadoTotal ? '#BBF7D0' : '#BFDBFE'}`,
              transition: 'all 0.3s ease'
            }}
          >
            {progresoPorcentaje}%
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 auto 1rem', maxWidth: '480px', lineHeight: 1.4 }}>
          {progresoMensaje || (normativaFinanciacion 
            ? `Extrayendo datos de justificantes, cotejando con ${normativaFinanciacion} y emitiendo modelos PDF oficiales.`
            : 'Extrayendo datos de justificantes por OCR e IA, aplicando bases presupuestarias UEx 2026 y emitiendo modelos PDF oficiales.')}
        </p>

        {/* Barra de progreso animada */}
        <div
          style={{
            width: '100%',
            height: '7px',
            backgroundColor: 'var(--bg-subtle, #E2E8F0)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${Math.min(Math.max(progresoPorcentaje, 5), 100)}%`,
              height: '100%',
              backgroundColor: esCompletadoTotal ? '#16A34A' : 'var(--color-blue-inst, #1E40AF)',
              borderRadius: '999px',
              transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
              boxShadow: esCompletadoTotal ? '0 0 10px rgba(22, 163, 74, 0.4)' : '0 0 8px rgba(37, 99, 235, 0.3)'
            }}
          />
        </div>
      </div>

      {/* CUADRITO DE ESTADOS CON ANIMACIÓN SECUENCIAL */}
      <div
        style={{
          backgroundColor: 'var(--bg-app, #F8FAFC)',
          border: '1px solid var(--border-color, #E2E8F0)',
          borderRadius: '10px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          textAlign: 'left',
          width: '100%',
          maxWidth: '520px',
          fontSize: '12.5px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        {PASOS_PROCESAMIENTO_LOTE.map((paso) => {
          const isCompleted = progresoPaso > paso.id || esCompletadoTotal;
          const isActive = progresoPaso === paso.id && !esCompletadoTotal;

          if (isCompleted) {
            return (
              <div
                key={paso.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  backgroundColor: 'rgba(240, 253, 244, 0.85)',
                  border: '1px solid #BBF7D0',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <CheckCircle2 size={16} style={{ color: '#16A34A', flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(22, 163, 74, 0.25))' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                      {paso.titulo}
                    </div>
                    <div style={{ fontSize: '11px', color: '#15803D', marginTop: '1px' }}>
                      {paso.subtitulo}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: '#15803D',
                    backgroundColor: '#DCFCE7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}
                >
                  Completado
                </span>
              </div>
            );
          }

          if (isActive) {
            return (
              <div
                key={paso.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '7px',
                  backgroundColor: 'rgba(239, 246, 255, 0.95)',
                  border: '1.5px solid rgba(59, 130, 246, 0.5)',
                  boxShadow: '0 0 12px rgba(59, 130, 246, 0.12)',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <Loader2 size={16} style={{ color: 'var(--color-blue-inst, #1E40AF)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-blue-inst, #1E40AF)', fontSize: '12.5px' }}>
                      {paso.titulo}
                    </div>
                    <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '1px' }}>
                      {progresoSubexpediente && paso.id === 2 ? `Procesando: ${progresoSubexpediente}` : paso.subtitulo}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: '#1E40AF',
                    backgroundColor: '#DBEAFE',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563EB', animation: 'pulse 1s infinite' }} />
                  En curso
                </span>
              </div>
            );
          }

          return (
            <div
              key={paso.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '7px',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                opacity: 0.6,
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <Clock size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '12.5px' }}>
                    {paso.titulo}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', opacity: 0.8 }}>
                    {paso.subtitulo}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-subtle, #F1F5F9)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                Pendiente
              </span>
            </div>
          );
        })}

        {/* Subexpedientes a fiscalizar */}
        {subdirectorios && subdirectorios.length > 0 && (
          <div
            style={{
              marginTop: '4px',
              paddingTop: '10px',
              borderTop: '1px dashed var(--border-color, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Subexpedientes a fiscalizar:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {subdirectorios.map((sub) => {
                const esActivo = progresoSubexpediente === sub;
                return (
                  <span
                    key={sub}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: esActivo ? '#DBEAFE' : 'var(--bg-subtle)',
                      color: esActivo ? '#1E40AF' : 'var(--text-secondary)',
                      border: `1px solid ${esActivo ? '#93C5FD' : 'var(--border-color)'}`,
                      fontWeight: esActivo ? 600 : 500,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {sub}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
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
  const [progresoPaso, setProgresoPaso] = useState<number>(0);
  const [progresoPorcentaje, setProgresoPorcentaje] = useState<number>(0);
  const [progresoMensaje, setProgresoMensaje] = useState<string | null>(null);
  const [progresoSubexpediente, setProgresoSubexpediente] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenLote | null>(null);
  const [vistaModo, setVistaModo] = useState<'tabla' | 'informe_md'>('tabla');
  const [tabPrecargados, setTabPrecargados] = useState<'arbol' | 'resultados'>('arbol');
  const [modoPrecargados, setModoPrecargados] = useState<'seleccion' | 'arbol'>('seleccion');
  const [vistaLotesModo, setVistaLotesModo] = useState<'tarjetas' | 'tabla'>('tarjetas');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<{ url: string; titulo: string } | null>(null);
  const [expedienteArchivosModal, setExpedienteArchivosModal] = useState<{ nombre: string; archivos: string[] } | null>(null);
  const [archivoModal, setArchivoModal] = useState<ArchivoModalInfo | null>(null);
  const [lotesProcesadosEnSesion, setLotesProcesadosEnSesion] = useState<Record<string, boolean>>({});

  const [activeExcelSheet, setActiveExcelSheet] = useState<number>(0);
  const excelTableRef = useRef<HTMLDivElement>(null);

  const scrollExcelTable = (direction: 'left' | 'right') => {
    if (excelTableRef.current) {
      const amount = direction === 'left' ? -380 : 380;
      excelTableRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const abrirArchivoEnVisor = async (expedienteId: string, archivo: string) => {
    const loteId = selectedLote;
    const url = `/api/batch/archivo?lote_id=${encodeURIComponent(loteId)}&expediente_id=${encodeURIComponent(expedienteId)}&archivo=${encodeURIComponent(archivo)}`;
    const ext = archivo.split('.').pop()?.toLowerCase() || '';

    setActiveExcelSheet(0);

    if (ext === 'pdf') {
      setArchivoModal({
        loteId,
        expedienteId,
        nombreArchivo: archivo,
        url,
        tipo: 'pdf',
      });
    } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      setArchivoModal({
        loteId,
        expedienteId,
        nombreArchivo: archivo,
        url,
        tipo: 'imagen',
      });
    } else if (['md', 'txt', 'json', 'csv', 'log', 'yaml', 'yml'].includes(ext)) {
      setArchivoModal({
        loteId,
        expedienteId,
        nombreArchivo: archivo,
        url,
        tipo: 'texto',
        contenidoTexto: '',
        cargando: true,
      });
      try {
        const res = await fetch(url);
        const text = await res.text();
        setArchivoModal(prev => prev && prev.nombreArchivo === archivo ? { ...prev, contenidoTexto: text, cargando: false } : prev);
      } catch {
        setArchivoModal(prev => prev && prev.nombreArchivo === archivo ? { ...prev, contenidoTexto: 'Error al cargar el contenido del archivo.', cargando: false } : prev);
      }
    } else if (['xlsx', 'xls'].includes(ext)) {
      setArchivoModal({
        loteId,
        expedienteId,
        nombreArchivo: archivo,
        url,
        tipo: 'excel',
        cargando: true,
      });
      try {
        const officeUrl = `/api/batch/preview_office?lote_id=${encodeURIComponent(loteId)}&expediente_id=${encodeURIComponent(expedienteId)}&archivo=${encodeURIComponent(archivo)}`;
        const res = await fetch(officeUrl);
        const data = await res.json();
        if (data.ok && data.sheets) {
          setArchivoModal(prev => prev && prev.nombreArchivo === archivo ? { ...prev, officeData: data, cargando: false } : prev);
        } else {
          setArchivoModal(prev => prev && prev.nombreArchivo === archivo ? { ...prev, tipo: 'office', cargando: false } : prev);
        }
      } catch {
        setArchivoModal(prev => prev && prev.nombreArchivo === archivo ? { ...prev, tipo: 'office', cargando: false } : prev);
      }
    } else if (['docx', 'doc'].includes(ext)) {
      setArchivoModal({
        loteId,
        expedienteId,
        nombreArchivo: archivo,
        url,
        tipo: 'word',
        cargando: true,
      });
      try {
        const officeUrl = `/api/batch/preview_office?lote_id=${encodeURIComponent(loteId)}&expediente_id=${encodeURIComponent(expedienteId)}&archivo=${encodeURIComponent(archivo)}`;
        const res = await fetch(officeUrl);
        const data = await res.json();
        if (data.ok && data.elements) {
          setArchivoModal(prev => prev && prev.nombreArchivo === archivo ? { ...prev, officeData: data, cargando: false } : prev);
        } else {
          setArchivoModal(prev => prev && prev.nombreArchivo === archivo ? { ...prev, tipo: 'office', cargando: false } : prev);
        }
      } catch {
        setArchivoModal(prev => prev && prev.nombreArchivo === archivo ? { ...prev, tipo: 'office', cargando: false } : prev);
      }
    } else {
      setArchivoModal({
        loteId,
        expedienteId,
        nombreArchivo: archivo,
        url,
        tipo: 'office',
      });
    }
  };

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
          Icon: Building2
        };
      case 'honorarios':
        return {
          label: 'Honorarios y Asistencias',
          bg: '#EEF2FF',
          color: '#3730A3',
          border: '#C7D2FE',
          Icon: Scale
        };
      case 'dietas':
      default:
        return {
          label: 'Dietas y Desplazamientos',
          bg: '#FFFBEB',
          color: '#92400E',
          border: '#FDE68A',
          Icon: Layers
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
                            <procInfo.Icon size={12} />
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
      setNotifExito('Contexto del proyecto guardado en datos_comunes_expedientes.md');
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

  // Ejecución en lote asíncrona con animación secuencial progresiva
  const ejecutarProcesamiento = async (targetLoteId?: string) => {
    const loteId = targetLoteId || selectedLote;
    if (!loteId) return;
    setRunning(true);
    setProgresoPaso(1);
    setProgresoPorcentaje(15);
    setProgresoMensaje('Leyendo estructura de directorios y datos comunes...');
    setProgresoSubexpediente(null);
    setError('');

    // Timers para transición fluida de pasos visuales
    const t1 = setTimeout(() => {
      setProgresoPaso(prev => Math.max(prev, 2));
      setProgresoPorcentaje(prev => Math.max(prev, 35));
      setProgresoMensaje('Extrayendo justificantes con OCR e Inteligencia Artificial...');
    }, 700);

    const t2 = setTimeout(() => {
      setProgresoPaso(prev => Math.max(prev, 3));
      setProgresoPorcentaje(prev => Math.max(prev, 70));
      setProgresoMensaje('Fiscalizando legalidad y bases de ejecución UEx 2026...');
    }, 2200);

    const t3 = setTimeout(() => {
      setProgresoPaso(prev => Math.max(prev, 4));
      setProgresoPorcentaje(prev => Math.max(prev, 88));
      setProgresoMensaje('Generando modelos oficiales PDF AcroForm y empaquetando ZIP...');
    }, 3600);

    try {
      const res = await fetch('/api/batch/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lote_id: loteId })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al iniciar el lote');

      const resultado = await pollTask<ResumenLote>(
        data.task_id,
        600000,
        400,
        (prog) => {
          if (prog) {
            if (prog.paso) setProgresoPaso(prog.paso);
            if (prog.porcentaje) setProgresoPorcentaje(prog.porcentaje);
            if (prog.mensaje) setProgresoMensaje(prog.mensaje);
            if (prog.expediente) setProgresoSubexpediente(prog.expediente);
          }
        }
      );

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      // Estado 100% completado con animación de éxito
      setProgresoPaso(5);
      setProgresoPorcentaje(100);
      setProgresoMensaje('¡Procesamiento completado con éxito! Modelos emitidos.');
      setProgresoSubexpediente(null);

      // Breve pausa para que el usuario visualice el 100% y todos los checkmarks verdes
      await new Promise(r => setTimeout(r, 650));

      setResumen(resultado);
      await cargarLotes(loteId);
      await cargarDetalleLote(loteId);
      setNotifExito(`Lote "${loteId}" fiscalizado con éxito. Modelos emitidos.`);
      setLotesProcesadosEnSesion(prev => ({ ...prev, [loteId]: true }));
      setTabPrecargados('resultados');
      
      if (pantallaActual === 'cargar_nuevo') {
        setPasoCarga('resultados');
      }
    } catch (e: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setError(e.message || 'Fallo durante el procesamiento en lote.');
      if (pantallaActual === 'cargar_nuevo') {
        setPasoCarga('comprobar');
      }
    } finally {
      setRunning(false);
      setProgresoPaso(0);
      setProgresoPorcentaje(0);
      setProgresoMensaje(null);
      setProgresoSubexpediente(null);
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
                <span>BurocracIA</span>
                <span>/</span>
                <span>Fiscalización de Lotes Masivos</span>
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
                setModoPrecargados('seleccion');
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
                  Accede a los lotes que ya residen en el servidor (ej. <em>Lote Demostración</em>). Podrás consultar las auditorías realizadas, visualizar los modelos oficiales PDF emitidos o descargar el archivo ZIP final.
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

          {/* SUB-PANTALLA 4: PROCESO EN VIVO CON ANIMACIÓN */}
          {pasoCarga === 'proceso' && (
            <LoteProcesandoOverlay
              progresoPaso={progresoPaso}
              progresoPorcentaje={progresoPorcentaje}
              progresoSubexpediente={progresoSubexpediente}
              progresoMensaje={progresoMensaje}
              subdirectorios={loteDetalle?.expedientes?.map(e => (e as any).nombre || (e as any).expediente_id || '').filter(Boolean) || []}
              normativaFinanciacion={finConfig.normativa}
            />
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
                    <div style={{ fontSize: '11px', color: 'var(--color-success-text)' }}>100% Tramitados</div>
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
          
          {/* ========================================================================= */}
          {/* MODO 1: SELECCIÓN DE CASOS PRECARGADOS (TARJETAS INDIVIDUALES)            */}
          {/* ========================================================================= */}
          {modoPrecargados === 'seleccion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* BARRA SUPERIOR DE NAVEGACIÓN */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPantallaActual('menu')}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={13} />
                  <span>Volver al Menú Principal</span>
                </button>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Btn
                    variant="outline"
                    size="sm"
                    onClick={() => cargarLotes(selectedLote)}
                    disabled={loadingLotes || running}
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
                    disabled={running}
                  >
                    <Plus size={13} />
                    <span>Cargar Nuevo Lote</span>
                  </Btn>
                </div>
              </div>

              {/* TÍTULO Y DESCRIPCIÓN */}
              <div className="view-header" style={{ marginBottom: 0 }}>
                <div>
                  <div className="view-breadcrumb">
                    <span>BurocracIA</span>
                    <span>/</span>
                    <span>Liquidación Masiva</span>
                    <span>/</span>
                    <span>Lotes Precargados</span>
                  </div>
                  <h1 className="view-title">Selección de Casos y Lotes Precargados</h1>
                  <p className="view-desc">
                    Elige el lote que deseas inspeccionar y pulsa en <strong>Abrir Árbol de Directorios</strong> para ver sus justificantes y tramitarlo.
                  </p>
                </div>
              </div>

              {/* TARJETAS PEQUEÑAS Y SIMPLES CON SELECCIÓN SUAVE */}
              {loadingLotes ? (
                <div className="panel" style={{ padding: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <Loader2 size={26} className="animate-spin" style={{ color: 'var(--color-blue-inst)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cargando lotes disponibles en el servidor...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px'
                  }}>
                    {lotes.filter(l => l.id !== 'proveedores_zips').map((lote) => {
                      const isSelected = selectedLote === lote.id;
                      const fueProc = !!lotesProcesadosEnSesion[lote.id];

                      return (
                        <div
                          key={lote.id}
                          onClick={() => {
                            setSelectedLote(lote.id);
                            cargarDetalleLote(lote.id);
                            cargarResumen(lote.id);
                          }}
                          onDoubleClick={() => {
                            setSelectedLote(lote.id);
                            cargarDetalleLote(lote.id);
                            cargarResumen(lote.id);
                            setModoPrecargados('arbol');
                          }}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid var(--color-blue-inst)' : '1.5px solid var(--border-color)',
                            backgroundColor: isSelected ? 'var(--bg-blue-soft, #EFF6FF)' : 'var(--bg-surface)',
                            boxShadow: isSelected ? '0 2px 10px rgba(30, 64, 175, 0.12)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '7px',
                              backgroundColor: isSelected ? '#DBEAFE' : 'var(--bg-subtle)',
                              color: isSelected ? 'var(--color-blue-inst)' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'background-color 0.2s ease, color 0.2s ease'
                            }}>
                              <FolderArchive size={18} />
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: '13.5px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                color: isSelected ? 'var(--color-blue-inst)' : 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                transition: 'color 0.2s ease'
                              }}>
                                {lote.id}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                marginTop: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <Layers size={12} style={{ color: isSelected ? 'var(--color-blue-inst)' : 'var(--text-muted)' }} />
                                <span>{lote.total_expedientes} expedientes</span>
                                {fueProc && (
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    backgroundColor: '#DCFCE7',
                                    color: '#166534',
                                    border: '1px solid #BBF7D0'
                                  }}>
                                    Fiscalizado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Radio selector con animación suave */}
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSelected ? 'none' : '1.5px solid var(--border-color)',
                            backgroundColor: isSelected ? 'var(--color-blue-inst)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            transition: 'background-color 0.2s ease, border-color 0.2s ease',
                            flexShrink: 0
                          }}>
                            {isSelected && <Check size={11} strokeWidth={2.5} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón de acción para el lote seleccionado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
                    <Btn
                      variant="primary"
                      size="md"
                      onClick={() => {
                        if (selectedLote) {
                          cargarDetalleLote(selectedLote);
                          cargarResumen(selectedLote);
                          setModoPrecargados('arbol');
                        }
                      }}
                      disabled={!selectedLote}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FolderOpen size={15} />
                      <span>Abrir Árbol de Directorios</span>
                      <ArrowRight size={14} />
                    </Btn>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Lote seleccionado: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{selectedLote}</strong> (haz doble clic para entrar directamente)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODO 2: VISTA DE ÁRBOL ÚNICA Y CENTRAL (SIN RESULTADOS SEPARADOS)         */}
          {/* ========================================================================= */}
          {modoPrecargados === 'arbol' && (() => {
            const loteFueProcesado = !!lotesProcesadosEnSesion[selectedLote];

            return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem 1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setModoPrecargados('seleccion')}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={13} />
                    <span>Volver a Selección de Lotes</span>
                  </button>

                  <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderArchive size={16} style={{ color: 'var(--color-blue-inst)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Lote:
                    </span>
                    <select
                      value={selectedLote}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedLote(val);
                        cargarDetalleLote(val);
                        cargarResumen(val);
                      }}
                      disabled={running}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        padding: '4px 10px',
                        borderRadius: '5px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {lotes.filter(l => l.id !== 'proveedores_zips').map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.id} ({l.total_expedientes} exp.) {lotesProcesadosEnSesion[l.id] ? '[Fiscalizado]' : '[Pendiente]'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: loteFueProcesado ? '#DCFCE7' : '#FEF3C7',
                    color: loteFueProcesado ? '#166534' : '#92400E',
                    border: loteFueProcesado ? '1px solid #BBF7D0' : '1px solid #FDE68A'
                  }}>
                    {loteFueProcesado ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    <span>{loteFueProcesado ? 'Fiscalizado con Modelos' : 'Pendiente de Fiscalización'}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Btn
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedLote) {
                        cargarDetalleLote(selectedLote);
                        cargarResumen(selectedLote);
                      }
                    }}
                    disabled={running}
                  >
                    <RefreshCw size={13} />
                    <span>Actualizar</span>
                  </Btn>

                  {loteFueProcesado && (
                    <a
                      href={`/api/batch/descargar_zip/${encodeURIComponent(selectedLote)}`}
                      download
                      className="btn btn-outline btn-sm"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={13} />
                      <span>Descargar ZIP Completo</span>
                    </a>
                  )}

                  <Btn
                    variant="primary"
                    size="sm"
                    onClick={() => ejecutarProcesamiento(selectedLote)}
                    disabled={running || !selectedLote}
                  >
                    {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} style={{ fill: 'currentColor' }} />}
                    <span>{loteFueProcesado ? 'Reprocesar Lote' : 'Procesar Lote'}</span>
                  </Btn>
                </div>
              </div>

              {/* BANNER INFORMATIVO / RESULTADO */}
              {loteFueProcesado ? (
                <div style={{
                  backgroundColor: '#F0FDF4',
                  border: '1.5px solid #BBF7D0',
                  borderRadius: '8px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#166534', margin: 0 }}>
                        Documentación Oficial Cumplimentada con Éxito
                      </h3>
                      <p style={{ fontSize: '12.5px', color: '#15803D', margin: '3px 0 0', lineHeight: 1.5 }}>
                        Se han auditado los {loteDetalle?.total_expedientes ?? 0} expedientes conforme a las bases presupuestarias UEx 2026. Los modelos oficiales AcroForm PDF han sido emitidos en la subcarpeta <strong>salida/</strong> de cada expediente. Haz clic sobre cualquier archivo para abrirlo o descargarlo.
                      </p>
                    </div>
                  </div>

                  <a
                    href={`/api/batch/descargar_zip/${encodeURIComponent(selectedLote)}`}
                    download
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Download size={14} />
                    <span>Descargar Pack Oficial (ZIP)</span>
                  </a>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <FolderOpen size={20} style={{ color: '#1D4ED8', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E40AF' }}>
                      Árbol de Directorios y Justificantes de Entrada
                    </div>
                    <div style={{ fontSize: '12px', color: '#3B82F6', marginTop: '2px' }}>
                      Haz clic sobre cualquier documento para previsualizarlo en el visor integrado.
                    </div>
                  </div>
                </div>
              )}

              {/* OVERLAY DE PROCESAMIENTO EN VIVO CON ANIMACIÓN */}
              {running && (
                <LoteProcesandoOverlay
                  progresoPaso={progresoPaso}
                  progresoPorcentaje={progresoPorcentaje}
                  progresoSubexpediente={progresoSubexpediente}
                  progresoMensaje={progresoMensaje}
                  subdirectorios={loteDetalle?.expedientes?.map(e => (e as any).nombre || (e as any).expediente_id || '').filter(Boolean) || []}
                  normativaFinanciacion={finConfig.normativa}
                />
              )}

              {/* PANEL DEL ÁRBOL DE DIRECTORIOS (ESTRICTAMENTE VERTICAL, SIN EMOJIS, CON CLIC PARA ABRIR CADA ARCHIVO) */}
              <div className="panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  
                  {/* Cabecera del Árbol */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderOpen size={17} style={{ color: 'var(--color-blue-inst)' }} />
                        <span>Estructura del Lote: {selectedLote}</span>
                      </h2>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                        Ruta física: <span style={{ fontFamily: 'var(--font-mono)' }}>{loteDetalle?.ruta || `dataset/lotes_prueba/${selectedLote}`}</span>
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}>
                        {loteDetalle?.total_expedientes ?? 0} Subdirectorios
                      </span>

                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        backgroundColor: finConfig.badgeBg,
                        border: `1px solid ${finConfig.badgeColor}33`,
                        color: finConfig.badgeColor
                      }}>
                        {finConfig.id} ({finConfig.normativa})
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo del Árbol Monospace Interactivo - FORMATO PURAMENTE VERTICAL */}
                  <div style={{
                    padding: '1.5rem 1.75rem',
                    backgroundColor: 'var(--bg-app)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12.5px',
                    lineHeight: '1.75',
                    maxHeight: '580px',
                    overflowY: 'auto'
                  }}>
                    
                    {/* Raíz del Lote */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      <FolderOpen size={16} style={{ color: 'var(--color-blue-inst)' }} />
                      <span>{selectedLote}/</span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>(directorio principal)</span>
                    </div>

                    {/* Archivo de Contexto Común: Fila Vertical */}
                    <div style={{
                      marginLeft: '8px',
                      paddingLeft: '20px',
                      borderLeft: '1px dashed var(--border-color)',
                      paddingTop: '3px',
                      paddingBottom: '5px'
                    }}>
                      <div
                        onClick={() => abrirArchivoEnVisor('', 'datos_comunes_expedientes.md')}
                        title="Clic para ver o previsualizar este documento"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#EFF6FF';
                          e.currentTarget.style.borderColor = '#93C5FD';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>├──</span>
                        <FileCode size={14} style={{ color: 'var(--color-blue-inst)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>datos_comunes_expedientes.md</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                          (Investigador: {formInvestigador || 'Dr. Pedro González'} · Orgánica: {formOrganica || '18.IW.97.89'})
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: 'var(--color-blue-inst)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          marginLeft: '4px',
                          fontFamily: 'var(--font-sans)'
                        }}>
                          <Eye size={11} />
                          <span>Abrir</span>
                        </span>
                      </div>
                    </div>

                    {/* Subdirectorios de Expedientes */}
                    {loteDetalle?.expedientes.map((exp, expIdx) => {
                      const isLastExp = expIdx === loteDetalle.expedientes.length - 1;
                      const procInfo = getProcInfo(exp.tipo_procedimiento);
                      const modelos = exp.modelos_generados || [];
                      const mostrarSalidaExp = loteFueProcesado && modelos.length > 0;

                      return (
                        <div
                          key={exp.nombre}
                          style={{
                            marginLeft: '8px',
                            paddingLeft: '20px',
                            borderLeft: isLastExp ? '1px dashed transparent' : '1px dashed var(--border-color)',
                            position: 'relative',
                            marginTop: '12px'
                          }}
                        >
                          {/* Fila del Subdirectorio */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>{isLastExp ? '└──' : '├──'}</span>
                            <Folder size={15} style={{ color: '#D97706', flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                              {exp.nombre}/
                            </span>
                            
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-subtle)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)',
                              fontFamily: 'var(--font-sans)'
                            }}>
                              {exp.total_archivos} archivo{exp.total_archivos === 1 ? '' : 's'}
                            </span>

                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: procInfo.bg,
                              color: procInfo.color,
                              border: `1px solid ${procInfo.border}`,
                              fontFamily: 'var(--font-sans)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <procInfo.Icon size={11} />
                              <span>{procInfo.label}</span>
                            </span>

                            {loteFueProcesado && (
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#DCFCE7',
                                color: '#166534',
                                border: '1px solid #BBF7D0',
                                fontFamily: 'var(--font-sans)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <CheckCircle2 size={11} />
                                <span>Conforme SGTRI</span>
                              </span>
                            )}
                          </div>

                          {/* Rama de Archivos Justificantes (Entrada) - ESTRICTAMENTE VERTICAL (UNA LÍNEA POR ARCHIVO) */}
                          <div style={{
                            marginLeft: '28px',
                            paddingLeft: '18px',
                            borderLeft: isLastExp ? '1px dashed transparent' : '1px dashed var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            marginTop: '4px',
                            marginBottom: '6px'
                          }}>
                            {exp.archivos.map((archivo, aIdx) => {
                              const isLastArch = !mostrarSalidaExp && aIdx === exp.archivos.length - 1;
                              const ext = archivo.split('.').pop()?.toLowerCase();
                              let iconColor = 'var(--text-muted)';
                              if (ext === 'pdf') iconColor = '#DC2626';
                              else if (ext === 'docx' || ext === 'doc') iconColor = '#2563EB';
                              else if (ext === 'xlsx' || ext === 'xls') iconColor = '#16A34A';
                              else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') iconColor = '#9333EA';

                              return (
                                <div
                                  key={archivo}
                                  onClick={() => abrirArchivoEnVisor(exp.nombre, archivo)}
                                  title={`Clic para abrir o previsualizar ${archivo}`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '12px',
                                    color: 'var(--text-primary)',
                                    padding: '3px 8px',
                                    margin: '1px 0',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    width: 'fit-content',
                                    maxWidth: '100%',
                                    backgroundColor: 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  <span style={{ color: 'var(--text-muted)', userSelect: 'none', fontSize: '11px', flexShrink: 0 }}>
                                    {isLastArch ? '└──' : '├──'}
                                  </span>
                                  <FileText size={13} style={{ color: iconColor, flexShrink: 0 }} />
                                  <span style={{ fontWeight: 500 }}>
                                    {archivo}
                                  </span>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: 'var(--color-blue-inst)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    marginLeft: '6px',
                                    fontFamily: 'var(--font-sans)',
                                    opacity: 0.8
                                  }}>
                                    <Eye size={10} />
                                    <span>Ver</span>
                                  </span>
                                </div>
                              );
                            })}

                            {/* Rama de Modelos Oficiales Generados (Salida) - SOLO VISIBLE TRAS PROCESAR EL LOTE */}
                            {mostrarSalidaExp && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px', paddingTop: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '11.5px', padding: '2px 0' }}>
                                  <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>└──</span>
                                  <FolderOpen size={13} style={{ color: '#166534', flexShrink: 0 }} />
                                  <span>salida/ (Modelos Oficiales SGTRI Generados)</span>
                                </div>

                                <div style={{
                                  marginLeft: '24px',
                                  paddingLeft: '14px',
                                  borderLeft: '1px dashed #BBF7D0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  marginTop: '2px'
                                }}>
                                  {modelos.map((modelo, mIdx) => {
                                    const isLastModel = mIdx === modelos.length - 1;
                                    const modPdfUrl = `/api/batch/archivo?lote_id=${encodeURIComponent(selectedLote)}&expediente_id=${encodeURIComponent(exp.nombre)}&archivo=${encodeURIComponent(modelo)}`;

                                    return (
                                      <div
                                        key={modelo}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          fontSize: '11.5px',
                                          padding: '2px 8px',
                                          margin: '1px 0',
                                          borderRadius: '4px',
                                          width: 'fit-content',
                                          maxWidth: '100%',
                                          backgroundColor: 'transparent'
                                        }}
                                      >
                                        <span style={{ color: 'var(--text-muted)', userSelect: 'none', fontSize: '11px', flexShrink: 0 }}>
                                          {isLastModel ? '└──' : '├──'}
                                        </span>
                                        <FileText size={12} style={{ color: '#DC2626', flexShrink: 0 }} />
                                        <span
                                          onClick={() => abrirArchivoEnVisor(exp.nombre, modelo)}
                                          title="Clic para ver modelo oficial en el visor"
                                          style={{
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {modelo}
                                        </span>
                                        <span style={{
                                          fontSize: '9.5px',
                                          fontWeight: 700,
                                          padding: '1px 5px',
                                          borderRadius: '3px',
                                          backgroundColor: '#DCFCE7',
                                          color: '#166534',
                                          border: '1px solid #BBF7D0',
                                          fontFamily: 'var(--font-sans)'
                                        }}>
                                          Oficial PDF
                                        </span>

                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
                                          <button
                                            type="button"
                                            onClick={() => abrirArchivoEnVisor(exp.nombre, modelo)}
                                            className="btn btn-ghost btn-xs"
                                            style={{ padding: '1px 5px', fontSize: '10px', height: '20px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                            title="Previsualizar PDF en visor"
                                          >
                                            <Eye size={10} />
                                            <span>Ver</span>
                                          </button>
                                          <a
                                            href={modPdfUrl}
                                            download={modelo}
                                            className="btn btn-ghost btn-xs"
                                            style={{ padding: '1px 5px', fontSize: '10px', height: '20px', color: '#166534', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                            title="Descargar PDF oficial"
                                          >
                                            <Download size={10} />
                                            <span>Descargar</span>
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barra de Acción Inferior */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {loteFueProcesado ? 'Lote completamente auditado y modelos generados' : 'Iniciar Fiscalización Masiva del Lote'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {loteFueProcesado 
                          ? 'Puedes abrir cualquier justificante o modelo haciendo clic en él, o volver a reprocesar el lote.'
                          : 'Se ejecutarán los procesos de extracción OCR/IA, validación de gastos y emisión de modelos oficiales PDF.'}
                      </div>
                    </div>

                    <Btn
                      variant="primary"
                      size="lg"
                      onClick={() => ejecutarProcesamiento(selectedLote)}
                      disabled={running || !selectedLote}
                      style={{ minWidth: '220px', justifyContent: 'center' }}
                    >
                      <Play size={15} style={{ fill: 'currentColor' }} />
                      <span>{loteFueProcesado ? 'Reprocesar Lote Completo' : 'Procesar Lote Completo'}</span>
                    </Btn>
                  </div>
                </div>

            </div>
            );
          })()}

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
      {/* MODAL UNIVERSAL DE VISOR DE ARCHIVOS (PDF, IMAGEN, TEXTO, OFFICE)          */}
      {/* ========================================================================= */}
      {archivoModal && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="modal-dialog" style={{ width: '94vw', maxWidth: archivoModal.tipo === 'excel' ? '1320px' : '1050px', height: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <FileText size={16} style={{ color: 'var(--color-blue-inst)', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {archivoModal.loteId} / {archivoModal.expedienteId ? `${archivoModal.expedienteId} / ` : ''}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {archivoModal.nombreArchivo}
                  </span>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  {archivoModal.tipo}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <a
                  href={archivoModal.url}
                  download={archivoModal.nombreArchivo}
                  className="btn btn-outline btn-sm"
                  title="Descargar archivo"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                  <Download size={13} />
                  <span>Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={() => setArchivoModal(null)}
                  className="uex-theme-btn"
                  title="Cerrar visor"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              {archivoModal.tipo === 'pdf' && (
                <object
                  data={archivoModal.url}
                  type="application/pdf"
                  style={{ width: '100%', height: '100%' }}
                >
                  <iframe
                    src={archivoModal.url}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={archivoModal.nombreArchivo}
                  />
                </object>
              )}

              {archivoModal.tipo === 'imagen' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '1.5rem',
                  backgroundColor: '#0F172A'
                }}>
                  <img
                    src={archivoModal.url}
                    alt={archivoModal.nombreArchivo}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                  />
                </div>
              )}

              {archivoModal.tipo === 'texto' && (
                archivoModal.cargando ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-blue-inst)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cargando contenido del documento...</span>
                  </div>
                ) : (
                  <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
                    <pre style={{
                      margin: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12.5px',
                      lineHeight: '1.65',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'var(--text-primary)'
                    }}>
                      {archivoModal.contenidoTexto}
                    </pre>
                  </div>
                )
              )}

              {/* VISOR DE HOJA DE CÁLCULO EXCEL (.XLSX, .XLS) */}
              {archivoModal.tipo === 'excel' && (
                archivoModal.cargando ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
                    <Loader2 size={26} className="animate-spin" style={{ color: '#16A34A' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cargando datos de la hoja de cálculo...</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    {(() => {
                      const currentSheet = archivoModal.officeData?.sheets?.[activeExcelSheet] || archivoModal.officeData?.sheets?.[0];
                      const totalCols = currentSheet?.rows?.[0]?.length || 0;
                      const totalRows = currentSheet?.rows ? Math.max(0, currentSheet.rows.length - 1) : 0;

                      return (
                        <>
                          {/* Barra de Pestañas y Controles de Desplazamiento */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 16px',
                            backgroundColor: 'var(--bg-subtle)',
                            borderBottom: '1px solid var(--border-color)',
                            gap: '12px',
                            flexWrap: 'wrap',
                            flexShrink: 0
                          }}>
                            {/* Selector de pestañas */}
                            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
                              {archivoModal.officeData?.sheets && archivoModal.officeData.sheets.length > 1 ? (
                                archivoModal.officeData.sheets.map((s, idx) => (
                                  <button
                                    key={s.name}
                                    type="button"
                                    onClick={() => setActiveExcelSheet(idx)}
                                    className={`filter-btn ${activeExcelSheet === idx ? 'active' : ''}`}
                                    style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                                  >
                                    <FileSpreadsheet size={13} style={{ color: activeExcelSheet === idx ? '#16A34A' : 'var(--text-muted)' }} />
                                    <span>{s.name}</span>
                                    <span style={{ opacity: 0.6, fontSize: '10px' }}>({s.rows.length > 1 ? s.rows.length - 1 : 0} filas)</span>
                                  </button>
                                ))
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  <FileSpreadsheet size={14} style={{ color: '#16A34A' }} />
                                  <span>{currentSheet?.name || 'Hoja1'}</span>
                                </div>
                              )}
                            </div>

                            {/* Controles de Navegación Horizontal */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {totalCols} columnas · {totalRows} {totalRows === 1 ? 'fila' : 'filas'}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => scrollExcelTable('left')}
                                  className="btn btn-outline btn-xs"
                                  style={{ padding: '2px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                                  title="Desplazar tabla a la izquierda"
                                >
                                  <ChevronLeft size={13} />
                                  <span>Izq.</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => scrollExcelTable('right')}
                                  className="btn btn-outline btn-xs"
                                  style={{ padding: '2px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                                  title="Desplazar tabla a la derecha"
                                >
                                  <span>Der.</span>
                                  <ChevronRight size={13} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Contenedor de la Tabla con Desplazamiento Horizontal y Vertical */}
                          <div
                            ref={excelTableRef}
                            style={{
                              flex: 1,
                              overflowX: 'auto',
                              overflowY: 'auto',
                              backgroundColor: 'var(--bg-app)',
                              position: 'relative',
                              scrollbarWidth: 'thin'
                            }}
                          >
                            {!currentSheet || currentSheet.rows.length === 0 ? (
                              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>La hoja de cálculo está vacía.</div>
                            ) : (() => {
                              const headers = currentSheet.rows[0];
                              const dataRows = currentSheet.rows.slice(1);

                              return (
                                <table style={{
                                  width: 'max-content',
                                  minWidth: '100%',
                                  borderCollapse: 'separate',
                                  borderSpacing: 0,
                                  fontSize: '12px',
                                  fontFamily: 'var(--font-mono)'
                                }}>
                                  <thead>
                                    <tr>
                                      <th style={{
                                        position: 'sticky',
                                        top: 0,
                                        left: 0,
                                        zIndex: 20,
                                        backgroundColor: 'var(--bg-subtle)',
                                        borderBottom: '2px solid var(--border-color)',
                                        borderRight: '1px solid var(--border-color)',
                                        padding: '8px 12px',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        fontSize: '10.5px',
                                        userSelect: 'none',
                                        boxShadow: '1px 1px 0 var(--border-color)'
                                      }}>
                                        #
                                      </th>
                                      {headers.map((h, hIdx) => (
                                        <th
                                          key={hIdx}
                                          style={{
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 10,
                                            backgroundColor: 'var(--bg-subtle)',
                                            borderBottom: '2px solid var(--border-color)',
                                            borderRight: '1px solid var(--border-color)',
                                            padding: '8px 14px',
                                            textAlign: 'left',
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 1px 0 var(--border-color)'
                                          }}
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dataRows.map((row, rIdx) => (
                                      <tr
                                        key={rIdx}
                                        style={{
                                          backgroundColor: rIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-app)'
                                        }}
                                      >
                                        <td style={{
                                          position: 'sticky',
                                          left: 0,
                                          zIndex: 5,
                                          backgroundColor: rIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-app)',
                                          borderBottom: '1px solid var(--border-color)',
                                          borderRight: '1px solid var(--border-color)',
                                          padding: '8px 12px',
                                          textAlign: 'center',
                                          color: 'var(--text-muted)',
                                          fontSize: '10.5px',
                                          fontWeight: 600,
                                          userSelect: 'none',
                                          boxShadow: '1px 0 0 var(--border-color)'
                                        }}>
                                          {rIdx + 1}
                                        </td>
                                        {headers.map((_, colIdx) => (
                                          <td
                                            key={colIdx}
                                            style={{
                                              borderBottom: '1px solid var(--border-color)',
                                              borderRight: '1px solid var(--border-color)',
                                              padding: '8px 14px',
                                              color: 'var(--text-primary)',
                                              whiteSpace: 'nowrap'
                                            }}
                                          >
                                            {row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : ''}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            })()}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )
              )}

              {/* VISOR DE DOCUMENTO WORD (.DOCX, .DOC) */}
              {archivoModal.tipo === 'word' && (
                archivoModal.cargando ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
                    <Loader2 size={26} className="animate-spin" style={{ color: '#2563EB' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cargando contenido del documento de texto...</span>
                  </div>
                ) : (
                  <div style={{ height: '100%', overflowY: 'auto', padding: '2rem 1.5rem', backgroundColor: 'var(--bg-app)' }}>
                    <div style={{
                      maxWidth: '820px',
                      margin: '0 auto',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '2.5rem 3rem',
                      boxShadow: 'var(--shadow-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      fontSize: '13px',
                      lineHeight: 1.65,
                      color: 'var(--text-primary)'
                    }}>
                      {archivoModal.officeData?.elements?.map((elem, eIdx) => {
                        if (elem.type === 'heading') {
                          return (
                            <h3 key={eIdx} style={{
                              fontSize: '15px',
                              fontWeight: 700,
                              color: 'var(--color-blue-inst)',
                              margin: '12px 0 4px',
                              borderBottom: '1px solid var(--border-color)',
                              paddingBottom: '4px'
                            }}>
                              {elem.text}
                            </h3>
                          );
                        }
                        if (elem.type === 'table' && elem.rows) {
                          return (
                            <div key={eIdx} style={{ overflowX: 'auto', margin: '10px 0' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border-color)', fontSize: '12.5px' }}>
                                <tbody>
                                  {elem.rows.map((row, rIdx) => (
                                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rIdx === 0 ? 'var(--bg-subtle)' : 'transparent' }}>
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} style={{ padding: '6px 10px', borderRight: '1px solid var(--border-color)', fontWeight: rIdx === 0 ? 600 : 400 }}>
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                        return (
                          <p key={eIdx} style={{ margin: 0, fontWeight: elem.bold ? 600 : 400 }}>
                            {elem.text}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              {(archivoModal.tipo === 'office' || archivoModal.tipo === 'otro') && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '2.5rem',
                  gap: '1.25rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-blue-soft)',
                    color: 'var(--color-blue-inst)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {archivoModal.nombreArchivo}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '8px auto 0', lineHeight: 1.5 }}>
                      Este archivo es un documento ofimático o binario. Para visualizarlo y editarlo con todas sus fórmulas y formato, descárgalo directamente a tu equipo.
                    </p>
                  </div>
                  <a
                    href={archivoModal.url}
                    download={archivoModal.nombreArchivo}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}
                  >
                    <Download size={15} />
                    <span>Descargar para abrir en equipo</span>
                  </a>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {archivoModal.tipo === 'excel' ? 'Visor de hojas de cálculo · Desplázate horizontalmente con la barra inferior o los botones Izq. / Der.' : 'Visor integrado de expedientes SGTRI UEx'}
              </span>
              <Btn variant="outline" size="sm" onClick={() => setArchivoModal(null)}>
                Cerrar Visor
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PREVISUALIZACIÓN DE MODELO OFICIAL PDF (LEGACY)                  */}
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
