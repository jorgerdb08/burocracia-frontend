import React, { useState, useEffect } from 'react';
import {
  Building2, Clock, User, FileText, Trash2, Edit3, Plus, Save,
  CheckCircle2, AlertCircle, RefreshCw, X, Receipt, Train,
  BedDouble, Utensils, Award, CreditCard, ShieldAlert, Sparkles,
  DollarSign
} from 'lucide-react';
import { fmtEur } from '../../lib/utils';

export interface GastoItem {
  id: string;
  categoria: 'dieta' | 'alojamiento' | 'transporte' | 'inscripcion' | 'factura' | 'suplido' | 'otro';
  concepto: string;
  justificante: string;
  detalle: string;
  importe_solicitado: number;
  importe_abonable: number;
  pagado_por?: string;
  tipo_especifico?: string;
}

interface Props {
  casoId: string;
  extraccion: any;
  liquidacion: any;
  selectedTemplate?: string;
  onDataUpdated: (nuevaExtraccion: any, nuevaLiquidacion: any, nuevoLiquido: number) => void;
}

const limpiarFechaHora = (val: any): string => {
  if (!val) return '';
  let str = String(val).replace('T', ' ').trim();
  // Eliminar segundos finales :00 si están presentes
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(str)) {
    str = str.slice(0, 16);
  }
  return str;
};

