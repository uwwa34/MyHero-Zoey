// ═══════════════════════════════════════════════════
//  Character/boss.js
// ═══════════════════════════════════════════════════
const BOSS_Y = HUD_H + 120;

class Boss {
  constructor(images) {
    //this._canvas  = removeBackground(images.boss, 30);
    this._canvas  = images.boss, 30;
    this.w = 170; this.h = 110;
    this.x = WIDTH / 2 - this.w / 2;
    this.y = HUD_H - 130;
    this.hp = 5000; this.maxHp = 5000;   // ↑ จาก 1000 → 2500 → 3500 → 5000
    this.dir      = 1;
    this.timer    = 0;
    this.phase    = 0;                   // 0-4 (5 patterns)
    this.entering = true;
    this.alive    = true;
    this._rage    = false;               // rage mode < 40% HP
    this._flash   = 0;                   // flash timer สำหรับ visual
  }

  get cx()     { return this.x + this.w / 2; }
  get cy()     { return this.y + this.h / 2; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
  get left()   { return this.x; }
  get right()  { return this.x + this.w; }

  // HP ratio
  get hpRatio() { return this.hp / this.maxHp; }

  update() {
    // ── Entering: เลื่อนลงมาตรงๆ ──
    if (this.entering) {
      if (this.y < BOSS_Y) { this.y += 3; }
      else { this.y = BOSS_Y; this.entering = false; }
      return false;
    }

    // ── Rage mode เมื่อ HP < 30% ──
    const wasRage = this._rage;
    this._rage = (this.hpRatio < 0.30);
    const speed     = this._rage ? 7 : 4;   // เร็วขึ้นตอน rage
    const fireRate  = this._rage ? 45 : 65; // ยิงถี่ขึ้นตอน rage

    if (this._flash > 0) this._flash--;

    this.x += speed * this.dir;
    if (this.right >= WIDTH) { this.x = WIDTH - this.w; this.dir = -1; }
    if (this.left  <= 0)     { this.x = 0;              this.dir =  1; }

    this.timer++;
    if (this.timer >= fireRate) {
      this.timer = 0;
      // rage: cycle ผ่านทุก pattern; ปกติ: 3 pattern แรก
      const maxPhase = this._rage ? 5 : 3;
      this.phase = (this.phase + 1) % maxPhase;
      return true;
    }
    return false;
  }

  getBullets() {
    const cx = this.cx, cy = this.bottom;
    const rage  = this._rage;
    const spd   = rage ? 3 : 2;       // กระสุนเร็วขึ้นตอน rage 5.5 : 4
    const b     = [];

    if (this.phase === 0) {
      // Fan spread — ปกติ 3, rage 7 นัด
      const angles = rage ? [-60,-40,-20,0,20,40,60] : [-30,0,30];
      angles.forEach(deg => {
        const a = (deg+90)*Math.PI/180;
        b.push({x:cx, y:cy, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd});
      });

    } else if (this.phase === 1) {
      // Columns — ปกติ 2, rage 4 เส้น
      const offsets = rage ? [-60,-20,20,60] : [-40,40];
      offsets.forEach(dx => b.push({x:cx+dx, y:cy, vx:0, vy:spd+1}));

    } else if (this.phase === 2) {
      // Diagonal burst — ปกติ 4, rage 8 ทิศ
      const count = rage ? 8 : 4;
      for(let i=0; i<count; i++){
        const a = (i*(360/count)+22.5)*Math.PI/180;
        b.push({x:cx, y:cy, vx:Math.cos(a)*(spd-0.5), vy:Math.sin(a)*(spd-0.5)});
      }

    } else if (this.phase === 3) {
      // RAGE ONLY — Double fan ยิงสองแถวพร้อมกัน
      [-45,-15,15,45].forEach(deg => {
        const a = (deg+90)*Math.PI/180;
        b.push({x:cx, y:cy, vx:Math.cos(a)*spd,       vy:Math.sin(a)*spd});
        b.push({x:cx, y:cy, vx:Math.cos(a)*(spd+1.5), vy:Math.sin(a)*(spd+1.5)});
      });

    } else if (this.phase === 4) {
      // RAGE ONLY — Spiral stream 12 ทิศ
      for(let i=0; i<12; i++){
        const a = (i*30)*Math.PI/180;
        b.push({x:cx, y:cy, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd});
      }
    }
    return b;
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    if (this._rage && Math.floor(Date.now() / 200) % 2 === 0) {
      // วาด red tint บน offscreen canvas ก่อน — composite เฉพาะพิกเซลที่มีรูป ไม่มีกรอบ
      const oc = Boss._rageTintCanvas || (Boss._rageTintCanvas = document.createElement('canvas'));
      if (oc.width !== this.w || oc.height !== this.h) { oc.width = this.w; oc.height = this.h; }
      const c2 = oc.getContext('2d');
      c2.clearRect(0, 0, this.w, this.h);
      c2.drawImage(this._canvas, 0, 0, this.w, this.h);
      c2.globalCompositeOperation = 'source-atop';
      c2.fillStyle = 'rgba(255,0,0,0.6)';
      c2.fillRect(0, 0, this.w, this.h);
      c2.globalCompositeOperation = 'source-over';
      ctx.drawImage(oc, this.x, this.y, this.w, this.h);
    } else {
      ctx.drawImage(this._canvas, this.x, this.y, this.w, this.h);
    }
    ctx.restore();
  }

  getRect() { return { x:this.x, y:this.y, w:this.w, h:this.h }; }
}

// ── Cage ──────────────────────────────────────────
class Cage {
  constructor() {
    this.w = 90; this.h = 100;
    this.x = WIDTH/2 - 45; this.y = HUD_H + 10;
    this.breaking = false; this.breakTimer = 0;
    this._shards = []; this._struggleT = 0; this.alive = true;
    this._canvas = document.createElement('canvas');
    this._canvas.width = this.w; this._canvas.height = this.h;
    this._drawCage();
  }
  get cx() { return this.x + this.w/2; }
  get cy() { return this.y + this.h/2; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }

