import { WorkshopState, MechanicId } from '../types/workshop';

export interface MechanicOption {
  id: MechanicId;
  nombre: string;
  especialidad: string;
  bahia: string;
}

export const MECHANIC_OPTIONS: MechanicOption[] = [
  { id: 'Mecanico1', nombre: 'Mecánico 1 · Carlos Méndez', especialidad: 'Frenos, Tren Delantero y Suspensión', bahia: 'Bahía 01' },
  { id: 'Mecanico2', nombre: 'Mecánico 2 · Héctor Vargas', especialidad: 'Motor, Distribución e Inyección', bahia: 'Bahía 02' },
  { id: 'Mecanico3', nombre: 'Mecánico 3 · Jorge Castillo', especialidad: 'Transmisión y Embrague', bahia: 'Bahía 03' },
  { id: 'Mecanico4', nombre: 'Mecánico 4 · Luis Morales', especialidad: 'Diagnóstico Electrónico y Eléctrico', bahia: 'Bahía 04' },
];

export interface QuickFaultPreset {
  id: string;
  categoria: string;
  tituloCorto: string;
  descripcionCompleta: string;
  montoSugerido: number;
}

export const QUICK_DIAGNOSTIC_PRESETS: QuickFaultPreset[] = [
  {
    id: 'qf-frenos',
    categoria: 'Frenos',
    tituloCorto: 'Pastillas + Rectificación Discos',
    descripcionCompleta: 'Desgaste severo en pastillas delanteras al 10% de vida útil y alabeo en discos ventilados. Requiere reemplazo de juego de pastillas cerámicas y rectificación en torno.',
    montoSugerido: 115,
  },
  {
    id: 'qf-distribucion',
    categoria: 'Motor',
    tituloCorto: 'Kit Correa Distribución + Tensor',
    descripcionCompleta: 'Correa de distribución presenta microfisuras por fatiga térmica y rodamiento tensor con ruido metálico. Se requiere cambio de kit completo preventivo.',
    montoSugerido: 210,
  },
  {
    id: 'qf-suspension',
    categoria: 'Suspensión',
    tituloCorto: 'Amortiguadores + Bieletas Delanteras',
    descripcionCompleta: 'Fuga hidráulica activa en amortiguador delantero derecho y holgura en bieletas de barra estabilizadora. Requiere par de amortiguadores y alineación.',
    montoSugerido: 185,
  },
  {
    id: 'qf-inyeccion',
    categoria: 'Inyección',
    tituloCorto: 'Limpieza Ultrasonido Inyectores + Bujías',
    descripcionCompleta: 'Fallo de encendido en cilindros 2 y 4 (código P0302). Requiere limpieza de inyectores por ultrasonido, cambio de microfiltros y juego de 4 bujías Iridium.',
    montoSugerido: 95,
  },
];

export interface EvidencePhotoPreset {
  id: string;
  label: string;
  descripcionSugerida: string;
  montoSugerido: number;
  dataUrl: string;
}

const svgToDataUrl = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

