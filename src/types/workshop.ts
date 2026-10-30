export type RoleType = 'mecanico' | 'cliente' | 'ramiro';

export type MechanicId = 'Mecanico1' | 'Mecanico2' | 'Mecanico3' | 'Mecanico4';

export type VehicleStatus =
  | '🔍 En Diagnóstico'
  | '⏸️ Pausado: Esperando Aprobación'
  | '🔧 En Reparación';

export type ResolutionState = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export type ApprovalItemType = 'Diagnóstico Inicial' | 'Imprevisto';

export interface DiagnosticRecord {
  id: string;
  descripcion: string;
  monto: number;
  resolucion: ResolutionState;
  createdAt: string;
  comprobanteId?: string;
  firma?: string;
  resolvedAt?: string;
}

export interface ImprevistoRecord {
  id: string;
  descripcion: string;
  monto: number;
  fotoUrl: string;
  fotoLabel: string;
  resolucion: ResolutionState;
  createdAt: string;
  comprobanteId?: string;
  firma?: string;
  resolvedAt?: string;
}

export interface VehicleRecord {
  id: string;
  cliente: string;
  telefono: string;
  email: string;
  modelo: string;
  placa: string;
  mecanico: MechanicId;
  estado: VehicleStatus;
  fechaIngreso: string;
  diagnostico: DiagnosticRecord | null;
  imprevistos: ImprevistoRecord[];
}

export interface AuditReceipt {
  readonly comprobanteId: string;
  readonly timestamp: string;
  readonly vehiculoId: string;
  readonly placa: string;
  readonly modelo: string;
  readonly cliente: string;
  readonly mecanico: MechanicId;
  readonly tipo: ApprovalItemType;
  readonly itemId: string;
  readonly descripcion: string;
  readonly monto: number;
  readonly firma: string;
  readonly decision: 'APROBADO' | 'RECHAZADO';
}

export interface BilateralAlert {
  id: string;
  timestamp: string;
  placa: string;
  modelo: string;
  cliente: string;
  mecanico: MechanicId;
  tipo: ApprovalItemType;
  monto: number;
  decision: 'APROBADO' | 'RECHAZADO';
  comprobanteId: string;
  firma: string;
  leidoMecanico: boolean;
  leidoRamiro: boolean;
}

export interface WorkshopContact {
  nombre: string;
  telefono: string;
  email: string;
}

export interface WorkshopState {
  tallerContacto: WorkshopContact;
  vehiculos: VehicleRecord[];
  auditoria: AuditReceipt[];
  alertasRetorno: BilateralAlert[];
}

export interface NewVehicleInput {
  cliente: string;
  telefono: string;
  email: string;
  modelo: string;
  placa: string;
  mecanico: MechanicId;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
