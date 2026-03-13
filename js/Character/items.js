// ═══════════════════════════════════════════════════
//  Character/items.js  —  Optimized
// ═══════════════════════════════════════════════════

const W_Bullet = 36;
const H_Bullet = 44;

// ── Bullet ────────────────────────────────────────
let _bulletCanvas = null;
function getBulletCanvas(images) {
  if (_bulletCanvas) return _bulletCanvas;
  if (images && images.bullet && images.bullet.complete && images.bullet.naturalWidth > 0)
    _bulletCanvas = removeBackground(images.bullet, 30);
  return _bulletCanvas;
}

class Bullet {
  constructor(x, y, vx, vy, images) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.w = W_Bullet; this.h = H_Bullet;
    this.alive = true;
    this._bc    = getBulletCanvas(images);
    this._angle = Math.atan2(vy, vx) + Math.PI / 2;
  }
  get cx() { return this.x + (this.w / 2) - (W_Bullet / 2); }
  get cy() { return this.y + this.h / 2; }

  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.y + this.h < HUD_H || this.y > HUD_H + GAME_H) this.alive = false;
    if (this.x < -20 || this.x > WIDTH + 20)                this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.rotate(this._angle);
    if (this._bc) {
      ctx.drawImage(this._bc, -this.w/2, -this.h/2, this.w, this.h);
    } else {
      // fallback: simple gradient (no shadowBlur)
      ctx.fillStyle = 'rgb(255, 183, 0)';
      ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
      ctx.fillStyle = 'rgba(255,255,180,0.7)';
      ctx.fillRect(-this.w/2+2, -this.h/2+2, this.w-4, this.h/3);
    }
    ctx.restore();
  }

  getRect() {
    const s = Math.max(this.w, this.h) / 2;
    return { x: this.cx - s, y: this.cy - s, w: s*2, h: s*2 };
  }
}

// ── SpecialBullet ─────────────────────────────────
// Pre-baked offscreen canvas — วาดครั้งเดียว ไม่ต้องทำ gradient/shadow ทุก frame
const _specialFrames = (() => {
  const R = 14, frames = 12;
  const canvases = [];
  for (let f = 0; f < frames; f++) {
    const oc = document.createElement('canvas');
    oc.width = oc.height = R * 2 + 4;
    const c  = oc.getContext('2d');
    const cx = R + 2, cy = R + 2;
    const pulse = 0.75 + 0.25 * Math.sin(f / frames * Math.PI * 2);
    const r = Math.round(R * pulse);
    const grd = c.createRadialGradient(cx-2, cy-2, 2, cx, cy, r);
    grd.addColorStop(0,   'rgb(255,245,120)');
    grd.addColorStop(0.5, 'rgb(255,160,20)');
    grd.addColorStop(1,   'rgba(200,60,0,0)');
    c.fillStyle = grd;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.fill();
    canvases.push(oc);
  }
  return canvases;
})();

class SpecialBullet {
  constructor(x, y) {
    this.x  = x - 14; this.y = y - 14;
    this.r  = 14; this.vy = -SPECIAL_SPEED;
    this.alive = true; this._t = 0;
  }
  get cx() { return this.x + this.r; }
  get cy() { return this.y + this.r; }
  get w()  { return this.r * 2; }
  get h()  { return this.r * 2; }

  update() {
    this.y += this.vy; this._t++;
    if (this.y + this.h < HUD_H) this.alive = false;
  }

  draw(ctx) {
    const frame = _specialFrames[this._t % _specialFrames.length];
    const sz    = frame.width;
    ctx.drawImage(frame, this.cx - sz/2, this.cy - sz/2);
  }

  getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

// ── BossBullet ────────────────────────────────────
// Pre-baked single canvas — ไม่ต้องทำ gradient/shadow ทุก frame
const _bossBulletCanvas = (() => {
  const R = 7;
  const oc = document.createElement('canvas');
  oc.width = oc.height = R * 2 + 2;
  const c  = oc.getContext('2d');
  const cx = R + 1, cy = R + 1;
  const grd = c.createRadialGradient(cx-2, cy-2, 1, cx, cy, R);
  grd.addColorStop(0, 'rgb(255,200,200)');
  grd.addColorStop(1, 'rgb(220,30,30)');
  c.fillStyle = grd;
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI*2); c.fill();
  return oc;
})();

