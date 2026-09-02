import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronRight, ArrowRight, Play, Loader2, AlertTriangle, CheckCircle, RefreshCw, UploadCloud, X, Trash2,
  ChevronLeft, RotateCcw, Check, Eye, CheckCircle2, FileText, FolderOpen, Printer, Info, ShieldCheck,
  Scale, FileCheck, Building2, HelpCircle, ExternalLink, Copy, Terminal, ChevronDown, ChevronUp, ZoomIn,
  Calendar, Car, BedDouble, MapPin, Navigation, Gauge, Fuel, CreditCard, Clock, Sparkles, Route, ArrowRightLeft,
  CheckCircle as CheckCircleIcon, ShieldAlert, Wallet
} from 'lucide-react';
import { ViewGrafo } from './ViewGrafo';
import { cn, pollTask } from '../../lib/utils';
import { TEMPLATES } from '../../lib/data';
import type { CasoResult } from '../../lib/types';
import { Btn } from '../ui/Btn';
import { StatusBadge } from '../ui/Badges';
import { AlertErr, RunningInfo } from '../ui/Alerts';
import { LogViewer } from '../ui/LogViewer';


// Componente de Calendario Mensual con Días de Comisión de Servicio Marcados
function CalendarioDietas({ 
  detalleDias, 
  tarifaDia, 
  factorTotal, 
  importeTotal 
}: { 
  detalleDias: Array<{ dia: string; tipo: string; factor?: number; importe?: number }>;
  tarifaDia: number;
  factorTotal: number;
  importeTotal: number;
}) {
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');
  const [selectedDay, setSelectedDay] = useState<string | null>(detalleDias?.[0]?.dia || null);

  // Mapear días de la comisión
  const daysMap = useMemo(() => {
    const map = new Map<string, { tipo: string; factor: number; importe: number; diaStr: string; dayNum: number }>();
    detalleDias?.forEach(d => {
      if (!d.dia) return;
      const parsed = new Date(d.dia);
      const factor = typeof d.factor === 'number' ? d.factor : (d.tipo === 'regreso' ? 0.5 : 1.0);
      const importe = typeof d.importe === 'number' ? d.importe : factor * tarifaDia;
      
      const key = d.dia.includes('T') ? d.dia.split('T')[0] : d.dia;
      map.set(key, {
        tipo: d.tipo,
        factor,
        importe,
        diaStr: d.dia,
        dayNum: parsed.getDate()
      });
    });
    return map;
  }, [detalleDias, tarifaDia]);

  const firstDate = useMemo(() => {
    if (detalleDias && detalleDias.length > 0 && detalleDias[0].dia) {
      const d = new Date(detalleDias[0].dia);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [detalleDias]);

  const year = firstDate.getFullYear();
  const month = firstDate.getMonth(); // 0-indexed

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const monthName = monthNames[month];

  const { startDayOffset, totalDaysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDayOffset = (firstDay.getDay() + 6) % 7; // Lunes=0, Domingo=6
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    return { startDayOffset, totalDaysInMonth };
  }, [year, month]);

  const weekDayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    return daysMap.get(selectedDay) || null;
  }, [selectedDay, daysMap]);

  return (
    <div className="space-y-4">
      {/* Encabezado del Módulo con Selector de Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Calendario de Estancia y Manutención
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold">
                {monthName} {year}
              </span>
            </h4>
            <span className="text-[11px] text-zinc-400">
              Tarifa regulada: {tarifaDia.toFixed(2)} €/día íntegro · {factorTotal.toFixed(1)} jornadas computables
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                viewMode === 'calendar' 
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              Vista Calendario
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                viewMode === 'cards' 
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              Vista Fichas
            </button>
          </div>

          <span className="text-sm font-extrabold font-mono px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {importeTotal.toFixed(2)} €
          </span>
        </div>
      </div>

      {/* VISTA 1: CALENDARIO MENSUAL INTERACTIVO */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Cuadrícula del Calendario Mensual (Columna Izquierda 8 cols) */}
          <div className="lg:col-span-8 p-5 rounded-3xl bg-zinc-50/90 dark:bg-zinc-950/90 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-inner">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono">
                {monthName} {year}
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Salida (100%)
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Estancia (100%)
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Regreso (50%)
                </span>
              </div>
            </div>

            {/* Cabecera de días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-zinc-400 dark:text-zinc-500 pb-1">
              {weekDayHeaders.map((d, idx) => (
                <div key={idx} className="py-1">{d}</div>
              ))}
            </div>

            {/* Celdas de días del mes */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: startDayOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-16 rounded-2xl bg-zinc-100/30 dark:bg-zinc-900/20 border border-transparent" />
              ))}

              {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const tripDay = daysMap.get(dateKey);
                const isSelected = selectedDay === dateKey;

                if (tripDay) {
                  const isSalida = tripDay.tipo === 'salida';
                  const isRegreso = tripDay.tipo === 'regreso';
                  
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => setSelectedDay(dateKey)}
                      className={cn(
                        "h-16 rounded-2xl p-1.5 flex flex-col justify-between transition-all cursor-pointer text-left border relative group shadow-sm",
                        isSalida && "bg-blue-500/10 border-blue-400/60 dark:border-blue-500/50 hover:bg-blue-500/20",
                        isRegreso && "bg-amber-500/10 border-amber-400/60 dark:border-amber-500/50 hover:bg-amber-500/20",
                        !isSalida && !isRegreso && "bg-emerald-500/10 border-emerald-400/60 dark:border-emerald-500/50 hover:bg-emerald-500/20",
                        isSelected && "ring-2 ring-zinc-900 dark:ring-zinc-100 shadow-md scale-[1.02]"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {dayNum}
                        </span>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          isSalida && "bg-blue-500",
                          isRegreso && "bg-amber-500",
                          !isSalida && !isRegreso && "bg-emerald-500"
                        )} />
                      </div>
                      
                      <div className="w-full">
                        <span className={cn(
                          "text-[9px] font-bold block truncate",
                          isSalida && "text-blue-700 dark:text-blue-300",
                          isRegreso && "text-amber-700 dark:text-amber-300",
                          !isSalida && !isRegreso && "text-emerald-700 dark:text-emerald-300"
                        )}>
                          {isSalida ? 'Salida' : isRegreso ? 'Regreso' : 'Congreso'}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-zinc-900 dark:text-zinc-100 block">
                          {tripDay.importe.toFixed(2)} €
                        </span>
                      </div>
                    </button>
                  );
                }

                return (
                  <div
                    key={dateKey}
                    className="h-16 rounded-2xl p-1.5 flex flex-col justify-start bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-400 dark:text-zinc-600 select-none"
                  >
                    <span className="font-mono text-xs">{dayNum}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel Lateral de Detalle del Día Seleccionado (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between shadow-sm space-y-4">
            {selectedDayInfo ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Día Inspeccionado
                    </span>
                    <h5 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                      {selectedDayInfo.diaStr}
                    </h5>
                  </div>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-xl font-bold font-mono",
                    selectedDayInfo.tipo === 'salida' && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                    selectedDayInfo.tipo === 'regreso' && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                    selectedDayInfo.tipo !== 'salida' && selectedDayInfo.tipo !== 'regreso' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                  )}>
                    {selectedDayInfo.factor * 100}% Manutención
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Concepto Liquidado</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                      {selectedDayInfo.tipo === 'salida' ? 'Jornada de Ida y Desplazamiento Inicial' : selectedDayInfo.tipo === 'regreso' ? 'Jornada de Retorno a Origen' : 'Estancia y Participación en Congreso'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Fórmula de Cálculo</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                      {selectedDayInfo.factor.toFixed(1)} factor × {tarifaDia.toFixed(2)} €/día = {selectedDayInfo.importe.toFixed(2)} €
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Normativa Aplicable</span>
                    <span className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-tight block mt-0.5">
                      RD 462/2002 · Exención total de IRPF según Art. 9 RIRPF.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 text-xs">
                Seleccione un día marcado en el calendario para inspeccionar el desglose normativo.
              </div>
            )}

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Total Comisión:</span>
              <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                {importeTotal.toFixed(2)} €
              </span>
            </div>
          </div>

        </div>
      )}

      {/* VISTA 2: FICHAS DIARIAS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in">
          {detalleDias?.map((d: any, i: number) => {
            const factor = typeof d.factor === 'number' ? d.factor : 1.0;
            const importeFila = typeof d.importe === 'number' ? d.importe : (factor * tarifaDia);
            const isSalida = d.tipo === 'salida';
            const isRegreso = d.tipo === 'regreso';

            return (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group",
                  isSalida && "bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-950/20 dark:to-zinc-900 border-blue-200/80 dark:border-blue-900/60",
                  isRegreso && "bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-950/20 dark:to-zinc-900 border-amber-200/80 dark:border-amber-900/60",
                  !isSalida && !isRegreso && "bg-zinc-50/70 dark:bg-zinc-950/70 border-zinc-200/80 dark:border-zinc-800"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Clock size={13} className="text-zinc-400" />
                      {d.dia}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono",
                      isSalida && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                      isRegreso && "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
                      !isSalida && !isRegreso && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    )}>
                      {factor * 100}% Dieta
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {isSalida ? 'Jornada de Ida / Inicio' : isRegreso ? 'Jornada de Retorno' : 'Actividad Oficial / Congreso'}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Factor asignado: {factor.toFixed(1)}x
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Total Día:</span>
                  <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                    {importeFila.toFixed(2)} €
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ViewProcesar({
  initialCaso,
  templateId,
  onVolver,
}: {
  initialCaso?: string;
  templateId?: string;
  onVolver: () => void;
  onInspeccionarCaso?: (id: string) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateId || 'dietas');
  const isDietas = selectedTemplate === 'dietas';

  const [currentStep, setCurrentStep] = useState<number>(templateId ? 2 : (initialCaso ? 2 : 1));
  const [previewTemplateModal, setPreviewTemplateModal] = useState<typeof TEMPLATES[0] | null>(null);

  const [casoSel, setCasoSel] = useState(initialCaso || '');
  const [tipoProyecto, setTipoProyecto] = useState('');
  const [casos, setCasos] = useState<{ id: string, tipo: string, total_archivos?: number, porcentaje?: number, completo?: boolean }[]>([]);
  const [showExpedientes, setShowExpedientes] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>();
  const [taskLogs, setTaskLogs] = useState<string>('');
  const [result, setResult] = useState<CasoResult | null>(null);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('desglose');
  const [jsonTab, setJsonTab] = useState<'extraccion' | 'liquidacion'>('liquidacion');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const tieneFicheroOExpediente = Boolean(casoSel || files.length > 0);

  useEffect(() => {
    fetch('/api/casos').then(r => r.json()).then(d => setCasos(d.casos || [])).catch(() => { });
  }, []);

  const casosFiltrados = useMemo(() => {
    if (!selectedTemplate) return casos;
    return casos.filter(c => c.tipo === selectedTemplate);
  }, [casos, selectedTemplate]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...dropped]);
      setCasoSel('');
      setError('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
      setCasoSel('');
      setError('');
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const ejecutar = useCallback(async () => {
    let targetCaso = casoSel;
    setRunning(true);
    setError('');
    setResult(null);
    setTaskLogs('Iniciando procesamiento del expediente mediante agente...');
    try {
      if (!targetCaso) {
        if (files.length === 0) throw new Error("Debe seleccionar un expediente o subir los archivos para justificar el gasto.");
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        const res = await fetch('/api/caso/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        targetCaso = data.caso_id;
        setCasoSel(targetCaso);
      }

      const reqTipoProyecto = isDietas ? tipoProyecto : '';

      const s = await fetch('/api/caso/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caso_id: targetCaso, tipo_proyecto: reqTipoProyecto }),
      });
      const { task_id } = await s.json();
      setActiveTaskId(task_id);
      const res = await pollTask<CasoResult>(task_id);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }, [casoSel, files, tipoProyecto, isDietas]);

  const reiniciarTramite = () => {
    setResult(null);
    setError('');
    setCurrentStep(1);
    setCasoSel('');
    setFiles([]);
    setTipoProyecto('');
  };

  const copyJsonToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STEPS = isDietas ? [
    { num: 1, label: 'Procedimiento' },
    { num: 2, label: 'Documentación' },
    { num: 3, label: 'Régimen Normativo' },
    { num: 4, label: 'Confirmación' },
  ] : [
    { num: 1, label: 'Procedimiento' },
    { num: 2, label: 'Documentación' },
    { num: 3, label: 'Confirmación' },
  ];

  const totalSteps = STEPS.length;

  return (
    <div className="space-y-6 animate-fade-in max-w-[90vw] mx-auto pb-16">

      {/* Cabecera del Proceso */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onVolver}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            title="Volver"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Liquidación Oficial de Gastos e Investigación
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Servicio de Gestión y Transferencia de Resultados de la Investigación (SGTRI) — Universidad de Extremadura
            </p>
          </div>
        </div>

        {result && (
          <Btn size="sm" variant="outline" onClick={reiniciarTramite} className="flex items-center gap-1.5 shadow-sm cursor-pointer">
            <RotateCcw size={14} />
            Nueva Liquidación
          </Btn>
        )}
      </div>

      {/* STEPPER DINÁMICO */}
      {!result && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-zinc-100 dark:bg-zinc-800 -z-0" />
            <div 
              className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 -z-0"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 90}%` }}
            />
            {STEPS.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 z-10">
                  <button
                    onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                    disabled={s.num > currentStep || running}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2",
                      isDone && "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 cursor-pointer",
                      isCurrent && "border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ring-4 ring-zinc-100 dark:ring-zinc-800",
                      !isDone && !isCurrent && "border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 bg-white dark:bg-zinc-900 cursor-not-allowed"
                    )}
                  >
                    {isDone ? <Check size={14} strokeWidth={3} /> : s.num}
                  </button>
                  <span className={cn(
                    "text-[11px] font-semibold tracking-tight transition-colors hidden sm:block",
                    isCurrent ? "text-zinc-900 dark:text-zinc-100 font-bold" : "text-zinc-400 dark:text-zinc-600"
                  )}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL WIZARD */}
      {!result && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          
          {/* PASO 1: SELECCIONAR PLANTILLA */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">1. Seleccione el Tipo de Trámite o Procedimiento</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  El sistema adaptará el motor de cálculo y los modelos normativos según el formulario oficial.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEMPLATES.map((t) => {
                  const isSel = selectedTemplate === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        "p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative group",
                        isSel 
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50/50 dark:bg-zinc-800/40 shadow-sm" 
                          : "border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                            {t.badge || 'Oficial'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewTemplateModal(t); }}
                            className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            title="Ver información del modelo oficial"
                          >
                            <Eye size={13} />
                            <span className="text-[11px] font-semibold">Ver Plantilla</span>
                          </button>
                        </div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{t.titulo}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{t.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-medium">Procedimiento Oficial UEx</span>
                        {isSel ? (
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Seleccionado
                          </span>
                        ) : (
                          <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">Seleccionar</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 2: DOCUMENTACIÓN */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">2. Aportación de Justificantes y Documentación</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Seleccione un expediente de pruebas preexistente o adjunte los documentos justificativos (PDFs, facturas, certificados, mapa de ruta).
                </p>
              </div>

              {/* Selector Desplegable de Casos del Sistema */}
              {casosFiltrados.length > 0 && (
                <div className="bg-zinc-50/70 dark:bg-zinc-950/70 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden transition-all">
                  <div
                    onClick={() => setShowExpedientes(prev => !prev)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen size={16} className="text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Expedientes Registrados en el Servidor
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-bold">
                        {casosFiltrados.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                      <span>{showExpedientes ? 'Ocultar' : 'Mostrar'}</span>
                      {showExpedientes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {showExpedientes && (
                    <div className="p-4 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50 animate-fade-in">
                      <div className="flex flex-wrap gap-2 pt-2">
                        {casosFiltrados.map((c) => {
                          const isSel = casoSel === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setCasoSel(isSel ? '' : c.id); setFiles([]); }}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 border cursor-pointer",
                                isSel 
                                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm"
                                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                              )}
                            >
                              <FolderOpen size={13} />
                              <span>{c.id}</span>
                              {c.total_archivos !== undefined && (
                                <span className={cn("text-[10px] px-1.5 py-0.2 rounded-md", isSel ? "bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500")}>
                                  {c.total_archivos} docs
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Zona de Arrastre de Archivos */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3",
                  isDragging 
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/40" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/30 dark:bg-zinc-950/30"
                )}
              >
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.xlsx" onChange={handleFileSelect} className="hidden" />
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Haga clic para subir archivos o arrástrelos aquí
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Facturas de hotel, billetes de transporte, tickets de autopista, certificados de asistencia o mapas
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Documentos Adjuntados ({files.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText size={14} className="text-zinc-400 shrink-0" />
                          <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{f.name}</span>
                          <span className="text-[10px] text-zinc-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-zinc-400 hover:text-red-500 p-1 cursor-pointer">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: RÉGIMEN NORMATIVO (SOLO DIETAS) */}
          {currentStep === 3 && isDietas && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">3. Marco Normativo y Fuente de Financiación</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  El sistema detectará automáticamente la fuente según los documentos, pero puede fijarla manualmente si lo desea.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: '', title: 'Detección Automática (IA)', desc: 'El agente identifica la fuente mediante los logos y el proyecto.' },
                  { id: 'UEX', title: 'Plan Estatal / UEx', desc: 'Dietas según RD 462/2002 (37,70 €/día manutención, 65,97 €/noche hotel).' },
                  { id: 'JUNTA', title: 'Junta de Extremadura', desc: 'Decreto Autonómico (53,34 €/día manutención, 102,56 €/noche hotel, aplica IRPF).' }
                ].map((m) => {
                  const isSel = tipoProyecto === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setTipoProyecto(m.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between",
                        isSel 
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 shadow-sm" 
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300"
                      )}
                    >
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mb-1">{m.title}</h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{m.desc}</p>
                      </div>
                      <div className="mt-3 text-[10px] font-bold text-zinc-400">
                        {isSel ? <span className="text-zinc-900 dark:text-zinc-100 font-bold">✓ Seleccionado</span> : 'Seleccionar'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO FINAL: CONFIRMACIÓN */}
          {((currentStep === 4 && isDietas) || (currentStep === 3 && !isDietas)) && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Confirmación y Lanzamiento del Agente</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Revise los parámetros antes de iniciar el flujo de extracción multimodal y cálculo determinista.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-500">Procedimiento:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{TEMPLATES.find(t => t.id === selectedTemplate)?.titulo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-500">Expediente / Archivos:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {casoSel ? casoSel : `${files.length} archivos adjuntados`}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Motor de Extracción:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Google Gemini 2.5 Flash (1M tokens)</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Btn 
                  size="lg" 
                  variant="primary" 
                  disabled={running || !tieneFicheroOExpediente} 
                  onClick={ejecutar}
                  className="w-full sm:w-auto px-8 shadow-md cursor-pointer"
                >
                  {running ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Procesando expediente...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-bold">
                      <Play size={16} /> Ejecutar Liquidación Oficial
                    </span>
                  )}
                </Btn>
              </div>
            </div>
          )}

          {/* BOTONES DE NAVEGACIÓN DEL WIZARD */}
          <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <Btn size="sm" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={running} className="cursor-pointer">
                <ChevronLeft size={16} className="mr-1" /> Anterior
              </Btn>
            ) : <div />}

            {currentStep < totalSteps && (
              <Btn 
                size="sm" 
                variant="primary" 
                onClick={() => setCurrentStep(prev => prev + 1)} 
                disabled={currentStep === 2 && !tieneFicheroOExpediente}
                className="cursor-pointer"
              >
                Siguiente <ChevronRight size={16} className="ml-1" />
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* ESTADO EN EJECUCIÓN CON VISOR DE LOGS */}
      {running && activeTaskId && (
        <div className="space-y-4">
          <RunningInfo text="Procesando expediente mediante Agente Liquidador..." sub="Extrayendo texto, validando certificados y ejecutando cálculo normativo" />
          <LogViewer raw={taskLogs} />
        </div>
      )}

      {/* ERROR */}
      {error && <AlertErr msg={error} />}

      {/* ========================================================================= */}
      {/* VISTA OFICIAL DE RESULTADOS (DISEÑO INSTITUCIONAL & WIDGETS VISUALES) */}
      {/* ========================================================================= */}
      {result && (
        <div ref={resultRef} className="space-y-6 animate-fade-in-up">

          {/* 1. HERO BANNER PRINCIPAL CON DICTAMEN OFICIAL */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Dictamen de Liquidación</span>
                  <StatusBadge ok={result.ok} sinGt={result.sin_ground_truth} />
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                    Normativa UEx 2025/2026
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                  Expediente: {result.caso_id}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                <Btn size="md" variant="outline" onClick={() => window.open(`/api/txt/generar/${result.caso_id}`, '_blank')} className="flex items-center gap-1.5 shadow-sm cursor-pointer">
                  <FileText size={15} />
                  Memoria Justificativa (TXT)
                </Btn>
                <Btn size="md" variant="primary" onClick={() => window.open(`/api/pdf/generar/${result.caso_id}`, '_blank')} className="flex items-center gap-1.5 shadow-sm cursor-pointer">
                  <Printer size={15} />
                  Descargar PDF Oficial UEx
                </Btn>
              </div>
            </div>

            {/* TARJETAS DE IMPORTES CLAVE (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                  Total Devengado Bruto
                </span>
                <p className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                  {result.liquido_ag.toFixed(2)} €
                </p>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">Suma de conceptos abonables</span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                  Retención IRPF
                </span>
                <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  0.00 €
                </p>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5 block">
                  100% Exento (RD 462/2002)
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                  Anticipo Descontado
                </span>
                <p className="text-2xl font-extrabold font-mono text-zinc-700 dark:text-zinc-300">
                  0.00 €
                </p>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">Pendiente de abono íntegro</span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 block mb-1">
                  Líquido a Percibir
                </span>
                <p className="text-2xl sm:text-3xl font-black font-mono">
                  {result.liquido_ag.toFixed(2)} €
                </p>
                <span className="text-[11px] text-zinc-300 dark:text-zinc-700 font-medium mt-0.5 block">
                  Propuesta neta a transferir
                </span>
              </div>

            </div>
          </div>

          {/* 2. PESTAÑAS DE CONTENIDO DETALLADO */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            
            {/* SELECTOR DE PESTAÑAS ELEGANTE */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 overflow-x-auto pb-px">
              {[
                { id: 'desglose', label: 'Desglose Visual de Liquidación' },
                { id: 'fundamentacion', label: 'Régimen Fiscal y Fundamento Jurídico' },
                { id: 'json', label: 'Esquema JSON' },
                { id: 'auditoria', label: 'Auditoría y Trazabilidad' },
                { id: 'grafo', label: 'Grafo de Ejecución' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer",
                    activeTab === t.id 
                      ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100" 
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8">
              
              {/* =============================================================== */}
              {/* TAB 1: DESGLOSE VISUAL E INTERACTIVO */}
              {/* =============================================================== */}
              {activeTab === 'desglose' && (
                <div className="space-y-8 animate-fade-in">
                  {result.liquidacion && (result.liquidacion as any).conceptos ? (() => {
                    const liq = result.liquidacion as any;
                    const manutencion = liq.conceptos.manutencion;
                    const transporte = liq.conceptos.transporte;
                    const alojamiento = liq.conceptos.alojamiento;
                    const inscripcion = liq.conceptos.inscripcion;

                    const origen = liq.identificacion?.origen || 'Cáceres';
                    const destino = liq.identificacion?.destino || 'Alicante';

                    return (
                      <>
                        {/* 1. MANUTENCIÓN: CALENDARIO MENSUAL DINÁMICO & CRONOGRAMA */}
                        <CalendarioDietas 
                          detalleDias={manutencion?.detalle_dias}
                          tarifaDia={manutencion?.tarifa_dia || liq.tarifas_aplicadas?.manutencion_dia || 37.70}
                          factorTotal={manutencion?.factor_total || 0}
                          importeTotal={manutencion?.importe || 0}
                        />

                        {/* 2. TRANSPORTE: ODÓMETRO & ITINERARIO VISUAL */}
                        <div className="space-y-4 pt-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Route size={16} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                  Desplazamiento e Itinerario de Viaje
                                </h4>
                                <span className="text-[11px] text-zinc-400">
                                  Orden HFP/792/2023 · Tarifa oficial: {(liq.tarifas_aplicadas?.km_vehiculo || 0.26).toFixed(2)} €/km
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-extrabold font-mono px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {(transporte?.importe || 0).toFixed(2)} €
                            </span>
                          </div>

                          {transporte?.detalle?.map((t: any, i: number) => {
                            const isCoche = t.tipo === 'vehiculo_particular' || Boolean(t.km);
                            const tarifaKm = t.tarifa_km || liq.tarifas_aplicadas?.km_vehiculo || 0.26;
                            const totalKm = t.km || 0;
                            const mitadKm = totalKm > 0 ? (totalKm / 2).toFixed(0) : 0;
                            const vehiculoDesc = [t.marca, t.modelo].filter(Boolean).join(' ') || 'Vehículo particular';
                            const matriculaDesc = t.matricula ? `[${t.matricula}]` : '';

                            if (isCoche) {
                              return (
                                <div key={i} className="p-5 rounded-3xl bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 space-y-5">
                                  
                                  {/* RUTA VISUAL INTERACTIVA */}
                                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                                      
                                      {/* Origen */}
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0">
                                          <MapPin size={18} />
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Punto de Origen</span>
                                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{origen}</span>
                                        </div>
                                      </div>

                                      {/* Trayecto Central con Odómetro */}
                                      <div className="flex-1 max-w-md w-full px-4">
                                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                                          <span>Ida ({mitadKm} km)</span>
                                          <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                            <Car size={13} /> {totalKm} km Totales
                                          </span>
                                          <span>Vuelta ({mitadKm} km)</span>
                                        </div>
                                        <div className="relative flex items-center">
                                          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                            <div className="h-full bg-zinc-900 dark:bg-zinc-100 w-full rounded-full" />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Destino */}
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                          <Navigation size={18} />
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Destino Oficial</span>
                                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{destino}</span>
                                        </div>
                                      </div>

                                    </div>
                                  </div>

                                  {/* TARJETA DEL VEHÍCULO Y CÁLCULO */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3">
                                      <Car size={20} className="text-zinc-400" />
                                      <div>
                                        <span className="text-[10px] text-zinc-400 block">Vehículo Autorizado</span>
                                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{vehiculoDesc} {matriculaDesc}</span>
                                      </div>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3">
                                      <Gauge size={20} className="text-zinc-400" />
                                      <div>
                                        <span className="text-[10px] text-zinc-400 block">Odómetro Oficial</span>
                                        <span className="font-bold font-mono text-zinc-800 dark:text-zinc-200">{totalKm} km recorridos</span>
                                      </div>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3">
                                      <Wallet size={20} className="text-emerald-500" />
                                      <div>
                                        <span className="text-[10px] text-zinc-400 block">Cálculo de Indemnización</span>
                                        <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                                          {totalKm} km × {tarifaKm.toFixed(2)} €/km = {((typeof t.importe === 'number' ? t.importe : totalKm * tarifaKm)).toFixed(2)} €
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                                    <Fuel size={13} />
                                    La indemnización por kilometraje cubre de manera exhaustiva carburante, seguros, desgaste mecánico y amortización del vehículo propio.
                                  </p>

                                </div>
                              );
                            }

                            // Transporte público (tren, avión, bus)
                            return (
                              <div key={i} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  <CreditCard size={18} className="text-zinc-400" />
                                  <div>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">{t.medio || t.tipo || 'Transporte Público'}</span>
                                    <span className="text-[11px] text-zinc-400 block">{t.itinerario || 'Billete oficial'}</span>
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                  {(t.importe_abonable || t.importe || 0).toFixed(2)} €
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* 3. ALOJAMIENTO: FICHA DE CHECK-IN Y BARRA COMPARADORA DE TOPES */}
                        <div className="space-y-4 pt-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <BedDouble size={16} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                  Hospedaje y Alojamiento Fiscalizado
                                </h4>
                                <span className="text-[11px] text-zinc-400">
                                  Tope máximo por noche: {(liq.tarifas_aplicadas?.alojamiento_max_dia || 65.97).toFixed(2)} €/noche (Grupo 2)
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-extrabold font-mono px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {(alojamiento?.importe || 0).toFixed(2)} €
                            </span>
                          </div>

                          {(!alojamiento?.detalle || alojamiento.detalle.length === 0) ? (
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 text-xs text-center text-zinc-400 italic">
                              No constan gastos de hospedaje imputados al expediente.
                            </div>
                          ) : (
                            alojamiento.detalle.map((a: any, i: number) => {
                              const importeReal = a.importe_real || 0;
                              const importeAbonable = a.importe_abonable || 0;
                              const exceso = a.exceso_no_abonable || 0;
                              const porcentajeAbonable = importeReal > 0 ? Math.min(100, (importeAbonable / importeReal) * 100) : 100;
                              const porcentajeExceso = 100 - porcentajeAbonable;

                              return (
                                <div key={i} className="p-5 rounded-3xl bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                                  
                                  {/* Encabezado del Hotel */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                                        <BedDouble size={20} />
                                      </div>
                                      <div>
                                        <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                          {a.establecimiento || 'Hotel Maya Alicante'}
                                        </h5>
                                        <span className="text-[11px] text-zinc-400">
                                          Estancia oficial: {a.noches || 2} noches ({((a.limite_aplicable || 65.97) / (a.noches || 2)).toFixed(2)} €/noche de límite)
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                                        {a.noches || 2} noches
                                      </span>
                                      {exceso > 0 && (
                                        <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold flex items-center gap-1">
                                          <ShieldAlert size={12} /> Exceso Detectado
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* BARRA COMPARATIVA GRÁFICA: SUBVENCIONADO VS EXCESO */}
                                  <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                                    <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                      <span>Distribución del Gasto de Factura ({importeReal.toFixed(2)} €)</span>
                                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        {porcentajeAbonable.toFixed(0)}% Cubierto
                                      </span>
                                    </div>

                                    {/* Barra visual dividida */}
                                    <div className="h-3.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
                                      <div 
                                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" 
                                        style={{ width: `${porcentajeAbonable}%` }}
                                        title={`Subvencionado: ${importeAbonable.toFixed(2)} €`}
                                      />
                                      {porcentajeExceso > 0 && (
                                        <div 
                                          className="h-full bg-amber-500/80 rounded-r-full transition-all duration-500" 
                                          style={{ width: `${porcentajeExceso}%` }}
                                          title={`Exceso no imputable: ${exceso.toFixed(2)} €`}
                                        />
                                      )}
                                    </div>

                                    {/* Leyenda de la barra */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                                      <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                          Límite Abonable UEx
                                        </div>
                                        <span className="text-sm font-extrabold font-mono text-emerald-800 dark:text-emerald-200 mt-0.5 block">
                                          {importeAbonable.toFixed(2)} €
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase">
                                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                                          Exceso no Imputable
                                        </div>
                                        <span className="text-sm font-extrabold font-mono text-amber-800 dark:text-amber-200 mt-0.5 block">
                                          -{exceso.toFixed(2)} €
                                        </span>
                                      </div>

                                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase">
                                          <FileText size={11} />
                                          Total Factura Presentada
                                        </div>
                                        <span className="text-sm font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                                          {importeReal.toFixed(2)} €
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* 4. INSCRIPCIÓN / CUOTAS DE CONGRESO */}
                        {inscripcion && (
                          <div className="p-5 rounded-3xl bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 shrink-0">
                                <Building2 size={20} />
                              </div>
                              <div>
                                <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                  Inscripción al Congreso / Seminario
                                </h5>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {inscripcion.pagada_por === 'tarjeta_institucional' 
                                    ? 'Abonada previamente con Tarjeta Institucional (justificada contablemente, no reintegrable)'
                                    : 'Abonada por el investigador'}
                                </span>
                              </div>
                            </div>
                            <span className="text-base font-extrabold font-mono px-4 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                              {(inscripcion.importe_total || inscripcion.importe || 0).toFixed(2)} €
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="text-center py-8 text-zinc-400 text-xs">No hay desglose disponible para este trámite.</div>
                  )}
                </div>
              )}

              {/* TAB 2: FUNDAMENTACIÓN JURÍDICO-TRIBUTARIA */}
              {activeTab === 'fundamentacion' && (
                <div className="space-y-6 animate-fade-in text-xs leading-relaxed">
                  <div className="p-6 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                      <Scale size={18} className="text-zinc-700 dark:text-zinc-300" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Fundamento Jurídico-Tributario de la Liquidación
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">
                              Régimen de Exención de IRPF (0,00 €)
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                              Conforme al <strong>Artículo 9 del Reglamento del IRPF (RD 439/2007)</strong> y el <strong>Real Decreto 462/2002</strong> sobre indemnizaciones por razón del servicio, las asignaciones para gastos de manutención (37,70 €/día) y kilometraje (0,26 €/km) devengadas en este expediente se encuentran <strong>íntegramente dentro de los límites exentos de tributación</strong>. Por tanto, no procede aplicar retención a cuenta del IRPF sobre el importe devengado.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <FileCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">
                              Compensación por Uso de Vehículo Particular
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                              La compensación de <strong>0,26 €/km</strong> (Orden HFP/792/2023) cubre de forma íntegra los gastos de combustible, desgaste mecánico, amortización y seguro del vehículo. No procede el reembolso adicional de tickets de repostaje al quedar absorbidos por la indemnización de kilometraje.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">
                              Aplicación de Topes Máximos de Alojamiento
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                              De acuerdo con la normativa del Plan Estatal, el importe máximo liquidable por noche de hotel en territorio nacional es de <strong>65,97 €</strong> (Grupo 2). Las cantidades que excedan dicho umbral (en este caso, 73,72 €) quedan excluidas de la liquidación oficial con cargo a los fondos públicos del proyecto.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Building2 size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">
                              Destino y Fiscalización del Expediente
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                              Expediente fiscalizado para su remisión al <strong>Servicio de Gestión y Transferencia de Resultados de la Investigación (SGTRI)</strong> y tramitación de la orden de transferencia bancaria a la cuenta IBAN acreditada del investigador.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ESQUEMA JSON */}
              {activeTab === 'json' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setJsonTab('liquidacion')}
                        className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer", jsonTab === 'liquidacion' ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400")}
                      >
                        Liquidación Normativa (JSON)
                      </button>
                      <button
                        onClick={() => setJsonTab('extraccion')}
                        className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer", jsonTab === 'extraccion' ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400")}
                      >
                        Extracción Semántica (JSON)
                      </button>
                    </div>

                    <Btn size="sm" variant="outline" onClick={() => copyJsonToClipboard(jsonTab === 'liquidacion' ? result.liquidacion : result.extraccion)} className="cursor-pointer">
                      <Copy size={13} className="mr-1" />
                      {copied ? '¡Copiado!' : 'Copiar JSON'}
                    </Btn>
                  </div>

                  <pre className="p-5 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto max-h-[500px] border border-zinc-800 shadow-inner leading-relaxed">
                    {JSON.stringify(jsonTab === 'liquidacion' ? result.liquidacion : result.extraccion, null, 2)}
                  </pre>
                </div>
              )}

              {/* TAB 4: AUDITORÍA Y TRAZABILIDAD */}
              {activeTab === 'auditoria' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Terminal size={14} className="text-zinc-400" />
                      Registro de Ejecución y Trazabilidad de Nodos
                    </h4>
                  </div>
                  <pre className="p-5 rounded-2xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px] border border-zinc-800 shadow-inner whitespace-pre-wrap leading-relaxed">
                    {result.logs || 'No hay logs de auditoría disponibles.'}
                  </pre>
                </div>
              )}

              {/* TAB 5: GRAFO */}
              {activeTab === 'grafo' && (
                <div className="animate-fade-in">
                  <ViewGrafo />
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* MODAL DE INFORMACIÓN Y VISTA PREVIA DE LA PLANTILLA OFICIAL (GRAN FORMATO) */}
      {previewTemplateModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
          onClick={() => setPreviewTemplateModal(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-6xl w-full shadow-2xl space-y-4 animate-pop max-h-[95vh] h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                  {previewTemplateModal.badge || 'Modelo Oficial'}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {previewTemplateModal.titulo}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Sede Electrónica — Universidad de Extremadura
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewTemplateModal.img && (
                  <a 
                    href={previewTemplateModal.img} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <ZoomIn size={14} /> 
                    <span className="hidden sm:inline">Nueva Pestaña</span>
                  </a>
                )}
                <button 
                  onClick={() => setPreviewTemplateModal(null)} 
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Cuerpo del Modal: Visor de Gran Formato con Panel Lateral */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
              
              {/* Visor de Documento Principal (Columna Grande) */}
              <div className="lg:col-span-8 flex flex-col min-h-0 bg-zinc-100/80 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-inner">
                <div className="px-4 py-2 bg-zinc-200/60 dark:bg-zinc-900/60 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 shrink-0">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileCheck size={14} className="text-zinc-400" />
                    Documento Oficial Normalizado
                  </span>
                  <span className="text-[11px] font-mono">Formato Impreso A4</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex items-center justify-center bg-zinc-200/30 dark:bg-zinc-950/50">
                  {previewTemplateModal.img ? (
                    <img 
                      src={previewTemplateModal.img} 
                      alt={previewTemplateModal.titulo} 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-xl border border-zinc-200/80 dark:border-zinc-800 bg-white" 
                    />
                  ) : (
                    <div className="text-zinc-400 text-xs">No hay imagen disponible para esta plantilla</div>
                  )}
                </div>
              </div>

              {/* Panel Lateral de Información y Metadatos */}
              <div className="lg:col-span-4 flex flex-col justify-between overflow-y-auto space-y-4 pr-1">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Descripción del Trámite
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {previewTemplateModal.desc}
                    </p>
                  </div>

                  {(previewTemplateModal as any).normativa && (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                        Marco Normativo y Legal
                      </span>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                        {(previewTemplateModal as any).normativa}
                      </p>
                    </div>
                  )}

                  {(previewTemplateModal as any).organismo && (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                        Órgano Tramitador y Destino
                      </span>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                        {(previewTemplateModal as any).organismo}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col gap-2 shrink-0">
                  <Btn 
                    size="md" 
                    variant="primary" 
                    onClick={() => {
                      setSelectedTemplate(previewTemplateModal.id);
                      setPreviewTemplateModal(null);
                    }}
                    className="w-full cursor-pointer shadow-md"
                  >
                    Usar este Procedimiento
                  </Btn>
                  <Btn 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setPreviewTemplateModal(null)} 
                    className="w-full cursor-pointer"
                  >
                    Cerrar
                  </Btn>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
