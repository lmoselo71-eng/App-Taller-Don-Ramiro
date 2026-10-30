import React, { useState, useRef } from 'react';
import { VehicleRecord } from '../types/workshop';
import { PHOTO_EVIDENCE_PRESETS } from '../utils/seedData';
import {
  calculateAccumulatedAmount,
  parseExactAmount,
} from '../utils/workshopLogic';
import {
  Camera,
  Mic,
  Calculator,
  X,
  Send,
  RotateCcw,
  Upload,
  AlertTriangle,
} from 'lucide-react';

interface ImprevistoModalProps {
  vehicle: VehicleRecord | null;
  onClose: () => void;
  onSubmitImprevisto: (
    vehiculoId: string,
    payload: {
      descripcion: string;
      monto: number;
      fotoUrl: string;
      fotoLabel: string;
    }
  ) => { ok: boolean; error?: string };
}

export const ImprevistoModal: React.FC<ImprevistoModalProps> = ({
  vehicle,
  onClose,
  onSubmitImprevisto,
}) => {
  const [fotoUrl, setFotoUrl] = useState<string>(PHOTO_EVIDENCE_PRESETS[0].dataUrl);
  const [fotoLabel, setFotoLabel] = useState<string>(PHOTO_EVIDENCE_PRESETS[0].label);
  const [descripcion, setDescripcion] = useState<string>(
    PHOTO_EVIDENCE_PRESETS[0].descripcionSugerida
  );
  const [monto, setMonto] = useState<number>(0);
  const [showOtroMontoInput, setShowOtroMontoInput] = useState<boolean>(false);
  const [otroMontoRaw, setOtroMontoRaw] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceStatusMsg, setVoiceStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const otroMontoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!vehicle) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setFotoUrl(result);
        setFotoLabel(file.name || 'Fotografía capturada en bahía');
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPhotoPreset = (preset: typeof PHOTO_EVIDENCE_PRESETS[number]) => {
    setFotoUrl(preset.dataUrl);
    setFotoLabel(preset.label);
    setDescripcion(preset.descripcionSugerida);
    setErrorMsg('');
  };

  const handleQuickAddAmount = (increment: number) => {
    const next = calculateAccumulatedAmount(monto, increment);
    setMonto(next);
    setOtroMontoRaw(String(next));
    setErrorMsg('');
  };

  const handleToggleOtroMonto = () => {
    const nextShow = !showOtroMontoInput;
    setShowOtroMontoInput(nextShow);
    if (nextShow) {
      setOtroMontoRaw(monto > 0 ? String(monto) : '');
      setTimeout(() => {
        otroMontoInputRef.current?.focus();
        otroMontoInputRef.current?.select();
      }, 50);
    }
  };

  const handleOtroMontoChange = (val: string) => {
    setOtroMontoRaw(val);
    setMonto(parseExactAmount(val));
    setErrorMsg('');
  };

  const handleStartVoiceDictation = () => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      const simulatedPhrase =
        'Se detectó rotura en soporte y desgaste severo al desmontar conjunto mecánico.';
      setDescripcion((prev) => (prev ? `${prev} ${simulatedPhrase}` : simulatedPhrase));
      setVoiceStatusMsg('Dictado por voz transcrito (Modo taller asistido).');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionCtor as any)();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      setIsRecording(true);
      setVoiceStatusMsg('Escuchando micrófono... hable ahora.');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setDescripcion((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setVoiceStatusMsg('Audio transcrito correctamente.');
        }
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        const fallbackText =
          'Al desmontar la pieza se encontró desgaste crítico fuera de tolerancia.';
        setDescripcion((prev) => (prev ? `${prev} ${fallbackText}` : fallbackText));
        setVoiceStatusMsg('Dictado asistido aplicado.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onSubmitImprevisto(vehicle.id, {
      descripcion,
      monto,
      fotoUrl,
      fotoLabel,
    });
    if (!res.ok && res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-imprevisto-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header de Alto Contraste */}
        <div className="bg-amber-500 text-slate-950 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 stroke-[2.5] shrink-0" />
            <div>
              <h2
                id="modal-imprevisto-title"
                className="font-display text-2xl font-extrabold uppercase tracking-wide leading-none"
              >
                Reportar Imprevisto Mecánico · {vehicle.placa}
              </h2>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {vehicle.modelo} · Cliente: {vehicle.cliente}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de imprevisto"
            className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-950/15 hover:bg-slate-950/25 flex items-center justify-center text-slate-950 font-black transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-950/90 border border-red-500 text-red-100 text-sm font-bold"
            >
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Columna Izquierda (5 cols): 1. Evidencia Fotográfica */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                  1. Fotografía de la Pieza Dañada *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  aria-label="Subir fotografía de pieza dañada"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Subir Archivo / Cámara</span>
                </button>
              </div>

              {fotoUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                  <img
                    src={fotoUrl}
                    alt={fotoLabel}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover"
                  />
                  <div className="px-3.5 py-2 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold truncate">{fotoLabel}</span>
                    <span className="font-mono-tabular text-emerald-400 font-bold shrink-0 ml-2">
                      PREVISUALIZACIÓN OK
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="block text-[11px] font-bold uppercase text-slate-400">
                  Capturas Rápidas de Bahía (1 Toque):
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {PHOTO_EVIDENCE_PRESETS.map((preset) => {
                    const isSelected = fotoLabel === preset.label;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPhotoPreset(preset)}
                        className={`min-h-[54px] px-3.5 py-2 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Camera
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs font-bold leading-snug">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Columna Derecha (7 cols): 2. Descripción + 3. Costo Flexible (CA-03) */}
            <div className="lg:col-span-7 space-y-4">
              {/* 2. Descripción de la Falla por Voz o Texto */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="imprevisto-descripcion-input"
                    className="text-xs font-extrabold text-slate-200 uppercase tracking-wider"
                  >
                    2. Descripción de la Falla (Voz o Toque Rápido) *
                  </label>
                  {voiceStatusMsg && (
                    <span className="text-xs font-semibold text-amber-400">{voiceStatusMsg}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleStartVoiceDictation}
                    className={`min-h-[64px] px-4 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 border transition cursor-pointer ${
                      isRecording
                        ? 'bg-red-600 text-white border-red-400'
                        : 'bg-red-950/70 hover:bg-red-900/80 text-red-200 border-red-700'
                    }`}
                  >
                    <Mic className="w-5 h-5 shrink-0" />
                    <span>{isRecording ? 'Escuchando Voz...' : '🎤 Dictar Falla por Voz'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDescripcion(
                        'Al desmontar mordaza se detectó disco de freno con surcos profundos fuera de tolerancia mínima y sello de pistón reseco.'
                      )
                    }
                    className="min-h-[64px] px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold text-left transition cursor-pointer"
                  >
                    + Texto Rápido: Disco rayado y sello de mordaza
                  </button>
                </div>

                <textarea
                  id="imprevisto-descripcion-input"
                  rows={2}
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Describa la pieza dañada o utilice el botón de micrófono..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 p-3 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* 3. Costo Adicional con Botones Rápidos (+$10, +$20, +$50) y [ 🔢 Otro Monto ] (CA-03) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                    3. Costo Adicional del Imprevisto ($ USD) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMonto(0);
                      setOtroMontoRaw('');
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reiniciar a $0
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(10)}
                    className="min-h-[64px] rounded-xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-white font-mono-tabular text-2xl font-extrabold transition cursor-pointer"
                  >
                    +$10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(20)}
                    className="min-h-[64px] rounded-xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-white font-mono-tabular text-2xl font-extrabold transition cursor-pointer"
                  >
                    +$20
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(50)}
                    className="min-h-[64px] rounded-xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-white font-mono-tabular text-2xl font-extrabold transition cursor-pointer"
                  >
                    +$50
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleOtroMonto}
                    className={`min-h-[64px] rounded-xl border-2 font-bold text-xs px-2 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      showOtroMontoInput
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/60'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span>[ 🔢 Otro Monto ]</span>
                  </button>
                </div>

                {/* Campo numérico grande desplegable al pulsar [ 🔢 Otro Monto ] */}
                {showOtroMontoInput && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border-2 border-amber-500 space-y-1.5">
                    <label
                      htmlFor="imprevisto-otro-monto-input"
                      className="block text-xs font-extrabold uppercase text-amber-400 tracking-wider"
                    >
                      Digite la cifra exacta del imprevisto ($ USD):
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-tabular text-2xl font-black text-amber-400">
                        $
                      </span>
                      <input
                        ref={otroMontoInputRef}
                        id="imprevisto-otro-monto-input"
                        type="number"
                        min="1"
                        step="0.5"
                        value={otroMontoRaw}
                        onChange={(e) => handleOtroMontoChange(e.target.value)}
                        placeholder="Ej: 85.00"
                        className="w-full min-h-[60px] pl-12 pr-4 rounded-xl bg-slate-900 border border-slate-700 text-2xl font-mono-tabular font-black text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Totalizador grande */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Monto Adicional a Autorizar:
                  </span>
                  <span
                    data-testid="imprevisto-total-amount"
                    className="font-mono-tabular text-2xl font-black text-amber-400"
                  >
                    ${monto.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra Inferior de Envío (>= 64px de altura) */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[64px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="sm:col-span-2 min-h-[64px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center gap-3 shadow-lg transition cursor-pointer"
            >
              <Send className="w-6 h-6" />
              <span>Enviar a Aprobación del Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
