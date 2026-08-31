import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  ChevronRight, ArrowRight, Play, Loader2, AlertTriangle, CheckCircle, RefreshCw, UploadCloud, X, Trash2,
  ChevronLeft, RotateCcw, Check, Eye, CheckCircle2, FileText, FolderOpen, Printer, Info
} from 'lucide-react'
import { ViewGrafo } from './ViewGrafo'
import { cn, pollTask } from '../../lib/utils'
import { TEMPLATES } from '../../lib/data'
import type { CasoResult } from '../../lib/types'
import { Btn } from '../ui/Btn'
import { DarkBadge, StatusBadge } from '../ui/Badges'
import { AlertErr, RunningInfo } from '../ui/Alerts'
import { Tabs } from '../ui/Tabs'
import { LogViewer } from '../ui/LogViewer'
export function ViewProcesar({
  initialCaso,
  templateId,
  onVolver,
  onInspeccionarCaso
}: {
  initialCaso?: string;
  templateId?: string;
  onVolver: () => void;
  onInspeccionarCaso: (id: string) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateId || 'dietas')
  const isDietas = selectedTemplate === 'dietas'

  const [currentStep, setCurrentStep] = useState<number>(templateId ? 2 : (initialCaso ? 2 : 1))
  const [previewTemplateModal, setPreviewTemplateModal] = useState<typeof TEMPLATES[0] | null>(null)

  const [casoSel, setCasoSel] = useState(initialCaso || '')
  const [tipoProyecto, setTipoProyecto] = useState('')
  const [casos, setCasos] = useState<{ id: string, tipo: string, total_archivos?: number, porcentaje?: number, completo?: boolean }[]>([])
  const [running, setRunning] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>()
  const [result, setResult] = useState<CasoResult | null>(null)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const tieneFicheroOExpediente = Boolean(casoSel || files.length > 0)

  useEffect(() => {
    fetch('/api/casos').then(r => r.json()).then(d => setCasos(d.casos || [])).catch(() => { })
  }, [])

  const casosFiltrados = useMemo(() => {
    if (!selectedTemplate) return casos
    return casos.filter(c => c.tipo === selectedTemplate)
  }, [casos, selectedTemplate])

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files)
      setFiles(prev => [...prev, ...dropped])
      setCasoSel('')
      setError('')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selected])
      setCasoSel('')
      setError('')
    }
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const ejecutar = useCallback(async () => {
    let targetCaso = casoSel
    setRunning(true); setError(''); setResult(null)
    try {
      if (!targetCaso) {
        if (files.length === 0) throw new Error("Debe seleccionar un expediente o subir los archivos para justificar el gasto.")
        const fd = new FormData()
        files.forEach(f => fd.append('files', f))
        const res = await fetch('/api/caso/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        targetCaso = data.caso_id
        setCasoSel(targetCaso)
      }

      // Si el procedimiento no es dietas, no requiere tipo_proyecto
      const reqTipoProyecto = isDietas ? tipoProyecto : ''

      const s = await fetch('/api/caso/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caso_id: targetCaso, tipo_proyecto: reqTipoProyecto }),
      })
      const { task_id } = await s.json()
      setActiveTaskId(task_id)
      const res = await pollTask<CasoResult>(task_id)
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }, [casoSel, files, tipoProyecto, isDietas])

  const reiniciarTramite = () => {
    setResult(null)
    setError('')
    setCurrentStep(1)
    setCasoSel('')
    setFiles([])
    setTipoProyecto('')
  }

  const STEPS = isDietas ? [
    { num: 1, label: 'Procedimiento' },
    { num: 2, label: 'DocumentaciÃ³n' },
    { num: 3, label: 'RÃ©gimen Normativo' },
    { num: 4, label: 'ConfirmaciÃ³n' },
  ] : [
    { num: 1, label: 'Procedimiento' },
    { num: 2, label: 'DocumentaciÃ³n' },
    { num: 3, label: 'ConfirmaciÃ³n' },
  ]

  const totalSteps = STEPS.length

  return (
    <div className="space-y-6 animate-fade-in max-w-[90vw] mx-auto">

      {/* Cabecera del Proceso */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Volver al inicio"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Automatizar TramitaciÃ³n
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Flujo guiado de cÃ¡lculo normativo y liquidaciÃ³n oficial de gastos.
            </p>
          </div>
        </div>

        {result && (
          <Btn variant="outline" size="sm" onClick={reiniciarTramite}>
            <RotateCcw size={13} /> Nueva liquidaciÃ³n
          </Btn>
        )}
      </div>

      {/* ASISTENTE WIZARD */}
      {!result && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-8 shadow-sm space-y-8 pb-32">

          {/* Barra de progreso de pasos */}
          <div className="flex items-center justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {STEPS.map((s) => (
                <button
                  key={s.num}
                  onClick={() => {
                    if (s.num === 1) setCurrentStep(1)
                    if (s.num === 2) setCurrentStep(2)
                    if (s.num >= 3 && tieneFicheroOExpediente) setCurrentStep(s.num)
                  }}
                  disabled={s.num > 2 && !tieneFicheroOExpediente}
                  className="flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed group shrink-0"
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200",
                      currentStep === s.num
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                        : currentStep > s.num
                          ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    )}
                  >
                    {currentStep > s.num ? <Check size={13} /> : s.num}
                  </div>
                  <span className={cn("text-xs font-bold", currentStep === s.num ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400")}>
                    {s.label}
                  </span>
                  {s.num < totalSteps && <span className="text-zinc-300 dark:text-zinc-700 mx-1">/</span>}
                </button>
              ))}
            </div>

            <span className="text-xs text-zinc-400 font-mono font-semibold shrink-0">Paso {currentStep} de {totalSteps}</span>
          </div>

          {/* PASO 1: SELECCIÃ“N DE PLANTILLA / PROCEDIMIENTO */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  1. SelecciÃ³n del procedimiento oficial
                </h3>
                <p className="text-xs text-zinc-500">
                  Seleccione el modelo o impreso oficial que desea tramitar para esta comisiÃ³n.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-5">
                {TEMPLATES.map(t => {
                  const isSelected = selectedTemplate === t.id
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        "w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.833rem)] max-w-[450px]",
                        "p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group",
                        isSelected
                          ? "bg-gradient-to-br from-emerald-50/40 to-emerald-100/50 dark:from-emerald-950/20 dark:to-black border-emerald-500/50 dark:border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] dark:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] scale-[1.02]"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md"
                      )}
                    >
                      <div>


                        {/* Contenedor de Miniatura NÃTIDA en alta resoluciÃ³n */}
                        <div
                          onClick={(e) => { e.stopPropagation(); setPreviewTemplateModal(t) }}
                          className="relative w-full mb-4 h-50 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700/80 shadow-xs group/img cursor-pointer"
                          title="Haga clic para ampliar vista previa oficial"
                        >
                          <img
                            src={t.img}
                            alt={t.titulo}
                            className="w-full h-full object-cover object-top opacity-100 transition-transform duration-300 group-hover/img:scale-105"
                            style={{ imageRendering: 'auto' }}
                          />
                          {/* ViÃ±eteado oscuro / Gradient Fade */}
                          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 dark:from-zinc-950/90 dark:via-zinc-950/20 to-transparent pointer-events-none" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-xs">
                            <Eye size={13} /> Ampliar
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-1.5">
                          {t.titulo}
                        </h4>
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {t.desc}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className={cn(
                          "font-bold inline-flex items-center gap-1.5 transition-colors",
                          isSelected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                        )}>
                          {isSelected ? (
                            <>
                              <CheckCircle2 size={13} className="text-zinc-900 dark:text-zinc-100" />
                              <span>Seleccionado</span>
                            </>
                          ) : (
                            <span>Elegir plantilla</span>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPreviewTemplateModal(t) }}
                          className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye size={12} /> Vista previa
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PASO 2: DOCUMENTACIÃ“N */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  2. AportaciÃ³n de justificantes
                </h3>
                <p className="text-xs text-zinc-500">
                  Adjunte los archivos escaneados de la comisiÃ³n o seleccione un expediente previo del repositorio.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Dropzone de archivos */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                    Subir nuevos justificantes (PDF / ImÃ¡genes)
                  </span>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "p-6 rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group min-h-[160px]",
                      isDragging
                        ? "border-zinc-900 bg-zinc-100/90 dark:border-zinc-100 dark:bg-zinc-800"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-3 group-hover:scale-105 transition-transform shadow-xs">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                      Haga clic o arrastre sus justificantes aquÃ­
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      Facturas de hotel, billetes de transporte o tickets
                    </p>
                  </div>

                  {/* Lista de archivos subidos */}
                  {files.length > 0 && (
                    <div className="space-y-2 pt-1 animate-fade-in">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        Archivos adjuntados ({files.length})
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <FileText size={14} className="text-zinc-400 shrink-0" />
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{f.name}</span>
                              <span className="text-[10px] text-zinc-400">({(f.size / 1024).toFixed(0)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                              title="Quitar archivo"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Selector de repositorio con enlace de inspecciÃ³n */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                    O seleccionar expediente del repositorio
                  </span>

                  <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen size={16} className="text-zinc-500" />
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            CatÃ¡logo de expedientes
                          </span>
                        </div>
                        {casoSel && (
                          <button
                            type="button"
                            onClick={() => onInspeccionarCaso(casoSel)}
                            className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Ver / AÃ±adir docs
                          </button>
                        )}
                      </div>

                      <select
                        value={casoSel}
                        onChange={e => {
                          setCasoSel(e.target.value)
                          if (e.target.value) setFiles([])
                          setError('')
                        }}
                        className="w-full px-4 py-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800 dark:text-zinc-200 cursor-pointer font-sans font-medium"
                      >
                        <option value="">Seleccionar expediente de la lista...</option>
                        {casosFiltrados.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.id} â€” [{c.tipo.toUpperCase()}] {c.total_archivos !== undefined ? `(${c.total_archivos} docs - ${c.porcentaje || 0}%)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-4">
                      Permite reproducir y liquidar de forma inmediata un caso registrado en el repositorio institucional.
                    </p>
                  </div>
                </div>

              </div>

              {/* Resumen de confirmaciÃ³n de documentos con botÃ³n de inspecciÃ³n */}
              {tieneFicheroOExpediente && (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-zinc-800 dark:text-zinc-200" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      DocumentaciÃ³n preparada: <span className="font-semibold text-zinc-950 dark:text-zinc-50">{casoSel || `${files.length} archivo(s) adjunto(s)`}</span>
                    </span>
                  </div>
                  {casoSel ? (
                    <button
                      type="button"
                      onClick={() => onInspeccionarCaso(casoSel)}
                      className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={13} /> Inspeccionar requisitos
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Listo para avanzar</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PASO 3 (SOLO PARA DIETAS): RÃ‰GIMEN NORMATIVO */}
          {isDietas && currentStep === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  3. RÃ©gimen de financiaciÃ³n y marco normativo
                </h3>
                <p className="text-xs text-zinc-500">
                  Seleccione las reglas de liquidaciÃ³n y topes legales a aplicar sobre las facturas de hotel y manutenciÃ³n.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {[
                  { id: '', label: 'DetecciÃ³n automÃ¡tica', desc: 'Identifica la normativa segÃºn los justificantes' },
                  { id: 'UEX', label: 'UEX Institucional', desc: 'Tarifa general de la Universidad' },
                  { id: 'G24', label: 'G24 Grupos UEx', desc: 'Ayudas a grupos de investigaciÃ³n' },
                  { id: 'PEI', label: 'PEI Excelencia', desc: 'Proyectos autonÃ³micos de investigaciÃ³n' },
                  { id: 'NAL', label: 'Estatal (BOE)', desc: 'Tope hotel 65,97 â‚¬/noche' },
                  { id: 'JEX', label: 'AutonÃ³mico (DOE)', desc: 'Tope hotel 120,00 â‚¬/noche' },
                ].map(opt => {
                  const isSelected = tipoProyecto === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTipoProyecto(opt.id)}
                      className={cn(
                        "p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between",
                        isSelected
                          ? "bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-50 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900/15 dark:ring-zinc-100/20 shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 hover:bg-zinc-100/50"
                      )}
                    >
                      <div className="font-bold text-xs flex items-center justify-between mb-1.5">
                        <span className={isSelected ? "font-extrabold" : ""}>{opt.label}</span>
                        {isSelected && <Check size={14} className="text-zinc-900 dark:text-zinc-100" />}
                      </div>
                      <span className={cn("text-[11px] leading-relaxed", isSelected ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-400")}>
                        {opt.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* PASO FINAL: CONFIRMACIÃ“N */}
          {((isDietas && currentStep === 4) || (!isDietas && currentStep === 3)) && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  {isDietas ? '4' : '3'}. Resumen y confirmaciÃ³n de la solicitud
                </h3>
                <p className="text-xs text-zinc-500">
                  Revise los parÃ¡metros antes de lanzar el cÃ¡lculo automÃ¡tico.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium">Procedimiento:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {TEMPLATES.find(t => t.id === selectedTemplate)?.titulo || 'LiquidaciÃ³n Oficial'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium">Expediente / Archivos:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">{casoSel || `${files.length} archivo(s) local(es)`}</span>
                </div>
                {isDietas && (
                  <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 font-medium">RÃ©gimen normativo:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{tipoProyecto || 'DetecciÃ³n automÃ¡tica'}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Documento resultante:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Ticket contable y PDF oficial SGTRI</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Btn size="lg" onClick={ejecutar} disabled={running} className="w-full sm:w-auto px-10 py-4 shadow-lg text-sm">
                  {running ? <><Loader2 size={16} className="animate-spin" /> Procesando liquidaciÃ³n...</> : <><Play size={16} fill="currentColor" /> Iniciar LiquidaciÃ³n</>}
                </Btn>
              </div>
            </div>
          )}

          {/* BARRA DE NAVEGACIÃ“N (FLECHAS Y PUNTITOS) */}
          <div className="fixed bottom-0 left-0 sm:left-64 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-4 sm:px-8 flex items-center justify-between animate-fade-in-up">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || running}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-2xl border transition-colors cursor-pointer",
                currentStep > 1 && !running
                  ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                  : "opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            <div className="flex items-center gap-2">
              {STEPS.map((s) => (
                <button
                  key={s.num}
                  onClick={() => {
                    if (s.num === 1) setCurrentStep(1)
                    if (s.num === 2) setCurrentStep(2)
                    if (s.num >= 3 && tieneFicheroOExpediente) setCurrentStep(s.num)
                  }}
                  disabled={(s.num > 2 && !tieneFicheroOExpediente) || running}
                  title={`Ir al paso ${s.num}`}
                  className="p-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      currentStep === s.num
                        ? "w-8 bg-zinc-900 dark:bg-zinc-100"
                        : "w-2 bg-zinc-300 dark:bg-zinc-700"
                    )}
                  />
                </button>
              ))}
            </div>

            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                disabled={(currentStep === 2 && !tieneFicheroOExpediente) || running}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-2xl transition-all duration-200 cursor-pointer",
                  (currentStep !== 2 || tieneFicheroOExpediente) && !running
                    ? "bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-sm"
                    : "opacity-30 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                )}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <div className="w-24" />
            )}
          </div>

          {running && (
            <div className="mt-4">
              <RunningInfo
                text="Procesando expediente y aplicando reglas contables..."
                sub="El sistema estÃ¡ extrayendo los conceptos de los justificantes y cruzando las tarifas."
              />
            </div>
          )}
          {error && <AlertErr msg={error} />}
        </div>
      )}

      {/* MODAL DE VISTA PREVIA DE PLANTILLA */}
      {previewTemplateModal && (
        <div
          onClick={() => setPreviewTemplateModal(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-5xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <DarkBadge label={previewTemplateModal.badge} />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">{previewTemplateModal.titulo}</h3>
              </div>
              <button
                onClick={() => setPreviewTemplateModal(null)}
                className="p-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                âœ•
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-2">
              <img src={previewTemplateModal.img} alt={previewTemplateModal.titulo} className="w-full h-auto rounded-xl shadow-sm" />
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <p className="text-xs text-zinc-500">{previewTemplateModal.desc}</p>
              <Btn
                onClick={() => { setSelectedTemplate(previewTemplateModal.id); setPreviewTemplateModal(null); setCurrentStep(2); }}
                size="md"
              >
                <Play size={13} fill="currentColor" /> Seleccionar y continuar
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* RESULTADOS (Fluidos en la misma pÃ¡gina) */}
      {result && !running && (
        <div ref={resultRef} className="space-y-8 animate-fade-in-up">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Resultado Oficial</span>
                <StatusBadge ok={result.ok} sinGt={result.sin_ground_truth} />
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                Expediente: {result.caso_id}
              </h3>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Btn size="md" variant="outline" onClick={reiniciarTramite}>
                <RotateCcw size={14} /> Nuevo TrÃ¡mite
              </Btn>
              <Btn size="md" variant="outline" onClick={() => window.open(`/api/txt/generar/${result.caso_id}`, '_blank')}>
                <FileText size={14} /> Memoria TXT
              </Btn>
              <Btn size="md" variant="primary" onClick={() => window.open(`/api/pdf/generar/${result.caso_id}`, '_blank')}>
                <Printer size={14} /> Descargar PDF Oficial
              </Btn>
            </div>
          </div>

          <div className={cn("grid gap-5", result.sin_ground_truth ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                {result.sin_ground_truth ? "Propuesta de LiquidaciÃ³n" : "Importe Calculado"}
              </p>
              <p className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
                {result.liquido_ag.toFixed(2)} â‚¬
              </p>
            </div>

            {!result.sin_ground_truth && (
              <>
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Total Justificado</p>
                  <p className="text-3xl font-extrabold font-mono text-zinc-600 dark:text-zinc-400">
                    {result.liquido_esp.toFixed(2)} â‚¬
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">DesviaciÃ³n</p>
                  <p className={cn("text-3xl font-extrabold font-mono", Math.abs(result.delta) < 0.02 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {result.delta >= 0 ? '+' : ''}{result.delta.toFixed(2)} â‚¬
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">PrecisiÃ³n</p>
                  <p className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                    {Math.round(result.precision * 100)}%
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
            <Tabs tabs={[
              {
                label: 'Desglose de LiquidaciÃ³n',
                content: (
                  <div className="space-y-8">
                    {result.liquidacion && (result.liquidacion as any).conceptos ? (() => {
                      const liq = result.liquidacion as any
                      const manutencion = liq.conceptos.manutencion
                      const transporte = liq.conceptos.transporte

                      return (
                        <>
                          <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                              <Info size={14} className="text-zinc-400" />
                              Tarifas y parÃ¡metros aplicados
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-zinc-500 block">FinanciaciÃ³n:</span>
                                <span className="font-bold uppercase font-mono">{(liq.identificacion?.fuente_financiacion || 'UEX').replace('_', ' ')}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">ManutenciÃ³n:</span>
                                <span className="font-bold font-mono">{(liq.tarifas_aplicadas?.manutencion_dia || 0).toFixed(2)} â‚¬/dÃ­a</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">Tope Hotel:</span>
                                <span className="font-bold font-mono">{(liq.tarifas_aplicadas?.alojamiento_max_dia || 0).toFixed(2)} â‚¬/noche</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">Tarifa Km:</span>
                                <span className="font-bold font-mono">{(liq.tarifas_aplicadas?.km_vehiculo || 0).toFixed(2)} â‚¬/km</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                                1. Dietas de ManutenciÃ³n
                              </h4>
                              <span className="text-xs text-zinc-500">
                                DÃ­as computables: <strong>{manutencion?.factor_total?.toFixed(1) || 0}</strong>
                              </span>
                            </div>

                            <table className="w-full text-left text-xs border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                              <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
                                  <th className="p-3.5">Fecha</th>
                                  <th className="p-3.5">Tipo de Jornada</th>
                                  <th className="p-3.5 text-right">Factor</th>
                                  <th className="p-3.5 text-right">Importe</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {manutencion?.detalle_dias?.map((d: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-3.5 font-mono">{d.dia}</td>
                                    <td className="p-3.5 capitalize text-zinc-600 dark:text-zinc-400">{d.tipo}</td>
                                    <td className="p-3.5 text-right font-mono">{d.factor.toFixed(1)}x</td>
                                    <td className="p-3.5 text-right font-mono font-bold">{d.importe.toFixed(2)} â‚¬</td>
                                  </tr>
                                ))}
                                <tr className="bg-zinc-50/80 dark:bg-zinc-950 font-bold border-t border-zinc-200 dark:border-zinc-800">
                                  <td colSpan={3} className="p-3.5 text-right">Total ManutenciÃ³n:</td>
                                  <td className="p-3.5 text-right font-mono">{(manutencion?.importe || 0).toFixed(2)} â‚¬</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-2">
                              2. Gastos de Desplazamiento
                            </h4>
                            <table className="w-full text-left text-xs border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                              <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
                                  <th className="p-3.5">Medio</th>
                                  <th className="p-3.5">Itinerario</th>
                                  <th className="p-3.5 text-center">Detalle / Km</th>
                                  <th className="p-3.5 text-right">Abonable</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {transporte?.vehiculo_particular?.kilometros > 0 && (
                                  <tr>
                                    <td className="p-3.5 font-semibold">VehÃ­culo propio</td>
                                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">{transporte.vehiculo_particular.itinerario || 'Desplazamiento'}</td>
                                    <td className="p-3.5 text-center font-mono">{transporte.vehiculo_particular.kilometros} km</td>
                                    <td className="p-3.5 text-right font-mono font-bold">{transporte.vehiculo_particular.importe.toFixed(2)} â‚¬</td>
                                  </tr>
                                )}
                                {transporte?.otros_transportes?.detalle?.map((t: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-3.5 font-semibold capitalize">{t.medio || 'PÃºblico'}</td>
                                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">{t.itinerario || '-'}</td>
                                    <td className="p-3.5 text-center font-mono text-zinc-400">{t.fecha || '-'}</td>
                                    <td className="p-3.5 text-right font-mono font-bold">{t.importe_abonable.toFixed(2)} â‚¬</td>
                                  </tr>
                                ))}
                                <tr className="bg-zinc-50/80 dark:bg-zinc-950 font-bold border-t border-zinc-200 dark:border-zinc-800">
                                  <td colSpan={3} className="p-3.5 text-right">Total Desplazamiento:</td>
                                  <td className="p-3.5 text-right font-mono">{(transporte?.importe || 0).toFixed(2)} â‚¬</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-2">
                              3. Hospedaje y Alojamiento
                            </h4>
                            <table className="w-full text-left text-xs border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                              <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
                                  <th className="p-3.5">Establecimiento</th>
                                  <th className="p-3.5 text-center">Noches</th>
                                  <th className="p-3.5 text-right">Gasto Real</th>
                                  <th className="p-3.5 text-right">Importe Abonable</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {(!liq.conceptos.alojamiento?.detalle || liq.conceptos.alojamiento.detalle.length === 0) ? (
                                  <tr><td colSpan={4} className="p-3 text-center text-zinc-400 italic">No constan facturas de alojamiento</td></tr>
                                ) : (
                                  liq.conceptos.alojamiento.detalle.map((a: any, i: number) => (
                                    <tr key={i}>
                                      <td className="p-3.5 font-semibold">{a.establecimiento || 'Hotel'}</td>
                                      <td className="p-3.5 text-center font-mono">{a.noches}</td>
                                      <td className="p-3.5 text-right font-mono">{a.importe_real.toFixed(2)} â‚¬</td>
                                      <td className="p-3.5 text-right font-mono font-bold">{a.importe_abonable.toFixed(2)} â‚¬</td>
                                    </tr>
                                  ))
                                )}
                                <tr className="bg-zinc-50/80 dark:bg-zinc-950 font-bold border-t border-zinc-200 dark:border-zinc-800">
                                  <td colSpan={3} className="p-3.5 text-right">Total Alojamiento:</td>
                                  <td className="p-3.5 text-right font-mono">{(liq.conceptos.alojamiento?.importe || 0).toFixed(2)} â‚¬</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="p-7 bg-zinc-900 text-white dark:bg-zinc-950 dark:text-zinc-100 rounded-3xl border border-zinc-800 shadow-lg">
                            <div className="flex justify-between items-baseline mb-4">
                              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Devengado Bruto</span>
                              <span className="font-mono font-bold text-xl text-zinc-100">
                                {(liq.resumen_economico?.total_devengado || 0).toFixed(2)} â‚¬
                              </span>
                            </div>

                            {((liq.resumen_economico?.anticipo_descontado || 0) > 0 || (liq.resumen_economico?.retencion_irpf || 0) > 0) && (
                              <div className="space-y-2 border-t border-zinc-800 pt-3 mb-4 text-xs">
                                {(liq.resumen_economico?.anticipo_descontado || 0) > 0 && (
                                  <div className="flex justify-between text-rose-400 font-semibold">
                                    <span>Anticipos previos deducidos:</span>
                                    <span className="font-mono">-{(liq.resumen_economico.anticipo_descontado).toFixed(2)} â‚¬</span>
                                  </div>
                                )}
                                {(liq.resumen_economico?.retencion_irpf || 0) > 0 && (
                                  <div className="flex justify-between text-rose-400 font-semibold">
                                    <span>RetenciÃ³n fiscal IRPF:</span>
                                    <span className="font-mono">-{(liq.resumen_economico.retencion_irpf).toFixed(2)} â‚¬</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="p-4 bg-white/10 dark:bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between shadow-inner">
                              <span className="font-bold text-xs uppercase tracking-wider text-zinc-300">LÃ­quido a Percibir</span>
                              <span className="font-mono text-2xl font-extrabold text-white">
                                {(liq.resumen_economico?.liquido_a_abonar || 0).toFixed(2)} â‚¬
                              </span>
                            </div>
                          </div>
                        </>
                      )
                    })() : (
                      <p className="text-xs text-zinc-500">No hay datos disponibles.</p>
                    )}
                  </div>
                ),
              },
              {
                label: 'Esquema JSON',
                content: (
                  <div className="bg-[#09090b] p-6 rounded-3xl border border-zinc-800 overflow-x-auto shadow-inner">
                    <pre className="text-xs font-mono text-zinc-300">
                      {JSON.stringify({ extraccion: result.extraccion, liquidacion: result.liquidacion }, null, 2)}
                    </pre>
                  </div>
                ),
              },
              { label: 'AuditorÃ­a y Trazabilidad', content: <LogViewer raw={result.logs} /> },
              { label: 'Grafo de EjecuciÃ³n', content: <ViewGrafo taskId={activeTaskId} /> },
            ]} />
          </div>
        </div>
      )}
    </div>
  )
}





