export const PHOTO_EVIDENCE_PRESETS: EvidencePhotoPreset[] = [
  {
    id: 'ev-disco',
    label: 'Disco de Freno Rayado / Cristalizado',
    descripcionSugerida: 'Al desmontar mordaza se detectó disco de freno delantero con surcos profundos fuera de tolerancia mínima (19.2mm) y sello de pistón reseco.',
    montoSugerido: 70,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" height="420">
        <defs>
          <radialGradient id="disc" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="38%" stop-color="#475569"/>
            <stop offset="68%" stop-color="#94a3b8"/>
            <stop offset="92%" stop-color="#64748b"/>
            <stop offset="100%" stop-color="#334155"/>
          </radialGradient>
        </defs>
        <rect width="640" height="420" fill="#090d16"/>
        <grid stroke="#1e293b" stroke-width="1"/>
        <circle cx="300" cy="210" r="165" fill="url(#disc)" stroke="#475569" stroke-width="6"/>
        <circle cx="300" cy="210" r="138" fill="none" stroke="#b45309" stroke-width="3" stroke-dasharray="14 6"/>
        <circle cx="300" cy="210" r="118" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="22 8"/>
        <circle cx="300" cy="210" r="78" fill="#1e293b" stroke="#64748b" stroke-width="5"/>
        <circle cx="300" cy="210" r="34" fill="#090d16" stroke="#475569" stroke-width="4"/>
        <circle cx="300" cy="155" r="8" fill="#090d16"/>
        <circle cx="352" cy="192" r="8" fill="#090d16"/>
        <circle cx="332" cy="254" r="8" fill="#090d16"/>
        <circle cx="268" cy="254" r="8" fill="#090d16"/>
        <circle cx="248" cy="192" r="8" fill="#090d16"/>
        <path d="M 380 85 Q 465 145 450 255 L 395 245 Q 405 160 350 115 Z" fill="#d97706" stroke="#f59e0b" stroke-width="3"/>
        <rect x="24" y="24" width="250" height="54" rx="6" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="38" y="47" fill="#f59e0b" font-family="monospace" font-size="13" font-weight="bold">EVIDENCIA DE BAHÍA · FRENOS</text>
        <text x="38" y="66" fill="#e2e8f0" font-family="sans-serif" font-size="12">Surco térmico en rotor (Espesor: 19.2mm)</text>
      </svg>
    `),
  },
  {
    id: 'ev-bomba-agua',
    label: 'Fuga en Bomba de Agua y Empaque',
    descripcionSugerida: 'Al retirar tapa de distribución se evidenció sulfatación y pérdida de refrigerante por el sello mecánico de la bomba de agua.',
    montoSugerido: 80,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" height="420">
        <rect width="640" height="420" fill="#090d16"/>
        <rect x="140" y="75" width="360" height="270" rx="28" fill="#1e293b" stroke="#475569" stroke-width="4"/>
        <circle cx="320" cy="210" r="96" fill="#334155" stroke="#94a3b8" stroke-width="5"/>
        <circle cx="320" cy="210" r="42" fill="#0f172a" stroke="#64748b" stroke-width="4"/>
        <path d="M 320 252 Q 345 305 315 340 Q 290 315 320 252 Z" fill="#10b981" opacity="0.85"/>
        <circle cx="318" cy="355" r="10" fill="#10b981"/>
        <circle cx="342" cy="330" r="6" fill="#34d399"/>
        <rect x="24" y="24" width="285" height="54" rx="6" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
        <text x="38" y="47" fill="#34d399" font-family="monospace" font-size="13" font-weight="bold">EVIDENCIA DE BAHÍA · REFRIGERACIÓN</text>
        <text x="38" y="66" fill="#e2e8f0" font-family="sans-serif" font-size="12">Fuga activa en sello de bomba de agua</text>
      </svg>
    `),
  },
  {
    id: 'ev-buje-meseta',
    label: 'Buje de Meseta Roto / Caucho Desprendido',
    descripcionSugerida: 'Durante el desmontaje del tren delantero se encontró el buje hidráulico de la meseta inferior totalmente fisurado con juego axial.',
    montoSugerido: 50,
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" height="420">
        <rect width="640" height="420" fill="#090d16"/>
        <path d="M 130 280 L 290 120 L 490 260 L 430 320 L 290 215 L 185 325 Z" fill="#334155" stroke="#64748b" stroke-width="4"/>
        <circle cx="290" cy="175" r="58" fill="#0f172a" stroke="#94a3b8" stroke-width="8"/>
        <circle cx="290" cy="175" r="24" fill="#475569" stroke="#cbd5e1" stroke-width="4"/>
        <path d="M 248 152 L 268 168 M 312 185 L 336 202 M 275 212 L 285 230" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
        <rect x="24" y="24" width="275" height="54" rx="6" fill="#0f172a" stroke="#ef4444" stroke-width="1.5"/>
        <text x="38" y="47" fill="#f87171" font-family="monospace" font-size="13" font-weight="bold">EVIDENCIA DE BAHÍA · SUSPENSIÓN</text>
        <text x="38" y="66" fill="#e2e8f0" font-family="sans-serif" font-size="12">Fisura radial en buje de meseta inferior</text>
      </svg>
    `),
  },
];

export const INITIAL_WORKSHOP_STATE: WorkshopState = {
  tallerContacto: {
    nombre: 'Taller Mecánico Don Ramiro',
    telefono: '584129901122',
    email: 'recepcion@tallerdonramiro.com',
  },
  vehiculos: [
    {
      id: 'VEH-101',
      cliente: 'Alberto Mendoza',
      telefono: '584145551234',
      email: 'alberto.mendoza@empresa.com',
      modelo: 'Ford Explorer XLT 2019',
      placa: 'AA882XX',
      mecanico: 'Mecanico1',
      estado: '🔍 En Diagnóstico',
      fechaIngreso: '30/10/2026, 08:15:00',
      diagnostico: null,
      imprevistos: [],
    },
    {
      id: 'VEH-102',
      cliente: 'Mariana Quintero',
      telefono: '584127778899',
      email: 'm.quintero@logistica.com',
      modelo: 'Toyota Hilux 2.7 2021',
      placa: 'AB450TR',
      mecanico: 'Mecanico1',
      estado: '⏸️ Pausado: Esperando Aprobación',
      fechaIngreso: '30/10/2026, 08:40:00',
      diagnostico: {
        id: 'DG-9001',
        descripcion: 'Reemplazo de pastillas de freno delanteras cerámicas, mantenimiento de pines deslizantes y purga de líquido DOT-4.',
        monto: 120,
        resolucion: 'APROBADO',
        createdAt: '30/10/2026, 09:05:00',
        comprobanteId: 'CMP-482910',
        firma: 'Mariana Quintero',
        resolvedAt: '30/10/2026, 09:18:22',
      },
      imprevistos: [
        {
          id: 'IMP-7001',
          descripcion: 'Al desmontar mordaza se detectó disco de freno delantero con surcos profundos fuera de tolerancia mínima (19.2mm) y sello de pistón reseco.',
          monto: 70,
          fotoUrl: PHOTO_EVIDENCE_PRESETS[0].dataUrl,
          fotoLabel: PHOTO_EVIDENCE_PRESETS[0].label,
          resolucion: 'PENDIENTE',
          createdAt: '30/10/2026, 09:50:10',
        },
      ],
    },
    {
      id: 'VEH-103',
      cliente: 'Esteban Domínguez',
      telefono: '584243334455',
      email: 'esteban.dominguez@correo.com',
      modelo: 'Chevrolet Cruze 1.8 2018',
      placa: 'AC912MK',
      mecanico: 'Mecanico2',
      estado: '🔧 En Reparación',
      fechaIngreso: '30/10/2026, 07:50:00',
      diagnostico: {
        id: 'DG-9002',
        descripcion: 'Cambio de kit de correa de distribución, tensor hidráulico y reemplazo de refrigerante orgánico.',
        monto: 210,
        resolucion: 'APROBADO',
        createdAt: '30/10/2026, 08:20:00',
        comprobanteId: 'CMP-319044',
        firma: '4455',
        resolvedAt: '30/10/2026, 08:35:14',
      },
      imprevistos: [],
    },
  ],
  auditoria: [
    Object.freeze({
      comprobanteId: 'CMP-482910',
      timestamp: '30/10/2026, 09:18:22',
      vehiculoId: 'VEH-102',
      placa: 'AB450TR',
      modelo: 'Toyota Hilux 2.7 2021',
      cliente: 'Mariana Quintero',
      mecanico: 'Mecanico1',
      tipo: 'Diagnóstico Inicial',
      itemId: 'DG-9001',
      descripcion: 'Reemplazo de pastillas de freno delanteras cerámicas, mantenimiento de pines deslizantes y purga de líquido DOT-4.',
      monto: 120,
      firma: 'Mariana Quintero',
      decision: 'APROBADO',
    }),
    Object.freeze({
      comprobanteId: 'CMP-319044',
      timestamp: '30/10/2026, 08:35:14',
      vehiculoId: 'VEH-103',
      placa: 'AC912MK',
      modelo: 'Chevrolet Cruze 1.8 2018',
      cliente: 'Esteban Domínguez',
      mecanico: 'Mecanico2',
      tipo: 'Diagnóstico Inicial',
      itemId: 'DG-9002',
      descripcion: 'Cambio de kit de correa de distribución, tensor hidráulico y reemplazo de refrigerante orgánico.',
      monto: 210,
      firma: '4455',
      decision: 'APROBADO',
    }),
  ],
  alertasRetorno: [
    {
      id: 'ALT-1001',
      timestamp: '30/10/2026, 09:18:22',
      placa: 'AB450TR',
      modelo: 'Toyota Hilux 2.7 2021',
      cliente: 'Mariana Quintero',
      mecanico: 'Mecanico1',
      tipo: 'Diagnóstico Inicial',
      monto: 120,
      decision: 'APROBADO',
      comprobanteId: 'CMP-482910',
      firma: 'Mariana Quintero',
      leidoMecanico: false,
      leidoRamiro: false,
    },
  ],
};
