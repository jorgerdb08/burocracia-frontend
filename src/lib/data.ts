import { DollarSign, Building, FileSpreadsheet, Calendar, FileText } from 'lucide-react'

export const TEMPLATES = [
  {
    id: 'dietas',
    titulo: 'Liquidación de Dietas y Desplazamientos',
    desc: 'Modelo oficial SGTRI para cálculo de kilometraje, pernoctas y manutención según DOE/BOE.',
    badge: 'Principal',
    icon: DollarSign,
    img: '/thumbnails/Liquidacion-Dietas-y-desplazamientos-SGTRI-2025-v.25.t5.png'
  },
  {
    id: 'anexo2_aprob',
    titulo: 'Anexo II — Aprobación del Gasto',
    desc: 'Solicitud previa y autorización de comisiones de servicio con cargo a proyectos de investigación.',
    badge: 'Anexo',
    icon: Building,
    img: '/thumbnails/Anexo-II-Aprobacion-del-Gasto.png'
  },
  {
    id: 'anexo2_just',
    titulo: 'Anexo II — Justificación Gastos Tarjeta',
    desc: 'Liquidación y rendición de cuentas para compras y pagos efectuados con tarjeta de investigación.',
    badge: 'Tarjeta',
    icon: FileSpreadsheet,
    img: '/thumbnails/Anexo-II-Justificacion-Gastos-Tarjeta-Investigacion.png'
  },
  {
    id: 'cert',
    titulo: 'Certificación de Conferencias',
    desc: 'Acreditación de docencia en seminarios y percepción de honorarios extraordinarios.',
    badge: 'Honorarios',
    icon: Calendar,
    img: '/thumbnails/Certificacion-de-actividad-para-honorarios-por-conferencias-y-seminarios.png'
  },
  {
    id: 'prop_pago',
    titulo: 'Propuesta de Pago',
    desc: 'Documento contable de ordenación de transferencia directa al beneficiario del proyecto.',
    badge: 'Contable',
    icon: FileText,
    img: '/thumbnails/Propuesta-de-Pago.png'
  },
]
