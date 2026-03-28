/* ============================================
   RIDEWAVE — Complete App Logic
   ============================================ */

/* ---- DATA ---- */
const VEHICLES = [
  { id:'go',      emoji:'🚗', name:'RideWave Go',      desc:'Affordable, everyday',    base:40,  perKm:8,  eta:'3 min', seats:4, color:'#6C63FF' },
  { id:'moto',    emoji:'🛵', name:'RideWave Moto',    desc:'Zip through traffic',     base:20,  perKm:5,  eta:'1 min', seats:1, color:'#00D4FF' },
  { id:'xl',      emoji:'🚙', name:'RideWave XL',      desc:'Space for 6 passengers',  base:90,  perKm:16, eta:'5 min', seats:6, color:'#FFB830' },
  { id:'premier', emoji:'🏎️', name:'RideWave Premier', desc:'Luxury experience',        base:160, perKm:28, eta:'8 min', seats:4, color:'#10D98E' }
];

const LOCATIONS = [
  { name:'Bandra West',          area:'Mumbai',    mx:0.22, my:0.55 },
  { name:'Andheri East',         area:'Mumbai',    mx:0.45, my:0.29 },
  { name:'Juhu Beach',           area:'Mumbai',    mx:0.18, my:0.38 },
  { name:'Powai Lake',           area:'Mumbai',    mx:0.70, my:0.32 },
  { name:'Connaught Place',      area:'New Delhi', mx:0.55, my:0.60 },
  { name:'Bandra Kurla Complex', area:'Mumbai',    mx:0.55, my:0.48 },
  { name:'Gateway of India',     area:'Mumbai',    mx:0.35, my:0.78 },
  { name:'Worli Sea Face',       area:'Mumbai',    mx:0.28, my:0.68 },
  { name:'Dadar Station',        area:'Mumbai',    mx:0.42, my:0.58 },
  { name:'Colaba Causeway',      area:'Mumbai',    mx:0.33, my:0.82 },
  { name:'Hiranandani Gardens',  area:'Mumbai',    mx:0.73, my:0.42 },
  { name:'Santacruz East',       area:'Mumbai',    mx:0.37, my:0.38 }
];

const DRIVERS = [
  { name:'Rajesh Kumar',  initials:'RK', rating:4.9, trips:2847, vehicle:'Hyundai i20', plate:'MH 12 AB 3456', etaMin:3, color:'#6C63FF' },
  { name:'Priya Sharma',  initials:'PS', rating:4.8, trips:1923, vehicle:'Maruti Swift', plate:'MH 02 CD 7890', etaMin:4, color:'#00D4FF' },
  { name:'Mohammed Ali',  initials:'MA', rating:4.7, trips:3210, vehicle:'Honda City',  plate:'MH 08 EF 1234', etaMin:2, color:'#FFB830' },
  { name:'Sneha Patil',   initials:'SP', rating:5.0, trips:987,  vehicle:'Tata Nexon',  plate:'MH 04 GH 5678', etaMin:5, color:'#10D98E' }
];

const HISTORY = [
  { id:'R1842', date:'Today, 2:14 PM',       from:'Bandra West',     to:'Andheri East',        dist:12.4, dur:28, fare:145, veh:'Go',      star:5, status:'completed' },
  { id:'R1839', date:'Yesterday, 9:30 AM',   from:'Juhu Beach',      to:'Worli Sea Face',       dist:8.1,  dur:18, fare:98,  veh:'Premier', star:4, status:'completed' },
  { id:'R1821', date:'Mar 26, 5:45 PM',      from:'Powai Lake',      to:'Bandra West',          dist:15.3, dur:42, fare:212, veh:'XL',      star:5, status:'completed' },
  { id:'R1810', date:'Mar 25, 11:00 AM',     from:'Dadar Station',   to:'Bandra Kurla Complex', dist:6.2,  dur:20, fare:75,  veh:'Go',      star:0, status:'cancelled' },
  { id:'R1798', date:'Mar 24, 3:20 PM',      from:'Gateway of India',to:'Juhu Beach',           dist:22.7, dur:55, fare:295, veh:'Premier', star:4, status:'completed' },
  { id:'R1785', date:'Mar 23, 8:10 AM',      from:'Andheri East',    to:'Dadar Station',        dist:9.8,  dur:30, fare:130, veh:'Moto',    star:5, status:'completed' }
];

