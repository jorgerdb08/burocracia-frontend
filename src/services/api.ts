/**
 * UNIVERSIDAD DE EXTREMADURA (UEx) - SGTRI
 * Capa de Servicios y Cliente API Centralizado
 * Modularización del cliente HTTP para consumo de endpoints del backend
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

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.base}${endpoint}`;
    const res = await fetch(url, options);
    if (!res.ok) {
      let errorMsg = `Error HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch {
        // Fallback a texto
      }
      throw new Error(errorMsg);
    }
    return res.json() as Promise<T>;
  }

  // --- Expedientes Generales / Dietas ---

  async getCasos(): Promise<{ casos: CasoSummary[] }> {
    return this.request<{ casos: CasoSummary[] }>('/api/casos');
  }

  async getCasoDetalle(casoId: string, tipoHint: string = ''): Promise<any> {
    const q = tipoHint ? `?tipo=${encodeURIComponent(tipoHint)}` : '';
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/detalle${q}`);
  }

  async getCasoDatosExtraccion(casoId: string): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/datos_extraccion`);
  }

  async actualizarDatosCaso(casoId: string, payload: any): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/actualizar_datos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async subirArchivos(formData: FormData, tipo: string = ''): Promise<any> {
    const q = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    return this.request(`/api/caso/upload${q}`, {
      method: 'POST',
      body: formData
    });
  }

  async adjuntarArchivo(casoId: string, formData: FormData): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/adjuntar`, {
      method: 'POST',
      body: formData
    });
  }

  async crearCaso(nombre: string, tipo: string = 'dietas', descripcion?: string): Promise<any> {
    return this.request('/api/caso/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tipo, descripcion })
    });
  }

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

  async eliminarCaso(casoId: string): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}`, {
      method: 'DELETE'
    });
  }

  async eliminarArchivo(casoId: string, filename: string): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/archivo/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });
  }

  async getDatosPersonales(casoId: string): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/datos_personales`);
  }

  async guardarDatosPersonales(casoId: string, datos: any): Promise<any> {
    return this.request(`/api/caso/${encodeURIComponent(casoId)}/guardar_datos_personales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  }

  // --- Honorarios SGTRI ---

  async getHonorariosCasosPrecargados(): Promise<any> {
    return this.request('/api/honorarios/casos_precargados');
  }

  async cargarDemostracionHonorarios(casoNombre?: string): Promise<any> {
    const path = casoNombre ? `/${encodeURIComponent(casoNombre)}` : '';
    return this.request(`/api/honorarios/cargar_demostracion${path}`, {
      method: 'POST'
    });
  }

  async analizarExpedienteHonorarios(formData: FormData): Promise<any> {
    return this.request('/api/honorarios/analizar_expediente', {
      method: 'POST',
      body: formData
    });
  }

  async validarExpedienteHonorarios(payload: any): Promise<any> {
    return this.request('/api/honorarios/validar_expediente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async generarDocumentosHonorarios(payload: any): Promise<any> {
    return this.request('/api/honorarios/generar_documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // --- Proveedores ---

  async getProveedoresCasosPrecargados(): Promise<any> {
    return this.request('/api/proveedores/casos_precargados');
  }

  async cargarDemostracionProveedores(casoNombre: string): Promise<any> {
    return this.request(`/api/proveedores/cargar_demostracion/${encodeURIComponent(casoNombre)}`, {
      method: 'POST'
    });
  }

  async analizarExpedienteProveedores(formData: FormData): Promise<any> {
    return this.request('/api/proveedores/analizar_expediente', {
      method: 'POST',
      body: formData
    });
  }

  async validarExpedienteProveedores(payload: any): Promise<any> {
    return this.request('/api/proveedores/validar_expediente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async generarDocumentosProveedores(payload: any): Promise<any> {
    return this.request('/api/proveedores/generar_documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // --- Lotes Masivos ---

  async getLotes(): Promise<any> {
    return this.request('/api/batch/lotes');
  }

  async getLoteDetalle(loteId: string): Promise<any> {
    return this.request(`/api/batch/detalle/${encodeURIComponent(loteId)}`);
  }

  async getLoteResumen(loteId: string): Promise<any> {
    return this.request(`/api/batch/resumen/${encodeURIComponent(loteId)}`);
  }

  async procesarLote(payload: any): Promise<any> {
    return this.request('/api/batch/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // --- Chatbot ---

  async enviarMensajeChat(mensaje: string, contexto: any = {}): Promise<any> {
    return this.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, contexto })
    });
  }

  // --- Configuración y Esquemas ---

  async getConfigProyectos(): Promise<any> {
    return this.request('/api/config/proyectos');
  }

  async getConfigProcedimientos(): Promise<any> {
    return this.request('/api/config/procedimientos');
  }

  async getConfigSchemas(): Promise<any> {
    return this.request('/api/config/schemas');
  }

  async getConfigPlantillas(): Promise<any> {
    return this.request('/api/config/plantillas');
  }

  async getConfigPrompts(): Promise<any> {
    return this.request('/api/config/prompts');
  }
}

export const api = new ApiService();

