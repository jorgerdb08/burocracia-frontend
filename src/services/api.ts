/**
 * UNIVERSIDAD DE EXTREMADURA (UEx) - SGTRI
 * Capa de Servicios y Cliente API Centralizado
 *
 * Encapsula las llamadas HTTP a los endpoints REST del backend Flask:
 * - Tramitación y consulta de expedientes de dietas y comisiones de servicio.
 * - Procesamiento especializado de honorarios docentes y conferencias.
 * - Gestión de facturas y abonos a proveedores.
 * - Procesamiento batch de lotes masivos con contexto común.
 * - Consultas al asistente conversacional experto en normativa UEx.
 */

export interface CasoSummary {
  id: string;
  codigo?: string;
  titulo?: string;
  descripcion?: string;
  tipo: string;
  total_archivos?: number;
  porcentaje?: number;
  completo?: boolean;
  estado_validacion?: 'error' | 'valido_con_advertencias' | 'valido_completo';
  errores_obligatorios?: string[];
  warnings_opcionales?: string[];
  referencia_sugerida?: string;
  organica_sugerida?: string;
  organica_secundaria_sugerida?: string;
  es_multiorganica?: boolean;
  cofinanciacion_sugerida?: string;
}

export interface ApiResponse<T = any> {
  ok?: boolean;
  error?: string;
  data?: T;
  [key: string]: any;
}

class ApiService {
  private base = '';

