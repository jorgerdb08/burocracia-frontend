import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

import {

  ChevronRight, ArrowRight, Play, Loader2, AlertTriangle, CheckCircle, RefreshCw, UploadCloud, X, Trash2,

  ChevronLeft, RotateCcw, Check, Eye, CheckCircle2, XCircle, FileText, FolderOpen, Printer, Info, ShieldCheck,

  Scale, FileCheck, FileSpreadsheet, AlertOctagon, Building2, HelpCircle, ExternalLink, Copy, Terminal, ChevronDown, ChevronUp, ZoomIn,

  Calendar, Car, BedDouble, MapPin, Navigation, Gauge, Fuel, CreditCard, Clock, Sparkles, Route, ArrowRightLeft,

  ShieldAlert, Wallet, CalendarDays, Compass, Receipt, Calculator, ArrowDownRight, ArrowUpRight,

  ArrowLeft, Table, Layers, Filter, Landmark, Utensils, Code2, GitFork, Download, Menu,

  Train, Plane, Bus, FolderPlus, Edit3, User

} from 'lucide-react';

import { ViewGrafo } from './ViewGrafo';

import { FormularioHonorariosUEx } from './FormularioHonorariosUEx';

import { FormularioLiquidacionEditable } from './FormularioLiquidacionEditable';
import { DocumentosSalidaHonorarios } from './DocumentosSalidaHonorarios';

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

          <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0">

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

          <div className="flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">

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



          <div className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">

            {importeTotal.toFixed(2)} €

          </div>

        </div>

      </div>



      {/* VISTA 1: CALENDARIO MENSUAL + INSPECTOR */}

      {vistaModo === 'calendario' && (

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>

          

          {/* Cuadrícula del Calendario Mensual */}

          <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

            

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 600, fontSize: '11px', color: 'var(--text-muted)', paddingBottom: '4px' }}>

              {weekDayHeaders.map((d, idx) => (

                <div key={idx} style={{ padding: '4px 0' }}>{d}</div>

              ))}

            </div>



            {/* Celdas del mes */}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>

              {Array.from({ length: startDayOffset }).map((_, idx) => (

                <div key={`empty-${idx}`} className="h-16 rounded-md bg-transparent" />

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

                        "h-16 rounded-md p-2 flex flex-col justify-between transition-all duration-150 cursor-pointer text-left border relative group shadow-2xs",

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

                    className="h-16 rounded-md p-2 flex flex-col justify-start bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800/50 text-zinc-300 dark:text-zinc-700 select-none"

                  >

                    <span className="font-mono text-xs font-normal">{dayNum}</span>

                  </div>

                );

              })}

            </div>

          </div>



          {/* Panel Lateral de Detalle del Día Inspeccionado */}

          <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', minHeight: '340px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

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

                  <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

                    <span className="text-[10px] text-zinc-400 block mb-0.5">Concepto Computado</span>

                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">

                      {selectedDayInfo.tipo === 'salida' ? 'Jornada de Salida y Desplazamiento de Ida' : selectedDayInfo.tipo === 'regreso' ? 'Jornada de Retorno a Residencia Oficial' : 'Estancia Oficial en Comisión de Servicio'}

                    </span>

                  </div>



                  <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

                    <span className="text-[10px] text-zinc-400 block mb-0.5">Fórmula de Liquidación Económica</span>

                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">

                      {selectedDayInfo.factor.toFixed(1)}x × {tarifaDia.toFixed(2)} €/día = {selectedDayInfo.importe.toFixed(2)} €

                    </span>

                  </div>



                  <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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

        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">

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

// CATÁLOGO OFICIAL DE FINANCIACIÓN Y PROYECTOS (PORTAL SGTRI / UEx)

// Fuente oficial verificada: Liquidacion-Dietas-y-desplazamientos-SGTRI-2025-v.25.t5.pdf

// (Funciones JavaScript embebidas: defineNormativa() y cambiaTipoProyecto())

// =========================================================================

const PROYECTOS_UEX_OFICIALES = [

  {

    id: 'G24',

    nombre: 'Ayudas a grupos o proyectos GR24/IB24',

    normativa: 'R.D. 462/2002',

    fiscalidad: '100% Exento IRPF',

    esJunta: false,

    marcoLegal: 'Real Decreto 462/2002 del Estado (Cofinanciación Fondos FEDER Unión Europea canalizados por SGTRI)',

    baremos: {

      manutencion: '37,40 €/día (18,70 € media dieta)',

      alojamiento: '65,97 €/noche',

      locomocion: '0,26 €/km en vehículo particular'

    },

    irpfDetalle: 'Totalmente exento de IRPF (0% de retención) al no superar el límite de 53,34 €/día del Art. 9 del Reglamento de IRPF. Destapa automáticamente los logos FEDER en la plantilla oficial SGTRI.',

    desc: 'Convocatorias de ayudas a Grupos de Investigación de Extremadura (códigos GR24 e IB24) cofinanciadas con Fondos Europeos FEDER.',

    ejemplos: 'Ayudas a Grupos de Investigación GR24099, proyectos de investigación básica IB24xxx sujetos a elegibilidad europea.',

    plazos: '45 días naturales tras el viaje. En diciembre, antes del cierre del ejercicio presupuestario.'

  },

  {

    id: 'PEI',

    nombre: 'Plan Estatal de Investigación',

    normativa: 'R.D. 462/2002',

    fiscalidad: '100% Exento IRPF',

    esJunta: false,

    marcoLegal: 'Real Decreto 462/2002 del Estado y Guías de Justificación AEI / MICIU / Fondos PRTR',

    baremos: {

      manutencion: '37,40 €/día (18,70 € media dieta)',

      alojamiento: '65,97 €/noche',

      locomocion: '0,26 €/km en vehículo particular'

    },

    irpfDetalle: 'Totalmente exento de retención en IRPF (0%).',

    desc: 'Proyectos de I+D+i del Plan Estatal financiados por el Ministerio / AEI (referencias PID, TED, PDC, PRTR NextGenerationEU).',

    ejemplos: 'Proyectos de Generación de Conocimiento (PID...), Transición Ecológica y Digital (TED...), Proyectos de Prueba de Concepto (PDC...).',

    plazos: '45 días naturales tras la realización de la comisión.'

  },

  {

    id: 'NAL',

    nombre: 'Otros proyectos R.D. 462/2002',

    normativa: 'R.D. 462/2002',

    fiscalidad: '100% Exento IRPF',

    esJunta: false,

    marcoLegal: 'Real Decreto 462/2002 del Estado (Régimen General Estatal)',

    baremos: {

      manutencion: '37,40 €/día (18,70 € media dieta)',

      alojamiento: '65,97 €/noche',

      locomocion: '0,26 €/km en vehículo particular'

    },

    irpfDetalle: 'Totalmente exento de retención en IRPF (0%).',

    desc: 'Cualquier proyecto o ayuda sujeto al régimen general estatal de indemnizaciones por razón del servicio.',

    ejemplos: 'Proyectos de ámbito nacional o convocatorias con bases reguladoras ancladas expresamente al R.D. 462/2002.',

    plazos: '45 días naturales tras el viaje.'

  },

  {

    id: 'UEX',

    nombre: 'Contratos y convenios UEx',

    normativa: 'Decreto 42/2025',

    fiscalidad: 'Decreto 42/2025 (Art. 32.1 Presupuestos UEx)',

    esJunta: true,

    marcoLegal: 'Decreto 42/2025 de la Junta de Extremadura y Bases de Ejecución UEx 2026 (Art. 32.1 e Instrucción 3/2010)',

    baremos: {

      manutencion: '53,34 €/día (26,67 € media dieta)',

      alojamiento: '102,56 €/noche',

      locomocion: '0,26 €/km en vehículo particular'

    },

    irpfDetalle: 'Manutención hasta 53,34 € exenta. Cualquier exceso devengado o retribución adicional queda sujeta al 15% de IRPF.',

    desc: 'Contratos Art. 60 LOSU con empresas, cátedras institucionales y convenios de colaboración propios gestionados por la UEx.',

    ejemplos: 'Contratos de transferencia con empresas gestionados por OTRI, convenios de colaboración y cátedras universidad-empresa.',

    plazos: '45 días naturales tras la realización del viaje (agosto inhábil).'

  },

  {

    id: 'JEX',

    nombre: 'Otros proyectos Decreto 42/2025',

    normativa: 'Decreto 42/2025',

    fiscalidad: 'IRPF 15% (s/ exceso)',

    esJunta: true,

    marcoLegal: 'Decreto 42/2025 de la Junta de Extremadura y Bases de Ejecución UEx 2026',

    baremos: {

      manutencion: '53,34 €/día (26,67 € media dieta)',

      alojamiento: '102,56 €/noche (resarcimiento con factura)',

      locomocion: '0,26 €/km en vehículo particular'

    },

    irpfDetalle: 'Aplica retención del 15% sobre cualquier importe devengado que supere el umbral exento legal de 53,34 €.',

    desc: 'Convenios y programas autonómicos financiados exclusivamente por la Junta de Extremadura sin cofinanciación FEDER.',

    ejemplos: 'Convenios directos con Consejerías de la Junta de Extremadura y ayudas de investigación estrictamente autonómicas.',

    plazos: '45 días naturales tras el viaje.'

  },

  {

    id: 'PCO',

    nombre: 'Planes Complementarios',

    normativa: 'Decreto 42/2025',

    fiscalidad: 'Decreto 42/2025 (Junta de Extremadura)',

    esJunta: true,

    marcoLegal: 'Decreto 42/2025 de la Junta de Extremadura y Convenios de Planes Complementarios',

    baremos: {

      manutencion: '53,34 €/día (26,67 € media dieta)',

      alojamiento: '102,56 €/noche',

      locomocion: '0,26 €/km en vehículo particular'

    },

    irpfDetalle: 'Liquidado con baremos autonómicos del Decreto 42/2025 según la plantilla oficial SGTRI.',

    desc: 'Proyectos de I+D+i de Planes Complementarios gestionados con normativa de la Junta de Extremadura.',

    ejemplos: 'Programas de Biotecnología aplicada a la salud, Energía e Hidrógeno Verde cofinanciados a nivel autonómico.',

    plazos: '45 días naturales tras el viaje.'

  }

];



// =========================================================================

// VISTA PRINCIPAL

// =========================================================================

