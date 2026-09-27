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
// XOR ŞİFRELEME (Key mekanizması için)
// ============================================================
const XOR_KEY = "NORTH V.I.P"; // ← Bunu değiştir

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

function xorDecrypt(encoded) {
  if (!encoded) return "";
  try {
    const text = Buffer.from(encoded, 'base64').toString('binary');
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length)
      );
    }
    return result;
  } catch (e) {
    return "";
  }
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
// ADMIN KEY - SENİN BELİRLEDİĞİN
// ============================================================
const ADMIN_KEY = "NORTH V.I.P";

// ============================================================
// API ENDPOINT'LERİ
// ============================================================

app.get('/', (req, res) => {
  res.json({ 
    status: "ok", 
    name: "NORTH V.I.P SYSTEM API",
    version: "1.0.0"
  });
});

// Tüm verileri çek
app.get('/api/all', (req, res) => {
  const data = loadData();
  res.json({
    cheats: data.cheats || {},
    keys: data.keys || {},
    ads: data.ads || {}
  });
});

// ============================================================
// HİLE ENDPOINT'LERİ
// ============================================================

app.post('/api/cheats', (req, res) => {
  const { id, name, desc, file, category, target, adminKey } = req.body;
  
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Yetkisiz erişim" });
  }
  
  if (!id || !name || !file) {
    return res.status(400).json({ error: "Eksik veri" });
  }
  
  const data = loadData();
  data.cheats[id] = {
    name, desc, file,
    category: category || 'apk',
    target: target || 'free',
    updated_at: new Date().toISOString()
  };
  saveData(data);
  
  res.json({ ok: true, id });
});

app.delete('/api/cheats/:id', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Yetkisiz erişim" });
  }
  
  const data = loadData();
  delete data.cheats[req.params.id];
  saveData(data);
  
  res.json({ ok: true });
});

// ============================================================
// KEY ENDPOINT'LERİ
// ============================================================

app.post('/api/keys', (req, res) => {
  const { key, expiry, is_vip, adminKey } = req.body;
  
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Yetkisiz erişim" });
  }
  
  if (!key || !expiry) {
    return res.status(400).json({ error: "Eksik veri" });
  }
  
  const data = loadData();
  const encryptedKey = xorEncrypt(key);
  data.keys[encryptedKey] = {
    expiry,
    is_vip: is_vip || false,
    created_at: new Date().toISOString()
  };
  saveData(data);
  
  res.json({ ok: true, key });
});

app.delete('/api/keys/:key', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Yetkisiz erişim" });
  }
  
  const data = loadData();
  const encryptedKey = xorEncrypt(req.params.key);
  delete data.keys[encryptedKey];
  saveData(data);
  
  res.json({ ok: true });
});

// Key doğrula (login sırasında)
app.post('/api/keys/verify', (req, res) => {
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
// REKLAM ENDPOINT'LERİ
// ============================================================

app.post('/api/ads', (req, res) => {
  const { id, title, desc, image, link, btnText, color, adminKey } = req.body;
  
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Yetkisiz erişim" });
  }
  
  if (!id || !title) {
    return res.status(400).json({ error: "Eksik veri" });
  }
  
  const data = loadData();
  data.ads[id] = {
    title, desc,
    image: image || '',
    link: link || '',
    btnText: btnText || '',
    color: color || 'red',
    created_at: new Date().toISOString()
  };
  saveData(data);
  
  res.json({ ok: true, id });
});

app.delete('/api/ads/:id', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Yetkisiz erişim" });
  }
  
  const data = loadData();
  delete data.ads[req.params.id];
  saveData(data);
  
  res.json({ ok: true });
});

// ============================================================
// SUNUCUYU BAŞLAT
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ NORTH V.I.P API çalışıyor: http://localhost:${PORT}`);
});
