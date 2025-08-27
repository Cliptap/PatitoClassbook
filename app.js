"use strict";

// ---------- Utilidades ----------
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const todayISO = () => new Date().toISOString().slice(0,10);
const keyFor   = (sala, fecha) => `asistencia:${sala}:${fecha}`;
const Estado   = { P:'P', A:'A', T:'T', J:'J' };

// ---------- Estado ----------
let base = { salas: [], alumnos: [] };
let vista = { sala: null, fecha: todayISO() };

const almacen = {
  load(sala, fecha){
    const raw = localStorage.getItem(keyFor(sala, fecha));
    return raw ? JSON.parse(raw) : null;
  },
  save(sala, fecha, data){
    localStorage.setItem(keyFor(sala, fecha), JSON.stringify(data));
    setSaved(true);
  }
};

function setSaved(ok){
  const el = $('#estadoGuardado');
  el.textContent = ok ? '● Guardado' : '● Guardando…';
  el.classList.toggle('text-warning', !ok);
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', init);

async function init(){
  $('#fechaInput').value = vista.fecha;

  // Cargar catálogo inicial
  try { base = await (await fetch('alumnos.json')).json(); }
  catch { base = { salas:['Sala única'], alumnos:[] }; }

  poblarSalas(base.salas);
  vista.sala = base.salas[0] || 'Sala';
  $('#salaSelect').value = vista.sala;

  renderTodo();

  // Eventos UI
  $('#salaSelect').addEventListener('change', () => { vista.sala = $('#salaSelect').value; renderTodo(); });
  $('#fechaInput').addEventListener('change', () => { vista.fecha = $('#fechaInput').value || todayISO(); renderTodo(); });

  $('#buscarInput').addEventListener('input', renderGrid);
  $('#filtroEstado').addEventListener('change', renderGrid);
  $('#soloObs').addEventListener('change', renderGrid);
  $('#buscarObs').addEventListener('input', renderObs);

  $('#btnExport').addEventListener('click', exportarJSON);
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', importarJSON);

  $('#btnReporte').addEventListener('click', imprimirReporte);
  $('#btnAddAlumno').addEventListener('click', agregarAlumno);
}

function poblarSalas(salas){
  $('#salaSelect').innerHTML = salas.map(s => `<option value="${s}">${s}</option>`).join('');
}

// ---------- Modelo del día ----------
function modeloDelDia(){
  const cache = almacen.load(vista.sala, vista.fecha);
  if (cache) return cache;

  const alumnos = base.alumnos
    .filter(a => a.sala === vista.sala)
    .map(a => ({ id:a.id, nombre:a.nombre, foto:a.foto || null, estado:null, obs:'', importante:false }));

  const data = { sala:vista.sala, fecha:vista.fecha, alumnos, meta:{creado:new Date().toISOString()} };
  almacen.save(vista.sala, vista.fecha, data);
  return data;
}

// ---------- Render ----------
function renderTodo(){
  setSaved(true);
  renderGrid();
  renderObs();
  actualizarContadores();
}

function renderGrid(){
  const wrap = $('#gridAlumnos');
  wrap.innerHTML = '';

  const q       = $('#buscarInput').value.trim().toLowerCase();
  const filtro  = $('#filtroEstado').value;
  const soloObs = $('#soloObs').checked;

  const data = modeloDelDia();
  let lista = data.alumnos;

  if (q)               lista = lista.filter(a => a.nombre.toLowerCase().includes(q));
  if (filtro !== 'ALL')lista = lista.filter(a => a.estado === filtro);
  if (soloObs)         lista = lista.filter(a => (a.obs || '').trim().length > 0);

  if (lista.length === 0){
    wrap.innerHTML = `<div class="col"><div class="alert alert-light border">No hay alumnos para mostrar.</div></div>`;
    actualizarContadores(); renderObs(); return;
  }

  const tpl = $('#tplCard');
  for (const a of lista){
    const node = tpl.content.cloneNode(true);
    const col  = node.firstElementChild;
    const card = col.querySelector('.alumno-card');
    card.dataset.id = a.id;

    const avatar = col.querySelector('.avatar');
    setAvatar(avatar, a);

    col.querySelector('.alumno-nombre').textContent = a.nombre;

    col.querySelectorAll('.estado-btn').forEach(btn => {
      applyEstadoButtonStyle(btn, a.estado);
      btn.addEventListener('click', () => marcarEstado(a.id, btn.dataset.v));
    });

    // Collapse único por tarjeta
    const collapse = col.querySelector('.collapse');
    const uid = `obs-${a.id}`;
    collapse.id = uid;
    col.querySelector('[data-bs-toggle="collapse"]').setAttribute('data-bs-target', `#${uid}`);

    const txt = col.querySelector('.obs-text');
    const chk = col.querySelector('.flag-importante');
    txt.value = a.obs || '';
    chk.checked = !!a.importante;

    txt.addEventListener('input', debounce(() => editarObs(a.id, txt.value), 300));
    chk.addEventListener('change', () => editarImportante(a.id, chk.checked));

    wrap.appendChild(col);
  }

  actualizarContadores();
  renderObs();
}

function setAvatar(el, a){
  if (a.foto){
    el.style.backgroundImage = `url(${a.foto})`;
    el.textContent = '';
  } else {
    el.style.backgroundImage = 'none';
    el.textContent = a.nombre.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
  }
}

function applyEstadoButtonStyle(btn, estadoActual){
  const value = btn.dataset.v;
  const map = {
    P:{off:'btn-outline-success', on:'btn-success'},
    A:{off:'btn-outline-danger',  on:'btn-danger'},
    T:{off:'btn-outline-warning', on:'btn-warning'},
    J:{off:'btn-outline-info',    on:'btn-info'}
  };
  Object.values(map).forEach(v => btn.classList.remove(v.on, v.off));
  const c = map[value];
  btn.classList.add(value === estadoActual ? c.on : c.off);
  btn.classList.toggle('active', value === estadoActual);
}

// ---------- Acciones ----------
function marcarEstado(id, nuevo){
  const data = modeloDelDia();
  const a = data.alumnos.find(x => x.id === id);
  a.estado = nuevo;
  almacen.save(vista.sala, vista.fecha, data);
  setSaved(false);
  renderGrid();
}

function editarObs(id, texto){
  const data = modeloDelDia();
  const a = data.alumnos.find(x => x.id === id);
  a.obs = texto;
  almacen.save(vista.sala, vista.fecha, data);
  setSaved(true);
  renderObs();
}

function editarImportante(id, v){
  const data = modeloDelDia();
  const a = data.alumnos.find(x => x.id === id);
  a.importante = !!v;
  almacen.save(vista.sala, vista.fecha, data);
  renderObs();
}

function agregarAlumno(){
  const nombre = prompt('Nombre del alumno/a:');
  if (!nombre) return;
  const data = modeloDelDia();
  data.alumnos.push({ id: crypto.randomUUID().slice(0,8), nombre, foto:null, estado:null, obs:'', importante:false });
  almacen.save(vista.sala, vista.fecha, data);
  renderGrid();
}

function actualizarContadores(){
  const data = modeloDelDia();
  const c = { P:0, A:0, T:0, J:0 };
  data.alumnos.forEach(a => { if (a.estado && c[a.estado] !== undefined) c[a.estado]++; });
  $('#resumenContadores').textContent = `P:${c.P} A:${c.A} T:${c.T} J:${c.J}`;
}

function renderObs(){
  const wrap = $('#listaObservaciones');
  const q = $('#buscarObs').value.trim().toLowerCase();
  const data = modeloDelDia();
  const items = data.alumnos
    .filter(a => (a.obs || '').trim().length > 0)
    .map(a => ({ nombre:a.nombre, obs:a.obs.trim(), imp:!!a.importante }))
    .filter(x => !q || x.nombre.toLowerCase().includes(q) || x.obs.toLowerCase().includes(q));

  if (items.length === 0){
    wrap.innerHTML = `<div class="list-group-item text-body-secondary">Sin observaciones.</div>`;
    return;
  }

  wrap.innerHTML = items.map(x => `
    <div class="list-group-item ${x.imp ? 'list-group-item-warning' : ''}">
      <div class="fw-semibold">${esc(x.nombre)}</div>
      <div class="small white-space-prewrap">${esc(x.obs)}</div>
    </div>
  `).join('');
}

// ---------- Exportar / Importar ----------
function exportarJSON(){
  const data = modeloDelDia();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `libro-${data.sala}-${data.fecha}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importarJSON(ev){
  const file = ev.target.files?.[0];
  if (!file) return;
  try{
    const parsed = JSON.parse(await file.text());
    if (!parsed.sala || !parsed.fecha || !Array.isArray(parsed.alumnos)) throw new Error('Formato no válido');
    vista.sala = parsed.sala;
    vista.fecha = parsed.fecha;
    $('#salaSelect').value = vista.sala;
    $('#fechaInput').value = vista.fecha;
    almacen.save(vista.sala, vista.fecha, parsed);
    renderTodo();
    ev.target.value = '';
  }catch(e){
    alert('No se pudo importar: ' + e.message);
  }
}

// ---------- Reporte (impresión) ----------
function imprimirReporte(){
  const data = modeloDelDia();

  const c = {P:0,A:0,T:0,J:0};
  data.alumnos.forEach(a => { if (a.estado) c[a.estado]++; });

  const filas = data.alumnos.map(a => `
    <tr><td>${esc(a.nombre)}</td><td class="text-center">${a.estado ?? '-'}</td></tr>
  `).join('');

  const obs = data.alumnos
    .filter(a => (a.obs || '').trim().length > 0)
    .map(a => `<li><strong>${esc(a.nombre)}:</strong> ${esc(a.obs)}</li>`)
    .join('') || '<li>Sin observaciones.</li>';

  $('#printArea').innerHTML = `
    <header class="mb-3">
      <h1 class="h4 mb-1">Reporte diario — Jardín Patito</h1>
      <div><strong>Sala:</strong> ${esc(data.sala)} &nbsp;|&nbsp; <strong>Fecha:</strong> ${esc(data.fecha)}</div>
    </header>

    <section class="mb-3">
      <strong>Resumen:</strong>
      <span class="ms-2">P:${c.P}</span>
      <span class="ms-2">A:${c.A}</span>
      <span class="ms-2">T:${c.T}</span>
      <span class="ms-2">J:${c.J}</span>
    </section>

    <section class="mb-3">
      <h2 class="h6">Asistencia</h2>
      <table class="table table-sm table-bordered align-middle">
        <thead><tr><th>Alumno/a</th><th class="text-center">Estado</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </section>

    <section>
      <h2 class="h6">Observaciones</h2>
      <ul class="mb-0">${obs}</ul>
    </section>
  `;

  window.print();
}

// ---------- Helpers ----------
function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}
function debounce(fn, ms){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}
