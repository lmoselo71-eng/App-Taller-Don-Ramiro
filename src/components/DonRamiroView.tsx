import React, { useState } from 'react';
import {
  AuditReceipt,
  BilateralAlert,
  MechanicId,
  NewVehicleInput,
  VehicleRecord,
} from '../types/workshop';
import { MECHANIC_OPTIONS } from '../utils/seedData';
import {
  PlusCircle,
  ShieldCheck,
  Lock,
  BellRing,
  Search,
  ArrowUpRight,
} from 'lucide-react';

interface DonRamiroViewProps {
  vehiculos: VehicleRecord[];
  auditoria: AuditReceipt[];
  alertasRetorno: BilateralAlert[];
  onRegisterVehicle: (input: NewVehicleInput) => { ok: boolean; error?: string };
  onDismissAlert: (alertId: string) => void;
  onInspectInMecanico: (mecanico: MechanicId) => void;
  onInspectInCliente: (vehiculoId: string) => void;
}

export const DonRamiroView: React.FC<DonRamiroViewProps> = ({
  vehiculos,
  auditoria,
  alertasRetorno,
  onRegisterVehicle,
  onDismissAlert,
  onInspectInMecanico,
  onInspectInCliente,
}) => {
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [mecanico, setMecanico] = useState<MechanicId>('Mecanico1');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [auditFilter, setAuditFilter] = useState('');

  const unreadAlerts = alertasRetorno.filter((a) => !a.leidoRamiro);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const res = onRegisterVehicle({
      cliente,
      telefono,
      email,
      modelo,
      placa,
      mecanico,
    });

    if (!res.ok && res.error) {
      setFormError(res.error);
      return;
    }

    setFormSuccess(
      `Unidad ${placa.trim().toUpperCase()} registrada exitosamente en estado 🔍 En Diagnóstico y asignada a ${mecanico}.`
    );
    setCliente('');
    setTelefono('');
    setEmail('');
    setModelo('');
    setPlaca('');
  };

  const filteredAuditoria = auditoria.filter((item) => {
    if (!auditFilter.trim()) return true;
    const q = auditFilter.toLowerCase();
    return (
      item.placa.toLowerCase().includes(q) ||
      item.cliente.toLowerCase().includes(q) ||
      item.comprobanteId.toLowerCase().includes(q) ||
      item.firma.toLowerCase().includes(q)
    );
  });

  return (
    <section aria-label="Panel Administrativo de Don Ramiro" className="space-y-8">
      {/* Alertas de Retorno del Cliente hacia Don Ramiro (CA-04) */}
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
                <BellRing className="w-7 h-7 text-amber-400 shrink-0" />
                <div>
                  <span className="font-mono-tabular text-xs font-extrabold uppercase text-amber-300">
                    CONFIRMACIÓN RECIBIDA DESDE EL PORTAL CLIENTE · {alert.comprobanteId}
                  </span>
                  <p className="text-base font-extrabold mt-0.5">
                    Cliente {alert.cliente} ({alert.placa} · {alert.modelo}) ha {alert.decision} el{' '}
                    {alert.tipo} por ${alert.monto.toFixed(2)} USD
                  </p>
                  <p className="text-xs opacity-90">
                    Firma Digital: {alert.firma} · Mecánico: {alert.mecanico} · {alert.timestamp}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDismissAlert(alert.id)}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                Marcar como Leído
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* A. REGISTRO DE DATOS DE CONTACTO DUAL (CA-01)                */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-white">
              Recepción de Vehículo · Contacto Dual Obligatorio (CA-01)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Registra la unidad validando WhatsApp y Correo Electrónico para garantizar el canal de aprobación bilateral.
            </p>
          </div>
          <span className="font-mono-tabular text-xs text-slate-400">
            Estado inicial automático: 🔍 En Diagnóstico
          </span>
        </div>

        {formError && (
          <div
            role="alert"
            data-testid="registration-error-alert"
            className="p-4 rounded-xl bg-red-950 border border-red-500 text-red-200 text-sm font-bold"
          >
            {formError}
          </div>
        )}

        {formSuccess && (
          <div
            role="status"
            data-testid="registration-success-alert"
            className="p-4 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-sm font-bold"
          >
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="reg-cliente"
              className="block text-xs font-bold uppercase text-slate-300 mb-1.5"
            >
              Nombre del Cliente *
            </label>
            <input
              id="reg-cliente"
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: Roberto Silva"
              className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="reg-telefono"
              className="block text-xs font-bold uppercase text-slate-300 mb-1.5"
            >
              Teléfono (WhatsApp) *
            </label>
            <input
              id="reg-telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 584129876543"
              className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 font-mono-tabular text-sm text-white outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-bold uppercase text-slate-300 mb-1.5"
            >
              Correo Electrónico *
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: cliente@empresa.com"
              className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="reg-modelo"
              className="block text-xs font-bold uppercase text-slate-300 mb-1.5"
            >
              Marca y Modelo *
            </label>
            <input
              id="reg-modelo"
              type="text"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ej: Chevrolet Silverado 2020"
              className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="reg-placa"
              className="block text-xs font-bold uppercase text-slate-300 mb-1.5"
            >
              Placa *
            </label>
            <input
              id="reg-placa"
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              placeholder="Ej: XYZ-987"
              className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 font-mono-tabular uppercase text-sm text-white outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="reg-mecanico"
              className="block text-xs font-bold uppercase text-slate-300 mb-1.5"
            >
              Mecánico Asignado (Mecanico1 a Mecanico4) *
            </label>
            <select
              id="reg-mecanico"
              value={mecanico}
              onChange={(e) => setMecanico(e.target.value as MechanicId)}
              className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm text-white font-semibold outline-none"
            >
              {MECHANIC_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.especialidad})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className="min-h-[52px] px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Registrar Vehículo e Iniciar Diagnóstico</span>
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================ */}
      {/* MONITOR DE FLOTA ACTIVA EN TALLER                            */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide text-white">
            Unidades Activas en Bahías ({vehiculos.length})
          </h2>
          <span className="text-xs text-slate-400">
            Sincronización en vivo con Bahías de Mecánicos y Portal del Cliente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Placa / Unidad</th>
                <th className="py-3 px-4">Cliente & Contacto Dual</th>
                <th className="py-3 px-4">Mecánico</th>
                <th className="py-3 px-4">Estado Actual</th>
                <th className="py-3 px-4 text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {vehiculos.map((v) => (
                <tr key={v.id} className="hover:bg-slate-950/60">
                  <td className="py-3.5 px-4">
                    <div className="font-mono-tabular font-black text-amber-400">{v.placa}</div>
                    <div className="text-xs text-slate-300">{v.modelo}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{v.cliente}</div>
                    <div className="text-xs text-slate-400 font-mono-tabular">
                      WA: {v.telefono} · {v.email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono-tabular text-xs font-bold text-slate-300">
                    {v.mecanico}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-xs text-slate-100">{v.estado}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onInspectInMecanico(v.mecanico)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ir a Bahía</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onInspectInCliente(v.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Portal Cliente</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABLA DE AUDITORÍA INMUTABLE DE APROBACIONES (CA-05)         */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide text-white">
                Libro Mayor de Auditoría Digital Inmutable (CA-05)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada aprobación o rechazo queda sellado con ID único, fecha/hora exacta, firma digital y monto bloqueado contra edición (Object.freeze).
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              aria-label="Filtrar registros de auditoría por placa, cliente o comprobante"
              placeholder="Buscar placa, cliente o ID..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table data-testid="immutable-audit-table" className="w-full text-left text-sm">
            <thead className="border-y border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Comprobante ID</th>
                <th className="py-3 px-4">Fecha / Hora Exacta</th>
                <th className="py-3 px-4">Placa / Vehículo</th>
                <th className="py-3 px-4">Tipo de Registro</th>
                <th className="py-3 px-4 text-right">Monto Bloqueado</th>
                <th className="py-3 px-4">Firma Digital</th>
                <th className="py-3 px-4">Resolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredAuditoria.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No se encontraron comprobantes digitales que coincidan con el filtro.
                  </td>
                </tr>
              ) : (
                filteredAuditoria.map((item) => (
                  <tr key={item.comprobanteId} className="hover:bg-slate-950/60">
                    <td className="py-3.5 px-4 font-mono-tabular text-xs font-black text-amber-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        {item.comprobanteId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-xs text-slate-300 whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono-tabular font-bold text-white">{item.placa}</div>
                      <div className="text-xs text-slate-400">
                        {item.modelo} · {item.cliente}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-200 whitespace-nowrap">
                      {item.tipo}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-black text-white whitespace-nowrap">
                      ${item.monto.toFixed(2)} USD
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-xs text-emerald-300">
                      {item.firma}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-extrabold uppercase ${
                          item.decision === 'APROBADO' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {item.decision === 'APROBADO' ? '✓ APROBADO' : '✕ RECHAZADO'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
