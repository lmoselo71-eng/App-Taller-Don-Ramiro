import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVehicleRegistration,
  createVehicleRecord,
  submitInitialDiagnostic,
  calculateAccumulatedAmount,
  parseExactAmount,
  submitImprevisto,
  processClientDecision,
  buildClientNotificationLinks,
  buildWorkshopReturnLinks,
} from './workshopLogic';
import { INITIAL_WORKSHOP_STATE } from './seedData';

test('CA-01 (Contacto Dual): rechaza registro si falta teléfono o correo electrónico', () => {
  const missingPhone = validateVehicleRegistration({
    cliente: 'Pedro Pérez',
    telefono: '',
    email: 'pedro@correo.com',
    modelo: 'Nissan Frontier 2020',
    placa: 'BB123CC',
    mecanico: 'Mecanico1',
  });
  assert.equal(missingPhone.valid, false);

  const missingEmail = validateVehicleRegistration({
    cliente: 'Pedro Pérez',
    telefono: '584121234567',
    email: '',
    modelo: 'Nissan Frontier 2020',
    placa: 'BB123CC',
    mecanico: 'Mecanico1',
  });
  assert.equal(missingEmail.valid, false);

  const validBoth = validateVehicleRegistration({
    cliente: 'Pedro Pérez',
    telefono: '584121234567',
    email: 'pedro@correo.com',
    modelo: 'Nissan Frontier 2020',
    placa: 'BB123CC',
    mecanico: 'Mecanico1',
  });
  assert.equal(validBoth.valid, true);
});

test('CA-02 (Verificación de Diagnóstico): pasa de En Diagnóstico a Pausado y genera enlaces WhatsApp y Correo', () => {
  const vehicle = createVehicleRecord(
    {
      cliente: 'Ana Gómez',
      telefono: '584149998877',
      email: 'ana@empresa.com',
      modelo: 'Mazda 3 2019',
      placa: 'MZ300K',
      mecanico: 'Mecanico2',
    },
    '30/10/2026, 10:00:00',
    '500'
  );
  assert.equal(vehicle.estado, '🔍 En Diagnóstico');

  const result = submitInitialDiagnostic(
    vehicle,
    'Falla en bobina de encendido cilindro 1 y cambio de bujías',
    145,
    '30/10/2026, 10:15:00',
    'DG-TEST'
  );
  assert.ok(result.updatedVehicle);
  assert.equal(result.updatedVehicle.estado, '⏸️ Pausado: Esperando Aprobación');
  assert.equal(result.updatedVehicle.diagnostico?.monto, 145);

  const links = buildClientNotificationLinks(result.updatedVehicle, 'https://taller.local');
  assert.ok(links.whatsappUrl.startsWith('https://wa.me/584149998877?text='));
  assert.ok(links.mailtoUrl.startsWith('mailto:ana@empresa.com?subject='));
});

test('CA-03 (Imprevisto con Monto Flexible): suma botones rápidos (+$10, +$20, +$50) y acepta monto exacto', () => {
  let amount = 0;
  amount = calculateAccumulatedAmount(amount, 10);
  assert.equal(amount, 10);
  amount = calculateAccumulatedAmount(amount, 20);
  assert.equal(amount, 30);
  amount = calculateAccumulatedAmount(amount, 50);
  assert.equal(amount, 80);

  const exact = parseExactAmount('137.50');
  assert.equal(exact, 137.5);

  const baseVehicle = INITIAL_WORKSHOP_STATE.vehiculos[2]; // En Reparación
  const impResult = submitImprevisto(baseVehicle, {
    descripcion: 'Polea tensora auxiliar con rodamiento trabado',
    monto: exact,
    fotoUrl: 'data:image/svg+xml;utf8,<svg></svg>',
    fotoLabel: 'Polea dañada',
    nowFormatted: '30/10/2026, 10:20:00',
    imprevistoId: 'IMP-TEST',
  });
  assert.ok(impResult.updatedVehicle);
  assert.equal(impResult.updatedVehicle.estado, '⏸️ Pausado: Esperando Aprobación');
  assert.equal(impResult.updatedVehicle.imprevistos.length, 1);
  assert.equal(impResult.updatedVehicle.imprevistos[0].monto, 137.5);
});

test('CA-04 & CA-05 (Transición a En Reparación, Retorno al Taller y Registro Inmutable)', () => {
  // VEH-102 tiene IMP-7001 pendiente
  const failNoCheck = processClientDecision(INITIAL_WORKSHOP_STATE, {
    vehiculoId: 'VEH-102',
    itemId: 'IMP-7001',
    tipo: 'Imprevisto',
    aprobado: true,
    aceptoCheckbox: false,
    firma: 'Mariana Quintero',
    nowFormatted: '30/10/2026, 10:30:00',
  });
  assert.ok(failNoCheck.error);

  const successApproval = processClientDecision(INITIAL_WORKSHOP_STATE, {
    vehiculoId: 'VEH-102',
    itemId: 'IMP-7001',
    tipo: 'Imprevisto',
    aprobado: true,
    aceptoCheckbox: true,
    firma: 'Mariana Quintero',
    nowFormatted: '30/10/2026, 10:30:00',
    receiptIdOverride: 'CMP-999888',
  });

  assert.ok(successApproval.nextState);
  assert.ok(successApproval.receipt);
  assert.ok(successApproval.alert);

  const updatedVeh = successApproval.nextState.vehiculos.find((v) => v.id === 'VEH-102');
  assert.equal(updatedVeh?.estado, '🔧 En Reparación');
  assert.equal(successApproval.receipt.comprobanteId, 'CMP-999888');
  assert.equal(successApproval.receipt.monto, 70);
  assert.equal(Object.isFrozen(successApproval.receipt), true);

  const returnLinks = buildWorkshopReturnLinks(
    INITIAL_WORKSHOP_STATE.tallerContacto,
    successApproval.receipt
  );
  assert.ok(returnLinks.whatsappUrl.includes('CMP-999888'));
  assert.ok(returnLinks.mailtoUrl.includes('CMP-999888'));
});