const USER = {
  name:'Arjun Sharma', email:'arjun.sharma@email.com',
  initials:'AS', rating:4.8, since:'Jan 2023',
  wallet:2450, rides:47, km:836, saved:1240
};

/* ---- CITY MAP CLASS ---- */
class CityMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.W = 0; this.H = 0;
    this.pickup = null; this.dropoff = null;
    this.animCar = null; this.carProg = 0;
    this.routePts = []; this.rafId = null;
    this.ts = 0;
    this._resize = this.resize.bind(this);
    window.addEventListener('resize', this._resize);
    this.resize();
    this.buildCity();
    this.loop(0);
  }

  resize() {
    const r = window.devicePixelRatio || 1;
    this.W = this.canvas.offsetWidth;
    this.H = this.canvas.offsetHeight;
    this.canvas.width  = this.W * r;
    this.canvas.height = this.H * r;
    this.ctx.scale(r, r);
    this.buildCity();
  }

  buildCity() {
    const { W, H } = this;
    const hGap = H / 5, vGap = W / 7;
    this.hRoads = [hGap, hGap*2, hGap*3, hGap*4];
    this.vRoads = [vGap, vGap*2, vGap*3, vGap*4, vGap*5, vGap*6];
    this.blocks = [];
    const rw = 13;
    const allH = [0, ...this.hRoads, H];
    const allV = [0, ...this.vRoads, W];
    for (let r = 0; r < allH.length - 1; r++) {
      for (let c = 0; c < allV.length - 1; c++) {
        const t = allH[r]+rw, b = allH[r+1]-rw, l = allV[c]+rw, ri = allV[c+1]-rw;
        if (b-t < 16 || ri-l < 16) continue;
        const cols = Math.max(1, Math.floor((ri-l)/45));
        const rows = Math.max(1, Math.floor((b-t)/45));
        for (let bi = 0; bi < rows; bi++) {
          for (let bj = 0; bj < cols; bj++) {
            const bx = l+(ri-l)/cols*bj+2, by = t+(b-t)/rows*bi+2;
            const bw = (ri-l)/cols-4, bh = (b-t)/rows-4;
            const wins = [];
            for (let w = 0; w < 5; w++) wins.push({ x:bx+Math.random()*(bw-8)+3, y:by+Math.random()*(bh-8)+3, on:Math.random()>0.35 });
            this.blocks.push({ x:bx, y:by, w:bw, h:bh, wins });
          }
        }
      }
    }
    if (this.pickup && this.dropoff) this.calcRoute();
  }

  calcRoute() {
    const p = this.pickup, d = this.dropoff;
    const { W, H } = this;
    const midH = this.hRoads.reduce((a,b) => Math.abs(b-(p.y+d.y)/2)<Math.abs(a-(p.y+d.y)/2)?b:a, this.hRoads[0]);
    const midV = this.vRoads.reduce((a,b) => Math.abs(b-(p.x+d.x)/2)<Math.abs(a-(p.x+d.x)/2)?b:a, this.vRoads[0]);
    this.routePts = [
      {x:p.x, y:p.y}, {x:p.x, y:midH}, {x:midV, y:midH}, {x:midV, y:d.y}, {x:d.x, y:d.y}
    ];
  }

  posAt(prog) {
    const pts = this.routePts, n = pts.length-1;
    const g = prog * n;
    const i = Math.min(Math.floor(g), n-1);
    const f = g - i;
    const p1 = pts[i], p2 = pts[i+1];
    return { x:p1.x+(p2.x-p1.x)*f, y:p1.y+(p2.y-p1.y)*f, a:Math.atan2(p2.y-p1.y, p2.x-p1.x)+Math.PI/2 };
  }

  draw(ts) {
    const c = this.ctx, { W, H } = this;
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#07101F'; c.fillRect(0, 0, W, H);

    // Roads
    const rd = '#1B2640';
    this.hRoads.forEach(y => { c.fillStyle=rd; c.fillRect(0,y-13,W,26); });
    this.vRoads.forEach(x => { c.fillStyle=rd; c.fillRect(x-13,0,26,H); });

    // Dashes
    c.strokeStyle='rgba(255,255,255,0.06)'; c.lineWidth=1;
    c.setLineDash([8,14]);
    this.hRoads.forEach(y => { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); });
    this.vRoads.forEach(x => { c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); });
    c.setLineDash([]);

    // Buildings
    this.blocks.forEach(b => {
      c.fillStyle='#111A2E'; c.beginPath();
      if (c.roundRect) c.roundRect(b.x,b.y,b.w,b.h,2); else c.rect(b.x,b.y,b.w,b.h);
      c.fill();
      b.wins.forEach(w => {
        if (w.on) { c.fillStyle=`rgba(255,215,100,${0.28+Math.sin(ts*0.0004+b.x)*0.06})`; c.fillRect(w.x,w.y,3,3); }
      });
    });

    // Route
    if (this.routePts.length > 1) {
      c.beginPath(); c.moveTo(this.routePts[0].x, this.routePts[0].y);
      this.routePts.forEach(p => c.lineTo(p.x, p.y));
      c.strokeStyle='rgba(0,0,0,0.5)'; c.lineWidth=6; c.stroke();
      c.beginPath(); c.moveTo(this.routePts[0].x, this.routePts[0].y);
      this.routePts.forEach(p => c.lineTo(p.x, p.y));
      c.strokeStyle='rgba(108,99,255,0.85)'; c.lineWidth=3;
      c.setLineDash([9,7]); c.lineDashOffset=-(ts*0.035); c.stroke(); c.setLineDash([]);
    }

    // Trip car
    if (this.animCar) this.drawCar(c, this.animCar.x, this.animCar.y, this.animCar.a, '#6C63FF', 10);

    // Markers
    if (this.pickup)  this.drawPin(c, this.pickup.x,  this.pickup.y,  '#00D4FF','A',ts);
    if (this.dropoff) this.drawPin(c, this.dropoff.x, this.dropoff.y, '#FFB830','B',ts);
  }

  drawPin(c, x, y, col, label, ts) {
    const p = Math.sin(ts*0.003)*0.35+0.65;
    const gr = c.createRadialGradient(x,y,0,x,y,26*p);
    gr.addColorStop(0,col+'44'); gr.addColorStop(1,col+'00');
    c.fillStyle=gr; c.beginPath(); c.arc(x,y,26*p,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(x,y,13,0,Math.PI*2);
    c.fillStyle=col; c.shadowColor=col; c.shadowBlur=18; c.fill(); c.shadowBlur=0;
    c.fillStyle=col==='#FFB830'?'#000':'#fff';
    c.font='bold 9px Inter,sans-serif'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(label,x,y);
  }

  drawCar(c, x, y, a, col, r) {
    c.save(); c.translate(x,y); c.rotate(a);
    c.shadowColor=col; c.shadowBlur=18;
    c.fillStyle=col; c.beginPath();
    if (c.roundRect) c.roundRect(-r*.7,-r,r*1.4,r*2,r*.3); else c.rect(-r*.7,-r,r*1.4,r*2);
    c.fill();
    c.fillStyle='rgba(180,220,255,0.35)'; c.beginPath();
    c.rect(-r*.45,-r*.55,r*.9,r*.55); c.fill();
    c.shadowBlur=0; c.restore();
  }

  setPickup(locObj)  { this.pickup  = { x:locObj.mx*this.W, y:locObj.my*this.H }; if(this.dropoff) this.calcRoute(); }
  setDropoff(locObj) { this.dropoff = { x:locObj.mx*this.W, y:locObj.my*this.H }; if(this.pickup) this.calcRoute(); }

  startTrip(onDone) {
    if (!this.routePts.length) return;
    this.carProg = 0;
    this.animCar = { x:this.routePts[0].x, y:this.routePts[0].y, a:0 };
    const step = () => {
      this.carProg = Math.min(this.carProg+0.0018, 1);
      const pos = this.posAt(this.carProg);
      this.animCar = pos;
      if (this.carProg < 1) { this.tripRaf = requestAnimationFrame(step); }
      else { this.animCar=null; if(onDone) onDone(); }
    };
    this.tripRaf = requestAnimationFrame(step);
  }

  loop(ts) { this.ts=ts; this.draw(ts); requestAnimationFrame(t=>this.loop(t)); }
  destroy() { window.removeEventListener('resize',this._resize); if(this.tripRaf) cancelAnimationFrame(this.tripRaf); }
}

