import { DollarSign, Building, FileSpreadsheet, Calendar, FileText, ShoppingCart, GraduationCap } from 'lucide-react'

export const TEMPLATES = [
  {
    id: 'dietas',
    titulo: 'Dietas y Desplazamientos',
    desc: 'Liquidación oficial SGTRI de kilometraje, pernoctas, billetes y dietas según Presupuestos UEx 2026 y RD 462/2002.',
    badge: 'Pack Dietas',
    icon: DollarSign,
    img: '/thumbnails/Liquidacion-Dietas-y-desplazamientos-SGTRI-2025-v.25.t5.png',
    normativa: 'Art. 32 Presupuestos UEx 2026, RD 462/2002 y Decreto 42/2025',
    organismo: 'Vicerrectorado de Investigación y Transferencia — SGTRI UEx'
  },
  {
    id: 'pago_proveedor',
    titulo: 'Pago a Proveedor (Facturas / Compras)',
    desc: 'Pack compuesto oficial: Anexo II (Aprobación del Gasto 2026) + Anexo A (Justificación con Tarjeta o Transferencia). Para software, OpenAI, AWS, compras y suministros.',
    badge: 'Pack Proveedor',
    icon: ShoppingCart,
    img: '/thumbnails/Anexo-A-Propuesta-de-pago-o-justificacion-de-gastos-con-tarjeta.png',
    normativa: 'Art. 30 Presupuestos UEx 2026 e Instrucciones SGTRI',
    organismo: 'Servicio de Gestión Económica, Contratación y Patrimonio UEx'
  },
  {
    id: 'honorarios',
    titulo: 'Abono de Honorarios',
    desc: 'Pack compuesto oficial: Anexo II (Aprobación) + Declaración Responsable 2025/26 + Certificación de Conferencia/Seminario. Máximo 300 €/hora.',
    badge: 'Pack Honorarios',
    icon: GraduationCap,
    img: '/thumbnails/Honorarios-Anexo-Declaracion-Responsable-2025-v1.png',
    normativa: 'Art. 19.4 Presupuestos UEx 2026 y Ley de Incompatibilidades',
    organismo: 'SGTRI — Negociado de Justificación y Transferencia'
  },
  {
    id: 'anexo2_aprob',
    titulo: 'Anexo II – Aprobación del Gasto (Individual)',
    desc: 'Solicitud previa y autorización oficial de gastos con cargo a proyectos de investigación (Modelo SGTRI 2026).',
    badge: 'Anexo II',
    icon: Building,
    img: '/thumbnails/Anexo-II-Aprobacion-del-Gasto.png',
    normativa: 'Instrucción de Gerencia sobre Aprobación del Gasto',
    organismo: 'Servicio de Gestión Económica y Presupuestaria UEx'
  },
  {
    id: 'anexo_a',
    titulo: 'Anexo A – Justificación con Tarjeta / Transferencia',
    desc: 'Modelo oficial V.2.1 SGTRI de liquidación de facturas abonadas con tarjeta o a pagar por transferencia.',
    badge: 'Anexo A',
    icon: FileSpreadsheet,
    img: '/thumbnails/Anexo-A-Propuesta-de-pago-o-justificacion-de-gastos-con-tarjeta.png',
    normativa: 'Normativa SGTRI 2026 de Justificación de Proyectos',
    organismo: 'SGTRI — Negociado de Justificación Económica'
  },
  {
    id: 'cert',
    titulo: 'Certificación de Conferencias y Seminarios',
    desc: 'Acreditación oficial emitida por el director del curso o actividad para tramitación de honorarios a ponentes.',
    badge: 'Certificado',
    icon: Calendar,
    img: '/thumbnails/Certificacion-de-actividad-para-honorarios-por-conferencias-y-seminarios.png',
    normativa: 'Normativa de Colaboraciones Extraordinarias UEx',
    organismo: 'Servicio de Recursos Humanos y Nóminas UEx'
  }
]
