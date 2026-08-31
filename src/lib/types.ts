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
  cumplido: boolean
}

export interface DetalleCaso {
  id: string
  tipo: string
  archivos: ArchivoCaso[]
  total_archivos: number
  requisitos: RequisitoCaso[]
  porcentaje: number
  completo: boolean
}