export function ViewProcesar({

  initialCaso,

  templateId,

  onVolver,

  onIrHonorarios,

}: {

  initialCaso?: string;

  templateId?: string;

  onVolver: () => void;

  onIrHonorarios?: () => void;

  onInspeccionarCaso?: (id: string) => void;

}) {

  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateId || 'dietas');

  const isDietas = selectedTemplate === 'dietas';



  const [currentStep, setCurrentStep] = useState<number>(templateId ? 2 : (initialCaso ? 2 : 1));

  const [previewTemplateModal, setPreviewTemplateModal] = useState<typeof TEMPLATES[0] | null>(null);



  const [casoSel, setCasoSel] = useState(initialCaso || '');

  const [tipoProyecto, setTipoProyecto] = useState('');

  const [organica, setOrganica] = useState('');
  const [organicaSecundaria, setOrganicaSecundaria] = useState('');
  const [esMultiorganica, setEsMultiorganica] = useState(false);

  const [referenciaProyecto, setReferenciaProyecto] = useState('');

  const [modalProyectoInfo, setModalProyectoInfo] = useState<typeof PROYECTOS_UEX_OFICIALES[0] | null>(null);

  const [proyectosCatalogo, setProyectosCatalogo] = useState<any[]>([]);

  const [procedimientosConfig, setProcedimientosConfig] = useState<Record<string, any>>({});

  const [schemasList, setSchemasList] = useState<any[]>([]);

  const [plantillasList, setPlantillasList] = useState<any[]>([]);

  const [promptsCatalog, setPromptsCatalog] = useState<{ extraccion: any[], proyectos: any[], liquidacion: any[] }>({ extraccion: [], proyectos: [], liquidacion: [] });

  const [selectedPromptExtraccion, setSelectedPromptExtraccion] = useState<string>('');

  const [selectedPromptLiquidacion, setSelectedPromptLiquidacion] = useState<string>('');

  const [selectedPromptProyecto, setSelectedPromptProyecto] = useState<string>('');

  const [selectedCasoEspecifico, setSelectedCasoEspecifico] = useState<string>('');

  const [selectedSchemaPath, setSelectedSchemaPath] = useState<string>('');

  const [selectedPlantilla, setSelectedPlantilla] = useState<string>('');

  const [mostrarConfigAvanzada, setMostrarConfigAvanzada] = useState<boolean>(false);

  const [casoDetalle, setCasoDetalle] = useState<any>(null);

  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [casos, setCasos] = useState<{ id: string, tipo: string, total_archivos?: number, porcentaje?: number, completo?: boolean, estado_validacion?: string, errores_obligatorios?: string[], warnings_opcionales?: string[] }[]>([]);

  const [showExpedientes, setShowExpedientes] = useState(true);

  const [running, setRunning] = useState(false);

  const [activeTaskId, setActiveTaskId] = useState<string | undefined>();

  const [taskLogs, setTaskLogs] = useState<string>('');

  const [result, setResult] = useState<CasoResult | null>(null);

  const [error, setError] = useState('');

  const [files, setFiles] = useState<File[]>([]);

  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('desglose');

  const [filtroConcepto, setFiltroConcepto] = useState<'manutencion' | 'transporte' | 'alojamiento' | 'inscripcion' | 'suplidos' | null>(null);

  const [jsonTab, setJsonTab] = useState<'extraccion' | 'liquidacion'>('liquidacion');

  const [auditoriaSubTab, setAuditoriaSubTab] = useState<'logs' | 'grafo'>('logs');

  const [copied, setCopied] = useState(false);

  // Estados para Documentación de Entrada y Visor Modal Oficial
  const [mostrarDocumentosEntrada, setMostrarDocumentosEntrada] = useState<boolean>(false);
  const [docEnVisor, setDocEnVisor] = useState<any | null>(null);
  const [loadingDocVisor, setLoadingDocVisor] = useState<boolean>(false);
  const [errorDocVisor, setErrorDocVisor] = useState<string | null>(null);
  const [hojaExcelActiva, setHojaExcelActiva] = useState<number>(0);

  // Estados para nombrar y gestionar expedientes nuevos / personalizados
  const [nombreNuevoCaso, setNombreNuevoCaso] = useState<string>('');
  const [modalNombrarCasoOpen, setModalNombrarCasoOpen] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [modalRenombrarOpen, setModalRenombrarOpen] = useState<boolean>(false);
  const [nuevoNombreRenombrar, setNuevoNombreRenombrar] = useState<string>('');
  const [renombrando, setRenombrando] = useState<boolean>(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState<boolean>(false);
  const [eliminandoCaso, setEliminandoCaso] = useState<boolean>(false);

  // Estados para el formulario de comprobación y edición previa a la liquidación (Paso 4)
  const [formConfirmacion, setFormConfirmacion] = useState({
    comisionado: '',
    dni: '',
    iban: '',
    grupo_dieta: '2',
    origen: '',
    destino: '',
    itinerario: '',
    motivo: '',
    fecha_salida: '',
    hora_salida: '',
    fecha_regreso: '',
    hora_regreso: '',
    referencia: '',
    organica: '',
    organica_secundaria: '',
    es_multiorganica: false,
    cofinanciacion_regla: '',
    tipo_proyecto: '',
    tipo_transporte: 'vehiculo_particular' as 'vehiculo_particular' | 'transporte_publico',
    km: 0,
    matricula: '',
    marca: '',
    modelo: '',
    importe_transporte_publico: 0,
    descripcion_transporte: '',
    peajes: 0,
    parking: 0,
    hotel_nombre: '',
    hotel_noches: 0,
    hotel_importe: 0,
    congreso_nombre: '',
    congreso_importe: 0,
    congreso_pagada_por: 'investigador'
  });
  const [loadingExtraccionForm, setLoadingExtraccionForm] = useState<boolean>(false);
  const [guardandoCorrecciones, setGuardandoCorrecciones] = useState<boolean>(false);
  const [mensajeGuardadoExitoso, setMensajeGuardadoExitoso] = useState<string>('');

  // Cerrar modal de visor con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && docEnVisor) {
        setDocEnVisor(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docEnVisor]);

  // Asegurar que casoDetalle esté cargado al visualizar resultados
  useEffect(() => {
    if (result?.caso_id && (!casoDetalle || !casoDetalle.archivos || casoDetalle.archivos.length === 0)) {
      fetch(`/api/caso/${encodeURIComponent(result.caso_id)}`)
        .then(r => r.json())
        .then(d => { if (d.ok && d.detalle) setCasoDetalle(d.detalle); })
        .catch(() => {});
    }
  }, [result?.caso_id]);

  // Manejador para abrir documento en Visor Modal
  const handleVerDocumento = async (archivo: any) => {
    const cid = result?.caso_id || casoSel || '';
    if (!cid || !archivo) return;
    setLoadingDocVisor(true);
    setErrorDocVisor(null);
    setHojaExcelActiva(0);

    const nombre = typeof archivo === 'string' ? archivo : (archivo.name || archivo.nombre || '');
    const ext = nombre.split('.').pop()?.toLowerCase() || '';
    const tipoDetectado = ['xlsx', 'xls', 'csv'].includes(ext)
      ? 'xlsx'
      : (['docx', 'doc'].includes(ext)
        ? 'docx'
        : (ext === 'pdf' ? 'pdf' : (['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? 'imagen' : 'texto')));

    setDocEnVisor({
      nombre: nombre,
      categoria: archivo.categoria || 'Documento',
      tamano: archivo.size || archivo.tamano,
      tipo: tipoDetectado,
      download_url: `/api/caso/${encodeURIComponent(cid)}/archivo/${encodeURIComponent(nombre)}?download=1`,
      url_raw: `/api/caso/${encodeURIComponent(cid)}/archivo/${encodeURIComponent(nombre)}`
    });

    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(cid)}/archivo/${encodeURIComponent(nombre)}/preview`);
      const data = await res.json();
      if (data.ok) {
        setDocEnVisor(data);
      } else {
        setErrorDocVisor(data.error || 'No se pudo cargar la vista previa directa.');
      }
    } catch (err: any) {
      setErrorDocVisor(err.message || 'Error de conexión al cargar la vista previa.');
    } finally {
      setLoadingDocVisor(false);
    }
  };

  // Renderizador de Tarjeta Colapsable de Documentos de Entrada en 2 Columnas
  const renderCardDocumentosEntrada = (archivos: any[], cid: string) => {
    if (!archivos || archivos.length === 0) return null;

    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs mb-4">
        {/* Cabecera Colapsable */}
        <div className="p-4 sm:p-4.5 bg-slate-50/70 dark:bg-zinc-950/40 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#176B52] dark:text-emerald-300">
              <FileText size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Documentación y Justificantes de Entrada ({archivos.length} archivo(s))
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Originales
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Archivos originales aportados para este expediente (facturas de hotel, billetes, certificados bancarios, etc.).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMostrarDocumentosEntrada(!mostrarDocumentosEntrada)}
            className="btn btn-ghost btn-xs text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs self-end sm:self-auto"
          >
            {mostrarDocumentosEntrada ? (
              <>
                <span>Ocultar lista</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Ver lista ({archivos.length})</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>

        {/* Contenido en 2 columnas (Oculto por defecto) */}
        {mostrarDocumentosEntrada && (
          <div className="p-4 bg-slate-50/40 dark:bg-zinc-950/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {archivos.map((archivo: any, aIdx: number) => {
                const nombre = archivo.name || archivo.nombre || '';
                const ext = nombre.split('.').pop()?.toLowerCase() || '';
                const esExcel = ['xlsx', 'xls', 'csv'].includes(ext);
                const esPdf = ext === 'pdf';
                const esWord = ['docx', 'doc'].includes(ext);
                const esImg = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
                const fileDownloadUrl = `/api/caso/${encodeURIComponent(cid)}/archivo/${encodeURIComponent(nombre)}?download=1`;
                const tamanoKb = archivo.size || archivo.tamano ? ((archivo.size || archivo.tamano) / 1024).toFixed(0) : null;

                let iconElem = <FileText size={16} color="#64748B" />;
                let iconBg = '#F1F5F9';
                let iconBorder = '#E2E8F0';
                if (esExcel) {
                  iconElem = <FileSpreadsheet size={16} color="#176B52" />;
                  iconBg = '#ECFDF5';
                  iconBorder = '#A7F3D0';
                } else if (esPdf) {
                  iconElem = <FileText size={16} color="#DC2626" />;
                  iconBg = '#FEF2F2';
                  iconBorder = '#FECACA';
                } else if (esWord) {
                  iconElem = <FileText size={16} color="#2563EB" />;
                  iconBg = '#EFF6FF';
                  iconBorder = '#BFDBFE';
                } else if (esImg) {
                  iconElem = <Eye size={16} color="#7E22CE" />;
                  iconBg = '#FAF5FF';
                  iconBorder = '#E9D5FF';
                }

                return (
                  <div
                    key={aIdx}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: iconBg,
                          border: `1px solid ${iconBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {iconElem}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          onClick={() => handleVerDocumento(archivo)}
                          title={`Ver contenido de ${nombre}`}
                          className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate block cursor-pointer hover:text-[#176B52]"
                        >
                          {nombre}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {archivo.categoria || ext.toUpperCase() || 'Documento'}
                          </span>
                          {tamanoKb && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              {tamanoKb} KB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleVerDocumento(archivo)}
                        className="btn btn-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-[#176B52] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 hover:bg-[#176B52] hover:text-white cursor-pointer transition-all"
                        title="Ver documento en ventana modal estructurada"
                      >
                        <Eye size={12} />
                        <span>Ver</span>
                      </button>

                      <a
                        href={fileDownloadUrl}
                        download={nombre}
                        className="btn btn-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-all"
                        title="Descargar archivo original"
                      >
                        <Download size={12} />
                        <span>Descargar</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => ejecutarEliminarArchivo(cid, nombre)}
                        className="btn btn-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white cursor-pointer transition-all"
                        title={`Eliminar ${nombre} de este expediente`}
                      >
                        <Trash2 size={12} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };



  const fileInputRef = useRef<HTMLInputElement>(null);

  const resultRef = useRef<HTMLDivElement>(null);



  const tieneFicheroOExpediente = Boolean(casoSel || files.length > 0);



  // Cerrar modal de información al pulsar la tecla Escape

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.key === 'Escape') setModalProyectoInfo(null);

    };

    if (modalProyectoInfo) {

      window.addEventListener('keydown', handleKeyDown);

    }

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [modalProyectoInfo]);



  useEffect(() => {

    fetch('/api/casos').then(r => r.json()).then(d => setCasos(d.casos || [])).catch(() => { });

    fetch('/api/config/proyectos').then(r => r.json()).then(d => {

      if (d && d.proyectos && d.proyectos.length > 0) {

        setProyectosCatalogo(d.proyectos);

      }

    }).catch(() => {});

    fetch('/api/config/procedimientos').then(r => r.json()).then(d => {

      if (d && !d.error) setProcedimientosConfig(d);

    }).catch(() => {});

    fetch('/api/config/schemas').then(r => r.json()).then(d => {

      if (d && d.schemas) setSchemasList(d.schemas);

    }).catch(() => {});

    fetch('/api/config/plantillas').then(r => r.json()).then(d => {

      if (d && d.plantillas) setPlantillasList(d.plantillas);

    }).catch(() => {});

    fetch('/api/config/prompts').then(r => r.json()).then(d => {

      if (d && !d.error) setPromptsCatalog(d);

    }).catch(() => {});

  }, []);



  useEffect(() => {

    if (promptsCatalog.liquidacion && promptsCatalog.liquidacion.length > 0) {

      const match = promptsCatalog.liquidacion.find((l: any) => l.id.includes(selectedTemplate));

      if (match) setSelectedPromptLiquidacion(match.path);

    }

  }, [selectedTemplate, promptsCatalog]);



  useEffect(() => {

    if (promptsCatalog.proyectos && promptsCatalog.proyectos.length > 0) {

      if (tipoProyecto) {

        const pMatch = promptsCatalog.proyectos.find((p: any) => p.id.toLowerCase().includes(tipoProyecto.toLowerCase()));

        if (pMatch) setSelectedPromptProyecto(pMatch.path);

      } else {

        setSelectedPromptProyecto('');

      }

    }

  }, [tipoProyecto, promptsCatalog]);



  useEffect(() => {

    if (procedimientosConfig && procedimientosConfig[selectedTemplate]) {

      const proc = procedimientosConfig[selectedTemplate];

      setSelectedSchemaPath(proc.esquema_extraccion || '');

      setSelectedPlantilla(proc.plantillas_generacion?.[0] || '');

      const firstCase = proc.casos ? Object.keys(proc.casos)[0] : '';

      setSelectedCasoEspecifico(firstCase || '');

    }

  }, [selectedTemplate, procedimientosConfig]);



  const handleSelectCasoEspecifico = (caseKey: string) => {

    setSelectedCasoEspecifico(caseKey);

    const proc = procedimientosConfig[selectedTemplate];

    if (proc && proc.casos && proc.casos[caseKey]) {

      const cObj = proc.casos[caseKey];

      if (cObj.esquema_extraccion) setSelectedSchemaPath(cObj.esquema_extraccion);

      if (cObj.plantillas_generacion && cObj.plantillas_generacion.length > 0) {

        setSelectedPlantilla(cObj.plantillas_generacion[0]);

      }

    }

  };



  useEffect(() => {

    if (casoSel) {

      setLoadingDetalle(true);

      fetch(`/api/caso/${encodeURIComponent(casoSel)}/detalle?tipo=${encodeURIComponent(selectedTemplate || '')}`)

        .then(r => r.json())

        .then(d => {

          setCasoDetalle(d);

          setLoadingDetalle(false);

          if (d && d.tipo && ['dietas', 'pago_proveedor', 'honorarios'].includes(d.tipo)) {

            setSelectedTemplate(d.tipo);

          }

          // Autocompletado inteligente de Referencia y Orgánica detectadas

          setReferenciaProyecto(d?.referencia_sugerida || '');
          setOrganica(d?.organica_sugerida || '');

          if (d?.organica_secundaria_sugerida || d?.es_multiorganica) {
            setEsMultiorganica(true);
            setOrganicaSecundaria(d?.organica_secundaria_sugerida || '');
          } else {
            setEsMultiorganica(false);
            setOrganicaSecundaria('');
          }

          // Autoselección contextual de Tipo de Proyecto (G24, UEX, PEI, PCO, etc.)

          if (d?.tipo_proyecto_sugerido) {

            setTipoProyecto(d.tipo_proyecto_sugerido);

          } else if (d?.referencia_sugerida) {

            const rUpper = d.referencia_sugerida.toUpperCase();

            if (rUpper.includes('GR24') || rUpper.includes('GR21') || rUpper.includes('IB24')) {

              setTipoProyecto('G24');

            } else if (rUpper.includes('PID') || rUpper.includes('TED') || rUpper.includes('PRTR')) {

              setTipoProyecto('PEI');

            } else {

              setTipoProyecto('UEX');

            }

          }

          // Autoselección contextual de Modalidad o Caso Específico del trámite

          if (d?.modalidad_sugerida) {

            handleSelectCasoEspecifico(d.modalidad_sugerida);

          }

        })

        .catch(() => setLoadingDetalle(false));

    } else {

      setCasoDetalle(null);

    }

  }, [casoSel, selectedTemplate]);



  // Al cambiar de paso, siempre desplazar la vista al inicio superior de la pantalla

  useEffect(() => {

    window.scrollTo({ top: 0, behavior: 'smooth' });

  }, [currentStep]);



  // Validación estricta por pasos (impide avanzar si faltan datos obligatorios)

  const step1Valido = Boolean(selectedTemplate);

  const tieneDocumentosObligatorios = !(casoDetalle?.errores_obligatorios && casoDetalle.errores_obligatorios.length > 0);

  const step2Valido = tieneFicheroOExpediente && tieneDocumentosObligatorios;

  const step3Valido = Boolean(referenciaProyecto.trim() && organica.trim() && tipoProyecto);



  const puedeAvanzar = useMemo(() => {

    if (currentStep === 1) return step1Valido;

    if (currentStep === 2) return step2Valido;

    if (currentStep === 3) return step3Valido;

    return true;

  }, [currentStep, step1Valido, step2Valido, step3Valido]);



  const casosFiltrados = useMemo(() => {

    if (!selectedTemplate) return casos;

    return casos.filter(c => c.tipo === selectedTemplate);

  }, [casos, selectedTemplate]);



  useEffect(() => {

    if (result && resultRef.current) {

      const topPos = resultRef.current.getBoundingClientRect().top + window.scrollY - 70;

      window.scrollTo({ top: Math.max(0, topPos), left: 0, behavior: 'smooth' });

    }

  }, [result]);



  const cargarDatosConfirmacion = useCallback(async (cid: string) => {
    if (!cid) return;
    setLoadingExtraccionForm(true);
    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(cid)}/datos_extraccion`);
      const data = await res.json();
      if (data && data.ok) {
        const ext = data.extraccion || {};
        const dp = data.datos_personales || {};
        const inv = ext.investigador || {};
        const com = ext.comision || {};
        const proy = ext.proyecto || {};
        const transp = Array.isArray(ext.transporte) ? ext.transporte : [];
        const supl = Array.isArray(ext.suplidos) ? ext.suplidos : [];
        const aloj = Array.isArray(ext.alojamiento) ? ext.alojamiento : [];
        const insc = ext.inscripcion || {};

        // 1. Filtrar suplidos que puedan venir erróneamente en el array de transporte (peajes, parkings)
        const suplidosCombinados = [...supl];
        const transpLimpio: any[] = [];

        for (const t of transp) {
          const desc = (t.descripcion || t.concepto || '').toLowerCase();
          const tipo = (t.tipo || '').toLowerCase();
          const esPeaje = /peaje|autopista|via-t/.test(desc) || /peaje|autopista|via-t/.test(tipo);
          const esParking = /park|aparcamiento|estacionamiento/.test(desc) || /park|aparcamiento|estacionamiento/.test(tipo);

          if (esPeaje) {
            suplidosCombinados.push({ concepto: t.descripcion || 'Peaje', importe: t.importe });
          } else if (esParking) {
            suplidosCombinados.push({ concepto: t.descripcion || 'Parking', importe: t.importe });
          } else {
            transpLimpio.push(t);
          }
        }

        const veh = transpLimpio.find((t: any) => t.tipo === 'vehiculo_particular' || t.tipo === 'vehiculo_propio' || t.km > 0);
        const pub = transpLimpio.find((t: any) => 
          t.tipo === 'tren' || t.tipo === 'avion' || t.tipo === 'bus' || t.tipo === 'autobus' ||
          /tren|ave|renfe|vuelo|avion|billete|autobus|bus/i.test(t.descripcion || '')
        );

        const esVehiculo = Boolean(veh || dp.vehiculo_propio || dp.km > 0);

        let fSal = '';
        let hSal = '';
        if (com.fecha_hora_salida && typeof com.fecha_hora_salida === 'string' && com.fecha_hora_salida.includes('T')) {
          fSal = com.fecha_hora_salida.split('T')[0];
          hSal = com.fecha_hora_salida.split('T')[1]?.slice(0, 5) || '';
        } else if (dp.fecha_salida) {
          fSal = dp.fecha_salida;
          hSal = dp.hora_salida || '';
        }

        let fReg = '';
        let hReg = '';
        if (com.fecha_hora_regreso && typeof com.fecha_hora_regreso === 'string' && com.fecha_hora_regreso.includes('T')) {
          fReg = com.fecha_hora_regreso.split('T')[0];
          hReg = com.fecha_hora_regreso.split('T')[1]?.slice(0, 5) || '';
        } else if (dp.fecha_vuelta) {
          fReg = dp.fecha_vuelta;
          hReg = dp.hora_vuelta || '';
        }

        const peajeTotal = suplidosCombinados
          .filter((s: any) => /peaje|autopista|via-t/i.test(s.concepto || s.descripcion || ''))
          .reduce((acc: number, s: any) => acc + (Number(s.importe) || 0), 0) || Number(dp.peajes) || 0;

        const parkTotal = suplidosCombinados
          .filter((s: any) => /park|aparcamiento|estacionamiento/i.test(s.concepto || s.descripcion || ''))
          .reduce((acc: number, s: any) => acc + (Number(s.importe) || 0), 0) || Number(dp.parking) || 0;

        const al0 = aloj[0] || {};
        const hotImporte = Number(al0.importe_total || al0.importe) || Number(dp.alojamiento) || 0;
        let calcNoches = 0;
        if (fSal && fReg) {
          const diffDays = Math.round((new Date(fReg).getTime() - new Date(fSal).getTime()) / 86400000);
          if (diffDays > 0) calcNoches = diffDays;
        }
        const hotNoches = Number(al0.noches) > 0 ? Number(al0.noches) : calcNoches;
        const hotNombre = al0.establecimiento || dp.alojamiento_nombre || '';

        const inscImporte = Number(insc.importe) || Number(dp.inscripcion) || 0;
        const inscNombre = insc.nombre_congreso || '';

        const curRef = referenciaProyecto || proy.referencia || dp.referencia || '';
        const curOrg = organica || proy.organica || dp.organica || '';
        const curOrgSec = organicaSecundaria || proy.organica_secundaria || dp.organica_secundaria || '';
        const curEsMulti = Boolean(esMultiorganica || curOrgSec || proy.es_multiorganica || dp.es_multiorganica);
        const finalOrgSec = curEsMulti ? curOrgSec : '';
        const rawCofin = proy.cofinanciacion || dp.cofinanciacion || '';
        const curCofin = typeof rawCofin === 'string' ? rawCofin : '';
        const curTipoProy = tipoProyecto || proy.tipo_proyecto || '';
        const curKm = Number(veh?.km) || Number(dp.km) || 0;

        setFormConfirmacion({
          comisionado: inv.nombre || dp.comisionado || '',
          dni: inv.nif || dp.dni || '',
          iban: inv.iban || dp.iban || '',
          grupo_dieta: inv.grupo_dieta || '2',

          origen: com.origen || dp.origen || (dp.itinerario?.includes('->') ? dp.itinerario.split('->')[0].trim() : ''),
          destino: com.destino || (dp.itinerario?.includes('->') ? dp.itinerario.split('->')[1]?.trim() : dp.itinerario) || '',
          itinerario: dp.itinerario || (com.destino ? `${com.origen || ''} -> ${com.destino}`.replace(/^ -> /, '') : ''),
          motivo: com.motivo || '',
          fecha_salida: fSal,
          hora_salida: hSal,
          fecha_regreso: fReg,
          hora_regreso: hReg,

          referencia: curRef,
          organica: curOrg,
          organica_secundaria: finalOrgSec,
          es_multiorganica: curEsMulti,
          cofinanciacion_regla: curCofin,
          tipo_proyecto: curTipoProy,

          tipo_transporte: esVehiculo ? 'vehiculo_particular' : 'transporte_publico',
          km: esVehiculo ? curKm : 0,
          matricula: esVehiculo ? (veh?.matricula || dp.matricula || '') : '',
          marca: esVehiculo ? (veh?.marca || dp.marca || '') : '',
          modelo: esVehiculo ? (veh?.modelo || dp.modelo || '') : '',
          importe_transporte_publico: esVehiculo ? 0 : (pub?.importe || dp.transporte_publico || 0),
          descripcion_transporte: esVehiculo ? '' : (pub?.descripcion || ''),
          peajes: peajeTotal,
          parking: parkTotal,

          hotel_nombre: hotNombre,
          hotel_noches: hotNoches,
          hotel_importe: hotImporte,

          congreso_nombre: inscNombre,
          congreso_importe: inscImporte,
          congreso_pagada_por: insc.pagada_por || 'investigador'
        });

        if (!referenciaProyecto && curRef) setReferenciaProyecto(curRef);
        if (!organica && curOrg) setOrganica(curOrg);
        if (!organicaSecundaria && finalOrgSec) setOrganicaSecundaria(finalOrgSec);
        if (curEsMulti) setEsMultiorganica(true);
        if (!tipoProyecto && curTipoProy) setTipoProyecto(curTipoProy);
      }
    } catch (e) {
      console.error('Error al cargar datos de extracción:', e);
    } finally {
      setLoadingExtraccionForm(false);
    }
  }, [referenciaProyecto, organica, tipoProyecto]);

  useEffect(() => {
    if (currentStep === 4 && casoSel) {
      cargarDatosConfirmacion(casoSel);
    }
  }, [currentStep, casoSel, cargarDatosConfirmacion]);

  const guardarSoloDatos = async () => {
    if (!casoSel) return;
    setGuardandoCorrecciones(true);
    setMensajeGuardadoExitoso('');
    try {
      await fetch(`/api/caso/${encodeURIComponent(casoSel)}/guardar_datos_personales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comisionado: formConfirmacion.comisionado,
          dni: formConfirmacion.dni,
          iban: formConfirmacion.iban,
          itinerario: formConfirmacion.itinerario,
          fecha_salida: formConfirmacion.fecha_salida,
          hora_salida: formConfirmacion.hora_salida,
          fecha_vuelta: formConfirmacion.fecha_regreso,
          hora_vuelta: formConfirmacion.hora_regreso,
          vehiculo_propio: formConfirmacion.tipo_transporte === 'vehiculo_particular',
          km: Number(formConfirmacion.km) || 0,
          matricula: formConfirmacion.matricula,
          marca: formConfirmacion.marca,
          modelo: formConfirmacion.modelo,
          peajes: Number(formConfirmacion.peajes) || 0,
          parking: Number(formConfirmacion.parking) || 0,
          transporte_publico: Number(formConfirmacion.importe_transporte_publico) || 0,
          alojamiento: Number(formConfirmacion.hotel_importe) || 0,
          inscripcion: Number(formConfirmacion.congreso_importe) || 0,
          referencia: formConfirmacion.referencia,
          organica: formConfirmacion.organica,
          organica_secundaria: formConfirmacion.es_multiorganica ? formConfirmacion.organica_secundaria : '',
          cofinanciacion: formConfirmacion.cofinanciacion_regla,
          es_multiorganica: formConfirmacion.es_multiorganica
        })
      });
      setMensajeGuardadoExitoso('Datos del expediente guardados correctamente.');
      setTimeout(() => setMensajeGuardadoExitoso(''), 4000);
    } catch (e: any) {
      alert(e.message || 'Error al guardar los datos.');
    } finally {
      setGuardandoCorrecciones(false);
    }
  };

  const subirArchivos = async (nuevosArchivos: File[], customNombre?: string) => {

    if (nuevosArchivos.length === 0) return;

    setUploadingFiles(true);

    setError('');

    try {

      const fd = new FormData();

      nuevosArchivos.forEach(f => fd.append('files', f));

      if (selectedTemplate) {

        fd.append('tipo', selectedTemplate);

      }

      const nombreParaSubida = (customNombre !== undefined ? customNombre : nombreNuevoCaso).trim();
      if (!casoSel && nombreParaSubida) {
        fd.append('nombre_caso', nombreParaSubida);
      }

      const res = await fetch(`/api/caso/upload?tipo=${encodeURIComponent(selectedTemplate || '')}`, {

        method: 'POST',

        body: fd

      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setCasoSel(data.caso_id);

      setCasoDetalle(data.detalle);

      if (data.detalle?.tipo && ['dietas', 'pago_proveedor', 'honorarios'].includes(data.detalle.tipo)) {

        setSelectedTemplate(data.detalle.tipo);

      }

      if (data.detalle?.referencia_sugerida) {

        setReferenciaProyecto(data.detalle.referencia_sugerida);

      }

      if (data.detalle?.organica_sugerida) {

        setOrganica(data.detalle.organica_sugerida);

      }

      if (data.detalle?.organica_secundaria_sugerida || data.detalle?.es_multiorganica) {
        setEsMultiorganica(true);
        setOrganicaSecundaria(data.detalle.organica_secundaria_sugerida || '');
      }

      if (data.detalle?.tipo_proyecto_sugerido) {

        setTipoProyecto(data.detalle.tipo_proyecto_sugerido);

      } else if (data.detalle?.referencia_sugerida) {

        const rUpper = data.detalle.referencia_sugerida.toUpperCase();

        if (rUpper.includes('GR24') || rUpper.includes('GR21') || rUpper.includes('IB24')) {

          setTipoProyecto('G24');

        } else if (rUpper.includes('PID') || rUpper.includes('TED') || rUpper.includes('PRTR')) {

          setTipoProyecto('PEI');

        } else {

          setTipoProyecto('UEX');

        }

      }

      if (data.detalle?.modalidad_sugerida) {

        handleSelectCasoEspecifico(data.detalle.modalidad_sugerida);

      }

      // Actualizar listado de casos para incluir la nueva subida

      fetch('/api/casos').then(r => r.json()).then(d => setCasos(d.casos || [])).catch(() => {});

    } catch (err: any) {

      setError(err.message || 'Error al subir los archivos del expediente.');

    } finally {

      setUploadingFiles(false);

    }

  };



  const ejecutarRenombrarCaso = async () => {
    if (!casoSel || !nuevoNombreRenombrar.trim()) return;
    setRenombrando(true);
    setError('');
    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(casoSel)}/renombrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevo_nombre: nuevoNombreRenombrar.trim() })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setModalRenombrarOpen(false);
      if (data.caso_id) {
        setCasoSel(data.caso_id);
      }
      if (data.detalle) {
        setCasoDetalle(data.detalle);
      }
      const r = await fetch('/api/casos');
      const d = await r.json();
      if (d.casos) setCasos(d.casos);
    } catch (err: any) {
      alert(err.message || 'Error al renombrar el expediente.');
    } finally {
      setRenombrando(false);
    }
  };

  const ejecutarEliminarCaso = async () => {
    if (!casoSel) return;
    setEliminandoCaso(true);
    setError('');
    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(casoSel)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setModalEliminarOpen(false);
      setCasoSel('');
      setCasoDetalle(null);
      setFiles([]);
      setNombreNuevoCaso('');

      const r = await fetch('/api/casos');
      const d = await r.json();
      if (d.casos) setCasos(d.casos);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el expediente.');
    } finally {
      setEliminandoCaso(false);
    }
  };

  const ejecutarEliminarArchivo = async (cid: string, fileName: string) => {
    if (!window.confirm(`¿Desea eliminar el archivo "${fileName}" de este expediente?`)) return;
    try {
      const res = await fetch(`/api/caso/${encodeURIComponent(cid)}/archivo/${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const rDet = await fetch(`/api/caso/${encodeURIComponent(cid)}/detalle`);
      const dDet = await rDet.json();
      if (!dDet.error) {
        setCasoDetalle(dDet);
      }
      const rCasos = await fetch('/api/casos');
      const dCasos = await rCasos.json();
      if (dCasos.casos) setCasos(dCasos.casos);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el archivo.');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {

    e.preventDefault();

    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {

      const dropped = Array.from(e.dataTransfer.files);

      setFiles(dropped);

      if (casoSel || nombreNuevoCaso.trim()) {
        subirArchivos(dropped, nombreNuevoCaso.trim());
      } else {
        setPendingFiles(dropped);
        setModalNombrarCasoOpen(true);
      }

    }

  };



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files && e.target.files.length > 0) {

      const selected = Array.from(e.target.files);

      setFiles(selected);

      if (casoSel || nombreNuevoCaso.trim()) {
        subirArchivos(selected, nombreNuevoCaso.trim());
      } else {
        setPendingFiles(selected);
        setModalNombrarCasoOpen(true);
      }

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
    setTaskLogs('Iniciando validación de datos y liquidación del expediente...');

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

      const reqTipoProyecto = formConfirmacion.tipo_proyecto || tipoProyecto || 'G24';

      // 1. Guardar datos en el expediente físico para coherencia documental (.xlsx / .txt)
      try {
        await fetch(`/api/caso/${encodeURIComponent(targetCaso)}/guardar_datos_personales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comisionado: formConfirmacion.comisionado,
            dni: formConfirmacion.dni,
            iban: formConfirmacion.iban,
            itinerario: formConfirmacion.itinerario,
            fecha_salida: formConfirmacion.fecha_salida,
            hora_salida: formConfirmacion.hora_salida,
            fecha_vuelta: formConfirmacion.fecha_regreso,
            hora_vuelta: formConfirmacion.hora_regreso,
            vehiculo_propio: formConfirmacion.tipo_transporte === 'vehiculo_particular',
            km: Number(formConfirmacion.km) || 0,
            matricula: formConfirmacion.matricula,
            marca: formConfirmacion.marca,
            modelo: formConfirmacion.modelo,
            peajes: Number(formConfirmacion.peajes) || 0,
            parking: Number(formConfirmacion.parking) || 0,
            transporte_publico: Number(formConfirmacion.importe_transporte_publico) || 0,
            alojamiento: Number(formConfirmacion.hotel_importe) || 0,
            inscripcion: Number(formConfirmacion.congreso_importe) || 0,
            referencia: formConfirmacion.referencia || referenciaProyecto,
            organica: formConfirmacion.organica || organica
          })
        });
      } catch (err) {
        console.warn('Aviso al guardar datos personales:', err);
      }

      // 2. Construir la extracción estructurada validada por el usuario
      const updatedExtraccion: any = {
        investigador: {
          nombre: formConfirmacion.comisionado || '',
          nif: formConfirmacion.dni || '',
          iban: formConfirmacion.iban || '',
          grupo_dieta: formConfirmacion.grupo_dieta || '2'
        },
        comision: {
          origen: formConfirmacion.origen || '',
          destino: formConfirmacion.destino || formConfirmacion.itinerario || '',
          motivo: formConfirmacion.motivo || '',
          fecha_hora_salida: formConfirmacion.fecha_salida ? `${formConfirmacion.fecha_salida}T${formConfirmacion.hora_salida || '00:00'}:00` : '',
          fecha_hora_regreso: formConfirmacion.fecha_regreso ? `${formConfirmacion.fecha_regreso}T${formConfirmacion.hora_regreso || '00:00'}:00` : '',
          autorizada: true,
          pais: 'España',
          tipo_viaje: 'asistencia_congreso'
        },
        proyecto: {
          referencia: formConfirmacion.referencia || referenciaProyecto || '',
          organica: formConfirmacion.organica || organica || '',
          ...(formConfirmacion.es_multiorganica || formConfirmacion.organica_secundaria ? {
            organica_secundaria: formConfirmacion.organica_secundaria || organicaSecundaria || '',
            es_multiorganica: true,
            ...(formConfirmacion.cofinanciacion_regla ? { cofinanciacion: formConfirmacion.cofinanciacion_regla } : {})
          } : {}),
          tipo_proyecto: reqTipoProyecto,
          aplica_irpf: !['G24', 'PEI', 'NAL'].includes(reqTipoProyecto)
        },
        transporte: formConfirmacion.tipo_transporte === 'vehiculo_particular' ? [{
          tipo: 'vehiculo_particular',
          descripcion: formConfirmacion.itinerario || [formConfirmacion.origen, formConfirmacion.destino].filter(Boolean).join(' - '),
          km: Number(formConfirmacion.km) || 0,
          matricula: formConfirmacion.matricula || '',
          marca: formConfirmacion.marca || '',
          modelo: formConfirmacion.modelo || ''
        }] : [{
          tipo: 'tren',
          descripcion: formConfirmacion.descripcion_transporte || 'Billete de transporte público',
          importe: Number(formConfirmacion.importe_transporte_publico) || 0
        }],
        suplidos: [
          ...(Number(formConfirmacion.peajes) > 0 ? [{ concepto: 'Peaje', importe: Number(formConfirmacion.peajes) }] : []),
          ...(Number(formConfirmacion.parking) > 0 ? [{ concepto: 'Parking', importe: Number(formConfirmacion.parking) }] : [])
        ],
        alojamiento: Number(formConfirmacion.hotel_importe) > 0 ? [{
          establecimiento: formConfirmacion.hotel_nombre || 'Alojamiento',
          fecha_entrada: formConfirmacion.fecha_salida,
          fecha_salida: formConfirmacion.fecha_regreso,
          noches: Number(formConfirmacion.hotel_noches) || 1,
          importe_total: Number(formConfirmacion.hotel_importe)
        }] : [],
        inscripcion: Number(formConfirmacion.congreso_importe) > 0 ? {
          nombre_congreso: formConfirmacion.congreso_nombre || 'Congreso / Jornadas',
          importe: Number(formConfirmacion.congreso_importe) || 0,
          pagada_por: formConfirmacion.congreso_pagada_por || 'investigador'
        } : undefined
      };

      // 3. Ejecutar cálculo determinista y generación documental oficial
      const respAct = await fetch(`/api/caso/${encodeURIComponent(targetCaso)}/actualizar_datos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extraccion: updatedExtraccion,
          tipo_tramite: selectedTemplate || 'dietas'
        })
      });
      const dataAct = await respAct.json();
      if (dataAct.error) throw new Error(dataAct.error);

      // Refrescar casoDetalle para mostrar los nuevos PDFs generados en el visor
      fetch(`/api/caso/${encodeURIComponent(targetCaso)}/detalle?tipo=${encodeURIComponent(selectedTemplate || '')}`)
        .then(r => r.json())
        .then(d => { if (d && !d.error) setCasoDetalle(d); })
        .catch(() => {});

      setResult(dataAct);
    } catch (e: any) {
      setError(e.message || 'Error al ejecutar la fiscalización del expediente.');
    } finally {
      setRunning(false);
    }
  }, [casoSel, files, formConfirmacion, tipoProyecto, selectedTemplate, organica, referenciaProyecto]);



  const reiniciarTramite = () => {

    setResult(null);

    setError('');

    setCurrentStep(1);

    setCasoSel('');

    setFiles([]);

    setTipoProyecto('');

    setOrganica('');

    setReferenciaProyecto('');

    setSelectedCasoEspecifico('');

    setSelectedSchemaPath('');

    setSelectedPlantilla('');

    setSelectedPromptExtraccion('');

    setSelectedPromptLiquidacion('');

    setSelectedPromptProyecto('');

    setFiltroConcepto(null);

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
    const insTarjetaInstImporte = insEsTarjetaInst ? insTotal : 0;
    const sup = liq.conceptos.suplidos?.importe || 0;
    const irpfRetencion = liq.resumen_economico?.retencion_irpf || liq.irpf?.retencion || 0;
    const irpfBase = liq.irpf?.base_sujeta || 0;

    // Gasto bruto total justificado
    const gastoTotalMision = man + tra + aloReal + insTotal + sup;

    // Totales oficiales según modelo UEx
    const totalDesplazamientos = man + tra + aloAbonable;
    const totalOtrosGastos = sup + insTotal;

    // Total líquido que se paga al investigador
    const liquidoTransferir = result.liquido_ag || (liq.resumen_economico?.liquido_a_abonar ?? (man + tra + aloAbonable + sup + (insEsTarjetaInst ? 0 : insTotal) - irpfRetencion));

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
      insTarjetaInstImporte,
      sup,
      irpfRetencion,
      irpfBase,
      gastoTotalMision,
      totalDesplazamientos,
      totalOtrosGastos,
      liquidoTransferir
    };

  }, [result]);



  const STEPS = [

    { num: 1, label: 'Procedimiento' },

    { num: 2, label: 'Documentación' },

    { num: 3, label: 'Proyecto y Normativa' },

    { num: 4, label: 'Confirmación' },

  ];



  const totalSteps = STEPS.length;

  const templateActivo = TEMPLATES.find(t => t.id === selectedTemplate);



  return (

    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>



      {/* Cabecera del Proceso */}

      <div className="view-header">

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

          <button 

            onClick={onVolver}

            className="uex-theme-btn"

            title="Volver"

            type="button"

          >

            <ChevronLeft size={18} />

          </button>

          <div>

            <div className="view-breadcrumb">

              <span>Gestión Económica UEx</span>

              <span>/</span>

              <span>Tramitación</span>

            </div>

            <h1 className="view-title">Liquidación y fiscalización de gastos</h1>

            <p className="view-desc">

              Cumplimentación de modelos oficiales SGTRI y verificación de requisitos de justificación económica.

            </p>

          </div>

        </div>



        {/* Indicador discreto del trámite activo */}

        <div className="view-actions">

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>

            Trámite: <strong style={{ color: 'var(--text-primary)' }}>{templateActivo?.titulo || selectedTemplate}</strong>

          </div>



          {result && (
            <div className="flex items-center gap-2">
              <Btn size="sm" variant="outline" onClick={() => { setResult(null); setCurrentStep(4); }}>
                <Edit3 size={13} />
                <span>Modificar datos y recalcular</span>
              </Btn>
              <Btn size="sm" variant="outline" onClick={reiniciarTramite}>
                <RotateCcw size={13} />
                <span>Nueva liquidación</span>
              </Btn>
            </div>
          )}

        </div>

      </div>



      {/* STEPPER EDITORIAL MINIMALISTA */}

      {!result && (

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>

          {STEPS.map((s) => {

            const isDone = currentStep > s.num;

            const isCurrent = currentStep === s.num;

            return (

              <button

                key={s.num}

                type="button"

                onClick={() => s.num < currentStep && setCurrentStep(s.num)}

                style={{

                  background: 'none',

                  border: 'none',

                  padding: 0,

                  display: 'flex',

                  alignItems: 'center',

                  gap: '6px',

                  cursor: s.num < currentStep ? 'pointer' : 'default',

                  opacity: s.num > currentStep ? 0.4 : 1,

                  color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-faint)'

                }}

              >

                <span style={{ 

                  fontFamily: 'var(--font-mono)', 

                  fontSize: '11px', 

                  color: isCurrent ? 'var(--brand-accent)' : 'inherit', 

                  fontWeight: isCurrent ? 600 : 400 

                }}>

                  0{s.num}

                </span>

                <span style={{ 

                  fontSize: '13px', 

                  fontWeight: isCurrent ? 600 : 400,

                  color: isCurrent ? 'var(--text-primary)' : 'inherit'

                }}>

                  {s.label}

                </span>

                {isDone && <Check size={12} style={{ color: 'var(--color-success)', marginLeft: '2px' }} />}

              </button>

            );

          })}

        </div>

      )}



      {/* CONTENIDO DEL WIZARD */}

      {!result && (

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.75rem' }}>

          

          {/* PASO 1: SELECCIONAR PROCEDIMIENTO */}

          {currentStep === 1 && (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

              <div>

                <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>

                  1. Selección del procedimiento administrativo

                </h2>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>

                  Seleccione el trámite a justificar. El sistema aplicará las reglas normativas de las Bases UEx 2026 y expedirá el conjunto documental oficial correspondiente.

                </p>

              </div>



              {/* LISTA ESTRUCTURADA DE PROCEDIMIENTOS PRINCIPALES */}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>

                  Procedimientos principales (Packs documentales normalizados)

                </span>



                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>

                  {[

                    {

                      id: 'dietas',

                      codigo: 'PROC-01',

                      titulo: 'Dietas y Desplazamientos',

                      desc: 'Liquidación oficial de comisiones de servicio: kilometraje en vehículo particular, billetes de avión/tren, alojamiento y manutención.',

                      modelos: 'Liquidación Oficial SGTRI (Dietas y Desplazamientos)',

                      normativa: 'Art. 32 Bases UEx 2026 · R.D. 462/2002'

                    },

                    {

                      id: 'pago_proveedor',

                      codigo: 'PROC-02',

                      titulo: 'Pago a Proveedor y Facturas Comerciales',

                      desc: 'Justificación de compras y contratos menores: compras con tarjeta de investigador o facturas electrónicas a abonar mediante transferencia.',

                      modelos: '01 Anexo II (Aprobación del Gasto) · 02 Anexo A (Justificación o Propuesta de Pago)',

                      normativa: 'Art. 30 Bases UEx 2026 · LCSP < 15.000 €'

                    },

                    {

                      id: 'honorarios',

                      codigo: 'PROC-03',

                      titulo: 'Honorarios por Conferencias y Seminarios',

                      desc: 'Retribución de conferenciantes invitados, ponentes y colaboradores extraordinarios en cursos de verano, seminarios o convenios.',

                      modelos: '01 Anexo A (Propuesta de Pago) · 02 Liquidación Honorarios · 03 Declaración Resp. · 04 Certificación Actividad',

                      normativa: 'Art. 19.4 Bases UEx 2026 (Límite máx. 300,00 €/h)'

                    }

                  ].map((proc, pIdx) => {

                    const isSel = selectedTemplate === proc.id;

                    return (

                      <div

                        key={proc.id}

                        onClick={() => setSelectedTemplate(proc.id)}

                        style={{

                          padding: '1.25rem',

                          borderBottom: pIdx < 2 ? '1px solid var(--border-color)' : 'none',

                          cursor: 'pointer',

                          backgroundColor: isSel ? 'var(--accent-50)' : 'transparent',

                          transition: 'background-color var(--transition-fast)',

                          display: 'flex',

                          alignItems: 'flex-start',

                          gap: '1rem'

                        }}

                      >

                        <input

                          type="radio"

                          name="proc_selector"

                          checked={isSel}

                          onChange={() => setSelectedTemplate(proc.id)}

                          style={{ marginTop: '3px', cursor: 'pointer' }}

                        />



                        <div style={{ flex: 1 }}>

                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>

                                {proc.codigo}

                              </span>

                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>

                                {proc.titulo}

                              </span>

                            </div>

                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>

                              {proc.normativa}

                            </span>

                          </div>



                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 6px', lineHeight: 1.5 }}>

                            {proc.desc}

                          </p>



                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>

                            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Documentos expedidos:</span>

                            <span>{proc.modelos}</span>

                          </div>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </div>



              {/* SECCIÓN SECUNDARIA: MODELOS INDIVIDUALES */}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>

                  Modelos individuales aislados

                </span>



                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>

                  {[

                    { id: 'anexo2_aprob', titulo: 'Anexo II – Aprobación de Gasto', desc: 'Autorización de gasto previo para proyectos de investigación.' },

                    { id: 'anexo_a', titulo: 'Anexo A – Justificación con Tarjeta / Transferencia', desc: 'Modelo oficial V.2.1 SGTRI para propuesta de pago o compras con tarjeta.' },

                    { id: 'cert', titulo: 'Certificación de Conferencias', desc: 'Acreditación oficial emitida por el director del curso o actividad.' },

                  ].map((m) => {

                    const isSel = selectedTemplate === m.id;

                    return (

                      <div

                        key={m.id}

                        onClick={() => setSelectedTemplate(m.id)}

                        style={{

                          padding: '0.75rem 1rem',

                          border: isSel ? '1px solid var(--brand-accent)' : '1px solid var(--border-color)',

                          backgroundColor: isSel ? 'var(--accent-50)' : 'transparent',

                          borderRadius: 'var(--radius-xs)',

                          cursor: 'pointer',

                          transition: 'all var(--transition-fast)'

                        }}

                      >

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                          <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)' }}>

                            {m.titulo}

                          </span>

                          {isSel && <Check size={12} style={{ color: 'var(--brand-accent)' }} />}

                        </div>

                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.4 }}>

                          {m.desc}

                        </p>

                      </div>

                    );

                  })}

                </div>

              </div>



            </div>

          )}



          {/* PASO 2: DOCUMENTACIÓN */}

          {currentStep === 2 && (

            <div className="space-y-6 animate-fade-in">

              <div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">2. Aportación de Justificantes y Documentación</h3>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">

                  {selectedTemplate === 'honorarios'

                    ? 'Importe un Excel plano de 2 columnas («Campo» y «Valor») o seleccione un expediente de honorarios registrado en el servidor.'

                    : 'Seleccione un expediente de pruebas preexistente o adjunte los documentos justificativos (PDFs, facturas, certificados, mapa de ruta).'}

                </p>

              </div>



              {selectedTemplate === 'honorarios' && (
                <>
                  <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(23, 107, 82, 0.3)', backgroundColor: 'rgba(23, 107, 82, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#176B52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#176B52' }}>
                          Procedimiento Oficial de Honorarios UEx (SGTRI)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Análisis multimodal de PDFs, imágenes y contratos, trazabilidad de comprobaciones administrativas y generación de los modelos oficiales UEx.
                        </div>
                      </div>
                    </div>
                    {onIrHonorarios && (
                      <button
                        type="button"
                        onClick={onIrHonorarios}
                        style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#176B52', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        <span>Abrir Honorarios</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>

                <FormularioHonorariosUEx

                  expedienteActivoId={casoSel}

                  onExpedienteCreado={(newCasoId, datos) => {

                    setCasoSel(newCasoId);

                    if (datos.referencia_proyecto) setReferenciaProyecto(datos.referencia_proyecto);

                    if (datos.organica) setOrganica(datos.organica);

                    if (datos.tipo_financiacion) {

                      setTipoProyecto(

                        datos.tipo_financiacion.toLowerCase().includes('estatal')

                          ? 'PLAN_ESTATAL'

                          : (datos.tipo_financiacion.toLowerCase().includes('convenio') || datos.tipo_financiacion.toLowerCase().includes('contrato'))

                          ? 'CONVENIO'

                          : 'REGIONAL'

                      );

                    }

                    // Forzar actualización inmediata del detalle del caso

                    fetch(`/api/caso/${newCasoId}/detalle`)

                      .then(r => r.json())

                      .then(d => setCasoDetalle(d))

                      .catch(() => {});

                  }}

                  onPlantillaDescargar={() => {

                    window.open('/api/honorarios/plantilla_excel', '_blank');

                  }}

                />
                </>

              )}



              {/* Selector Desplegable de Casos */}

              {casosFiltrados.length > 0 && (

                <div className="bg-[#FAF9F7] dark:bg-zinc-950/70 rounded-md border border-zinc-200/80 dark:border-zinc-800 overflow-hidden transition-all">

                  <div

                    onClick={() => setShowExpedientes(prev => !prev)}

                    className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors"

                  >

                    <div className="flex items-center gap-2">

                      <FolderOpen size={16} className="text-zinc-500 dark:text-zinc-400" />

                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">

                        Expedientes Registrados en el Servidor

                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-bold">

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

                              style={{

                                padding: '6px 10px',

                                borderRadius: 'var(--radius-sm)',

                                fontSize: '12px',

                                fontFamily: 'var(--font-mono)',

                                display: 'inline-flex',

                                alignItems: 'center',

                                gap: '6px',

                                border: isSel ? '1px solid var(--teal-600)' : '1px solid var(--border-color)',

                                backgroundColor: isSel ? 'var(--bg-secondary)' : 'var(--bg-surface)',

                                color: isSel ? 'var(--teal-700)' : 'var(--text-primary)',

                                fontWeight: isSel ? 600 : 400,

                                cursor: 'pointer'

                              }}

                            >

                              <FolderOpen size={13} style={{ color: isSel ? 'var(--teal-600)' : 'var(--text-secondary)' }} />

                              <span>{c.id}</span>

                              {c.total_archivos !== undefined && (

                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>

                                  ({c.total_archivos})

                                </span>

                              )}


                              {c.estado_validacion === 'error' && (

                                <span className="status-dot status-dot-danger" title="Faltan documentos obligatorios" />

                              )}

                              {c.estado_validacion === 'valido_con_advertencias' && (

                                <span className="status-dot status-dot-warning" title="Obligatorios completos (avisos opcionales)" />

                              )}

                              {c.estado_validacion === 'valido_completo' && (

                                <span className="status-dot status-dot-success" title="Expediente conforme" />

                              )}

                            </button>

                          );

                        })}

                      </div>

                    </div>

                  )}

                </div>

              )}



              {/* Campo para nombrar el nuevo expediente al subir desde cero */}
              {!casoSel && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Nombre o Referencia del Expediente <span className="text-zinc-400 font-normal">(opcional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nombreNuevoCaso}
                      onChange={(e) => setNombreNuevoCaso(e.target.value)}
                      placeholder="Ej: Viaje_Madrid_SISTEDES o Congreso_Sevilla_2026"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                    />
                    {nombreNuevoCaso && (
                      <button
                        type="button"
                        onClick={() => setNombreNuevoCaso('')}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 cursor-pointer"
                        title="Borrar nombre"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Indique un nombre identificativo para este expediente o déjelo en blanco si prefiere que se asigne automáticamente.
                  </p>
                </div>
              )}

              {/* Listado y Checklist de Documentos del Expediente Seleccionado */}

              {casoSel && (

                <div className="p-5 rounded-lg bg-[#FAF9F7] dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 space-y-4 animate-fade-in shadow-2xs">

                  {/* Cabecera del expediente */}

                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

                      <FolderOpen size={16} style={{ color: 'var(--text-secondary)' }} />

                      <div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>

                            {casoSel}

                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setNuevoNombreRenombrar(casoSel);
                              setModalRenombrarOpen(true);
                            }}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Cambiar el nombre o identificador del expediente"
                          >
                            <Edit3 size={11} />
                            <span>Renombrar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalEliminarOpen(true)}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid #fecaca',
                              backgroundColor: '#fff1f2',
                              color: '#b91c1c',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            className="hover:bg-red-100 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors"
                            title="Eliminar este expediente y todos sus documentos del servidor"
                          >
                            <Trash2 size={11} />
                            <span>Eliminar</span>
                          </button>

                          {casoDetalle?.tipo && (

                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>

                              [{casoDetalle.tipo === 'dietas' ? 'Liquidación / Dietas' : casoDetalle.tipo === 'pago_proveedor' ? 'Pago a Proveedor' : casoDetalle.tipo === 'honorarios' ? 'Honorarios' : casoDetalle.tipo}]

                            </span>

                          )}

                        </div>

                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>

                          {casoDetalle?.archivos?.length || 0} documentos identificados

                        </span>

                      </div>

                    </div>



                    <div>

                      {casoDetalle?.estado_validacion === 'error' ? (

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-danger)' }}>

                          <span className="status-dot status-dot-danger" />

                          <span>Faltan obligatorios</span>

                        </div>

                      ) : casoDetalle?.estado_validacion === 'valido_con_advertencias' ? (

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-warning)' }}>

                          <span className="status-dot status-dot-warning" />

                          <span>Avisos opcionales</span>

                        </div>

                      ) : (

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-success)' }}>

                          <span className="status-dot status-dot-success" />

                          <span>Expediente conforme</span>

                        </div>

                      )}

                    </div>

                  </div>



                  {/* Banner Explicativo de Estado de Validación */}

                  {casoDetalle?.estado_validacion === 'error' && (

                    <div className="alert alert-error">

                      <XCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                        <span style={{ fontWeight: 600 }}>

                          Faltan documentos obligatorios para tramitar este expediente:

                        </span>

                        <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: '11px' }}>

                          {casoDetalle.errores_obligatorios?.map((err: string, i: number) => (

                            <li key={i}>{err}</li>

                          ))}

                        </ul>

                      </div>

                    </div>

                  )}



                  {casoDetalle?.estado_validacion === 'valido_con_advertencias' && (

                    <div className="alert alert-warning">

                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                        <span style={{ fontWeight: 600 }}>

                          Documentos obligatorios completos (Faltan justificantes opcionales):

                        </span>

                        <p style={{ margin: 0, fontSize: '11px' }}>

                          El expediente es conforme para su tramitación. Los justificantes no aportados generarán advertencias en la fiscalización.

                        </p>

                      </div>

                    </div>

                  )}



                  {casoDetalle?.estado_validacion === 'valido_completo' && (

                    <div className="alert alert-success">

                      <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px' }} />

                      <div>

                        <span style={{ fontWeight: 600 }}>Expediente completo y acreditado</span>

                        <p style={{ margin: '2px 0 0', fontSize: '11px' }}>

                          Todos los documentos obligatorios y justificantes opcionales han sido detectados satisfactoriamente.

                        </p>

                      </div>

                    </div>

                  )}







                  {/* Listado Colapsable de Documentación y Justificantes de Entrada */}
                  {loadingDetalle ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 py-3 animate-pulse">
                      <Loader2 size={14} className="animate-spin text-[#176B52]" />
                      <span>Inspeccionando y auditando archivos del caso...</span>
                    </div>
                  ) : (
                    renderCardDocumentosEntrada(casoDetalle?.archivos, casoSel || '')
                  )}

                </div>

              )}



              {/* Estado de Subida en Progreso */}

              {uploadingFiles && (

                <div className="p-4 rounded-md bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-pulse font-medium">

                  <Loader2 size={16} className="animate-spin text-emerald-600" />

                  <span>Subiendo y evaluando requisitos documentales del expediente...</span>

                </div>

              )}



              {/* Zona de Arrastre de Archivos */}

              <div

                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}

                onDragLeave={() => setIsDragging(false)}

                onDrop={handleFileDrop}

                onClick={() => fileInputRef.current?.click()}

                className={cn(

                  "p-8 rounded-md border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3",

                  isDragging 

                    ? "border-zinc-900 dark:border-zinc-100 bg-[#FAF9F7] dark:bg-zinc-800/40" 

                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-[#FAF8F5]/40 dark:bg-zinc-950/30"

                )}

              >

                <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.xlsx" onChange={handleFileSelect} className="hidden" />

                <div className="w-12 h-12 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">

                  <UploadCloud size={24} />

                </div>

                <div>

                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">

                    Haga clic para subir archivos o arrástrelos aquí

                  </p>

                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">

                    Facturas de proveedor, tickets, certificados de asistencia o documentos justificativos

                  </p>

                </div>

              </div>



              {files.length > 0 && !casoSel && (

                <div className="space-y-2">

                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">

                    Documentos Adjuntados ({files.length})

                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                    {files.map((f, i) => (

                      <div key={i} className="flex items-center justify-between p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">

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

              {/* Alerta si faltan documentos obligatorios en el expediente seleccionado */}

              {tieneFicheroOExpediente && !tieneDocumentosObligatorios && casoDetalle?.errores_obligatorios && (

                <div className="p-3.5 rounded-md bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-200 space-y-1 animate-fade-in">

                  <div className="flex items-center gap-2 font-bold text-red-900 dark:text-red-100">

                    <AlertTriangle size={15} className="text-red-600 dark:text-red-400 shrink-0" />

                    <span>Faltan documentos obligatorios para tramitar este expediente:</span>

                  </div>

                  <ul className="list-disc list-inside pl-5 space-y-0.5 text-[11.5px] text-red-700 dark:text-red-300">

                    {casoDetalle.errores_obligatorios.map((err: string, i: number) => (

                      <li key={i}>{err}</li>

                    ))}

                  </ul>

                  <p className="text-[11px] text-red-600 dark:text-red-400 pt-1 font-medium">

                    No es posible continuar al Paso 3 hasta adjuntar todos los documentos obligatorios requeridos.

                  </p>

                </div>

              )}

            </div>

          )}



          {/* PASO 3: PROYECTO Y NORMATIVA */}

          {currentStep === 3 && (

            <div className="space-y-6 animate-fade-in">

              <div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">3. Datos del Proyecto e Imputación Presupuestaria</h3>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">

                  Indique la referencia del proyecto y la orgánica de gasto de la UEx. Ambos datos son obligatorios para la fiscalización contable y para su inclusión en los documentos oficiales.

                </p>

              </div>



              {/* Aviso si faltan campos obligatorios en el Paso 3 */}

              {!step3Valido && (

                <div 

                  style={{

                    backgroundColor: '#FFFDF5',

                    borderColor: '#FDE68A',

                    color: '#92400E'

                  }}

                  className="p-3.5 rounded-md border flex items-center gap-2.5 text-xs animate-fade-in shadow-2xs dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-200/90"

                >

                  <AlertTriangle size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />

                  <span>

                    <strong style={{ color: '#92400E' }} className="dark:text-amber-200">Campos obligatorios requeridos:</strong> Debe rellenar la <strong>Referencia del Proyecto</strong>, la <strong>Orgánica Presupuestaria</strong> y seleccionar el <strong>Tipo de Proyecto / Financiación</strong> para habilitar el botón de continuar.

                  </span>

                </div>

              )}



              {/* Inputs Explícitos de Referencia y Orgánica */}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>

                <div className="form-group">

                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>

                      <FileText size={13} style={{ color: 'var(--text-secondary)' }} />

                      Referencia / Código del Proyecto

                    </span>

                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#72122A', backgroundColor: '#FCECEF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E5A3B0', letterSpacing: '0.02em' }}>

                      Obligatorio

                    </span>

                  </label>

                  <input

                    type="text"

                    value={referenciaProyecto}

                    onChange={e => setReferenciaProyecto(e.target.value)}

                    placeholder="Ej: GR24099, TED2021-130901B-I00 o PID2021-123456OB"

                    className={`form-input ${!referenciaProyecto.trim() ? 'border-amber-400 dark:border-amber-600' : ''}`}

                  />

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>

                    Código identificativo oficial del proyecto, grupo o ayuda UEx financiadora.

                  </span>

                </div>



                <div className="form-group">

                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>

                      <Building2 size={13} style={{ color: 'var(--text-secondary)' }} />

                      Orgánica Presupuestaria UEx

                    </span>

                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#72122A', backgroundColor: '#FCECEF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E5A3B0', letterSpacing: '0.02em' }}>

                      Obligatorio

                    </span>

                  </label>

                  <input

                    type="text"

                    value={organica}

                    onChange={e => setOrganica(e.target.value)}

                    placeholder="Ej: 18.IW.A8.FA o 18.IW.97.89"

                    className={`form-input ${!organica.trim() ? 'border-amber-400 dark:border-amber-600' : ''}`}

                  />

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>

                    Código orgánico de la unidad de gasto (formato 18.XX.XX o 18.XX.XX.XX).

                  </span>

                </div>

                {/* Campo Orgánica Secundaria en Paso 3 integrado armónicamente */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Building2 size={13} style={{ color: 'var(--text-secondary)' }} />
                      Orgánica Secundaria UEx
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 500, color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', letterSpacing: '0.02em' }}>
                      Opcional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={organicaSecundaria}
                    onChange={e => {
                      const val = e.target.value;
                      setOrganicaSecundaria(val);
                      setEsMultiorganica(Boolean(val.trim()));
                    }}
                    placeholder="Ej: 18.IW.00 (cofinanciación)"
                    className="form-input"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Segunda unidad de gasto si es multiorgánica (genera Anexo II).
                  </span>
                </div>

              </div>



              {/* Selector Oficial de Financiación / Tipo de Proyecto */}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>

                  <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: 0 }}>

                    Tipo de Proyecto / Financiación (Portal UEx)

                  </h4>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>

                    Asigna automáticamente el marco normativo y la fiscalidad

                  </span>

                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>

                  Seleccione el tipo de proyecto o ayuda UEx al que se imputa el gasto (idéntico al desplegable oficial de liquidaciones SGTRI). Cada opción vincula su régimen legal (R.D. 462/2002 estatal o Decreto 42/2025 autonómico) y sus retenciones de IRPF. Pulse en <strong>Info</strong> para consultar los baremos y fiscalidad detallada de cada uno.

                </p>



                {/* Contenedor en Lista Vertical */}

                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg-surface)', marginTop: '0.35rem' }}>

                  {PROYECTOS_UEX_OFICIALES.map((m, idx) => {

                    const isSel = tipoProyecto === m.id;

                    const isLast = idx === PROYECTOS_UEX_OFICIALES.length - 1;



                    return (

                      <div

                        key={m.id}

                        onClick={() => setTipoProyecto(m.id)}

                        style={{

                          padding: '0.75rem 1.15rem',

                          borderBottom: isLast ? 'none' : '1px solid var(--border-color)',

                          backgroundColor: isSel ? 'var(--accent-50)' : 'transparent',

                          cursor: 'pointer',

                          display: 'flex',

                          alignItems: 'center',

                          justifyContent: 'space-between',

                          gap: '1rem',

                          transition: 'background-color 0.15s ease'

                        }}

                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40"

                      >

                        {/* Izquierda: Radio + Título + Badges Normativos */}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>

                          <input

                            type="radio"

                            name="regimen_financiacion"

                            checked={isSel}

                            onChange={() => setTipoProyecto(m.id)}

                            style={{ cursor: 'pointer', accentColor: 'var(--teal-600)', flexShrink: 0 }}

                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>

                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>

                              {m.nombre}

                            </span>



                            {/* Badge de Normativa Oficial */}

                            <span style={{ 

                              fontSize: '10px', 

                              fontFamily: 'var(--font-mono)', 

                              fontWeight: 600,

                              color: m.esJunta ? '#92400E' : '#1E40AF', 

                              backgroundColor: m.esJunta ? '#FEF3C7' : '#EFF6FF', 

                              border: `1px solid ${m.esJunta ? '#FCD34D' : '#BFDBFE'}`, 

                              padding: '1px 6px', 

                              borderRadius: '4px', 

                              whiteSpace: 'nowrap'

                            }}>

                              {m.normativa}

                            </span>



                            {/* Badge de Régimen Fiscal */}

                            <span style={{ 

                              fontSize: '10px', 

                              fontWeight: 600,

                              color: m.esJunta ? '#991B1B' : '#166534', 

                              backgroundColor: m.esJunta ? '#FEF2F2' : '#F0FDF4', 

                              border: `1px solid ${m.esJunta ? '#FECACA' : '#BBF7D0'}`, 

                              padding: '1px 6px', 

                              borderRadius: '4px', 

                              whiteSpace: 'nowrap'

                            }}>

                              {m.fiscalidad}

                            </span>

                          </div>

                        </div>



                        {/* Derecha: Botón de Información + Selector */}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>

                          <button

                            type="button"

                            onClick={(e) => {

                              e.stopPropagation();

                              setModalProyectoInfo(m);

                            }}

                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-2xs cursor-pointer"

                            title={`Consultar normativa, baremos e IRPF de ${m.nombre}`}

                          >

                            <Info size={13} className="text-[#176B52] dark:text-[#86EFAC]" />

                            <span>Info</span>

                          </button>



                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: isSel ? 'var(--teal-600)' : 'var(--text-secondary)', minWidth: '82px', textAlign: 'right' }}>

                            {isSel ? '✓ Seleccionado' : 'Seleccionar'}

                          </span>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </div>



              {/* Casos Específicos del Procedimiento (Cargados dinámicamente) */}

              {procedimientosConfig[selectedTemplate]?.casos && Object.keys(procedimientosConfig[selectedTemplate].casos).length > 0 && (

                <div className="space-y-3">

                  <div className="flex items-center justify-between">

                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">

                      <Layers size={14} className="text-zinc-600 dark:text-zinc-300" />

                      Modalidad o Caso del Trámite

                    </h4>

                    <span className="text-[10px] text-zinc-400">Seleccione el supuesto concreto para asignar el esquema idóneo</span>

                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

                    {Object.entries(procedimientosConfig[selectedTemplate].casos).map(([caseKey, cObj]: [string, any]) => {

                      const isSel = selectedCasoEspecifico === caseKey;

                      return (

                        <div

                          key={caseKey}

                          onClick={() => handleSelectCasoEspecifico(caseKey)}

                          className={`selection-card ${isSel ? 'selected' : ''}`}

                          style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}

                        >

                          <div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>

                              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>

                                {cObj.nombre}

                              </h5>

                              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>

                                {caseKey.replace('caso_', '').toUpperCase()}

                              </span>

                            </div>

                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>

                              {cObj.descripcion}

                            </p>

                          </div>

                          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>

                            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>

                              {cObj.esquema_extraccion?.split('/').pop()}

                            </span>

                            <span style={{ fontWeight: 600, color: isSel ? 'var(--teal-600)' : 'var(--text-secondary)' }}>

                              {isSel ? '✓ Seleccionado' : 'Seleccionar'}

                            </span>

                          </div>

                        </div>

                      );

                    })}

                  </div>

                </div>

              )}



              

            </div>

          )}



          {/* PASO 4: CONFIRMACIÓN Y COMPROBACIÓN DE DATOS */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>4. Comprobación de Datos Extraídos y Validación</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Revise y ajuste los datos extraídos del expediente antes de generar la liquidación oficial determinista. Cualquier modificación actualizará el cálculo final y los documentos oficiales emitidos.
                </p>
              </div>

              {loadingExtraccionForm ? (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Loader2 className="animate-spin text-[#176B52] mx-auto mb-3" size={28} />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Cargando y analizando datos documentales del expediente...
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* BLOQUE 1: DATOS DEL PERCEPTOR Y CUENTA BANCARIA */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-emerald-50 text-[#176B52] dark:bg-emerald-950/40 dark:text-emerald-400">
                          <User size={15} />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          1. Datos del Perceptor / Comisionado
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        Fiscalización Personal
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Nombre y Apellidos
                        </label>
                        <input
                          type="text"
                          value={formConfirmacion.comisionado}
                          onChange={(e) => setFormConfirmacion(prev => ({ ...prev, comisionado: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          placeholder="Ej: Dr. Juan Pérez Ejemplo"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          DNI / NIF
                        </label>
                        <input
                          type="text"
                          value={formConfirmacion.dni}
                          onChange={(e) => setFormConfirmacion(prev => ({ ...prev, dni: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          placeholder="12345678Z"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Grupo de Dieta UEx
                        </label>
                        <select
                          value={formConfirmacion.grupo_dieta}
                          onChange={(e) => setFormConfirmacion(prev => ({ ...prev, grupo_dieta: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                        >
                          <option value="2">Grupo 2 (PDI, PAS, Investigadores)</option>
                          <option value="1">Grupo 1 (Rector, Vicerrectores, Decanos)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 lg:col-span-4">
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          IBAN Bancario de Abono
                        </label>
                        <input
                          type="text"
                          value={formConfirmacion.iban}
                          onChange={(e) => setFormConfirmacion(prev => ({ ...prev, iban: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          placeholder="ES91 2048 0123 4567 8901 2345"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE 2: DESPLAZAMIENTO Y FECHAS DE LA COMISIÓN */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-emerald-50 text-[#176B52] dark:bg-emerald-950/40 dark:text-emerald-400">
                          <Calendar size={15} />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          2. Fechas, Horarios e Itinerario
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        Cómputo Horario
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Itinerario Completo
                        </label>
                        <input
                          type="text"
                          value={formConfirmacion.itinerario}
                          onChange={(e) => setFormConfirmacion(prev => ({ ...prev, itinerario: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          placeholder="Ej: Cáceres -> Alicante -> Cáceres"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Motivo de la Comisión
                        </label>
                        <input
                          type="text"
                          value={formConfirmacion.motivo}
                          onChange={(e) => setFormConfirmacion(prev => ({ ...prev, motivo: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          placeholder="Ej: Asistencia a Jornadas SISTEDES 2026..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Salida Oficial (Fecha y Hora)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={formConfirmacion.fecha_salida}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, fecha_salida: e.target.value }))}
                            className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          />
                          <input
                            type="time"
                            value={formConfirmacion.hora_salida}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, hora_salida: e.target.value }))}
                            className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Regreso Oficial (Fecha y Hora)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={formConfirmacion.fecha_regreso}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, fecha_regreso: e.target.value }))}
                            className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          />
                          <input
                            type="time"
                            value={formConfirmacion.hora_regreso}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, hora_regreso: e.target.value }))}
                            className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE 3: IMPUTACIÓN PRESUPUESTARIA */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-emerald-50 text-[#176B52] dark:bg-emerald-950/40 dark:text-emerald-400">
                          <Building2 size={15} />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          3. Imputación Presupuestaria y Régimen Fiscal
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        Contabilidad UEx
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Referencia del Proyecto
                        </label>
                        <input
                          type="text"
                          value={formConfirmacion.referencia}
                          onChange={(e) => {
                            setFormConfirmacion(prev => ({ ...prev, referencia: e.target.value }));
                            setReferenciaProyecto(e.target.value);
                          }}
                          className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          placeholder="Ej: PID2021-125890OB-I00"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Orgánica Presupuestaria Principal
                        </label>
                        <input
                          type="text"
                          value={formConfirmacion.organica}
                          onChange={(e) => {
                            setFormConfirmacion(prev => ({ ...prev, organica: e.target.value }));
                            setOrganica(e.target.value);
                          }}
                          className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          placeholder="Ej: 18.IW.A8.FA"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                          Tipo de Financiación / Fiscalidad
                        </label>
                        <select
                          value={formConfirmacion.tipo_proyecto || tipoProyecto}
                          onChange={(e) => {
                            setFormConfirmacion(prev => ({ ...prev, tipo_proyecto: e.target.value }));
                            setTipoProyecto(e.target.value);
                          }}
                          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                        >
                          <option value="G24">Ayudas a grupos o proyectos GR24/IB24 (R.D. 462/2002 · Exento)</option>
                          <option value="PEI">Plan Estatal de Investigación (R.D. 462/2002 · Exento)</option>
                          <option value="NAL">Otros proyectos R.D. 462/2002 (Régimen Estatal · Exento)</option>
                          <option value="UEX">Contratos y convenios UEx (Decreto 42/2025)</option>
                          <option value="JEX">Otros proyectos Decreto 42/2025 (Junta Extremadura)</option>
                          <option value="PCO">Planes Complementarios (Decreto 42/2025)</option>
                        </select>
                      </div>
                    </div>

                    {/* Módulo Multiorgánica en Paso 4 - Discreto y sobrio */}
                    <div className="mt-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={formConfirmacion.es_multiorganica}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormConfirmacion(prev => ({
                                ...prev,
                                es_multiorganica: checked,
                                organica_secundaria: checked ? (prev.organica_secundaria || '') : ''
                              }));
                              setEsMultiorganica(checked);
                            }}
                            className="rounded text-[#176B52] focus:ring-[#176B52] w-4 h-4"
                          />
                          <span>Cofinanciación Multiorgánica (Imputación presupuestaria compartida)</span>
                        </label>
                        {formConfirmacion.es_multiorganica && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            Genera Anexo II
                          </span>
                        )}
                      </div>

                      {formConfirmacion.es_multiorganica && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                              Orgánica Secundaria UEx
                            </label>
                            <input
                              type="text"
                              value={formConfirmacion.organica_secundaria}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormConfirmacion(prev => ({ ...prev, organica_secundaria: val }));
                                setOrganicaSecundaria(val);
                              }}
                              placeholder="Ej: 18.IW.00"
                              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                              Criterio de Desglose
                            </label>
                            <input
                              type="text"
                              value={formConfirmacion.cofinanciacion_regla}
                              onChange={(e) => setFormConfirmacion(prev => ({ ...prev, cofinanciacion_regla: e.target.value }))}
                              placeholder="Ej: Imputar parking a 18.IW.00 y el resto a 18.IW.A8.FA"
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BLOQUE 4: GASTOS Y JUSTIFICANTES EXTRAÍDOS */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-emerald-50 text-[#176B52] dark:bg-emerald-950/40 dark:text-emerald-400">
                          <Receipt size={15} />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          4. Justificantes de Gasto Extraídos
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        Baremos y Tarifas 2026
                      </span>
                    </div>

                    {/* Selector de modo de transporte */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Modo de Transporte:
                        </span>

                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormConfirmacion(prev => ({
                              ...prev,
                              tipo_transporte: 'vehiculo_particular',
                              importe_transporte_publico: 0,
                              descripcion_transporte: ''
                            }))}
                            className={cn(
                              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
                              formConfirmacion.tipo_transporte === 'vehiculo_particular'
                                ? "shadow-xs"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                            style={{
                              border: formConfirmacion.tipo_transporte === 'vehiculo_particular' ? '1px solid #176B52' : '1px solid #D4D4D8',
                              backgroundColor: formConfirmacion.tipo_transporte === 'vehiculo_particular' ? '#176B52' : '#FFFFFF',
                              color: formConfirmacion.tipo_transporte === 'vehiculo_particular' ? '#FFFFFF' : '#27272A',
                              outline: 'none',
                            }}
                          >
                            <Car size={15} style={{ color: formConfirmacion.tipo_transporte === 'vehiculo_particular' ? '#FFFFFF' : '#71717A' }} />
                            <span>Vehículo Particular (0,26 €/km)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormConfirmacion(prev => ({
                              ...prev,
                              tipo_transporte: 'transporte_publico',
                              km: 0,
                              matricula: '',
                              marca: '',
                              modelo: ''
                            }))}
                            className={cn(
                              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
                              formConfirmacion.tipo_transporte === 'transporte_publico'
                                ? "shadow-xs"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                            style={{
                              border: formConfirmacion.tipo_transporte === 'transporte_publico' ? '1px solid #176B52' : '1px solid #D4D4D8',
                              backgroundColor: formConfirmacion.tipo_transporte === 'transporte_publico' ? '#176B52' : '#FFFFFF',
                              color: formConfirmacion.tipo_transporte === 'transporte_publico' ? '#FFFFFF' : '#27272A',
                              outline: 'none',
                            }}
                          >
                            <Train size={15} style={{ color: formConfirmacion.tipo_transporte === 'transporte_publico' ? '#FFFFFF' : '#71717A' }} />
                            <span>Transporte Público (Tren / Avión / Bus)</span>
                          </button>
                        </div>
                      </div>

                      {formConfirmacion.tipo_transporte === 'vehiculo_particular' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-lg bg-zinc-50/60 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                                Kilómetros Recorridos
                              </label>
                              <span className="text-[10px] font-bold font-mono text-[#176B52] dark:text-[#86EFAC]">
                                = {(Number(formConfirmacion.km || 0) * 0.26).toFixed(2)} €
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={formConfirmacion.km}
                              onChange={(e) => setFormConfirmacion(prev => ({ ...prev, km: Number(e.target.value) }))}
                              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                              Matrícula del Vehículo
                            </label>
                            <input
                              type="text"
                              value={formConfirmacion.matricula}
                              onChange={(e) => setFormConfirmacion(prev => ({ ...prev, matricula: e.target.value.toUpperCase() }))}
                              className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                              placeholder="4026GNW"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                              Marca
                            </label>
                            <input
                              type="text"
                              value={formConfirmacion.marca}
                              onChange={(e) => setFormConfirmacion(prev => ({ ...prev, marca: e.target.value }))}
                              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                              placeholder="BMW, Renault..."
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                              Modelo
                            </label>
                            <input
                              type="text"
                              value={formConfirmacion.modelo}
                              onChange={(e) => setFormConfirmacion(prev => ({ ...prev, modelo: e.target.value }))}
                              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                              placeholder="Serie 1, Clio..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-lg bg-zinc-50/60 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                              Importe Billetes Transporte (€)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formConfirmacion.importe_transporte_publico}
                              onChange={(e) => setFormConfirmacion(prev => ({ ...prev, importe_transporte_publico: Number(e.target.value) }))}
                              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                              Descripción / Trayecto Billete
                            </label>
                            <input
                              type="text"
                              value={formConfirmacion.descripcion_transporte}
                              onChange={(e) => setFormConfirmacion(prev => ({ ...prev, descripcion_transporte: e.target.value }))}
                              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                              placeholder="Billete de tren (AVE / MD) Cáceres-Alicante..."
                            />
                          </div>
                        </div>
                      )}

                      {/* Suplidos: Peajes y Parking */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                            Peajes de Autopista (€)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formConfirmacion.peajes}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, peajes: Number(e.target.value) }))}
                            className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                            Parking / Estacionamiento (€)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formConfirmacion.parking}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, parking: Number(e.target.value) }))}
                            className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                            Nombre Hotel / Establecimiento
                          </label>
                          <input
                            type="text"
                            value={formConfirmacion.hotel_nombre}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, hotel_nombre: e.target.value }))}
                            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                            placeholder="Hotel / Residencia..."
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                              Factura Alojamiento (€)
                            </label>
                            <span className="text-[10px] text-zinc-400">
                              {formConfirmacion.hotel_noches || 1} noches
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formConfirmacion.hotel_importe}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, hotel_importe: Number(e.target.value) }))}
                            className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          />
                        </div>
                      </div>

                      {/* Inscripción a Congreso */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                            Nombre del Congreso / Jornadas Oficiales
                          </label>
                          <input
                            type="text"
                            value={formConfirmacion.congreso_nombre}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, congreso_nombre: e.target.value }))}
                            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                            placeholder="Ej: Jornadas SISTEDES 2026..."
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                            Cuota de Inscripción (€)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formConfirmacion.congreso_importe}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, congreso_importe: Number(e.target.value) }))}
                            className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                            Medio de Pago Inscripción
                          </label>
                          <select
                            value={formConfirmacion.congreso_pagada_por}
                            onChange={(e) => setFormConfirmacion(prev => ({ ...prev, congreso_pagada_por: e.target.value }))}
                            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                          >
                            <option value="investigador">Personal investigador (Reembolsable)</option>
                            <option value="tarjeta_investigador">Tarjeta investigador / Corporate (Reembolsable)</option>
                            <option value="tarjeta_institucional">Tarjeta Institucional UEx (No transferible)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ALERTA Y BOTONES DE EJECUCIÓN */}
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#176B52] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Validación y Fiscalización Oficial UEx
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        Al ejecutar la liquidación, el motor normativo de presupuestos aplicará automáticamente los límites de alojamiento (102,56 €/noche), manutención según tramos horarios de salida/llegada, kilometraje a 0,26 €/km y régimen fiscal IRPF según la imputación seleccionada.
                      </p>
                    </div>
                  </div>

                  {mensajeGuardadoExitoso && (
                    <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                      <Check size={15} />
                      <span>{mensajeGuardadoExitoso}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={guardarSoloDatos}
                      disabled={guardandoCorrecciones || running}
                      className="btn btn-outline w-full sm:w-auto px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer flex items-center justify-center gap-2 transition-all shadow-2xs"
                    >
                      {guardandoCorrecciones ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Guardando datos...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck size={14} />
                          <span>Guardar datos comprobados</span>
                        </>
                      )}
                    </button>

                    <Btn
                      size="lg"
                      variant="primary"
                      disabled={running || !tieneFicheroOExpediente}
                      onClick={ejecutar}
                      className="w-full sm:w-auto px-8 shadow-md cursor-pointer rounded-lg"
                    >
                      {running ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" /> Fiscalizando expediente...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 font-bold">
                          <Play size={16} /> Ejecutar Liquidación Oficial UEx
                        </span>
                      )}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BOTONES DE NAVEGACIÓN */}

          <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">

            {currentStep > 1 ? (

              <Btn 

                size="sm" 

                variant="outline" 

                onClick={() => {

                  setCurrentStep(prev => prev - 1);

                  window.scrollTo({ top: 0, behavior: 'smooth' });

                }} 

                disabled={running} 

                className="cursor-pointer rounded-md"

              >

                <ChevronLeft size={16} className="mr-1" /> Anterior

              </Btn>

            ) : <div />}



            {currentStep < totalSteps && (

              <div className="flex items-center gap-3">

                {currentStep === 2 && !step2Valido && tieneFicheroOExpediente && (

                  <span style={{ color: '#72122A', backgroundColor: '#FCECEF', borderColor: '#E5A3B0' }} className="text-xs font-medium px-2.5 py-1 rounded border dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">

                    Faltan documentos obligatorios

                  </span>

                )}

                {currentStep === 3 && !step3Valido && (

                  <span style={{ color: '#78350F', backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }} className="text-xs font-medium px-2.5 py-1 rounded border dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">

                    Referencia, Orgánica y Financiación requeridas

                  </span>

                )}

                <Btn 

                  size="sm" 

                  variant="primary" 

                  onClick={() => {

                    if (puedeAvanzar) {

                      setCurrentStep(prev => prev + 1);

                      window.scrollTo({ top: 0, behavior: 'smooth' });

                    }

                  }} 

                  disabled={!puedeAvanzar || running}

                  className="cursor-pointer rounded-md font-medium"

                >

                  Siguiente <ChevronRight size={16} className="ml-1" />

                </Btn>

              </div>

            )}

          </div>

        </div>

      )}



      {/* ESTADO EN EJECUCIÓN CON VISOR DE LOGS */}

      {running && activeTaskId && (

        <div className="space-y-4">

          <RunningInfo text="Ejecutando Fiscalización y Liquidación del Expediente..." sub="Cotejando facturas, aplicando límites presupuestarios y generando documentación oficial" />

          <LogViewer raw={taskLogs} />

        </div>

      )}



      {/* ERROR */}

      {error && <AlertErr msg={error} />}



      {/* ========================================================================= */}

      {/* VISTA OFICIAL DE RESULTADOS */}

      {/* ========================================================================= */}

      {result && (

        <div ref={resultRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

          {/* DOCUMENTACIÓN Y JUSTIFICANTES DE ENTRADA (COLAPSABLE EN 2 COLUMNAS, OCULTO POR DEFECTO) */}
          {renderCardDocumentosEntrada(casoDetalle?.archivos, result.caso_id)}



          {/* 1. DICTAMEN OFICIAL DE FISCALIZACIÓN */}

          <div className="panel" style={{ padding: '1.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>

              <div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>

                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>

                    Dictamen de Fiscalización

                  </span>

                  <StatusBadge ok={result.ok} sinGt={result.sin_ground_truth} />

                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>

                    · {(result.liquidacion as any)?.fiscalizacion_presupuestos_2026?.normativa_marco || (

                      result.liquidacion && (result.liquidacion as any).identificacion?.fuente_financiacion === 'extremadura' 

                        ? 'Decreto 42/2025' 

                        : 'Presupuestos UEx 2026 / RD 462/2002'

                    )}

                  </span>

                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', margin: 0 }}>

                  Expediente: {result.caso_id}

                </h2>

              </div>



              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>

                <button 

                  type="button"

                  onClick={() => window.open(`/api/txt/generar/${result.caso_id}?template=${selectedTemplate}`, '_blank')} 

                  className="btn btn-outline btn-sm"

                  title="Descargar informe oficial consolidado en formato texto plano (TXT)"

                >

                  <FileText size={14} />

                  <span>Memoria Resumen (TXT)</span>

                </button>



                {selectedTemplate === 'pago_proveedor' ? (

                  <>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=anexo2`, '_blank')} 

                      className="btn btn-secondary btn-sm"

                    >

                      <Download size={13} />

                      <span>Anexo II</span>

                    </button>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=anexo_a`, '_blank')} 

                      className="btn btn-primary btn-sm"

                    >

                      <Download size={13} />

                      <span>Anexo A</span>

                    </button>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pack/descargar_zip/${result.caso_id}`, '_blank')} 

                      className="btn btn-outline btn-sm"

                    >

                      <Download size={13} />

                      <span>Pack Completo (ZIP)</span>

                    </button>

                  </>

                ) : selectedTemplate === 'honorarios' ? (

                  <>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=anexo_a`, '_blank')} 

                      className="btn btn-primary btn-sm"

                      title="Anexo A - Propuesta de Pago oficial por Transferencia"

                    >

                      <Download size={13} />

                      <span>Anexo A (Propuesta de Pago)</span>

                    </button>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=declaracion_honorarios`, '_blank')} 

                      className="btn btn-secondary btn-sm"

                      title="Declaración Responsable oficial de Incompatibilidades"

                    >

                      <FileCheck size={13} />

                      <span>Declaración Resp.</span>

                    </button>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=dietas`, '_blank')} 

                      className="btn btn-secondary btn-sm"

                      title="Liquidación Oficial SGTRI de Honorarios"

                    >

                      <Download size={13} />

                      <span>Liquidación Honorarios</span>

                    </button>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pack/descargar_zip/${result.caso_id}`, '_blank')} 

                      className="btn btn-outline btn-sm"

                      title="Descargar lote oficial de honorarios completo en ZIP"

                    >

                      <Download size={13} />

                      <span>Pack Completo (ZIP)</span>

                    </button>

                  </>

                ) : (

                  <>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=dietas`, '_blank')} 

                      className="btn btn-primary btn-sm"

                      title="Liquidación Oficial SGTRI de Dietas y Desplazamientos"

                    >

                      <Download size={13} />

                      <span>Liquidación Oficial SGTRI (PDF)</span>

                    </button>

                    {Boolean((result.liquidacion as any)?.requiere_anexo2 || (result.extraccion as any)?.requiere_anexo2) && (

                      <button 

                        type="button"

                        onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=anexo2`, '_blank')} 

                        className="btn btn-secondary btn-sm"

                        title="Anexo II - Aprobación del Gasto (Modelo Oficial UEx 2026)"

                      >

                        <FileCheck size={13} />

                        <span>Anexo II (Aprobación Gasto)</span>

                      </button>

                    )}

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pdf/generar/${result.caso_id}?template=anexo_a`, '_blank')} 

                      className="btn btn-secondary btn-sm"

                      title="Anexo A - Justificación de Gastos con Tarjeta o Propuesta de Pago"

                    >

                      <CreditCard size={13} />

                      <span>{((balanceFinanciero?.insTotal || 0) > 0 || (result.liquidacion as any)?.conceptos?.inscripcion?.importe_total > 0) ? 'Anexo A (Tarjeta)' : 'Anexo A'}</span>

                    </button>

                    <button 

                      type="button"

                      onClick={() => window.open(`/api/pack/descargar_zip/${result.caso_id}`, '_blank')} 

                      className="btn btn-outline btn-sm"

                      title="Descargar pack documental oficial completo en formato ZIP"

                    >

                      <Download size={13} />

                      <span>Pack Completo (ZIP)</span>

                    </button>

                  </>

                )}

              </div>

            </div>



            {/* CUADRO DE IMPORTES CLAVE (RECONCILIACIÓN DEL GASTO) */}

            {selectedTemplate === 'pago_proveedor' ? (

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>

                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Total Factura</span>

                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>

                    {fmtEur(result.extraccion?.factura?.importe_total || result.liquidacion?.resumen_economico?.total_factura || result.liquido_ag)}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>

                    Proveedor: {result.extraccion?.factura?.proveedor || 'Identificado'}

                  </span>

                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Base Imponible</span>

                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>

                    {fmtEur(result.extraccion?.factura?.base_imponible || result.liquidacion?.resumen_economico?.base_imponible || 0)}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Previo a IVA y retenciones</span>

                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Medio de Pago</span>

                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textTransform: 'capitalize' }}>

                    {result.extraccion?.pago?.forma_pago || 'Tarjeta'}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>

                    {result.extraccion?.pago?.num_tarjeta ? `Tarjeta: ${result.extraccion.pago.num_tarjeta}` : 'Gestión Central'}

                  </span>

                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #176B52', background: 'linear-gradient(135deg, rgba(23, 107, 82, 0.08) 0%, rgba(23, 107, 82, 0.02) 100%)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 8px rgba(23, 107, 82, 0.08)' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#176B52' }}>Líquido a Tramitar</span>

                  <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#176B52' }}>

                    {fmtEur(result.liquido_ag)}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>

                    Orgánica: {result.extraccion?.proyecto?.organica || 'UEx'}

                  </span>

                </div>

              </div>

            ) : selectedTemplate === 'honorarios' ? (

              <>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>

                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Importe Bruto</span>

                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>

                    {fmtEur(result.extraccion?.honorarios?.importe_total || result.liquidacion?.resumen_economico?.importe_bruto || result.liquido_ag)}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>

                    Docente: {result.extraccion?.beneficiario?.nombre || 'Ponente'}

                  </span>

                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid #FECDD3', backgroundColor: 'rgba(255, 241, 242, 0.5)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#BE123C' }}>Retención IRPF (15%)</span>

                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#BE123C' }}>

                    -{fmtEur(result.liquidacion?.resumen_economico?.retencion_irpf || ((result.liquido_ag || 0) * 0.15))}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Retención legal a cuenta</span>

                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Tope Art. 19.4 UEx 2026</span>

                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>

                    Máx 300,00 €/h

                  </span>

                  <span style={{ fontSize: '11.5px', color: '#065F46' }}>✓ Conforme bases 2026</span>

                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #176B52', background: 'linear-gradient(135deg, rgba(23, 107, 82, 0.08) 0%, rgba(23, 107, 82, 0.02) 100%)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 8px rgba(23, 107, 82, 0.08)' }}>

                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#176B52' }}>Líquido Neto</span>

                  <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#176B52' }}>

                    {fmtEur(result.liquidacion?.resumen_economico?.liquido_a_abonar || result.liquido_ag)}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Transferencia bancaria</span>

                </div>

              </div>



                <DocumentosSalidaHonorarios

                  casoId={result.caso_id}

                  modalidad={(result.extraccion as any)?.honorarios?.modalidad || (result.extraccion as any)?.modalidad || (result.liquidacion as any)?.modalidad || 'premio'}

                  beneficiario={(result.extraccion as any)?.beneficiario?.nombre || (result.liquidacion as any)?.identificacion?.investigador}

                  requiereCertificacion={Boolean((result.extraccion as any)?.confirmar_certificacion || (result.liquidacion as any)?.confirmar_certificacion)}

                />

              </>

            ) : (

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>

                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Coste Total Comisión</span>

                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Devengado</span>

                  </div>

                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>

                    {fmtEur(balanceFinanciero ? balanceFinanciero.gastoTotalMision : result.liquido_ag)}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {balanceFinanciero ? `Desplazamientos: ${fmtEur(balanceFinanciero.totalDesplazamientos)} · Otros: ${fmtEur(balanceFinanciero.totalOtrosGastos)}` : 'Total facturas, billetes y dietas'}
                  </span>

                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: (balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? '1px solid #C7D2FE' : '1px solid var(--border-color)', backgroundColor: (balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? 'rgba(238, 242, 255, 0.5)' : 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: (balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? '#4338CA' : 'var(--text-muted)' }}>Tarjeta Institucional</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: (balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? '#E0E7FF' : 'var(--bg-secondary)', color: (balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? '#3730A3' : 'var(--text-secondary)' }}>
                      {(balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? 'Abonado UEx' : 'Sin tarjeta'}
                    </span>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: (balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? '#4338CA' : 'var(--text-primary)' }}>
                    {(balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? `-${fmtEur(balanceFinanciero?.insTarjetaInstImporte || 0)}` : '0,00 €'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {(balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? 'Abonado directamente por UEx (no transferible)' : 'Sin cargos de tarjeta institucional'}
                  </span>
                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? '1px solid #FECDD3' : '1px solid var(--border-color)', backgroundColor: balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? 'rgba(255, 241, 242, 0.5)' : 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? '#BE123C' : 'var(--text-muted)' }}>

                      {balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? 'Retención IRPF (15%)' : balanceFinanciero && balanceFinanciero.aloExceso > 0 ? 'Exceso Hotel Excluido' : 'Retención IRPF'}

                    </span>

                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? '#FFE4E6' : 'var(--bg-secondary)', color: balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? '#9F1239' : 'var(--text-secondary)' }}>

                      {balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? 'Exceso fiscal' : '100% Exento'}

                    </span>

                  </div>

                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: balanceFinanciero && balanceFinanciero.irpfRetencion > 0 ? '#BE123C' : 'var(--text-primary)' }}>

                    {balanceFinanciero && balanceFinanciero.irpfRetencion > 0

                      ? `-${fmtEur(balanceFinanciero.irpfRetencion)}`

                      : balanceFinanciero && balanceFinanciero.aloExceso > 0

                      ? `-${fmtEur(balanceFinanciero.aloExceso)}`

                      : '0,00 €'}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>

                    {balanceFinanciero && balanceFinanciero.irpfRetencion > 0

                      ? `Base sujeta exceso RD 462/2002: ${fmtEur(balanceFinanciero.irpfBase)}`

                      : balanceFinanciero && balanceFinanciero.aloExceso > 0

                      ? 'Límite 65,97 €/noche'

                      : 'Totalmente exento (RD 462/2002)'}

                  </span>

                </div>



                <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #176B52', background: 'linear-gradient(135deg, rgba(23, 107, 82, 0.08) 0%, rgba(23, 107, 82, 0.02) 100%)', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 8px rgba(23, 107, 82, 0.08)' }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#176B52' }}>Líquido a Transferir</span>

                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#D1FAE5', color: '#065F46' }}>✓ Abono en Cuenta</span>

                  </div>

                  <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#176B52' }}>

                    {fmtEur(result.liquido_ag)}

                  </span>

                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {result.liquidacion?.identificacion?.organica_secundaria ? `Orgánicas: ${result.liquidacion.identificacion.organica} / ${result.liquidacion.identificacion.organica_secundaria}` : 'Abono directo en cuenta corriente bancaria'}
                  </span>

                </div>

              </div>

            )}

            {/* TARJETA DE COFINANCIACIÓN MULTIORGÁNICA (SI APLICA) - Discreta y sobria */}
            {Boolean(result.liquidacion?.identificacion?.organica_secundaria || result.extraccion?.proyecto?.organica_secundaria || (result.liquidacion?.identificacion?.cofinanciacion && Object.keys(result.liquidacion.identificacion.cofinanciacion).length > 1)) && (
              <div style={{
                marginTop: '1.25rem',
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card-alt, #fafafa)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-app)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      Imputación Presupuestaria Multiorgánica (Cofinanciada)
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Anexo II de Aprobación de Gasto Oficial Generado
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerDocumento('02_Anexo_II_Aprobacion_Gasto.pdf')}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <FileText size={13} />
                    <span>Ver Anexo II (Aprobación Gasto)</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {(() => {
                    const org1 = result.liquidacion?.identificacion?.organica || result.extraccion?.proyecto?.organica || '';
                    const org2 = result.liquidacion?.identificacion?.organica_secundaria || result.extraccion?.proyecto?.organica_secundaria || '';
                    const cofinMap = result.liquidacion?.identificacion?.cofinanciacion || {};
                    const totalLiq = Number(result.liquido_ag) || Number(result.liquidacion?.resumen_economico?.liquido_a_abonar) || 0;
                    const imp2 = Number(cofinMap[org2]) || Number(result.extraccion?.suplidos?.find((s: any) => /park/i.test(s.concepto || s.descripcion))?.importe) || 0;
                    const rawImp1 = Number(cofinMap[org1]);
                    const imp1 = rawImp1 > 0 ? rawImp1 : Math.max(0, totalLiq - imp2);

                    return (
                      <>
                        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                            Orgánica Principal (1ª Unidad de Gasto)
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                            {org1 || 'Sin orgánica'}
                          </span>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#176B52', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                            {fmtEur(imp1)}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Imputación principal del expediente</span>
                        </div>

                        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                            Orgánica Secundaria (2ª Unidad de Gasto)
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                            {org2 || 'Sin orgánica secundaria'}
                          </span>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#4F46E5', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                            {fmtEur(imp2)}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Partidas cofinanciadas ({fmtEur(imp2)}) en 2ª orgánica</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>



          {/* 1.5 FORMULARIO DE LIQUIDACIÓN Y AJUSTE DE GASTOS EXTRAÍDOS */}
          <FormularioLiquidacionEditable
            casoId={result.caso_id}
            extraccion={result.extraccion}
            liquidacion={result.liquidacion}
            selectedTemplate={selectedTemplate}
            onDataUpdated={(nuevaExt, nuevaLiq, nuevoLiq) => {
              setResult(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  extraccion: nuevaExt,
                  liquidacion: nuevaLiq,
                  liquido_ag: nuevoLiq
                };
              });
            }}
          />

          {/* 2. PESTAÑAS Y CONTENIDO DETALLADO */}

          <div className="panel" style={{ padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>

            

            {/* BARRA DE PESTAÑAS HORIZONTAL ESTILO LINEAR / GITHUB (1 FILA LIMPIA, 1 SOLO CLIC) */}

            <div style={{

              borderBottom: '1px solid var(--border-color)',

              marginBottom: '1.5rem',

              display: 'flex',

              alignItems: 'center',

              overflowX: 'auto',

              scrollbarWidth: 'none',

              msOverflowStyle: 'none'

            }} className="no-scrollbar">

              <nav style={{

                display: 'flex',

                alignItems: 'center',

                gap: '4px',

                minWidth: 'max-content',

                paddingBottom: '0px'

              }} aria-label="Secciones del expediente">

                {[

                  { id: 'desglose', label: 'Desglose Oficial', icon: Layers },

                  { id: 'fiscalizacion_uex', label: 'Fiscalización y Régimen Fiscal', icon: ShieldCheck },

                  { id: 'balance', label: 'Balance y Reconciliación', icon: FileText },

                  { id: 'json', label: 'Esquema JSON', icon: Code2 },

                  { id: 'auditoria', label: 'Auditoría y Grafo', icon: Clock }

                ].map(t => {

                  const Icon = t.icon;

                  const isActive = activeTab === t.id;

                  return (

                    <button

                      key={t.id}

                      type="button"

                      onClick={() => setActiveTab(t.id)}

                      style={{

                        display: 'inline-flex',

                        alignItems: 'center',

                        gap: '8px',

                        padding: '10px 14px',

                        fontSize: '13px',

                        fontWeight: isActive ? 700 : 500,

                        color: isActive ? '#176B52' : 'var(--text-secondary)',

                        backgroundColor: isActive ? 'rgba(23, 107, 82, 0.06)' : 'transparent',

                        border: 'none',

                        borderBottom: isActive ? '2.5px solid #176B52' : '2.5px solid transparent',

                        borderRadius: '6px 6px 0 0',

                        marginBottom: '-1px',

                        cursor: 'pointer',

                        whiteSpace: 'nowrap',

                        transition: 'all 0.15s ease'

                      }}

                      className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50"

                    >

                      <Icon

                        size={16}

                        style={{

                          color: isActive ? '#176B52' : 'var(--text-muted)',

                          transition: 'color 0.15s ease'

                        }}

                      />

                      <span>{t.label}</span>

                    </button>

                  );

                })}

              </nav>

            </div>



            {/* PANEL PRINCIPAL DE CONTENIDO A ANCHO COMPLETO */}

            <div style={{ width: '100%', minWidth: 0 }}>

              

              {/* Título de la sección activa */}

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1.25rem 0', letterSpacing: '-0.01em' }}>

                {activeTab === 'desglose' && 'Desglose Oficial de Liquidación'}

                {activeTab === 'fiscalizacion_uex' && 'Fiscalización Normativa, Presupuestos 2026 y Régimen Fiscal'}

                {activeTab === 'balance' && 'Balance y Reconciliación de Gastos'}

                {activeTab === 'json' && 'Esquema JSON'}

                {activeTab === 'auditoria' && 'Auditoría, Trazabilidad y Grafo de Ejecución'}

              </h3>



              {/* =============================================================== */}

              {/* TAB FISCALIZACIÓN OFICIAL PRESUPUESTOS UEx 2026 + RÉGIMEN FISCAL */}

              {/* =============================================================== */}

              {activeTab === 'fiscalizacion_uex' && (() => {

                const fisc26 = (result.liquidacion as any)?.fiscalizacion_presupuestos_2026 || {};

                const articulosList: string[] = fisc26.articulos_aplicados || fisc26.articulos_verificados || [

                  "Art. 32.1 Presupuestos UEx 2026: Régimen de dietas y resarcimiento (RD 462/2002)",

                  "Art. 32.1.c Presupuestos UEx 2026: Kilometraje a 0,26 €/km y justificación documental",

                  "Art. 32.7 Presupuestos UEx 2026: Adaptación a la normativa del proyecto/subvención",

                  "Art. 32.8 Presupuestos UEx 2026: Plazo de 45 días naturales de liquidación"

                ];

                const alertasFisc: string[] = fisc26.alertas || fisc26.alertas_normativas || (result.liquidacion as any)?.avisos || [];

                const esConforme = fisc26.conformidad !== false;

                const liqAny = (result.liquidacion || {}) as any;

                const irpfObj = liqAny.irpf || {};

                const irpfRet = Number(irpfObj.retencion ?? liqAny.resumen_economico?.retencion_irpf ?? 0);

                const tarifaManut = Number(liqAny.tarifas_aplicadas?.manutencion_dia ?? liqAny.conceptos?.manutencion?.tarifa_dia ?? 37.4);

                const tarifaKm = Number(liqAny.tarifas_aplicadas?.km_vehiculo ?? 0.26);

                const alojMax = Number(liqAny.tarifas_aplicadas?.alojamiento_max_dia ?? 65.97);

                const alojSol = Number(liqAny.conceptos?.alojamiento?.importe_real_total ?? 0);

                const alojAb = Number(liqAny.conceptos?.alojamiento?.importe ?? 0);

                const alojExceso = Math.max(0, alojSol - alojAb);

                const transpDetalle = Array.isArray(liqAny.conceptos?.transporte?.detalle) ? liqAny.conceptos.transporte.detalle : [];

                const totalKmExp = transpDetalle.reduce((acc: number, t: any) => acc + Number(t.km || 0), 0);

                const organicaExp = liqAny.identificacion?.organica || organica || 'No especificada';

                const proyectoExp = liqAny.identificacion?.referencia || liqAny.identificacion?.proyecto || referenciaProyecto || 'No especificado';

                return (

                <div className="space-y-6 animate-fade-in">

                  {/* Vista Oficial de la Memoria de Fiscalización */}

                  <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 space-y-4 shadow-xs">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">

                      <div>

                        <div className="flex items-center gap-2.5 flex-wrap">

                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">

                            <FileText size={16} className="text-[#176B52] dark:text-[#86EFAC]" />

                            Memoria Oficial de Fiscalización Económica (SGTRI UEx)

                          </h4>

                          <span

                            style={{

                              padding: '3px 10px',

                              borderRadius: '6px',

                              fontWeight: 700,

                              fontSize: '11px',

                              display: 'inline-flex',

                              alignItems: 'center',

                              gap: '5px',

                              backgroundColor: esConforme ? '#D1FAE5' : '#FEF3C7',

                              color: esConforme ? '#065F46' : '#92400E',

                              border: `1px solid ${esConforme ? '#6EE7B7' : '#FCD34D'}`

                            }}

                          >

                            <CheckCircle2 size={12} />

                            {esConforme ? 'CONFORME PARA ABONO' : 'CON OBSERVACIONES'}

                          </span>

                        </div>

                        <span className="text-xs text-zinc-400 font-mono">memoria_fiscalizacion_uex.txt</span>

                      </div>

                      <div className="flex items-center gap-2">

                        <Btn 

                          size="sm" 

                          variant="outline" 

                          onClick={() => {

                            if (result.memoria_fiscalizacion) {

                              navigator.clipboard.writeText(result.memoria_fiscalizacion);

                              setCopied(true);

                              setTimeout(() => setCopied(false), 2000);

                            }

                          }}

                          className="cursor-pointer rounded-md"

                        >

                          <Copy size={13} className="mr-1" />

                          {copied ? '¡Copiado!' : 'Copiar Memoria'}

                        </Btn>

                        <button 

                          type="button"

                          onClick={() => window.open(`/api/caso/${result.caso_id}/memoria`, '_blank')} 

                          className="px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"

                        >

                          <Download size={13} />

                          Descargar TXT

                        </button>

                      </div>

                    </div>



                    <pre

                      style={{

                        padding: '20px',

                        borderRadius: '8px',

                        backgroundColor: '#0F172A',

                        color: '#E2E8F0',

                        fontFamily: 'var(--font-mono)',

                        fontSize: '12px',

                        overflowX: 'auto',

                        maxHeight: '420px',

                        border: '1px solid #1E293B',

                        whiteSpace: 'pre-wrap',

                        lineHeight: 1.6

                      }}

                    >

                      {result.memoria_fiscalizacion || (

                        fisc26?.normativa_marco

                          ? `MEMORIA DE FISCALIZACIÓN ECONÓMICA Y PRESUPUESTARIA\nUNIVERSIDAD DE EXTREMADURA\n\nNormativa Marco: ${fisc26.normativa_marco}\nConformidad: ${esConforme ? 'CONFORME PARA ABONO' : 'REQUIERE RECTIFICACIÓN'}`

                          : 'Memoria de fiscalización oficial generada en backend.'

                      )}

                    </pre>

                  </div>



                  {/* Fundamento Jurídico-Tributario y Régimen Fiscal (Cuadrícula 2x2 simétrica) */}

                  <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5 text-xs leading-relaxed">

                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">

                      <Scale size={18} className="text-zinc-700 dark:text-zinc-300" />

                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">

                        Fundamento Jurídico-Tributario y Régimen Fiscal

                      </h4>

                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 items-stretch">

                      <div style={{ height: '100%', padding: '16px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                        <ShieldCheck size={18} style={{ color: '#166534', flexShrink: 0, marginTop: '2px' }} />

                        <div>

                          <span className="font-bold text-zinc-900 block mb-1">

                            {irpfObj.aplica && irpfRet > 0

                              ? `Retención IRPF Aplicada (${fmtEur(irpfRet)})`

                              : `Régimen de Exención de IRPF (${fmtEur(irpfRet)})`}

                          </span>

                          <p className="text-zinc-700 text-[11px] leading-relaxed">

                            Conforme al <strong>Artículo 9 del Reglamento del IRPF (RD 439/2007)</strong> y el <strong>Real Decreto 462/2002</strong>, para la tarifa aplicada de manutención ({tarifaManut.toFixed(2)} €/día) y locomoción ({tarifaKm.toFixed(2)} €/km): {irpfObj.aplica && irpfRet > 0

                              ? `se aplica retención sobre una base sujeta de ${fmtEur(irpfObj.base_sujeta || 0)} (${irpfObj.detalle || 'exceso sobre el límite exento estatal'}).`

                              : `las cuantías devengadas se encuentran íntegramente exentas de retención (${irpfObj.detalle || 'dentro de los límites legales'}).`}

                          </p>

                        </div>

                      </div>



                      <div style={{ height: '100%', padding: '16px', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                        <AlertTriangle size={18} style={{ color: '#92400E', flexShrink: 0, marginTop: '2px' }} />

                        <div>

                          <span className="font-bold text-zinc-900 block mb-1">

                            Aplicación de Topes Máximos de Alojamiento

                          </span>

                          <p className="text-zinc-700 text-[11px] leading-relaxed">

                            El tope máximo aplicable de alojamiento por noche según la normativa del proyecto es de <strong>{fmtEur(alojMax)}</strong>.{' '}

                            {alojExceso > 0

                              ? `Las cantidades que exceden dicho umbral (en este expediente, ${fmtEur(alojExceso)}) quedan excluidas de la liquidación oficial.`

                              : 'En este expediente el alojamiento justificado se sitúa íntegramente dentro del límite máximo autorizado.'}

                          </p>

                        </div>

                      </div>



                      <div style={{ height: '100%', padding: '16px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                        <FileCheck size={18} style={{ color: '#1E40AF', flexShrink: 0, marginTop: '2px' }} />

                        <div>

                          <span className="font-bold text-zinc-900 block mb-1">

                            {totalKmExp > 0 ? 'Compensación por Uso de Vehículo Particular' : 'Régimen de Locomoción y Transporte'}

                          </span>

                          <p className="text-zinc-700 text-[11px] leading-relaxed">

                            {totalKmExp > 0

                              ? `La indemnización de ${tarifaKm.toFixed(2)} €/km (Orden HFP/792/2023) aplicada sobre ${totalKmExp} km declarados cubre combustible, desgaste mecánico y seguro, no procediendo el reembolso adicional de repostajes.`

                              : 'Conforme al Art. 17 del RD 462/2002 y Presupuestos UEx 2026, el transporte público colectivo (clase turista/estándar) se resarce por el importe íntegro justificado mediante billete y factura oficial.'}

                          </p>

                        </div>

                      </div>



                      <div style={{ height: '100%', padding: '16px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                        <Building2 size={18} style={{ color: '#475569', flexShrink: 0, marginTop: '2px' }} />

                        <div>

                          <span className="font-bold text-zinc-900 block mb-1">

                            Destino e Imputación Presupuestaria

                          </span>

                          <p className="text-zinc-700 text-[11px] leading-relaxed">

                            Expediente imputado a proyecto <strong>{proyectoExp}</strong> (orgánica <strong>{organicaExp}</strong>) para su fiscalización por el <strong>SGTRI (UEx)</strong> y tramitación de la orden de pago correspondiente.

                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                );

              })()}

              

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

                    const suplidos = liq.conceptos.suplidos;



                    const origen = liq.identificacion?.origen || 'Cáceres';

                    const destino = liq.identificacion?.destino || 'Alicante';



                    const showManutencion = filtroConcepto === 'manutencion';

                    const showTransporte = filtroConcepto === 'transporte';

                    const showAlojamiento = filtroConcepto === 'alojamiento';

                    const showInscripcion = Boolean(inscripcion) && filtroConcepto === 'inscripcion';

                    const showSuplidos = filtroConcepto === 'suplidos';



                    const totalKm = transporte?.detalle?.[0]?.km || 0;

                    const mitadKm = totalKm > 0 ? (totalKm / 2).toFixed(0) : 0;

                    const tarifaKm = transporte?.detalle?.[0]?.tarifa_km || liq.tarifas_aplicadas?.km_vehiculo || 0.26;

                    const vehiculoDesc = [transporte?.detalle?.[0]?.marca, transporte?.detalle?.[0]?.modelo].filter(Boolean).join(' ') || 'Vehículo particular';

                    const matriculaDesc = transporte?.detalle?.[0]?.matricula ? `[${transporte.detalle[0].matricula}]` : '';



                    return (

                      <div className="space-y-6">

                        {/* 1. PARTIDAS Y CONCEPTOS DE LA COMISIÓN (SELECTOR INTERACTIVO) */}

                        <div className="p-4 sm:p-5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 space-y-4 shadow-2xs">

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

                              Haga clic en cualquiera de las 4 partidas para desplegar su cálculo y desglose normativo individual.

                            </p>

                          </div>



                          {/* Cuadrícula 2x2: 2 Arriba y 2 Abajo con los 4 Conceptos */}

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem', paddingTop: '6px' }}>

                            

                            {/* 1. Manutención (Arriba - Izquierda) */}

                            <button

                              type="button"

                              onClick={() => setFiltroConcepto(filtroConcepto === 'manutencion' ? null : 'manutencion')}

                              style={{

                                padding: '14px 16px',

                                borderRadius: '10px',

                                border: filtroConcepto === 'manutencion' ? '1.5px solid #176B52' : '1px solid var(--border-color)',

                                backgroundColor: filtroConcepto === 'manutencion' ? 'rgba(23, 107, 82, 0.08)' : 'var(--bg-app)',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'space-between',

                                cursor: 'pointer',

                                textAlign: 'left',

                                transition: 'all 0.15s ease',

                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'

                              }}

                              className="hover:border-zinc-400 dark:hover:border-zinc-600"

                            >

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>

                                <div style={{

                                  width: '38px',

                                  height: '38px',

                                  borderRadius: '8px',

                                  backgroundColor: filtroConcepto === 'manutencion' ? '#176B52' : 'var(--bg-secondary)',

                                  color: filtroConcepto === 'manutencion' ? '#ffffff' : 'var(--text-primary)',

                                  display: 'flex',

                                  alignItems: 'center',

                                  justifyContent: 'center',

                                  flexShrink: 0

                                }}>

                                  <Utensils size={18} />

                                </div>

                                <div style={{ minWidth: 0 }}>

                                  <div style={{ fontSize: '13px', fontWeight: 700, color: filtroConcepto === 'manutencion' ? '#176B52' : 'var(--text-primary)', lineHeight: 1.2 }}>

                                    Manutención y Dietas

                                  </div>

                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>

                                    {(manutencion?.factor_total || 4.5).toFixed(1)} jornadas computadas

                                  </div>

                                </div>

                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>

                                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: filtroConcepto === 'manutencion' ? '#176B52' : 'var(--text-primary)' }}>

                                  {fmtEur(manutencion?.importe || 0)}

                                </div>

                                <span style={{ fontSize: '10px', fontWeight: 600, color: '#065F46', backgroundColor: '#D1FAE5', padding: '1px 6px', borderRadius: '4px' }}>

                                  100% Exento

                                </span>

                              </div>

                            </button>



                            {/* 2. Transporte (Arriba - Derecha) */}

                            <button

                              type="button"

                              onClick={() => setFiltroConcepto(filtroConcepto === 'transporte' ? null : 'transporte')}

                              style={{

                                padding: '14px 16px',

                                borderRadius: '10px',

                                border: filtroConcepto === 'transporte' ? '1.5px solid #176B52' : '1px solid var(--border-color)',

                                backgroundColor: filtroConcepto === 'transporte' ? 'rgba(23, 107, 82, 0.08)' : 'var(--bg-app)',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'space-between',

                                cursor: 'pointer',

                                textAlign: 'left',

                                transition: 'all 0.15s ease',

                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'

                              }}

                              className="hover:border-zinc-400 dark:hover:border-zinc-600"

                            >

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>

                                <div style={{

                                  width: '38px',

                                  height: '38px',

                                  borderRadius: '8px',

                                  backgroundColor: filtroConcepto === 'transporte' ? '#176B52' : 'var(--bg-secondary)',

                                  color: filtroConcepto === 'transporte' ? '#ffffff' : 'var(--text-primary)',

                                  display: 'flex',

                                  alignItems: 'center',

                                  justifyContent: 'center',

                                  flexShrink: 0

                                }}>

                                  <Car size={18} />

                                </div>

                                <div style={{ minWidth: 0 }}>

                                  <div style={{ fontSize: '13px', fontWeight: 700, color: filtroConcepto === 'transporte' ? '#176B52' : 'var(--text-primary)', lineHeight: 1.2 }}>

                                    Desplazamiento y Transporte

                                  </div>

                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>

                                    {origen} ⇄ {destino}

                                  </div>

                                </div>

                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>

                                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: filtroConcepto === 'transporte' ? '#176B52' : 'var(--text-primary)' }}>

                                  {fmtEur(transporte?.importe || 0)}

                                </div>

                                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>

                                  0.26 €/km

                                </span>

                              </div>

                            </button>



                            {/* 3. Alojamiento (Abajo - Izquierda) */}

                            <button

                              type="button"

                              onClick={() => setFiltroConcepto(filtroConcepto === 'alojamiento' ? null : 'alojamiento')}

                              style={{

                                padding: '14px 16px',

                                borderRadius: '10px',

                                border: filtroConcepto === 'alojamiento' ? '1.5px solid #176B52' : '1px solid var(--border-color)',

                                backgroundColor: filtroConcepto === 'alojamiento' ? 'rgba(23, 107, 82, 0.08)' : 'var(--bg-app)',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'space-between',

                                cursor: 'pointer',

                                textAlign: 'left',

                                transition: 'all 0.15s ease',

                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'

                              }}

                              className="hover:border-zinc-400 dark:hover:border-zinc-600"

                            >

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>

                                <div style={{

                                  width: '38px',

                                  height: '38px',

                                  borderRadius: '8px',

                                  backgroundColor: filtroConcepto === 'alojamiento' ? '#176B52' : 'var(--bg-secondary)',

                                  color: filtroConcepto === 'alojamiento' ? '#ffffff' : 'var(--text-primary)',

                                  display: 'flex',

                                  alignItems: 'center',

                                  justifyContent: 'center',

                                  flexShrink: 0

                                }}>

                                  <BedDouble size={18} />

                                </div>

                                <div style={{ minWidth: 0 }}>

                                  <div style={{ fontSize: '13px', fontWeight: 700, color: filtroConcepto === 'alojamiento' ? '#176B52' : 'var(--text-primary)', lineHeight: 1.2 }}>

                                    Alojamiento y Hospedaje

                                  </div>

                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>

                                    {alojamiento?.detalle?.[0]?.establecimiento || 'Hotel'} ({alojamiento?.detalle?.[0]?.noches || 4} noches)

                                  </div>

                                </div>

                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>

                                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: filtroConcepto === 'alojamiento' ? '#176B52' : 'var(--text-primary)' }}>

                                  {fmtEur(alojamiento?.importe || 0)}

                                </div>

                                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>

                                  Máx 65,97 €/n

                                </span>

                              </div>

                            </button>



                            {/* 4. Inscripción (Abajo - Derecha) */}

                            <button

                              type="button"

                              onClick={() => setFiltroConcepto(filtroConcepto === 'inscripcion' ? null : 'inscripcion')}

                              style={{

                                padding: '14px 16px',

                                borderRadius: '10px',

                                border: filtroConcepto === 'inscripcion' ? '1.5px solid #176B52' : '1px solid var(--border-color)',

                                backgroundColor: filtroConcepto === 'inscripcion' ? 'rgba(23, 107, 82, 0.08)' : 'var(--bg-app)',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'space-between',

                                cursor: 'pointer',

                                textAlign: 'left',

                                transition: 'all 0.15s ease',

                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'

                              }}

                              className="hover:border-zinc-400 dark:hover:border-zinc-600"

                            >

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>

                                <div style={{

                                  width: '38px',

                                  height: '38px',

                                  borderRadius: '8px',

                                  backgroundColor: filtroConcepto === 'inscripcion' ? '#176B52' : 'var(--bg-secondary)',

                                  color: filtroConcepto === 'inscripcion' ? '#ffffff' : 'var(--text-primary)',

                                  display: 'flex',

                                  alignItems: 'center',

                                  justifyContent: 'center',

                                  flexShrink: 0

                                }}>

                                  <FileText size={18} />

                                </div>

                                <div style={{ minWidth: 0 }}>

                                  <div style={{ fontSize: '13px', fontWeight: 700, color: filtroConcepto === 'inscripcion' ? '#176B52' : 'var(--text-primary)', lineHeight: 1.2 }}>

                                    Inscripción al Congreso

                                  </div>

                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>

                                    {(balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? 'Abonado Tarjeta UEx (no trans.)' : 'Abonado particular (Reembolsable)'}

                                  </div>

                                </div>

                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>

                                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: filtroConcepto === 'inscripcion' ? '#176B52' : 'var(--text-primary)' }}>

                                  {fmtEur(balanceFinanciero?.insTotal || 0)}

                                </div>

                                <span style={{ fontSize: '10px', fontWeight: 600, color: (balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? '#4338CA' : 'var(--text-secondary)', backgroundColor: (balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? '#E0E7FF' : 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>

                                  {(balanceFinanciero?.insTarjetaInstImporte || 0) > 0 ? 'Tarjeta UEx' : 'Reembolsable'}

                                </span>

                              </div>

                            </button>

                            {/* 5. Gastos Suplidos (Peajes / Parking) si aplican */}
                            {Boolean((balanceFinanciero?.sup || 0) > 0) && (
                              <button
                                type="button"
                                onClick={() => setFiltroConcepto(filtroConcepto === 'suplidos' ? null : 'suplidos')}
                                style={{
                                  padding: '14px 16px',
                                  borderRadius: '10px',
                                  border: filtroConcepto === 'suplidos' ? '1.5px solid #176B52' : '1px solid var(--border-color)',
                                  backgroundColor: filtroConcepto === 'suplidos' ? 'rgba(23, 107, 82, 0.08)' : 'var(--bg-app)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.15s ease',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                }}
                                className="hover:border-zinc-400 dark:hover:border-zinc-600"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                  <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    backgroundColor: filtroConcepto === 'suplidos' ? '#176B52' : 'var(--bg-secondary)',
                                    color: filtroConcepto === 'suplidos' ? '#ffffff' : 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <Receipt size={18} />
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: filtroConcepto === 'suplidos' ? '#176B52' : 'var(--text-primary)', lineHeight: 1.2 }}>
                                      Gastos Suplidos
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      Peajes y parking justificados
                                    </div>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                  <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: filtroConcepto === 'suplidos' ? '#176B52' : 'var(--text-primary)' }}>
                                    {fmtEur(balanceFinanciero?.sup || 0)}
                                  </div>
                                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#176B52', backgroundColor: '#D1FAE5', padding: '1px 6px', borderRadius: '4px' }}>
                                    100% Justificado
                                  </span>
                                </div>
                              </button>
                            )}



                          </div>



                          {/* Barra de Filtro Activo únicamente cuando hay una partida seleccionada */}

                          {filtroConcepto && (

                            <div style={{

                              display: 'flex',

                              alignItems: 'center',

                              justifyContent: 'space-between',

                              padding: '10px 14px',

                              borderRadius: '8px',

                              backgroundColor: 'rgba(23, 107, 82, 0.08)',

                              border: '1px solid rgba(23, 107, 82, 0.2)',

                              fontSize: '12px',

                              marginTop: '0.75rem'

                            }}>

                              <span style={{ color: '#176B52', fontWeight: 600 }}>

                                Desglose detallado de:{' '}

                                <strong>

                                  {filtroConcepto === 'manutencion'

                                    ? 'Manutención y Dietas'

                                    : filtroConcepto === 'transporte'

                                    ? 'Desplazamiento y Transporte'

                                    : filtroConcepto === 'alojamiento'

                                    ? 'Alojamiento y Hospedaje'

                                    : filtroConcepto === 'suplidos'

                                    ? 'Gastos Suplidos (Peajes / Parking)'

                                    : 'Inscripción al Congreso'}

                                </strong>

                              </span>

                              <button

                                type="button"

                                onClick={() => setFiltroConcepto(null)}

                                style={{

                                  background: 'none',

                                  border: 'none',

                                  color: '#176B52',

                                  fontWeight: 700,

                                  cursor: 'pointer',

                                  fontSize: '12px',

                                  display: 'flex',

                                  alignItems: 'center',

                                  gap: '4px'

                                }}

                              >

                                ✕ Cerrar detalle

                              </button>

                            </div>

                          )}

                        </div>



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

                                <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs">

                                  {totalKm > 0 ? <Car size={18} /> : <Train size={18} />}

                                </div>

                                <div>

                                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">

                                    Desplazamiento y Gastos de Locomoción

                                  </h4>

                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">

                                    {totalKm > 0

                                      ? `Orden HFP/792/2023 · Módulo oficial de kilometraje: ${tarifaKm.toFixed(2)} €/km`

                                      : 'Billetes y títulos oficiales de transporte público colectivo · Justificantes R.D. 462/2002'}

                                  </span>

                                </div>

                              </div>

                              <span className="text-sm font-mono font-bold px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs">

                                {(transporte?.importe || 0).toFixed(2)} €

                              </span>

                            </div>



                            {transporte?.detalle?.map((t: any, i: number) => {

                              const isCoche = t.tipo === 'vehiculo_particular' || Boolean(t.km);



                              if (isCoche) {

                                return (

                                  <div key={i} className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-5 shadow-xs">

                                    

                                    {/* FICHA TÉCNICA DEL ITINERARIO */}

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 text-xs">

                                      <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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



                                      <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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



                                      <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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

                                    <div className="p-4 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">

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



                              const isTren = t.tipo === 'tren' || t.medio === 'tren' || (t.descripcion && t.descripcion.toLowerCase().includes('tren')) || (t.descripcion && (t.descripcion.includes('MD') || t.descripcion.includes('AVE') || t.descripcion.includes('Alvia')));

                              const isAvion = t.tipo === 'avion' || t.medio === 'avion' || t.tipo === 'flight';

                              const isBus = t.tipo === 'autobus' || t.tipo === 'bus';



                              let trayectoTexto = t.descripcion || t.itinerario || t.trayecto || '';

                              if (!trayectoTexto && isTren) {

                                if (transporte.detalle.length === 4) {

                                  const etapas = [

                                    `${origen} → Madrid-Atocha (MD)`,

                                    `Madrid-Atocha → ${destino} (AVE)`,

                                    `${destino} → Madrid-Atocha (AVE)`,

                                    `Madrid-Atocha → ${origen} (MD)`

                                  ];

                                  trayectoTexto = etapas[i] || `Billete Tren Renfe · Tramo ${i + 1}`;

                                } else {

                                  trayectoTexto = `Billete Tren Renfe · Tramo ${i + 1}`;

                                }

                              } else if (!trayectoTexto) {

                                trayectoTexto = `${t.tipo || 'Transporte'} · Billete ${i + 1}`;

                              }



                              const esIda = i < (transporte.detalle.length / 2);

                              const sentidoLabel = transporte.detalle.length > 1 ? (esIda ? 'Trayecto de Ida' : 'Trayecto de Regreso') : 'Trayecto';



                              let tipoServicio = 'Billete Oficial';

                              if (trayectoTexto.includes('AVE')) tipoServicio = 'Renfe AVE (Alta Velocidad)';

                              else if (trayectoTexto.includes('MD')) tipoServicio = 'Renfe MD (Media Distancia)';

                              else if (trayectoTexto.includes('Alvia')) tipoServicio = 'Renfe Alvia';

                              else if (isTren) tipoServicio = 'Tren Renfe';

                              else if (isAvion) tipoServicio = 'Vuelo Comercial';

                              else if (isBus) tipoServicio = 'Autobús Interurbano';



                              return (

                                <div key={i} className="p-4 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">

                                  <div className="flex items-center gap-3.5 min-w-0">

                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">

                                      {isTren ? <Train size={19} /> : isAvion ? <Plane size={19} /> : isBus ? <Bus size={19} /> : <CreditCard size={19} />}

                                    </div>

                                    <div className="min-w-0 space-y-1">

                                      <div className="flex items-center gap-2 flex-wrap">

                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[13px] tracking-tight">

                                          {trayectoTexto}

                                        </span>

                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">

                                          {sentidoLabel} · Tramo {i + 1}

                                        </span>

                                      </div>

                                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">

                                        <span className="font-semibold text-[#176B52] dark:text-[#86EFAC]">{tipoServicio}</span>

                                        <span>·</span>

                                        <span>Clase Turista / Estándar</span>

                                        <span>·</span>

                                        <span>Factura oficial con IVA 10% (RD 462/2002)</span>

                                      </div>

                                    </div>

                                  </div>



                                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">

                                    <span className="font-mono font-extrabold text-base text-zinc-900 dark:text-zinc-100">

                                      {(t.importe_abonable || t.importe || 0).toFixed(2)} €

                                    </span>

                                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/50 mt-0.5">

                                      100% Indemnizable

                                    </span>

                                  </div>

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

                                <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs">

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

                              <span className="text-sm font-mono font-bold px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs">

                                {(alojamiento?.importe || 0).toFixed(2)} €

                              </span>

                            </div>



                            {(!alojamiento?.detalle || alojamiento.detalle.length === 0) ? (

                              <div className="p-6 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-center text-zinc-400 italic">

                                No constan gastos de hospedaje imputados al expediente.

                              </div>

                            ) : (

                              alojamiento.detalle.map((a: any, i: number) => {

                                const importeReal = a.importe_real || 0;

                                const importeAbonable = a.importe_abonable || 0;

                                const exceso = a.exceso_no_abonable || 0;



                                return (

                                  <div key={i} className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-5 shadow-xs">

                                    

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

                                      <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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



                                      <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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



                                      <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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

                                <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs">

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

                                <span className="text-sm font-mono font-bold px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs">

                                  {inscripcion.reembolsable_al_investigador ? `${(inscripcion.importe_reembolsable || 0).toFixed(2)} €` : '0,00 € a transferir'}

                                </span>

                              </div>

                            </div>



                            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4 shadow-xs text-xs">

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                                <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

                                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">

                                    Actividad Científica

                                  </span>

                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">

                                    Jornadas de Ingeniería del Software y BD (JISBD)

                                  </span>

                                </div>



                                <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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



                                <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">

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



                              <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">

                                La cuota de <strong>{(inscripcion.importe_total || inscripcion.importe || 475.0).toFixed(2)} €</strong> se encuentra justificada documentalmente mediante factura oficial emitida a nombre de la <strong>Universidad de Extremadura (CIF Q1018001F)</strong> e imputada a la partida de congresos del proyecto. No procede su abono en la nómina del comisionado al haber sido satisfecha de forma directa y centralizada por la Universidad.

                              </div>

                            </div>

                          </div>

                        )}



                        {/* PARTIDA 5: GASTOS SUPLIDOS (PEAJES / PARKING) */}

                        {showSuplidos && (() => {

                          const suplidosDetalle: Array<{ concepto?: string; importe?: number; con_justificante?: boolean }> =

                            (suplidos?.detalle && suplidos.detalle.length > 0)

                              ? suplidos.detalle

                              : (result?.extraccion?.suplidos || []);

                          const suplidosTotal = suplidos?.importe ?? balanceFinanciero?.sup ?? 0;

                          return (

                            <div className="space-y-4 pt-2">

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">

                                <div className="flex items-center gap-2.5">

                                  <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs">

                                    <Receipt size={18} />

                                  </div>

                                  <div>

                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">

                                      Gastos Suplidos (Peajes y Parking)

                                    </h4>

                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">

                                      Gastos accesorios de locomoción justificados documentalmente (R.D. 462/2002)

                                    </span>

                                  </div>

                                </div>

                                <span className="text-sm font-mono font-bold px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs">

                                  {fmtEur(suplidosTotal)}

                                </span>

                              </div>



                              <div className="space-y-2.5">

                                {suplidosDetalle.length > 0 ? suplidosDetalle.map((item, idx) => {

                                  const tieneJustificante = item.con_justificante !== false;

                                  return (

                                    <div key={idx} className="p-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">

                                      <div className="flex items-start gap-3 min-w-0">

                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#176B52] dark:text-[#86EFAC] flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">

                                          <Receipt size={19} />

                                        </div>

                                        <div className="min-w-0 space-y-1">

                                          <div className="flex items-center gap-2 flex-wrap">

                                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[13px] tracking-tight">

                                              {item.concepto || `Gasto suplido ${idx + 1}`}

                                            </span>

                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">

                                              Concepto {idx + 1}

                                            </span>

                                          </div>

                                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">

                                            <span>{tieneJustificante ? 'Con justificante oficial adjunto' : 'Sin justificante documental'}</span>

                                            <span>·</span>

                                            <span>Exento de IRPF (R.D. 462/2002)</span>

                                          </div>

                                        </div>

                                      </div>



                                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">

                                        <span className="font-mono font-extrabold text-base text-zinc-900 dark:text-zinc-100">

                                          {fmtEur(item.importe || 0)}

                                        </span>

                                        <span

                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border mt-0.5 ${

                                            tieneJustificante

                                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/50'

                                              : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/50'

                                          }`}

                                        >

                                          {tieneJustificante ? '100% Justificado' : 'Pendiente justificante'}

                                        </span>

                                      </div>

                                    </div>

                                  );

                                }) : (

                                  <div className="p-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400">

                                    Total gastos suplidos justificados: <strong className="font-mono text-zinc-900 dark:text-zinc-100">{fmtEur(suplidosTotal)}</strong>

                                  </div>

                                )}

                              </div>

                            </div>

                          );

                        })()}



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

                  <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6">

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



                        <div className="p-4 rounded-md bg-[#FCFBFA] dark:bg-zinc-950/60 border border-[#EFECE6] dark:border-zinc-800 space-y-2 text-xs">

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



                        <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800 space-y-2 text-xs">

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



                          {balanceFinanciero.insEsTarjetaInst && balanceFinanciero.insTarjetaInstImporte > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-[#E0D9CB] dark:border-zinc-800 text-[#6B3E82] dark:text-[#E9D5FF]">
                              <span className="flex items-center gap-2">
                                <CreditCard size={14} /> Inscripción Pagada Directamente por UEx (Tarjeta Institucional)
                              </span>
                              <span className="font-mono font-bold">
                                -{balanceFinanciero.insTarjetaInstImporte.toFixed(2)} €
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            <span>Total Deducciones del Reembolso Personal:</span>
                            <span className="font-mono font-extrabold text-base text-red-600 dark:text-red-400">
                              -{(balanceFinanciero.aloExceso + balanceFinanciero.insTarjetaInstImporte + balanceFinanciero.irpfRetencion).toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Columna Derecha: Tarjeta de Dictamen Final */}
                      <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md space-y-5">
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

                        <div className="p-4 rounded-md bg-zinc-800/80 dark:bg-zinc-200/80 border border-zinc-700 dark:border-zinc-300 space-y-2">
                          <div className="flex justify-between text-xs text-zinc-300 dark:text-zinc-700">
                            <span>Total Gastos de Misión:</span>
                            <span className="font-mono font-bold">{balanceFinanciero.gastoTotalMision.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between text-xs text-red-300 dark:text-red-700">
                            <span>Excesos y Pagos UEx:</span>
                            <span className="font-mono font-bold">-{(balanceFinanciero.aloExceso + balanceFinanciero.insTarjetaInstImporte + balanceFinanciero.irpfRetencion).toFixed(2)} €</span>
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



              {/* TAB 4: ESQUEMA JSON */}

              {activeTab === 'json' && (

                <div className="space-y-4 animate-fade-in">

                  <div className="flex items-center justify-between">

                    <div className="flex gap-2">

                      <button

                        onClick={() => setJsonTab('liquidacion')}

                        className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer", jsonTab === 'liquidacion' ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400")}

                      >

                        Liquidación Normativa (JSON)

                      </button>

                      <button

                        onClick={() => setJsonTab('extraccion')}

                        className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer", jsonTab === 'extraccion' ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400")}

                      >

                        Extracción Semántica (JSON)

                      </button>

                    </div>



                    <Btn size="sm" variant="outline" onClick={() => copyJsonToClipboard(jsonTab === 'liquidacion' ? result.liquidacion : result.extraccion)} className="cursor-pointer rounded-md">

                      <Copy size={13} className="mr-1" />

                      {copied ? '¡Copiado!' : 'Copiar JSON'}

                    </Btn>

                  </div>



                  <pre

                    style={{

                      padding: '20px',

                      borderRadius: '8px',

                      backgroundColor: '#0F172A',

                      color: '#E2E8F0',

                      fontFamily: 'var(--font-mono)',

                      fontSize: '12px',

                      overflowX: 'auto',

                      maxHeight: '500px',

                      border: '1px solid #1E293B',

                      lineHeight: 1.6

                    }}

                  >

                    {JSON.stringify(jsonTab === 'liquidacion' ? result.liquidacion : result.extraccion, null, 2)}

                  </pre>

                </div>

              )}



              {/* TAB 5: AUDITORÍA, TRAZABILIDAD Y GRAFO DE EJECUCIÓN */}

              {activeTab === 'auditoria' && (

                <div className="space-y-4 animate-fade-in">

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">

                    <div className="flex items-center gap-2">

                      <button

                        type="button"

                        onClick={() => setAuditoriaSubTab('logs')}

                        className={cn(

                          "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",

                          auditoriaSubTab === 'logs'

                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"

                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"

                        )}

                      >

                        <Terminal size={14} />

                        <span>Registro de Auditoría (Logs)</span>

                      </button>

                      <button

                        type="button"

                        onClick={() => setAuditoriaSubTab('grafo')}

                        className={cn(

                          "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",

                          auditoriaSubTab === 'grafo'

                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"

                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"

                        )}

                      >

                        <GitFork size={14} />

                        <span>Grafo de Ejecución del Pipeline</span>

                      </button>

                    </div>



                    <span className="text-[11px] font-mono text-zinc-400">

                      Trazabilidad garantizada por SHA-256

                    </span>

                  </div>



                  {auditoriaSubTab === 'logs' ? (

                    <div className="space-y-3">

                      <pre

                        style={{

                          padding: '20px',

                          borderRadius: '8px',

                          backgroundColor: '#0F172A',

                          color: '#6EE7B7',

                          fontFamily: 'var(--font-mono)',

                          fontSize: '12px',

                          overflowX: 'auto',

                          maxHeight: '500px',

                          border: '1px solid #1E293B',

                          whiteSpace: 'pre-wrap',

                          lineHeight: 1.6

                        }}

                      >

                        {result.logs || taskLogs || 'No hay logs de auditoría disponibles.'}

                      </pre>

                    </div>

                  ) : (

                    <div className="p-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">

                      <ViewGrafo taskId={result.caso_id} />

                    </div>

                  )}

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

            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-5 sm:p-6 max-w-6xl w-full shadow-2xl space-y-4 animate-pop max-h-[95vh] h-[92vh] flex flex-col"

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

                    className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"

                  >

                    <ZoomIn size={14} /> 

                    <span className="hidden sm:inline">Nueva Pestaña</span>

                  </a>

                )}

                <button 

                  onClick={() => setPreviewTemplateModal(null)} 

                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"

                  title="Cerrar"

                >

                  <X size={20} />

                </button>

              </div>

            </div>



            {/* Cuerpo del Modal */}

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">

              

              <div className="lg:col-span-8 flex flex-col min-h-0 bg-[#FAF8F5] dark:bg-zinc-950/60 rounded-md border border-[#ECE7DD] dark:border-zinc-800 overflow-hidden shadow-inner">

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

                  <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800">

                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">

                      Descripción del Trámite

                    </span>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">

                      {previewTemplateModal.desc}

                    </p>

                  </div>



                  {(previewTemplateModal as any).normativa && (

                    <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800">

                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">

                        Marco Normativo y Legal

                      </span>

                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">

                        {(previewTemplateModal as any).normativa}

                      </p>

                    </div>

                  )}



                  {(previewTemplateModal as any).organismo && (

                    <div className="p-4 rounded-md bg-[#FAF8F5] dark:bg-zinc-950 border border-[#ECE7DD] dark:border-zinc-800">

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

                    className="w-full cursor-pointer shadow-md rounded-md"

                  >

                    Usar este Procedimiento

                  </Btn>

                  <Btn 

                    size="sm" 

                    variant="outline" 

                    onClick={() => setPreviewTemplateModal(null)} 

                    className="w-full cursor-pointer rounded-md"

                  >

                    Cerrar

                  </Btn>

                </div>

              </div>



            </div>



          </div>

        </div>

      )}



      {/* MODAL INFORMATIVO DE RÉGIMEN DE FINANCIACIÓN Y NORMATIVA UEX */}

      {modalProyectoInfo && (

        <div 

          style={{ 

            position: 'fixed',

            inset: 0,

            zIndex: 99999,

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

            padding: '1.25rem',

            backgroundColor: 'rgba(0, 0, 0, 0.72)',

            backdropFilter: 'blur(8px)',

            WebkitBackdropFilter: 'blur(8px)',

          }} 

          onClick={() => setModalProyectoInfo(null)}

        >

          <div 

            style={{

              maxWidth: '460px',

              width: '100%',

              backgroundColor: 'var(--bg-surface, #ffffff)',

              borderRadius: '16px',

              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',

              border: '1px solid var(--border-color, #e2e8f0)',

              padding: '1.4rem 1.5rem',

              display: 'flex',

              flexDirection: 'column',

              gap: '0.85rem',

              boxSizing: 'border-box',

            }}

            onClick={(e) => e.stopPropagation()}

          >

            {/* Cabecera compacta con título y botón de cierre */}

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>

              <div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>

                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: 'var(--bg-card, #f1f5f9)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>

                    {modalProyectoInfo.id}

                  </span>

                  <span style={{ 

                    fontSize: '11px', 

                    fontWeight: 600, 

                    padding: '2px 7px', 

                    borderRadius: '4px', 

                    color: modalProyectoInfo.esJunta ? '#92400E' : '#1E40AF', 

                    backgroundColor: modalProyectoInfo.esJunta ? '#FEF3C7' : '#EFF6FF', 

                    border: `1px solid ${modalProyectoInfo.esJunta ? '#FCD34D' : '#BFDBFE'}` 

                  }}>

                    {modalProyectoInfo.normativa}

                  </span>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>

                    {modalProyectoInfo.esJunta ? '· Junta de Extremadura' : '· Régimen General UEx'}

                  </span>

                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>

                  {modalProyectoInfo.nombre}

                </h3>

              </div>

              <button

                type="button"

                onClick={() => setModalProyectoInfo(null)}

                style={{

                  width: '28px',

                  height: '28px',

                  borderRadius: '50%',

                  border: 'none',

                  backgroundColor: 'transparent',

                  color: 'var(--text-muted)',

                  cursor: 'pointer',

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                  flexShrink: 0,

                  marginTop: '-2px',

                  marginRight: '-4px',

                }}

                className="hover:bg-zinc-100 dark:hover:bg-zinc-800"

                aria-label="Cerrar"

                title="Cerrar"

              >

                <X size={17} />

              </button>

            </div>



            {/* Texto limpio y directo */}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>

              <p style={{ margin: 0, color: 'var(--text-primary)' }}>

                {modalProyectoInfo.desc}

              </p>



              {/* Baremos oficiales */}

              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-card, rgba(0,0,0,0.03))', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '12px' }}>

                <span><strong>Dieta:</strong> {modalProyectoInfo.esJunta ? '60,00 €' : '53,34 €'}/día</span>

                <span style={{ color: 'var(--border-color)' }}>|</span>

                <span><strong>Hotel:</strong> {modalProyectoInfo.esJunta ? '120,00 €' : '102,56 €'}/noche</span>

                <span style={{ color: 'var(--border-color)' }}>|</span>

                <span><strong>Km:</strong> 0,26 €/km</span>

              </div>



              {/* Fiscalidad IRPF */}

              <div>

                <strong style={{ color: 'var(--text-primary)' }}>Fiscalidad IRPF: </strong>

                <span>

                  {modalProyectoInfo.irpfDetalle || (modalProyectoInfo.esJunta 

                    ? 'Aplica retención del 15% sobre el exceso que supere los 53,34 €/día exentos.' 

                    : '100% exento de retención en IRPF.')}

                </span>

              </div>



              {/* Convocatorias habituales */}

              <div>

                <strong style={{ color: 'var(--text-primary)' }}>Convocatorias habituales: </strong>

                <span style={{ color: 'var(--text-muted)' }}>

                  {modalProyectoInfo.ejemplos}

                </span>

              </div>

            </div>



            {/* Pie compacto con acciones */}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>

              {tipoProyecto === modalProyectoInfo.id ? (

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600, fontSize: '12px' }}>

                  <CheckCircle2 size={15} />

                  <span>Seleccionado actualmente</span>

                </div>

              ) : (

                <button

                  type="button"

                  onClick={() => {

                    setTipoProyecto(modalProyectoInfo.id);

                    setModalProyectoInfo(null);

                  }}

                  style={{

                    padding: '0.4rem 0.85rem',

                    borderRadius: '8px',

                    fontSize: '12px',

                    fontWeight: 600,

                    color: '#ffffff',

                    backgroundColor: '#176B52',

                    border: 'none',

                    cursor: 'pointer',

                    display: 'flex',

                    alignItems: 'center',

                    gap: '0.3rem',

                  }}

                  className="hover:opacity-90"

                >

                  <Check size={13} /> Seleccionar este tipo

                </button>

              )}



              <button

                type="button"

                onClick={() => setModalProyectoInfo(null)}

                style={{

                  padding: '0.4rem 0.95rem',

                  borderRadius: '8px',

                  fontSize: '12px',

                  fontWeight: 500,

                  color: 'var(--text-primary)',

                  backgroundColor: 'transparent',

                  border: '1px solid var(--border-color)',

                  cursor: 'pointer',

                  marginLeft: 'auto',

                }}

                className="hover:bg-zinc-100 dark:hover:bg-zinc-800"

              >

                Cerrar

              </button>

            </div>

          </div>

        </div>

      )}



      {/* VENTANA MODAL FLOTANTE DEL VISOR DE DOCUMENTOS DE ENTRADA (FONDO OSCURO BORROSO) */}
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
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
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
            {/* Cabecera de la Ventana Modal */}
            <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-[#176B52] dark:text-emerald-300 shrink-0">
                  {docEnVisor.tipo === 'xlsx' ? (
                    <FileSpreadsheet size={18} />
                  ) : docEnVisor.tipo === 'docx' ? (
                    <FileText size={18} />
                  ) : docEnVisor.tipo === 'pdf' ? (
                    <FileText size={18} className="text-rose-600" />
                  ) : (
                    <Eye size={18} />
                  )}
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
                    {docEnVisor.tipo === 'xlsx' && 'Visualizador interactivo de hoja de cálculo Excel'}
                    {docEnVisor.tipo === 'docx' && 'Visualizador estructurado de documento Word (.docx)'}
                    {docEnVisor.tipo === 'pdf' && 'Visualizador integrado de documento PDF'}
                    {docEnVisor.tipo === 'imagen' && 'Visualizador de imagen'}
                    {docEnVisor.tipo === 'texto' && 'Visualizador de archivo de texto'}
                  </p>
                </div>
              </div>

              {/* Acciones de la Ventana */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={docEnVisor.download_url || `/api/caso/${encodeURIComponent(result?.caso_id || casoSel || '')}/archivo/${encodeURIComponent(docEnVisor.nombre)}?download=1`}
                  download={docEnVisor.nombre}
                  className="btn btn-outline btn-xs flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold px-3 py-1.5 rounded-lg"
                  title="Descargar este archivo a su ordenador"
                >
                  <Download size={13} />
                  <span>Descargar Archivo</span>
                </a>
                <button
                  type="button"
                  onClick={() => setDocEnVisor(null)}
                  className="btn btn-ghost btn-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all font-semibold cursor-pointer"
                  title="Cerrar esta ventana (Esc)"
                >
                  <X size={15} />
                  <span className="text-xs">Cerrar</span>
                </button>
              </div>
            </div>

            {/* Contenido de la Ventana Modal con Scroll Interno - Lienzo con Contraste Editorial */}
            <div
              className="p-4 sm:p-8 flex-1 overflow-y-auto doc-viewer-canvas"
              style={{ backgroundColor: '#CBD5E1' }}
            >
              {loadingDocVisor ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-3">
                  <Loader2 size={32} className="animate-spin text-[#176B52]" />
                  <span className="text-sm font-semibold">Cargando contenido del documento...</span>
                </div>
              ) : errorDocVisor ? (
                <div className="p-6 text-center text-rose-700 bg-white rounded-xl border border-rose-300 max-w-lg mx-auto my-12 shadow-lg">
                  <AlertOctagon size={32} className="mx-auto mb-2 text-rose-600" />
                  <p className="font-semibold text-sm mb-1">No se pudo cargar la vista previa directa</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">{errorDocVisor}</p>
                  <a
                    href={docEnVisor.download_url}
                    download={docEnVisor.nombre}
                    className="btn btn-primary btn-sm bg-[#176B52] hover:bg-[#125440] text-white font-semibold"
                  >
                    <Download size={14} className="mr-1.5" />
                    Descargar archivo directamente
                  </a>
                </div>
              ) : docEnVisor.tipo === 'docx' ? (
                <div
                  className="max-w-3xl mx-auto p-8 sm:p-12 rounded-xl space-y-4 doc-viewer-sheet"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #94A3B8',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                    margin: '16px auto 32px auto'
                  }}
                >
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-6 flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                      Documento Word · {docEnVisor.total_parrafos || docEnVisor.parrafos?.length || 0} párrafos
                    </span>
                    <span className="text-[11px] font-bold text-[#176B52] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      UEx SGTRI
                    </span>
                  </div>
                  {docEnVisor.parrafos && docEnVisor.parrafos.length > 0 ? (
                    docEnVisor.parrafos.map((pText: string, pIdx: number) => {
                      const esTitulo = pText.toUpperCase() === pText && pText.length < 120 && pText.length > 4;
                      const esSubtitulo = pText.startsWith('---') || pText.startsWith('•') || pText.startsWith('*');
                      if (esTitulo) {
                        return (
                          <h3 key={pIdx} className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 pt-3 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                            {pText}
                          </h3>
                        );
                      }
                      return (
                        <p key={pIdx} className={`text-xs sm:text-sm leading-relaxed ${esSubtitulo ? 'font-semibold text-zinc-800 dark:text-zinc-200 pl-2 border-l-2 border-[#176B52]' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {pText}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-zinc-500 text-xs italic text-center py-8">Documento sin contenido de texto extraíble.</p>
                  )}
                </div>
              ) : docEnVisor.tipo === 'xlsx' ? (
                <div className="space-y-4 max-w-5xl mx-auto my-3">
                  {docEnVisor.hojas && docEnVisor.hojas.length > 1 && (
                    <div className="flex items-center gap-2 pb-1 overflow-x-auto">
                      {docEnVisor.hojas.map((h: any, hIdx: number) => (
                        <button
                          key={hIdx}
                          type="button"
                          onClick={() => setHojaExcelActiva(hIdx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                            hojaExcelActiva === hIdx
                              ? 'bg-[#176B52] text-white shadow-sm'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50'
                          }`}
                        >
                          {h.nombre} ({h.total_filas || h.filas?.length || 0})
                        </button>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const hoja = docEnVisor.hojas ? docEnVisor.hojas[hojaExcelActiva] || docEnVisor.hojas[0] : null;
                    if (!hoja) {
                      return <p className="text-zinc-500 text-xs text-center py-8 bg-white rounded-xl">Hoja de cálculo vacía.</p>;
                    }
                    return (
                      <div
                        className="rounded-xl overflow-hidden doc-viewer-sheet"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #94A3B8',
                          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.12)'
                        }}
                      >
                        <div className="overflow-x-auto max-h-[550px]">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-[#176B52]/10 dark:bg-[#176B52]/20 text-zinc-800 dark:text-zinc-200 sticky top-0 z-10 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 font-bold">
                              <tr>
                                {hoja.encabezados?.map((header: string, cIdx: number) => (
                                  <th key={cIdx} className="px-3 py-2.5 whitespace-nowrap border-r border-zinc-200/50 dark:border-zinc-800/50 last:border-r-0">
                                    {header || `Columna ${cIdx + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                              {hoja.filas?.map((row: string[], rIdx: number) => (
                                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/60 dark:bg-zinc-800/20'}>
                                  {row.map((val: string, vIdx: number) => (
                                    <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-300 border-r border-zinc-200/40 dark:border-zinc-800/40 last:border-r-0">
                                      {val}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-200 dark:border-zinc-800 text-[11px] text-zinc-600 flex justify-between font-medium">
                          <span>Hoja activa: <strong>{hoja.nombre}</strong></span>
                          <span>Total filas computadas: {hoja.total_filas || hoja.filas?.length || 0}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : docEnVisor.tipo === 'pdf' ? (
                <div
                  className="w-full h-full min-h-[520px] max-w-5xl mx-auto rounded-xl overflow-hidden doc-viewer-sheet"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #94A3B8',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18)'
                  }}
                >
                  <iframe
                    src={docEnVisor.url_raw}
                    title={`Visor ${docEnVisor.nombre}`}
                    className="w-full h-full border-none"
                    style={{ minHeight: '520px' }}
                  />
                </div>
              ) : docEnVisor.tipo === 'imagen' ? (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={docEnVisor.url_raw}
                    alt={docEnVisor.nombre}
                    className="max-h-[65vh] max-w-full rounded-xl shadow-xl border border-slate-300 dark:border-zinc-700 object-contain"
                  />
                </div>
              ) : (
                <div
                  className="p-6 rounded-xl overflow-auto max-h-[500px] max-w-3xl mx-auto doc-viewer-sheet"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #94A3B8',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18)'
                  }}
                >
                  <pre className="text-xs font-mono text-zinc-800 whitespace-pre-wrap leading-relaxed">
                    {docEnVisor.texto || 'Archivo sin contenido textual legible.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para nombrar nuevo expediente al subir desde cero */}
      {modalNombrarCasoOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            margin: 0
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalNombrarCasoOpen(false);
              setPendingFiles([]);
            }
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 space-y-4 animate-scale-in"
            style={{ maxWidth: "480px", width: "100%", margin: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-[#176B52]" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Nombre del Nuevo Expediente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setModalNombrarCasoOpen(false); setPendingFiles([]); }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Va a crear un nuevo expediente aportando <strong>{pendingFiles.length} documento(s)</strong>. Indique el nombre o identificador oficial para registrar la carpeta y el expediente:
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre o Identificador del Expediente
                </label>
                <input
                  type="text"
                  value={nombreNuevoCaso}
                  onChange={(e) => setNombreNuevoCaso(e.target.value)}
                  placeholder="Ej: Viaje_Madrid_SISTEDES"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const nombreFinal = nombreNuevoCaso.trim();
                      setModalNombrarCasoOpen(false);
                      subirArchivos(pendingFiles, nombreFinal);
                      setPendingFiles([]);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                <p>• Se creará una carpeta en el servidor con este identificador.</p>
                <p>• Si lo deja en blanco, se asignará automáticamente el identificador oficial secuencial (ej: 05_Expediente_Dietas).</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => { setModalNombrarCasoOpen(false); setPendingFiles([]); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const nombreFinal = nombreNuevoCaso.trim();
                  setModalNombrarCasoOpen(false);
                  subirArchivos(pendingFiles, nombreFinal);
                  setPendingFiles([]);
                }}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#176B52] hover:bg-[#125842] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check size={14} />
                <span>Crear y Subir Justificantes</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para renombrar expediente existente */}
      {modalRenombrarOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            margin: 0
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalRenombrarOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 space-y-4 animate-scale-in"
            style={{ maxWidth: "480px", width: "100%", margin: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-[#176B52]" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Renombrar Expediente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRenombrarOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Modifique el nombre o identificador del expediente. Se actualizará la carpeta física en el servidor y los registros contables.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nuevo Nombre / Identificador
                </label>
                <input
                  type="text"
                  value={nuevoNombreRenombrar}
                  onChange={(e) => setNuevoNombreRenombrar(e.target.value)}
                  placeholder="Ej: Viaje_Madrid_SISTEDES"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      ejecutarRenombrarCaso();
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setModalRenombrarOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={renombrando || !nuevoNombreRenombrar.trim()}
                onClick={ejecutarRenombrarCaso}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#176B52] hover:bg-[#125842] disabled:opacity-50 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {renombrando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de confirmación para eliminar expediente completo */}
      {modalEliminarOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            margin: 0
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !eliminandoCaso) setModalEliminarOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-xl shadow-2xl p-6 space-y-4 animate-scale-in"
            style={{ maxWidth: "480px", width: "100%", margin: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Eliminar Expediente
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {casoSel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={eliminandoCaso}
                onClick={() => setModalEliminarOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer disabled:opacity-50"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                ¿Está seguro de que desea eliminar permanentemente el expediente <strong className="font-mono text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">{casoSel}</strong>?
              </p>
              <div
                style={{
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '11px',
                  color: '#9f1239',
                  lineHeight: '1.45'
                }}
                className="dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300"
              >
                <p style={{ fontWeight: 700, marginBottom: '4px' }}>Esta acción es irreversible y permanente.</p>
                <p>
                  Se eliminará la carpeta física del expediente en el servidor, todos sus documentos aportados ({casoDetalle?.archivos?.length || 0} archivo(s)) y los informes oficiales o liquidaciones emitidas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                disabled={eliminandoCaso}
                onClick={() => setModalEliminarOpen(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary, #475569)',
                  cursor: 'pointer'
                }}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminandoCaso}
                onClick={ejecutarEliminarCaso}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: '1px solid #b91c1c',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                }}
                className="hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {eliminandoCaso ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>

  );

}

