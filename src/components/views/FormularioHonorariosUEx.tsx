import React, { useState } from 'react';
import {
  UploadCloud, FileSpreadsheet, Download, Sparkles, AlertOctagon, CheckCircle2,
  AlertTriangle, FileCheck, Award, GraduationCap, Briefcase, HelpCircle,
  Building2, Scale, Clock, ShieldAlert, ArrowRight, Loader2
} from 'lucide-react';

interface Props {
  onExpedienteCreado: (casoId: string, datos: any) => void;
  onPlantillaDescargar: () => void;
  expedienteActivoId?: string;
}

export function FormularioHonorariosUEx({ onExpedienteCreado, onPlantillaDescargar, expedienteActivoId }: Props) {
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [datosParsed, setDatosParsed] = useState<any | null>(null);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [pendientes, setPendientes] = useState<string[]>([]);
  const [documentosReq, setDocumentosReq] = useState<any | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  // Manejador de subida de Excel de 2 columnas
  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMensajeExito(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/honorarios/parsear_excel', {
        method: 'POST',
        body: fd
      });
      const parsed = await res.json();
      if (parsed.ok && parsed.datos) {
        setDatosParsed(parsed.datos);
        setAdvertencias(parsed.avisos || []);
        setPendientes(parsed.pendientes || []);
        setDocumentosReq(parsed.documentos_requeridos || null);
        setNombreArchivo(file.name);
        setMensajeExito(`Archivo '${file.name}' analizado con éxito según la normativa SGTRI.`);
      } else {
        alert(`Error al procesar el Excel: ${parsed.error || 'Formato no reconocido'}`);
      }
    } catch (err: any) {
      alert(`Error de red al importar Excel: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar caso de prueba / real (Cátedra Telefónica)
  const handleCargarCasoEjemplo = async () => {
    setLoading(true);
    setMensajeExito(null);
    try {
      const res = await fetch('/api/honorarios/parsear_excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const parsed = await res.json();
      if (parsed.ok && parsed.datos) {
        setDatosParsed(parsed.datos);
        setAdvertencias(parsed.avisos || []);
        setPendientes(parsed.pendientes || []);
        setDocumentosReq(parsed.documentos_requeridos || null);
        setNombreArchivo('Honorarios_Caso_Real_Dos_Columnas.xlsx');
        setMensajeExito('Caso real de ejemplo (Cátedra Telefónica 24/25) cargado y analizado.');
      } else {
        alert('No se pudo cargar el caso de ejemplo.');
      }
    } catch (err: any) {
      alert(`Error al cargar caso: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar y registrar expediente en el servidor para generar el pack documental
  const handleRegistrarExpediente = async () => {
    if (!datosParsed) return;
    setLoading(true);
    try {
      const res = await fetch('/api/honorarios/crear_expediente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParsed)
      });
      const data = await res.json();
      if (data.ok) {
        setMensajeExito(`Expediente registrado en el servidor con ID: ${data.caso_id}. Procesando documentación...`);
        onExpedienteCreado(data.caso_id, datosParsed);
      } else {
        alert(`Error al registrar expediente: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error de comunicación: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const modalidad = datosParsed?.modalidad || 'premio';
  const bruto = Number(datosParsed?.importe_bruto || datosParsed?.importe || 0);
  const retencion = Number(datosParsed?.retencion_irpf || (bruto * 0.15));
  const liquido = Number(datosParsed?.liquido || (bruto - retencion));

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-xs space-y-5 animate-fade-in">
      {/* CABECERA Y ACCIONES RÁPIDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Building2 size={16} className="text-[#176B52]" />
            <span>Tramitación de Honorarios UEx (S.G.T.R.I.)</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Procedimiento oficial sin formularios manuales: carga directa mediante Excel de 2 columnas («Campo» y «Valor»).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {expedienteActivoId && (
            <span className="text-[11px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
              Expte: {expedienteActivoId}
            </span>
          )}
          <button
            type="button"
            onClick={handleCargarCasoEjemplo}
            disabled={loading}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
            title="Cargar y auditar el caso real de la Cátedra Telefónica"
          >
            <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Cargar Caso Ejemplo Cátedra Telefónica</span>
          </button>
          <button
            type="button"
            onClick={onPlantillaDescargar}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            title="Descargar plantilla oficial en Excel de dos columnas"
          >
            <Download size={13} />
            <span>Plantilla Excel 2 Col.</span>
          </button>
        </div>
      </div>

      {/* REGLA CRÍTICA OFICIAL SGTRI */}
      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-md text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
        <AlertOctagon size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">Normativa Oficial SGTRI — Prohibición de Pago con Tarjeta:</div>
          <div>
            El pago de honorarios <u>no podrá efectuarse EN NINGÚN CASO mediante la Tarjeta del Investigador</u>. El abono se tramita exclusivamente por transferencia bancaria tras su fiscalización por el Negociado de Gestión de Proyectos de su semidistrito (Cáceres o Badajoz).
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPORTACIÓN DE EXCEL */}
      <div className="p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center space-y-3 bg-[#FAF8F5]/60 dark:bg-zinc-950/40">
        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Importe el archivo Excel de Dos Columnas («Campo» y «Valor»)
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-lg mx-auto">
            El sistema extrae, calcula el 15% de IRPF y audita automáticamente la documentación requerida por el SGTRI según la normativa vigente.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <label className="btn btn-primary btn-sm cursor-pointer flex items-center gap-1.5">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            <span>{nombreArchivo ? `Reemplazar Excel (${nombreArchivo})` : 'Seleccionar Archivo .xlsx'}</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleUploadExcel} className="hidden" disabled={loading} />
          </label>
        </div>
      </div>

      {/* MENSAJE DE ÉXITO */}
      {mensajeExito && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{mensajeExito}</span>
        </div>
      )}

      {/* FICHA DIAGNÓSTICA Y AUDITORÍA SGTRI TRAS LA CARGA */}
      {datosParsed && (
        <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 animate-fade-in">
          {/* 1. CLASIFICACIÓN DEL CASO SGTRI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Caso 1: Conferencias */}
            <div className={`p-3 rounded-lg border transition-all ${
              modalidad === 'conferencia'
                ? 'border-[#176B52] bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-[#176B52]'
                : 'border-zinc-200 dark:border-zinc-800 opacity-60'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={16} className={modalidad === 'conferencia' ? 'text-[#176B52]' : 'text-zinc-400'} />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Caso 1. Conferencias</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Ponencias o docencia. Exige <strong>Certificado de Actividad (Modelo 7)</strong>.
              </p>
              <div className="mt-2 text-[10.5px] font-mono text-zinc-600 dark:text-zinc-400 space-y-0.5">
                <div>• Profesorado UEx: máx. <strong>200 €/h</strong></div>
                <div>• Profesorado ajeno: máx. <strong>320 €/h</strong></div>
              </div>
              {modalidad === 'conferencia' && (
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded">
                  ✓ Caso Detectado
                </span>
              )}
            </div>

            {/* Caso 2: Convenios Art. 83 */}
            <div className={`p-3 rounded-lg border transition-all ${
              modalidad === 'convenio'
                ? 'border-[#176B52] bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-[#176B52]'
                : 'border-zinc-200 dark:border-zinc-800 opacity-60'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase size={16} className={modalidad === 'convenio' ? 'text-[#176B52]' : 'text-zinc-400'} />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Caso 2. Convenios Art. 83</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Personal investigador en contratos/convenios. Exige <strong>Memoria Económica</strong>.
              </p>
              <div className="mt-2 text-[10.5px] font-mono text-zinc-600 dark:text-zinc-400 space-y-0.5">
                <div>• Preceptivo pago previo de la anualidad</div>
                <div>• No procede Modelo 7 ni Dec. Responsable</div>
              </div>
              {modalidad === 'convenio' && (
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded">
                  ✓ Caso Detectado
                </span>
              )}
            </div>

            {/* Caso 3: Premios u Otros */}
            <div className={`p-3 rounded-lg border transition-all ${
              modalidad === 'premio' || modalidad === 'otro'
                ? 'border-[#176B52] bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-[#176B52]'
                : 'border-zinc-200 dark:border-zinc-800 opacity-60'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Award size={16} className={modalidad === 'premio' || modalidad === 'otro' ? 'text-[#176B52]' : 'text-zinc-400'} />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Caso 3. Premios / Otros</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Premios y reconocimientos (TFG/TFM) o colaboraciones especiales con motivo justificado.
              </p>
              <div className="mt-2 text-[10.5px] font-mono text-zinc-600 dark:text-zinc-400 space-y-0.5">
                <div>• Liquidación con Declaración Responsable</div>
                <div>• Modelo 7 solo previa solicitud expresa</div>
              </div>
              {(modalidad === 'premio' || modalidad === 'otro') && (
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded">
                  ✓ Caso Detectado ({modalidad === 'premio' ? 'Premios' : 'Otro'})
                </span>
              )}
            </div>
          </div>

          {/* 2. DESGLOSE ECONÓMICO Y FISCAL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FAF9F7] dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 rounded-lg">
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 uppercase">Importe Total Bruto</div>
              <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {bruto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {datosParsed.horas ? `${datosParsed.horas} hora(s) de dedicación` : 'Honorarios acordados'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Retención IRPF (15%)</div>
              <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                -{retencion.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Normativa fiscal general UEx</div>
            </div>

            <div className="sm:border-l sm:pl-4 border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-bold text-[#176B52] uppercase">Líquido a Transferir</div>
              <div className="text-2xl font-extrabold font-mono text-[#176B52]">
                {liquido.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Abono directo en cuenta bancaria</div>
            </div>
          </div>

          {/* 3. DATOS EXTRACTADOS DEL EXCEL */}
          <div className="p-4 bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-xs space-y-2">
            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Datos Extraídos del Expediente:</span>
              <span className="font-mono text-[11px] text-zinc-400 font-normal">
                Orgánica: {datosParsed.organica || '[Pendiente]'} | Ref: {datosParsed.referencia_proyecto || '[Sin ref]'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-zinc-600 dark:text-zinc-300">
              <div><strong>Beneficiario:</strong> {datosParsed.beneficiario || 'Pendiente de acreditación'}</div>
              <div><strong>DNI/NIF:</strong> {datosParsed.nif || 'Pendiente de acreditación'}</div>
              <div><strong>IBAN:</strong> {datosParsed.iban || 'Pendiente de acreditación'}</div>
              <div><strong>Responsable / IP:</strong> {datosParsed.investigador || 'Investigador Principal'}</div>
              <div><strong>Campus / Ciudad:</strong> {datosParsed.ciudad || 'Cáceres'}</div>
              <div><strong>Alta de Terceros:</strong> {datosParsed.alta_terceros || 'No especificado'}</div>
              <div className="sm:col-span-2 md:col-span-3">
                <strong>Concepto Oficial:</strong> {datosParsed.concepto || datosParsed.objeto || 'Honorarios'}
              </div>
            </div>
          </div>

          {/* 4. AVISOS DE AUDITORÍA Y COMPROBACIONES NORMATIVAS */}
          {advertencias.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Comprobaciones y Dictámenes Normativos SGTRI:</span>
              </div>
              <ul className="list-disc list-inside pl-2 space-y-0.5 text-[11.5px] text-amber-800 dark:text-amber-300">
                {advertencias.map((adv, idx) => (
                  <li key={idx}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. CAMPOS PENDIENTES */}
          {pendientes.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-md text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert size={15} className="text-rose-600 shrink-0" />
                <span>Campos Pendientes de Acreditación (No Inventados):</span>
              </div>
              <ul className="list-disc list-inside pl-2 space-y-0.5 text-[11.5px] text-rose-800 dark:text-rose-300">
                {pendientes.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. DOCUMENTOS QUE SE GENERARÁN */}
          {documentosReq?.obligatorios && (
            <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md space-y-2">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <FileCheck size={15} className="text-[#176B52]" />
                <span>Documentos Oficiales que Componen la Salida SGTRI:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documentosReq.obligatorios.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{doc.nombre}</span>
                    <span className="ml-auto text-[10px] text-zinc-400 font-mono">Obligatorio</span>
                  </div>
                ))}
                {documentosReq.condicionales?.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs opacity-70">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{doc.nombre}</span>
                    <span className="ml-auto text-[10px] text-zinc-400 font-mono">Condicional</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTÓN DE ACCIÓN PRINCIPAL */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleRegistrarExpediente}
              disabled={loading}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              <span>Registrar Expediente y Generar Documentos Oficiales</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
