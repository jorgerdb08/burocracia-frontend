import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  FileText, 
  FolderArchive, 
  GraduationCap, 
  Plane, 
  MoreHorizontal 
} from 'lucide-react';

interface ViewHeroLayoutProps {
  onComenzar: () => void;
  onComenzarConPlantilla?: (templateId: string) => void;
  onIrLotes?: () => void;
  onIrExpedientes?: () => void;
  onTramitarCaso?: (casoId: string) => void;
  onInspeccionarCaso?: (casoId: string) => void;
}

interface ExpedienteReciente {
  id: string;
  codigo: string;
  tipo: 'honorarios' | 'pago_proveedor' | 'dietas' | 'general';
  procedimientoLabel: string;
  objeto: string;
  fecha: string;
  estado: 'completado' | 'revision' | 'borrador';
  estadoLabel: string;
}

export function ViewHeroLayout({ 
  onComenzar, 
  onComenzarConPlantilla, 
  onIrLotes, 
  onIrExpedientes,
  onTramitarCaso,
  onInspeccionarCaso,
}: ViewHeroLayoutProps) {
  const [expedientes, setExpedientes] = useState<ExpedienteReciente[]>([
    {
      id: 'caso_30_honorarios_conferencia',
      codigo: 'EXP-2026-0178',
      tipo: 'honorarios',
      procedimientoLabel: 'Honorarios',
      objeto: 'Conferencia Cátedra Telefónica',
      fecha: '22/04/2026',
      estado: 'completado',
      estadoLabel: 'Completado'
    },
    {
      id: 'caso_01_tarjeta_subscripcion',
      codigo: 'EXP-2026-0177',
      tipo: 'pago_proveedor',
      procedimientoLabel: 'Pago a proveedor',
      objeto: 'Suscripción ChatGPT 23/6/26-23/7/26',
      fecha: '20/04/2026',
      estado: 'revision',
      estadoLabel: 'En revisión'
    },
    {
      id: 'caso_02_dietas_madrid',
      codigo: 'EXP-2026-0176',
      tipo: 'dietas',
      procedimientoLabel: 'Dietas y desplazamientos',
      objeto: 'Congreso internacional - Madrid',
      fecha: '15/04/2026',
      estado: 'completado',
      estadoLabel: 'Completado'
    },
    {
      id: 'caso_03_compra_laboratorio',
      codigo: 'EXP-2026-0175',
      tipo: 'pago_proveedor',
      procedimientoLabel: 'Pago a proveedor',
      objeto: 'Material fungible de laboratorio',
      fecha: '10/04/2026',
      estado: 'borrador',
      estadoLabel: 'Borrador'
    }
  ]);

  useEffect(() => {
    fetch('/api/casos')
      .then(r => r.json())
      .then(data => {
        if (data.casos && data.casos.length > 0) {
          const mapeados: ExpedienteReciente[] = data.casos.slice(0, 4).map((c: any, idx: number) => {
            const num = (178 - idx).toString().padStart(4, '0');
            let tipoNorm: 'honorarios' | 'pago_proveedor' | 'dietas' = 'pago_proveedor';
            let label = 'Pago a proveedor';
            if (c.tipo === 'honorarios' || c.id.includes('honorarios')) {
              tipoNorm = 'honorarios';
              label = 'Honorarios';
            } else if (c.tipo === 'dietas' || c.id.includes('dieta') || c.id.includes('desplazamiento')) {
              tipoNorm = 'dietas';
              label = 'Dietas y desplazamientos';
            }
            return {
              id: c.id,
              codigo: `EXP-2026-${num}`,
              tipo: tipoNorm,
              procedimientoLabel: label,
              objeto: c.descripcion || c.id.replace(/_/g, ' '),
              fecha: c.fecha || '22/04/2026',
              estado: c.estado === 'error' ? 'revision' : 'completado',
              estadoLabel: c.estado === 'error' ? 'En revisión' : 'Completado'
            };
          });
          setExpedientes(mapeados);
        }
      })
      .catch(() => {});
  }, []);

  const getBadgeStyle = (tipo: ExpedienteReciente['tipo']) => {
    switch (tipo) {
      case 'honorarios':
        return {
          backgroundColor: 'var(--bg-blue-soft)',
          color: 'var(--color-blue-inst)',
          border: '1px solid #D0DFEF'
        };
      case 'pago_proveedor':
        return {
          backgroundColor: 'var(--bg-orange-soft)',
          color: 'var(--color-orange)',
          border: '1px solid #F6E2C6'
        };
      case 'dietas':
        return {
          backgroundColor: 'var(--bg-green-soft)',
          color: 'var(--color-green)',
          border: '1px solid #C8E5D7'
        };
      default:
        return {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)'
        };
    }
  };

  const getStatusColor = (estado: ExpedienteReciente['estado']) => {
    switch (estado) {
      case 'completado': return 'var(--color-green)';
      case 'revision': return 'var(--color-orange)';
      case 'borrador': return 'var(--text-faint)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      
      {/* 1. CABECERA PRINCIPAL (HERO) CON TIPOGRAFÍA EDITORIAL E IMAGEN DEL CAMPUS */}
      <div 
        style={{ 
          position: 'relative', 
          padding: '24px 0 20px 0',
          borderBottom: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {/* Imagen del campus institucional con máscara degradada sutil */}
        <div 
          style={{ 
            position: 'absolute', 
            right: 0, 
            top: 0, 
            bottom: 0, 
            width: '48%', 
            pointerEvents: 'none', 
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <img 
            src="/campus_uex_real.png" 
            alt="Campus Universidad de Extremadura" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              objectPosition: 'right center',
              opacity: 0.50,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.40) 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.40) 55%, transparent 100%)'
            }} 
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div 
              style={{ 
                fontSize: '11px', 
                fontWeight: 600, 
                letterSpacing: '0.12em', 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                marginBottom: '8px' 
              }}
            >
              SEDE ELECTRÓNICA UEX &nbsp;/&nbsp; INTERVENCIÓN ECONÓMICA &nbsp;/&nbsp; SGTRI
            </div>

            <h1 
              style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: '40px', 
                fontWeight: 400, 
                letterSpacing: '-0.01em', 
                color: 'var(--color-navy)', 
                lineHeight: 1.18,
                margin: '0 0 10px 0'
              }}
            >
              Gestión y Liquidación Económica
            </h1>

            <p 
              style={{ 
                fontSize: '14.5px', 
                color: 'var(--text-secondary)', 
                maxWidth: '680px', 
                lineHeight: 1.5,
                margin: 0
              }}
            >
              Tramitación administrativa, verificación de requisitos normativos y generación de modelos oficiales de gasto en proyectos de investigación.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ZONA DE ACCIÓN Y PROCEDIMIENTOS CENTRADOS SEGÚN EL BOCETO */}
      <div 
        style={{ 
          maxWidth: '1040px', 
          width: '100%', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px' 
        }}
      >
        
        {/* FILA 1 DEL BOCETO: 2 ACCIONES DE TRAMITACIÓN EN PARALELO */}
        <div>
          <div 
            style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              letterSpacing: '0.08em', 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              marginBottom: '12px' 
            }}
          >
            TRAMITACIÓN
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            
            {/* Tarjeta 1: Iniciar nuevo expediente (Identidad azul) */}
            <div 
              onClick={onComenzar}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '18px 22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                transition: 'all var(--transition-fast)'
              }}
              className="action-card-hover"
            >
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-blue-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-blue-inst)',
                  flexShrink: 0
                }}
              >
                <FileText size={20} strokeWidth={1.8} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>
                  Iniciar nuevo expediente
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Comisiones de servicio, justificación de compras con tarjeta o transferencia, liquidación de dietas y retribución de conferencias.
                </div>
              </div>

              <ArrowRight size={16} style={{ color: 'var(--color-blue-inst)', flexShrink: 0, marginTop: '3px' }} />
            </div>

            {/* Tarjeta 2: Tramitación por lotes (Identidad verde) */}
            <div 
              onClick={onIrLotes ? onIrLotes : onComenzar}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '18px 22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                transition: 'all var(--transition-fast)'
              }}
              className="action-card-hover"
            >
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-green-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-green)',
                  flexShrink: 0
                }}
              >
                <FolderArchive size={20} strokeWidth={1.8} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>
                  Tramitación por lotes
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Procesamiento simultáneo de múltiples expedientes en carpetas de investigación con contexto común heredado.
                </div>
              </div>

              <ArrowRight size={16} style={{ color: 'var(--color-green)', flexShrink: 0, marginTop: '3px' }} />
            </div>

          </div>
        </div>

        {/* FILA 2 DEL BOCETO: PROCEDIMIENTOS DESTACADOS EN HORIZONTAL */}
        <div>
          <div 
            style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              letterSpacing: '0.08em', 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              marginBottom: '12px' 
            }}
          >
            PROCEDIMIENTOS DESTACADOS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            
            {/* Honorarios */}
            <div 
              onClick={() => onComenzarConPlantilla ? onComenzarConPlantilla('honorarios') : onComenzar()}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              className="action-card-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={18} color="var(--color-blue-inst)" strokeWidth={1.8} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-blue-inst)' }}>Honorarios</span>
                </div>
                <ArrowRight size={14} color="var(--color-blue-inst)" />
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Conferencias, cursos, premios y convenios
              </div>
            </div>

            {/* Pago a proveedor */}
            <div 
              onClick={() => onComenzarConPlantilla ? onComenzarConPlantilla('pago_proveedor') : onComenzar()}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              className="action-card-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--color-blue-inst)" strokeWidth={1.8} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-blue-inst)' }}>Pago a proveedor</span>
                </div>
                <ArrowRight size={14} color="var(--color-blue-inst)" />
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Transferencia o tarjeta del investigador
              </div>
            </div>

            {/* Dietas y desplazamientos */}
            <div 
              onClick={() => onComenzarConPlantilla ? onComenzarConPlantilla('dietas') : onComenzar()}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              className="action-card-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plane size={18} color="var(--color-blue-inst)" strokeWidth={1.8} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-blue-inst)' }}>Dietas y desplazamientos</span>
                </div>
                <ArrowRight size={14} color="var(--color-blue-inst)" />
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Comisiones de servicio y liquidación de gastos
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. SECCIÓN INFERIOR: ÚLTIMOS EXPEDIENTES (ALINEADO CON EL ANCHO CENTRAL) */}
      <div 
        style={{ 
          maxWidth: '1040px', 
          width: '100%', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              letterSpacing: '0.08em', 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase' 
            }}
          >
            ÚLTIMOS EXPEDIENTES
          </span>

          {onIrExpedientes && (
            <span 
              onClick={onIrExpedientes}
              style={{ 
                fontSize: '12px', 
                fontWeight: 500, 
                color: 'var(--color-blue-inst)', 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Ver todos los expedientes →
            </span>
          )}
        </div>

        {/* Tabla institucional con bordes finos */}
        <div 
          style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            overflow: 'hidden' 
          }}
        >
          <table className="admin-table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <th style={{ width: '140px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>CÓDIGO</th>
                <th style={{ width: '190px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>PROCEDIMIENTO</th>
                <th style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>OBJETO</th>
                <th style={{ width: '110px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>FECHA</th>
                <th style={{ width: '130px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>ESTADO</th>
                <th style={{ width: '70px', textAlign: 'center', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((exp) => (
                <tr 
                  key={exp.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onInspeccionarCaso ? onInspeccionarCaso(exp.id) : onComenzar()}
                >
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: 'var(--color-navy)' }}>
                    {exp.codigo}
                  </td>
                  <td>
                    <span 
                      style={{
                        ...getBadgeStyle(exp.tipo),
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        lineHeight: 1.3
                      }}
                    >
                      {exp.procedimientoLabel}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--color-navy)' }}>
                    {exp.objeto}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {exp.fecha}
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500 }}>
                      <span 
                        style={{ 
                          width: '7px', 
                          height: '7px', 
                          borderRadius: '50%', 
                          backgroundColor: getStatusColor(exp.estado),
                          flexShrink: 0 
                        }} 
                      />
                      <span style={{ color: getStatusColor(exp.estado) }}>
                        {exp.estadoLabel}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTramitarCaso) onTramitarCaso(exp.id);
                        else onComenzar();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-secondary)'
                      }}
                      title="Opciones de expediente"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