  _drawCage() {
    const c = this._canvas.getContext('2d');
    c.clearRect(0,0,this.w,this.h);
    c.strokeStyle = 'rgb(180,140,60)'; c.lineWidth = 4;
    c.strokeRect(2,2,this.w-4,this.h-4);
    const sp = this.w/6;
    for(let i=1;i<=5;i++){c.beginPath();c.moveTo(i*sp,0);c.lineTo(i*sp,this.h);c.stroke();}
    c.beginPath();c.moveTo(0,this.h/2);c.lineTo(this.w,this.h/2);c.stroke();
  }

  struggleOffset() {
    this._struggleT++;
    return Math.round(Math.sin(this._struggleT*0.18)*10);
  }

  startBreak() {
    this.breaking = true; this.breakTimer = 0;
    this._shards = Array.from({length:16}, ()=>({
      dx:(Math.random()-0.5)*80, dy:(Math.random()-0.5)*80,
      vx:(Math.random()-0.5)*10, vy:-(1+Math.random()*6)
    }));
  }

  update() {
    if (this.breaking) { this.breakTimer++; if(this.breakTimer>30) this.alive=false; }
  }

  draw(ctx) {
    if (!this.alive) return;
    if (this.breaking) {
      const alpha = Math.max(0, 1 - this.breakTimer/30);
      ctx.save(); ctx.globalAlpha = alpha;
      this._shards.forEach(s => {
        ctx.fillStyle='rgb(180,140,60)';
        ctx.fillRect(Math.round(this.cx+s.dx+s.vx*this.breakTimer),
                     Math.round(this.cy+s.dy+s.vy*this.breakTimer), 6, 22);
      });
      ctx.restore();
    } else {
      ctx.drawImage(this._canvas, this.x, this.y);
    }
  }
}

// ── Friend ────────────────────────────────────────
class Friend {
  constructor(images, cx, cy) {
    this._canvas = removeBackground(images.friend, 30);
    this.w = 60; this.h = 60;
    this.x = cx - 30; this.y = cy - 30;
    this.alive = true;
  }
  get cx()    { return this.x + this.w/2; }
  get cy()    { return this.y + this.h/2; }
  get right() { return this.x + this.w; }

  draw(ctx) {
    if (!this.alive) return;
    ctx.drawImage(this._canvas, this.x, this.y, this.w, this.h);
  }
  getRect() { return {x:this.x, y:this.y, w:this.w, h:this.h}; }
}