export function FormularioLiquidacionEditable({
  casoId,
  extraccion,
  liquidacion,
  selectedTemplate = 'dietas',
  onDataUpdated
}: Props) {
  // 1. Estado de campos de imputación orgánica y proyecto
  const [organica, setOrganica] = useState<string>('');
  const [organicaSecundaria, setOrganicaSecundaria] = useState<string>('');
  const [esMultiorganica, setEsMultiorganica] = useState<boolean>(false);
  const [referenciaProyecto, setReferenciaProyecto] = useState<string>('');
  const [investigadorPrincipal, setInvestigadorPrincipal] = useState<string>('');
  const [fuenteFinanciacion, setFuenteFinanciacion] = useState<string>('plan_estatal');

  // 2. Estado de comisión de servicio y fechas
  const [motivoComision, setMotivoComision] = useState<string>('');
  const [destino, setDestino] = useState<string>('');
  const [fechaSalida, setFechaSalida] = useState<string>('');
  const [fechaRegreso, setFechaRegreso] = useState<string>('');
  const [transportePrincipal, setTransportePrincipal] = useState<string>('tren');

  // 3. Estado de datos del comisionado / perceptor
  const [perceptorNombre, setPerceptorNombre] = useState<string>('');
  const [perceptorNif, setPerceptorNif] = useState<string>('');
  const [perceptorIban, setPerceptorIban] = useState<string>('');
  const [grupoDieta, setGrupoDieta] = useState<string>('2');

  // 4. Lista editable de gastos
  const [gastosList, setGastosList] = useState<GastoItem[]>([]);

  // Estados de control y sincronización
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Modal de edición / adición de gasto
  const [modalGastoOpen, setModalGastoOpen] = useState<boolean>(false);
  const [gastoEnEdicion, setGastoEnEdicion] = useState<GastoItem | null>(null);
  const [isNuevoGasto, setIsNuevoGasto] = useState<boolean>(false);

  // Inicializar estados a partir de extraccion y liquidacion
  useEffect(() => {
    if (!extraccion && !liquidacion) return;

    const ext = extraccion || {};
    const liq = liquidacion || {};
    const ident = liq.identificacion || {};
    const proy = ext.proyecto || {};
    const inv = ext.investigador || {};
    const com = ext.comision || {};

    setOrganica(proy.organica || ident.organica || '');
    const orgSec = proy.organica_secundaria || ident.organica_secundaria || '';
    setOrganicaSecundaria(orgSec);
    setEsMultiorganica(Boolean(orgSec || proy.es_multiorganica || ident.cofinanciacion));
    setReferenciaProyecto(proy.referencia || ident.proyecto || ident.referencia || '');
    setInvestigadorPrincipal(inv.nombre || ident.investigador || '');
    setFuenteFinanciacion(proy.fuente_financiacion || ident.fuente_financiacion || 'plan_estatal');

    setMotivoComision(com.motivo || ident.motivo || '');
    setDestino(com.destino || ident.destino || '');
    setFechaSalida(limpiarFechaHora(com.fecha_hora_salida || ident.fecha_hora_salida || ''));
    setFechaRegreso(limpiarFechaHora(com.fecha_hora_regreso || ident.fecha_hora_regreso || ''));
    const tipoTrans = ext.transporte?.[0]?.tipo || liq.conceptos?.transporte?.detalle?.[0]?.tipo;
    const esVehTrans = tipoTrans === 'vehiculo_particular' || (!tipoTrans && (ext.transporte?.[0]?.km || liq.conceptos?.transporte?.detalle?.[0]?.km));
    setTransportePrincipal(esVehTrans ? 'vehiculo_particular' : (tipoTrans || 'tren'));

    setPerceptorNombre(inv.nombre || ident.investigador || '');
    setPerceptorNif(inv.nif || ident.nif || '');
    setPerceptorIban(inv.iban || ident.iban || '');
    setGrupoDieta(String(inv.grupo_dieta || ident.grupo_dieta || '2'));

    // Normalizar lista de gastos
    const items: GastoItem[] = [];

    // Manutención / Dietas
    if (liq.conceptos?.manutencion) {
      const man = liq.conceptos.manutencion;
      items.push({
        id: 'man_1',
        categoria: 'dieta',
        concepto: 'Dietas de Manutención (RD 462/2002)',
        justificante: 'Convocatoria y Orden de Comisión',
        detalle: `${man.factor_total || 0} dietas (${man.num_dias_naturales || 0} días naturales)`,
        importe_solicitado: man.importe || 0,
        importe_abonable: man.importe || 0,
        tipo_especifico: 'manutencion'
      });
    }

    // Alojamiento / Hoteles
    if (liq.conceptos?.alojamiento?.detalle && Array.isArray(liq.conceptos.alojamiento.detalle)) {
      liq.conceptos.alojamiento.detalle.forEach((alo: any, idx: number) => {
        items.push({
          id: `alo_${idx + 1}`,
          categoria: 'alojamiento',
          concepto: alo.establecimiento || 'Hotel estancia comisión',
          justificante: alo.factura_numero || `Factura Hotel Nº ${idx + 1}`,
          detalle: `${alo.noches || 1} noche(s) · Límite oficial: ${fmtEur(alo.limite_aplicable || 65.97)}/noche`,
          importe_solicitado: Number(alo.importe_real || alo.importe_real_total || alo.importe_abonable || 0),
          importe_abonable: Number(alo.importe_abonable || alo.limite_aplicable || alo.importe_real || 0),
          tipo_especifico: 'hotel'
        });
      });
    } else if (ext.alojamiento && Array.isArray(ext.alojamiento)) {
      ext.alojamiento.forEach((alo: any, idx: number) => {
        items.push({
          id: `alo_${idx + 1}`,
          categoria: 'alojamiento',
          concepto: alo.establecimiento || 'Alojamiento',
          justificante: `Factura Alojamiento Nº ${idx + 1}`,
          detalle: `${alo.noches || 1} noche(s)`,
          importe_solicitado: Number(alo.importe_total || 0),
          importe_abonable: Number(alo.importe_total || 0),
          tipo_especifico: 'hotel'
        });
      });
    }

    // Transporte / Billetes o Vehículo con denominación formal y sin símbolos informáticos (@)
    const formatearTransporte = (tra: any) => {
      const esVehiculo = tra.tipo === 'vehiculo_particular' || (!tra.tipo && tra.km);
      let concepto = tra.descripcion;
      if (!concepto || concepto.toLowerCase().includes('vehiculo_particular')) {
        concepto = esVehiculo ? 'Desplazamiento en vehículo particular' : (tra.tipo ? `Transporte (${tra.tipo.replace(/_/g, ' ')})` : 'Transporte');
      }

      let detalle = 'Transporte público';
      if (esVehiculo) {
        const kmNum = Number(tra.km || 0);
        const kmStr = kmNum > 0 ? kmNum.toLocaleString('es-ES') : '0';
        detalle = `${kmStr} km a 0,26 €/km`;
      } else if (tra.tipo === 'tren') {
        detalle = 'Ferrocarril / Renfe';
      } else if (tra.tipo === 'avion') {
        detalle = 'Vuelo comercial';
      } else if (tra.tipo === 'autobus') {
        detalle = 'Autobús de línea';
      } else if (tra.detalle && !tra.detalle.includes('@')) {
        detalle = tra.detalle;
      } else if (tra.tipo) {
        detalle = String(tra.tipo).replace(/_/g, ' ');
      }

      return {
        concepto,
        detalle,
        justificante: tra.billete_numero || tra.billete || (esVehiculo ? 'Declaración Kilometraje UEx' : 'Billete / Factura Transporte'),
        tipo_especifico: tra.tipo || (esVehiculo ? 'vehiculo_particular' : 'tren')
      };
    };

    if (liq.conceptos?.transporte?.detalle && Array.isArray(liq.conceptos.transporte.detalle)) {
      liq.conceptos.transporte.detalle.forEach((tra: any, idx: number) => {
        const fmt = formatearTransporte(tra);
        items.push({
          id: `tra_${idx + 1}`,
          categoria: 'transporte',
          concepto: fmt.concepto,
          justificante: fmt.justificante,
          detalle: fmt.detalle,
          importe_solicitado: Number(tra.importe || 0),
          importe_abonable: Number(tra.importe || 0),
          tipo_especifico: fmt.tipo_especifico
        });
      });
    } else if (ext.transporte && Array.isArray(ext.transporte)) {
      ext.transporte.forEach((tra: any, idx: number) => {
        const fmt = formatearTransporte(tra);
        items.push({
          id: `tra_${idx + 1}`,
          categoria: 'transporte',
          concepto: fmt.concepto,
          justificante: fmt.justificante,
          detalle: fmt.detalle,
          importe_solicitado: Number(tra.importe || 0),
          importe_abonable: Number(tra.importe || 0),
          tipo_especifico: fmt.tipo_especifico
        });
      });
    }

    // Inscripción a congresos / conferencias
    const ins = liq.conceptos?.inscripcion || ext.inscripcion;
    if (ins && (ins.importe || ins.importe_total)) {
      const imp = Number(ins.importe_total || ins.importe || 0);
      const reembolsable = ins.reembolsable_al_investigador !== false && ins.pagada_por !== 'tarjeta_institucional';
      items.push({
        id: 'ins_1',
        categoria: 'inscripcion',
        concepto: ins.nombre_congreso || 'Inscripción a Jornadas / Congreso',
        justificante: 'Factura / Certificado de Inscripción',
        detalle: reembolsable ? 'Abonado con tarjeta particular (Reembolsable)' : 'Abonado con Tarjeta Institucional UEx (No transferible)',
        importe_solicitado: imp,
        importe_abonable: reembolsable ? imp : 0,
        pagado_por: ins.pagada_por || (reembolsable ? 'tarjeta_investigador' : 'tarjeta_institucional'),
        tipo_especifico: 'inscripcion'
      });
    }

    // Facturas de proveedor si aplica
    if (ext.factura) {
      items.push({
        id: 'fac_1',
        categoria: 'factura',
        concepto: ext.factura.concepto || `Factura de ${ext.factura.proveedor || 'Proveedor'}`,
        justificante: `Factura Nº ${ext.factura.num_factura || 'S/N'}`,
        detalle: `CIF: ${ext.factura.cif || 'Identificado'} · Base: ${fmtEur(ext.factura.base_imponible || 0)}`,
        importe_solicitado: Number(ext.factura.importe_total || 0),
        importe_abonable: Number(ext.factura.importe_total || 0),
        tipo_especifico: 'proveedor'
      });
    }

    // Suplidos (Peajes, Aparcamiento, etc.)
    const suplidosExt = ext.suplidos || [];
    const suplidosLiq = liq.conceptos?.suplidos?.detalle || [];
    const suplidosList = suplidosLiq.length > 0 ? suplidosLiq : suplidosExt;
    if (Array.isArray(suplidosList) && suplidosList.length > 0) {
      suplidosList.forEach((sup: any, idx: number) => {
        const concepto = sup.concepto || (sup.tipo === 'peaje' ? 'Peaje autopista AP-36' : (sup.tipo === 'parking' ? 'Aparcamiento / Parking' : 'Gasto suplido'));
        const detalle = sup.descripcion || sup.detalle || (sup.tipo ? String(sup.tipo).toUpperCase() : 'Justificante suplido de viaje');
        items.push({
          id: `sup_${idx + 1}`,
          categoria: 'suplido',
          concepto,
          justificante: sup.justificante || `Ticket / Factura Nº ${idx + 1}`,
          detalle,
          importe_solicitado: Number(sup.importe || 0),
          importe_abonable: Number(sup.importe || 0),
          tipo_especifico: 'suplido'
        });
      });
    }

    setGastosList(items);
    setHasChanges(false);
  }, [casoId, extraccion, liquidacion]);

  // Manejar apertura de modal para editar un gasto
  const handleAbrirEditarGasto = (gasto: GastoItem) => {
    setGastoEnEdicion({ ...gasto });
    setIsNuevoGasto(false);
    setModalGastoOpen(true);
  };

  // Manejar apertura de modal para añadir un nuevo gasto
  const handleAbrirNuevoGasto = () => {
    setGastoEnEdicion({
      id: `gasto_${Date.now()}`,
      categoria: 'transporte',
      concepto: '',
      justificante: '',
      detalle: '',
      importe_solicitado: 0,
      importe_abonable: 0,
      tipo_especifico: 'transporte'
    });
    setIsNuevoGasto(true);
    setModalGastoOpen(true);
  };

  // Guardar cambio del modal de gasto
  const handleGuardarModalGasto = async () => {
    if (!gastoEnEdicion) return;

    let nuevaLista: GastoItem[];
    if (isNuevoGasto) {
      nuevaLista = [...gastosList, gastoEnEdicion];
    } else {
      nuevaLista = gastosList.map(g => g.id === gastoEnEdicion.id ? gastoEnEdicion : g);
    }

    setGastosList(nuevaLista);
    setModalGastoOpen(false);
    setGastoEnEdicion(null);
    setHasChanges(true);

    // Ejecutar recálculo automático
    await sincronizarYRecalcular(nuevaLista);
  };

  // Eliminar un gasto
  const handleEliminarGasto = async (id: string) => {
    const itemAEliminar = gastosList.find(g => g.id === id);
    const mensajeConfirm = itemAEliminar
      ? `¿Está seguro de que desea eliminar la partida "${itemAEliminar.concepto}" (${fmtEur(itemAEliminar.importe_abonable)}) de la liquidación?`
      : '¿Desea eliminar este concepto de gasto de la liquidación?';

    if (!window.confirm(mensajeConfirm)) return;

    const nuevaLista = gastosList.filter(g => g.id !== id);
    setGastosList(nuevaLista);
    setHasChanges(true);

    // Ejecutar recálculo automático
    await sincronizarYRecalcular(nuevaLista);
  };

  // Función principal de recálculo y sincronización
  const sincronizarYRecalcular = async (listaActual?: GastoItem[]) => {
    const lista = listaActual || gastosList;
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      // Reconstruir estructura de extraccion con los campos actualizados
      const extActualizada = JSON.parse(JSON.stringify(extraccion || {}));

      // 1. Proyecto
      extActualizada.proyecto = {
        ...(extActualizada.proyecto || {}),
        organica: organica,
        ...(esMultiorganica || organicaSecundaria ? {
          organica_secundaria: organicaSecundaria,
          es_multiorganica: true
        } : {}),
        referencia: referenciaProyecto,
        fuente_financiacion: fuenteFinanciacion
      };

      // 2. Investigador / Perceptor
      extActualizada.investigador = {
        ...(extActualizada.investigador || {}),
        nombre: perceptorNombre,
        nif: perceptorNif,
        iban: perceptorIban,
        grupo_dieta: grupoDieta
      };

      // 3. Comisión
      extActualizada.comision = {
        ...(extActualizada.comision || {}),
        motivo: motivoComision,
        destino: destino,
        fecha_hora_salida: fechaSalida,
        fecha_hora_regreso: fechaRegreso,
        tipo_viaje: transportePrincipal
      };

      // 4. Transporte reconstruido desde lista de gastos
      const gastosTra = lista.filter(g => g.categoria === 'transporte');
      extActualizada.transporte = gastosTra.map(g => {
        const esVeh = g.tipo_especifico === 'vehiculo_particular' || /km/i.test(g.detalle || '');
        let km = 0;
        if (esVeh) {
          const mKm = (g.detalle || '').match(/([0-9.,]+)\s*km/i);
          if (mKm) {
            km = parseFloat(mKm[1].replace(/\./g, '').replace(',', '.')) || 0;
          }
          if (!km && (g as any).km) km = (g as any).km;
          if (!km && extraccion?.transporte?.[0]?.km) km = extraccion.transporte[0].km;
        }
        return {
          tipo: esVeh ? 'vehiculo_particular' : (g.tipo_especifico || 'tren'),
          descripcion: g.concepto,
          km: esVeh ? km : undefined,
          matricula: extraccion?.transporte?.[0]?.matricula || '',
          marca: extraccion?.transporte?.[0]?.marca || '',
          modelo: extraccion?.transporte?.[0]?.modelo || '',
          importe: esVeh ? (km * 0.26) : Number(g.importe_solicitado || g.importe_abonable || 0),
          billete: g.justificante
        };
      });

      // 5. Alojamiento reconstruido
      const gastosAlo = lista.filter(g => g.categoria === 'alojamiento');
      extActualizada.alojamiento = gastosAlo.map((g, idx) => {
        let noches = 1;
        const mNoches = (g.detalle || '').match(/([0-9]+)\s*noche/i);
        if (mNoches) {
          noches = parseInt(mNoches[1], 10);
        } else if (extraccion?.alojamiento?.[idx]?.noches) {
          noches = extraccion.alojamiento[idx].noches;
        } else if (fechaSalida && fechaRegreso) {
          const dDiff = Math.round((new Date(fechaRegreso.split(' ')[0]).getTime() - new Date(fechaSalida.split(' ')[0]).getTime()) / 86400000);
          if (dDiff > 0) noches = dDiff;
        }
        return {
          establecimiento: g.concepto,
          importe_total: Number(g.importe_solicitado || g.importe_abonable || 0),
          num_factura: g.justificante,
          noches: noches
        };
      });

      // 6. Inscripción
      const gastoIns = lista.find(g => g.categoria === 'inscripcion');
      if (gastoIns) {
        extActualizada.inscripcion = {
          ...(extActualizada.inscripcion || {}),
          nombre_congreso: gastoIns.concepto,
          importe: Number(gastoIns.importe_solicitado || 0),
          pagada_por: gastoIns.pagado_por || 'tarjeta_investigador'
        };
      } else {
        delete extActualizada.inscripcion;
      }

      // 7. Suplidos reconstruidos desde lista de gastos
      const gastosSup = lista.filter(g => g.categoria === 'suplido');
      if (gastosSup.length > 0) {
        extActualizada.suplidos = gastosSup.map(g => ({
          concepto: g.concepto,
          importe: Number(g.importe_solicitado || g.importe_abonable || 0),
          justificante: g.justificante,
          tipo: /peaje/i.test(g.concepto) ? 'peaje' : (/parking/i.test(g.concepto) ? 'parking' : 'otro')
        }));
      }

      // Reconstruir liquidación sincronizada
      const liqActualizada = JSON.parse(JSON.stringify(liquidacion || {}));
      liqActualizada.identificacion = {
        ...(liqActualizada.identificacion || {}),
        investigador: perceptorNombre,
        nif: perceptorNif,
        iban: perceptorIban,
        grupo_dieta: grupoDieta,
        organica: organica,
        ...(esMultiorganica || organicaSecundaria ? {
          organica_secundaria: organicaSecundaria
        } : {}),
        proyecto: referenciaProyecto,
        referencia: referenciaProyecto,
        motivo: motivoComision,
        destino: destino,
        fecha_hora_salida: fechaSalida,
        fecha_hora_regreso: fechaRegreso,
        fuente_financiacion: fuenteFinanciacion
      };

      // Calcular subtotales locales
      let totMan = 0;
      const gastoMan = lista.find(g => g.categoria === 'dieta');
      if (gastoMan) totMan = Number(gastoMan.importe_abonable || 0);

      let totTra = 0;
      gastosTra.forEach(g => { totTra += Number(g.importe_abonable || 0); });

      let totAlo = 0;
      let totAloReal = 0;
      gastosAlo.forEach(g => {
        totAlo += Number(g.importe_abonable || 0);
        totAloReal += Number(g.importe_solicitado || g.importe_abonable || 0);
      });

      let totIns = 0;
      if (gastoIns && gastoIns.pagado_por !== 'tarjeta_institucional') {
        totIns = Number(gastoIns.importe_abonable || 0);
      }

      let totSup = 0;
      if (extActualizada.suplidos && Array.isArray(extActualizada.suplidos)) {
        extActualizada.suplidos.forEach((s: any) => { totSup += Number(s.importe || 0); });
      }

      const totalDevengado = totMan + totTra + totAloReal + (gastoIns ? Number(gastoIns.importe_solicitado || 0) : 0) + totSup;
      const liquidoAbonar = totMan + totTra + totAlo + totIns + totSup;

      liqActualizada.resumen_economico = {
        ...(liqActualizada.resumen_economico || {}),
        total_manutencion: totMan,
        total_transporte: totTra,
        total_alojamiento: totAlo,
        total_inscripcion_reembolsable: totIns,
        total_devengado: totalDevengado,
        liquido_a_abonar: liquidoAbonar
      };

      // Enviar al backend para guardar en disco y regenerar PDFs oficiales
      const res = await fetch(`/api/caso/${encodeURIComponent(casoId)}/actualizar_datos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extraccion: extActualizada,
          liquidacion: liqActualizada,
          tipo_tramite: selectedTemplate
        })
      });

      const data = await res.json();
      if (data.ok) {
        setSaveSuccessMsg(`✓ Modificaciones guardadas y expediente recalculado (${fmtEur(data.liquido_ag || liquidoAbonar)})`);
        setHasChanges(false);

        // Notificar al componente padre ViewProcesar para actualizar todas las tarjetas y pestañas
        onDataUpdated(
          data.extraccion || extActualizada,
          data.liquidacion || liqActualizada,
          data.liquido_ag ?? liquidoAbonar
        );

        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        alert(data.error || 'Error al guardar modificaciones en el servidor.');
      }
    } catch (err: any) {
      console.error('Error al actualizar datos de la liquidación:', err);
      alert('Error de conexión al guardar los datos del expediente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sumas informativas
  const totalSolicitado = gastosList.reduce((acc, g) => acc + (Number(g.importe_solicitado) || 0), 0);
  const totalAbonable = gastosList.reduce((acc, g) => acc + (Number(g.importe_abonable) || 0), 0);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs space-y-0 transition-all">
      {/* Cabecera del Formulario de Edición */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#176B52] dark:text-emerald-300">
            <Edit3 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Datos Extraídos y Validación del Expediente
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-100 text-[#176B52] dark:bg-emerald-950 dark:text-emerald-300">
                Intervención Oficial UEx
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Puede revisar y editar los datos extraídos de la documentación oficial, ajustar o eliminar conceptos de gasto y recalcular el dictamen oficial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {saveSuccessMsg && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={14} />
              <span>{saveSuccessMsg}</span>
            </span>
          )}

          {hasChanges && (
            <button
              type="button"
              onClick={() => sincronizarYRecalcular()}
              disabled={isSaving}
              className="btn btn-md btn-uex"
              style={{
                borderRadius: '8px',
                padding: '7px 14px',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(23, 107, 82, 0.28)',
                cursor: isSaving ? 'wait' : 'pointer'
              }}
              title="Guardar cambios realizados en este formulario"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* BLOQUE 1: PANELES EDITABLES (2 Columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Panel Izquierdo: Imputación Orgánica y Proyecto */}
          <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
              <Building2 size={15} className="text-[#176B52]" />
              <span>Imputación Orgánica y Proyecto</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Aplicación Orgánica Principal:
                </label>
                <input
                  type="text"
                  value={organica}
                  onChange={e => { setOrganica(e.target.value); setHasChanges(true); }}
                  placeholder="ej. 18.IW.A8.FA"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              {esMultiorganica && (
                <div>
                  <label className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 block mb-1">
                    Orgánica Secundaria UEx:
                  </label>
                  <input
                    type="text"
                    value={organicaSecundaria}
                    onChange={e => { setOrganicaSecundaria(e.target.value); setHasChanges(true); }}
                    placeholder="ej. 18.IW.00"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-zinc-900 font-mono text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Referencia Proyecto / Ayuda:
                </label>
                <input
                  type="text"
                  value={referenciaProyecto}
                  onChange={e => { setReferenciaProyecto(e.target.value); setHasChanges(true); }}
                  placeholder="ej. GR24099"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Investigador Principal / Responsable:
                </label>
                <input
                  type="text"
                  value={investigadorPrincipal}
                  onChange={e => { setInvestigadorPrincipal(e.target.value); setHasChanges(true); }}
                  placeholder="Nombre y apellidos del IP"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Marco de Financiación Normativo:
                </label>
                <select
                  value={fuenteFinanciacion}
                  onChange={e => { setFuenteFinanciacion(e.target.value); setHasChanges(true); }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                >
                  <option value="plan_estatal">Plan Estatal / Fondos UEx (RD 462/2002 - Dieta 37,40 € - Hotel 65,97 €)</option>
                  <option value="extremadura">Junta de Extremadura (Decreto 42/2025 - Dieta 36,00 € - Hotel 60,00 €)</option>
                  <option value="europeo">Horizonte Europa / FEDER (Gastos Reales Justificados)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Comisión de Servicio y Desplazamiento */}
          <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
              <Clock size={15} className="text-[#176B52]" />
              <span>Comisión de Servicio y Desplazamiento</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Objeto / Motivo de la Misión:
                </label>
                <input
                  type="text"
                  value={motivoComision}
                  onChange={e => { setMotivoComision(e.target.value); setHasChanges(true); }}
                  placeholder="ej. Asistencia a las Jornadas SISTEDES 2026"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Destino / Itinerario:
                  </label>
                  <input
                    type="text"
                    value={destino}
                    onChange={e => { setDestino(e.target.value); setHasChanges(true); }}
                    placeholder="ej. Alicante"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Medio de Transporte Principal:
                  </label>
                  <select
                    value={transportePrincipal}
                    onChange={e => { setTransportePrincipal(e.target.value); setHasChanges(true); }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  >
                    <option value="tren">Tren / Ferrocarril (Renfe)</option>
                    <option value="vehiculo_particular">Vehículo Particular (0,26 €/km)</option>
                    <option value="avion">Avión / Línea Aérea</option>
                    <option value="autobus">Autobús de línea</option>
                    <option value="mixto">Mixto / Varios Medios</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Fecha y Hora de Salida:
                  </label>
                  <input
                    type="text"
                    value={fechaSalida}
                    onChange={e => { setFechaSalida(limpiarFechaHora(e.target.value)); setHasChanges(true); }}
                    placeholder="AAAA-MM-DD HH:MM"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Fecha y Hora de Regreso:
                  </label>
                  <input
                    type="text"
                    value={fechaRegreso}
                    onChange={e => { setFechaRegreso(limpiarFechaHora(e.target.value)); setHasChanges(true); }}
                    placeholder="AAAA-MM-DD HH:MM"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: DATOS DEL COMISIONADO / PERCEPTOR */}
        <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
            <User size={15} className="text-[#176B52]" />
            <span>Datos del Comisionado / Perceptor de la Liquidación</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                Nombre y Apellidos del Comisionado:
              </label>
              <input
                type="text"
                value={perceptorNombre}
                onChange={e => { setPerceptorNombre(e.target.value); setHasChanges(true); }}
                placeholder="Nombre del perceptor"
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1 whitespace-nowrap">
                NIF / DNI / NIE:
              </label>
              <input
                type="text"
                value={perceptorNif}
                onChange={e => { setPerceptorNif(e.target.value); setHasChanges(true); }}
                placeholder="12345678Z"
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1 whitespace-nowrap">
                Grupo de Dieta (RD 462/2002):
              </label>
              <select
                value={grupoDieta}
                onChange={e => { setGrupoDieta(e.target.value); setHasChanges(true); }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
              >
                <option value="1">Grupo 1 (Altos Cargos / Vicerrectores)</option>
                <option value="2">Grupo 2 (Catedráticos / Titulares / Investigadores)</option>
                <option value="3">Grupo 3 (Personal Técnico / Ayudantes)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1 whitespace-nowrap">
                Cuenta Bancaria (IBAN):
              </label>
              <input
                type="text"
                value={perceptorIban}
                onChange={e => { setPerceptorIban(e.target.value); setHasChanges(true); }}
                placeholder="ES00 0000 0000 0000 0000 0000"
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 3: RELACIÓN DE GASTOS Y JUSTIFICANTES (EDITABLE Y ELIMINABLE) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Receipt size={16} className="text-[#176B52]" />
                <span>Relación de Gastos y Justificantes Extraídos ({gastosList.length} partidas)</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Cada justificante puede ser editado o eliminado de la liquidación. Las cuantías se recalculan reactivamente conforme a las bases normativas.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAbrirNuevoGasto}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#176B52] text-[#176B52] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-[#176B52] hover:text-white flex items-center gap-1.5 transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
            >
              <Plus size={14} />
              <span>Añadir Concepto de Gasto</span>
            </button>
          </div>

          {/* Tabla Limpia y Estilizada de Gastos */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-32">Categoría</th>
                  <th className="py-2.5 px-3">Concepto y Justificante</th>
                  <th className="py-2.5 px-3">Detalle / Trayecto</th>
                  <th className="py-2.5 px-3 text-right">Solicitado</th>
                  <th className="py-2.5 px-3 text-right">Abonable UEx</th>
                  <th className="py-2.5 px-3 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {gastosList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs">
                      No hay gastos registrados en esta liquidación. Pulse en "Añadir Concepto de Gasto" para incorporar una partida.
                    </td>
                  </tr>
                ) : (
                  gastosList.map((gasto, idx) => {
                    // Estilos de badge por categoría
                    let badgeStyle: React.CSSProperties = {
                      backgroundColor: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #CBD5E1'
                    };
                    let badgeLabel: string = gasto.categoria;
                    let IconComponent = FileText;

                    if (gasto.categoria === 'dieta') {
                      badgeStyle = { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
                      badgeLabel = 'Dieta';
                      IconComponent = Utensils;
                    } else if (gasto.categoria === 'alojamiento') {
                      badgeStyle = { backgroundColor: '#E0F2FE', color: '#075985', border: '1px solid #BAE6FD' };
                      badgeLabel = 'Alojamiento';
                      IconComponent = BedDouble;
                    } else if (gasto.categoria === 'transporte') {
                      badgeStyle = { backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' };
                      badgeLabel = 'Transporte';
                      IconComponent = Train;
                    } else if (gasto.categoria === 'inscripcion') {
                      badgeStyle = { backgroundColor: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF' };
                      badgeLabel = 'Inscripción';
                      IconComponent = Award;
                    } else if (gasto.categoria === 'suplido') {
                      badgeStyle = { backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' };
                      badgeLabel = 'Suplido';
                      IconComponent = Receipt;
                    }

                    return (
                      <tr key={gasto.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-zinc-400">
                          {idx + 1}
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            style={{
                              ...badgeStyle,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <IconComponent size={12} />
                            <span>{badgeLabel}</span>
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {gasto.concepto}
                          </div>
                          {gasto.justificante && (
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              Doc: {gasto.justificante}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                          {gasto.detalle || '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                          {fmtEur(gasto.importe_solicitado)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          <span className={gasto.importe_abonable > 0 ? 'text-[#176B52] dark:text-emerald-400' : 'text-zinc-400'}>
                            {fmtEur(gasto.importe_abonable)}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarGasto(gasto)}
                              className="action-btn-edit"
                              title="Editar este concepto de gasto"
                              aria-label="Editar este concepto de gasto"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEliminarGasto(gasto.id)}
                              className="action-btn-delete"
                              title="Eliminar este concepto de gasto de la liquidación"
                              aria-label="Eliminar este concepto de gasto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {gastosList.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-zinc-800/60 font-bold border-t border-zinc-200 dark:border-zinc-700">
                    <td colSpan={4} className="py-2.5 px-3 text-right text-zinc-700 dark:text-zinc-300">
                      Total Devengado y Abonable en Cuenta:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {fmtEur(totalSolicitado)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-300 text-sm">
                      {fmtEur(totalAbonable)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-zinc-400">OK</span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN / ADICIÓN DE CONCEPTO DE GASTO */}
      {modalGastoOpen && gastoEnEdicion && (
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
            if (e.target === e.currentTarget) setModalGastoOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#176B52]">
                  {isNuevoGasto ? <Plus size={16} /> : <Edit3 size={16} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {isNuevoGasto ? 'Añadir Nueva Partida de Gasto' : 'Editar Partida de Gasto'}
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Ajuste los datos descriptivos y cuantías económicas a liquidar
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalGastoOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Categoría del Gasto:
                </label>
                <select
                  value={gastoEnEdicion.categoria}
                  onChange={e => setGastoEnEdicion({
                    ...gastoEnEdicion,
                    categoria: e.target.value as any
                  })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                >
                  <option value="transporte">Transporte (Tren, Autobús, Avión, Vehículo particular)</option>
                  <option value="alojamiento">Alojamiento (Hotel, Residencia)</option>
                  <option value="dieta">Manutención / Dietas oficiales</option>
                  <option value="inscripcion">Cuota de Inscripción / Congreso</option>
                  <option value="otro">Suplido u Otro Gasto Oficial</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Concepto / Denominación:
                </label>
                <input
                  type="text"
                  value={gastoEnEdicion.concepto}
                  onChange={e => setGastoEnEdicion({ ...gastoEnEdicion, concepto: e.target.value })}
                  placeholder="ej. Desplazamiento en vehículo particular o AVE Madrid-Atocha"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Documento Justificante / Nº Factura / Billete:
                </label>
                <input
                  type="text"
                  value={gastoEnEdicion.justificante}
                  onChange={e => setGastoEnEdicion({ ...gastoEnEdicion, justificante: e.target.value })}
                  placeholder="ej. Declaración Kilometraje UEx o Billete Renfe"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Detalle / Trayecto / Fechas:
                </label>
                <input
                  type="text"
                  value={gastoEnEdicion.detalle}
                  onChange={e => setGastoEnEdicion({ ...gastoEnEdicion, detalle: e.target.value })}
                  placeholder="ej. 1.200 km a 0,26 €/km o Trayecto Cáceres - Madrid Ida y Vuelta"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Importe Solicitado (€):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gastoEnEdicion.importe_solicitado}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setGastoEnEdicion({
                        ...gastoEnEdicion,
                        importe_solicitado: val,
                        importe_abonable: isNuevoGasto ? val : gastoEnEdicion.importe_abonable
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Importe Abonable UEx (€):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gastoEnEdicion.importe_abonable}
                    onChange={e => setGastoEnEdicion({
                      ...gastoEnEdicion,
                      importe_abonable: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-[#176B52] focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  />
                </div>
              </div>
            </div>

            {/* Acciones del modal */}
            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 bg-zinc-50/70 dark:bg-zinc-950/40">
              <button
                type="button"
                onClick={() => setModalGastoOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarModalGasto}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#176B52] hover:bg-[#125440] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Aplicar a la Liquidación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

