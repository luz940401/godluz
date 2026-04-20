// app.js — 渲染邏輯，不需要修改此檔案

/* =============================================
   Particle System
   ============================================= */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor(initial) { this.init(initial); }
    init(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : canvas.height + 6;
      this.r = Math.random() * 1.8 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -(Math.random() * 0.55 + 0.18);
      this.alpha = Math.random() * 0.5 + 0.12;
      this.life = 0;
      this.maxL = Math.random() * 220 + 80;
      this.gold = Math.random() > 0.28;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life++; if (this.y < -8 || this.life > this.maxL) this.init(); }
    draw() {
      const t = this.life / this.maxL;
      const fade = t < 0.12 ? t / 0.12 : t > 0.75 ? (1 - t) / 0.25 : 1;
      ctx.save();
      ctx.globalAlpha = this.alpha * fade;
      ctx.fillStyle = this.gold ? `hsl(42,65%,62%)` : `hsl(0,75%,58%)`;
      ctx.shadowBlur = this.r * 5;
      ctx.shadowColor = this.gold ? `hsl(42,70%,50%)` : `hsl(0,80%,45%)`;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  const particles = Array.from({ length: 70 }, (_, i) => new Particle(i < 50));
  (function loop() { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(loop); })();
}

/* =============================================
   Navbar
   ============================================= */
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50), { passive: true });
}

/* =============================================
   Scroll Reveal
   ============================================= */
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('visible'), parseInt(entry.target.dataset.delay || '0', 10));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.announcement-card, .character-card, .order-card').forEach((el, i) => {
    el.dataset.delay = (i % 5) * 90;
    observer.observe(el);
  });
}

/* =============================================
   Render: Announcements
   ============================================= */
function categoryClass(cat) {
  if (cat === '重大公告') return 'cat-major';
  if (cat === '活動') return 'cat-event';
  return 'cat-general';
}

function renderAnnouncements(announcements) {
  const grid = document.getElementById('announcements-grid');
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date) - new Date(a.date);
  });
  grid.innerHTML = sorted.map(a => `
    <article class="announcement-card${a.pinned ? ' pinned' : ''}">
      <div class="card-corner tl"></div><div class="card-corner tr"></div>
      <div class="card-corner bl"></div><div class="card-corner br"></div>
      ${a.pinned ? '<div class="pinned-badge">置頂</div>' : ''}
      <div class="card-meta">
        <span class="card-category ${categoryClass(a.category)}">${a.category}</span>
        <span class="card-date">${a.date.replace(/-/g, ' / ')}</span>
      </div>
      <h3 class="card-title">${a.title}</h3>
      <p class="card-content">${a.content}</p>
      <a href="#" class="card-link" onclick="return false">閱讀全文</a>
    </article>
  `).join('');
}

/* =============================================
   Render: Characters
   ============================================= */
function renderCharacters(characters) {
  const grid = document.getElementById('characters-grid');
  grid.innerHTML = characters.map(c => {
    const portrait = c.image
      ? `<img src="${c.image}" alt="${c.name}">`
      : `<div class="character-portrait-placeholder"><span class="char-icon">${c.icon || '⚔️'}</span></div>`;
    return `
      <article class="character-card">
        <div class="character-portrait">${portrait}</div>
        <div class="character-info">
          <h3 class="character-name">${c.name}</h3>
          <p class="character-title-tag">${c.title}</p>
          <div class="character-badges">
            ${c.class ? `<span class="character-badge">${c.class}</span>` : ''}
            ${c.race  ? `<span class="character-badge">${c.race}</span>`  : ''}
          </div>
          <p class="character-desc">${c.description}</p>
        </div>
      </article>
    `;
  }).join('');
}

/* =============================================
   Render: Knight Orders
   ============================================= */
function renderOrders(knightOrders) {
  const list = document.getElementById('orders-list');
  list.innerHTML = knightOrders.map(o => `
    <article class="order-card">
      <div class="order-emblem"><span class="order-icon">${o.icon || '⚔️'}</span></div>
      <div class="order-info">
        <div class="order-header">
          <h3 class="order-name">${o.name}</h3>
          <span class="order-founding">${o.founding}</span>
        </div>
        <p class="order-motto">${o.motto}</p>
        <p class="order-desc">${o.description}</p>
        <div class="order-footer">
          <span class="order-members">成員 ${o.memberCount} 人</span>
        </div>
      </div>
    </article>
  `).join('');
}

/* =============================================
   Fill Static Texts
   ============================================= */
function fillStaticTexts(site) {
  const get = id => document.getElementById(id);
  if (get('hero-subtitle'))  get('hero-subtitle').textContent  = site.description;
  if (get('footer-tagline')) get('footer-tagline').textContent = site.tagline;
  if (get('footer-copy'))    get('footer-copy').textContent    = `© ${site.year} ${site.title} 官方公告`;
  document.title = `${site.title} — ${site.subtitle}`;
}

/* =============================================
   Boot
   ============================================= */
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  initNavbar();

  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('無法載入 data.json');
    const data = await res.json();
    fillStaticTexts(data.site);
    renderAnnouncements(data.announcements);
    renderCharacters(data.characters);
    renderOrders(data.knightOrders);
    setTimeout(initScrollReveal, 120);
  } catch (err) {
    console.error('載入資料失敗:', err);
  }
});
