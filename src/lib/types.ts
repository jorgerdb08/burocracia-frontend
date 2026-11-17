export interface CasoResult {
  caso_id: string
  ok: boolean
  sin_ground_truth?: boolean
  liquido_ag: number
  liquido_esp: number
  delta: number
  precision: number
  logs: string
  extraccion?: any
  liquidacion?: any
  memoria_fiscalizacion?: string
}

export interface ArchivoCaso {
  name: string
  path: string
  size: number
  ext: string
  categoria: string
}

export interface RequisitoCaso {
  id: string
  label: string
  obligatorio: boolean
  cumplido: boolean
}

export interface DetalleCaso {
  id: string
  codigo?: string
  titulo?: string
  descripcion?: string
  modalidad?: string
  tipo: string
  archivos: ArchivoCaso[]
  total_archivos: number
  requisitos: RequisitoCaso[]
  porcentaje: number
  completo: boolean
  estado_validacion?: 'error' | 'valido_con_advertencias' | 'valido_completo'
  errores_obligatorios?: string[]
  warnings_opcionales?: string[]
  referencia_sugerida?: string
  organica_sugerida?: string
  organica_secundaria_sugerida?: string
  es_multiorganica?: boolean
  cofinanciacion_sugerida?: string | Record<string, number>
  tipo_proyecto_sugerido?: string
  modalidad_sugerida?: string
}
