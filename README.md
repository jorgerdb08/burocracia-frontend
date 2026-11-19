# BurocracIA — Frontend de la Sede Electrónica UEx 🏛️

Interfaz de usuario y aplicación de página única (**Single Page Application, SPA**) de **BurocracIA**, la plataforma agéntica para la tramitación, fiscalización y liquidación económica de la **Universidad de Extremadura (UEx)**.

Diseñada bajo los estándares de la identidad visual corporativa de la UEx, proporciona un entorno centralizado para la pretramitación de comisiones de servicio, liquidación de honorarios docentes y de investigación, pago de facturas a proveedores y procesamiento masivo por lotes.

---

## 📑 Tabla de Contenidos

1. [Módulos y Vistas Operativas](#-módulos-y-vistas-operativas)
2. [Arquitectura del Frontend](#-arquitectura-del-frontend)
3. [Requisitos Previos](#-requisitos-previos)
4. [Instalación y Ejecución](#-instalación-y-ejecución)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Conexión con el Backend](#-conexión-con-el-backend)

---

## 🌟 Módulos y Vistas Operativas

La aplicación cuenta con seis módulos especializados accesibles desde la barra de navegación superior:

### 1. Panel de Inicio (`ViewHeroLayout.tsx`)
* Resumen ejecutivo del sistema y métricas globales de tramitación.
* Acceso directo en un clic para descargar los modelos e impresos oficiales en blanco de la Universidad de Extremadura (AcroForms de la SGTRI).
* Acceso a guías rápidas de normativa universitaria (Decreto 42/2025 y baremos UEx).

### 2. Tramitación de Comisiones de Servicio y Dietas (`ViewProcesar.tsx`)
* **Flujo guiado en 5 pasos:**
  1. *Selección de expediente:* Carga de casos precargados de demostración o creación de expedientes con justificantes propios.
  2. *Checklist de documentos de entrada:* Inspección de billetes (tren/avión), facturas hoteleras, kilometraje, peajes, parkings, cuotas de congreso y hoja de datos personales. Permite anexar nuevos justificantes antes de tramitar.
  3. *Asignación presupuestaria:* Verificación de la Orgánica Presupuestaria UEx y la Referencia del Proyecto.
  4. *Ejecución agéntica:* Orquestación en tiempo real mediante grafos de estados (LangGraph) con retroalimentación visual del progreso.
  5. *Liquidación y descarga:* Resumen financiero detallado (dietas devengadas, importes abonables al investigador y suplidos institucionales) y descarga del impreso oficial *Liquidación de Dietas SGTRI* cumplimentado.

### 3. Generador Inteligente de Honorarios (`GeneradorHonorariosInteligente.tsx`)
* Tramitación de cuatro modalidades docentes y de transferencia:
  * Conferencias científicas impartidas por ponentes externos (hasta 300 €/hora).
  * Premios de investigación (Cátedra Telefónica UEx a múltiples beneficiarios).
  * Contratos de colaboración y transferencia científico-técnica (Art. 83 LOSU / LOU).
  * Convenios de colaboración docente y actividades académicas.
* Comprobación automática de incompatibilidades públicas (Ley 53/1984).
* Cumplimentación de impresos oficiales: *Anexo I (Propuesta de Pago)*, *Declaración Responsable de Incompatibilidades* y *Modelo 7 (Certificación de Actividad)*.
* Soporte para carga masiva mediante hoja de cálculo normalizada (`Honorarios_Caso_Real_Dos_Columnas.xlsx`).

### 4. Gestión de Facturas y Proveedores (`GeneradorProveedoresInteligente.tsx`)
* Justificación y fiscalización de facturas comerciales conforme a la modalidad de gasto:
  * **Modalidad A (Tarjeta Institucional):** Justificación de cargos realizados con tarjeta de crédito de investigación (genera *Anexo II* + *Anexo A*).
  * **Modalidad B (Transferencia Bancaria):** Tramitación de propuestas de pago a proveedores pendientes de abono (genera *Anexo II* + *Propuesta de Pago*).
* Detección precoz de discrepancias económicas entre base imponible, IVA y total factura.

### 5. Procesamiento Masivo por Lotes (`ViewLotesBatch.tsx`)
* Ejecución simultánea y desatendida de múltiples expedientes combinando distintas líneas de gasto (dietas, honorarios y proveedores).
* Asignación de **contexto común compartido** (proyecto, investigador responsable, orgánica UEx) que se propaga automáticamente a todos los expedientes del lote.
* Descarga consolidada de resultados en lote.

### 6. Bandeja de Expedientes (`ViewExpedientes.tsx`)
* Panel de administración para inspeccionar, renombrar, editar metadatos o eliminar expedientes almacenados en el servidor.
* Modal de inspección profunda (`ExpedienteInspectorModal.tsx`) con previsualización de documentos adjuntos.

### 💬 Asistente Virtual Normativo (`ChatWidget.tsx`)
* Widget flotante contextual impulsado por LLMs (Google Gemini / Groq) con la base de conocimiento normativa de la UEx.
* Proporciona respuestas inmediatas y precisas sobre topes de manutención, límites exentos de IRPF en alojamiento (65,97 €/noche), baremo de kilometraje (0,26 €/km) y plazos de liquidación (45 días).

---

## 🛠️ Arquitectura del Frontend

* **Framework:** React 19 con TypeScript estricto.
* **Empaquetador y entorno:** Vite 8 con Hot Module Replacement (HMR).
* **Iconografía:** Lucide React (`lucide-react`).
* **Estilos:** CSS moderno modularizado (`styles/layout.css`, `styles/components.css`) basado en la paleta institucional de la UEx (azul marino `#003865`, verde institucional, grises pizarra y fondos limpios).
* **Cliente API:** Centralizado en `services/api.ts` con manejo robusto de peticiones asíncronas y encuestas de estado (*polling*) para tareas en segundo plano.

---

## 📋 Requisitos Previos

* **Node.js:** Versión 20.19+ o 22.12+ (recomendada LTS).
* **npm:** Versión 10+ (incluida con Node.js).
* **Backend BurocracIA:** Servidor Flask en ejecución (habitualmente en `http://localhost:5000`).

---

## 🚀 Instalación y Ejecución

```powershell
# 1. Acceder al directorio del frontend
cd sede_frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo local
npm run dev
```

La aplicación quedará accesible en: **`http://localhost:5173`**

### Comandos de Compilación y Producción

```powershell
# Verificar tipado TypeScript y compilar para producción
npm run build

# Previsualizar la versión de producción localmente
npm run preview
```

---

## 📂 Estructura del Proyecto

```
sede_frontend/
├── public/                     # Recursos estáticos servidos directamente
│   ├── thumbnails/             # Miniaturas de los impresos oficiales UEx
│   ├── favicon.svg             # Favicon institucional
│   ├── icons.svg               # Sprite de iconos SVG
│   └── logo-uex.png            # Logotipo oficial de la UEx
├── src/
│   ├── components/
│   │   ├── modals/             # Modales de inspección y edición de expedientes
│   │   ├── ui/                 # Componentes atómicos (Alerts, Badges, Botones, Tabs)
│   │   └── views/              # Vistas operativas de los módulos de tramitación
│   ├── lib/                    # Tipos TypeScript, utilidades y datos de plantillas
│   ├── services/               # Cliente API centralizado (api.ts)
│   ├── styles/                 # Hojas de estilo institucionales (layout.css, components.css)
│   ├── App.tsx                 # Enrutamiento principal y estructura de vistas
│   ├── ChatWidget.tsx          # Componente del asistente normativo inteligente
│   └── main.tsx                # Punto de entrada de la aplicación React
├── index.html                  # Plantilla HTML principal
├── package.json                # Definición de dependencias y scripts npm
├── tsconfig.json               # Configuración del compilador TypeScript
└── vite.config.ts              # Configuración de Vite
```

---

## 🔗 Conexión con el Backend

El frontend se comunica de forma transparente con la API REST de BurocracIA:

* En entorno de desarrollo local, Vite redirige las llamadas hacia `http://localhost:5000`.
* Para personalizar la URL del backend, configure la variable de entorno `VITE_API_URL` o edite la constante `API_BASE` en `src/services/api.ts`.

---

*Trabajo de Fin de Grado (TFG) — Grado en Ingeniería Informática del Software, Escuela Politécnica de Cáceres, Universidad de Extremadura (UEx).*
