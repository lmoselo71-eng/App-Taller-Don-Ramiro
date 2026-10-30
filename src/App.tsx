import { useState, useEffect } from 'react';
import {
  ApprovalItemType,
  AuditReceipt,
  MechanicId,
  NewVehicleInput,
  RoleType,
  VehicleRecord,
  WorkshopState,
} from './types/workshop';
import { INITIAL_WORKSHOP_STATE } from './utils/seedData';
import {
  validateVehicleRegistration,
  createVehicleRecord,
  submitInitialDiagnostic,
  submitImprevisto,
  processClientDecision,
} from './utils/workshopLogic';
import { downloadSingleFileHtml } from './utils/singleFileExporter';
import { RoleSimulatorBar } from './components/RoleSimulatorBar';
import { MecanicoView } from './components/MecanicoView';
import { ClienteView } from './components/ClienteView';
import { DonRamiroView } from './components/DonRamiroView';
import { ImprevistoModal } from './components/ImprevistoModal';

const STORAGE_KEY = 'taller_don_ramiro_state_v1';

function loadInitialState(): WorkshopState {
  if (typeof window === 'undefined') return INITIAL_WORKSHOP_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_WORKSHOP_STATE;
    const parsed = JSON.parse(raw) as WorkshopState;
    if (!parsed || !Array.isArray(parsed.vehiculos) || !Array.isArray(parsed.auditoria)) {
      return INITIAL_WORKSHOP_STATE;
    }
    return {
      ...parsed,
      auditoria: parsed.auditoria.map((item) => Object.freeze({ ...item })),
    };
  } catch {
    return INITIAL_WORKSHOP_STATE;
  }
}

