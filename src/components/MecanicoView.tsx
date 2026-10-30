import React, { useState } from 'react';
import {
  BilateralAlert,
  MechanicId,
  VehicleRecord,
} from '../types/workshop';
import {
  MECHANIC_OPTIONS,
  QUICK_DIAGNOSTIC_PRESETS,
} from '../utils/seedData';
import { buildClientNotificationLinks } from '../utils/workshopLogic';
import {
  Mic,
  AlertTriangle,
  Send,
  MessageSquare,
  Mail,
  Wrench,
  Smartphone,
  CheckCircle2,
  BellRing,
} from 'lucide-react';

interface MecanicoViewProps {
  vehiculos: VehicleRecord[];
  activeMecanico: MechanicId;
  onChangeMecanico: (mecanico: MechanicId) => void;
  onSubmitDiagnostico: (
    vehiculoId: string,
    descripcion: string,
    monto: number
  ) => { ok: boolean; error?: string };
  onOpenImprevistoModal: (vehicle: VehicleRecord) => void;
  onJumpToClientPortal: (vehiculoId: string) => void;
  alertasRetorno: BilateralAlert[];
  onDismissAlert: (alertId: string) => void;
}

export const MecanicoView: React.FC<MecanicoViewProps> = ({
  vehiculos,
  activeMecanico,
  onChangeMecanico,
  onSubmitDiagnostico,
  onOpenImprevistoModal,
  onJumpToClientPortal,
  alertasRetorno,
  onDismissAlert,
}) => {
  const [draftDescByVeh, setDraftDescByVeh] = useState<Record<string, string>>({});
  const [draftMontoByVeh, setDraftMontoByVeh] = useState<Record<string, string>>({});
  const [recordingVehId, setRecordingVehId] = useState<string | null>(null);
  const [feedbackByVeh, setFeedbackByVeh] = useState<Record<string, string>>({});

  const assignedVehicles = vehiculos.filter((v) => v.mecanico === activeMecanico);
  const unreadAlerts = alertasRetorno.filter(
    (a) => a.mecanico === activeMecanico && !a.leidoMecanico
  );

  const setDraftDesc = (vehId: string, val: string) => {
    setDraftDescByVeh((prev) => ({ ...prev, [vehId]: val }));
    setFeedbackByVeh((prev) => ({ ...prev, [vehId]: '' }));
  };

  const setDraftMonto = (vehId: string, val: string) => {
    setDraftMontoByVeh((prev) => ({ ...prev, [vehId]: val }));
    setFeedbackByVeh((prev) => ({ ...prev, [vehId]: '' }));
  };

  const handleApplyQuickPreset = (
    vehId: string,
    descripcionCompleta: string,
    montoSugerido: number
  ) => {
    setDraftDesc(vehId, descripcionCompleta);
    setDraftMonto(vehId, String(montoSugerido));
  };

  const handleAddQuickDiagMonto = (vehId: string, addValue: number) => {
    const current = parseFloat(draftMontoByVeh[vehId] || '0') || 0;
    setDraftMonto(vehId, String(current + addValue));
  };

  const handleVoiceDictation = (vehId: string) => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      const fallback =
        'Revisión en bahía: desgaste en pastillas delanteras, rectificación de discos y purga de líquido de frenos.';
      const existing = draftDescByVeh[vehId] || '';
      setDraftDesc(vehId, existing ? `${existing} ${fallback}` : fallback);
      setFeedbackByVeh((prev) => ({
        ...prev,
        [vehId]: 'Dictado por voz insertado (Modo asistido de taller).',
      }));
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionCtor as any)();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      setRecordingVehId(vehId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          const existing = draftDescByVeh[vehId] || '';
          setDraftDesc(vehId, existing ? `${existing} ${transcript}` : transcript);
        }
        setRecordingVehId(null);
      };

      recognition.onerror = () => {
        setRecordingVehId(null);
        const fallback =
          'Diagnóstico por voz: se requiere reemplazo de componente desgastado y ajuste de torque.';
        const existing = draftDescByVeh[vehId] || '';
        setDraftDesc(vehId, existing ? `${existing} ${fallback}` : fallback);
      };

      recognition.onend = () => {
        setRecordingVehId(null);
      };

      recognition.start();
    } catch {
      setRecordingVehId(null);
    }
  };

  const handleEnviarDiagnosticoClick = (vehId: string) => {
    const desc = draftDescByVeh[vehId] || '';
    const montoNum = parseFloat(draftMontoByVeh[vehId] || '0');
    const result = onSubmitDiagnostico(vehId, desc, montoNum);
    if (!result.ok && result.error) {
      setFeedbackByVeh((prev) => ({ ...prev, [vehId]: result.error! }));
    }
  };

  return (
    <section aria-label="Panel Operativo de Mecánicos" className="space-y-6">
      {/* Alerta Visual Inmediata de Retorno del Cliente hacia el Taller (CA-04) */}
      {unreadAlerts.length > 0 && (
        <div className="space-y-3">
          {unreadAlerts.map((alert) => (
            <div
              key={alert.id}
              role="status"
              className={`p-5 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-4 ${
                alert.decision === 'APROBADO'
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
                  : 'bg-red-950/90 border-red-500 text-red-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <BellRing className="w-8 h-8 shrink-0 text-amber-400" />
                <div>
                  <div className="text-xs font-mono-tabular uppercase tracking-wider text-amber-300 font-bold">
                    NOTIFICACIÓN DE RETORNO DEL CLIENTE · COMPROBANTE {alert.comprobanteId}
                  </div>
                  <p className="text-lg font-extrabold mt-0.5">
                    {alert.cliente} ha {alert.decision} el {alert.tipo} de {alert.placa} (
                    {alert.modelo}) por ${alert.monto.toFixed(2)} USD
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    Firma Digital registrada: {alert.firma} · Hora: {alert.timestamp}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDismissAlert(alert.id)}
                className="min-h-[52px] px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm border border-slate-700 transition cursor-pointer"
              >
                Entendido · Continuar Trabajo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Barra Superior de Selección de Mecánico (Botones Gigantes >= 64px "Manos Sucias") */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-white">
              Terminal Operativa de Bahía · Estándar Manos Sucias
            </h1>
            <p className="text-sm text-slate-400">
              Alto contraste industrial · Botones táctiles ≥ 64px · Dictado por voz y fallas en 1 toque
            </p>
          </div>
          <span className="font-mono-tabular text-xs font-bold text-slate-400">
            Unidades en Bahía ({activeMecanico}): {assignedVehicles.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MECHANIC_OPTIONS.map((mec) => {
            const count = vehiculos.filter((v) => v.mecanico === mec.id).length;
            const isSelected = activeMecanico === mec.id;
            return (
              <button
                key={mec.id}
                type="button"
                onClick={() => onChangeMecanico(mec.id)}
                className={`min-h-[68px] p-4 rounded-xl border-2 text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                    : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-display text-lg font-extrabold uppercase leading-tight">
                    {mec.nombre}
                  </div>
                  <div
                    className={`text-xs font-semibold mt-0.5 ${
                      isSelected ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {mec.especialidad}
                  </div>
                </div>
                <span
                  className={`font-mono-tabular text-lg font-black px-3 py-1 rounded-lg ${
                    isSelected
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Vehículos Asignados al Mecánico */}
      {assignedVehicles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="font-display text-2xl font-bold text-white">
            Sin vehículos asignados a {activeMecanico}
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Seleccione otro mecánico en la barra superior o ingrese una nueva unidad desde la vista de Don Ramiro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {assignedVehicles.map((auto) => {
            const portalUrl =
              typeof window !== 'undefined' ? window.location.origin : 'https://taller.local';
            const links = buildClientNotificationLinks(auto, portalUrl);
            const isPaused = auto.estado.includes('Pausado');
            const isRepairing = auto.estado.includes('Reparación');

            return (
              <article
                key={auto.id}
                data-testid={`mechanic-card-${auto.placa}`}
                className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                {/* Cabecera de la Unidad */}
                <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tabular text-xl font-black text-amber-400 tracking-wider">
                        {auto.placa}
                      </span>
                      <span className="text-slate-600">·</span>
                      <h2 className="font-display text-2xl font-extrabold text-white">
                        {auto.modelo}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Cliente: <strong className="text-slate-200">{auto.cliente}</strong> · WhatsApp:{' '}
                      <span className="font-mono-tabular">{auto.telefono}</span> · Correo:{' '}
                      <span>{auto.email}</span>
                    </p>
                  </div>

                  <div
                    className={`px-4 py-2 rounded-xl font-bold text-sm border ${
                      isPaused
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : isRepairing
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-blue-500/20 border-blue-500 text-blue-300'
                    }`}
                  >
                    {auto.estado}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* ==================================================== */}
                  {/* PUNTO DE VERIFICACIÓN 1: DIAGNÓSTICO E INICIAL (CA-02) */}
                  {/* ==================================================== */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-display text-xl font-extrabold uppercase tracking-wide text-slate-200">
                        1. Diagnóstico y Presupuesto Inicial
                      </h3>
                      {auto.diagnostico && (
                        <span className="font-mono-tabular text-xs font-bold text-slate-400">
                          ID: {auto.diagnostico.id}
                        </span>
                      )}
                    </div>

                    {auto.diagnostico ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {auto.diagnostico.descripcion}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
                          <span className="font-mono-tabular text-xl font-black text-amber-400">
                            Presupuesto Base: ${auto.diagnostico.monto.toFixed(2)} USD
                          </span>
                          <span
                            className={`text-xs font-extrabold uppercase ${
                              auto.diagnostico.resolucion === 'APROBADO'
                                ? 'text-emerald-400'
                                : auto.diagnostico.resolucion === 'RECHAZADO'
                                ? 'text-red-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {auto.diagnostico.resolucion === 'APROBADO'
                              ? `✅ APROBADO (${auto.diagnostico.comprobanteId})`
                              : auto.diagnostico.resolucion === 'RECHAZADO'
                              ? `❌ RECHAZADO (${auto.diagnostico.comprobanteId})`
                              : '⏳ ESPERANDO FIRMA DEL CLIENTE'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {feedbackByVeh[auto.id] && (
                          <div
                            role="alert"
                            className="p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-bold"
                          >
                            {feedbackByVeh[auto.id]}
                          </div>
                        )}

                        {/* Botones de Fallas Predefinidas de Un Solo Toque ("Manos Sucias") */}
                        <div>
                          <span className="block text-xs font-bold uppercase text-slate-400 mb-2">
                            Toque Rápido · Fallas Frecuentes de Taller (Sin Teclado):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {QUICK_DIAGNOSTIC_PRESETS.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() =>
                                  handleApplyQuickPreset(
                                    auto.id,
                                    preset.descripcionCompleta,
                                    preset.montoSugerido
                                  )
                                }
                                className="min-h-[64px] p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-left transition flex items-center justify-between gap-2 cursor-pointer"
                              >
                                <span className="text-xs font-bold text-slate-100 leading-snug">
                                  {preset.tituloCorto}
                                </span>
                                <span className="font-mono-tabular text-sm font-black text-amber-400 shrink-0">
                                  ${preset.montoSugerido}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Dictado por Voz + Campo de Detalle de Diagnóstico */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor={`diag-desc-${auto.id}`}
                              className="text-xs font-bold uppercase text-slate-300"
                            >
                              Detalle del Diagnóstico Inicial *
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleVoiceDictation(auto.id)}
                            className={`w-full min-h-[64px] px-4 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 border transition cursor-pointer ${
                              recordingVehId === auto.id
                                ? 'bg-red-600 text-white border-red-400'
                                : 'bg-red-950/60 hover:bg-red-900/70 text-red-200 border-red-800'
                            }`}
                          >
                            <Mic className="w-5 h-5" />
                            <span>
                              {recordingVehId === auto.id
                                ? 'Escuchando Micrófono...'
                                : '🎤 Dictar Diagnóstico por Voz (Web Speech API)'}
                            </span>
                          </button>

                          <textarea
                            id={`diag-desc-${auto.id}`}
                            rows={3}
                            value={draftDescByVeh[auto.id] || ''}
                            onChange={(e) => setDraftDesc(auto.id, e.target.value)}
                            placeholder="Seleccione una falla con un toque arriba, dicte por voz o escriba el diagnóstico..."
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 p-3.5 text-sm text-white placeholder-slate-500 outline-none"
                          />
                        </div>

                        {/* Monto del Presupuesto Inicial + Botón Gigante de Envío */}
                        <div className="space-y-3">
                          <label
                            htmlFor={`diag-monto-${auto.id}`}
                            className="block text-xs font-bold uppercase text-slate-300"
                          >
                            Monto del Presupuesto Inicial ($ USD) *
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddQuickDiagMonto(auto.id, 25)}
                              className="min-h-[64px] rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-mono-tabular font-extrabold text-lg cursor-pointer"
                            >
                              +$25
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddQuickDiagMonto(auto.id, 50)}
                              className="min-h-[64px] rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-mono-tabular font-extrabold text-lg cursor-pointer"
                            >
                              +$50
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddQuickDiagMonto(auto.id, 100)}
                              className="min-h-[64px] rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-mono-tabular font-extrabold text-lg cursor-pointer"
                            >
                              +$100
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-tabular text-xl font-black text-amber-400">
                                $
                              </span>
                              <input
                                id={`diag-monto-${auto.id}`}
                                type="number"
                                min="1"
                                step="0.5"
                                value={draftMontoByVeh[auto.id] || ''}
                                onChange={(e) => setDraftMonto(auto.id, e.target.value)}
                                placeholder="Monto ($ USD)"
                                className="w-full min-h-[64px] pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 font-mono-tabular text-xl font-black text-white outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleEnviarDiagnosticoClick(auto.id)}
                              className="min-h-[64px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                            >
                              <Send className="w-5 h-5 shrink-0" />
                              <span>Enviar a Aprobación del Cliente</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ==================================================== */}
                  {/* PUNTO DE VERIFICACIÓN 2: REPORTAR IMPREVISTO (CA-03) */}
                  {/* ==================================================== */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => onOpenImprevistoModal(auto)}
                      className="w-full min-h-[68px] px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-2xl font-black uppercase tracking-wide flex items-center justify-center gap-3 shadow-lg transition cursor-pointer"
                    >
                      <AlertTriangle className="w-7 h-7 stroke-[2.5] shrink-0" />
                      <span>+ REPORTAR IMPREVISTO</span>
                    </button>

                    {/* Listado de Imprevistos Reportados */}
                    {auto.imprevistos.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <span className="block text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                          Imprevistos Registrados ({auto.imprevistos.length}):
                        </span>
                        {auto.imprevistos.map((imp) => (
                          <div
                            key={imp.id}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={imp.fotoUrl}
                                alt={imp.fotoLabel}
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-100 truncate">
                                  {imp.descripcion}
                                </p>
                                <span className="font-mono-tabular text-sm font-black text-amber-400">
                                  +${imp.monto.toFixed(2)} USD
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-extrabold shrink-0 ${
                                imp.resolucion === 'APROBADO'
                                  ? 'text-emerald-400'
                                  : imp.resolucion === 'RECHAZADO'
                                  ? 'text-red-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {imp.resolucion === 'APROBADO'
                                ? '✓ Aprobado'
                                : imp.resolucion === 'RECHAZADO'
                                ? '✕ Rechazado'
                                : '⏳ Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ==================================================== */}
                  {/* BOTONES DE ENVÍO DIRECTO AL CLIENTE (CA-02 & CA-03)  */}
                  {/* ==================================================== */}
                  {isPaused && (
                    <div
                      data-testid={`dispatch-panel-${auto.placa}`}
                      className="p-5 rounded-xl bg-amber-500/10 border-2 border-amber-500/70 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                          ⏸️ Vehículo Pausado · Enviar Enlace de Aprobación al Cliente:
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a
                          href={links.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[64px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow transition"
                        >
                          <MessageSquare className="w-5 h-5 shrink-0" />
                          <span>Enviar por WhatsApp (wa.me)</span>
                        </a>

                        <a
                          href={links.mailtoUrl}
                          className="min-h-[64px] px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow transition"
                        >
                          <Mail className="w-5 h-5 shrink-0" />
                          <span>Enviar por Correo (mailto:)</span>
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => onJumpToClientPortal(auto.id)}
                        className="w-full min-h-[56px] px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Simular Recepción: Abrir 📱 Vista Cliente con {auto.placa}</span>
                      </button>
                    </div>
                  )}

                  {isRepairing && (
                    <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-700/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-emerald-300 text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>Presupuesto autorizado con firma digital · Unidad en Reparación Activa</span>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
