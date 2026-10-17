import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronRight, ArrowRight, Play, Loader2, AlertTriangle, CheckCircle, RefreshCw, UploadCloud, X, Trash2,
  ChevronLeft, RotateCcw, Check, Eye, CheckCircle2, FileText, FolderOpen, Printer, Info, ShieldCheck,
  Scale, FileCheck, Building2, HelpCircle, ExternalLink, Copy, Terminal, ChevronDown, ChevronUp, ZoomIn,
  Calendar, Car, BedDouble, MapPin, Navigation, Gauge, Fuel, CreditCard, Clock, Sparkles, Route, ArrowRightLeft,
  ShieldAlert, Wallet, CalendarDays, Compass, Receipt, Calculator, ArrowDownRight, ArrowUpRight,
  ArrowLeft, Table, Layers, Filter, Landmark, Utensils, Code2, GitFork, Download
} from 'lucide-react';
import { ViewGrafo } from './ViewGrafo';
import { cn, pollTask, fmtEur } from '../../lib/utils';
import { TEMPLATES } from '../../lib/data';
import type { CasoResult } from '../../lib/types';
import { Btn } from '../ui/Btn';
import { StatusBadge } from '../ui/Badges';
import { AlertErr, RunningInfo } from '../ui/Alerts';
import { LogViewer } from '../ui/LogViewer';

