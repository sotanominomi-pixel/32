// script.js — N Clock (final)
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const display = document.getElementById('display');
  const sliderBox = document.getElementById('sliderBox');
  const slider = document.getElementById('sliderHours');
  const labelHours = document.getElementById('labelHours');

  const tabClock = document.getElementById('tabClock');
  const tabStopwatch = document.getElementById('tabStopwatch');
  const tabAlarm = document.getElementById('tabAlarm');

  const stopwatchArea = document.getElementById('stopwatchArea');
  const swStart = document.getElementById('swStart');
  const swLap = document.getElementById('swLap');
  const swReset = document.getElementById('swReset');
  const lapList = document.getElementById('lapList');

  const alarmArea = document.getElementById('alarmArea');
  const alarmTimeInput = document.getElementById('alarmTime');
  const alarmSetBtn = document.getElementById('alarmSetBtn');
  const alarmsContainer = document.getElementById('alarmsContainer');

  // State
  let customHours = Number(localStorage.getItem('nclock_hours')) || 24;
  slider.value = customHours;
  labelHours.textContent = `${customHours} 時間`;

  let mode = localStorage.getItem('nclock_mode') || 'clock';
  let lastFrame = performance.now();
  let running = false;
  let elapsedMs = Number(localStorage.getItem('nclock_sw_elapsed')) || 0;
  let laps = JSON.parse(localStorage.getItem('nclock_sw_laps') || '[]');

  let alarms = JSON.parse(localStorage.getItem('nclock_alarms') || '[]'); // {id,hour,min,enabled}

  // Helpers
  function saveAll(){
    localStorage.setItem('nclock_hours', String(customHours));
    localStorage.setItem('nclock_mode', mode);
    localStorage.setItem('nclock_sw_elapsed', String(elapsedMs));
    localStorage.setItem('nclock_sw_laps', JSON.stringify(laps));
    localStorage.setItem('nclock_alarms', JSON.stringify(alarms));
  }

  // Mode switching
  function setMode(m){
    mode = m;
    [tabClock, tabStopwatch, tabAlarm].forEach(t => t.classList.remove('active'));
    if(m === 'clock') tabClock.classList.add('active');
    if(m === 'stopwatch') tabStopwatch.classList.add('active');
    if(m === 'alarm') tabAlarm.classList.add('active');

    stopwatchArea.style.display = (m === 'stopwatch') ? 'flex' : 'none';
    alarmArea.style.display = (m === 'alarm') ? 'block' : 'none';
    sliderBox.style.display = (m === 'clock') ? 'block' : 'none';
    saveAll();
  }
  setMode(mode);

  // Slider
  slider.addEventListener('input', (e) => {
    customHours = Number(e.target.value);
    labelHours.textContent = `${customHours} 時間`;
    saveAll();
  });

  // Tabs events
  tabClock.addEventListener('click', () => setMode('clock'));
  tabStopwatch.addEventListener('click', () => setMode('stopwatch'));
  tabAlarm.addEventListener('click', () => setMode('alarm'));

  // Stopwatch
  function formatStopwatch(ms){
    const total = Math.floor(ms/1000);
    const h = Math.floor(total/3600);
    const m = Math.floor(total/60)%60;
    const s = total%60;
    if(h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function renderLaps(){
    lapList.innerHTML = '';
    if(laps.length === 0){
      lapList.innerHTML = `<div style="color:var(--muted);padding:8px">ラップなし</div>`;
      return;
    }
    laps.forEach((t,i) => {
      const node = document.createElement('div');
      node.className = 'lap-item';
      node.innerHTML = `<div>Lap ${laps.length - i}</div><div>${t}</div>`;
      lapList.appendChild(node);
    });
  }
  renderLaps();

  swStart.addEventListener('click', () => {
    running = !running;
    if(running){
      lastFrame = performance.now();
      swStart.textContent = 'Stop';
      swStart.classList.remove('btn-start'); swStart.classList.add('btn-stop');
      swLap.disabled = false; swReset.disabled = true;
    } else {
      swStart.textContent = 'Start';
      swStart.classList.remove('btn-stop'); swStart.classList.add('btn-start');
      swLap.disabled = true; swReset.disabled = false;
      saveAll();
    }
  });

  swLap.addEventListener('click', () => {
    laps.unshift(formatStopwatch(elapsedMs));
    if(laps.length > 5000) laps.pop(); // safety cap very large
    renderLaps();
    saveAll();
  });

  swReset.addEventListener('click', () => {
    elapsedMs = 0; laps = []; renderLaps(); swReset.disabled = true; saveAll();
  });

  // Alarm management
  function genId(){ return Math.floor(Math.random()*1e9).toString(36); }

  function renderAlarms(){
    alarmsContainer.innerHTML = '';
    if(alarms.length === 0){
      alarmsContainer.innerHTML = `<div style="color:var(--muted);padding:8px">アラームなし</div>`;
      return;
    }
    alarms.forEach((a, idx) => {
      const card = document.createElement('div');
      card.className = 'alarm-card';
      const timeDiv = document.createElement('div');
      timeDiv.className = 'alarm-time';
      timeDiv.textContent = `${String(a.hour).padStart(2,'0')}:${String(a.min).padStart(2,'0')}`; // black
      const actions = document.createElement('div');
      actions.className = 'alarm-actions';

      // toggle
      const toggle = document.createElement('div');
      toggle.className = 'toggle' + (a.enabled ? ' on' : '');
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      toggle.appendChild(thumb);
      toggle.addEventListener('click', () => {
        a.enabled = !a.enabled; saveAll(); renderAlarms();
      });

      // delete
      const del = document.createElement('button');
      del.className = 'del-btn';
      del.textContent = '削除';
      del.addEventListener('click', () => {
        alarms.splice(idx, 1); saveAll(); renderAlarms();
      });

      actions.appendChild(toggle);
      actions.appendChild(del);

      card.appendChild(timeDiv);
      card.appendChild(actions);
      alarmsContainer.appendChild(card);
    });
  }
  renderAlarms();

  alarmSetBtn.addEventListener('click', () => {
    const val = alarmTimeInput.value;
    if(!val){ alert('時刻を選択してください'); return; }
    const [hh, mm] = val.split(':').map(n => Number(n));
    if(isNaN(hh) || isNaN(mm)){ alert('不正な時刻'); return; }
    alarms.push({ id: genId(), hour: hh, min: mm, enabled: true });
    saveAll();
    renderAlarms();
    alarmTimeInput.value = '';
  });

  // Alarm sound: longer "iPhone-like" tone (pattern)
  function playAlarmSound(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.value = 0;
      // create pattern: rising beeps for ~3s
      for(let i=0;i<6;i++){
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = 880 - i*40;
        o.connect(gain);
        o.start(t + i*0.5);
        o.stop(t + i*0.5 + 0.35);
      }
      // ramp up and down to avoid pop
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 4000);
    }catch(e){}
  }

  // Notifications permission (best-effort)
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission().catch(()=>{});
  }

  // Main loop
  function tick(now){
    let dt = now - lastFrame;
    if(!isFinite(dt) || dt <= 0) dt = 16;
    lastFrame = now;

    const speed = 24 / customHours;

    if(running){
      elapsedMs += dt * speed;
    }

    // Clock display (HH:MM only)
    if(mode === 'clock'){
      const d = new Date();
      const secOfDay = d.getHours()*3600 + d.getMinutes()*60 + d.getSeconds() + d.getMilliseconds()/1000;
      const virtual = secOfDay * speed;
      const h = Math.floor(virtual / 3600) % 24;
      const m = Math.floor(virtual / 60) % 60;
      display.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    } else if(mode === 'stopwatch'){
      display.textContent = formatStopwatch(elapsedMs);
    }

    // Alarm check (trigger at real time when seconds === 0)
    const nowReal = new Date();
    if(nowReal.getSeconds() === 0){
      alarms.forEach(a => {
        if(!a.enabled) return;
        if(a.hour === nowReal.getHours() && a.min === nowReal.getMinutes()){
          // trigger once (user will dismiss or it keeps notifying each minute if still enabled)
          try{
            if(Notification.permission === 'granted'){
              new Notification('N Clock', { body: `アラーム ${String(a.hour).padStart(2,'0')}:${String(a.min).padStart(2,'0')}` });
            }
          }catch(e){}
          playAlarmSound();
          alert(`アラーム ${String(a.hour).padStart(2,'0')}:${String(a.min).padStart(2,'0')} が鳴りました`);
        }
      });
    }

    requestAnimationFrame(tick);
  }

  // formatting helper re-used
  function formatStopwatch(ms){
    const total = Math.floor(ms/1000);
    const h = Math.floor(total/3600);
    const m = Math.floor(total/60)%60;
    const s = total%60;
    if(h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // Initialization
  function restore(){
    if(localStorage.getItem('nclock_hours')){ customHours = Number(localStorage.getItem('nclock_hours')); slider.value = customHours; labelHours.textContent = `${customHours} 時間`; }
    if(localStorage.getItem('nclock_mode')){ mode = localStorage.getItem('nclock_mode'); }
    if(localStorage.getItem('nclock_sw_elapsed')){ elapsedMs = Number(localStorage.getItem('nclock_sw_elapsed')); }
    if(localStorage.getItem('nclock_sw_laps')){ laps = JSON.parse(localStorage.getItem('nclock_sw_laps')); renderLaps(); }
    if(localStorage.getItem('nclock_alarms')){ alarms = JSON.parse(localStorage.getItem('nclock_alarms')); renderAlarms(); }
    setMode(mode);
  }
  restore();

  // start loop
  lastFrame = performance.now();
  requestAnimationFrame(tick);

  // periodic save
  setInterval(saveAll, 2000);

  // Expose delete by id if needed
  window.deleteAlarm = function(id){
    const idx = alarms.findIndex(a => a.id === id);
    if(idx >= 0){ alarms.splice(idx,1); saveAll(); renderAlarms(); }
  };

  // Ensure buttons initial state
  swLap.disabled = true; swReset.disabled = true;

  // Register service worker (best-effort) — relative path
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});
