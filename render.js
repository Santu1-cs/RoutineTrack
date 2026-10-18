// RoutineTrack — rendering (views + modal + toast)

function el(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if(attrs){
    for(const k in attrs){
      if(k==='class') e.className = attrs[k];
      else if(k==='html') e.innerHTML = attrs[k];
      else if(k.startsWith('on') && typeof attrs[k]==='function') e.addEventListener(k.slice(2), attrs[k]);
      else if(attrs[k]!=null) e.setAttribute(k, attrs[k]);
    }
  }
  for(const kid of kids){
    if(kid==null || kid===false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}

function fmtTime(t){
  const p = String(t).split(':'); const h=parseInt(p[0],10)||0; const m=parseInt(p[1],10)||0;
  const ampm = h<12 ? 'AM' : 'PM';
  const hh = ((h+11)%12)+1;
  return hh+':'+String(m).padStart(2,'0')+' '+ampm;
}
function fmtTime12HourShort(t){
  const p = String(t).split(':'); const h=parseInt(p[0],10)||0; const m=parseInt(p[1],10)||0;
  return m===0 ? hhOnly(h) : fmtTime(t);
}
function hhOnly(h){
  const ampm = h<12 ? 'AM' : 'PM';
  const hh = ((h+11)%12)+1;
  return hh+' '+ampm;
}
function catColor(cats, id){ const c=cats.find(x=>x.id===id); return c ? c.color : '#94a3b8'; }
function catName(cats, id){ const c=cats.find(x=>x.id===id); return c ? c.name : 'Other'; }

function donutSVG(pct, size, stroke, sub){
  const r = (size - stroke*2)/2;
  const c = 2*Math.PI*r;
  const off = c*(1 - Math.max(0,Math.min(100,pct))/100);
  const gid = 'dg'+Math.random().toString(36).slice(2,7);
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="donut" aria-hidden="true">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="#1f2740" stroke-width="${stroke}" fill="none"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="url(#${gid})" stroke-width="${stroke}" fill="none"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
      transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset .5s ease"/>
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient></defs>
    <text x="50%" y="46%" text-anchor="middle" dominant-baseline="middle" class="donut-pct">${pct}%</text>
    <text x="50%" y="64%" text-anchor="middle" dominant-baseline="middle" class="donut-sub">${sub||''}</text>
  </svg>`;
}

// bucket activities into time-of-day groups
function bucketHours(h){
  if(h>=5 && h<12) return 'morning';
  if(h>=12 && h<17) return 'afternoon';
  if(h>=17 && h<21) return 'evening';
  return 'night';
}
const BUCKET_META = {
  morning:   { label:'Morning',   icon:'🌅' },
  afternoon: { label:'Afternoon', icon:'☀️' },
  evening:   { label:'Evening',   icon:'🌆' },
  night:     { label:'Night',     icon:'🌙' }
};

// ---------- TODAY view ----------
function renderToday(ctx){
  const frag = document.createDocumentFragment();
  const { schedule, cats, log, dateKey } = ctx;
  const stats = RT.dayStats(schedule, log, dateKey);
  const isToday = dateKey === RT.todayKey();
  const streak = RT.currentStreak(schedule, log);

  // Progress card
  const card = el('section', { class:'card progress-card' });
  card.innerHTML = `
    <div class="donut-wrap">${donutSVG(stats.pct, 130, 12, stats.done+' / '+stats.total)}</div>
    <div class="progress-meta">
      <div class="progress-title">${isToday ? 'Today' : friendlyDate(dateKey)}</div>
      <div class="progress-sub">${stats.done} done · ${stats.skipped} skipped · ${stats.pending} to go</div>
      <div class="streak-pill">🔥 ${streak} day streak</div>
    </div>`;
  frag.append(card);

  // Timeline grouped
  const list = el('section', { class:'list timeline' });
  const groups = { morning:[], afternoon:[], evening:[], night:[] };
  for(const it of schedule){
    const h = parseInt(String(it.time).split(':')[0],10) || 0;
    groups[bucketHours(h)].push(it);
  }
  const ORDER = ['morning','afternoon','evening','night'];
  for(const b of ORDER){
    const items = groups[b]; if(!items.length) continue;
    const meta = BUCKET_META[b];
    const header = el('div', { class:'group-header' });
    header.innerHTML = `<span class="gicon">${meta.icon}</span><span>${meta.label}</span>`;
    list.append(header);
    for(const it of items){
      const status = RT.getDay(log, dateKey)[it.id] || 'pending';
      list.append(renderItem(it, cats, status, dateKey, ctx));
    }
  }
  frag.append(list);
  return frag;
}

function renderItem(it, cats, status, dateKey, ctx){
  const row = el('div', { class:'item row-'+status, 'data-id':it.id, 'data-date':dateKey, role:'button', tabindex:'0' });
  const dot = el('span', { class:'dot', style:'background:'+catColor(cats, it.cat) });
  const info = el('div', { class:'item-info' });
  info.append(el('div', { class:'item-title' }, it.title));
  info.append(el('div', { class:'item-meta' },
    el('span', { class:'item-time' }, fmtTime(it.time)),
    el('span', { class:'bullet' }, '·'),
    el('span', { class:'item-cat', style:'color:'+catColor(cats,it.cat) }, catName(cats, it.cat)),
    it.durationMin ? el('span', { class:'bullet' }, '·') : null,
    it.durationMin ? el('span', { class:'item-dur' }, it.durationMin+'m') : null
  ));
  // status icon
  let icon = '';
  if(status==='done') icon = '✓';
  else if(status==='skipped') icon = '—';
  const toggle = el('button', { class:'toggle', 'data-id':it.id, 'data-date':dateKey, 'aria-label':'Toggle status' });
  toggle.textContent = icon;
  row.append(dot, info, toggle);
  return row;
}

function friendlyDate(k){
  const d = RT.parseKey(k);
  return d.toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' });
}

// ---------- HISTORY view ----------
function renderHistory(ctx){
  const frag = document.createDocumentFragment();
  const { schedule, cats, log } = ctx;
  const streak = RT.currentStreak(schedule, log);
  const best = RT.bestStreak(schedule, log);
  const totalDays = Object.keys(log).filter(k=>RT.dayStats(schedule,log,k).accounted>0).length;

  // summary cards
  const sum = el('section', { class:'grid2' });
  sum.append(summaryCard('🔥','Current streak', streak+'d'));
  sum.append(summaryCard('🏆','Best streak', best+'d'));
  sum.append(summaryCard('📅','Days logged', String(totalDays)));
  sum.append(summaryCard('✅','Avg today', avgCompletion(schedule,log)+'%'));
  frag.append(sum);

  // month selector
  const now = new Date();
  const monthState = { y: now.getFullYear(), m: now.getMonth() };

  const monthNav = el('section', { class:'card month-nav' });
  const mLabel = el('div', { class:'month-label' });
  const btnPrev = el('button', { class:'icon-btn', 'aria-label':'Prev month' }, '‹');
  const btnNext = el('button', { class:'icon-btn', 'aria-label':'Next month' }, '›');
  monthNav.append(btnPrev, mLabel, btnNext);
  frag.append(monthNav);

  // calendar
  const cal = el('section', { class:'card calendar' });
  const calBody = el('div', { class:'cal-grid', id:'cal-grid' });
  cal.append(calBody);
  frag.append(cal);

  // heat legend
  const legend = el('div', { class:'legend' },
    el('span', null, 'Less'),
    el('div', { class:'legend-bar' }),
    el('span', null, 'More')
  );
  frag.append(legend);

  // category breakdown (last 30 days)
  const fromK = RT.addDays(RT.todayKey(), -29);
  const catData = RT.completionByCategory(schedule, log, fromK, RT.todayKey());
  const catCard = el('section', { class:'card' });
  catCard.append(el('h3', { class:'card-title' }, 'By category (30 days)'));
  const catRows = el('div', { class:'cat-rows' });
  for(const id of Object.keys(catData)){
    const d = catData[id]; const pct = d.total ? Math.round(d.done/d.total*100) : 0;
    catRows.append(catRow(id, cats, d.done, d.total, pct));
  }
  catCard.append(catRows);
  frag.append(catCard);

  // hour-of-day chart
  const hourCard = el('section', { class:'card' });
  hourCard.append(el('h3', { class:'card-title' }, 'Time-of-day load (30 days)'));
  const hours = RT.completionByHour(schedule, log, fromK, RT.todayKey());
  const chart = el('div', { class:'hour-chart' });
  for(let h=0;h<24;h++){
    const d=hours[h];
    const total = Math.max(...Object.values(hours).map(x=>x.total), 1);
    const barH = d.total ? Math.max(6, (d.total/total)*100) : 0;
    const fillH = d.total ? (d.done/d.total)*barH : 0;
    chart.append(el('div', { class:'hour-bar', title:h+':00 — '+d.done+'/'+d.total },
      el('div', { class:'bar-bg', style:'height:'+barH+'%' }),
      el('div', { class:'bar-fill', style:'height:'+fillH+'%' }),
      (h%3===0) ? el('div', { class:'bar-label' }, hhOnly(h)) : null
    ));
  }
  hourCard.append(chart);
  frag.append(hourCard);

  // wire month nav
  function drawMonth(){
    const y=monthState.y, m=monthState.m;
    mLabel.textContent = new Date(y,m,1).toLocaleDateString(undefined, { month:'long', year:'numeric' });
    calBody.innerHTML = '';
    // weekday header
    const ws = ['S','M','T','W','T','F','S'];
    for(const w of ws) calBody.append(el('div', { class:'cal-h' }, w));
    const first = new Date(y,m,1);
    const startDow = first.getDay();
    const daysInMonth = new Date(y,m+1,0).getDate();
    for(let i=0;i<startDow;i++) calBody.append(el('div', { class:'cal-empty' }));
    for(let d=1; d<=daysInMonth; d++){
      const k = RT.dateKey(new Date(y,m,d));
      const s = RT.dayStats(schedule, log, k);
      const cell = el('div', { class:'cal-cell', 'data-date':k, role:'button', tabindex:'0' });
      cell.style.setProperty('--pct', (s.pct||0)+'%');
      if(k===RT.todayKey()) cell.classList.add('today');
      cell.innerHTML = `<div class="cal-day">${d}</div><div class="cal-pct">${s.pct||0}%</div>`;
      cell.addEventListener('click', ()=> openDayModal(ctx, k));
      cell.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openDayModal(ctx,k); } });
      calBody.append(cell);
    }
  }
  btnPrev.addEventListener('click', ()=>{
    monthState.m--; if(monthState.m<0){ monthState.m=11; monthState.y--; } drawMonth();
  });
  btnNext.addEventListener('click', ()=>{
    monthState.m++; if(monthState.m>11){ monthState.m=0; monthState.y++; } drawMonth();
  });
  drawMonth();

  return frag;
}

function summaryCard(icon, label, val){
  const c = el('div', { class:'card stat' });
  c.innerHTML = `<div class="stat-icon">${icon}</div><div class="stat-val">${val}</div><div class="stat-lbl">${label}</div>`;
  return c;
}

function catRow(id, cats, done, total, pct){
  const row = el('div', { class:'cat-row' });
  row.innerHTML = `
    <div class="cat-head">
      <span class="cat-dot" style="background:${catColor(cats,id)}"></span>
      <span class="cat-name">${catName(cats,id)}</span>
      <span class="cat-num">${done}/${total} · ${pct}%</span>
    </div>
    <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${catColor(cats,id)}"></div></div>`;
  return row;
}

function avgCompletion(schedule, log){
  const keys = Object.keys(log).filter(k=>RT.dayStats(schedule,log,k).accounted>0);
  if(!keys.length) return 0;
  let sum=0;
  for(const k of keys) sum += RT.dayStats(schedule,log,k).pct;
  return Math.round(sum/keys.length);
}

// ---------- SETTINGS view ----------
function renderSettings(ctx){
  const frag = document.createDocumentFragment();
  const { schedule, cats, log } = ctx.get();

  // Schedule editor
  const schedCard = el('section', { class:'card' });
  schedCard.append(el('h3', { class:'card-title' }, 'Schedule'));
  schedCard.append(el('p', { class:'muted' }, 'Add, edit, or reorder your baseline routine. Changes are saved locally.'));

  const list = el('div', { class:'edit-list' });
  for(const it of schedule){
    const row = el('div', { class:'edit-row' });
    row.innerHTML = `
      <div class="drag-dots">⋮⋮</div>
      <div class="edit-info">
        <div>${it.title}</div>
        <div class="muted small">${it.time} · ${catName(cats,it.cat)} · ${it.durationMin||0}m</div>
      </div>`;
    const editBtn = el('button', { class:'mini-btn' }, 'Edit');
    editBtn.addEventListener('click', ()=> openItemEditor(ctx, it));
    const delBtn = el('button', { class:'mini-btn danger' }, 'Delete');
    delBtn.addEventListener('click', ()=>{
      if(!confirm('Delete "'+it.title+'"?')) return;
      const s = ctx.get().schedule;
      const idx = s.findIndex(x=>x.id===it.id);
      if(idx>=0){ s.splice(idx,1); RT.saveSchedule(s); refresh(); }
    });
    row.append(editBtn, delBtn);
    list.append(row);
  }
  schedCard.append(list);

  const addBtn = el('button', { class:'btn primary', style:'width:100%;margin-top:10px' }, '+ Add activity');
  addBtn.addEventListener('click', ()=> openItemEditor(ctx, null));
  schedCard.append(addBtn);
  frag.append(schedCard);

  // Categories
  const catCard = el('section', { class:'card' });
  catCard.append(el('h3', { class:'card-title' }, 'Categories'));
  const catList = el('div', { class:'cat-edit' });
  for(const c of cats){
    const row = el('div', { class:'cat-edit-row' });
    row.innerHTML = `
      <span class="swatch" style="background:${c.color}"></span>
      <span>${c.name}</span>
      <span class="cat-count">${schedule.filter(x=>x.cat===c.id).length}</span>`;
    catList.append(row);
  }
  catCard.append(catList);
  frag.append(catCard);

  // Data
  const dataCard = el('section', { class:'card' });
  dataCard.append(el('h3', { class:'card-title' }, 'Your data'));
  dataCard.append(el('p', { class:'muted' }, 'Everything is stored in your browser only. Export to back up or move devices.'));
  const row1 = el('div', { class:'btn-row' });
  const expBtn = el('button', { class:'btn' }, '⬇ Export JSON');
  expBtn.addEventListener('click', exportJSON);
  const impBtn = el('button', { class:'btn' }, '⬆ Import JSON');
  impBtn.addEventListener('click', importJSON);
  const resetBtn = el('button', { class:'btn danger' }, 'Reset all data');
  resetBtn.addEventListener('click', ()=>{
    if(!confirm('Erase everything (schedule, log, settings)? This cannot be undone.')) return;
    RT.resetAll(); location.reload();
  });
  row1.append(expBtn, impBtn, resetBtn);
  dataCard.append(row1);
  frag.append(dataCard);

  // About
  const aboutCard = el('section', { class:'card' });
  aboutCard.innerHTML = `<h3 class="card-title">About</h3>
    <p class="muted">RoutineTrack — a personal routine & productivity manager.<br>
    Works fully offline. Your data never leaves this device.</p>
    <p class="muted small">Tip: Tap any item to mark it done. Tap again to mark skipped. Tap a third time to clear.</p>`;
  frag.append(aboutCard);

  return frag;
}

// ---------- Item editor modal ----------
function openItemEditor(ctx, existing){
  const cats = ctx.get().cats;
  const isEdit = !!existing;
  const d = existing || { id: RT.uid('a'), time:'09:00', title:'', cat: cats[0]?.id || 'work', durationMin:30 };

  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const backdrop = el('div', { class:'backdrop' });
  const sheet = el('div', { class:'sheet' });
  sheet.innerHTML = `
    <div class="sheet-head">
      <h3>${isEdit?'Edit activity':'New activity'}</h3>
      <button class="icon-btn" id="close" aria-label="Close">✕</button>
    </div>
    <label class="field">
      <span>Title</span>
      <input id="f-title" type="text" placeholder="e.g. Morning exercise" value="${escapeAttr(d.title)}"/>
    </label>
    <div class="row2">
      <label class="field">
        <span>Start time</span>
        <input id="f-time" type="time" value="${d.time}"/>
      </label>
      <label class="field">
        <span>Duration (min)</span>
        <input id="f-dur" type="number" min="0" max="480" value="${d.durationMin||0}"/>
      </label>
    </div>
    <label class="field">
      <span>Category</span>
      <select id="f-cat">
        ${cats.map(c=>`<option value="${c.id}" ${c.id===d.cat?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </label>
    <div class="sheet-actions">
      <button class="btn" id="cancel">Cancel</button>
      <button class="btn primary" id="save">Save</button>
    </div>`;
  backdrop.append(sheet);
  root.append(backdrop);

  function close(){ root.innerHTML=''; }
  document.getElementById('close').addEventListener('click', close);
  document.getElementById('cancel').addEventListener('click', close);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });

  document.getElementById('save').addEventListener('click', ()=>{
    const title = document.getElementById('f-title').value.trim();
    if(!title){ toast('Please enter a title'); return; }
    const time = document.getElementById('f-time').value || d.time;
    const dur = parseInt(document.getElementById('f-dur').value,10) || 0;
    const cat = document.getElementById('f-cat').value;
    const s = ctx.get().schedule;
    const item = { id: d.id, title, time, durationMin: dur, cat };
    if(isEdit){
      const idx = s.findIndex(x=>x.id===d.id);
      if(idx>=0) s[idx] = item;
    } else {
      s.push(item);
    }
    // sort by time
    s.sort((a,b)=> a.time.localeCompare(b.time));
    RT.saveSchedule(s);
    close(); refresh();
    toast(isEdit?'Updated':'Added');
  });
}

function escapeAttr(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ---------- Day detail modal ----------
function openDayModal(ctx, k){
  const { schedule, cats, log } = ctx.get();
  const stats = RT.dayStats(schedule, log, k);
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const backdrop = el('div', { class:'backdrop' });
  const sheet = el('div', { class:'sheet' });
  sheet.innerHTML = `
    <div class="sheet-head">
      <h3>${friendlyDate(k)}</h3>
      <button class="icon-btn" id="close" aria-label="Close">✕</button>
    </div>
    <div class="day-stats-row">
      <div class="ds">${stats.done}<span>done</span></div>
      <div class="ds">${stats.skipped}<span>skipped</span></div>
      <div class="ds">${stats.total}<span>total</span></div>
      <div class="ds">${stats.pct}<span>%</span></div>
    </div>
    <div class="day-list"></div>
    <div class="sheet-actions">
      <button class="btn" id="editday">Edit day's items</button>
      <button class="btn primary" id="clearday">Clear this day</button>
    </div>`;
  const dayList = sheet.querySelector('.day-list');
  for(const it of schedule){
    const st = RT.getDay(log,k)[it.id] || 'pending';
    dayList.append(renderItem(it, cats, st, k, ctx));
  }
  backdrop.append(sheet);
  root.append(backdrop);

  function close(){ root.innerHTML=''; }
  sheet.querySelector('#close').addEventListener('click', close);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });
  sheet.querySelector('#clearday').addEventListener('click', ()=>{
    if(!confirm('Clear all statuses for '+friendlyDate(k)+'?')) return;
    const l = ctx.get().log;
    if(l[k]){ delete l[k]; RT.saveLog(l); }
    close(); refresh();
  });
  sheet.querySelector('#editday').addEventListener('click', ()=>{
    close(); switchView('settings');
  });
}

// ---------- Toast ----------
function toast(msg){
  const root = document.getElementById('toast-root');
  const t = el('div', { class:'toast' }, msg);
  root.append(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),300); }, 1800);
}

// ---------- Import / Export helpers ----------
function exportJSON(){
  const data = RT.exportData();
  const blob = new Blob([data], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'routinetrack-'+RT.todayKey()+'.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported');
}
function importJSON(){
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='application/json';
  inp.addEventListener('change', ()=>{
    const f = inp.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=>{
      try {
        RT.importData(r.result);
        toast('Imported');
        setTimeout(()=>location.reload(), 500);
      } catch(e){ toast('Import failed: '+e.message); }
    };
    r.readAsText(f);
  });
  inp.click();
}