class BossBullet {
  constructor(x, y, vx, vy) {
    this.fx = x; this.fy = y; this.vx = vx; this.vy = vy;
    this.r  = 7; this.alive = true;
  }
  get x()  { return this.fx - this.r; }
  get y()  { return this.fy - this.r; }
  get cx() { return this.fx; }
  get cy() { return this.fy; }
  get w()  { return this.r * 2; }
  get h()  { return this.r * 2; }

  update() {
    this.fx += this.vx; this.fy += this.vy;
    if (this.fx < -20 || this.fx > WIDTH + 20) this.alive = false;
    if (this.fy < HUD_H - 20 || this.fy > HUD_H + GAME_H + 20) this.alive = false;
  }

  draw(ctx) {
    const sz = _bossBulletCanvas.width;
    ctx.drawImage(_bossBulletCanvas, this.fx - sz/2, this.fy - sz/2);
  }

  getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

// ── Item ──────────────────────────────────────────
const ITEM_COLORS = {
  life    : [220, 40,  60 ],
  shield  : [0,   200, 230],
  special : [255, 120, 0  ],
  weapon  : [100, 230, 80 ],
};

// Pre-bake item glow canvas per type (static, ไม่ขึ้นกับ position)
const _itemGlowCache = {};
function getItemGlow(type, r) {
  if (_itemGlowCache[type]) return _itemGlowCache[type];
  const [rv, gv, bv] = ITEM_COLORS[type] || [255,255,255];
  const sz = Math.round(r * 3.4);
  const oc = document.createElement('canvas');
  oc.width = oc.height = sz;
  const c  = oc.getContext('2d');
  const cx = sz/2, cy = sz/2;
  const grd = c.createRadialGradient(cx, cy, r*0.3, cx, cy, r*1.6);
  grd.addColorStop(0, `rgba(${rv},${gv},${bv},0.4)`);
  grd.addColorStop(1, `rgba(${rv},${gv},${bv},0)`);
  c.fillStyle = grd;
  c.beginPath(); c.arc(cx, cy, r*1.6, 0, Math.PI*2); c.fill();
  _itemGlowCache[type] = oc;
  return oc;
}

class Item {
  constructor(x, y, type, images) {
    this.type  = type; this.r = 18;
    this.x = x - this.r; this.y = y - this.r;
    this.alive = true; this._t = 0;
    this._col  = ITEM_COLORS[type] || [255,255,255];
    const imgKey = { life:'itemLife', shield:'itemShield', special:'itemSpecial', weapon:'itemWeapon' }[type];
    const raw = images && images[imgKey];
    this._canvas = (raw && raw.complete && raw.naturalWidth > 0) ? removeBackground(raw, 30) : null;
    this._glow   = getItemGlow(type, this.r);  // shared static canvas
  }
  get cx() { return this.x + this.r; }
  get cy() { return this.y + this.r; }
  get w()  { return this.r * 2; }
  get h()  { return this.r * 2; }

  update() {
    this.y += ITEM_SPEED; this._t++;
    if (this.y > HUD_H + GAME_H) this.alive = false;
  }

  draw(ctx) {
    const glowSz = this._glow.width;
    ctx.drawImage(this._glow, this.cx - glowSz/2, this.cy - glowSz/2);  // no save/restore needed

    if (this._canvas) {
      ctx.drawImage(this._canvas, this.x, this.y, this.w, this.h);
    } else {
      const [r,g,b] = this._col;
      ctx.fillStyle   = `rgb(${r},${g},${b})`;
      ctx.beginPath(); ctx.arc(this.cx, this.cy, this.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const icons = { life:'+', shield:'S', special:'★', weapon:'W' };
      ctx.fillText(icons[this.type]||'?', this.cx, this.cy);
    }
  }

  getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}
