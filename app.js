// RoutineTrack — app controller

let state = {
  view: 'today',
  dateKey: RT.todayKey(),
};

function load(){
  const schedule = RT.loadSchedule();
  const cats = RT.loadCats();
  const log = RT.loadLog();
  return { schedule, cats, log };
}
const ctx = {
  get: load,
};

// ---- date label ----
function updateTodayLabel(){
  const el = document.getElementById('todayLabel');
  const k = state.dateKey;
  if(k === RT.todayKey()){
    el.textContent = new Date().toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
  } else {
    const d = RT.parseKey(k);
    const diff = Math.round((RT.parseKey(RT.todayKey()) - d) / 86400000);
    const rel = diff===0 ? 'today' : diff===-1 ? 'tomorrow' : diff===1 ? 'yesterday' : (diff>0?'in '+diff+'d':' '+diff+'d ago');
    el.textContent = rel;
  }
}

// ---- render current view ----
function render(){
  const main = document.getElementById('main');
  main.innerHTML = '';
  const ctxData = Object.assign({ dateKey: state.dateKey }, ctx.get());
  let frag;
  if(state.view === 'today') frag = renderToday(ctxData);
  else if(state.view === 'history') frag = renderHistory(ctxData);
  else if(state.view === 'settings') frag = renderSettings(ctx);
  main.append(frag);
  updateTodayLabel();
  wireItemToggles();
}
function refresh(){ render(); }

// ---- tab switching ----
function switchView(name){
  state.view = name;
  document.querySelectorAll('.tab').forEach(t=>{
    t.classList.toggle('active', t.dataset.view === name);
  });
  if(name === 'today') state.dateKey = RT.todayKey();
  render();
}

// ---- item toggle: pending -> done -> skipped -> pending ----
function wireItemToggles(){
  document.querySelectorAll('.item .toggle').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const id = btn.dataset.id;
      const k = btn.dataset.date;
      const log = ctx.get().log;
      const cur = RT.getDay(log,k)[id] || 'pending';
      let next = 'pending';
      if(cur === 'pending') next = 'done';
      else if(cur === 'done') next = 'skipped';
      else next = 'pending';
      if(next === 'pending'){
        RT.clearItem(log,k,id);
      } else {
        RT.setItem(log,k,id,next);
      }
      render();
    });
  });
}

// ---- date picker modal ----
function openDatePicker(){
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const backdrop = el('div', { class:'backdrop' });
  const sheet = el('div', { class:'sheet' });
  sheet.innerHTML = `
    <div class="sheet-head">
      <h3>Jump to date</h3>
      <button class="icon-btn" id="close" aria-label="Close">✕</button>
    </div>
    <input id="dp" type="date" value="${state.dateKey}"/>
    <div class="sheet-actions">
      <button class="btn" id="todayBtn">Today</button>
      <button class="btn primary" id="go">Go</button>
    </div>`;
  backdrop.append(sheet);
  root.append(backdrop);
  function close(){ root.innerHTML=''; }
  sheet.querySelector('#close').addEventListener('click', close);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });
  sheet.querySelector('#todayBtn').addEventListener('click', ()=>{
    state.dateKey = RT.todayKey();
    close(); refresh();
  });
  sheet.querySelector('#go').addEventListener('click', ()=>{
    const v = sheet.querySelector('#dp').value;
    if(v){ state.dateKey = v; switchView('today'); close(); }
  });
}

// ---- wire tabs + header ----
function wireChrome(){
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click', ()=> switchView(t.dataset.view));
  });
  document.getElementById('dateBtn').addEventListener('click', openDatePicker);
  // deep link
  const p = new URLSearchParams(location.search);
  const view = p.get('view');
  if(view && ['today','history','settings'].includes(view)) state.view = view;
  const d = p.get('date');
  if(d && /^\d{4}-\d{2}-\d{2}$/.test(d)) state.dateKey = d;

  // keyboard shortcuts
  document.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT' || e.target.tagName==='SELECT') return;
    if(e.key==='1') switchView('today');
    else if(e.key==='2') switchView('history');
    else if(e.key==='3') switchView('settings');
    else if(e.key==='Escape'){ document.getElementById('modal-root').innerHTML=''; }
  });

  // visibility: refresh when tab becomes visible (keeps "today" accurate)
  document.addEventListener('visibilitychange', ()=>{
    if(document.visibilityState==='visible'){
      if(state.view==='today' && state.dateKey!==RT.todayKey() && state.dateKey===RT.todayKey()){
        refresh();
      }
    }
  });

  // service worker
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  wireChrome();
  render();
});