/* ---- APP STATE ---- */
const state = {
  screen: 'landing',
  pickupLoc: null, dropoffLoc: null,
  focusField: null,
  selectedVehicle: 'go',
  currentDriver: null,
  tripStage: 0,
  rideFilter: 'all',
  starRating: 0,
  map: null, trackMap: null
};

/* ---- TOAST ---- */
function toast(title, desc='', type='info') {
  const icons = { success:'✅', error:'❌', info:'💜', warning:'⚠️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><div class="toast-text"><div class="toast-title">${title}</div>${desc?`<div class="toast-desc">${desc}</div>`:''}</div>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.classList.add('removing'); setTimeout(()=>el.remove(),300); }, 3400);
}

/* ---- NAVIGATION ---- */
function navigate(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-'+id);
  if (target) { target.classList.add('active'); state.screen = id; }

  // Navbar + bottom nav visibility
  const withNav = ['landing','history','profile'];
  document.getElementById('navbar').style.display = withNav.includes(id) ? '' : 'none';
  document.getElementById('bottom-nav').style.display = withNav.includes(id) ? '' : 'none';

  // Bottom nav active
  document.querySelectorAll('.bottom-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === id);
  });

  // Init screens
  if (id === 'booking') initBookingMap();
  if (id === 'history') renderHistory();
  if (id === 'profile') renderProfile();
  if (id === 'tracking') initTrackingMap();

  window.scrollTo(0,0);
}

