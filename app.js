// app.js

let siteData = null;
let detailStack = [];

/* ── Particles ── */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize(); window.addEventListener('resize', resize);
  class P {
    constructor(init) { this.reset(init); }
    reset(init=false) {
      this.x=Math.random()*canvas.width; this.y=init?Math.random()*canvas.height:canvas.height+6;
      this.r=Math.random()*1.8+0.3; this.vx=(Math.random()-0.5)*0.25; this.vy=-(Math.random()*0.55+0.18);
      this.a=Math.random()*0.5+0.12; this.life=0; this.max=Math.random()*220+80; this.gold=Math.random()>0.28;
    }
    update(){ this.x+=this.vx; this.y+=this.vy; this.life++; if(this.y<-8||this.life>this.max) this.reset(); }
    draw(){
      const t=this.life/this.max, fade=t<0.12?t/0.12:t>0.75?(1-t)/0.25:1;
      ctx.save(); ctx.globalAlpha=this.a*fade;
      ctx.fillStyle=this.gold?`hsl(42,65%,62%)`:`hsl(0,75%,58%)`;
      ctx.shadowBlur=this.r*5; ctx.shadowColor=this.gold?`hsl(42,70%,50%)`:`hsl(0,80%,45%)`;
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
  }
  const ps = Array.from({length:70},(_,i)=>new P(i<50));
  (function loop(){ ctx.clearRect(0,0,canvas.width,canvas.height); ps.forEach(p=>{p.update();p.draw();}); requestAnimationFrame(loop); })();
}

/* ── Navbar ── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', ()=>nav.classList.toggle('scrolled', window.scrollY>50), {passive:true});
}
function toggleNav() {
  document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}
function closeNav() {
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

/* ── Scroll Reveal ── */
function initScrollReveal() {
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      setTimeout(()=>e.target.classList.add('visible'), parseInt(e.target.dataset.delay||'0'));
      obs.unobserve(e.target);
    });
  },{threshold:0.08});
  document.querySelectorAll('.announcement-card,.character-card,.order-ranked-card,.clue-card,.patchnote-card')
    .forEach((el,i)=>{ el.dataset.delay=(i%5)*90; obs.observe(el); });
}

/* ── Announcements ── */
function catClass(c){ return c==='重大公告'?'cat-major':c==='活動'?'cat-event':'cat-general'; }
function renderAnnouncements(list) {
  const el = document.getElementById('announcements-grid');
  const sorted = [...list].sort((a,b)=>{ if(a.pinned!==b.pinned) return a.pinned?-1:1; return new Date(b.date)-new Date(a.date); });
  el.innerHTML = sorted.map(a=>`
    <article class="announcement-card${a.pinned?' pinned':''}">
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      ${a.pinned?'<div class="pinned-badge">置頂</div>':''}
      <div class="card-meta">
        <span class="card-category ${catClass(a.category)}">${a.category}</span>
        <span class="card-date">${a.date.replace(/-/g,' / ')}</span>
      </div>
      <h3 class="card-title">${a.title}</h3>
      <p class="card-content">${a.content}</p>
      <a href="#" class="card-link" onclick="return false">閱讀全文</a>
    </article>`).join('');
}

/* ── World Map ── */
function renderWorldMap(map) {
  const el = document.getElementById('map-container');
  if (!el) return;
  if (map && map.image) {
    el.innerHTML = `
      <div class="map-wrap" onclick="openMapLightbox('${map.image}')">
        <img src="${map.image}" alt="${map.caption||'大陸地圖'}" class="map-img">
      </div>
      <div class="map-caption">${map.caption||'格蘭大陸全圖'}</div>`;
  } else {
    el.innerHTML = `<div class="map-placeholder"><span style="font-size:4rem;opacity:0.15">🗺️</span><p>管理員尚未上傳地圖</p></div>`;
  }
}

/* ── Patch Notes ── */
function renderPatchNotes(list) {
  const el = document.getElementById('patchnotes-list');
  if (!el) return;
  if (!list.length) { el.innerHTML='<p style="text-align:center;color:var(--stone);font-family:var(--font-heading);letter-spacing:0.15em">暫無改版資訊</p>'; return; }
  el.innerHTML = list.map(n=>`
    <div class="patchnote-card" onclick="openDetail('patchnote',${n.id})">
      <div class="patchnote-card-inner">
        <span class="version-badge">${n.version}</span>
        <div class="patchnote-text">
          <div class="patchnote-title">${n.title}</div>
          <div class="patchnote-summary">${n.summary}</div>
        </div>
        <div class="patchnote-date">${n.date}</div>
        <div class="patchnote-arrow">→</div>
      </div>
    </div>`).join('');
}

