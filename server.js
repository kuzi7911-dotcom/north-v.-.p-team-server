// ============================================================
// NORTH V.I.P SYSTEM - Backend Sunucu
// Render.com üzerinde çalışır
// ============================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// XOR ŞİFRELEME
// ============================================================
const XOR_KEY = "NORTH_VIP_GIZLI_ANAHTAR_2026";

function xorEncrypt(text) {
  if (!text) return "";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length)
    );
  }
  return Buffer.from(result, 'binary').toString('base64');
}

// ============================================================
// VERİ DOSYASI
// ============================================================
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = { cheats: {}, keys: {}, ads: {} };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { cheats: {}, keys: {}, ads: {} };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
// ADMIN KEY
// ============================================================
const ADMIN_KEY = "NORTH V.I.P";

// ============================================================
// API ENDPOINT'LERİ
// ============================================================

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: "ok", 
    name: "NORTH V.I.P SYSTEM API",
    version: "1.0.0"
  });
});

// Tüm verileri çek (uygulama açılışta bunu çağırır)
app.get('/api/all', (req, res) => {
  const data = loadData();
  res.json({
    cheats: data.cheats || {},
    keys: data.keys || {},
    ads: data.ads || {}
  });
});

// Tüm verileri kaydet (admin panel her değişiklikte bunu çağırır)
app.put('/api/save', (req, res) => {
  const { cheats, keys, ads } = req.body;
  const data = {
    cheats: cheats || {},
    keys: keys || {},
    ads: ads || {}
  };
  saveData(data);
  res.json({ ok: true });
});

// ============================================================
// KEY DOĞRULAMA (login sırasında)
// ============================================================
app.post('/api/verify', (req, res) => {
  const { key } = req.body;
  
  if (!key) {
    return res.status(400).json({ error: "Key gerekli" });
  }
  
  const data = loadData();
  const encryptedKey = xorEncrypt(key);
  const keyInfo = data.keys[encryptedKey];
  
  if (!keyInfo) {
    return res.json({ valid: false, error: "Geçersiz key" });
  }
  
  if (keyInfo.expiry && new Date() > new Date(keyInfo.expiry)) {
    return res.json({ valid: false, error: "Key süresi dolmuş" });
  }
  
  res.json({
    valid: true,
    is_vip: keyInfo.is_vip,
    expiry: keyInfo.expiry
  });
});

// ============================================================
// SUNUCUYU BAŞLAT
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ NORTH V.I.P API çalışıyor: http://localhost:${PORT}`);
});