/* ---- BOOKING MAP ---- */
function initBookingMap() {
  if (state.map) state.map.destroy();
  state.map = new CityMap('booking-map-canvas');
  if (state.pickupLoc)  state.map.setPickup(state.pickupLoc);
  if (state.dropoffLoc) state.map.setDropoff(state.dropoffLoc);
  renderVehicles();
  updateFare();
}

/* ---- AUTOCOMPLETE ---- */
function setupAutocomplete() {
  const pickupInput  = document.getElementById('pickup-input');
  const dropoffInput = document.getElementById('dropoff-input');
  const dropdown     = document.getElementById('autocomplete-list');

  function showDropdown(query, field) {
    state.focusField = field;
    const filtered = LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.area.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);
    if (!filtered.length || !query) { dropdown.classList.add('hidden'); return; }
    dropdown.innerHTML = filtered.map(l => `
      <div class="autocomplete-item" onclick="selectLocation(${LOCATIONS.indexOf(l)})">
        <div class="autocomplete-icon">📍</div>
        <div><div class="autocomplete-name">${l.name}</div><div class="autocomplete-area">${l.area}</div></div>
      </div>`).join('');
    dropdown.classList.remove('hidden');
  }

  pickupInput.addEventListener('input',  e => showDropdown(e.target.value, 'pickup'));
  dropoffInput.addEventListener('input', e => showDropdown(e.target.value, 'dropoff'));
  pickupInput.addEventListener('focus',  () => { state.focusField='pickup'; });
  dropoffInput.addEventListener('focus', () => { state.focusField='dropoff'; });
  document.addEventListener('click', e => {
    if (!e.target.closest('#autocomplete-list') && !e.target.closest('.loc-input'))
      dropdown.classList.add('hidden');
  });
}

function selectLocation(idx) {
  const loc = LOCATIONS[idx];
  const dropdown = document.getElementById('autocomplete-list');
  dropdown.classList.add('hidden');
  if (state.focusField === 'pickup') {
    state.pickupLoc = loc;
    document.getElementById('pickup-input').value = `${loc.name}, ${loc.area}`;
    if (state.map) state.map.setPickup(loc);
    toast('Pickup set', loc.name, 'success');
  } else {
    state.dropoffLoc = loc;
    document.getElementById('dropoff-input').value = `${loc.name}, ${loc.area}`;
    if (state.map) state.map.setDropoff(loc);
    toast('Drop set', loc.name, 'info');
  }
  updateFare();
}

