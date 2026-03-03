# 🎮 Shooting Game

เกมยิงปืนแนว Shoot 'em up สำหรับมือถือ พัฒนาด้วย HTML5 Canvas + JavaScript ล้วนๆ ไม่ต้องติดตั้งอะไรเพิ่ม เล่นได้ทันทีผ่านเบราว์เซอร์

---

## 📁 โครงสร้างโปรเจกต์

```
shooting-game/
├── index.html                   ← เปิดไฟล์นี้เพื่อเล่นเกม
├── README.md
├── assets/
│   ├── images/
│   │   ├── player.png           (80×68 px, PNG โปร่งใส)
│   │   ├── enemy.png            (56×56 px, PNG โปร่งใส)
│   │   ├── boss.png             (170×110 px, PNG โปร่งใส)
│   │   ├── friend.png           (60×60 px, PNG โปร่งใส)
│   │   ├── background.jpg       (390×508 px)
│   │   ├── bullet.png           (10×22 px, PNG โปร่งใส — วาดหันขึ้น)
│   │   └── items/
│   │       ├── item_life.png    (36×36 px)
│   │       ├── item_shield.png  (36×36 px)
│   │       ├── item_special.png (36×36 px)
│   │       └── item_weapon.png  (36×36 px)
│   └── sounds/
│       ├── bgm.mp3              ← เพลงประกอบ (loop)
│       ├── shoot.wav
│       ├── player_hit.wav
│       ├── pickup.wav
│       ├── boss_shoot.wav
│       ├── explosion.wav
│       └── victory.wav
└── js/
    ├── settings.js              ← ค่า config ทั้งหมด แก้ตรงนี้เพื่อปรับเกม
    ├── game.js                  ← logic หลัก, state machine, collision
    ├── joypad.js                ← virtual joypad (touch/mouse)
    ├── ranking.js               ← ระบบ ranking (localStorage)
    └── Character/
        ├── player.js
        ├── enemy.js
        ├── boss.js              ← Boss, Cage, Friend
        └── items.js             ← Bullet, SpecialBullet, BossBullet, Item
```

---

## 🕹️ การควบคุม

| ปุ่ม | มือถือ | PC |
|------|--------|----|
| เดินซ้าย/ขวา | ◀ / ▶ | Arrow Key |
| ยิง | **A** | Space |
| Special | **S** | B |

---

## 🎬 Game Flow

```
Intro Scene
  └─ เพื่อนอยู่คนเดียว
  └─ บอสบินลงมาจับเพื่อน
  └─ กรงครอบเพื่อน แล้วบอสพาหนีขึ้นไป
       ↓
Playing  (กำจัดศัตรู 33 ตัว)
       ↓
Boss Fight
       ↓
Victory → แสดง Bonus Score → Ranking
```

---

## ⚔️ ระบบเกม

### Playing
- ศัตรู spawn ทุก **60 frames** (~1 วินาที)
- กำจัดครบ **33 ตัว** → เข้าสู่ Boss Fight
- ตอน Boss Fight ศัตรุ spawn ทุก **90 frames**

### Boss
| สถานะ | HP | ความเร็ว | Fire Rate | Attack Patterns |
|-------|----|---------|-----------|----------------|
| ปกติ | 3500 | 4 | ทุก 65f | Fan 3 / Column 2 / Burst 4 ทิศ |
| **RAGE** (HP<40%) | — | **7** | ทุก **45f** | Fan 7 / Column 4 / Burst 8 / Double Fan / Spiral 12 ทิศ |

> ตอน RAGE บอสกระพริบสีแดง

---

## 🔫 ระบบอาวุธ (Weapon Level 1–4)

| Lv | Pattern | นัด |
|----|---------|-----|
| 1 | ตรง | 1 |
| 2 | Spread | 3 |
| 3 | Dual Row | 6 |
| **4 MAX** | 9-Way | 9 |

- อัปเกรดโดยเก็บไอเทม **Weapon (W)**
- กระสุนใช้ sprite `bullet.png` หมุนตาม angle ที่ยิงอัตโนมัติ

---

## 💣 Special

| ค่า | รายละเอียด |
|-----|-----------|
| เริ่มต้น | 2 ลูก |
| สูงสุด | 9 ลูก |
| ดาเมจบอส | 250 / ลูก |
| ดาเมจศัตรู | pass-through (+15 score) |

---

## 🎁 ไอเทม Drop