  /**
   * Envoltorio genérico para realizar peticiones fetch con gestión centralizada de errores HTTP.
   */
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.base}${endpoint}`;
    const res = await fetch(url, options);
    if (!res.ok) {
      let errorMsg = `Error HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch {
        // En caso de respuesta sin formato JSON se mantiene el mensaje genérico con el código HTTP
      }
      throw new Error(errorMsg);
    }
    return res.json() as Promise<T>;
  }

  // =========================================================================
  // Expedientes Generales / Dietas y Comisiones de Servicio
  // =========================================================================

  /** Obtiene la lista completa de expedientes disponibles en el sistema */
  async getCasos(): Promise<{ casos: CasoSummary[] }> {
    return this.request<{ casos: CasoSummary[] }>('/api/casos');
  }

  /** Obtiene el desglose de archivos, requisitos y metadatos de un expediente concreto */
  async getCasoDetalle(casoId: string, tipoHint: string = ''): Promise<any> {
    const q = tipoHint ? `?tipo=${encodeURIComponent(tipoHint)}` : '';
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/detalle${q}`);
  }

  /** Recupera los datos estructurados extraídos de un expediente (extraccion.json) */
  async getCasoDatosExtraccion(casoId: string): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/datos_extraccion`);
  }

  /** Actualiza los metadatos o campos económicos de un expediente */
  async actualizarDatosCaso(casoId: string, payload: any): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/actualizar_datos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /** Sube nuevos documentos para crear un expediente nuevo o procesar al vuelo */
  async subirArchivos(formData: FormData, tipo: string = ''): Promise<any> {
    const q = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    return this.request(`/api/caso/upload${q}`, {
      method: 'POST',
      body: formData
    });
  }

  /** Anexa documentos adicionales a un expediente existente */
  async adjuntarArchivo(casoId: string, formData: FormData): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/adjuntar`, {
      method: 'POST',
      body: formData
    });
  }

  /** Crea un nuevo expediente vacío con su carpeta y metadatos iniciales */
  async crearCaso(nombre: string, tipo: string = 'dietas', descripcion?: string): Promise<any> {
    return this.request('/api/caso/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tipo, descripcion })
    });
  }

  /** Renombra el identificador o actualiza el título y descripción de un expediente */
  async renombrarCaso(casoId: string, payload: { nuevoId?: string; titulo?: string; descripcion?: string } | string, descripcion?: string): Promise<any> {
    const titulo = typeof payload === 'string' ? payload : (payload.titulo || payload.nuevoId || '');
    const nuevoId = typeof payload === 'string' ? payload : (payload.nuevoId || '');
    const desc = typeof payload === 'string' ? descripcion : payload.descripcion;

    const body: Record<string, any> = {
      nuevo_nombre: titulo,
      titulo: titulo,
      descripcion: desc
    };
    if (nuevoId) {
      body.nuevo_id = nuevoId;
    }

    return this.request(`/api/caso/${encodeURIComponent(casoId)}/renombrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  /** Elimina un expediente del sistema junto con todos sus archivos */
  async eliminarCaso(casoId: string): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}`, {
      method: 'DELETE'
    });
  }

  /** Elimina un lote completo de expedientes del sistema */
  async eliminarLote(loteId: string): Promise<any> {
    return this.request(`/api/batch/lote/${encodeURIComponent(loteId)}`, {
      method: 'DELETE'
    });
  }

  /** Edita el identificador o datos comunes de un lote */
  async editarLote(loteId: string, datos: any): Promise<any> {
    return this.request(`/api/batch/lote/${encodeURIComponent(loteId)}/editar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  }

  /** Elimina un archivo concreto de la carpeta de un expediente */
  async eliminarArchivo(casoId: string, filename: string): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/archivo/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });
  }

  /** Obtiene la información personal del comisionado (NIF, nombre, IBAN) */
  async getDatosPersonales(casoId: string): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/datos_personales`);
  }

  /** Persiste los datos personales del comisionado */
  async guardarDatosPersonales(casoId: string, datos: any): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/guardar_datos_personales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  }

  // =========================================================================
  // Honorarios SGTRI (Cursos, Seminarios y Conferencias)
  // =========================================================================

  /** Lista los casos precargados de demostración de honorarios */
  async getHonorariosCasosPrecargados(): Promise<any> {
    return this.request('/api/honorarios/casos_precargados');
  }

  /** Carga un caso de demostración de honorarios en el espacio de trabajo */
  async cargarDemostracionHonorarios(casoNombre?: string): Promise<any> {
    const path = casoNombre ? `/${encodeURIComponent(casoNombre)}` : '';
    return this.request(`/api/honorarios/cargar_demostracion${path}`, {
      method: 'POST'
    });
  }

  /** Analiza los documentos o archivos Excel subidos para extraer datos del ponente e importes */
  async analizarExpedienteHonorarios(formData: FormData): Promise<any> {
    return this.request('/api/honorarios/analizar_expediente', {
      method: 'POST',
      body: formData
    });
  }

  /** Valida la coherencia fiscal (IRPF, importes, topes por hora) de una propuesta de honorarios */
  async validarExpedienteHonorarios(payload: any): Promise<any> {
    return this.request('/api/honorarios/validar_expediente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /** Genera el pack documental oficial de honorarios (Propuesta de pago, certificación y memoria) */
  async generarDocumentosHonorarios(payload: any): Promise<any> {
    return this.request('/api/honorarios/generar_documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // =========================================================================
  // Proveedores y Contratos Menores
  // =========================================================================

  /** Lista los casos precargados de proveedores disponibles */
  async getProveedoresCasosPrecargados(): Promise<any> {
    return this.request('/api/proveedores/casos_precargados');
  }

  /** Carga un caso de demostración de pago a proveedores */
  async cargarDemostracionProveedores(casoNombre: string): Promise<any> {
    return this.request(`/api/proveedores/cargar_demostracion/${encodeURIComponent(casoNombre)}`, {
      method: 'POST'
    });
  }

  /** Inicia el análisis y extracción semántica de facturas y justificantes de compra */
  async analizarExpedienteProveedores(formData: FormData): Promise<any> {
    return this.request('/api/proveedores/analizar_expediente', {
      method: 'POST',
      body: formData
    });
  }

  /** Valida el cumplimiento del contrato menor (límite 15.000 €, datos fiscales del proveedor) */
  async validarExpedienteProveedores(payload: any): Promise<any> {
    return this.request('/api/proveedores/validar_expediente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /** Genera los anexos oficiales de pago a proveedores (Anexo II, certificación y propuesta) */
  async generarDocumentosProveedores(payload: any): Promise<any> {
    return this.request('/api/proveedores/generar_documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // =========================================================================
  // Lotes Masivos (Batch)
  // =========================================================================

  /** Lista los lotes de expedientes existentes */
  async getLotes(): Promise<any> {
    return this.request('/api/batch/lotes');
  }

  /** Obtiene la lista de subexpedientes y contexto común de un lote */
  async getLoteDetalle(loteId: string): Promise<any> {
    return this.request(`/api/batch/detalle/${encodeURIComponent(loteId)}`);
  }

  /** Recupera el informe resumen consolidado tras procesar un lote */
  async getLoteResumen(loteId: string): Promise<any> {
    return this.request(`/api/batch/resumen/${encodeURIComponent(loteId)}`);
  }

  /** Lanza la ejecución por lotes de todos los subexpedientes */
  async procesarLote(payload: any): Promise<any> {
    return this.request('/api/batch/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // =========================================================================
  // Asistente Conversacional Inteligente
  // =========================================================================

  /** Envía una consulta al asistente virtual con el contexto de navegación actual */
  async enviarMensajeChat(mensaje: string, contexto: any = {}): Promise<any> {
    return this.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, contexto })
    });
  }

  // =========================================================================
  // Configuración, Esquemas JSON y Normativa
  // =========================================================================

  /** Consulta los proyectos y directrices presupuestarias configurados */
  async getConfigProyectos(): Promise<any> {
    return this.request('/api/config/proyectos');
  }

  /** Consulta el catálogo de procedimientos administrativos */
  async getConfigProcedimientos(): Promise<any> {
    return this.request('/api/config/procedimientos');
  }

  /** Recupera los esquemas JSON de validación */
  async getConfigSchemas(): Promise<any> {
    return this.request('/api/config/schemas');
  }

  /** Consulta las plantillas de documentos oficiales disponibles */
  async getConfigPlantillas(): Promise<any> {
    return this.request('/api/config/plantillas');
  }

  /** Recupera los prompts del sistema empleados para la extracción semántica */
  async getConfigPrompts(): Promise<any> {
    return this.request('/api/config/prompts');
  }
}

export const api = new ApiService();
