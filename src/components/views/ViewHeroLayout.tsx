import React from 'react';
import { ArrowRight, FolderArchive } from 'lucide-react';
import { Btn } from '../ui/Btn';

interface ViewHeroLayoutProps {
  onComenzar: () => void;
  onComenzarConPlantilla?: (templateId: string) => void;
  onIrLotes?: () => void;
  onIrExpedientes?: () => void;
  onTramitarCaso?: (casoId: string) => void;
  onInspeccionarCaso?: (casoId: string) => void;
}

export function ViewHeroLayout({ 
  onComenzar, 
  onComenzarConPlantilla, 
  onIrLotes, 
  onIrExpedientes,
}: ViewHeroLayoutProps) {
  const PROCEDIMIENTOS = [
    {
      id: 'dietas',
      codigo: 'PROC-01',
      titulo: 'Dietas y Desplazamientos',
      objeto: 'Indemnizaciones por razón del servicio de personal comisionado en actividades de investigación.',
      normativa: 'R.D. 462/2002 · Art. 32 Bases UEx',
      modelos: 'Liquidación Oficial SGTRI',
    },
    {
      id: 'pago_proveedor',
      codigo: 'PROC-02',
      titulo: 'Pago a Proveedores y Facturas',
      objeto: 'Aprobación del gasto y justificación de facturas comerciales con cargo a tarjeta o transferencia.',
      normativa: 'Normativa SGTRI · Tarjeta Investigador',
      modelos: 'Anexo II (Aprobación) · Anexo A (Justificación)',
    },
    {
      id: 'honorarios',
      codigo: 'PROC-03',
      titulo: 'Honorarios por Conferencias',
      objeto: 'Retribución por impartición de conferencias o ponencias en seminarios y proyectos I+D.',
      normativa: 'Art. 19.4 Bases UEx (Máx. 300 €/h)',
      modelos: 'Anexo II · Declaración Resp. · Certificación',
    },
    {
      id: 'adquisiciones',
      codigo: 'PROC-04',
      titulo: 'Adquisiciones y Contratos Menores',
      objeto: 'Adquisición de equipamiento científico, fungible y servicios menores de investigación.',
      normativa: 'Art. 30 Bases UEx · LCSP (< 15.000 €)',
      modelos: 'Memoria de Fiscalización Previa',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ENCABEZADO DE PÁGINA */}
      <div className="view-header">
        <div>
          <div className="view-breadcrumb">
            <span>Gestión Económica UEx</span>
            <span>/</span>
            <span>SGTRI</span>
          </div>
          <h1 className="view-title">Gestión y Liquidación Económica</h1>
          <p className="view-desc">
            Tramitación administrativa, verificación de requisitos normativos y expedición de modelos oficiales para proyectos de investigación.
          </p>
        </div>
      </div>

      {/* GRUPO 1: ACCIONES PRINCIPALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Acción 1: Iniciar expediente individual */}
        <div className="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tramitación individual
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 6px' }}>
              Iniciar nuevo expediente
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Comisiones de servicio, justificación de compras con tarjeta o transferencia, liquidación de dietas y retribución de conferencias.
            </p>
          </div>
          <div>
            <Btn variant="primary" size="md" onClick={onComenzar}>
              <span>Iniciar expediente</span>
              <ArrowRight size={14} />
            </Btn>
          </div>
        </div>

        {/* Acción 2: Procesamiento masivo por lotes */}
        <div className="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Procesamiento por lotes
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 6px' }}>
              Tramitación de lotes masivos
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Procesamiento simultáneo de múltiples expedientes en carpetas de investigación con contexto común heredado.
            </p>
          </div>
          <div>
            {onIrLotes && (
              <Btn variant="secondary" size="md" onClick={onIrLotes}>
                <FolderArchive size={14} />
                <span>Procesar lotes</span>
              </Btn>
            )}
          </div>
        </div>

      </div>

      {/* GRUPO 2: INFORMACIÓN NORMATIVA Y ECONÓMICA RELEVANTE */}
      <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            Parámetros de referencia · Bases de Ejecución UEx 2026
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Marco regulador vigente
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kilometraje oficial</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0' }}>
              0,26 € / km
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Art. 32.1.c</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dieta manutención completa</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0' }}>
              53,34 € / día
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>R.D. 462/2002 · Media: 26,67 €</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Límite retribución honorarios</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0' }}>
              300,00 € / h
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Art. 19.4 Bases UEx</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contratos menores (Servicios/Suministros)</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0' }}>
              &lt; 15.000 €
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Art. 30 · Sin IVA (LCSP)</div>
          </div>
        </div>
      </div>

      {/* GRUPO 3: CATÁLOGO DE PROCEDIMIENTOS DISPONIBLES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', margin: 0 }}>
            Procedimientos administrativos habilitados
          </h2>
          {onIrExpedientes && (
            <button
              onClick={onIrExpedientes}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--uex-burgundy)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Consultar expedientes registrados →
            </button>
          )}
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Código</th>
                <th style={{ width: '220px' }}>Procedimiento</th>
                <th>Objeto y alcance</th>
                <th style={{ width: '220px' }}>Normativa aplicable</th>
                <th style={{ width: '220px' }}>Modelos oficiales</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {PROCEDIMIENTOS.map((proc) => (
                <tr key={proc.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {proc.codigo}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {proc.titulo}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {proc.objeto}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {proc.normativa}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {proc.modelos}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Btn 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onComenzarConPlantilla ? onComenzarConPlantilla(proc.id) : onComenzar()}
                    >
                      Tramitar
                    </Btn>
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