/* ── Characters ── */
function renderCharacters(list) {
  const el = document.getElementById('characters-grid');
  if (!el) return;
  el.innerHTML = list.map(c=>{
    const portrait = c.image
      ? `<img src="${c.image}" alt="${c.name}">`
      : `<div class="character-portrait-placeholder"><span class="char-icon">${c.icon||'⚔️'}</span></div>`;
    return `
      <article class="character-card" onclick="openDetail('character',${c.id})">
        <div class="character-portrait">${portrait}</div>
        <div class="character-info">
          <h3 class="character-name">${c.name}</h3>
          <p class="character-title-tag">${c.title}</p>
          <div class="character-badges">
            ${c.class?`<span class="character-badge">${c.class}</span>`:''}
            ${c.race?`<span class="character-badge">${c.race}</span>`:''}
          </div>
          <p class="character-desc">${c.summary||c.description}</p>
        </div>
      </article>`;
  }).join('');
}

/* ── Knight Orders ── */
function renderOrders(list) {
  const el = document.getElementById('orders-list');
  if (!el) return;
  const sorted = [...list].sort((a,b)=>a.rank-b.rank);
  el.innerHTML = sorted.map(o=>{
    const rc = o.rank<=3?`rank-${o.rank}`:'rank-other';
    const badge = o.badge
      ? `<img src="${o.badge}" class="order-badge-img" alt="${o.name}">`
      : `<span class="order-badge-emoji">${o.icon||'🏰'}</span>`;
    return `
      <div class="order-ranked-card ${rc}" onclick="openDetail('order',${o.id})">
        <div class="order-rank-col"><div class="rank-num">${o.rank}</div></div>
        <div class="order-badge-col">${badge}</div>
        <div class="order-info-col">
          <div class="order-ranked-name">${o.name}</div>
          <div class="order-ranked-motto">${o.motto}</div>
          <div class="order-ranked-desc">${o.description.split('\n')[0]}</div>
          <div class="order-member-count">⚔ ${(o.members||[]).length} 名成員</div>
        </div>
        <div class="order-arrow-col">→</div>
      </div>`;
  }).join('');
}

/* ── Clues ── */
function renderClues(list) {
  const el = document.getElementById('clues-grid');
  if (!el) return;
  if (!list.length) { el.innerHTML='<p style="text-align:center;color:var(--stone);font-family:var(--font-heading);letter-spacing:0.15em">暫無線索</p>'; return; }
  el.innerHTML = list.map(c=>{
    const img = c.image
      ? `<img src="${c.image}" alt="${c.title}">`
      : `<div class="clue-img-placeholder">🔍</div>`;
    return `
      <div class="clue-card" onclick="openDetail('clue',${c.id})">
        <div class="clue-img-wrap">${img}</div>
        <div class="clue-info">
          <div class="clue-title">${c.title}</div>
          <div class="clue-desc">${c.description}</div>
        </div>
      </div>`;
  }).join('');
}

