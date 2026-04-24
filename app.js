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
  document.querySelectorAll('.announcement-card,.character-card,.order-ranked-card,.clue-card,.patchnote-card,.region-accordion-item,.report-card,.note-card,.comp-tile')
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

/* ── World Maps ── */
function renderWorldMaps(list) {
  const el = document.getElementById('map-container');
  if (!el) return;
  const maps = (list||[]).filter(m=>m.image);
  if (!maps.length) {
    el.innerHTML = `<div class="map-placeholder"><span style="font-size:4rem;opacity:0.15">🗺️</span><p>管理員尚未上傳地圖</p></div>`;
    return;
  }
  el.innerHTML = `<div class="maps-grid">${maps.map(m=>`
    <div class="map-card" onclick="openMapLightbox('${m.image}')">
      <div class="map-card-wrap"><img src="${m.image}" alt="${m.name}" class="map-card-img"><div class="map-card-dimmer"></div></div>
      <div class="map-card-foot">
        <span class="map-card-name">${m.name}</span>
        ${m.caption?`<span class="map-card-caption">${m.caption}</span>`:''}
      </div>
    </div>`).join('')}</div>`;
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
function charCardHtml(c) {
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
}
function charCompactHtml(c) {
  const av = c.image
    ? `<img src="${c.image}" alt="${c.name}">`
    : `<div class="chr-mini-avatar-ph">${c.name.charAt(0)}</div>`;
  return `
    <div class="chr-mini-card" onclick="openDetail('character',${c.id})">
      <div class="chr-mini-avatar">${av}</div>
      <div class="chr-mini-name">${c.name}</div>
      ${c.title?`<div class="chr-mini-title">${c.title}</div>`:''}
    </div>`;
}
function renderCharacters(list, regions) {
  const el = document.getElementById('characters-grid');
  if (!el) return;
  if (regions && regions.length) {
    el.className = 'region-accordion';
    const regionMap = {};
    regions.forEach(r => { regionMap[r.id] = []; });
    list.forEach(c => { if (c.regionId && regionMap[c.regionId]) regionMap[c.regionId].push(c); });
    el.innerHTML = regions.map(r => {
      const rc = regionMap[r.id]||[];
      const inner = rc.length
        ? `<div class="chr-compact-grid">${rc.map(c=>charCompactHtml(c)).join('')}</div>`
        : `<p class="acc-empty">此地區尚無角色</p>`;
      return `
        <div class="region-accordion-item" id="racc-${r.id}">
          <div class="region-acc-header" onclick="toggleRegion(${r.id})">
            ${r.image?`<div class="region-acc-banner"><img src="${r.image}" alt="${r.name}"><div class="region-acc-dimmer"></div></div>`:''}
            <div class="region-acc-info">
              ${r.image?`<img src="${r.image}" class="reg-acc-circ" alt="${r.name}">`:`<div class="reg-acc-circ ph">${r.name.charAt(0)}</div>`}
              <div>
                <div class="region-acc-name">${r.name}</div>
                ${r.description?`<div class="region-acc-sub">${r.description}</div>`:''}
              </div>
              <span class="region-acc-count">${rc.length} 名角色</span>
            </div>
            <div class="region-acc-arrow">▼</div>
          </div>
          <div class="region-acc-body"><div>${inner}</div></div>
        </div>`;
    }).join('');
  } else {
    el.className = 'characters-grid';
    el.innerHTML = list.map(c => charCardHtml(c)).join('');
  }
}
function toggleRegion(id) {
  const item = document.getElementById('racc-'+id);
  if (!item) return;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.region-accordion-item.open').forEach(el=>el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

/* ── Knight Orders ── */
function circ(src, name, cls) {
  return src
    ? `<img src="${src}" class="${cls}" alt="${name}">`
    : `<div class="${cls} ph">${name.charAt(0)}</div>`;
}
function orgCatHtml(o, allOrgs) {
  const children = [...allOrgs].filter(s=>s.parentId===o.id).sort((a,b)=>a.rank-b.rank);
  const hasKids = children.length > 0;
  const icon = circ(o.badge, o.name, 'org-circ');
  const subHtml = hasKids ? `
    <div class="org-cat-body"><div>
      <div class="sub-org-list">${children.map(s=>`
        <div class="sub-org-item" onclick="openDetail('order',${s.id})">
          <div class="sub-rank">${s.rank}</div>
          ${circ(s.badge, s.name, 'sub-circ')}
          <div class="sub-org-info">
            <div class="sub-org-name">${s.name}</div>
            ${s.motto?`<div class="sub-org-motto">${s.motto}</div>`:''}
            <div class="sub-org-meta">⚔ ${(s.members||[]).length} 名成員</div>
          </div>
          <div class="sub-org-arrow">›</div>
        </div>`).join('')}
      </div>
    </div></div>` : '';
  return `
    <div class="org-cat-item${hasKids?' has-kids':''}" id="orgcat-${o.id}">
      <div class="org-cat-header" onclick="${hasKids?`toggleOrgCat(${o.id})`:`openDetail('order',${o.id})`}">
        ${icon}
        <div class="org-cat-info">
          <div class="org-cat-name">${o.name}</div>
          ${o.motto?`<div class="org-cat-motto">${o.motto}</div>`:''}
        </div>
        <div class="org-cat-arr">${hasKids?'▼':'›'}</div>
      </div>
      ${subHtml}
    </div>`;
}
function renderOrders(list, regions) {
  const el = document.getElementById('orders-list');
  if (!el) return;
  if (regions && regions.length) {
    el.className = 'region-accordion';
    const regionMap = {};
    regions.forEach(r => { regionMap[r.id] = []; });
    const noRegion = [];
    list.forEach(o => {
      if (o.regionId && regionMap[o.regionId]) regionMap[o.regionId].push(o);
      else if (!o.parentId) noRegion.push(o);
    });
    function regionBlock(r, topOrgs, idSuffix) {
      const inner = topOrgs.length
        ? `<div class="org-cat-list">${topOrgs.map(o=>orgCatHtml(o,list)).join('')}</div>`
        : `<p class="acc-empty">此地區尚無組織</p>`;
      const rIcon = circ(r.image, r.name, 'reg-acc-circ');
      return `
        <div class="region-accordion-item" id="oacc-${idSuffix}">
          <div class="region-acc-header" onclick="toggleOrgRegion(${idSuffix})">
            ${r.image?`<div class="region-acc-banner"><img src="${r.image}" alt="${r.name}"><div class="region-acc-dimmer"></div></div>`:''}
            <div class="region-acc-info">
              ${rIcon}
              <div>
                <div class="region-acc-name">${r.name}</div>
                ${r.description?`<div class="region-acc-sub">${r.description}</div>`:''}
              </div>
              <span class="region-acc-count">${topOrgs.length} 個組織</span>
            </div>
            <div class="region-acc-arrow">▼</div>
          </div>
          <div class="region-acc-body"><div>${inner}</div></div>
        </div>`;
    }
    let html = regions.map(r => regionBlock(r, (regionMap[r.id]||[]).filter(o=>!o.parentId), r.id)).join('');
    if (noRegion.length) html += regionBlock({name:'未分類組織',image:''}, noRegion, 0);
    el.innerHTML = html;
  } else {
    el.className = 'org-cat-list';
    el.innerHTML = [...list].filter(o=>!o.parentId).sort((a,b)=>a.rank-b.rank).map(o=>orgCatHtml(o,list)).join('');
  }
}
function toggleOrgRegion(id) {
  const item = document.getElementById('oacc-'+id);
  if (!item) return;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('[id^="oacc-"].open').forEach(el=>el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}
function toggleOrgCat(id) {
  const item = document.getElementById('orgcat-'+id);
  if (!item) return;
  item.classList.toggle('open');
}

/* ── World Reports ── */
function renderWorldReports(list) {
  const el = document.getElementById('reports-grid');
  if (!el) return;
  if (!list.length) { el.innerHTML='<p style="text-align:center;color:var(--stone);font-family:var(--font-heading);letter-spacing:0.15em">暫無世界報導</p>'; return; }
  el.innerHTML = list.map(r=>`
    <div class="report-card" onclick="openDetail('report',${r.id})">
      ${r.image?`<div class="report-card-img"><img src="${r.image}" alt="${r.title}"></div>`:''}
      <div class="report-body">
        <div class="report-title">${r.title}</div>
        ${r.subtitle?`<div class="report-subtitle">${r.subtitle}</div>`:''}
        ${r.content?`<div class="report-excerpt">${r.content.replace(/\n/g,' ').substring(0,120)}…</div>`:''}
        ${r.date?`<div class="report-date">${r.date}</div>`:''}
      </div>
    </div>`).join('');
}

/* ── Compendium ── */
function renderCompendium(list) {
  const el = document.getElementById('compendium-container');
  if (!el) return;
  if (!list.length) { el.innerHTML='<p style="text-align:center;color:var(--stone);font-family:var(--font-heading);letter-spacing:0.15em">暫無圖鑑項目</p>'; return; }
  const cats = [...new Set(list.map(i=>i.category||'未分類'))];
  el.innerHTML = cats.map(cat => {
    const items = list.filter(i=>(i.category||'未分類')===cat);
    return `
      <div class="comp-group">
        <div class="comp-group-title">${cat}</div>
        <div class="comp-grid">${items.map(i=>{
          const tile = i.image
            ? `<img src="${i.image}" alt="${i.name}" class="comp-tile-img">`
            : `<div class="comp-tile-blank"></div>`;
          return `<div class="comp-tile" onclick="openDetail('item',${i.id})">
            ${tile}
            <div class="comp-tile-name">${i.name}</div>
          </div>`;
        }).join('')}</div>
      </div>`;
  }).join('');
}

/* ── Notes ── */
function renderNotes(list) {
  const el = document.getElementById('notes-grid');
  if (!el) return;
  if (!list.length) { el.innerHTML='<p style="text-align:center;color:var(--stone);font-family:var(--font-heading);letter-spacing:0.15em">暫無備註</p>'; return; }
  el.innerHTML = list.map(n=>`
    <div class="note-card">
      ${n.image?`<div class="note-img-wrap note-img-clickable" onclick="openMapLightbox('${n.image}')"><img src="${n.image}" alt="${n.title}" class="note-img"><div class="note-img-zoom">🔍</div></div>`:''}
      <div class="note-body">
        <div class="note-title">${n.title}</div>
        ${n.content?`<div class="note-content">${n.content.replace(/\n/g,'<br>')}</div>`:''}
      </div>
    </div>`).join('');
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

/* ── Role Color ── */
function roleClass(r) {
  if (!r) return 'role-member';
  if (/長$|長官|指揮|首領|領袖|隊長/.test(r)) return 'role-leader';
  if (/^副/.test(r)) return 'role-deputy';
  if (/核心|精英|菁英|特級|王牌/.test(r)) return 'role-core';
  return 'role-member';
}

/* ── Drag Scroll ── */
function initMemberSwipe(orderId, memberId) {
  const panel = document.querySelector('.detail-panel');
  if (!panel) return;
  let tx = 0;
  panel.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, {passive:true, once:true});
  panel.addEventListener('touchend', e => {
    const dx = tx - e.changedTouches[0].clientX;
    if (Math.abs(dx) < 50) return;
    const o = siteData.knightOrders.find(x=>x.id===orderId);
    if (!o?.members) return;
    const idx = o.members.findIndex(x=>x.id===memberId);
    if (dx > 0 && idx < o.members.length-1) replaceDetail('member', o.members[idx+1].id, {orderId});
    else if (dx < 0 && idx > 0) replaceDetail('member', o.members[idx-1].id, {orderId});
  }, {once:true});
}

function initDragScroll(el) {
  let down = false, startX, scrollLeft;
  el.addEventListener('mousedown', e => { down=true; el.classList.add('dragging'); startX=e.pageX-el.offsetLeft; scrollLeft=el.scrollLeft; });
  el.addEventListener('mouseleave', () => { down=false; el.classList.remove('dragging'); });
  el.addEventListener('mouseup',    () => { down=false; el.classList.remove('dragging'); });
  el.addEventListener('mousemove',  e => { if(!down) return; e.preventDefault(); el.scrollLeft = scrollLeft-(e.pageX-el.offsetLeft-startX)*1.4; });
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
function replaceDetail(type, id, extra={}) {
  detailStack[detailStack.length-1] = {type, id, extra};
  renderDetail();
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
  let html = ''; let midNav = '';

  if (type === 'character') {
    const c = siteData.characters.find(x=>x.id===id);
    if (c) {
      const portrait = c.image
        ? `<div class="detail-hero-img"><img src="${c.image}" alt="${c.name}"></div>`
        : `<div class="detail-portrait-placeholder">${c.icon||'⚔️'}</div>`;
      const relHtml = (c.relations||[]).length ? `
        <div class="detail-divider"></div>
        <h2 class="detail-section-title">好感度</h2>
        <div class="rel-list">
          ${(c.relations||[]).map(r=>{
            const v=Math.max(-5,Math.min(5,r.affinity||0));
            const hearts = v>0
              ? `<span class="rel-hearts pos">${'♥'.repeat(v)}</span>`
              : v<0
              ? `<span class="rel-hearts neg">${'♥'.repeat(Math.abs(v))}</span>`
              : `<span class="rel-neutral">—</span>`;
            return `<div class="rel-row-disp"><span class="rel-target">${r.target||''}</span>${hearts}</div>`;
          }).join('')}
        </div>` : '';
      html = `${portrait}<div class="detail-body">
        <div class="detail-badges">
          ${c.class?`<span class="character-badge">${c.class}</span>`:''}
          ${c.race?`<span class="character-badge">${c.race}</span>`:''}
        </div>
        <h1 class="detail-name">${c.name}</h1>
        <p class="detail-title-tag">${c.title}</p>
        <div class="detail-divider"></div>
        <div class="detail-article">${(c.description||'').replace(/\n/g,'<br>')}</div>
        ${relHtml}
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
          <div class="member-name">${m.name}</div>
          <div class="member-role-badge ${roleClass(m.role)}">${m.role||'成員'}</div>
          ${m.class?`<div class="member-class-tag">${m.class}</div>`:''}
        </div>`).join('');
      const subOrgs = (siteData.knightOrders||[]).filter(s=>s.parentId===o.id);
      const subOrgsHtml = subOrgs.length ? `
        <div class="detail-divider"></div>
        <h2 class="detail-section-title">下屬組織 (${subOrgs.length})</h2>
        <div class="suborgs-list">${subOrgs.map(s=>`
          <div class="suborg-card" onclick="pushDetail('order',${s.id})">
            <span class="suborg-icon">${s.icon||'🏰'}</span>
            <div class="suborg-info">
              <div class="suborg-name">${s.name}</div>
              <div class="suborg-meta">${(s.members||[]).length} 名成員${s.motto?' · '+s.motto:''}</div>
            </div>
            <span class="suborg-arrow">›</span>
          </div>`).join('')}
        </div>` : '';
      html = `
        <div class="detail-order-header">
          ${badge}
          <div>
            ${!o.parentId?`<div class="order-rank-display" style="color:${rc}">排名 第 ${o.rank} 位</div>`:''}
            <h1 class="detail-name">${o.name}</h1>
            ${o.founding?`<p class="detail-title-tag">創立 ${o.founding}</p>`:''}
          </div>
        </div>
        <div class="detail-body">
          ${o.motto?`<p class="order-motto-display">${o.motto}</p>`:''}
          <div class="detail-divider"></div>
          <div class="detail-article">${(o.description||'').replace(/\n/g,'<br>')}</div>
          ${subOrgsHtml}
          <div class="detail-divider"></div>
          <h2 class="detail-section-title">成員名單 (${(o.members||[]).length})</h2>
          <div class="members-scroll" id="ms-${o.id}">${mems||'<p style="color:var(--stone);font-size:0.9rem">尚無成員資料</p>'}</div>
        </div>`;
    }
  } else if (type === 'member') {
    const o = siteData.knightOrders.find(x=>x.id===extra.orderId);
    const m = o?.members?.find(x=>x.id===id);
    if (m && o?.members) {
      const idx = o.members.findIndex(x=>x.id===id);
      const prev = idx > 0 ? o.members[idx-1] : null;
      const next = idx < o.members.length-1 ? o.members[idx+1] : null;
      midNav = `<div class="member-swipe-nav">
        <button class="member-nav-btn${prev?'':' disabled'}" ${prev?`onclick="replaceDetail('member',${prev.id},{orderId:${o.id}})"`:''}>‹</button>
        <span class="member-nav-pos">${idx+1} / ${o.members.length}</span>
        <button class="member-nav-btn${next?'':' disabled'}" ${next?`onclick="replaceDetail('member',${next.id},{orderId:${o.id}})"`:''}>›</button>
      </div>`;
      const portrait = m.image
        ? `<div class="detail-hero-img"><img src="${m.image}" alt="${m.name}"></div>`
        : `<div class="detail-portrait-placeholder">${m.name.charAt(0)||'?'}</div>`;
      html = `${portrait}<div class="detail-body">
        <div class="detail-badges">
          ${o?`<span class="character-badge">${o.name}</span>`:''}
          ${m.role?`<span class="member-role-badge ${roleClass(m.role)}">${m.role}</span>`:''}
          ${m.class?`<span class="character-badge">${m.class}</span>`:''}
        </div>
        <h1 class="detail-name">${m.name}</h1>
        <div class="detail-divider"></div>
        <div class="detail-article">${(m.description||'').replace(/\n/g,'<br>')}</div>
      </div>`;
    }
  } else if (type === 'region') {
    const r = siteData.regions.find(x=>x.id===id);
    if (r) {
      const chars = (siteData.characters||[]).filter(c=>c.regionId===id);
      html = `
        ${r.image?`<img src="${r.image}" class="detail-clue-img" alt="${r.name}">`:''}
        <div class="detail-body">
          <div class="detail-badges"><span style="font-size:2rem">${r.icon||'🏘️'}</span></div>
          <h1 class="detail-name">${r.name}</h1>
          ${r.description?`<div class="detail-divider"></div><div class="detail-article">${r.description}</div>`:''}
          <div class="detail-divider"></div>
          <h2 class="detail-section-title">此地區角色（${chars.length}）</h2>
          ${chars.length
            ? `<div class="chr-compact-grid">${chars.map(c=>`
                <div class="chr-mini-card" onclick="event.stopPropagation();pushDetail('character',${c.id})">
                  <div class="chr-mini-avatar">${c.image?`<img src="${c.image}" alt="${c.name}">`:`<div class="chr-mini-avatar-ph">${c.name.charAt(0)}</div>`}</div>
                  <div class="chr-mini-name">${c.name}</div>
                  ${c.title?`<div class="chr-mini-title">${c.title}</div>`:''}
                </div>`).join('')}</div>`
            : `<p style="color:var(--stone);font-size:0.9rem">此地區尚無角色</p>`}
        </div>`;
    }
  } else if (type === 'item') {
    const item = (siteData.compendium||[]).find(x=>x.id===id);
    if (item) html = `
      ${item.image?`<img src="${item.image}" class="detail-clue-img" alt="${item.name}">`
        :`<div class="comp-detail-blank"></div>`}
      <div class="detail-body">
        ${item.category?`<div class="detail-badges"><span class="character-badge">${item.category}</span></div>`:''}
        <h1 class="detail-name">${item.name}</h1>
        ${item.description?`<div class="detail-divider"></div><div class="detail-article">${item.description.replace(/\n/g,'<br>')}</div>`:''}
      </div>`;
  } else if (type === 'report') {
    const r = (siteData.worldReports||[]).find(x=>x.id===id);
    if (r) html = `
      ${r.image?`<img src="${r.image}" class="detail-clue-img" alt="${r.title}">`:''}
      <div class="detail-body">
        ${r.date?`<div class="detail-version-header"><span class="version-date-large">${r.date}</span></div>`:''}
        <h1 class="detail-name">${r.title}</h1>
        ${r.subtitle?`<p class="detail-title-tag">${r.subtitle}</p>`:''}
        <div class="detail-divider"></div>
        <div class="detail-article">${(r.content||'').replace(/\n/g,'<br>')}</div>
      </div>`;
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
      ${midNav}
      <button class="detail-close-btn" onclick="closeDetail()">✕</button>
    </div>
    ${html}`;
  const ms = document.querySelector('.members-scroll');
  if (ms) initDragScroll(ms);
  if (type === 'member') initMemberSwipe(extra.orderId, id);
}

/* ── Player Inventory (localStorage + Google Sheets sync) ── */
const INV_KEY = 'dnd-inventory';
let _invPollTimer = null;
let _invPollHash = '';
const INV_CATS = [
  {key:'equipped',  label:'目前裝備'},
  {key:'backpack',  label:'背包裝備'},
  {key:'quest',     label:'任務道具'},
  {key:'items',     label:'道具'},
  {key:'materials', label:'素材'},
  {key:'herbs',     label:'藥草'},
  {key:'enchant',   label:'附魂'},
];
const INV_RARITIES = [
  {key:'common',    label:'普通',  color:'#c8c8c8'},
  {key:'magic',     label:'魔法',  color:'#1eff00'},
  {key:'rare',      label:'稀有',  color:'#4db5ff'},
  {key:'unique',    label:'獨特',  color:'#a335ee'},
  {key:'legendary', label:'傳說',  color:'#ff4040'},
  {key:'mythic',    label:'神話',  color:'#e6cc80'},
];
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function invLoad(){try{const s=localStorage.getItem(INV_KEY);return s?JSON.parse(s):{players:[]};}catch(e){return{players:[]};}}
function invSave(d){
  localStorage.setItem(INV_KEY,JSON.stringify(d));
  invPushSheet(d);
}
function invNid(arr){return arr&&arr.length?Math.max(...arr.map(x=>x.id||0))+1:1;}

function invSheetUrl(){
  try{const c=JSON.parse(localStorage.getItem('dnd-cfg')||'null');if(c&&c.sheetUrl)return c.sheetUrl;}catch(e){}
  return (siteData&&siteData.site&&siteData.site.sheetUrl)||'';
}
async function invPushSheet(data){
  const url=invSheetUrl();if(!url)return;
  try{await fetch(url+'?op=inventory',{method:'POST',mode:'no-cors',body:JSON.stringify(data)});}catch(e){}
}
async function invFetchSheet(){
  const url=invSheetUrl();if(!url)return null;
  try{const r=await fetch(url+'?op=inventory',{mode:'cors'});if(!r.ok)return null;return await r.json();}catch(e){return null;}
}
function invSetInd(text,cls){const el=document.getElementById('inv-sync-ind');if(el){el.textContent=text;el.className=cls;}}
function invInitSync(){
  const url=invSheetUrl();
  if(!url)return;
  invSetInd('◌ 連線中...','inv-sync-on');
  invFetchSheet().then(data=>{
    if(data){localStorage.setItem(INV_KEY,JSON.stringify(data));_invRender(data);_invPollHash=JSON.stringify(data);}
    invSetInd('● 同步中','inv-sync-on');
    clearInterval(_invPollTimer);
    _invPollTimer=setInterval(async()=>{
      const d=await invFetchSheet();if(!d)return;
      const h=JSON.stringify(d);
      if(h!==_invPollHash){_invPollHash=h;localStorage.setItem(INV_KEY,JSON.stringify(d));_invRender(d);}
      invSetInd('● 同步中','inv-sync-on');
    },15000);
  }).catch(()=>invSetInd('○ 本機模式','inv-sync-off'));
}

function renderInventory(){ _invRender(invLoad()); }

function _invRender(data){
  const el=document.getElementById('inventory-container');
  if(!el)return;
  if(!data.players||!data.players.length){el.innerHTML='<p class="inv-empty">尚無玩家欄位，點上方「新增玩家」建立</p>';return;}
  el.innerHTML=data.players.map(p=>invPlayerHtml(p)).join('');
}

function invPlayerHtml(p){
  const rarOpts=INV_RARITIES.map(r=>`<option value="${r.key}">${r.label}</option>`).join('');
  const catOpts=INV_CATS.map(c=>`<option value="${c.key}">${c.label}</option>`).join('');
  const catHtml=INV_CATS.map(cat=>{
    const its=(p.items||[]).filter(i=>i.category===cat.key);
    return `<div class="inv-cat">
      <div class="inv-cat-head">
        <span class="inv-cat-lbl">${cat.label}</span>
        ${its.length?`<span class="inv-cat-cnt">${its.length}</span>`:''}
        <button class="inv-cat-add" onclick="invShowForm(${p.id},'${cat.key}')">＋</button>
      </div>
      ${its.length?`<div class="inv-items">${its.map(i=>invItemHtml(p.id,i)).join('')}</div>`:''}</div>`;
  }).join('');
  return `<div class="inv-player" id="invp-${p.id}">
    <div class="inv-phd">
      <input class="inv-pname" value="${esc(p.name||'')}" placeholder="玩家名稱" onchange="invSetName(${p.id},this.value)">
      <button class="inv-pdel" onclick="invDelPlayer(${p.id})" title="刪除">✕</button>
    </div>
    <div class="inv-gold-row">
      <span class="inv-gold-sym">◈</span>
      <input class="inv-gold" type="number" value="${p.gold||0}" min="0" onchange="invSetGold(${p.id},this.value)">
      <span class="inv-gold-lbl">金幣</span>
    </div>
    ${catHtml}
    <div class="inv-form-wrap" id="invfw-${p.id}" style="display:none">
      <div class="inv-form">
        <div class="inv-frow">
          <input id="ifn-${p.id}" class="inv-fi" placeholder="道具名稱 *" style="flex:2;min-width:120px">
          <select id="ifc-${p.id}" class="inv-fi inv-fsel">${catOpts}</select>
        </div>
        <div class="inv-frow">
          <div class="inv-rar-wrap">
            <div class="inv-rar-dot" id="ifrd-${p.id}" style="background:${INV_RARITIES[0].color}"></div>
            <select id="ifr-${p.id}" class="inv-fi inv-fsel" onchange="invRarDot(${p.id})">${rarOpts}</select>
          </div>
          <input id="ifq-${p.id}" class="inv-fi" type="number" value="1" min="1" placeholder="數量" style="width:64px;flex:none">
          <input id="ifnt-${p.id}" class="inv-fi" placeholder="備註（選填）" style="flex:2;min-width:100px">
        </div>
        <div class="inv-fbtns">
          <button class="inv-fbsave" onclick="invSaveItem(${p.id})">新增道具</button>
          <button class="inv-fbcancel" onclick="invHideForm(${p.id})">取消</button>
        </div>
      </div>
    </div>
  </div>`;
}

function invItemHtml(pid,item){
  const r=INV_RARITIES.find(x=>x.key===item.rarity)||INV_RARITIES[0];
  return `<div class="inv-item">
    <span class="inv-idot" style="background:${r.color}"></span>
    <span class="inv-iname" style="color:${r.color}">${esc(item.name)}</span>
    ${item.quantity>1?`<span class="inv-iqty">×${item.quantity}</span>`:''}
    ${item.note?`<span class="inv-inote-ico" onclick="invToggleNote(${pid},${item.id})" title="備註">📝</span>`:''}
    <button class="inv-idel" onclick="invDelItem(${pid},${item.id})">×</button>
    ${item.note?`<div class="inv-inote" id="invnote-${pid}-${item.id}">${esc(item.note)}</div>`:''}
  </div>`;
}

function invShowForm(pid,catKey){
  const w=document.getElementById('invfw-'+pid);if(!w)return;
  w.style.display='block';
  const sel=document.getElementById('ifc-'+pid);if(sel)sel.value=catKey;
  const ni=document.getElementById('ifn-'+pid);if(ni)ni.focus();
}
function invHideForm(pid){const w=document.getElementById('invfw-'+pid);if(w)w.style.display='none';}
function invRarDot(pid){
  const sel=document.getElementById('ifr-'+pid);
  const dot=document.getElementById('ifrd-'+pid);
  if(!sel||!dot)return;
  const r=INV_RARITIES.find(x=>x.key===sel.value);
  if(r)dot.style.background=r.color;
}
function invSaveItem(pid){
  const name=(document.getElementById('ifn-'+pid)||{}).value?.trim();
  if(!name){alert('請填寫道具名稱');return;}
  const cat=(document.getElementById('ifc-'+pid)||{}).value||'items';
  const rar=(document.getElementById('ifr-'+pid)||{}).value||'common';
  const qty=parseInt((document.getElementById('ifq-'+pid)||{}).value)||1;
  const note=((document.getElementById('ifnt-'+pid)||{}).value||'').trim();
  const d=invLoad();
  const p=d.players.find(x=>x.id===pid);if(!p)return;
  if(!p.items)p.items=[];
  p.items.push({id:invNid(p.items),name,category:cat,rarity:rar,quantity:qty,note});
  invSave(d);renderInventory();
}
function invDelItem(pid,iid){
  if(!confirm('刪除此道具？'))return;
  const d=invLoad();const p=d.players.find(x=>x.id===pid);if(!p)return;
  p.items=(p.items||[]).filter(x=>x.id!==iid);invSave(d);renderInventory();
}
function invSetName(pid,val){const d=invLoad();const p=d.players.find(x=>x.id===pid);if(!p)return;p.name=val;invSave(d);}
function invSetGold(pid,val){const d=invLoad();const p=d.players.find(x=>x.id===pid);if(!p)return;p.gold=parseInt(val)||0;invSave(d);}
function invDelPlayer(pid){
  if(!confirm('刪除此玩家的所有資料？'))return;
  const d=invLoad();d.players=d.players.filter(x=>x.id!==pid);invSave(d);renderInventory();
}
function invToggleNote(pid,iid){const el=document.getElementById('invnote-'+pid+'-'+iid);if(el)el.classList.toggle('show');}
function invAddPlayer(){
  const d=invLoad();const nid=invNid(d.players);
  d.players.push({id:nid,name:'玩家 '+nid,gold:0,items:[]});
  invSave(d);renderInventory();
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
  renderInventory();
  try {
    const res = await fetch('data.json?v=' + Date.now());
    if (!res.ok) throw new Error('無法載入 data.json');
    siteData = await res.json();
    fillStaticTexts(siteData.site);
    renderWorldMaps(siteData.worldMaps || (siteData.worldMap ? [{id:1, name:'格蘭大陸全圖', ...siteData.worldMap}] : []));
    renderPatchNotes(siteData.patchNotes || []);
    renderWorldReports(siteData.worldReports || []);
    renderCharacters(siteData.characters || [], siteData.regions || []);
    renderOrders(siteData.knightOrders || [], siteData.regions || []);
    renderClues(siteData.clues || []);
    renderCompendium(siteData.compendium || []);
    renderNotes(siteData.notes || []);
    invInitSync();
    setTimeout(initScrollReveal, 120);
  } catch(err) {
    console.error('載入失敗:', err);
  }
});
