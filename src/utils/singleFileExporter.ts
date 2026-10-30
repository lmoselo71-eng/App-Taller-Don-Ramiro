import { WorkshopState } from '../types/workshop';

export function downloadSingleFileHtml(currentState: WorkshopState): void {
  const serializedState = JSON.stringify(currentState, null, 2);

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Taller Don Ramiro — Sistema Operativo y Aprobación Bilateral (Single-File HTML5)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <header class="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
      <div class="font-extrabold text-lg tracking-tight text-white">Taller Don Ramiro · Control Bilateral</div>
      <div class="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button onclick="switchRole('mecanico')" id="tab-mecanico" class="px-4 py-2 rounded-lg text-sm font-bold transition">👷 Vista Mecánico</button>
        <button onclick="switchRole('cliente')" id="tab-cliente" class="px-4 py-2 rounded-lg text-sm font-bold transition">📱 Vista Cliente</button>
        <button onclick="switchRole('ramiro')" id="tab-ramiro" class="px-4 py-2 rounded-lg text-sm font-bold transition">👨‍💼 Vista Don Ramiro</button>
      </div>
    </div>
  </header>
  <main id="app-container" class="max-w-7xl mx-auto p-4 sm:p-6"></main>
  <script>
    const STORAGE_KEY = 'taller_don_ramiro_state_v1';
    let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || ${serializedState};
    let activeRole = 'mecanico';
    let activeMecanico = 'Mecanico1';
    let selectedClientVehicleId = state.vehiculos[0]?.id || '';

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      render();
    }

    function switchRole(role) {
      activeRole = role;
      render();
    }

    function render() {
      ['mecanico', 'cliente', 'ramiro'].forEach(r => {
        const btn = document.getElementById('tab-' + r);
        if (btn) {
          btn.className = r === activeRole
            ? 'px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 text-slate-950 shadow'
            : 'px-4 py-2 rounded-lg text-sm font-bold text-slate-300 hover:text-white';
        }
      });
      const root = document.getElementById('app-container');
      if (activeRole === 'mecanico') root.innerHTML = renderMecanico();
      if (activeRole === 'cliente') root.innerHTML = renderCliente();
      if (activeRole === 'ramiro') root.innerHTML = renderRamiro();
    }

    function renderMecanico() {
      const autos = state.vehiculos.filter(v => v.mecanico === activeMecanico);
      return '<div class="space-y-6">' +
        '<div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">' +
        '<h1 class="text-xl font-black text-white">Panel Operativo Manos Sucias (' + activeMecanico + ')</h1>' +
        '<select onchange="activeMecanico=this.value;render()" class="bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-lg font-bold">' +
        ['Mecanico1','Mecanico2','Mecanico3','Mecanico4'].map(m => '<option value="'+m+'" '+(m===activeMecanico?'selected':'')+'>'+m+'</option>').join('') +
        '</select></div>' +
        '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">' +
        autos.map(v => '<div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">' +
          '<div class="flex justify-between items-center"><span class="font-mono text-amber-400 font-bold">' + v.placa + ' · ' + v.modelo + '</span><span class="text-sm font-bold">' + v.estado + '</span></div>' +
          '<p class="text-sm text-slate-400">Cliente: ' + v.cliente + ' · WhatsApp: ' + v.telefono + ' · Email: ' + v.email + '</p>' +
        '</div>').join('') +
        '</div></div>';
    }

    function renderCliente() {
      return '<div class="bg-slate-900 border border-slate-800 rounded-xl p-6"><h2 class="text-xl font-bold mb-4">Portal de Autorización Digital del Cliente</h2><p class="text-slate-300 text-sm">Estado sincronizado en LocalStorage con ' + state.vehiculos.length + ' unidades y ' + state.auditoria.length + ' comprobantes inmutables.</p></div>';
    }

    function renderRamiro() {
      return '<div class="bg-slate-900 border border-slate-800 rounded-xl p-6"><h2 class="text-xl font-bold mb-4">Auditoría Inmutable de Don Ramiro (' + state.auditoria.length + ' registros)</h2></div>';
    }

    render();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'taller-don-ramiro-singlefile.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