function swapLocations() {
  const tmp = state.pickupLoc;
  state.pickupLoc  = state.dropoffLoc;
  state.dropoffLoc = tmp;
  document.getElementById('pickup-input').value  = state.pickupLoc  ? `${state.pickupLoc.name}, ${state.pickupLoc.area}`   : '';
  document.getElementById('dropoff-input').value = state.dropoffLoc ? `${state.dropoffLoc.name}, ${state.dropoffLoc.area}` : '';
  if (state.map) {
    if (state.pickupLoc)  state.map.setPickup(state.pickupLoc);
    if (state.dropoffLoc) state.map.setDropoff(state.dropoffLoc);
  }
  updateFare();
}

/* ---- VEHICLE RENDER ---- */
function renderVehicles() {
  const container = document.getElementById('vehicle-options');
  container.innerHTML = VEHICLES.map(v => `
    <div class="vehicle-option ${state.selectedVehicle===v.id?'selected':''}" onclick="selectVehicle('${v.id}')" id="vo-${v.id}">
      <span class="vehicle-option-icon">${v.emoji}</span>
      <div class="vehicle-option-info">
        <div class="vehicle-option-name">${v.name}</div>
        <div class="vehicle-option-desc">${v.desc} · ${v.seats} seats</div>
      </div>
      <div class="vehicle-option-price">
        <div class="vehicle-option-amount" id="vp-${v.id}">₹–</div>
        <div class="vehicle-option-eta text-green">${v.eta}</div>
      </div>
    </div>`).join('');
  updateFare();
}

function selectVehicle(id) {
  state.selectedVehicle = id;
  document.querySelectorAll('.vehicle-option').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('vo-'+id);
  if (el) el.classList.add('selected');
  updateFare();
}

function calcFare(v) {
  if (!state.pickupLoc || !state.dropoffLoc) return null;
  const dx = (state.pickupLoc.mx - state.dropoffLoc.mx);
  const dy = (state.pickupLoc.my - state.dropoffLoc.my);
  const dist = Math.sqrt(dx*dx+dy*dy) * 60;
  return { dist: dist.toFixed(1), fare: Math.round(v.base + dist * v.perKm), time: Math.round(dist * 2.8 + 5) };
}

function updateFare() {
  VEHICLES.forEach(v => {
    const info = calcFare(v);
    const el = document.getElementById('vp-'+v.id);
    if (el) el.textContent = info ? `₹${info.fare}` : '₹–';
  });

  const veh = VEHICLES.find(v => v.id === state.selectedVehicle);
  const info = calcFare(veh);
  const summary = document.getElementById('fare-summary');
  if (!summary) return;
  if (!info) {
    summary.innerHTML = '<div class="text-muted text-sm text-center" style="padding:8px">Enter pickup & drop to see fare estimate</div>';
    return;
  }
  summary.innerHTML = `
    <div class="fare-row"><span>Distance</span><span>${info.dist} km</span></div>
    <div class="fare-row"><span>Base fare</span><span>₹${veh.base}</span></div>
    <div class="fare-row"><span>Per km (${info.dist} km)</span><span>₹${Math.round(info.dist*veh.perKm)}</span></div>
    <div class="fare-row"><span class="text-muted">Est. time</span><span class="text-muted">${info.time} min</span></div>
    <div class="fare-row total"><span>Total Fare</span><span class="text-primary">₹${info.fare}</span></div>`;
}

/* ---- CONFIRM BOOKING ---- */
function confirmBooking() {
  if (!state.pickupLoc || !state.dropoffLoc) {
    toast('Missing locations','Please set pickup and drop locations','error');
    const btn = document.getElementById('btn-confirm');
    btn.classList.add('anim-shake');
    setTimeout(()=>btn.classList.remove('anim-shake'),500);
    return;
  }
  if (state.pickupLoc === state.dropoffLoc) {
    toast('Same location','Pickup and drop cannot be the same','error'); return;
  }
  // Show payment modal
  showModal('modal-payment');
  setTimeout(() => { hideModal('modal-payment'); startMatching(); }, 2000);
}

/* ---- MATCHING ---- */
function startMatching() {
  navigate('matching');
  state.currentDriver = DRIVERS[Math.floor(Math.random()*DRIVERS.length)];
  document.getElementById('driver-found').classList.add('hidden');
  document.getElementById('matching-searching').classList.remove('hidden');
  setTimeout(() => revealDriver(), 3500);
}

