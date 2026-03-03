// ═══════════════════════════════════════════════════
//  Character/player.js
// ═══════════════════════════════════════════════════
const MAX_TILT    = 20;
const TILT_SPEED  = 3;
const TILT_RETURN = 2;

class Player {
  constructor(images) {
    // use offscreen canvas with bg removed
    // this._canvas = removeBackground(images.player, 30);
    this._canvas = images.player, 30;
    this.w = 80; this.h = 100; //this.w = 80; this.h = 68;
    this.x = WIDTH  / 2 - this.w / 2;
    this.y = HUD_H + GAME_H - this.h - 20;
    this.hp           = 100;
    this.score        = 0;
    this.shieldHp     = 0;
    this.shieldTimer  = 0;
    this.specials        = START_SPECIALS;
    this.weaponLevel  = 1;
    this.tilt         = 0;
    this.padLeft      = false;
    this.padRight     = false;
    this.alive        = true;
  }
  get cx()     { return this.x + this.w / 2; }
  get cy()     { return this.y + this.h / 2; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
  get left()   { return this.x; }
  get right()  { return this.x + this.w; }

  update(keys) {
    const movL = (keys['ArrowLeft']  || keys['a'] || this.padLeft)  && this.x > 0;
    const movR = (keys['ArrowRight'] || keys['d'] || this.padRight) && this.right < WIDTH;
    if (movL) { this.x -= PLAYER_SPEED; this.tilt = Math.max(this.tilt - TILT_SPEED, -MAX_TILT); }
    else if (movR) { this.x += PLAYER_SPEED; this.tilt = Math.min(this.tilt + TILT_SPEED, MAX_TILT); }
    else {
      if (this.tilt > 0) this.tilt = Math.max(this.tilt - TILT_RETURN, 0);
      else if (this.tilt < 0) this.tilt = Math.min(this.tilt + TILT_RETURN, 0);
    }
    this.y = Math.max(this.y, HUD_H);
    this.y = Math.min(this.y, HUD_H + GAME_H - this.h);
    if (this.shieldTimer > 0) { this.shieldTimer--; if (this.shieldTimer <= 0) this.shieldHp = 0; }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.rotate(this.tilt * Math.PI / 180);
    ctx.drawImage(this._canvas, -this.w/2, -this.h/2, this.w, this.h);
    ctx.restore();
    if (this.shieldHp > 0) {
      ctx.save();
      ctx.strokeStyle = COL.CYAN; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.cx, this.cy, 55, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }
  }
  getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}
