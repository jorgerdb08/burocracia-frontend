import { DollarSign, Building, FileSpreadsheet, Calendar, FileText } from 'lucide-react'

export const TEMPLATES = [
  {
    id: 'dietas',
    titulo: 'Liquidación de Dietas y Desplazamientos',
    desc: 'Modelo oficial SGTRI para cálculo de kilometraje, pernoctas y manutención según normativas DOE y BOE.',
    badge: 'Principal',
    icon: DollarSign,
    img: '/thumbnails/Liquidacion-Dietas-y-desplazamientos-SGTRI-2025-v.25.t5.png',
    normativa: 'Real Decreto 462/2002 y Decreto Autonómico Junta de Extremadura',
    organismo: 'Vicerrectorado de Investigación y Transferencia — SGTRI UEx'
  },
  {
    id: 'anexo2_aprob',
    titulo: 'Anexo II – Aprobación del Gasto',
    desc: 'Solicitud previa y autorización oficial de comisiones de servicio con cargo a proyectos de investigación.',
    badge: 'Anexo II',
    icon: Building,
    img: '/thumbnails/Anexo-II-Aprobacion-del-Gasto.png',
    normativa: 'Instrucción de Gerencia sobre Comisiones de Servicio',
    organismo: 'Servicio de Gestión Económica y Presupuestaria UEx'
  },
  {
    id: 'anexo2_just',
    titulo: 'Anexo II – Justificación Gastos Tarjeta',
    desc: 'Liquidación y rendición de cuentas para compras, inscripciones y pagos efectuados con tarjeta de investigación.',
    badge: 'Tarjeta',
    icon: FileSpreadsheet,
    img: '/thumbnails/Anexo-II-Justificacion-Gastos-Tarjeta-Investigacion.png',
    normativa: 'Reglamento de Uso de Tarjetas Institucionales de Investigación',
    organismo: 'SGTRI — Negociado de Justificación Económica'
  },
  {
    id: 'cert',
    titulo: 'Certificación de Conferencias y Seminarios',
    desc: 'Acreditación de impartición de docencia en seminarios, ponencias invitadas y honorarios extraordinarios.',
    badge: 'Honorarios',
    icon: Calendar,
    img: '/thumbnails/Certificacion-de-actividad-para-honorarios-por-conferencias-y-seminarios.png',
    normativa: 'Normativa de Colaboraciones Extraordinarias y Formación Continua',
    organismo: 'Servicio de Recursos Humanos y Nóminas UEx'
  },
  {
    id: 'prop_pago',
    titulo: 'Propuesta de Pago a Proveedores',
    desc: 'Documento contable oficial de ordenación de transferencia directa al beneficiario o proveedor del proyecto.',
    badge: 'Contable',
    icon: FileText,
    img: '/thumbnails/Propuesta-de-Pago.png',
    normativa: 'Plan General de Contabilidad Pública y Normativa Presupuestaria UEx',
    organismo: 'Servicio de Contabilidad y Tesorería UEx'
  },
]