function revealDriver() {
  const d = state.currentDriver;
  const veh = VEHICLES.find(v => v.id === state.selectedVehicle);
  const info = calcFare(veh);

  document.getElementById('matching-searching').classList.add('hidden');
  const found = document.getElementById('driver-found');
  found.classList.remove('hidden');

  document.getElementById('df-avatar').textContent  = d.initials;
  document.getElementById('df-avatar').style.background = `linear-gradient(135deg,${d.color},#00D4FF)`;
  document.getElementById('df-name').textContent    = d.name;
  document.getElementById('df-rating').textContent  = `⭐ ${d.rating}`;
  document.getElementById('df-trips').textContent   = `${d.trips.toLocaleString()} trips`;
  document.getElementById('df-car').textContent     = d.vehicle;
  document.getElementById('df-plate').textContent   = d.plate;
  document.getElementById('df-eta').textContent     = `${d.etaMin} min`;
  document.getElementById('df-fare').textContent    = info ? `₹${info.fare}` : '₹–';
  document.getElementById('df-dist').textContent    = info ? `${info.dist} km` : '–';
  toast('Driver found!', `${d.name} is on the way`, 'success');
}

/* ---- TRACKING ---- */
function initTrackingMap() {
  if (state.trackMap) state.trackMap.destroy();
  state.trackMap = new CityMap('tracking-map-canvas');
  if (state.pickupLoc)  state.trackMap.setPickup(state.pickupLoc);
  if (state.dropoffLoc) state.trackMap.setDropoff(state.dropoffLoc);

  // Populate driver info bar
  const d = state.currentDriver || DRIVERS[0];
  document.getElementById('tr-driver-name').textContent = d.name;
  document.getElementById('tr-driver-car').textContent  = `${d.vehicle} · ${d.plate}`;
  document.getElementById('tr-avatar').textContent = d.initials;
  document.getElementById('tr-avatar').style.background = `linear-gradient(135deg,${d.color},#00D4FF)`;

  const veh  = VEHICLES.find(v => v.id === state.selectedVehicle);
  const info = calcFare(veh);
  document.getElementById('tr-eta').textContent  = info ? `${info.time} min`  : '–';
  document.getElementById('tr-dist').textContent = info ? `${info.dist} km`   : '–';
  document.getElementById('tr-fare').textContent = info ? `₹${info.fare}` : '–';

  // Start trip stages
  state.tripStage = 0;
  setStage(0);
  const stageTimes = [0, 3500, 6000, 9000];
  stageTimes.forEach((t,i) => setTimeout(()=>{ setStage(i); if(i===2&&state.trackMap) state.trackMap.startTrip(()=>{}); }, t));
  setTimeout(tripComplete, 14000);
}

function setStage(i) {
  state.tripStage = i;
  document.querySelectorAll('.trip-stage').forEach((el,idx) => {
    el.classList.toggle('active', idx === i);
    el.classList.toggle('done',   idx < i);
  });
  const labels = ['Driver En Route','Driver Arrived','Trip Started','Completed'];
  const statusEl = document.getElementById('tr-status');
  if (statusEl) statusEl.textContent = labels[i] || '';
}

function tripComplete() {
  navigate('history');
  showModal('modal-trip-complete');
  const veh  = VEHICLES.find(v=>v.id===state.selectedVehicle);
  const info = calcFare(veh);
  const d    = state.currentDriver || DRIVERS[0];
  document.getElementById('tc-driver').textContent = d.name;
  document.getElementById('tc-from').textContent   = state.pickupLoc?.name  || '–';
  document.getElementById('tc-to').textContent     = state.dropoffLoc?.name || '–';
  document.getElementById('tc-fare').textContent   = info ? `₹${info.fare}` : '₹–';
  document.getElementById('tc-dist').textContent   = info ? `${info.dist} km` : '–';
  state.starRating = 0;
  document.querySelectorAll('.star-btn').forEach(s=>s.classList.remove('selected'));
  renderHistory();
  toast('Trip complete!','Hope you had a great ride 🎉','success');
}