/* ── Detail Panel ── */
function openDetail(type, id, extra={}) {
  detailStack = [{type, id, extra}];
  renderDetail();
  document.getElementById('detail-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function pushDetail(type, id, extra={}) {
  detailStack.push({type, id, extra});
  renderDetail();
}
function popDetail() {
  detailStack.pop();
  if (detailStack.length===0) closeDetail(); else renderDetail();
}
function closeDetail() {
  detailStack = [];
  document.getElementById('detail-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function handleDetailOverlayClick(e) { if(e.target.id==='detail-overlay') closeDetail(); }

function renderDetail() {
  const {type, id, extra} = detailStack[detailStack.length-1];
  const hasBack = detailStack.length > 1;
  let html = '';

  if (type === 'character') {
    const c = siteData.characters.find(x=>x.id===id);
    if (c) {
      const portrait = c.image
        ? `<div class="detail-hero-img"><img src="${c.image}" alt="${c.name}"></div>`
        : `<div class="detail-portrait-placeholder">${c.icon||'⚔️'}</div>`;
      html = `${portrait}<div class="detail-body">
        <div class="detail-badges">
          ${c.class?`<span class="character-badge">${c.class}</span>`:''}
          ${c.race?`<span class="character-badge">${c.race}</span>`:''}
        </div>
        <h1 class="detail-name">${c.name}</h1>
        <p class="detail-title-tag">${c.title}</p>
        <div class="detail-divider"></div>
        <div class="detail-article">${(c.description||'').replace(/\n/g,'<br>')}</div>
      </div>`;
    }
  } else if (type === 'patchnote') {
    const n = siteData.patchNotes.find(x=>x.id===id);
    if (n) html = `<div class="detail-body">
      <div class="detail-version-header">
        <span class="version-badge-large">${n.version}</span>
        <span class="version-date-large">${n.date}</span>
      </div>
      <h1 class="detail-name">${n.title}</h1>
      <div class="detail-divider"></div>
      <div class="detail-article">${(n.content||'').replace(/\n/g,'<br>')}</div>
    </div>`;
  } else if (type === 'order') {
    const o = siteData.knightOrders.find(x=>x.id===id);
    if (o) {
      const badge = o.badge
        ? `<img src="${o.badge}" class="detail-badge-img" alt="${o.name}">`
        : `<div class="detail-badge-placeholder">${o.icon||'🏰'}</div>`;
      const rankColors = {1:'#c9a84c', 2:'#a8aab5', 3:'#cd7f32'};
      const rc = rankColors[o.rank]||'var(--stone)';
      const mems = (o.members||[]).map(m=>`
        <div class="member-card" onclick="event.stopPropagation();pushDetail('member',${m.id},{orderId:${o.id}})">
          ${m.image?`<img src="${m.image}" class="member-avatar" alt="${m.name}">`:`<div class="member-avatar-placeholder">${m.name.charAt(0)}</div>`}
          <div class="member-info">
            <div class="member-name">${m.name}</div>
            <div class="member-role">${[m.role,m.class].filter(Boolean).join(' · ')}</div>
          </div>
          <span class="member-arrow">→</span>
        </div>`).join('');
      html = `
        <div class="detail-order-header">
          ${badge}
          <div>
            <div class="order-rank-display" style="color:${rc}">騎士團排名 第 ${o.rank} 位</div>
            <h1 class="detail-name">${o.name}</h1>
            <p class="detail-title-tag">${o.founding}</p>
          </div>
        </div>
        <div class="detail-body">
          <p class="order-motto-display">${o.motto}</p>
          <div class="detail-divider"></div>
          <div class="detail-article">${(o.description||'').replace(/\n/g,'<br>')}</div>
          <div class="detail-divider"></div>
          <h2 class="detail-section-title">成員名單 (${(o.members||[]).length})</h2>
          <div class="members-list">${mems||'<p style="color:var(--stone);font-size:0.9rem">尚無成員資料</p>'}</div>
        </div>`;
    }
  } else if (type === 'member') {
    const o = siteData.knightOrders.find(x=>x.id===extra.orderId);
    const m = o?.members?.find(x=>x.id===id);
    if (m) {
      const portrait = m.image
        ? `<div class="detail-hero-img"><img src="${m.image}" alt="${m.name}"></div>`
        : `<div class="detail-portrait-placeholder">${m.name.charAt(0)||'?'}</div>`;
      html = `${portrait}<div class="detail-body">
        <div class="detail-badges">
          ${o?`<span class="character-badge">${o.name}</span>`:''}
          ${m.role?`<span class="character-badge">${m.role}</span>`:''}
          ${m.class?`<span class="character-badge">${m.class}</span>`:''}
        </div>
        <h1 class="detail-name">${m.name}</h1>
        <div class="detail-divider"></div>
        <div class="detail-article">${(m.description||'').replace(/\n/g,'<br>')}</div>
      </div>`;
    }
  } else if (type === 'clue') {
    const c = siteData.clues.find(x=>x.id===id);
    if (c) html = `
      ${c.image?`<img src="${c.image}" class="detail-clue-img" alt="${c.title}">`:''}
      <div class="detail-body">
        <h1 class="detail-name">${c.title}</h1>
        <div class="detail-divider"></div>
        <div class="detail-article">${(c.description||'').replace(/\n/g,'<br>')}</div>
      </div>`;
  }

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-nav-bar">
      ${hasBack?`<button class="detail-back-btn" onclick="popDetail()">← 返回</button>`:'<div></div>'}
      <button class="detail-close-btn" onclick="closeDetail()">✕</button>
    </div>
    ${html}`;
}

/* ── Map Lightbox ── */
function openMapLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('map-lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMapLightbox() {
  document.getElementById('map-lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Static Texts ── */
function fillStaticTexts(s) {
  const g = id => document.getElementById(id);
  if (g('hero-subtitle'))  g('hero-subtitle').textContent  = s.description;
  if (g('footer-tagline')) g('footer-tagline').textContent = s.tagline;
  if (g('footer-copy'))    g('footer-copy').textContent    = `© ${s.year} ${s.title} 官方公告`;
  document.title = `${s.title} — ${s.subtitle}`;
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  initNavbar();
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('無法載入 data.json');
    siteData = await res.json();
    fillStaticTexts(siteData.site);
    renderWorldMap(siteData.worldMap || {});
    renderPatchNotes(siteData.patchNotes || []);
    renderAnnouncements(siteData.announcements || []);
    renderCharacters(siteData.characters || []);
    renderOrders(siteData.knightOrders || []);
    renderClues(siteData.clues || []);
    setTimeout(initScrollReveal, 120);
  } catch(err) {
    console.error('載入失敗:', err);
  }
});
