// ═══════════════════════════════════════════════════
//  js/ranking.js  —  Local Ranking System
// ═══════════════════════════════════════════════════

const RANKING_KEY     = 'shootingGame_ranking_v1';
const RANKING_MAX     = 10;   // top 10

class RankingSystem {
  // ── Storage ───────────────────────────────────────
  static load() {
    try {
      return JSON.parse(localStorage.getItem(RANKING_KEY)) || [];
    } catch { return []; }
  }

  static save(list) {
    try { localStorage.setItem(RANKING_KEY, JSON.stringify(list)); } catch {}
  }

  static addScore(name, score) {
    const list = RankingSystem.load();
    list.push({ name: name.trim().slice(0,12) || 'PLAYER', score, date: new Date().toLocaleDateString('th-TH') });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, RANKING_MAX);
    RankingSystem.save(trimmed);
    return trimmed;
  }

  static getRank(score) {
    const list = RankingSystem.load();
    const pos  = list.filter(e => e.score > score).length + 1;
    return pos;
  }
}

// ═══════════════════════════════════════════════════
//  RankingScreen  —  draws ranking + name-entry on canvas
// ═══════════════════════════════════════════════════
class RankingScreen {
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.visible  = false;
    this.mode     = 'entry';   // 'entry' | 'board'
    this.playerName = '';
    this.playerScore = 0;
    this.ranking  = [];
    this.playerRank = 0;
    this._cursor  = true;
    this._cursorT = 0;
    this._onDone  = null;   // callback when finished