ศัตรูมีโอกาส **28%** ทิ้งไอเทมเมื่อตาย

| ไอเทม | สี | ผล |
|-------|----|----|
| Life ❤ | แดง | HP +20 (max 100) |
| Shield 🛡 | ฟ้า | ดูดซับความเสียหายประมาณ 10 วินาที |
| Special ★ | ส้ม | Special +1 |
| Weapon W | เขียว | Weapon Level +1 |

---

## 🏆 Score

### ระหว่างเกม
| การกระทำ | คะแนน |
|---------|-------|
| กำจัดศัตรูด้วยกระสุน | +10 |
| กำจัดศัตรูด้วย Special | +15 |

### Bonus เมื่อชนะ
| Bonus | สูตร | สูงสุด |
|-------|------|--------|
| ⏱ Time | `max(0, 5000 − วินาที × 30)` | 5,000 |
| ❤ HP | `HP ที่เหลือ × 20` | 2,000 |
| ★ Special | `Special ที่เหลือ × 300` | 2,700 |

> ยิ่งชนะเร็ว + เลือดเหลือมาก + Special เหลือมาก = คะแนนสูง

### Ranking
- บันทึก Top 10 ไว้ใน **localStorage** ของเบราว์เซอร์
- กรอกชื่อผ่าน virtual keyboard บนหน้าจอ
- ข้อมูลคงอยู่แม้ refresh (หายเมื่อล้าง browser data)

---

## ⚙️ ปรับแต่งเกม

### `js/settings.js` — ค่าพื้นฐาน
```js
const PLAYER_SPEED     = 7;   // ความเร็วผู้เล่น
const BULLET_SPEED_VAL = 12;  // ความเร็วกระสุน
const SPECIAL_SPEED    = 9;   // ความเร็ว Special
const START_SPECIALS   = 2;   // Special เริ่มต้น
const MAX_SPECIALS     = 9;   // Special สูงสุด
const MAX_WEAPON_LEVEL = 4;   // Level อาวุธสูงสุด
```

### `js/game.js` — ความยากและ spawn
```js
if(this.killed >= 10)      // จำนวนศัตรูก่อนเจอบอส → เพิ่มให้เกมยาวขึ้น
if(this.spawnTimer >= 60)  // spawn rate → ลดให้ยากขึ้น เพิ่มให้ง่ายขึ้น
```

### `js/Character/boss.js` — ความโหดบอส
```js
this.hp = 3500;                  // HP บอส
this._rage ? 45 : 65             // fire rate (frames): rage / ปกติ
this._rage ? 7  : 4              // ความเร็วเคลื่อนที่
this._rage ? 5.5 : 4             // ความเร็วกระสุน
```

---

## 🖼️ แนวทางทำ Sprite

- ใช้ **PNG โปร่งใส** (alpha channel) ทุกไฟล์
- ถ้าพื้นหลังเป็นสีขาว เกมจะพยายามลบให้อัตโนมัติ (`removeBackground`)
- `bullet.png` — วาด **หันหัวขึ้น** เกมจะหมุนตาม angle เอง
- รูป item แนะนำ **36×36 px** วงกลมกลางภาพ เพื่อให้ glow effect สวย

---

## 🚀 Deploy บน GitHub Pages

1. สร้าง **Public Repository** บน GitHub
2. Upload ไฟล์ทั้งหมด — `index.html` ต้องอยู่ที่ **root** ของ repo
3. **Settings → Pages → Source: `main` / `(root)`**
4. รอ 1–3 นาที → เล่นได้ที่ `https://username.github.io/repo-name/`

### ทดสอบ Local

```bash
# วิธีที่ 1: VS Code + Live Server extension
# วิธีที่ 2: Python
python3 -m http.server 8080
# เปิด http://localhost:8080
```

> ❗ ห้ามเปิดด้วย `file://` โดยตรง — รูปและเสียงจะโหลดไม่ได้ (CORS)

### Add to Home Screen (iPhone)

เปิดลิงก์ใน **Safari** → Share → **"Add to Home Screen"**
→ เล่นแบบ Fullscreen เหมือน native app

---

## 🐛 Bug ที่รู้จัก / ข้อควรระวัง

- BGM ต้องการ user interaction ก่อนจึงจะเล่นได้ (iOS policy) — กดปุ่มใดก็ได้เพื่อเปิดเสียง
- Ranking เก็บใน localStorage ของเบราว์เซอร์นั้นๆ — ไม่ sync ข้ามอุปกรณ์
