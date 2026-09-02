import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FolderOpen, X, Download, FileText, CheckCircle2, XCircle, FileSpreadsheet, Plus, HelpCircle, Loader2, CheckCircle, AlertTriangle, Trash2, Play } from 'lucide-react'
import { AlertErr } from '../ui/Alerts'
import type { DetalleCaso } from '../../lib/types'
import { StatusBadge, DarkBadge } from '../ui/Badges'
import { Btn } from '../ui/Btn'
import { cn } from '../../lib/utils'
export function ExpedienteInspectorModal({
  casoId,
  onClose,
  onTramitar
}: {
  casoId: string
  onClose: () => void
  onTramitar: (id: string) => void
}) {
  const [detalle, setDetalle] = useState<DetalleCaso | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargarDetalle = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/caso/${casoId}/detalle`)
      if (!res.ok) throw new Error("No se pudo cargar el expediente")
      const data = await res.json()
      setDetalle(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [casoId])

  useEffect(() => {
    cargarDetalle()
  }, [cargarDetalle])

  const handleUploadMissing = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      const res = await fetch(`/api/caso/${casoId}/adjuntar`, {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDetalle(data.detalle)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleEliminarArchivo = async (filename: string) => {
    if (!window.confirm(`¿Desea eliminar el archivo "${filename}" del expediente?`)) return
    try {
      const res = await fetch(`/api/caso/${casoId}/archivo/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDetalle(data.detalle)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-3xl w-full p-6 sm:p-8 shadow-2xl flex flex-col max-h-[92vh]"
      >

        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Inspección Documental</span>
              {detalle && (
                <DarkBadge label={detalle.tipo.toUpperCase()} />
              )}
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-mono">
              {casoId}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-xs">Analizando contenido y checklist del expediente...</span>
          </div>
        ) : error ? (
          <div className="py-10">
            <AlertErr msg={error} />
          </div>
        ) : detalle && (
          <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">

            {/* 1. CHECKLIST DE REQUISITOS NORMATIVOS */}
            <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-zinc-500" />
                    Estado y Checklist de Requisitos
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Verificación automática de componentes necesarios para la liquidación oficial.
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full border",
                    detalle.completo
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                  )}>
                    {detalle.porcentaje}% Completado
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {detalle.requisitos.map((req) => (
                  <div
                    key={req.id}
                    className={cn(
                      "p-3 rounded-2xl border text-xs flex items-center justify-between transition-colors",
                      req.cumplido
                        ? "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {req.cumplido ? (
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                      )}
                      <span className="font-medium text-[11px]">{req.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase", req.cumplido ? "text-emerald-600" : "text-amber-600")}>
                      {req.cumplido ? "Presente" : "Falta"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. LISTA DE ARCHIVOS DIGITALIZADOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Archivos en el expediente ({detalle.archivos.length})
                </h4>
                <span className="text-[11px] text-zinc-400">PDFs y tablas de cálculo</span>
              </div>

              {detalle.archivos.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-xs text-zinc-400">
                  No hay archivos en este expediente. Puede añadirlos a continuación.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {detalle.archivos.map((archivo, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate pr-3">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                          {archivo.ext === 'xlsx' || archivo.ext === 'xls' ? (
                            <FileSpreadsheet size={15} className="text-zinc-500" />
                          ) : (
                            <FileText size={15} className="text-zinc-500" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{archivo.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {archivo.categoria} â€¢ {(archivo.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`/api/caso/${casoId}/archivo/${encodeURIComponent(archivo.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Ver / Descargar archivo"
                        >
                          <Download size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleEliminarArchivo(archivo.name)}
                          className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="Eliminar archivo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. ZONA PARA AÑADIR DOCUMENTOS FALTANTES */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                Añadir justificante que falte a este expediente
              </span>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-zinc-400 hover:bg-zinc-50 flex items-center justify-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                  onChange={handleUploadMissing}
                  className="hidden"
                />
                {uploading ? (
                  <><Loader2 size={15} className="animate-spin" /> Subiendo y actualizando expediente...</>
                ) : (
                  <><Plus size={15} /> Seleccionar archivos para añadir a {casoId}</>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Footer del Modal */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            Cerrar
          </button>

          <Btn
            size="md"
            variant="primary"
            onClick={() => {
              onClose()
              onTramitar(casoId)
            }}
            disabled={loading}
          >
            <Play size={13} fill="currentColor" /> Tramitar este expediente
          </Btn>
        </div>

      </div>
    </div>
  )
}

