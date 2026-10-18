// RoutineTrack — persistence + stats helpers (global namespace, no build step)
const RT = {
  uid: function(prefix='id'){
    return prefix+'_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
  },
  dateKey: function(d){
    d = d || new Date();
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+day;
  },
  parseKey: function(k){
    const p=k.split('-').map(Number);
    return new Date(p[0], p[1]-1, p[2]);
  },
  todayKey: function(){ return RT.dateKey(new Date()); },
  addDays: function(k,n){
    const d=RT.parseKey(k); d.setDate(d.getDate()+n); return RT.dateKey(d);
  },
  // -------- persistence --------
  loadSchedule: function(){
    try { const v=localStorage.getItem('rt.schedule.v1'); if(v) return JSON.parse(v); } catch(e){}
    return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  },
  saveSchedule: function(s){ localStorage.setItem('rt.schedule.v1', JSON.stringify(s)); },
  loadCats: function(){
    try { const v=localStorage.getItem('rt.categories.v1'); if(v) return JSON.parse(v); } catch(e){}
    return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  },
  saveCats: function(c){ localStorage.setItem('rt.categories.v1', JSON.stringify(c)); },
  loadLog: function(){
    try { const v=localStorage.getItem('rt.log.v1'); if(v) return JSON.parse(v); } catch(e){}
    return {};
  },
  saveLog: function(l){ localStorage.setItem('rt.log.v1', JSON.stringify(l)); },
  loadSettings: function(){
    try { const v=localStorage.getItem('rt.settings.v1'); if(v) return JSON.parse(v); } catch(e){}
    return { weekStart:'sunday', notify:false, hideOnTime:true };
  },
  saveSettings: function(s){ localStorage.setItem('rt.settings.v1', JSON.stringify(s)); },

  // -------- log ops --------
  getDay: function(log,k){ return log[k] || {}; },
  setItem: function(log,k,id,status){
    if(!log[k]) log[k]={};
    log[k][id]=status;
    RT.saveLog(log);
  },
  clearItem: function(log,k,id){
    if(log[k]){ delete log[k][id]; RT.saveLog(log); }
  },

  // -------- stats --------
  dayStats: function(schedule, log, k){
    let total=schedule.length, done=0, skipped=0, pending=0;
    for(let i=0;i<schedule.length;i++){
      const st = (RT.getDay(log,k)[schedule[i].id]) || 'pending';
      if(st==='done') done++;
      else if(st==='skipped') skipped++;
      else pending++;
    }
    const accounted = total - pending;
    const pct = total ? Math.round((done/total)*100) : 0;
    return { total, done, skipped, pending, pct, accounted };
  },

  currentStreak: function(schedule, log, threshold){
    threshold = threshold==null ? 0.5 : threshold;
    let streak=0;
    const todayK = RT.todayKey();
    const todayS = RT.dayStats(schedule, log, todayK);
    const todayCounts = todayS.accounted>0 && (todayS.done/todayS.total)>=threshold;
    for(let i=0;i<365;i++){
      const key = RT.addDays(todayK, -i);
      const s = RT.dayStats(schedule, log, key);
      if(i===0){
        if(todayCounts) streak++;
        continue;
      }
      if(s.accounted===0) continue;
      if((s.done/s.total) >= threshold){ streak++; }
      else break;
    }
    return streak;
  },

  bestStreak: function(schedule, log, threshold){
    threshold = threshold==null ? 0.5 : threshold;
    const keys = Object.keys(log).sort();
    let best=0, run=0;
    for(let i=0;i<keys.length;i++){
      const s = RT.dayStats(schedule, log, keys[i]);
      if(s.accounted===0) continue;
      if((s.done/s.total) >= threshold){ run++; if(run>best) best=run; }
      else run=0;
    }
    return best;
  },

  completionByCategory: function(schedule, log, fromKey, toKey){
    const cats = {};
    let k=fromKey;
    let guard=0;
    while(k<=toKey && guard<4000){
      for(let i=0;i<schedule.length;i++){
        const it=schedule[i]; const c=it.cat||'uncat';
        if(!cats[c]) cats[c]={done:0,total:0};
        cats[c].total++;
        const st = RT.getDay(log,k)[it.id];
        if(st==='done') cats[c].done++;
      }
      k=RT.addDays(k,1); guard++;
    }
    return cats;
  },

  completionByHour: function(schedule, log, fromKey, toKey){
    // bucket activities by their hour (start hour)
    const hours = {};
    for(let h=0;h<24;h++) hours[h]={done:0,total:0};
    let k=fromKey; let guard=0;
    while(k<=toKey && guard<4000){
      for(let i=0;i<schedule.length;i++){
        const it=schedule[i];
        const hh = parseInt(it.time.split(':')[0],10) || 0;
        hours[hh].total++;
        if(RT.getDay(log,k)[it.id]==='done') hours[hh].done++;
      }
      k=RT.addDays(k,1); guard++;
    }
    return hours;
  },

  // -------- import / export --------
  exportData: function(){
    return JSON.stringify({
      app:'RoutineTrack', version:1,
      exportedAt:new Date().toISOString(),
      schedule: RT.loadSchedule(),
      categories: RT.loadCats(),
      log: RT.loadLog(),
      settings: RT.loadSettings()
    }, null, 2);
  },
  importData: function(json){
    const data = typeof json==='string' ? JSON.parse(json) : json;
    if(!data || data.app!=='RoutineTrack') throw new Error('Not a RoutineTrack export file');
    if(data.schedule) RT.saveSchedule(data.schedule);
    if(data.categories) RT.saveCats(data.categories);
    if(data.log) RT.saveLog(data.log);
    if(data.settings) RT.saveSettings(data.settings);
    return data;
  },
  resetAll: function(){
    localStorage.removeItem('rt.schedule.v1');
    localStorage.removeItem('rt.categories.v1');
    localStorage.removeItem('rt.log.v1');
    localStorage.removeItem('rt.settings.v1');
  }
};
