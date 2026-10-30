import {
  ApprovalItemType,
  AuditReceipt,
  BilateralAlert,
  NewVehicleInput,
  ValidationResult,
  VehicleRecord,
  WorkshopContact,
  WorkshopState,
} from '../types/workshop';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /^[0-9]{8,15}$/;

export function normalizePhone(rawPhone: string): string {
  return rawPhone.replace(/[\s\-()+]/g, '').trim();
}

/**
 * CA-01 (Contacto Dual):
 * Valida que existan tanto el teléfono (WhatsApp) como el correo electrónico del cliente,
 * además de nombre, marca/modelo, placa y mecánico asignado.
 */
export function validateVehicleRegistration(input: NewVehicleInput): ValidationResult {
  const cliente = input.cliente.trim();
  const telefono = normalizePhone(input.telefono);
  const email = input.email.trim();
  const modelo = input.modelo.trim();
  const placa = input.placa.trim().toUpperCase();

  if (!cliente) {
    return { valid: false, error: 'El nombre del cliente es obligatorio.' };
  }
  if (!telefono) {
    return { valid: false, error: 'El teléfono (WhatsApp) del cliente es obligatorio (CA-01).' };
  }
  if (!PHONE_DIGITS_REGEX.test(telefono)) {
    return {
      valid: false,
      error: 'El teléfono (WhatsApp) debe contener entre 8 y 15 dígitos numéricos (ej: 584121234567).',
    };
  }
  if (!email) {
    return { valid: false, error: 'El correo electrónico del cliente es obligatorio (CA-01).' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'El formato del correo electrónico no es válido.' };
  }
  if (!modelo) {
    return { valid: false, error: 'La marca y modelo del vehículo son obligatorios.' };
  }
  if (!placa || placa.length < 3) {
    return { valid: false, error: 'La placa del vehículo es obligatoria.' };
  }
  if (!input.mecanico) {
    return { valid: false, error: 'Debe asignar un mecánico responsable.' };
  }

  return { valid: true };
}

export function createVehicleRecord(
  input: NewVehicleInput,
  nowFormatted: string,
  idSuffix?: string
): VehicleRecord {
  const cleanPhone = normalizePhone(input.telefono);
  const cleanPlaca = input.placa.trim().toUpperCase();
  const generatedId = idSuffix ? `VEH-${idSuffix}` : `VEH-${Math.floor(100 + Math.random() * 900)}`;

  return {
    id: generatedId,
    cliente: input.cliente.trim(),
    telefono: cleanPhone,
    email: input.email.trim().toLowerCase(),
    modelo: input.modelo.trim(),
    placa: cleanPlaca,
    mecanico: input.mecanico,
    estado: '🔍 En Diagnóstico',
    fechaIngreso: nowFormatted,
    diagnostico: null,
    imprevistos: [],
  };
}

/**
 * CA-02 (Verificación de Diagnóstico):
 * Registra el diagnóstico y presupuesto inicial y cambia automáticamente el vehículo
 * a "⏸️ Pausado: Esperando Aprobación".
 */
export function submitInitialDiagnostic(
  vehicle: VehicleRecord,
  descripcion: string,
  monto: number,
  nowFormatted: string,
  diagId?: string
): { updatedVehicle?: VehicleRecord; error?: string } {
  const cleanDesc = descripcion.trim();
  if (!cleanDesc) {
    return { error: 'Ingrese o dicte por voz el detalle del diagnóstico mecánico.' };
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: 'Ingrese un monto de presupuesto inicial mayor a $0.' };
  }

  const updatedVehicle: VehicleRecord = {
    ...vehicle,
    estado: '⏸️ Pausado: Esperando Aprobación',
    diagnostico: {
      id: diagId || `DG-${Date.now()}`,
      descripcion: cleanDesc,
      monto: Math.round(monto * 100) / 100,
      resolucion: 'PENDIENTE',
      createdAt: nowFormatted,
    },
  };

  return { updatedVehicle };
}

