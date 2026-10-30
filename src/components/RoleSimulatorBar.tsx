import React from 'react';
import { RoleType } from '../types/workshop';
import { HardHat, Smartphone, ShieldCheck, RotateCcw, Download } from 'lucide-react';

interface RoleSimulatorBarProps {
  activeRole: RoleType;
  onSelectRole: (role: RoleType) => void;
  pendingClientCount: number;
  unreadWorkshopAlerts: number;
  onResetDemo: () => void;
  onExportHtml: () => void;
}

export const RoleSimulatorBar: React.FC<RoleSimulatorBarProps> = ({
  activeRole,
  onSelectRole,
  pendingClientCount,
  unreadWorkshopAlerts,
  onResetDemo,
  onExportHtml,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-display text-2xl font-extrabold tracking-wide text-white whitespace-nowrap">
            TALLER DON RAMIRO
          </span>
        </div>

        {/* Zone 2: Role Simulator Switcher */}
        <nav
          aria-label="Simulador de Roles"
          className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto max-w-full"
        >
          <button
            type="button"
            onClick={() => onSelectRole('mecanico')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeRole === 'mecanico'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <HardHat className="w-4 h-4 shrink-0" />
            <span>👷 Vista Mecánico</span>
            {unreadWorkshopAlerts > 0 && (
              <span className="ml-1 font-mono-tabular text-xs font-extrabold underline">
                ({unreadWorkshopAlerts})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectRole('cliente')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeRole === 'cliente'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>📱 Vista Cliente</span>
            {pendingClientCount > 0 && (
              <span className="ml-1 font-mono-tabular text-xs font-extrabold underline">
                ({pendingClientCount} pend.)
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectRole('ramiro')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeRole === 'ramiro'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>👨‍💼 Vista Don Ramiro</span>
            {unreadWorkshopAlerts > 0 && (
              <span className="ml-1 font-mono-tabular text-xs font-extrabold underline">
                ({unreadWorkshopAlerts})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Utility Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportHtml}
            title="Descargar aplicación en un único archivo HTML5 independiente"
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar HTML5</span>
          </button>
          <button
            type="button"
            onClick={onResetDemo}
            title="Restaurar estado inicial de demostración"
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