/* ---- HISTORY ---- */
function renderHistory() {
  const filter = state.rideFilter;
  const list   = document.getElementById('rides-list');
  const rides  = filter==='all' ? HISTORY : HISTORY.filter(r=>r.status===filter);
  if (!list) return;
  list.innerHTML = rides.map(r => `
    <div class="ride-card" onclick="void(0)">
      <div class="ride-icon">${VEHICLES.find(v=>v.id===r.veh.toLowerCase())?.emoji||'🚗'}</div>
      <div class="ride-body">
        <div class="ride-route">
          <span class="ride-route-from">${r.from}</span>
          <span class="ride-route-arrow">→</span>
          <span class="ride-route-to">${r.to}</span>
        </div>
        <div class="ride-meta">
          <span>${r.date}</span>
          <span>•</span>
          <span>${r.dist} km</span>
          <span>•</span>
          <span>${r.dur} min</span>
          <span>•</span>
          <span class="badge ${r.status==='completed'?'badge-green':'badge-red'}">${r.status}</span>
        </div>
        ${r.star?`<div class="ride-stars">${'⭐'.repeat(r.star)}</div>`:''}
      </div>
      <div class="ride-price text-primary">₹${r.fare}</div>
    </div>`).join('');
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
}

function setFilter(f) { state.rideFilter=f; renderHistory(); }

/* ---- PROFILE ---- */
function renderProfile() {
  const el = id => document.getElementById(id);
  if(el('p-name'))    el('p-name').textContent    = USER.name;
  if(el('p-email'))   el('p-email').textContent   = USER.email;
  if(el('p-wallet'))  el('p-wallet').textContent  = `₹${USER.wallet.toLocaleString()}`;
  if(el('p-rides'))   el('p-rides').textContent   = USER.rides;
  if(el('p-km'))      el('p-km').textContent      = USER.km;
  if(el('p-saved'))   el('p-saved').textContent   = `₹${USER.saved.toLocaleString()}`;
  if(el('p-initials'))el('p-initials').textContent= USER.initials;
}

/* ---- HERO MAP ---- */
function initHeroMap() {
  const canvas = document.getElementById('hero-map-canvas');
  if (!canvas) return;
  const map = new CityMap('hero-map-canvas');
  setTimeout(()=>{ map.setPickup(LOCATIONS[0]); map.setDropoff(LOCATIONS[3]); }, 500);
}

/* ---- MODALS ---- */
function showModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id)?.classList.add('hidden'); }

function setStarRating(n) {
  state.starRating = n;
  document.querySelectorAll('.star-btn').forEach((s,i)=>s.classList.toggle('selected',i<n));
}

function submitRating() {
  hideModal('modal-trip-complete');
  if (state.starRating) toast(`Rated ${state.starRating} ⭐`, 'Thanks for your feedback!', 'success');
  else toast('Skipped rating', '', 'info');
}

/* ---- NAVBAR SCROLL ---- */
function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));
}

/* ---- QUICK BOOK LANDING ---- */
function quickBook() {
  const pVal = document.getElementById('qb-pickup').value.trim();
  const dVal = document.getElementById('qb-drop').value.trim();
  navigate('booking');
  if (pVal) { const match = LOCATIONS.find(l=>l.name.toLowerCase().includes(pVal.toLowerCase())); if(match){ state.pickupLoc=match; document.getElementById('pickup-input').value=`${match.name}, ${match.area}`; } }
  if (dVal) { const match = LOCATIONS.find(l=>l.name.toLowerCase().includes(dVal.toLowerCase())); if(match){ state.dropoffLoc=match; document.getElementById('dropoff-input').value=`${match.name}, ${match.area}`; } }
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  navigate('landing');
  setupAutocomplete();
  initNavbarScroll();
  initHeroMap();

  // Bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.screen));
  });

  // Navbar links
  document.querySelectorAll('.navbar-link[data-screen]').forEach(link => {
    link.addEventListener('click', () => navigate(link.dataset.screen));
  });

  // Scroll-triggered stat counters
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(el => {
          const target = parseInt(el.dataset.count);
          let curr = 0; const step = target/60;
          const t = setInterval(()=>{ curr=Math.min(curr+step,target); el.textContent=Math.floor(curr).toLocaleString()+(el.dataset.suffix||''); if(curr>=target) clearInterval(t); }, 20);
        });
        observer.unobserve(e.target);
      }
    });
  }, { threshold:0.3 });
  const statsRow = document.getElementById('stats-row');
  if (statsRow) observer.observe(statsRow);
});