export default function App() {
  const [state, setState] = useState<WorkshopState>(loadInitialState);
  const [activeRole, setActiveRole] = useState<RoleType>('mecanico');
  const [activeMecanico, setActiveMecanico] = useState<MechanicId>('Mecanico1');
  const [selectedClientVehicleId, setSelectedClientVehicleId] = useState<string>(() => {
    const withPending = state.vehiculos.find(
      (v) =>
        (v.diagnostico && v.diagnostico.resolucion === 'PENDIENTE') ||
        v.imprevistos.some((i) => i.resolucion === 'PENDIENTE')
    );
    return withPending?.id || state.vehiculos[0]?.id || '';
  });
  const [modalImprevistoVehicleId, setModalImprevistoVehicleId] = useState<string | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const formatNow = (): string => {
    return new Date().toLocaleString('es-ES', { hour12: false });
  };

  // CA-01: Registro de Nuevo Vehículo en Vista Don Ramiro
  const handleRegisterVehicle = (
    input: NewVehicleInput
  ): { ok: boolean; error?: string } => {
    const validation = validateVehicleRegistration(input);
    if (!validation.valid) {
      return { ok: false, error: validation.error };
    }

    const newVehicle = createVehicleRecord(input, formatNow());
    setState((prev) => ({
      ...prev,
      vehiculos: [newVehicle, ...prev.vehiculos],
    }));
    setSelectedClientVehicleId(newVehicle.id);
    showToast(
      `Vehículo ${newVehicle.placa} registrado en estado 🔍 En Diagnóstico (${newVehicle.mecanico}).`
    );
    return { ok: true };
  };

  // CA-02: Diagnóstico y Presupuesto Inicial en Vista Mecánico
  const handleSubmitDiagnostico = (
    vehiculoId: string,
    descripcion: string,
    monto: number
  ): { ok: boolean; error?: string } => {
    const target = state.vehiculos.find((v) => v.id === vehiculoId);
    if (!target) return { ok: false, error: 'Vehículo no encontrado.' };

    const result = submitInitialDiagnostic(target, descripcion, monto, formatNow());
    if (result.error || !result.updatedVehicle) {
      return { ok: false, error: result.error };
    }

    const updated = result.updatedVehicle;
    setState((prev) => ({
      ...prev,
      vehiculos: prev.vehiculos.map((v) => (v.id === vehiculoId ? updated : v)),
    }));
    setSelectedClientVehicleId(vehiculoId);
    showToast(
      `Diagnóstico enviado. ${updated.placa} cambió a ⏸️ Pausado: Esperando Aprobación.`
    );
    return { ok: true };
  };

  // CA-03: Reportar Imprevisto en Vista Mecánico
  const handleSubmitImprevisto = (
    vehiculoId: string,
    payload: {
      descripcion: string;
      monto: number;
      fotoUrl: string;
      fotoLabel: string;
    }
  ): { ok: boolean; error?: string } => {
    const target = state.vehiculos.find((v) => v.id === vehiculoId);
    if (!target) return { ok: false, error: 'Vehículo no encontrado.' };

    const result = submitImprevisto(target, {
      ...payload,
      nowFormatted: formatNow(),
    });

    if (result.error || !result.updatedVehicle) {
      return { ok: false, error: result.error };
    }

    const updated = result.updatedVehicle;
    setState((prev) => ({
      ...prev,
      vehiculos: prev.vehiculos.map((v) => (v.id === vehiculoId ? updated : v)),
    }));
    setModalImprevistoVehicleId(null);
    setSelectedClientVehicleId(vehiculoId);
    showToast(
      `Imprevisto reportado (+$${payload.monto.toFixed(2)}). ${updated.placa} pasó a ⏸️ Pausado: Esperando Aprobación.`
    );
    return { ok: true };
  };

  // CA-04 & CA-05: Aprobación o Rechazo del Cliente con Firma e Inmutabilidad
  const handleProcessClientDecision = (payload: {
    vehiculoId: string;
    itemId: string;
    tipo: ApprovalItemType;
    aprobado: boolean;
    aceptoCheckbox: boolean;
    firma: string;
  }): { ok: boolean; error?: string; receipt?: AuditReceipt } => {
    const result = processClientDecision(state, {
      ...payload,
      nowFormatted: formatNow(),
    });

    if (result.error || !result.nextState || !result.receipt) {
      return { ok: false, error: result.error };
    }

    setState(result.nextState);
    showToast(
      `Comprobante Inmutable ${result.receipt.comprobanteId} emitido (${result.receipt.decision}). Alerta enviada al taller.`
    );
    return { ok: true, receipt: result.receipt };
  };

  const handleDismissAlert = (alertId: string, role: 'mecanico' | 'ramiro') => {
    setState((prev) => ({
      ...prev,
      alertasRetorno: prev.alertasRetorno.map((a) =>
        a.id === alertId
          ? {
              ...a,
              leidoMecanico: role === 'mecanico' ? true : a.leidoMecanico,
              leidoRamiro: role === 'ramiro' ? true : a.leidoRamiro,
            }
          : a
      ),
    }));
  };

  const handleResetDemo = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_WORKSHOP_STATE);
    setSelectedClientVehicleId(INITIAL_WORKSHOP_STATE.vehiculos[0]?.id || '');
    showToast('Datos de demostración restaurados al estado inicial.');
  };

  const pendingClientCount = state.vehiculos.reduce((count, v) => {
    const diagPend = v.diagnostico && v.diagnostico.resolucion === 'PENDIENTE' ? 1 : 0;
    const impPend = v.imprevistos.filter((i) => i.resolucion === 'PENDIENTE').length;
    return count + diagPend + impPend;
  }, 0);

  const unreadWorkshopAlerts = state.alertasRetorno.filter(
    (a) => !a.leidoMecanico || !a.leidoRamiro
  ).length;

  const modalVehicle = modalImprevistoVehicleId
    ? state.vehiculos.find((v) => v.id === modalImprevistoVehicleId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra Superior Fija: Simulador de Roles */}
      <RoleSimulatorBar
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        pendingClientCount={pendingClientCount}
        unreadWorkshopAlerts={unreadWorkshopAlerts}
        onResetDemo={handleResetDemo}
        onExportHtml={() => downloadSingleFileHtml(state)}
      />

      {/* Toast Global de Confirmación Operativa */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-md px-5 py-3.5 rounded-xl shadow-2xl border font-bold text-sm bg-slate-900 border-amber-500 text-white"
        >
          {toastMessage.text}
        </div>
      )}

      {/* Contenido Principal Sincronizado en Memoria / LocalStorage */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeRole === 'mecanico' && (
          <MecanicoView
            vehiculos={state.vehiculos}
            activeMecanico={activeMecanico}
            onChangeMecanico={setActiveMecanico}
            onSubmitDiagnostico={handleSubmitDiagnostico}
            onOpenImprevistoModal={(veh) => setModalImprevistoVehicleId(veh.id)}
            onJumpToClientPortal={(vehId) => {
              setSelectedClientVehicleId(vehId);
              setActiveRole('cliente');
            }}
            alertasRetorno={state.alertasRetorno}
            onDismissAlert={(alertId) => handleDismissAlert(alertId, 'mecanico')}
          />
        )}

        {activeRole === 'cliente' && (
          <ClienteView
            vehiculos={state.vehiculos}
            selectedVehicleId={selectedClientVehicleId}
            onSelectVehicleId={setSelectedClientVehicleId}
            tallerContacto={state.tallerContacto}
            onProcessDecision={handleProcessClientDecision}
          />
        )}

        {activeRole === 'ramiro' && (
          <DonRamiroView
            vehiculos={state.vehiculos}
            auditoria={state.auditoria}
            alertasRetorno={state.alertasRetorno}
            onRegisterVehicle={handleRegisterVehicle}
            onDismissAlert={(alertId) => handleDismissAlert(alertId, 'ramiro')}
            onInspectInMecanico={(mec) => {
              setActiveMecanico(mec);
              setActiveRole('mecanico');
            }}
            onInspectInCliente={(vehId) => {
              setSelectedClientVehicleId(vehId);
              setActiveRole('cliente');
            }}
          />
        )}
      </main>

      {/* Modal de Reporte de Imprevistos (CA-03) */}
      {modalVehicle && (
        <ImprevistoModal
          vehicle={modalVehicle}
          onClose={() => setModalImprevistoVehicleId(null)}
          onSubmitImprevisto={handleSubmitImprevisto}
        />
      )}

      {/* Pie de página limpio */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        Taller Mecánico Don Ramiro · Sistema de Diagnóstico, Imprevistos y Aprobación Digital Bilateral
      </footer>
    </div>
  );
}