// =========================================================================
// COMPONENTE: CÓMPUTO Y FISCALIZACIÓN DE DIETAS DE MANUTENCIÓN (R.D. 462/2002)
// =========================================================================
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
  const [selectedDay, setSelectedDay] = useState<string | null>(detalleDias?.[0]?.dia || null);
  const [vistaModo, setVistaModo] = useState<'calendario' | 'tabla'>('calendario');

  // Mapeo de días de la comisión
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
  const month = firstDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const monthName = monthNames[month];

  const { startDayOffset, totalDaysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDayOffset = (firstDay.getDay() + 6) % 7; // Lunes=0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    return { startDayOffset, totalDaysInMonth };
  }, [year, month]);

  const weekDayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    return daysMap.get(selectedDay) || null;
  }, [selectedDay, daysMap]);

  return (
    <div className="space-y-4 font-sans">
      {/* Encabezado Institucional y Selector de Vista (Calendario vs Tabla) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0">
            <CalendarDays size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight">
              Cómputo de Dietas y Manutención
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                {monthName} {year}
              </span>
            </h4>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              R.D. 462/2002 Grupo 2 · Tarifa regulada: {tarifaDia.toFixed(2)} €/día completo · {factorTotal.toFixed(1)} jornadas imputadas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Selector de Vista: Calendario vs Tabla */}
          <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setVistaModo('calendario')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                vistaModo === 'calendario'
                  ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Calendar size={13} />
              Calendario
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('tabla')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                vistaModo === 'tabla'
                  ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Table size={13} />
              Cuadro Oficial
            </button>
          </div>

          <div className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {importeTotal.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* VISTA 1: CALENDARIO MENSUAL + INSPECTOR */}
      {vistaModo === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Cuadrícula del Calendario Mensual (8 cols) */}
          <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono">
                {monthName} {year}
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 dark:bg-slate-500" /> Salida (100%)
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#176B52] dark:bg-emerald-500" /> Estancia (100%)
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 dark:bg-amber-400" /> Regreso (50%)
                </span>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-zinc-400 dark:text-zinc-500 pb-1">
              {weekDayHeaders.map((d, idx) => (
                <div key={idx} className="py-1">{d}</div>
              ))}
            </div>

            {/* Celdas del mes */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startDayOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-16 rounded-xl bg-transparent" />
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
                        "h-16 rounded-xl p-2 flex flex-col justify-between transition-all duration-150 cursor-pointer text-left border relative group shadow-2xs",
                        isSalida && "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-400",
                        isRegreso && "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/40 hover:border-amber-400",
                        !isSalida && !isRegreso && "bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400",
                        isSelected && "ring-2 ring-[#176B52] dark:ring-emerald-400 shadow-sm z-10"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono font-bold text-xs text-zinc-800 dark:text-zinc-100">
                          {dayNum}
                        </span>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          isSalida && "bg-slate-400 dark:bg-slate-500",
                          isRegreso && "bg-amber-500 dark:bg-amber-400",
                          !isSalida && !isRegreso && "bg-[#176B52] dark:bg-emerald-500"
                        )} />
                      </div>
                      
                      <div className="w-full">
                        <span className="text-[10px] font-medium block truncate text-zinc-500 dark:text-zinc-400">
                          {isSalida ? 'Salida' : isRegreso ? 'Retorno (50%)' : 'Estancia'}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 block">
                          {tripDay.importe.toFixed(2)} €
                        </span>
                      </div>
                    </button>
                  );
                }

                // Días fuera de comisión
                return (
                  <div
                    key={dateKey}
                    className="h-16 rounded-xl p-2 flex flex-col justify-start bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800/50 text-zinc-300 dark:text-zinc-700 select-none"
                  >
                    <span className="font-mono text-xs font-normal">{dayNum}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel Lateral de Detalle del Día Inspeccionado (4 cols) */}
          <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-xs space-y-4">
            {selectedDayInfo ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Jornada Auditada
                    </span>
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {selectedDayInfo.diaStr}
                    </h5>
                  </div>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-lg font-bold font-mono border",
                    selectedDayInfo.tipo === 'salida' && "bg-slate-50 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200 border-slate-200 dark:border-slate-700",
                    selectedDayInfo.tipo === 'regreso' && "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border-amber-200 dark:border-amber-800",
                    selectedDayInfo.tipo !== 'salida' && selectedDayInfo.tipo !== 'regreso' && "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                  )}>
                    {selectedDayInfo.factor * 100}% Manutención
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Concepto Computado</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {selectedDayInfo.tipo === 'salida' ? 'Jornada de Salida y Desplazamiento de Ida' : selectedDayInfo.tipo === 'regreso' ? 'Jornada de Retorno a Residencia Oficial' : 'Estancia Oficial en Comisión de Servicio'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Fórmula de Liquidación Económica</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedDayInfo.factor.toFixed(1)}x × {tarifaDia.toFixed(2)} €/día = {selectedDayInfo.importe.toFixed(2)} €
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Régimen Jurídico y Tributario</span>
                    <span className="text-zinc-600 dark:text-zinc-400 text-xs leading-snug block">
                      Art. 12 R.D. 462/2002. Renta 100% exenta de retención a cuenta del IRPF (Art. 9 RIRPF).
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 text-xs">
                Seleccione un día en el calendario para consultar su justificación fiscal.
              </div>
            )}

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Total Manutención Liquidada:</span>
              <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {importeTotal.toFixed(2)} €
              </span>
            </div>
          </div>

        </div>
      )}

      {/* VISTA 2: CUADRO OFICIAL DE JORNADAS (TABLA ADMINISTRATIVA) */}
      {vistaModo === 'tabla' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Tipo de Jornada</th>
                  <th className="py-3 px-4">Cómputo Horario</th>
                  <th className="py-3 px-4 text-center">Coeficiente</th>
                  <th className="py-3 px-4 text-right">Tarifa Diaria</th>
                  <th className="py-3 px-4 text-right">Importe Reconocido</th>
                  <th className="py-3 px-4">Fundamento Normativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {detalleDias?.map((d, idx) => {
                  const factor = typeof d.factor === 'number' ? d.factor : (d.tipo === 'regreso' ? 0.5 : 1.0);
                  const importe = typeof d.importe === 'number' ? d.importe : factor * tarifaDia;
                  const isSalida = d.tipo === 'salida';
                  const isRegreso = d.tipo === 'regreso';

                  return (
                    <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {d.dia}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {isSalida ? 'Jornada de Salida' : isRegreso ? 'Jornada de Retorno' : 'Estancia en Destino'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                        {isSalida ? 'Salida anterior a las 14:00h' : isRegreso ? 'Llegada posterior a las 14:00h' : 'Jornada completa de comisión'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded font-mono font-bold text-[11px]",
                          factor === 1 ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        )}>
                          {(factor * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        {tarifaDia.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {importe.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                        R.D. 462/2002 Art. 12 (Exento IRPF)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 font-bold">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                    Total Dietas de Manutención Computadas:
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-zinc-900 dark:text-zinc-100">
                    {factorTotal.toFixed(1)} jornadas
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-500 text-[11px]">
                    Tarifa Oficial Grupo 2
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-[#176B52] dark:text-[#86EFAC]">
                    {importeTotal.toFixed(2)} €
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-[10px] uppercase">
                    Liquidado al 100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// VISTA PRINCIPAL
// =========================================================================
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
  const [filtroConcepto, setFiltroConcepto] = useState<'todos' | 'manutencion' | 'transporte' | 'alojamiento' | 'inscripcion'>('todos');
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
    setFiltroConcepto('todos');
  };

  const copyJsonToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cálculos consolidados para reconciliación financiera
  const balanceFinanciero = useMemo(() => {
    if (!result || !result.liquidacion || !(result.liquidacion as any).conceptos) return null;
    const liq = result.liquidacion as any;
    const fuente = liq.identificacion?.fuente_financiacion || 'plan_estatal';
    const esJunta = fuente === 'extremadura';
    const man = liq.conceptos.manutencion?.importe || 0;
    const tra = liq.conceptos.transporte?.importe || 0;
    const aloAbonable = liq.conceptos.alojamiento?.importe || 0;
    const aloReal = liq.conceptos.alojamiento?.importe_real_total || aloAbonable;
    const aloExceso = Math.max(0, aloReal - aloAbonable);
    const insTotal = liq.conceptos.inscripcion?.importe_total || liq.conceptos.inscripcion?.importe || 0;
    const insPagadaPor = liq.conceptos.inscripcion?.pagada_por || 'tarjeta_investigador';
    const insEsTarjetaInst = insPagadaPor === 'tarjeta_institucional' || liq.conceptos.inscripcion?.reembolsable_al_investigador === false;
    const irpfRetencion = liq.resumen_economico?.retencion_irpf || liq.irpf?.retencion || 0;
    const irpfBase = liq.irpf?.base_sujeta || 0;

    // Gasto bruto total justificado
    const gastoTotalMision = man + tra + aloReal + insTotal;
    // Total líquido que se paga al investigador
    const liquidoTransferir = result.liquido_ag || (liq.resumen_economico?.liquido_a_abonar ?? (man + tra + aloAbonable - irpfRetencion));

    return {
      fuente,
      esJunta,
      man,
      tra,
      aloReal,
      aloAbonable,
      aloExceso,
      insTotal,
      insEsTarjetaInst,
      irpfRetencion,
      irpfBase,
      gastoTotalMision,
      liquidoTransferir
    };
  }, [result]);

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
    <div className="space-y-6 animate-fade-in max-w-[90vw] mx-auto pb-16 font-sans">

      {/* Cabecera del Proceso */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onVolver}
            className="p-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
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
          <Btn size="sm" variant="outline" onClick={reiniciarTramite} className="flex items-center gap-1.5 shadow-xs cursor-pointer rounded-2xl">
            <RotateCcw size={14} />
            Nueva Liquidación
          </Btn>
        )}
      </div>

      {/* STEPPER DINÁMICO */}
      {!result && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 shadow-sm">
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          
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
                          ? "border-zinc-900 dark:border-zinc-100 bg-[#FAF9F7] dark:bg-zinc-800/40 shadow-xs" 
                          : "border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold border border-zinc-200/60 dark:border-zinc-700/60">
                            {t.badge || 'Oficial'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewTemplateModal(t); }}
                            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
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

              {/* Selector Desplegable de Casos */}
              {casosFiltrados.length > 0 && (
                <div className="bg-[#FAF9F7] dark:bg-zinc-950/70 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden transition-all">
                  <div
                    onClick={() => setShowExpedientes(prev => !prev)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen size={16} className="text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Expedientes Registrados en el Servidor
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-bold">
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
                                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs"
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
                    ? "border-zinc-900 dark:border-zinc-100 bg-[#FAF9F7] dark:bg-zinc-800/40" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-[#FAF8F5]/40 dark:bg-zinc-950/30"
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

          {/* PASO 3: RÉGIMEN NORMATIVO */}
          {currentStep === 3 && isDietas && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">3. Marco Normativo y Fuente de Financiación</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  El sistema detectará automáticamente la fuente según los documentos, pero puede fijarla manualmente si lo desea.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  { id: '', title: 'Detección Automática (IA)', tag: 'IA Auto', desc: 'El agente identifica la fuente oficial mediante los logos y el proyecto.', badge: 'Auto' },
                  { id: 'PEI', title: 'Plan Estatal de Investigación', tag: 'RD 462/2002', desc: 'Dietas estatales (37,70 €/día, 65,97 €/noche, 0,26 €/km). 100% Exento de IRPF.', badge: 'Estatal' },
                  { id: 'G24', title: 'Ayudas a grupos o proyectos GR24/IB24', tag: 'Decreto 42/2025', desc: 'Dietas autonómicas (60,00 €/día, 120,00 €/noche, 0,26 €/km). Aplica 15% IRPF sobre exceso.', badge: 'Junta' },
                  { id: 'JEX', title: 'Otros proyectos Decreto 42/2025', tag: 'Decreto 42/2025', desc: 'Proyectos autonómicos Junta de Extremadura (60,00 €/día, 120,00 €/noche). IRPF 15%.', badge: 'Junta' },
                  { id: 'UEX', title: 'Contratos y convenios UEx', tag: 'RD 462/2002', desc: 'Contratos Art. 60 / OTRI y convenios de colaboración suscritos por la UEx.', badge: 'UEx' },
                  { id: 'PCO', title: 'Planes Complementarios', tag: 'RD 462/2002', desc: 'Proyectos cofinanciados mediante Planes Complementarios de I+D+i.', badge: 'Estatal' },
                  { id: 'NAL', title: 'Otros proyectos R.D. 462/2002', tag: 'RD 462/2002', desc: 'Otros proyectos sujetos al régimen general de indemnizaciones del Estado.', badge: 'Estatal' }
                ].map((m: { id: string; title: string; tag: string; desc: string; badge: string }) => {
                  const isSel = tipoProyecto === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setTipoProyecto(m.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between",
                        isSel 
                          ? "border-zinc-900 dark:border-zinc-100 bg-[#FAF9F7] dark:bg-zinc-800/50 shadow-xs" 
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{m.title}</h4>
                          <span className={cn(
                            "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase",
                            m.badge === 'Junta' ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                            m.badge === 'Estatal' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" :
                            m.badge === 'UEx' ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" :
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          )}>
                            {m.tag}
                          </span>
                        </div>
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

              <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
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
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Google Gemini 2.5 Flash / Groq LPU (1M tokens)</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Btn 
                  size="lg" 
                  variant="primary" 
                  disabled={running || !tieneFicheroOExpediente} 
                  onClick={ejecutar}
                  className="w-full sm:w-auto px-8 shadow-md cursor-pointer rounded-2xl"
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

          {/* BOTONES DE NAVEGACIÓN */}
          <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <Btn size="sm" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={running} className="cursor-pointer rounded-2xl">
                <ChevronLeft size={16} className="mr-1" /> Anterior
              </Btn>
            ) : <div />}

            {currentStep < totalSteps && (
              <Btn 
                size="sm" 
                variant="primary" 
                onClick={() => setCurrentStep(prev => prev + 1)} 
                disabled={currentStep === 2 && !tieneFicheroOExpediente}
                className="cursor-pointer rounded-2xl"
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
      {/* VISTA OFICIAL DE RESULTADOS */}
      {/* ========================================================================= */}
      {result && (
        <div ref={resultRef} className="space-y-6 animate-fade-in-up">

          {/* 1. HERO BANNER PRINCIPAL CON DICTAMEN OFICIAL */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Dictamen de Liquidación</span>
                  <StatusBadge ok={result.ok} sinGt={result.sin_ground_truth} />
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-[#FAF8F5] dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-[#ECE7DD] dark:border-zinc-700/60">
                    {result.liquidacion && (result.liquidacion as any).identificacion?.fuente_financiacion === 'extremadura' 
                      ? 'Normativa Junta de Extremadura (Decreto 42/2025)' 
                      : 'Normativa Plan Estatal / UEx (RD 462/2002)'}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                  Expediente: {result.caso_id}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                <button 
                  type="button"
                  onClick={() => window.open(`/api/txt/generar/${result.caso_id}?template=${selectedTemplate}`, '_blank')} 
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <FileText size={15} />
                  Memoria Justificativa (TXT)
                </button>
                <button 
                  type="button"
                  onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=${selectedTemplate}`, '_blank')} 
                  className="px-4 py-2.5 rounded-xl bg-[#0b1528] hover:bg-[#152342] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download size={15} />
                  Descargar PDF Oficial UEx
                </button>
              </div>
            </div>

            {/* TARJETAS DE IMPORTES CLAVE (RECONCILIACIÓN DEL GASTO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              
              {/* CARD 1: Coste Total de la Misión */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 flex items-center gap-4 shadow-2xs">
                <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500 dark:text-zinc-400">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block truncate">
                    Coste Total de la Misión
                  </span>
                  <p className="text-2xl font-black font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {fmtEur(balanceFinanciero ? balanceFinanciero.gastoTotalMision : result.liquido_ag)}
                  </p>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block truncate mt-0.5">
                    Suma de todas las facturas y tickets
                  </span>
                </div>
              </div>

              {/* CARD 2: Tarjeta Institucional UEx */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center gap-4 shadow-2xs">
                <div className="w-11 h-11 rounded-full bg-blue-100/70 dark:bg-blue-900/40 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                  <CreditCard size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block truncate">
                    Tarjeta Institucional UEx
                  </span>
                  <p className="text-2xl font-black font-mono text-blue-800 dark:text-blue-300 tracking-tight">
                    {(balanceFinanciero?.insTotal || 0) > 0 ? `-${fmtEur(balanceFinanciero?.insTotal || 0)}` : '0,00 €'}
                  </p>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block truncate mt-0.5">
                    Inscripción pagada por UEx (no transferible)
                  </span>
                </div>
              </div>

              {/* CARD 3: Retención IRPF / Exceso Hotel */}
              {balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-center gap-4 shadow-2xs">
                  <div className="w-11 h-11 rounded-full bg-amber-100/70 dark:bg-amber-900/40 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                    <Scale size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block truncate">
                      Retención IRPF (15%)
                    </span>
                    <p className="text-2xl font-black font-mono text-amber-900 dark:text-amber-300 tracking-tight">
                      -{fmtEur(balanceFinanciero.irpfRetencion)}
                    </p>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block truncate mt-0.5">
                      Sobre exceso de topes estatales (Base: {fmtEur(balanceFinanciero.irpfBase)})
                    </span>
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "p-4 sm:p-5 rounded-2xl border flex items-center gap-4 shadow-2xs",
                  balanceFinanciero && balanceFinanciero.aloExceso > 0
                    ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
                    : "bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
                )}>
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
                    balanceFinanciero && balanceFinanciero.aloExceso > 0
                      ? "bg-amber-100/70 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {balanceFinanciero && balanceFinanciero.aloExceso > 0 ? (
                      <ShieldAlert size={18} />
                    ) : (
                      <ShieldCheck size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className={cn(
                      "text-[11px] font-bold uppercase tracking-wider block truncate",
                      balanceFinanciero && balanceFinanciero.aloExceso > 0
                        ? "text-amber-800 dark:text-amber-400"
                        : "text-emerald-700 dark:text-emerald-400"
                    )}>
                      {balanceFinanciero && balanceFinanciero.aloExceso > 0 ? 'Exceso Hotel Excluido' : 'Retención IRPF'}
                    </span>
                    <p className={cn(
                      "text-2xl font-black font-mono tracking-tight",
                      balanceFinanciero && balanceFinanciero.aloExceso > 0
                        ? "text-amber-900 dark:text-amber-300"
                        : "text-emerald-800 dark:text-emerald-300"
                    )}>
                      {balanceFinanciero && balanceFinanciero.aloExceso > 0
                        ? `-${fmtEur(balanceFinanciero.aloExceso)}`
                        : '0,00 €'}
                    </p>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block truncate mt-0.5">
                      {balanceFinanciero && balanceFinanciero.aloExceso > 0
                        ? 'Supera límite de 65,97 €/noche'
                        : '100% Exento (RD 462/2002 · Art. 9 RIRPF)'}
                    </span>
                  </div>
                </div>
              )}

              {/* CARD 4: Líquido a Transferir */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-4 shadow-2xs">
                <div className="w-11 h-11 rounded-full bg-emerald-100/70 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                  <Landmark size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block truncate">
                    Líquido a Transferir
                  </span>
                  <p className="text-2xl font-black font-mono text-emerald-800 dark:text-emerald-300 tracking-tight">
                    {fmtEur(result.liquido_ag)}
                  </p>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block truncate mt-0.5">
                    Abono en cuenta bancaria (IBAN)
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 2. PESTAÑAS Y CONTENIDO DETALLADO */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* SIDEBAR VERTICAL DE PESTAÑAS */}
              <div className="w-full lg:w-64 shrink-0 flex flex-col space-y-1">
                {[
                  { id: 'desglose', label: 'Desglose Oficial de Liquidación', icon: Layers },
                  { id: 'balance', label: 'Balance y Reconciliación de Gastos', icon: FileText },
                  { id: 'fundamentacion', label: 'Régimen Fiscal y Fundamento Jurídico', icon: Scale },
                  { id: 'json', label: 'Esquema JSON', icon: Code2 },
                  { id: 'auditoria', label: 'Auditoría y Trazabilidad', icon: Clock },
                  { id: 'grafo', label: 'Grafo de Ejecución', icon: GitFork }
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3.5 py-3 text-xs text-left transition-all cursor-pointer border-l-4",
                        isActive
                          ? "border-blue-600 bg-blue-50/80 text-blue-700 font-bold dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500 rounded-r-xl"
                          : "border-transparent text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-xl"
                      )}
                    >
                      <Icon 
                        size={17} 
                        className={isActive ? "text-blue-600 dark:text-blue-400 shrink-0" : "text-zinc-400 dark:text-zinc-500 shrink-0"} 
                      />
                      <span className="leading-snug">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* PANEL PRINCIPAL DE CONTENIDO */}
              <div className="flex-1 min-w-0 w-full space-y-6">
                
                {/* Título de la sección activa */}
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {activeTab === 'desglose' && 'Desglose Oficial de Liquidación'}
                  {activeTab === 'balance' && 'Balance y Reconciliación de Gastos'}
                  {activeTab === 'fundamentacion' && 'Régimen Fiscal y Fundamento Jurídico'}
                  {activeTab === 'json' && 'Esquema JSON'}
                  {activeTab === 'auditoria' && 'Auditoría y Trazabilidad'}
                  {activeTab === 'grafo' && 'Grafo de Ejecución'}
                </h3>
              
              {/* =============================================================== */}
              {/* TAB 1: DESGLOSE OFICIAL DE LIQUIDACIÓN CON FILTRO POR CONCEPTO */}
              {/* =============================================================== */}
              {activeTab === 'desglose' && (
                <div className="space-y-6 animate-fade-in">
                  {result.liquidacion && (result.liquidacion as any).conceptos ? (() => {
                    const liq = result.liquidacion as any;
                    const manutencion = liq.conceptos.manutencion;
                    const transporte = liq.conceptos.transporte;
                    const alojamiento = liq.conceptos.alojamiento;
                    const inscripcion = liq.conceptos.inscripcion;

                    const origen = liq.identificacion?.origen || 'Cáceres';
                    const destino = liq.identificacion?.destino || 'Alicante';

                    const showManutencion = filtroConcepto === 'todos' || filtroConcepto === 'manutencion';
                    const showTransporte = filtroConcepto === 'todos' || filtroConcepto === 'transporte';
                    const showAlojamiento = filtroConcepto === 'todos' || filtroConcepto === 'alojamiento';
                    const showInscripcion = Boolean(inscripcion) && (filtroConcepto === 'todos' || filtroConcepto === 'inscripcion');

                    const totalKm = transporte?.detalle?.[0]?.km || 0;
                    const mitadKm = totalKm > 0 ? (totalKm / 2).toFixed(0) : 0;
                    const tarifaKm = transporte?.detalle?.[0]?.tarifa_km || liq.tarifas_aplicadas?.km_vehiculo || 0.26;
                    const vehiculoDesc = [transporte?.detalle?.[0]?.marca, transporte?.detalle?.[0]?.modelo].filter(Boolean).join(' ') || 'Vehículo particular';
                    const matriculaDesc = transporte?.detalle?.[0]?.matricula ? `[${transporte.detalle[0].matricula}]` : '';

                    return (
                      <div className="space-y-6">
                        {/* 1. PARTIDAS Y CONCEPTOS DE LA COMISIÓN (SELECTOR INTERACTIVO) */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 space-y-4 shadow-2xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                Partidas y Conceptos de la Comisión
                              </h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                {result.liquidacion && (result.liquidacion as any).identificacion?.fuente_financiacion === 'extremadura'
                                  ? 'Decreto 42/2025'
                                  : 'R.D. 462/2002'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Seleccione la partida que desee examinar individualmente o consulte el resumen contable consolidado.
                            </p>
                          </div>

                          {/* Fila de 5 Tarjetas de Conceptos */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 pt-1">
                            
                            {/* 1. Resumen Global */}
                            <button
                              type="button"
                              onClick={() => setFiltroConcepto('todos')}
                              className={cn(
                                "p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer",
                                filtroConcepto === 'todos'
                                  ? "border-blue-600 bg-blue-50/50 text-blue-900 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-600 shadow-2xs"
                                  : "border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Layers size={18} className={filtroConcepto === 'todos' ? "text-blue-600 shrink-0" : "text-zinc-500 shrink-0"} />
                                <div className="truncate">
                                  <div className="text-xs font-semibold leading-tight truncate">Resumen Global</div>
                                  <div className={cn(
                                    "text-sm font-mono font-bold mt-0.5",
                                    filtroConcepto === 'todos' ? "text-blue-700 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
                                  )}>
                                    {fmtEur(result.liquido_ag || 0)}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={15} className={cn("shrink-0 ml-1.5", filtroConcepto === 'todos' ? "text-blue-600" : "text-zinc-400")} />
                            </button>

                            {/* 2. Manutención */}
                            <button
                              type="button"
                              onClick={() => setFiltroConcepto('manutencion')}
                              className={cn(
                                "p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer",
                                filtroConcepto === 'manutencion'
                                  ? "border-blue-600 bg-blue-50/50 text-blue-900 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-600 shadow-2xs"
                                  : "border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Utensils size={18} className={filtroConcepto === 'manutencion' ? "text-blue-600 shrink-0" : "text-zinc-500 shrink-0"} />
                                <div className="truncate">
                                  <div className="text-xs font-semibold leading-tight truncate">Manutención</div>
                                  <div className={cn(
                                    "text-sm font-mono font-bold mt-0.5",
                                    filtroConcepto === 'manutencion' ? "text-blue-700 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
                                  )}>
                                    {fmtEur(manutencion?.importe || 0)}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={15} className={cn("shrink-0 ml-1.5", filtroConcepto === 'manutencion' ? "text-blue-600" : "text-zinc-400")} />
                            </button>

                            {/* 3. Transporte */}
                            <button
                              type="button"
                              onClick={() => setFiltroConcepto('transporte')}
                              className={cn(
                                "p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer",
                                filtroConcepto === 'transporte'
                                  ? "border-blue-600 bg-blue-50/50 text-blue-900 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-600 shadow-2xs"
                                  : "border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Car size={18} className={filtroConcepto === 'transporte' ? "text-blue-600 shrink-0" : "text-zinc-500 shrink-0"} />
                                <div className="truncate">
                                  <div className="text-xs font-semibold leading-tight truncate">Transporte</div>
                                  <div className={cn(
                                    "text-sm font-mono font-bold mt-0.5",
                                    filtroConcepto === 'transporte' ? "text-blue-700 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
                                  )}>
                                    {fmtEur(transporte?.importe || 0)}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={15} className={cn("shrink-0 ml-1.5", filtroConcepto === 'transporte' ? "text-blue-600" : "text-zinc-400")} />
                            </button>

                            {/* 4. Alojamiento */}
                            <button
                              type="button"
                              onClick={() => setFiltroConcepto('alojamiento')}
                              className={cn(
                                "p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer",
                                filtroConcepto === 'alojamiento'
                                  ? "border-blue-600 bg-blue-50/50 text-blue-900 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-600 shadow-2xs"
                                  : "border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <BedDouble size={18} className={filtroConcepto === 'alojamiento' ? "text-blue-600 shrink-0" : "text-zinc-500 shrink-0"} />
                                <div className="truncate">
                                  <div className="text-xs font-semibold leading-tight truncate">Alojamiento</div>
                                  <div className={cn(
                                    "text-sm font-mono font-bold mt-0.5",
                                    filtroConcepto === 'alojamiento' ? "text-blue-700 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
                                  )}>
                                    {fmtEur(alojamiento?.importe || 0)}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={15} className={cn("shrink-0 ml-1.5", filtroConcepto === 'alojamiento' ? "text-blue-600" : "text-zinc-400")} />
                            </button>

                            {/* 5. Inscripción */}
                            <button
                              type="button"
                              onClick={() => setFiltroConcepto('inscripcion')}
                              className={cn(
                                "p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer",
                                filtroConcepto === 'inscripcion'
                                  ? "border-blue-600 bg-blue-50/50 text-blue-900 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-600 shadow-2xs"
                                  : "border-zinc-200/90 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText size={18} className={filtroConcepto === 'inscripcion' ? "text-blue-600 shrink-0" : "text-zinc-500 shrink-0"} />
                                <div className="truncate">
                                  <div className="text-xs font-semibold leading-tight truncate">Inscripción</div>
                                  <div className={cn(
                                    "text-sm font-mono font-bold mt-0.5",
                                    filtroConcepto === 'inscripcion' ? "text-blue-700 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
                                  )}>
                                    {fmtEur(inscripcion ? (inscripcion.reembolsable_al_investigador ? inscripcion.importe_reembolsable : 0) : 0)}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={15} className={cn("shrink-0 ml-1.5", filtroConcepto === 'inscripcion' ? "text-blue-600" : "text-zinc-400")} />
                            </button>

                          </div>
                        </div>

                        {/* 2. CUADRO RESUMEN CONTABLE CONSOLIDADO (VISIBLE EN 'TODOS') */}
                        {filtroConcepto === 'todos' && (
                          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
                            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                  Cuadro Resumen de Liquidación Económica
                                </h4>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  Reconciliación contable por conceptos indemnizables según R.D. 462/2002
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                                {result.liquido_ag.toFixed(2)} € Líquido
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                  <tr>
                                    <th className="py-3 px-4">Concepto</th>
                                    <th className="py-3 px-4">Base Normativa</th>
                                    <th className="py-3 px-4">Justificantes y Detalle</th>
                                    <th className="py-3 px-4 text-right">Gasto Justificado</th>
                                    <th className="py-3 px-4 text-right">Exceso / Deducción</th>
                                    <th className="py-3 px-4 text-right">Líquido Abonable</th>
                                    <th className="py-3 px-4 text-center">Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                  {/* Fila Manutención */}
                                  {manutencion && (
                                    <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <CalendarDays size={14} className="text-[#176B52] dark:text-[#86EFAC]" />
                                        Manutención y Dietas
                                      </td>
                                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                                        R.D. 462/2002 Art. 12 (Grupo 2)
                                      </td>
                                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                                        {(manutencion.factor_total || 2.5).toFixed(1)} jornadas ({manutencion.tarifa_dia || 37.70} €/día)
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                        {(manutencion.importe || 0).toFixed(2)} €
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-zinc-400">
                                        0,00 €
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                        {(manutencion.importe || 0).toFixed(2)} €
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => setFiltroConcepto('manutencion')}
                                          className="text-[11px] font-semibold text-[#176B52] dark:text-[#86EFAC] hover:underline cursor-pointer"
                                        >
                                          Ver Detalle
                                        </button>
                                      </td>
                                    </tr>
                                  )}

                                  {/* Fila Transporte */}
                                  {transporte && (
                                    <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <Car size={14} className="text-[#176B52] dark:text-[#86EFAC]" />
                                        Desplazamiento y Transporte
                                      </td>
                                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                                        Orden HFP/792/2023 ({tarifaKm.toFixed(2)} €/km)
                                      </td>
                                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                                        {origen} ⇄ {destino} ({totalKm} km)
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                        {(transporte.importe || 0).toFixed(2)} €
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-zinc-400">
                                        0,00 €
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                        {(transporte.importe || 0).toFixed(2)} €
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => setFiltroConcepto('transporte')}
                                          className="text-[11px] font-semibold text-[#176B52] dark:text-[#86EFAC] hover:underline cursor-pointer"
                                        >
                                          Ver Detalle
                                        </button>
                                      </td>
                                    </tr>
                                  )}

                                  {/* Fila Alojamiento */}
                                  {alojamiento && (
                                    <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <BedDouble size={14} className="text-[#176B52] dark:text-[#86EFAC]" />
                                        Alojamiento y Hospedaje
                                      </td>
                                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                                        R.D. 462/2002 Grupo 2 (65,97 €/noche)
                                      </td>
                                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                                        {alojamiento.detalle?.[0]?.establecimiento || 'Hotel'} ({alojamiento.detalle?.[0]?.noches || 2} noches)
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                        {(alojamiento.detalle?.[0]?.importe_real || alojamiento.importe || 0).toFixed(2)} €
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                                        {(alojamiento.detalle?.[0]?.exceso_no_abonable || 0) > 0 ? `-${(alojamiento.detalle[0].exceso_no_abonable).toFixed(2)} €` : '0,00 €'}
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                        {(alojamiento.importe || 0).toFixed(2)} €
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => setFiltroConcepto('alojamiento')}
                                          className="text-[11px] font-semibold text-[#176B52] dark:text-[#86EFAC] hover:underline cursor-pointer"
                                        >
                                          Ver Detalle
                                        </button>
                                      </td>
                                    </tr>
                                  )}

                                  {/* Fila Inscripción */}
                                  {inscripcion && (
                                    <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <Building2 size={14} className="text-[#176B52] dark:text-[#86EFAC]" />
                                        Inscripción al Congreso
                                      </td>
                                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                                        Factura CIF UEx (Tarjeta Corporativa)
                                      </td>
                                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                                        Abonado directamente por UEx (no transferible)
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                        {(inscripcion.importe_total || inscripcion.importe || 475.0).toFixed(2)} €
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-zinc-500 text-[11px]">
                                        Pagado UEx
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                        {(inscripcion.reembolsable_al_investigador ? inscripcion.importe_reembolsable : 0).toFixed(2)} €
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <button
                                          type="button"
                                          onClick={() => setFiltroConcepto('inscripcion')}
                                          className="text-[11px] font-semibold text-[#176B52] dark:text-[#86EFAC] hover:underline cursor-pointer"
                                        >
                                          Ver Detalle
                                        </button>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                                <tfoot className="bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 font-bold">
                                  <tr>
                                    <td colSpan={3} className="py-3 px-4 text-zinc-900 dark:text-zinc-100">
                                      Líquido Total Reconocido a Transferir en Cuenta Bancaria:
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                                      {(balanceFinanciero?.gastoTotalMision || result.liquido_ag).toFixed(2)} €
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                                      {(balanceFinanciero?.aloExceso || 0) > 0 ? `-${(balanceFinanciero?.aloExceso || 0).toFixed(2)} €` : '0,00 €'}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-sm text-[#176B52] dark:text-[#86EFAC]">
                                      {result.liquido_ag.toFixed(2)} €
                                    </td>
                                    <td className="py-3 px-4 text-center text-zinc-400 text-[10px] uppercase">
                                      Conforme
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* BANNER INFORMATIVO CUANDO UN CONCEPTO INDIVIDUAL ESTÁ SELECCIONADO */}
                        {filtroConcepto !== 'todos' && (
                          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-xs">
                            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <span className="font-semibold">Mostrando únicamente la partida:</span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                                {filtroConcepto === 'manutencion' ? 'Manutención y Dietas' : filtroConcepto === 'transporte' ? 'Desplazamiento y Transporte' : filtroConcepto === 'alojamiento' ? 'Alojamiento y Hospedaje' : 'Inscripción al Congreso'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFiltroConcepto('todos')}
                              className="font-semibold text-[#176B52] dark:text-[#86EFAC] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowLeft size={13} />
                              Ver resumen general
                            </button>
                          </div>
                        )}

                        {/* PARTIDA 1: MANUTENCIÓN Y DIETAS */}
                        {showManutencion && (
                          <div className="space-y-4">
                            <CalendarioDietas 
                              detalleDias={manutencion?.detalle_dias}
                              tarifaDia={manutencion?.tarifa_dia || liq.tarifas_aplicadas?.manutencion_dia || 37.70}
                              factorTotal={manutencion?.factor_total || 0}
                              importeTotal={manutencion?.importe || 0}
                            />
                          </div>
                        )}

                        {/* PARTIDA 2: TRANSPORTE Y DESPLAZAMIENTO */}
                        {showTransporte && (
                          <div className="space-y-4 pt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs">
                                  <Car size={18} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    Desplazamiento y Gastos de Locomoción
                                  </h4>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Orden HFP/792/2023 · Módulo oficial de kilometraje: {tarifaKm.toFixed(2)} €/km
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm font-mono font-bold px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                                {(transporte?.importe || 0).toFixed(2)} €
                              </span>
                            </div>

                            {transporte?.detalle?.map((t: any, i: number) => {
                              const isCoche = t.tipo === 'vehiculo_particular' || Boolean(t.km);

                              if (isCoche) {
                                return (
                                  <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-5 shadow-xs">
                                    
                                    {/* FICHA TÉCNICA DEL ITINERARIO */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                          Itinerario Oficial
                                        </span>
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm block">
                                          {origen} ⇄ {destino}
                                        </span>
                                        <span className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 block">
                                          Ida ({mitadKm} km) + Vuelta ({mitadKm} km)
                                        </span>
                                      </div>

                                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                          Vehículo Autorizado
                                        </span>
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm block">
                                          {vehiculoDesc}
                                        </span>
                                        <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] mt-0.5 block">
                                          Matrícula: {matriculaDesc || 'Declarada en solicitud'}
                                        </span>
                                      </div>

                                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                          Cálculo de la Indemnización
                                        </span>
                                        <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 text-sm block">
                                          {totalKm} km × {tarifaKm.toFixed(2)} €/km
                                        </span>
                                        <span className="text-[#176B52] dark:text-[#86EFAC] font-mono font-bold text-xs mt-0.5 block">
                                          = {((typeof t.importe === 'number' ? t.importe : totalKm * tarifaKm)).toFixed(2)} € a percibir
                                        </span>
                                      </div>
                                    </div>

                                    {/* OBSERVACIONES NORMATIVAS Y TRIBUTARIAS */}
                                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                                      <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                                        <ShieldCheck size={15} className="text-[#176B52] dark:text-[#86EFAC]" />
                                        <span>Certificación Reglamentaria y Cobertura Integral</span>
                                      </div>
                                      <p className="text-[11px] leading-relaxed">
                                        La cuantía de {((typeof t.importe === 'number' ? t.importe : totalKm * tarifaKm)).toFixed(2)} € compensa íntegramente los gastos de combustible, desgaste mecánico, seguro obligatorio y amortización del vehículo conforme a la <strong>Orden HFP/792/2023</strong>.
                                      </p>
                                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        <strong>Régimen Fiscal:</strong> Renta 100% exenta de retención e ingreso a cuenta en el IRPF de acuerdo con el Art. 9.A.2 del Reglamento del IRPF (RD 439/2007).
                                      </p>
                                    </div>

                                  </div>
                                );
                              }

                              return (
                                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs shadow-xs">
                                  <div className="flex items-center gap-3">
                                    <CreditCard size={18} className="text-zinc-400" />
                                    <div>
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">{t.medio || t.tipo || 'Transporte Público Colectivo'}</span>
                                      <span className="text-[11px] text-zinc-400 block">{t.itinerario || 'Billete / Justificante oficial'}</span>
                                    </div>
                                  </div>
                                  <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    {(t.importe_abonable || t.importe || 0).toFixed(2)} €
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* PARTIDA 3: ALOJAMIENTO Y HOSPEDAJE */}
                        {showAlojamiento && (
                          <div className="space-y-4 pt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs">
                                  <BedDouble size={18} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    Alojamiento y Fiscalización de Topes Máximos
                                  </h4>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    R.D. 462/2002 Grupo 2 · Límite máximo oficial: {(liq.tarifas_aplicadas?.alojamiento_max_dia || 65.97).toFixed(2)} €/noche
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm font-mono font-bold px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                                {(alojamiento?.importe || 0).toFixed(2)} €
                              </span>
                            </div>

                            {(!alojamiento?.detalle || alojamiento.detalle.length === 0) ? (
                              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-center text-zinc-400 italic">
                                No constan gastos de hospedaje imputados al expediente.
                              </div>
                            ) : (
                              alojamiento.detalle.map((a: any, i: number) => {
                                const importeReal = a.importe_real || 0;
                                const importeAbonable = a.importe_abonable || 0;
                                const exceso = a.exceso_no_abonable || 0;

                                return (
                                  <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-5 shadow-xs">
                                    
                                    {/* CUADRO COMPARATIVO DE FISCALIZACIÓN */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                          <tr>
                                            <th className="py-2.5 px-3">Establecimiento</th>
                                            <th className="py-2.5 px-3 text-center">Pernoctaciones</th>
                                            <th className="py-2.5 px-3 text-right">Factura Aportada</th>
                                            <th className="py-2.5 px-3 text-right">Límite Oficial Grupo 2</th>
                                            <th className="py-2.5 px-3 text-right">Exceso no Indemnizable</th>
                                            <th className="py-2.5 px-3 text-right">Importe Liquidado</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                          <tr>
                                            <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                              {a.establecimiento || 'Hotel Maya Alicante'}
                                            </td>
                                            <td className="py-3 px-3 text-center font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                              {a.noches || 2} noches
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                              {importeReal.toFixed(2)} €
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                                              {((a.limite_aplicable || 65.97)).toFixed(2)} €
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                                              {exceso > 0 ? `-${exceso.toFixed(2)} €` : '0,00 €'}
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#176B52] dark:text-[#86EFAC]">
                                              {importeAbonable.toFixed(2)} €
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* 3 FICHAS ECONÓMICAS CLARAS */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                          Límite Abonable Reconocido
                                        </span>
                                        <span className="text-base font-extrabold font-mono text-[#176B52] dark:text-[#86EFAC] block">
                                          {importeAbonable.toFixed(2)} €
                                        </span>
                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                                          Tope legal: {(importeAbonable / (a.noches || 2)).toFixed(2)} €/noche
                                        </span>
                                      </div>

                                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                          Exceso a Cargo del Interesado
                                        </span>
                                        <span className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400 block">
                                          -{exceso.toFixed(2)} €
                                        </span>
                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                                          Supera el tope del Grupo 2
                                        </span>
                                      </div>

                                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                          Total Factura Presentada
                                        </span>
                                        <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-zinc-100 block">
                                          {importeReal.toFixed(2)} €
                                        </span>
                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                                          Tarifa media: {(importeReal / (a.noches || 2)).toFixed(2)} €/noche
                                        </span>
                                      </div>
                                    </div>

                                    {/* NOTA NORMATIVA */}
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                      Conforme al R.D. 462/2002 y la normativa de gestión de gasto de la Universidad de Extremadura, el límite de 65,97 €/noche para el Grupo 2 es improrrogable sin resolución expresa de Gerencia. El importe reconocido a transferir es estrictamente de <strong>{importeAbonable.toFixed(2)} €</strong>.
                                    </p>

                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* PARTIDA 4: INSCRIPCIÓN Y CUOTAS DE CONGRESO */}
                        {showInscripcion && (
                          <div className="space-y-4 pt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs">
                                  <Building2 size={18} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    Inscripción y Matrícula Oficial al Congreso
                                  </h4>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Transferencia de Conocimiento · Imputación a Proyecto SGTRI
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-medium border border-zinc-200 dark:border-zinc-700">
                                  Factura: {(inscripcion.importe_total || inscripcion.importe || 475.0).toFixed(2)} €
                                </span>
                                <span className="text-sm font-mono font-bold px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                                  {inscripcion.reembolsable_al_investigador ? `${(inscripcion.importe_reembolsable || 0).toFixed(2)} €` : '0,00 € a transferir'}
                                </span>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4 shadow-xs text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                    Actividad Científica
                                  </span>
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                                    Jornadas de Ingeniería del Software y BD (JISBD)
                                  </span>
                                </div>

                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                    Modalidad de Pago
                                  </span>
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                                    Tarjeta Institucional UEx
                                  </span>
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                                    Abono centralizado por la Universidad
                                  </span>
                                </div>

                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                                    Efecto en Nómina / Transferencia
                                  </span>
                                  <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 block">
                                    0,00 € a abonar al interesado
                                  </span>
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                                    Gasto no adelantado con fondos particulares
                                  </span>
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                La cuota de <strong>{(inscripcion.importe_total || inscripcion.importe || 475.0).toFixed(2)} €</strong> se encuentra justificada documentalmente mediante factura oficial emitida a nombre de la <strong>Universidad de Extremadura (CIF Q1018001F)</strong> e imputada a la partida de congresos del proyecto. No procede su abono en la nómina del comisionado al haber sido satisfecha de forma directa y centralizada por la Universidad.
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })() : (
                    <div className="text-center py-8 text-zinc-400 text-xs">No hay desglose disponible para este trámite.</div>
                  )}
                </div>
              )}

              {/* TAB 2: BALANCE Y RECONCILIACIÓN DE GASTOS */}
              {activeTab === 'balance' && balanceFinanciero && (
                <div className="space-y-6 animate-fade-in text-xs leading-relaxed">
                  <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <Calculator size={18} className="text-zinc-700 dark:text-zinc-300" />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Cuadro de Balance y Reconciliación Financiera del Expediente
                        </h4>
                        <span className="text-[11px] text-zinc-400">
                          Explicación matemática entre el coste total justificado en facturas y el importe neto a transferir
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Columna Izquierda: Tabla de Sumas y Restas */}
                      <div className="lg:col-span-7 space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                          1. Desglose Integral de Justificantes Aportados
                        </span>

                        <div className="p-4 rounded-2xl bg-[#FCFBFA] dark:bg-zinc-950/60 border border-[#EFECE6] dark:border-zinc-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <Car size={14} className="text-zinc-400" /> Kilometraje Vehículo Particular (1.340 km)
                            </span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              +{balanceFinanciero.tra.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <Calendar size={14} className="text-zinc-400" /> Manutención y Dietas de Estancia (4,5 días)
                            </span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              +{balanceFinanciero.man.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <BedDouble size={14} className="text-zinc-400" /> Factura Completa de Alojamiento (4 noches)
                            </span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              +{balanceFinanciero.aloReal.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                              <Receipt size={14} className="text-zinc-400" /> Factura de Inscripción al Congreso
                            </span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              +{balanceFinanciero.insTotal.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            <span>Coste Total Bruto de la Comisión:</span>
                            <span className="font-mono font-extrabold text-base">
                              {balanceFinanciero.gastoTotalMision.toFixed(2)} €
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block pt-3 mb-2">
                          2. Deducciones y Exclusiones Normativas
                        </span>

                        <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800 space-y-2 text-xs">
                          {balanceFinanciero.aloExceso > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-[#E0D9CB] dark:border-zinc-800 text-[#754E20] dark:text-[#FDBA74]">
                              <span className="flex items-center gap-2">
                                <ShieldAlert size={14} /> Exceso de Hotel sobre Límite Legal ({balanceFinanciero.esJunta ? '120,00' : '65,97'} €/noche)
                              </span>
                              <span className="font-mono font-bold">
                                -{balanceFinanciero.aloExceso.toFixed(2)} €
                              </span>
                            </div>
                          )}

                          {balanceFinanciero.irpfRetencion > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-[#E0D9CB] dark:border-zinc-800 text-[#754E20] dark:text-[#FDBA74]">
                              <span className="flex items-center gap-2">
                                <Scale size={14} /> Retención IRPF (15% sobre exceso de topes estatales RD 462/2002)
                              </span>
                              <span className="font-mono font-bold">
                                -{balanceFinanciero.irpfRetencion.toFixed(2)} €
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center py-1.5 border-b border-[#E0D9CB] dark:border-zinc-800 text-[#6B3E82] dark:text-[#E9D5FF]">
                            <span className="flex items-center gap-2">
                              <CreditCard size={14} /> Inscripción Pagada Directamente por UEx (Tarjeta Institucional)
                            </span>
                            <span className="font-mono font-bold">
                              -{balanceFinanciero.insTotal.toFixed(2)} €
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            <span>Total Deducciones del Reembolso Personal:</span>
                            <span className="font-mono font-extrabold text-base text-red-600 dark:text-red-400">
                              -{(balanceFinanciero.aloExceso + balanceFinanciero.insTotal + balanceFinanciero.irpfRetencion).toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Columna Derecha: Tarjeta de Dictamen Final */}
                      <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-3xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md space-y-5">
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 block">
                            Resultado de la Liquidación
                          </span>
                          <h3 className="text-xl font-extrabold tracking-tight">
                            Importe Neto a Abonar al Investigador
                          </h3>
                          <p className="text-xs text-zinc-300 dark:text-zinc-700 leading-relaxed">
                            Cantidad líquida que se remitirá a la entidad bancaria del perceptor tras auditar topes máximos y medios de pago institucionales.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-800/80 dark:bg-zinc-200/80 border border-zinc-700 dark:border-zinc-300 space-y-2">
                          <div className="flex justify-between text-xs text-zinc-300 dark:text-zinc-700">
                            <span>Total Gastos de Misión:</span>
                            <span className="font-mono font-bold">{balanceFinanciero.gastoTotalMision.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between text-xs text-red-300 dark:text-red-700">
                            <span>Excesos y Pagos UEx:</span>
                            <span className="font-mono font-bold">-{(balanceFinanciero.aloExceso + balanceFinanciero.insTotal + balanceFinanciero.irpfRetencion).toFixed(2)} €</span>
                          </div>
                          <div className="pt-2 border-t border-zinc-700/60 dark:border-zinc-300/60 flex justify-between items-center">
                            <span className="font-bold text-sm">Líquido a Percibir:</span>
                            <span className="text-2xl sm:text-3xl font-black font-mono">
                              {balanceFinanciero.liquidoTransferir.toFixed(2)} €
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-400 dark:text-zinc-600 italic">
                          * Conforme a la Memoria de Justificación Económica de la Sede Electrónica UEx.
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FUNDAMENTACIÓN JURÍDICO-TRIBUTARIA */}
              {activeTab === 'fundamentacion' && (
                <div className="space-y-6 animate-fade-in text-xs leading-relaxed">
                  <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <Scale size={18} className="text-zinc-700 dark:text-zinc-300" />
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Fundamento Jurídico-Tributario de la Liquidación
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-[#EEF6F0]/60 dark:bg-[#1A2E22]/30 border border-[#D5E8DA] dark:border-[#22543D]/50 flex items-start gap-3">
                          <ShieldCheck size={18} className="text-[#285735] dark:text-[#86EFAC] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
                              Régimen de Exención de IRPF (0,00 €)
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                              Conforme al <strong>Artículo 9 del Reglamento del IRPF (RD 439/2007)</strong> y el <strong>Real Decreto 462/2002</strong> sobre indemnizaciones por razón del servicio, las asignaciones para gastos de manutención (37,70 €/día) y kilometraje (0,26 €/km) devengadas en este expediente se encuentran <strong>íntegramente dentro de los límites exentos de tributación</strong>. Por tanto, no procede aplicar retención a cuenta del IRPF sobre el importe devengado.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#EEF4F8]/60 dark:bg-[#1E293B]/30 border border-[#D0E2F0] dark:border-[#334155]/50 flex items-start gap-3">
                          <FileCheck size={18} className="text-[#2B4C6F] dark:text-[#93C5FD] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
                              Compensación por Uso de Vehículo Particular
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                              La compensación de <strong>0,26 €/km</strong> (Orden HFP/792/2023) cubre de forma íntegra los gastos de combustible, desgaste mecánico, amortización y seguro del vehículo. No procede el reembolso adicional de tickets de repostaje al quedar absorbidos por la indemnización de kilometraje.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-[#FDF7ED]/60 dark:bg-[#342416]/30 border border-[#F7E5CB] dark:border-[#5C3818]/50 flex items-start gap-3">
                          <AlertTriangle size={18} className="text-[#754E20] dark:text-[#FDBA74] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
                              Aplicación de Topes Máximos de Alojamiento
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                              De acuerdo con la normativa del Plan Estatal, el importe máximo liquidable por noche de hotel en territorio nacional es de <strong>65,97 €</strong> (Grupo 2). Las cantidades que excedan dicho umbral (en este caso, 73,72 €) quedan excluidas de la liquidación oficial con cargo a los fondos públicos del proyecto.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800 flex items-start gap-3">
                          <Building2 size={18} className="text-zinc-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
                              Destino y Fiscalización del Expediente
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                              Expediente fiscalizado para su remisión al <strong>Servicio de Gestión y Transferencia de Resultados de la Investigación (SGTRI)</strong> y tramitación de la orden de transferencia bancaria a la cuenta IBAN acreditada del investigador.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ESQUEMA JSON */}
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

                    <Btn size="sm" variant="outline" onClick={() => copyJsonToClipboard(jsonTab === 'liquidacion' ? result.liquidacion : result.extraccion)} className="cursor-pointer rounded-xl">
                      <Copy size={13} className="mr-1" />
                      {copied ? '¡Copiado!' : 'Copiar JSON'}
                    </Btn>
                  </div>

                  <pre className="p-5 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto max-h-[500px] border border-zinc-800 shadow-inner leading-relaxed">
                    {JSON.stringify(jsonTab === 'liquidacion' ? result.liquidacion : result.extraccion, null, 2)}
                  </pre>
                </div>
              )}

              {/* TAB 5: AUDITORÍA Y TRAZABILIDAD */}
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

              {/* TAB 6: GRAFO */}
              {activeTab === 'grafo' && (
                <div className="animate-fade-in">
                  <ViewGrafo />
                </div>
              )}

              </div>
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
            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-6xl w-full shadow-2xl space-y-4 animate-pop max-h-[95vh] h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-[#ECE7DD] dark:border-zinc-700/60">
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

            {/* Cuerpo del Modal */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
              
              <div className="lg:col-span-8 flex flex-col min-h-0 bg-[#FAF8F5] dark:bg-zinc-950/60 rounded-2xl border border-[#ECE7DD] dark:border-zinc-800 overflow-hidden shadow-inner">
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

              <div className="lg:col-span-4 flex flex-col justify-between overflow-y-auto space-y-4 pr-1">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Descripción del Trámite
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {previewTemplateModal.desc}
                    </p>
                  </div>

                  {(previewTemplateModal as any).normativa && (
                    <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                        Marco Normativo y Legal
                      </span>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                        {(previewTemplateModal as any).normativa}
                      </p>
                    </div>
                  )}

                  {(previewTemplateModal as any).organismo && (
                    <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800">
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
                    className="w-full cursor-pointer shadow-md rounded-2xl"
                  >
                    Usar este Procedimiento
                  </Btn>
                  <Btn 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setPreviewTemplateModal(null)} 
                    className="w-full cursor-pointer rounded-2xl"
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