/**
 * CA-03 (Imprevisto con Monto Flexible):
 * Suma rápida con botones (+$10, +$20, +$50) o valor exacto mediante "[ 🔢 Otro Monto ]".
 */
export function calculateAccumulatedAmount(currentAmount: number, increment: number): number {
  const base = Number.isFinite(currentAmount) && currentAmount > 0 ? currentAmount : 0;
  return Math.round((base + increment) * 100) / 100;
}

export function parseExactAmount(rawInput: string | number): number {
  const parsed = typeof rawInput === 'number' ? rawInput : parseFloat(String(rawInput));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

export interface SubmitImprevistoInput {
  descripcion: string;
  monto: number;
  fotoUrl: string;
  fotoLabel: string;
  nowFormatted: string;
  imprevistoId?: string;
}

/**
 * CA-03: Registra un nuevo imprevisto con fotografía, descripción y costo,
 * cambiando automáticamente el estado del vehículo a "⏸️ Pausado: Esperando Aprobación".
 */
export function submitImprevisto(
  vehicle: VehicleRecord,
  input: SubmitImprevistoInput
): { updatedVehicle?: VehicleRecord; error?: string } {
  const cleanDesc = input.descripcion.trim();
  if (!input.fotoUrl) {
    return { error: 'Adjunte o seleccione una fotografía de la pieza dañada.' };
  }
  if (!cleanDesc) {
    return { error: 'Describa la falla imprevista por voz, botón rápido o texto.' };
  }
  if (!Number.isFinite(input.monto) || input.monto <= 0) {
    return { error: 'Defina un costo adicional mayor a $0 usando los botones rápidos u Otro Monto.' };
  }

  const nuevoImprevisto = {
    id: input.imprevistoId || `IMP-${Date.now()}`,
    descripcion: cleanDesc,
    monto: Math.round(input.monto * 100) / 100,
    fotoUrl: input.fotoUrl,
    fotoLabel: input.fotoLabel || 'Fotografía de pieza averiada',
    resolucion: 'PENDIENTE' as const,
    createdAt: input.nowFormatted,
  };

  const updatedVehicle: VehicleRecord = {
    ...vehicle,
    estado: '⏸️ Pausado: Esperando Aprobación',
    imprevistos: [...vehicle.imprevistos, nuevoImprevisto],
  };

  return { updatedVehicle };
}

export interface ClientDecisionInput {
  vehiculoId: string;
  itemId: string;
  tipo: ApprovalItemType;
  aprobado: boolean;
  aceptoCheckbox: boolean;
  firma: string;
  nowFormatted: string;
  receiptIdOverride?: string;
}

/**
 * CA-04 & CA-05:
 * Procesa la aprobación o rechazo del cliente con firma digital, actualiza el estado del auto
 * de "⏸️ Pausado: Esperando Aprobación" a "🔧 En Reparación", genera un Comprobante Digital
 * Inmutable (Object.freeze) y emite la alerta de retorno hacia el taller.
 */
export function processClientDecision(
  state: WorkshopState,
  input: ClientDecisionInput
): {
  nextState?: WorkshopState;
  receipt?: AuditReceipt;
  alert?: BilateralAlert;
  error?: string;
} {
  const vehicle = state.vehiculos.find((v) => v.id === input.vehiculoId);
  if (!vehicle) {
    return { error: 'Vehículo no encontrado.' };
  }

  const cleanFirma = input.firma.trim();
  if (input.aprobado) {
    if (!input.aceptoCheckbox) {
      return {
        error: 'Debe marcar la casilla "Acepto el presupuesto descrito" para aprobar.',
      };
    }
    if (!cleanFirma || cleanFirma.length < 3) {
      return {
        error:
          'Debe introducir su firma digital (Nombre completo o últimos 4 dígitos de documento/teléfono).',
      };
    }
  }

  const comprobanteId =
    input.receiptIdOverride || `CMP-${Math.floor(100000 + Math.random() * 900000)}`;
  const decisionLabel: 'APROBADO' | 'RECHAZADO' = input.aprobado ? 'APROBADO' : 'RECHAZADO';
  const firmaFinal = cleanFirma || 'SIN_FIRMA_RECHAZO';

  let itemDescripcion = '';
  let itemMonto = 0;
  let updatedDiagnostico = vehicle.diagnostico;
  let updatedImprevistos = vehicle.imprevistos;

  if (input.tipo === 'Diagnóstico Inicial') {
    if (!vehicle.diagnostico || vehicle.diagnostico.id !== input.itemId) {
      return { error: 'Diagnóstico inicial no encontrado.' };
    }
    if (vehicle.diagnostico.resolucion !== 'PENDIENTE') {
      return { error: 'Este presupuesto ya fue procesado anteriormente y está bloqueado.' };
    }
    itemDescripcion = vehicle.diagnostico.descripcion;
    itemMonto = vehicle.diagnostico.monto;
    updatedDiagnostico = {
      ...vehicle.diagnostico,
      resolucion: decisionLabel,
      comprobanteId,
      firma: firmaFinal,
      resolvedAt: input.nowFormatted,
    };
  } else {
    const targetImp = vehicle.imprevistos.find((i) => i.id === input.itemId);
    if (!targetImp) {
      return { error: 'Imprevisto no encontrado.' };
    }
    if (targetImp.resolucion !== 'PENDIENTE') {
      return { error: 'Este imprevisto ya fue procesado anteriormente y está bloqueado.' };
    }
    itemDescripcion = targetImp.descripcion;
    itemMonto = targetImp.monto;
    updatedImprevistos = vehicle.imprevistos.map((imp) =>
      imp.id === input.itemId
        ? {
            ...imp,
            resolucion: decisionLabel,
            comprobanteId,
            firma: firmaFinal,
            resolvedAt: input.nowFormatted,
          }
        : imp
    );
  }

  // Verificar si quedan otros presupuestos pendientes en el mismo vehículo
  const diagStillPending =
    updatedDiagnostico !== null && updatedDiagnostico.resolucion === 'PENDIENTE';
  const impStillPending = updatedImprevistos.some((i) => i.resolucion === 'PENDIENTE');
  const hasAnyPending = diagStillPending || impStillPending;

  let nextEstado = vehicle.estado;
  if (input.aprobado && !hasAnyPending) {
    nextEstado = '🔧 En Reparación';
  } else if (!hasAnyPending && updatedDiagnostico?.resolucion === 'APROBADO') {
    // Si rechazó un imprevisto adicional pero el diagnóstico base estaba aprobado, continúa en reparación
    nextEstado = '🔧 En Reparación';
  }

  const updatedVehicle: VehicleRecord = {
    ...vehicle,
    estado: nextEstado,
    diagnostico: updatedDiagnostico,
    imprevistos: updatedImprevistos,
  };

  // CA-05: Comprobante Digital Inmutable bloqueado contra edición con Object.freeze
  const receipt: AuditReceipt = Object.freeze({
    comprobanteId,
    timestamp: input.nowFormatted,
    vehiculoId: vehicle.id,
    placa: vehicle.placa,
    modelo: vehicle.modelo,
    cliente: vehicle.cliente,
    mecanico: vehicle.mecanico,
    tipo: input.tipo,
    itemId: input.itemId,
    descripcion: itemDescripcion,
    monto: itemMonto,
    firma: firmaFinal,
    decision: decisionLabel,
  });

  const alert: BilateralAlert = {
    id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: input.nowFormatted,
    placa: vehicle.placa,
    modelo: vehicle.modelo,
    cliente: vehicle.cliente,
    mecanico: vehicle.mecanico,
    tipo: input.tipo,
    monto: itemMonto,
    decision: decisionLabel,
    comprobanteId,
    firma: firmaFinal,
    leidoMecanico: false,
    leidoRamiro: false,
  };

  const nextState: WorkshopState = {
    ...state,
    vehiculos: state.vehiculos.map((v) => (v.id === vehicle.id ? updatedVehicle : v)),
    auditoria: [receipt, ...state.auditoria],
    alertasRetorno: [alert, ...state.alertasRetorno],
  };

  return { nextState, receipt, alert };
}

/**
 * Genera enlaces directos wa.me y mailto: desde el taller hacia el cliente (CA-02 y CA-03).
 */
export function buildClientNotificationLinks(
  vehicle: VehicleRecord,
  portalUrl: string
): { whatsappUrl: string; mailtoUrl: string; resumenTexto: string } {
  const pendingDiag =
    vehicle.diagnostico && vehicle.diagnostico.resolucion === 'PENDIENTE'
      ? vehicle.diagnostico
      : null;
  const pendingImp = vehicle.imprevistos.filter((i) => i.resolucion === 'PENDIENTE');

  let tipoLabel = 'Presupuesto de Reparación';
  let detalle = '';
  let montoTotalPendiente = 0;

  if (pendingDiag) {
    tipoLabel = 'Diagnóstico y Presupuesto Inicial';
    detalle = pendingDiag.descripcion;
    montoTotalPendiente += pendingDiag.monto;
  }
  if (pendingImp.length > 0) {
    const lastImp = pendingImp[pendingImp.length - 1];
    tipoLabel = pendingDiag ? 'Diagnóstico + Imprevisto Mecánico' : 'Reporte de Imprevisto Mecánico';
    detalle = lastImp.descripcion;
    montoTotalPendiente += pendingImp.reduce((acc, item) => acc + item.monto, 0);
  }

  const resumenTexto = `Hola ${vehicle.cliente}, le escribimos de Taller Don Ramiro respecto a su ${vehicle.modelo} (Placa: ${vehicle.placa}). Se ha registrado un ${tipoLabel} por $${montoTotalPendiente.toFixed(2)} USD ("${detalle}"). Su vehículo se encuentra en estado ${vehicle.estado}. Revise la evidencia y firme digitalmente aquí: ${portalUrl}`;

  const encodedMsg = encodeURIComponent(resumenTexto);
  const encodedSubject = encodeURIComponent(
    `[Taller Don Ramiro] Autorización Pendiente - ${vehicle.placa} (${vehicle.modelo})`
  );

  return {
    whatsappUrl: `https://wa.me/${normalizePhone(vehicle.telefono)}?text=${encodedMsg}`,
    mailtoUrl: `mailto:${vehicle.email}?subject=${encodedSubject}&body=${encodedMsg}`,
    resumenTexto,
  };
}

/**
 * Genera enlaces de retorno desde el cliente hacia el taller (CA-04).
 */
export function buildWorkshopReturnLinks(
  tallerContacto: WorkshopContact,
  receipt: AuditReceipt
): { whatsappUrl: string; mailtoUrl: string; mensajeRetorno: string } {
  const mensajeRetorno = `Confirmación Cliente - Taller Don Ramiro: He ${receipt.decision} el ${receipt.tipo} del vehículo ${receipt.modelo} (Placa: ${receipt.placa}) por $${receipt.monto.toFixed(2)} USD. Firma Digital: ${receipt.firma}. Comprobante Inmutable ID: ${receipt.comprobanteId} (${receipt.timestamp}).`;

  const encodedMsg = encodeURIComponent(mensajeRetorno);
  const encodedSubject = encodeURIComponent(
    `[Confirmación ${receipt.decision}] ${receipt.placa} - Comprobante ${receipt.comprobanteId}`
  );

  return {
    whatsappUrl: `https://wa.me/${normalizePhone(tallerContacto.telefono)}?text=${encodedMsg}`,
    mailtoUrl: `mailto:${tallerContacto.email}?subject=${encodedSubject}&body=${encodedMsg}`,
    mensajeRetorno,
  };
}
