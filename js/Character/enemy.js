// ═══════════════════════════════════════════════════
//  Character/enemy.js
// ═══════════════════════════════════════════════════
class Enemy {
  constructor(images) {
    //this._canvas = removeBackground(images.enemy, 30);
    this._canvas = images.enemy, 30;
    this.w = 56; this.h = 56;
    this.x = Math.random() * (WIDTH - this.w);
    this.y = HUD_H - 60;
    this.speed = 2 + Math.random() * 2;
    this.alive = true;
  }
  get cx()     { return this.x + this.w / 2; }
  get cy()     { return this.y + this.h / 2; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
  get left()   { return this.x; }
  get right()  { return this.x + this.w; }

  update() {
    this.y += this.speed;
    if (this.y > HUD_H + GAME_H) this.alive = false;
  }
  draw(ctx) { ctx.drawImage(this._canvas, this.x, this.y, this.w, this.h); }
  getRect()  { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}
