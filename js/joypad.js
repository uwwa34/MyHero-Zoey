// ═══════════════════════════════════════════════════
//  js/joypad.js  —  Virtual JoyPad (touch + mouse)
// ═══════════════════════════════════════════════════

class VirtualJoypad {
  constructor(canvas) {
    const BTN  = 68;
    const BTN_Y = HEIGHT - PAD_H + Math.floor((PAD_H - BTN) / 2) - 6;

    this.rects = {
      left  : { x: 18,                      y: BTN_Y, w: BTN, h: BTN },
      right : { x: 18 + BTN + 12,           y: BTN_Y, w: BTN, h: BTN },
      bomb  : { x: WIDTH - 18 - BTN*2 - 12, y: BTN_Y, w: BTN, h: BTN },
      shoot : { x: WIDTH - 18 - BTN,        y: BTN_Y, w: BTN, h: BTN },
    };

    this.state = { left: false, right: false, bomb: false, shoot: false };
    this._touchMap = {};   // touchId → buttonName
    this._onShoot = null;
    this._onBomb  = null;

    this._bind(canvas);
  }

  // ── helpers ────────────────────────────────────
  _hitTest(px, py) {
    for (const [name, r] of Object.entries(this.rects)) {
      if (px >= r.x && px <= r.x+r.w && py >= r.y && py <= r.y+r.h) return name;
    }
    return null;
  }

  _press(id, name) {
    if (!name) return;
    this.state[name] = true;
    this._touchMap[id] = name;
    if (name === 'shoot' && this._onShoot) this._onShoot();
    if (name === 'bomb'  && this._onBomb)  this._onBomb();
  }

  _release(id) {
    const name = this._touchMap[id];
    if (name) { this.state[name] = false; delete this._touchMap[id]; }
  }

  _canvasXY(canvas, clientX, clientY) {
    const r   = canvas.getBoundingClientRect();
    const scX = WIDTH  / r.width;
    const scY = HEIGHT / r.height;
    return [(clientX - r.left) * scX, (clientY - r.top) * scY];
  }

  _bind(canvas) {
    // Touch
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const [x,y] = this._canvasXY(canvas, t.clientX, t.clientY);
        this._press(t.identifier, this._hitTest(x, y));
      }
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      for (const t of e.changedTouches) this._release(t.identifier);
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const [x,y] = this._canvasXY(canvas, t.clientX, t.clientY);
        const prev = this._touchMap[t.identifier];
        const cur  = this._hitTest(x, y);
        if (prev !== cur) {
          if (prev) { this.state[prev] = false; }
          if (cur)  { this.state[cur]  = true; this._touchMap[t.identifier] = cur; }
          else      { delete this._touchMap[t.identifier]; }
        }
      }
    }, { passive: false });

    // Mouse (desktop testing)
    canvas.addEventListener('mousedown', e => {
      const [x,y] = this._canvasXY(canvas, e.clientX, e.clientY);
      this._press('mouse', this._hitTest(x, y));
    });
    canvas.addEventListener('mouseup',   () => this._release('mouse'));
  }

  // ── Draw ───────────────────────────────────────
  draw(ctx, bombsLeft) {
    // pad background
    ctx.fillStyle = 'rgba(0,8,18,0.85)';
    ctx.fillRect(0, HEIGHT - PAD_H, WIDTH, PAD_H);
    ctx.strokeStyle = 'rgba(0,160,200,0.35)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT - PAD_H);
    ctx.lineTo(WIDTH, HEIGHT - PAD_H);
    ctx.stroke();

    const defs = [
      { key: 'left',  label: '◀', sub: 'LEFT',            round: false, bCol: 'rgba(0,200,230,0.8)',  pCol: 'rgba(0,200,230,0.5)'  },
      { key: 'right', label: '▶', sub: 'RIGHT',           round: false, bCol: 'rgba(0,200,230,0.8)',  pCol: 'rgba(0,200,230,0.5)'  },
      { key: 'bomb',  label: 'B', sub: `SPEC ×${bombsLeft}`, round: true, bCol: 'rgba(255,140,0,0.8)', pCol: 'rgba(255,120,0,0.5)', disabled: bombsLeft <= 0 },
      { key: 'shoot', label: 'A', sub: 'SHOOT',           round: true,  bCol: 'rgba(0,200,230,0.8)',  pCol: 'rgba(0,200,230,0.5)'  },
    ];

    defs.forEach(d => {
      const r       = this.rects[d.key];
      const pressed = this.state[d.key];
      const radius  = d.round ? r.w / 2 : 14;

      ctx.save();
      ctx.beginPath();
      this._roundRect(ctx, r.x, r.y, r.w, r.h, radius);

      if (d.disabled) {
        ctx.strokeStyle = 'rgba(80,80,80,0.4)';
        ctx.lineWidth   = 2;
        ctx.stroke();
      } else if (pressed) {
        ctx.fillStyle   = d.pCol;
        ctx.fill();
        ctx.strokeStyle = d.bCol;
        ctx.lineWidth   = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = d.bCol;
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      // label
      ctx.fillStyle    = d.disabled ? '#444' : (pressed ? '#fff' : d.bCol);
      ctx.font         = 'bold 20px Arial';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, r.x + r.w/2, r.y + r.h/2 - 5);

      // sub label
      ctx.fillStyle    = d.disabled ? '#333' : 'rgba(100,150,170,0.9)';
      ctx.font         = '11px Arial';
      ctx.fillText(d.sub, r.x + r.w/2, r.y + r.h - 12);
      ctx.restore();
    });
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x+w, y,   x+w, y+r,   r);
    ctx.lineTo(x+w, y+h-r);
    ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h);
    ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r);
    ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }
}
