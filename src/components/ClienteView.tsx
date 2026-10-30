import React, { useState } from 'react';
import {
  ApprovalItemType,
  AuditReceipt,
  VehicleRecord,
  WorkshopContact,
} from '../types/workshop';
import { buildWorkshopReturnLinks } from '../utils/workshopLogic';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  MessageSquare,
  Mail,
  Lock,
  Car,
  FileCheck2,
} from 'lucide-react';

interface ClienteViewProps {
  vehiculos: VehicleRecord[];
  selectedVehicleId: string;
  onSelectVehicleId: (id: string) => void;
  tallerContacto: WorkshopContact;
  onProcessDecision: (payload: {
    vehiculoId: string;
    itemId: string;
    tipo: ApprovalItemType;
    aprobado: boolean;
    aceptoCheckbox: boolean;
    firma: string;
  }) => { ok: boolean; error?: string; receipt?: AuditReceipt };
}

export const ClienteView: React.FC<ClienteViewProps> = ({
  vehiculos,
  selectedVehicleId,
  onSelectVehicleId,
  tallerContacto,
  onProcessDecision,
}) => {
  const [checkedByItem, setCheckedByItem] = useState<Record<string, boolean>>({});
  const [firmaByItem, setFirmaByItem] = useState<Record<string, string>>({});
  const [errorByItem, setErrorByItem] = useState<Record<string, string>>({});
  const [lastEmittedReceipt, setLastEmittedReceipt] = useState<AuditReceipt | null>(null);

  const activeVehicle =
    vehiculos.find((v) => v.id === selectedVehicleId) || vehiculos[0] || null;

  if (!activeVehicle) {
    return (
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
        <p className="text-slate-400">No hay vehículos registrados en el sistema.</p>
      </section>
    );
  }

  const handleToggleCheck = (itemId: string, checked: boolean) => {
    setCheckedByItem((prev) => ({ ...prev, [itemId]: checked }));
    setErrorByItem((prev) => ({ ...prev, [itemId]: '' }));
  };

  const handleChangeFirma = (itemId: string, val: string) => {
    setFirmaByItem((prev) => ({ ...prev, [itemId]: val }));
    setErrorByItem((prev) => ({ ...prev, [itemId]: '' }));
  };

  const handleDecisionClick = (
    itemId: string,
    tipo: ApprovalItemType,
    aprobado: boolean
  ) => {
    const aceptoCheckbox = Boolean(checkedByItem[itemId]);
    const firma = firmaByItem[itemId] || '';

    const result = onProcessDecision({
      vehiculoId: activeVehicle.id,
      itemId,
      tipo,
      aprobado,
      aceptoCheckbox,
      firma,
    });

    if (!result.ok && result.error) {
      setErrorByItem((prev) => ({ ...prev, [itemId]: result.error! }));
      return;
    }

    if (result.receipt) {
      setLastEmittedReceipt(result.receipt);
    }
  };

  const pendingDiag =
    activeVehicle.diagnostico && activeVehicle.diagnostico.resolucion === 'PENDIENTE'
      ? activeVehicle.diagnostico
      : null;
  const resolvedDiag =
    activeVehicle.diagnostico && activeVehicle.diagnostico.resolucion !== 'PENDIENTE'
      ? activeVehicle.diagnostico
      : null;

  const pendingImprevistos = activeVehicle.imprevistos.filter(
    (i) => i.resolucion === 'PENDIENTE'
  );
  const resolvedImprevistos = activeVehicle.imprevistos.filter(
    (i) => i.resolucion !== 'PENDIENTE'
  );

  const returnLinks = lastEmittedReceipt
    ? buildWorkshopReturnLinks(tallerContacto, lastEmittedReceipt)
    : null;

  return (
    <section aria-label="Portal de Autorización del Cliente" className="space-y-6">
      {/* Cabecera del Portal Cliente y Selector de Vehículo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono-tabular uppercase tracking-wider text-amber-400 font-bold">
            PORTAL DIGITAL DE AUTORIZACIÓN Y FIRMA BILATERAL
          </span>
          <h1 className="font-display text-3xl font-extrabold text-white mt-1">
            Seguimiento y Aprobación de Presupuestos
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Revise la evidencia técnica del taller y autorice con firma digital inmutable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="cliente-vehiculo-select"
            className="text-xs font-bold uppercase text-slate-400"
          >
            Seleccionar Vehículo:
          </label>
          <select
            id="cliente-vehiculo-select"
            value={activeVehicle.id}
            onChange={(e) => {
              onSelectVehicleId(e.target.value);
              setLastEmittedReceipt(null);
            }}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm outline-none focus:border-amber-400"
          >
            {vehiculos.map((v) => {
              const hasPend =
                (v.diagnostico && v.diagnostico.resolucion === 'PENDIENTE') ||
                v.imprevistos.some((i) => i.resolucion === 'PENDIENTE');
              return (
                <option key={v.id} value={v.id}>
                  {v.placa} · {v.modelo} ({v.cliente}) {hasPend ? '— [PENDIENTE FIRMA]' : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Estado Actual del Vehículo en Vivo */}
      <div
        data-testid="cliente-vehicle-status-banner"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono-tabular font-bold text-amber-400">
                Placa: {activeVehicle.placa}
              </span>
              <span>·</span>
              <span>Propietario: {activeVehicle.cliente}</span>
              <span>·</span>
              <span>Mecánico: {activeVehicle.mecanico}</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-white mt-0.5">
              {activeVehicle.modelo}
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-xs font-bold uppercase text-slate-400">
            Estado Actual en Taller:
          </span>
          <span
            data-testid="cliente-current-estado"
            className={`mt-1 px-4 py-2 rounded-xl font-extrabold text-base border ${
              activeVehicle.estado.includes('Pausado')
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : activeVehicle.estado.includes('Reparación')
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-blue-500/20 border-blue-500 text-blue-300'
            }`}
          >
            {activeVehicle.estado}
          </span>
        </div>
      </div>

      {/* Comprobante Recién Emitido + Notificación de Retorno al Taller (CA-04) */}
      {lastEmittedReceipt && returnLinks && (
        <div
          role="region"
          aria-label="Comprobante Digital Inmutable Emitido"
          data-testid="immutable-receipt-banner"
          className="bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl p-6 space-y-5 shadow-xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileCheck2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <span className="font-mono-tabular text-xs font-extrabold uppercase text-emerald-300">
                  COMPROBANTE DIGITAL INMUTABLE GENERADO · {lastEmittedReceipt.comprobanteId}
                </span>
                <h3 className="font-display text-2xl font-extrabold text-white">
                  Resolución Registrada: {lastEmittedReceipt.decision} ($
                  {lastEmittedReceipt.monto.toFixed(2)} USD)
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  El panel del Mecánico y de Don Ramiro ya recibieron la alerta en pantalla.
                </p>
              </div>
            </div>
            <span className="font-mono-tabular text-xs bg-slate-950 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700 font-bold">
              {lastEmittedReceipt.timestamp}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/90 border border-emerald-800/80 text-xs">
            <div>
              <span className="text-slate-400 block">ID Único Inmutable:</span>
              <strong className="font-mono-tabular text-sm text-white">
                {lastEmittedReceipt.comprobanteId}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Firma Digital Estampada:</span>
              <strong className="font-mono-tabular text-sm text-emerald-300">
                {lastEmittedReceipt.firma}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Tipo y Monto Bloqueado:</span>
              <strong className="font-mono-tabular text-sm text-amber-400">
                {lastEmittedReceipt.tipo} · ${lastEmittedReceipt.monto.toFixed(2)} USD
              </strong>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-emerald-200">
              Notificación de Retorno del Cliente hacia el Taller (WhatsApp y Correo):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={returnLinks.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[56px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Enviar Confirmación de Vuelta por WhatsApp</span>
              </a>
              <a
                href={returnLinks.mailtoUrl}
                className="min-h-[56px] px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition"
              >
                <Mail className="w-5 h-5" />
                <span>Enviar Confirmación de Vuelta por Correo</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TARJETAS DESTACADAS DE APROBACIÓN PENDIENTE (CA-04)  */}
      {/* ==================================================== */}
      {pendingDiag && (
        <div
          data-testid={`pending-approval-card-${pendingDiag.id}`}
          className="bg-slate-900 border-2 border-amber-500 rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="bg-amber-500 text-slate-950 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-2xl font-extrabold uppercase tracking-wide">
              Autorización Requerida · Diagnóstico y Presupuesto Inicial
            </span>
            <span className="font-mono-tabular text-xl font-black bg-slate-950 text-amber-400 px-4 py-1.5 rounded-xl">
              Monto: ${pendingDiag.monto.toFixed(2)} USD
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">
                  Informe Técnico del Mecánico ({activeVehicle.mecanico}):
                </span>
                <p className="mt-2 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-base leading-relaxed">
                  {pendingDiag.descripcion}
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Fecha de emisión: <span className="font-mono-tabular">{pendingDiag.createdAt}</span>
              </div>
            </div>

            {/* Formulario de Aceptación y Firma Digital */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-white uppercase">
                  Firma Digital de Conformidad
                </h3>

                {errorByItem[pendingDiag.id] && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-red-950 border border-red-500 text-red-200 text-xs font-bold"
                  >
                    {errorByItem[pendingDiag.id]}
                  </div>
                )}

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(checkedByItem[pendingDiag.id])}
                    onChange={(e) => handleToggleCheck(pendingDiag.id, e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded accent-amber-500"
                  />
                  <span className="text-sm font-semibold text-slate-200 leading-snug">
                    Acepto el presupuesto descrito y autorizo la intervención mecánica por $
                    {pendingDiag.monto.toFixed(2)} USD.
                  </span>
                </label>

                <div>
                  <label
                    htmlFor={`firma-input-${pendingDiag.id}`}
                    className="block text-xs font-bold uppercase text-slate-300 mb-1.5"
                  >
                    Firma Digital (Nombre completo o últimos 4 dígitos de documento/teléfono) *
                  </label>
                  <input
                    id={`firma-input-${pendingDiag.id}`}
                    type="text"
                    value={firmaByItem[pendingDiag.id] || ''}
                    onChange={(e) => handleChangeFirma(pendingDiag.id, e.target.value)}
                    placeholder={`Ej: ${activeVehicle.cliente} o ${activeVehicle.telefono.slice(-4)}`}
                    className="w-full min-h-[52px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white font-mono-tabular text-base outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDecisionClick(pendingDiag.id, 'Diagnóstico Inicial', false)
                  }
                  className="min-h-[58px] px-4 py-3 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-200 border border-slate-700 text-slate-200 font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                  <span>❌ RECHAZAR</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDecisionClick(pendingDiag.id, 'Diagnóstico Inicial', true)
                  }
                  className="min-h-[58px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>✅ APROBAR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Imprevistos Pendientes */}
      {pendingImprevistos.map((imp) => (
        <div
          key={imp.id}
          data-testid={`pending-approval-card-${imp.id}`}
          className="bg-slate-900 border-2 border-amber-500 rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="bg-amber-500 text-slate-950 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-2xl font-extrabold uppercase tracking-wide">
              Autorización Requerida · Imprevisto Mecánico en Bahía
            </span>
            <span className="font-mono-tabular text-xl font-black bg-slate-950 text-amber-400 px-4 py-1.5 rounded-xl">
              Costo Adicional: +${imp.monto.toFixed(2)} USD
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">
                  Evidencia Fotográfica de la Pieza Dañada:
                </span>
                <img
                  src={imp.fotoUrl}
                  alt={imp.fotoLabel}
                  referrerPolicy="no-referrer"
                  className="mt-2 w-full h-56 object-cover rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">
                  Descripción de la Falla Imprevista:
                </span>
                <p className="mt-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm leading-relaxed">
                  {imp.descripcion}
                </p>
              </div>
            </div>

            {/* Formulario de Aceptación y Firma Digital */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-white uppercase">
                  Firma Digital de Conformidad
                </h3>

                {errorByItem[imp.id] && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-red-950 border border-red-500 text-red-200 text-xs font-bold"
                  >
                    {errorByItem[imp.id]}
                  </div>
                )}

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(checkedByItem[imp.id])}
                    onChange={(e) => handleToggleCheck(imp.id, e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded accent-amber-500"
                  />
                  <span className="text-sm font-semibold text-slate-200 leading-snug">
                    Acepto el presupuesto descrito y autorizo la reparación adicional por +$
                    {imp.monto.toFixed(2)} USD.
                  </span>
                </label>

                <div>
                  <label
                    htmlFor={`firma-input-${imp.id}`}
                    className="block text-xs font-bold uppercase text-slate-300 mb-1.5"
                  >
                    Firma Digital (Nombre completo o últimos 4 dígitos de documento/teléfono) *
                  </label>
                  <input
                    id={`firma-input-${imp.id}`}
                    type="text"
                    value={firmaByItem[imp.id] || ''}
                    onChange={(e) => handleChangeFirma(imp.id, e.target.value)}
                    placeholder={`Ej: ${activeVehicle.cliente} o ${activeVehicle.telefono.slice(-4)}`}
                    className="w-full min-h-[52px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white font-mono-tabular text-base outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDecisionClick(imp.id, 'Imprevisto', false)}
                  className="min-h-[58px] px-4 py-3 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-200 border border-slate-700 text-slate-200 font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                  <span>❌ RECHAZAR</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDecisionClick(imp.id, 'Imprevisto', true)}
                  className="min-h-[58px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>✅ APROBAR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Estado sin pendientes */}
      {!pendingDiag && pendingImprevistos.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-display text-2xl font-bold text-white">
            No tiene autorizaciones pendientes para {activeVehicle.placa}
          </h3>
          <p className="text-sm text-slate-400">
            Todos los presupuestos emitidos para esta unidad se encuentran procesados y respaldados con comprobante inmutable.
          </p>
        </div>
      )}

      {/* Historial de Tarjetas Bloqueadas con Comprobante Digital Inmutable */}
      {(resolvedDiag || resolvedImprevistos.length > 0) && (
        <div className="space-y-3">
          <h3 className="font-display text-xl font-bold uppercase tracking-wide text-slate-300">
            Comprobantes Digitales Inmutables de esta Unidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolvedDiag && (
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-tabular font-bold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> {resolvedDiag.comprobanteId} · Diagnóstico Inicial
                  </span>
                  <span
                    className={`font-extrabold ${
                      resolvedDiag.resolucion === 'APROBADO'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {resolvedDiag.resolucion}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{resolvedDiag.descripcion}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                  <span>Firma: {resolvedDiag.firma}</span>
                  <strong className="text-white">${resolvedDiag.monto.toFixed(2)} USD</strong>
                </div>
              </div>
            )}

            {resolvedImprevistos.map((imp) => (
              <div
                key={imp.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-tabular font-bold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> {imp.comprobanteId} · Imprevisto
                  </span>
                  <span
                    className={`font-extrabold ${
                      imp.resolucion === 'APROBADO' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {imp.resolucion}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{imp.descripcion}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                  <span>Firma: {imp.firma}</span>
                  <strong className="text-white">+${imp.monto.toFixed(2)} USD</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