    // keyboard listener (managed by show/hide)
    this._keyHandler = (e) => this._handleKey(e);
  }

  // ── Public API ────────────────────────────────────
  show(score, onDone) {
    this.playerScore = score;
    this.playerName  = '';
    this.mode        = 'entry';
    this.visible     = true;
    this._onDone     = onDone;
    this.playerRank  = RankingSystem.getRank(score);
    window.addEventListener('keydown', this._keyHandler);
  }

  hide() {
    this.visible = false;
    window.removeEventListener('keydown', this._keyHandler);
  }

  // ── Input ─────────────────────────────────────────
  _handleKey(e) {
    if (this.mode === 'entry') {
      if (e.key === 'Enter') { this._confirmName(); return; }
      if (e.key === 'Backspace') { this.playerName = this.playerName.slice(0,-1); return; }
      if (e.key.length === 1 && this.playerName.length < 12) this.playerName += e.key;
    } else if (this.mode === 'board') {
      if (e.key === 'Enter' || e.key === ' ') this._done();
    }
  }

  // Touch on virtual keyboard (canvas tap) — called by Game when ranking visible
  handleTap(x, y) {
    if (this.mode === 'entry') {
      // OK button
      if (x >= WIDTH/2-60 && x <= WIDTH/2+60 && y >= 440 && y <= 480) { this._confirmName(); return; }
      // Virtual keyboard
      this._vkbTap(x, y);
    } else if (this.mode === 'board') {
      if (y >= HEIGHT - 80) this._done();
    }
  }

  _vkbTap(x, y) {
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['Z','X','C','V','B','N','M','⌫'],
    ];
    const startY = 310;
    const keyH   = 40, keyGap = 2;
    rows.forEach((row, ri) => {
      const keyW  = Math.floor((WIDTH - 20) / row.length) - keyGap;
      const rowX  = (WIDTH - (keyW + keyGap) * row.length) / 2;
      row.forEach((k, ki) => {
        const kx = rowX + ki*(keyW+keyGap), ky = startY + ri*(keyH+keyGap);
        if (x >= kx && x <= kx+keyW && y >= ky && y <= ky+keyH) {
          if (k === '⌫') { this.playerName = this.playerName.slice(0,-1); }
          else if (this.playerName.length < 12) { this.playerName += k; }
        }
      });
    });
  }

  _confirmName() {
    const name   = this.playerName.trim() || 'PLAYER';
    this.ranking = RankingSystem.addScore(name, this.playerScore);
    this.playerRank = this.ranking.findIndex(e => e.name===name && e.score===this.playerScore) + 1;
    this.mode = 'board';
  }

  _done() {
    this.hide();
    if (this._onDone) this._onDone();
  }

  // ── Draw ──────────────────────────────────────────
  draw() {
    if (!this.visible) return;
    const ctx = this.ctx;
    this._cursorT++;
    if (this._cursorT % 30 === 0) this._cursor = !this._cursor;

    // dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (this.mode === 'entry') this._drawEntry(ctx);
    else                       this._drawBoard(ctx);
  }

  _drawEntry(ctx) {
    // Title
    ctx.fillStyle = COL.CYAN; ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ENTER YOUR NAME', WIDTH/2, 80);

    // Score
    ctx.fillStyle = COL.YELLOW; ctx.font = 'bold 22px Courier New';
    ctx.fillText(`SCORE: ${String(this.playerScore).padStart(6,'0')}`, WIDTH/2, 125);

    // Rank badge
    ctx.fillStyle = this.playerRank === 1 ? '#ffd700' : COL.CYAN;
    ctx.font      = 'bold 18px Arial';
    ctx.fillText(`RANK #${this.playerRank}`, WIDTH/2, 158);

    // Name input box
    const bx = WIDTH/2-130, by=180, bw=260, bh=48;
    ctx.strokeStyle = COL.CYAN; ctx.lineWidth = 2;
    ctx.fillStyle   = 'rgba(0,30,40,0.8)';
    this._rr(ctx,bx,by,bw,bh,8,true,true);
    ctx.fillStyle = '#fff'; ctx.font='bold 26px Courier New';
    const nameDisplay = this.playerName + (this._cursor ? '|' : ' ');
    ctx.fillText(nameDisplay, WIDTH/2, by+bh/2);

    // Virtual keyboard
    this._drawVKB(ctx);

    // OK button
    ctx.fillStyle   = 'rgba(0,200,230,0.2)';
    ctx.strokeStyle = COL.CYAN; ctx.lineWidth = 2;
    this._rr(ctx, WIDTH/2-60, 440, 120, 40, 8, true, true);
    ctx.fillStyle = COL.CYAN; ctx.font='bold 18px Arial';
    ctx.fillText('CONFIRM', WIDTH/2, 460);
  }

  _drawVKB(ctx) {
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['Z','X','C','V','B','N','M','⌫'],
    ];
    const startY = 310, keyH=40, keyGap=2;
    rows.forEach((row, ri) => {
      const keyW = Math.floor((WIDTH-20)/row.length) - keyGap;
      const rowX = (WIDTH - (keyW+keyGap)*row.length)/2;
      row.forEach((k, ki) => {
        const kx=rowX+ki*(keyW+keyGap), ky=startY+ri*(keyH+keyGap);
        ctx.fillStyle   = k==='⌫' ? 'rgba(220,40,60,0.3)' : 'rgba(0,40,60,0.7)';
        ctx.strokeStyle = k==='⌫' ? 'rgba(220,40,60,0.7)' : 'rgba(0,150,180,0.5)';
        ctx.lineWidth   = 1;
        this._rr(ctx,kx,ky,keyW,keyH,4,true,true);
        ctx.fillStyle = k==='⌫' ? '#ff8080' : '#ccc';
        ctx.font = `${k==='⌫'?14:13}px Arial`;
        ctx.fillText(k, kx+keyW/2, ky+keyH/2);
      });
    });
  }

  _drawBoard(ctx) {
    // Title
    ctx.fillStyle = COL.YELLOW; ctx.font='bold 28px Arial';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🏆  RANKING  🏆', WIDTH/2, 55);

    const list = this.ranking.length ? this.ranking : RankingSystem.load();
    const rowH  = 44;
    const startY = 90;

    list.forEach((entry, i) => {
      const y    = startY + i * rowH;
      const isMe = (i+1 === this.playerRank && entry.score === this.playerScore);

      // row bg
      if (isMe) {
        ctx.fillStyle = 'rgba(0,200,230,0.18)';
        this._rr(ctx,10,y,WIDTH-20,rowH-4,6,true,false);
        ctx.strokeStyle = COL.CYAN; ctx.lineWidth=1.5;
        this._rr(ctx,10,y,WIDTH-20,rowH-4,6,false,true);
      }

      // rank medal colour
      const medalCol = ['#ffd700','#c0c0c0','#cd7f32'][i] || '#555';
      ctx.fillStyle = medalCol; ctx.font='bold 18px Arial';
      ctx.textAlign='left';
      ctx.fillText(`${i+1}.`, 20, y+rowH/2-2);

      // name
      ctx.fillStyle = isMe ? COL.CYAN : '#ddd';
      ctx.font = `${isMe?'bold ':''  }16px Courier New`;
      ctx.fillText(entry.name, 52, y+rowH/2-2);

      // score
      ctx.fillStyle = COL.YELLOW; ctx.font='bold 16px Courier New';
      ctx.textAlign='right';
      ctx.fillText(String(entry.score).padStart(6,'0'), WIDTH-15, y+rowH/2-2);

      // date (small)
      ctx.fillStyle='#555'; ctx.font='11px Arial'; ctx.textAlign='right';
      ctx.fillText(entry.date||'', WIDTH-15, y+rowH-8);
    });

    if (list.length === 0) {
      ctx.fillStyle='#555'; ctx.font='18px Arial'; ctx.textAlign='center';
      ctx.fillText('No records yet', WIDTH/2, 200);
    }

    // Play Again button
    const by = HEIGHT - 70;
    ctx.fillStyle   = 'rgba(0,200,230,0.2)';
    ctx.strokeStyle = COL.CYAN; ctx.lineWidth=2;
    this._rr(ctx, WIDTH/2-100, by, 200, 48, 10, true, true);
    ctx.fillStyle=COL.CYAN; ctx.font='bold 20px Arial'; ctx.textAlign='center';
    ctx.fillText('TAP TO PLAY AGAIN', WIDTH/2, by+24);
  }

  _rr(ctx,x,y,w,h,r,fill,stroke){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
    if(fill) ctx.fill(); if(stroke) ctx.stroke();
  }
}
