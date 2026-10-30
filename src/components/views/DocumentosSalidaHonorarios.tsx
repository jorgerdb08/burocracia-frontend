import React from 'react';
import { Download, FileCheck, AlertOctagon, Info, Scale } from 'lucide-react';

interface Props {
  casoId: string;
  modalidad?: string;
  beneficiario?: string;
  requiereCertificacion?: boolean;
}

export function DocumentosSalidaHonorarios({ casoId, modalidad = 'premio', beneficiario, requiereCertificacion = false }: Props) {
  const esConvenio = modalidad.toLowerCase().includes('convenio') || modalidad.toLowerCase().includes('caso_b');
  const esConferencia = modalidad.toLowerCase().includes('conferencia');
  const esPremio = modalidad.toLowerCase().includes('premio') || (!esConvenio && !esConferencia);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 shadow-xs mt-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileCheck size={16} className="text-[#176B52]" />
            <span>Documentos Oficiales de Salida — Procedimiento de Honorarios UEx</span>
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Beneficiario: <strong className="text-zinc-800 dark:text-zinc-200">{beneficiario || 'Perceptor verificado'}</strong> · Conforme a las directrices vigentes de la SGTRI (Presupuestos UEx 2026).
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.open(`/api/pack/descargar_zip/${casoId}`, '_blank')}
          className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-xs self-start sm:self-auto"
        >
          <Download size={13} />
          <span>Descargar Pack Completo (ZIP)</span>
        </button>
      </div>

      {/* Alertas Oficiales SGTRI */}
      <div className="space-y-2">
        {/* Prohibición de pago con tarjeta */}
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-md text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
          <AlertOctagon size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">IMPORTANTE (Normativa SGTRI):</strong> El pago de honorarios <u>no podrá efectuarse EN NINGÚN CASO mediante la Tarjeta del Investigador</u>. El abono se realiza obligatoriamente mediante transferencia bancaria tras la fiscalización oportuna.
          </div>
        </div>

        {/* Topes retributivos para conferencias */}
        <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-md text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
          <Scale size={15} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-[11.5px]">
            <strong>Topes máximos por conferencias (Normas Ejecución Presupuestaria UEx):</strong>{' '}
            Profesorado de la UEx: <strong>200 €/hora</strong> · Profesorado ajeno a la UEx: <strong>320 €/hora</strong>.
          </div>
        </div>

        {/* Aviso Art. 83 LOU si aplica a convenios */}
        {esConvenio && (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Info size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11.5px]">
              <strong>Contratos y Convenios Art. 83 LOU / Art. 60 LOSU:</strong> El pago de honorarios a favor del personal investigador solo podrá ser librado una vez se <u>COMPRUEBE EL PAGO</u> por parte de la empresa o entidad contratante de la totalidad de la anualidad prevista. Se genera preceptivamente la <strong>Memoria Económica Justificativa</strong>.
            </div>
          </div>
        )}
      </div>

      {/* Grid de Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* 01. ANEXO A */}
        <div className="p-3.5 rounded-md border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                01. Anexo A — Propuesta de Pago
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                OBLIGATORIO
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
              Tarjeta/Propuesta de pago según plantilla oficial (SGTRI V.2.1 2026). <strong>NUNCA nombrado ni tramitado como Anexo II</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.open(`/api/pdf/generar/${casoId}?template=anexo_a`, '_blank')}
            className="btn btn-outline btn-xs self-start flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300 border-emerald-300"
          >
            <Download size={12} />
            <span>Descargar 01_Anexo_A.pdf</span>
          </button>
        </div>

        {/* 01-bis. ANEXO I (MODELO OFICIAL SGTRI) */}
        <div className="p-3.5 rounded-md border border-teal-200 dark:border-teal-800/80 bg-teal-50/30 dark:bg-teal-950/20 flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                01. Anexo I — Propuesta de Pago (SGTRI)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200">
                OBLIGATORIO SGTRI
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
              Modelo oficial clásico Anexo I de la SGTRI. Se genera simultáneamente con el Anexo A para compatibilidad total con todas las unidades tramitadoras.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.open(`/api/pdf/generar/${casoId}?template=anexo_i`, '_blank')}
            className="btn btn-outline btn-xs self-start flex items-center gap-1 font-semibold text-teal-800 dark:text-teal-300 border-teal-300"
          >
            <Download size={12} />
            <span>Descargar 01_Anexo_I.pdf</span>
          </button>
        </div>

        {/* 02. LIQUIDACIÓN DE HONORARIOS SGTRI */}
        <div className="p-3.5 rounded-md border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                02. Liquidación de Honorarios (SGTRI)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                OBLIGATORIO
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
              Modelo oficial de indemnizaciones y retribuciones SGTRI con casilla «Liquidación de honorarios» marcada.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.open(`/api/pdf/generar/${casoId}?template=dietas`, '_blank')}
            className="btn btn-outline btn-xs self-start flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300 border-emerald-300"
          >
            <Download size={12} />
            <span>Descargar 02_Liquidacion.pdf</span>
          </button>
        </div>

        {/* 03. CASO A (DECLARACIÓN) vs CASO B (MEMORIA ECONÓMICA) */}
        {!esConvenio ? (
          <div className="p-3.5 rounded-md border border-blue-200 dark:border-blue-800/80 bg-blue-50/20 dark:bg-blue-950/20 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  03. Declaración Responsable de Incompatibilidades
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                  CONDICIONAL (CASO A)
                </span>
              </div>
              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                Preceptivo para el Caso A (conferencias y premios). El perceptor declara no incurrir en causa de incompatibilidad con el sector público.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.open(`/api/pdf/generar/${casoId}?template=declaracion_honorarios`, '_blank')}
              className="btn btn-outline btn-xs self-start flex items-center gap-1 font-semibold text-blue-800 dark:text-blue-300 border-blue-300"
            >
              <Download size={12} />
              <span>Descargar 03_Declaracion_Resp.pdf</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-md border border-amber-200 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  03. Memoria Económica Justificativa (Art. 83 LOU)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                  OBLIGATORIO (CASO B)
                </span>
              </div>
              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                Memoria económica exigida por la SGTRI para Contratos y Convenios (Art. 83 LOU / Art. 60 LOSU), con certificación de cobro íntegro previo de la anualidad.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.open(`/api/pdf/generar/${casoId}?template=memoria_economica`, '_blank')}
              className="btn btn-outline btn-xs self-start flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300 border-amber-300"
            >
              <Download size={12} />
              <span>Descargar 03_Memoria_Economica.pdf</span>
            </button>
          </div>
        )}

        {/* 04. MODELO 7 CERTIFICACIÓN ACTIVIDAD */}
        <div className={`p-3.5 rounded-md border flex flex-col justify-between gap-3 ${
          esConferencia
            ? 'border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/20 dark:bg-indigo-950/20'
            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                04. Modelo 7 — Certificación de la Actividad
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                esConferencia
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}>
                {esConferencia ? 'OBLIGATORIO (CONFERENCIAS)' : 'OPCIONAL / CONFIRMACIÓN'}
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
              {esConferencia
                ? 'Certifica la impartición de la conferencia/seminario docente y la duración lectiva efectiva.'
                : esPremio
                ? 'Para premios NO se genera por defecto. Puede descargarse si su centro de gasto lo exige.'
                : 'No procede para convenios ni contratos de investigación.'}
            </p>
          </div>
          {(esConferencia || requiereCertificacion) ? (
            <button
              type="button"
              onClick={() => window.open(`/api/pdf/generar/${casoId}?template=modelo_7`, '_blank')}
              className="btn btn-outline btn-xs self-start flex items-center gap-1 font-semibold text-indigo-800 dark:text-indigo-300 border-indigo-300"
            >
              <Download size={12} />
              <span>Descargar 04_Certificacion_Actividad.pdf</span>
            </button>
          ) : esPremio ? (
            <button
              type="button"
              onClick={() => window.open(`/api/pdf/generar/${casoId}?template=modelo_7`, '_blank')}
              className="btn btn-outline btn-xs self-start flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-400"
              title="Generar bajo confirmación del centro de gasto"
            >
              <Download size={12} />
              <span>Generar Modelo 7 (Bajo confirmación)</span>
            </button>
          ) : (
            <span className="text-[11px] text-zinc-400 italic">No procede para convenios</span>
          )}
        </div>
      </div>
    </div>
  );
}
