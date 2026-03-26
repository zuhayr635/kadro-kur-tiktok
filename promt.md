📋 KADRO KUR - Tam Geliştirme Promptu (v2 - Final)
🔽 PROMPTUN TAMAMI 🔽


=============================================================
PROJE ADI: KADRO KUR - TikTok Live İnteraktif Futbol Kartları Oyunu
VERSİYON: 2.0 - Multi-Tenant + Lisanslı + Coolify Deploy
=============================================================

GENEL AÇIKLAMA:
TikTok canlı yayınlarında kullanılmak üzere web tabanlı
interaktif bir futbol kartları oyunu geliştirmeni istiyorum.
Oyunda 4 takım bulunuyor. İzleyiciler beğeni atarak veya
hediye göndererek kart açma hakkı kazanıyor. Yayıncı,
katılımcının istediği takıma kartı dağıtıyor. Amaç 4 takımın
kadrosunu en iyi şekilde doldurmak. Tüm kadrolar dolduğunda
veya kart havuzu bittiğinde oyun biter ve skor tablosu
oluşturularak profile kaydedilir.

SİSTEM ÖZELLİKLERİ:
- Multi-Tenant: Birden fazla yayıncı aynı anda kullanabilir
- Lisans Sistemi: /licensepanel üzerinden gelişmiş lisans yönetimi
- TikTok Live PYTHON entegrasyonu (TikTokLive kütüphanesi)
- Gecikme SIFIR: Tüm beğeniler, hediyeler, kombolar yakalanmalı
- Coolify ile tek tık deploy (Docker tabanlı)
- Veritabanı veya harici ayar GEREKTIRMEZ (SQLite otomatik)

=============================================================
TEKNOLOJİ STACK:
=============================================================

Backend (Web Sunucu):
- Node.js + Express (ana web sunucu)
- Socket.io (gerçek zamanlı WebSocket iletişim)
- SQLite3 (better-sqlite3 paketi - dosya tabanlı, kurulum
  gerektirmez, otomatik oluşturulur)
- multer (dosya yükleme - takım amblemleri için)
- uuid (benzersiz session ID üretimi)
- bcrypt (admin şifre hashleme)
- jsonwebtoken (JWT - admin oturum yönetimi)

TikTok Live Entegrasyonu (Python):
- Python 3.10+
- TikTokLive kütüphanesi (pip install TikTokLive)
- websockets (Python WebSocket client - Node.js ile haberleşme)
- asyncio (asenkron event loop)
- Her yayıncı session'ı için ayrı Python process spawn edilir
- Python process, Node.js ile internal WebSocket üzerinden
  haberleşir (port: 9001 + session_index)
- GECİKME OLMAMALI: Tüm like, gift, chat, combo eventleri
  anında yakalanıp Node.js'e iletilmeli

Frontend:
- HTML5, CSS3, JavaScript (vanilla - framework kullanılmayacak)
- CSS Animations + requestAnimationFrame (kart animasyonları)
- Socket.io Client (gerçek zamanlı güncelleme)
- html2canvas (ekran görüntüsü indirme)

Deploy:
- Docker (single container - Node.js + Python birlikte)
- Coolify uyumlu Dockerfile
- Tek tık deploy - harici veritabanı veya ayar GEREKMEZ
- SQLite dosyası container içinde otomatik oluşturulur
- Volume mount ile kalıcı veri (Coolify otomatik yapar)

=============================================================
COOLİFY DEPLOY YAPISI:
=============================================================

Dockerfile:
```dockerfile
FROM node:20-slim

# Python kurulumu
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Python bağımlılıkları
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Node.js bağımlılıkları
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Uygulama dosyaları
COPY . .

# Data dizini (SQLite + uploads)
RUN mkdir -p /app/data /app/data/uploads /app/data/db

# Port
EXPOSE 3000

# Başlat
CMD ["node", "server/index.js"]
requirements.txt:

text

TikTokLive>=6.0.0
websockets>=12.0
asyncio-compat>=0.1.0
docker-compose.yml (Coolify için opsiyonel):

YAML

version: '3.8'
services:
  kadro-kur:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - kadro-data:/app/data
    environment:
      - NODE_ENV=production
      - ADMIN_PASSWORD=admin123
      - JWT_SECRET=supersecretkey
      - PORT=3000
    restart: unless-stopped

volumes:
  kadro-data:
Coolify Ayarları:

Build Pack: Dockerfile
Port: 3000
Persistent Storage: /app/data → volume mount
Environment Variables:
ADMIN_PASSWORD (varsayılan: admin123)
JWT_SECRET (varsayılan: rastgele üretilir)
PORT (varsayılan: 3000)
Health Check: GET /api/health
COOLIFY'DA TEK TIK DEPLOY:

Coolify'da "New Resource" → "Docker" seç
Git repo URL'sini yapıştır
Deploy butonuna bas
Otomatik build + çalıştır
Hiçbir veritabanı veya harici servis GEREKMEZ
SQLite otomatik oluşturulur
İlk çalışmada admin hesabı otomatik oluşturulur
=============================================================
DOSYA YAPISI:
kadro-kur/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── package.json
├── package-lock.json
├── README.md
│
├── server/
│ ├── index.js (Ana sunucu - Express + Socket.io)
│ ├── database.js (SQLite veritabanı - otomatik tablo oluşturma)
│ ├── session-manager.js (Multi-tenant session yönetimi)
│ ├── license-manager.js (Lisans sistemi)
│ ├── game-engine.js (Oyun mantığı)
│ ├── card-system.js (Kart çekme algoritması)
│ ├── auth.js (JWT authentication middleware)
│ └── tiktok-bridge.js (Python process yönetimi + iletişim)
│
├── python/
│ └── tiktok_connector.py (TikTok Live bağlantısı - Python)
│
├── data/
│ ├── players.json (Futbolcu veritabanı - 500+ oyuncu)
│ ├── db/ (SQLite dosyaları - otomatik oluşturulur)
│ │ └── kadrokur.db
│ └── uploads/ (Takım amblemleri)
│
├── public/
│ ├── game/ (OBS Browser Source - Oyun ekranı)
│ │ ├── index.html
│ │ ├── style.css
│ │ └── game.js
│ │
│ ├── panel/ (Yayıncı kontrol paneli)
│ │ ├── index.html
│ │ ├── style.css
│ │ └── panel.js
│ │
│ ├── licensepanel/ (Admin lisans yönetim paneli)
│ │ ├── index.html
│ │ ├── style.css
│ │ └── license.js
│ │
│ ├── profile/ (Profil sayfası)
│ │ ├── index.html
│ │ ├── style.css
│ │ └── profile.js
│ │
│ └── assets/
│ ├── card-templates/
│ │ ├── bronze-bg.png
│ │ ├── silver-bg.png
│ │ ├── gold-bg.png
│ │ └── elite-bg.png
│ ├── sounds/
│ │ ├── notification.mp3
│ │ ├── card-bronze.mp3
│ │ ├── card-silver.mp3
│ │ ├── card-gold.mp3
│ │ ├── card-elite.mp3
│ │ ├── card-reject.mp3
│ │ └── game-end.mp3
│ ├── fonts/
│ │ └── (FIFA tarzı font dosyaları)
│ └── img/
│ ├── logo.png
│ ├── default-emblem.png
│ └── player-placeholder.png

=============================================================
VERİTABANI ŞEMASI (SQLite - Otomatik Oluşturulur):
Uygulama ilk çalıştığında database.js tüm tabloları
otomatik oluşturmalıdır. Harici kurulum GEREKMEZ.

--- Tablo: admin ---
CREATE TABLE IF NOT EXISTS admin (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- İlk çalışmada varsayılan admin oluştur:
-- username: admin, password: ADMIN_PASSWORD env variable

--- Tablo: licenses ---
CREATE TABLE IF NOT EXISTS licenses (
id INTEGER PRIMARY KEY AUTOINCREMENT,
license_key TEXT UNIQUE NOT NULL,
owner_name TEXT NOT NULL,
owner_email TEXT,
owner_tiktok TEXT,
plan TEXT NOT NULL DEFAULT 'basic',
-- plan: 'basic', 'pro', 'premium', 'unlimited'
status TEXT NOT NULL DEFAULT 'active',
-- status: 'active', 'suspended', 'expired', 'revoked'
max_sessions INTEGER DEFAULT 1,
-- aynı anda kaç yayın açabilir
allowed_features TEXT DEFAULT '{}',
-- JSON: hangi özellikler açık
total_usage_count INTEGER DEFAULT 0,
-- toplam kaç kez kullanıldı
last_used_at DATETIME,
last_used_ip TEXT,
activated_at DATETIME,
expires_at DATETIME,
notes TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

--- Tablo: license_logs ---
CREATE TABLE IF NOT EXISTS license_logs (
id INTEGER PRIMARY KEY AUTOINCREMENT,
license_id INTEGER,
action TEXT NOT NULL,
-- action: 'activated', 'session_start', 'session_end',
-- 'suspended', 'renewed', 'revoked', 'login'
details TEXT,
ip_address TEXT,
user_agent TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (license_id) REFERENCES licenses(id)
);

--- Tablo: sessions ---
CREATE TABLE IF NOT EXISTS sessions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
session_id TEXT UNIQUE NOT NULL,
license_id INTEGER NOT NULL,
tiktok_username TEXT NOT NULL,
status TEXT DEFAULT 'active',
-- status: 'active', 'paused', 'ended', 'error'
python_pid INTEGER,
-- Python process ID (temizlik için)
game_state TEXT DEFAULT '{}',
-- JSON: tüm oyun durumu
team_settings TEXT DEFAULT '{}',
-- JSON: takım ayarları
game_settings TEXT DEFAULT '{}',
-- JSON: oyun ayarları (beğeni hedefi, tier aralıkları vb.)
started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
ended_at DATETIME,
FOREIGN KEY (license_id) REFERENCES licenses(id)
);

--- Tablo: game_history ---
CREATE TABLE IF NOT EXISTS game_history (
id INTEGER PRIMARY KEY AUTOINCREMENT,
session_id TEXT NOT NULL,
license_id INTEGER NOT NULL,
tiktok_username TEXT NOT NULL,
final_scores TEXT NOT NULL,
-- JSON: 4 takımın final skorları ve kadroları
statistics TEXT NOT NULL,
-- JSON: yayın istatistikleri
duration_seconds INTEGER,
total_cards_opened INTEGER DEFAULT 0,
total_participants INTEGER DEFAULT 0,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (license_id) REFERENCES licenses(id)
);

--- Tablo: used_players ---
CREATE TABLE IF NOT EXISTS used_players (
id INTEGER PRIMARY KEY AUTOINCREMENT,
session_id TEXT NOT NULL,
player_id INTEGER NOT NULL,
team_index INTEGER NOT NULL,
-- 0, 1, 2, 3 (hangi takım)
position TEXT NOT NULL,
assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
replaced_by INTEGER,
-- NULL ise hala aktif, değilse yerine gelen oyuncu ID
FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

=============================================================
MULTI-TENANT SESSION SİSTEMİ:
Her yayıncı kendi bağımsız session'ını başlatır.
Birden fazla yayıncı aynı anda sistemi kullanabilir.
Her session tamamen izole çalışır.

SESSION AKIŞI:

Yayıncı /panel sayfasını açar
Lisans anahtarını girer
Sistem lisansı doğrular:
Lisans geçerli mi? (status: active)
Süresi dolmamış mı? (expires_at > now)
Mevcut aktif session limiti aşılmamış mı?
Geçerliyse → panel açılır
Geçersizse → hata mesajı + lisans satın alma yönlendirmesi
Yayıncı TikTok kullanıcı adını girer
POST /api/session/create isteği gönderilir
Sunucu:
a. Benzersiz session_id üretir (uuid v4)
b. Sessions tablosuna kaydeder
c. Python TikTok connector process'i spawn eder
d. Python process, o TikTok hesabının canlı yayınına bağlanır
e. Internal WebSocket ile Node.js'e event'ler iletilir
f. Session bilgileri yayıncıya döndürülür
Yayıncı game URL'sini alır:
https://domain.com/game?session=abc123
Bu URL'yi TikTok Studio'da veya OBS'de Browser Source
olarak ekler
Oyun başlar, tüm event'ler session bazlı işlenir
Yayın bitince:
Yayıncı "Oyunu Bitir" butonuna basar
VEYA Python process TikTok bağlantısı koptuğunu algılar
POST /api/session/stop çağrılır
Python process kapatılır (kill)
Oyun sonuçları game_history'ye kaydedilir
Session status 'ended' yapılır
Tüm kaynaklar temizlenir
SESSION İZOLASYONU:

Her session'ın kendi oyun state'i var
Her session'ın kendi kart havuzu var
Her session'ın kendi Python process'i var
Socket.io room'ları session_id bazlı ayrılır
Bir session'daki işlem başka session'ı ETKİLEMEZ
=============================================================
PYTHON TIKTOK CONNECTOR (python/tiktok_connector.py):
Bu dosya Node.js tarafından child_process.spawn ile
çalıştırılır. Her session için ayrı bir instance.

Çalıştırma komutu:
python3 python/tiktok_connector.py <tiktok_username> <ws_port> <session_id>

Örnek:
python3 python/tiktok_connector.py @futbolkral 9001 abc123

PYTHON KODU GEREKSİNİMLERİ:

Python

# tiktok_connector.py

import sys
import asyncio
import json
import websockets
from TikTokLive import TikTokLiveClient
from TikTokLive.events import (
    ConnectEvent,
    DisconnectEvent,
    LikeEvent,
    GiftEvent,
    CommentEvent,
    JoinEvent
)

# Komut satırı argümanları
TIKTOK_USERNAME = sys.argv[1]  # @kullaniciadi
WS_PORT = int(sys.argv[2])     # internal websocket port
SESSION_ID = sys.argv[3]       # session id

# TikTok client oluştur
client = TikTokLiveClient(
    unique_id=TIKTOK_USERNAME,
    # Performans ayarları - GECİKME OLMAMALI
    process_initial_data=True,
    fetch_room_info_on_connect=True,
    enable_extended_gift_info=True
)

# Node.js'e event gönderme fonksiyonu
async def send_to_node(event_type, data):
    """Internal WebSocket üzerinden Node.js'e event gönder"""
    try:
        async with websockets.connect(f"ws://localhost:{WS_PORT}") as ws:
            payload = json.dumps({
                "session_id": SESSION_ID,
                "type": event_type,
                "data": data,
                "timestamp": time.time()
            })
            await ws.send(payload)
    except Exception as e:
        print(f"WebSocket gönderim hatası: {e}")

# TikTok Event Handlers

@client.on(ConnectEvent)
async def on_connect(event: ConnectEvent):
    """Yayına bağlanıldığında"""
    print(f"Bağlandı: {TIKTOK_USERNAME}")
    await send_to_node("connected", {
        "username": TIKTOK_USERNAME,
        "room_id": client.room_id
    })

@client.on(DisconnectEvent)
async def on_disconnect(event: DisconnectEvent):
    """Bağlantı koptuğunda"""
    print(f"Bağlantı koptu: {TIKTOK_USERNAME}")
    await send_to_node("disconnected", {
        "username": TIKTOK_USERNAME
    })

@client.on(LikeEvent)
async def on_like(event: LikeEvent):
    """Beğeni geldiğinde - HER BEĞENİ YAKALANMALI"""
    # TikTok beğenileri combo halinde gelebilir
    # event.likes = bu combo'daki beğeni sayısı
    # event.total_likes = toplam beğeni
    # HER İKİSİ DE GÖNDERİLMELİ
    await send_to_node("like", {
        "user_id": event.user.user_id,
        "username": event.user.nickname,
        "unique_id": event.user.unique_id,
        "display_name": event.user.nickname,
        "likes": event.likes,           # bu combo'daki beğeni sayısı
        "total_likes": event.total_likes, # toplam beğeni
        "profile_pic": event.user.avatar_url if hasattr(event.user, 'avatar_url') else ""
    })

@client.on(GiftEvent)
async def on_gift(event: GiftEvent):
    """Hediye geldiğinde - TÜM HEDİYELER YAKALANMALI"""
    # Streakable gift kontrolü
    # gift.is_repeating = True ise streak devam ediyor
    # gift.is_repeating = False ise streak bitti veya tek seferlik
    # Sadece streak bittiğinde veya tek seferlik hediyede işlem yap
    
    if not event.gift.streakable or not event.gift.is_repeating:
        await send_to_node("gift", {
            "user_id": event.user.user_id,
            "username": event.user.nickname,
            "unique_id": event.user.unique_id,
            "display_name": event.user.nickname,
            "gift_id": event.gift.id,
            "gift_name": event.gift.name,
            "gift_count": event.gift.count,
            "diamond_count": event.gift.info.diamond_count,
            # jeton = diamond_count (TikTok'ta coin/diamond sistemi)
            "total_value": event.gift.info.diamond_count * event.gift.count,
            "profile_pic": event.user.avatar_url if hasattr(event.user, 'avatar_url') else ""
        })

@client.on(CommentEvent)
async def on_comment(event: CommentEvent):
    """Yorum geldiğinde"""
    await send_to_node("comment", {
        "user_id": event.user.user_id,
        "username": event.user.nickname,
        "unique_id": event.user.unique_id,
        "display_name": event.user.nickname,
        "comment": event.comment,
        "profile_pic": event.user.avatar_url if hasattr(event.user, 'avatar_url') else ""
    })

# Ana çalıştırma
if __name__ == "__main__":
    try:
        client.run()
    except Exception as e:
        print(f"TikTok bağlantı hatası: {e}")
        # Node.js'e hata bildir
        asyncio.run(send_to_node("error", {
            "message": str(e)
        }))
        sys.exit(1)
ÖNEMLİ PYTHON NOTLARI:

GECİKME OLMAMALI: Event handler'lar async olmalı ve
anında Node.js'e iletilmeli
KOMBO YAKALAMA: LikeEvent'te event.likes combo sayısını
verir. Bu değer kullanıcının beğeni sayacına EKLENMELİ
(1 değil, combo sayısı kadar)
STREAK GİFT: Bazı hediyeler streak olarak gelir (gül gibi).
Sadece streak bittiğinde (is_repeating=False) toplam
değer hesaplanmalı
RECONNECT: Bağlantı koparsa otomatik yeniden bağlanma
denemesi yapılmalı (max 5 deneme)
PROCESS CLEANUP: Node.js session stop ettiğinde Python
process temiz şekilde kapatılmalı (SIGTERM handle)
=============================================================
NODE.JS - PYTHON İLETİŞİMİ (server/tiktok-bridge.js):
Bu modül Python process'leri yönetir ve iletişimi sağlar.

JavaScript

// tiktok-bridge.js temel yapı

const { spawn } = require('child_process');
const WebSocket = require('ws');

class TikTokBridge {
  constructor() {
    this.processes = new Map(); // session_id → { process, wsServer }
    this.baseWsPort = 9001;    // Her session farklı port alır
  }

  async startSession(sessionId, tiktokUsername) {
    // 1. Bu session için internal WebSocket server aç
    const wsPort = this.getAvailablePort();
    const wss = new WebSocket.Server({ port: wsPort });
    
    // 2. Python process'i spawn et
    const pythonProcess = spawn('python3', [
      'python/tiktok_connector.py',
      tiktokUsername,
      wsPort.toString(),
      sessionId
    ]);

    // 3. WebSocket'ten gelen mesajları dinle
    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        const event = JSON.parse(data);
        // Socket.io üzerinden ilgili session'a yayınla
        this.handleTikTokEvent(event);
      });
    });

    // 4. Process'i kaydet
    this.processes.set(sessionId, {
      process: pythonProcess,
      wsServer: wss,
      wsPort: wsPort
    });

    // 5. Process hata/çıkış dinle
    pythonProcess.on('exit', (code) => {
      console.log(`Python process çıktı: ${sessionId}, code: ${code}`);
      this.cleanup(sessionId);
    });

    return { wsPort, pid: pythonProcess.pid };
  }

  async stopSession(sessionId) {
    const session = this.processes.get(sessionId);
    if (session) {
      session.process.kill('SIGTERM');
      session.wsServer.close();
      this.processes.delete(sessionId);
    }
  }

  handleTikTokEvent(event) {
    // Bu method ana sunucudan override edilecek
    // Socket.io ile ilgili session room'una broadcast
  }
}
=============================================================
LİSANS SİSTEMİ (ÇOK DETAYLI):
Lisans paneli /licensepanel adresinde bulunur.
Admin girişi gerektirir (JWT tabanlı).

--- LİSANS PANELİ SAYFA YAPISI ---

GİRİŞ EKRANI:

Admin kullanıcı adı + şifre
JWT token ile oturum yönetimi
"Beni Hatırla" seçeneği
Şık, modern giriş formu
ANA DASHBOARD (/licensepanel):
Giriş yapıldıktan sonra ana sayfa.

ÜST BAR:

Logo: "KADRO KUR - Lisans Yönetimi"
Admin kullanıcı adı
[Çıkış Yap] butonu
SOL MENÜ:

📊 Dashboard (Ana sayfa)
🔑 Lisanslar (Lisans yönetimi)
📋 Aktif Sessionlar (Canlı izleme)
📈 İstatistikler
👤 Kullanıcılar
⚙️ Sistem Ayarları
📜 Loglar
----- DASHBOARD SAYFASI -----

Üst kartlar (summary cards):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🔑 TOPLAM │ │ ✅ AKTİF │ │ 📡 CANLI │ │ 💰 BU AY │
│ LİSANS │ │ LİSANS │ │ SESSION │ │ YENİ LİSANS │
│ 47 │ │ 32 │ │ 5 │ │ 12 │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

Grafikler:

Son 30 gün lisans aktivasyonu (çizgi grafik)
Plan dağılımı (pasta grafik: basic, pro, premium, unlimited)
Günlük aktif session sayısı (bar grafik)
En aktif kullanıcılar (top 10 liste)
Son aktiviteler tablosu:
| Tarih | Kullanıcı | İşlem | Detay |
| 14:23 | Ali_34 | Session Başlatıldı | TikTok: @ali34live |
| 14:20 | Mehmet_gs | Lisans Aktive | Plan: Pro |
| 13:55 | Zeynep | Session Bitti | Süre: 2s 14dk |

----- LİSANS YÖNETİMİ SAYFASI -----

Üst bar:
[🔍 Ara...] [📊 Filtrele ▼] [➕ Yeni Lisans Oluştur]

Filtre seçenekleri:

Plan: Tümü / Basic / Pro / Premium / Unlimited
Durum: Tümü / Aktif / Askıda / Süresi Dolmuş / İptal
Sıralama: Tarih / İsim / Son Kullanım / Bitiş Tarihi
Lisans tablosu:
┌────────────────────────────────────────────────────────────────────┐
│ Lisans Anahtarı │ Sahip │ Plan │ Durum │ Bitiş │ İşlem │
│────────────────────┼─────────────┼──────────┼────────┼───────────┼───────│
│ KK-XXXX-XXXX-XXXX │ Ali Yılmaz │ 💎 Pro │ ✅ Aktif│ 15.02.2025│ [...] │
│ KK-YYYY-YYYY-YYYY │ Mehmet Kaya │ 🥇Premium│ ✅ Aktif│ 01.03.2025│ [...] │
│ KK-ZZZZ-ZZZZ-ZZZZ │ Ayşe Demir │ 🥉 Basic│ ⚠️ 3gün│ 18.01.2025│ [...] │
│ KK-WWWW-WWWW-WWWW │ Can Özkan │ 💎 Pro │ 🔴 İptal│ - │ [...] │
└────────────────────────────────────────────────────────────────────┘

[...] İşlem Menüsü:

👁️ Detay Görüntüle
✏️ Düzenle
🔄 Süre Uzat
⏸️ Askıya Al
▶️ Aktifleştir
🗑️ İptal Et / Sil
📋 Kullanım Logları
YENİ LİSANS OLUŞTURMA FORMU:
┌──────────────────────────────────────────────────────────────┐
│ ➕ YENİ LİSANS OLUŞTUR │
│ │
│ Sahip Adı: [] │
│ E-posta: [] │
│ TikTok: [] │
│ │
│ Plan: [▼ Seçiniz ] │
│ ┌──────────────────────────┐ │
│ │ 🥉 Basic - 1 session │ │
│ │ 💎 Pro - 3 session │ │
│ │ 🥇 Premium - 5 session │ │
│ │ 👑 Unlimited - ∞ session │ │
│ └──────────────────────────┘ │
│ │
│ Süre: [▼ Seçiniz ] │
│ ┌──────────────────────────┐ │
│ │ 7 gün │ │
│ │ 30 gün │ │
│ │ 90 gün │ │
│ │ 180 gün │ │
│ │ 365 gün │ │
│ │ Süresiz │ │
│ └──────────────────────────┘ │
│ │
│ Max Session: [ 1 ] (aynı anda kaç yayın) │
│ │
│ Özellikler: │
│ [✅] Tüm ligler │
│ [✅] Elite kart (90-99) │
│ [✅] Kart animasyonları │
│ [✅] Ses efektleri │
│ [✅] Profil kaydetme │
│ [✅] Ekran görüntüsü indirme │
│ [ ] Özel kart tasarımı │
│ [ ] API erişimi │
│ │
│ Notlar: [] │
│ [_________________________] │
│ │
│ [❌ İptal] [✅ Lisans Oluştur] │
│ │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Oluşturulan Lisans Anahtarı: │
│ ┌──────────────────────────────────────────┐ │
│ │ KK-A7F2-B9D1-E4C8 │ [📋 Kopyala]│
│ └──────────────────────────────────────────┘ │
│ │
└──────────────────────────────────────────────────────────────┘

LİSANS DETAY SAYFASI:
┌──────────────────────────────────────────────────────────────┐
│ 🔑 LİSANS DETAYI: KK-A7F2-B9D1-E4C8 │
│ │
│ ┌──────────────────┬───────────────────────────────┐ │
│ │ Sahip │ Ali Yılmaz │ │
│ │ E-posta │ ali@email.com │ │
│ │ TikTok │ @aliyilmaz_live │ │
│ │ Plan │ 💎 Pro │ │
│ │ Durum │ ✅ Aktif │ │
│ │ Max Session │ 3 │ │
│ │ Aktif Session │ 1 │ │
│ │ Oluşturulma │ 01.01.2025 14:30 │ │
│ │ Aktifleştirme │ 01.01.2025 15:45 │ │
│ │ Bitiş Tarihi │ 01.02.2025 15:45 │ │
│ │ Kalan Süre │ 17 gün 3 saat │ │
│ │ Toplam Kullanım │ 34 session │ │
│ │ Son Kullanım │ 14.01.2025 21:30 │ │
│ │ Son IP │ 85.XXX.XXX.XXX │ │
│ └──────────────────┴───────────────────────────────┘ │
│ │
│ 📊 KULLANIM GRAFİĞİ │
│ (Son 30 günlük session sayısı çizgi grafik) │
│ │
│ 📜 SON AKTİVİTELER │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 14.01 21:30 │ Session başlatıldı │ TikTok: @ali34 │ │
│ │ 14.01 23:45 │ Session bitti │ Süre: 2s 15dk │ │
│ │ 13.01 20:00 │ Session başlatıldı │ TikTok: @ali34 │ │
│ │ 13.01 21:30 │ Session bitti │ Süre: 1s 30dk │ │
│ │ 10.01 19:00 │ Lisans yenilendi │ +30 gün │ │
│ └──────────────────────────────────────────────────────┘ │
│ │
│ [✏️ Düzenle] [🔄 Süre Uzat] [⏸️ Askıya Al] [🗑️ İptal Et] │
│ │
└──────────────────────────────────────────────────────────────┘

----- AKTİF SESSIONLAR SAYFASI -----

Gerçek zamanlı olarak aktif olan tüm sessionları gösterir.
Socket.io ile canlı güncellenir.

┌──────────────────────────────────────────────────────────────────┐
│ 📡 AKTİF SESSIONLAR (5 aktif) [🔄 Yenile] │
│ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 🟢 Session: abc123 │ │
│ │ 👤 Ali Yılmaz (KK-A7F2-B9D1-E4C8) │ │
│ │ 📱 TikTok: @aliyilmaz_live │ │
│ │ ⏱️ Süre: 1s 23dk │ │
│ │ 🃏 Açılan kart: 18 | 👥 Katılımcı: 12 │ │
│ │ 📊 Takımlar: Aslanlar(743) Kartallar(621) │ │
│ │ Kanarya(589) Boğalar(512) │ │
│ │ [👁️ İzle] [⏹️ Durdur] [🗑️ Zorla Kapat] │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 🟢 Session: def456 │ │
│ │ 👤 Mehmet Kaya (KK-B3E1-C7A2-F5D9) │ │
│ │ 📱 TikTok: @mehmet_futbol │ │
│ │ ⏱️ Süre: 45dk │ │
│ │ 🃏 Açılan kart: 7 | 👥 Katılımcı: 5 │ │
│ │ [👁️ İzle] [⏹️ Durdur] [🗑️ Zorla Kapat] │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
└──────────────────────────────────────────────────────────────────┘

----- İSTATİSTİKLER SAYFASI -----

Detaylı kullanım istatistikleri:

Günlük / Haftalık / Aylık session sayıları
En çok kullanan lisans sahipleri
Ortalama session süresi
Toplam açılan kart sayısı (tüm zamanlar)
En popüler liglet
Peak kullanım saatleri
Sunucu performansı (CPU, RAM, aktif process)
----- SİSTEM AYARLARI SAYFASI -----

┌──────────────────────────────────────────────────────────────┐
│ ⚙️ SİSTEM AYARLARI │
│ │
│ 🔐 Admin Şifresi Değiştir │
│ Mevcut Şifre: [] │
│ Yeni Şifre: [] │
│ Tekrar: [_______________] │
│ [💾 Şifreyi Güncelle] │
│ │
│ 📋 Plan Tanımları │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Plan Adı │ Max Session │ Özellikler │ [✏️ Düzenle]│ │
│ │─────────────┼─────────────┼────────────┼────────────│ │
│ │ 🥉 Basic │ 1 │ Temel │ [✏️] │ │
│ │ 💎 Pro │ 3 │ Gelişmiş │ [✏️] │ │
│ │ 🥇 Premium │ 5 │ Tam │ [✏️] │ │
│ │ 👑 Unlimited│ ∞ │ Tam + API │ [✏️] │ │
│ └──────────────────────────────────────────────────────┘ │
│ │
│ 🌐 Genel Ayarlar │
│ Max toplam aktif session: [ 50 ] │
│ Session timeout (dakika): [ 300 ] │
│ Otomatik temizleme: [✅ Açık] │
│ Log tutma süresi (gün): [ 90 ] │
│ │
│ [💾 Kaydet] │
│ │
└──────────────────────────────────────────────────────────────┘

----- LOG SAYFASI -----

Tüm sistem logları filtrelenebilir tablo:

Tarih/saat filtresi
İşlem türü filtresi (lisans, session, hata, sistem)
Kullanıcı filtresi
Dışa aktar (CSV)
=============================================================
LİSANS DOĞRULAMA AKIŞI:
Yayıncı /panel sayfasını açar

Lisans anahtarı giriş ekranı gösterilir:
┌─────────────────────────────────────┐
│ ⚽ KADRO KUR │
│ │
│ 🔑 Lisans Anahtarınızı Girin │
│ [KK---____] │
│ │
│ [✅ Giriş Yap] │
│ │
│ Lisansınız yok mu? │
│ [📧 İletişim] │
└─────────────────────────────────────┘

POST /api/license/validate → lisans kontrolü

Kontroller:

Lisans anahtarı veritabanında var mı?
Status 'active' mi?
expires_at > şu an mı?
Aktif session sayısı < max_sessions mı?
Geçerliyse:

license_logs'a 'login' kaydı
total_usage_count++
last_used_at güncelle
last_used_ip güncelle
Panel açılır
Geçersizse:

Hata mesajı gösterilir:
"Geçersiz lisans anahtarı"
"Lisansınızın süresi dolmuş"
"Lisansınız askıya alınmış"
"Maksimum session limitine ulaştınız"
=============================================================
LİSANS API ENDPOİNTLERİ:
// Admin endpoints (JWT gerekli)
POST /api/admin/login → Admin girişi, JWT döndür
GET /api/admin/dashboard → Dashboard istatistikleri
POST /api/admin/change-password→ Şifre değiştir

// Lisans CRUD (JWT gerekli)
GET /api/licenses → Tüm lisansları listele
GET /api/licenses/:id → Lisans detayı
POST /api/licenses → Yeni lisans oluştur
PUT /api/licenses/:id → Lisans güncelle
DELETE /api/licenses/:id → Lisans sil
POST /api/licenses/:id/suspend → Askıya al
POST /api/licenses/:id/activate→ Aktifleştir
POST /api/licenses/:id/extend → Süre uzat
GET /api/licenses/:id/logs → Lisans logları

// Aktif session'lar (JWT gerekli)
GET /api/sessions/active → Aktif session listesi
GET /api/sessions/:id → Session detayı
DELETE /api/sessions/:id → Session'ı zorla kapat

// İstatistikler (JWT gerekli)
GET /api/stats/overview → Genel istatistikler
GET /api/stats/usage → Kullanım grafik verileri
GET /api/stats/system → Sistem performansı

// Loglar (JWT gerekli)
GET /api/logs → Filtrelenebilir loglar
GET /api/logs/export → CSV dışa aktarım

// Public endpoints (lisans key gerekli)
POST /api/license/validate → Lisans doğrulama (panel girişi)
POST /api/session/create → Session oluştur
POST /api/session/stop → Session durdur
GET /api/session/:id/state → Oyun durumu

// Game endpoints (session_id gerekli)
GET /api/game/:session_id → Oyun durumu
POST /api/game/:session_id/settings → Oyun ayarlarını güncelle
POST /api/game/:session_id/team → Takım ayarlarını güncelle
POST /api/game/:session_id/draw → Kart çek ve ata
POST /api/game/:session_id/end → Oyunu bitir

// Profile (public)
GET /api/profile/:license_id → Profil verileri
GET /api/profile/:license_id/history → Geçmiş oyunlar

// Health check
GET /api/health → Sistem durumu

=============================================================
FUTBOLCU VERİLERİ (players.json):
Gerçek futbolculardan oluşan bir veritabanı oluştur.
FIFA/EA FC tarzı veriler kullan. Minimum 500 oyuncu olsun.
Şu liglerden oyuncular dahil edilsin:

Süper Lig (Türkiye) - minimum 80 oyuncu
Premier League (İngiltere) - minimum 100 oyuncu
La Liga (İspanya) - minimum 80 oyuncu
Serie A (İtalya) - minimum 80 oyuncu
Bundesliga (Almanya) - minimum 80 oyuncu
Ligue 1 (Fransa) - minimum 80 oyuncu
Her oyuncu şu formatta:

{
"id": 1,
"name": "Lionel Messi",
"position": "RW",
"nationality": "Argentina",
"nationalityFlag": "🇦🇷",
"club": "Inter Miami",
"league": "MLS",
"overall": 93,
"stats": {
"pace": 81,
"shooting": 92,
"passing": 91,
"dribbling": 95,
"defending": 34,
"physical": 65
},
"tier": "elite"
}

Tier belirleme:

overall 50-70 → "bronze"
overall 70-84 → "silver"
overall 85-90 → "gold"
overall 90-99 → "elite"
Pozisyon kısaltmaları:
GK, CB, LB, RB, LWB, RWB, CDM, CM, CAM, LM, RM, LW, RW, ST

Her oyuncu SADECE kendi gerçek pozisyonunda oynayabilir.

=============================================================
KART TİER SİSTEMİ:
BRONZ (🟫):

Tetiklenme: Beğeni hedefine ulaşma
OVR Aralığı: 50-70 (yayıncı değiştirebilir)
Kart rengi: #CD7F32
Animasyon: Basit flip + parıltı
GÜMÜŞ (⬜):

Tetiklenme: 20 jetonluk hediye
OVR Aralığı: 70-84
Kart rengi: #C0C0C0
Animasyon: Flip + gümüş parlama
ALTIN (🟡):

Tetiklenme: 50 jetonluk hediye
OVR Aralığı: 85-90
Kart rengi: #FFD700
Animasyon: Flip + altın ışık saçılması
ELİT (💎):

Tetiklenme: 100 jetonluk hediye
OVR Aralığı: 90-99
Kart rengi: gradient #8B00FF → #00BFFF
Animasyon: Dramatik açılış + ekran titremesi + ses
=============================================================
OYUN KURALLARI:
Her zaman 4 takım vardır.

BEĞENİ SAYACI:

Her kullanıcının beğeni sayısı AYRI takip edilir
TikTok kombolarını yakala (event.likes değerini kullan,
her zaman 1 değil, kombo kadar ekle)
Hedefe ulaşınca BRONZ kart hakkı
Sayaç SIFIRLANIR ve tekrar biriktirebilir
Sınırsız tekrar
HEDİYE SİSTEMİ:

Hediye anında hak kazanılır
Jeton değerine göre tier belirlenir
Streak gift'lerde streak bitince toplam hesaplanır
KART DAĞITIMI:

Hak kazanınca ekranda bildirim
Yayıncı sorar: hangi takıma?
Kullanıcı yorumda belirtir
Yayıncı panelden takım butonuna tıklar
Rastgele kart çekilir
Animasyonlu gösterim
AYNI OYUNCU: Bir oyuncu sadece 1 takımda. Havuzdan
seçilince diğer takımlar için kullanılamaz.

POZİSYON YERLEŞTİRME:

Gerçek pozisyonuna yerleşir
Boşsa → ekle
Doluysa:
Yeni > Mevcut → değiştir (eski gider)
Yeni <= Mevcut → RED (hak yanar)
Çoklu slot (ör: 2 CB): Önce boşa, yoksa en zayıfla
karşılaştır
FORMASYON: Yayıncı belirler

4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 3-4-3, 5-3-2
OYUN BİTİŞ:

4 takım full kadro
VEYA kart havuzu bitti
VEYA yayıncı manuel bitirdi
Skor = kadrodaki OVR toplamı
Profile kaydedilir
=============================================================
SAYFA 1: OYUN EKRANI
URL: /game?session=SESSION_ID
OBS/TikTok Studio'da Browser Source olarak eklenir.
Arka plan ŞEFFAF (transparent). 1920x1080 çözünürlük.

session query parametresi olmadan açılırsa hata gösterir.
Geçersiz session ile açılırsa hata gösterir.

EKRAN DÜZENİ:

Üst: "⚽ KADRO KUR ⚽" başlık
Orta: 4 takım 2x2 grid veya yan yana
Her takım alanı:

Amblem (yayıncının yüklediği)
Takım adı
Toplam OVR / Ortalama OVR
Doluluk: 7/11
Formasyon düzeninde kartlar (saha pozisyonlarında)
Dolu: Mini FIFA kart (isim + OVR + pozisyon)
Boş: Noktalı çerçeve + "?"
Alt: Bildirim alanı

Görev tamamlama bildirimi
Kart açılış animasyonu
Ekleme/değiştirme/red bildirimi
KART TASARIMI (FIFA TARZI CSS):

Dikdörtgen kart şekli
Üst sol: OVR (büyük bold)
Üst sağ: Pozisyon
Orta: Oyuncu silüet/placeholder
Alt orta: Oyuncu adı
Alt: 6 stat grid (PAC SHO PAS DRI DEF PHY)
Milliyet bayrağı emoji
Kulüp adı
Tier'a göre arka plan renk/gradient
Tier'a göre glow efekti
KART AÇILIŞ ANİMASYONU:

Ekran hafif kararır
Tier renkli paket belirir (scale 0→1)
Paket titrer (1sn)
3D flip (Y ekseni 180°)
Kart bilgileri sırayla belirir
Tier efektleri:
BRONZ: Hafif parıltı
GÜMÜŞ: Gümüş yansıma
ALTIN: Altın parçacık yağmuru
ELİT: Ekran titremesi + ışık patlaması + ses
3sn kart gösterilir
Kart kadrodaki yerine uçar
Kadrodaki yere yerleşir (pop efekti)
BİLDİRİM ANİMASYONU:

Alt kısımdan slide-up
Bounce efekti
5sn kalır
Fade-out
=============================================================
SAYFA 2: YAYINCI PANELİ
URL: /panel
İlk açılışta lisans anahtarı giriş ekranı.
Doğrulandıktan sonra panel açılır.

SEKMELER:

TAKIM AYARLARI:

4 takım: ad, amblem yükleme, renk, formasyon seçimi
Kaydet + Önizle
OYUN AYARLARI:

TikTok kullanıcı adı + bağlan butonu
Bağlantı durumu göstergesi (🟢/🔴)
Beğeni hedefi (sayı input)
Tier OVR aralıkları (her tier min-max)
Lig seçimi (checkbox)
Toplam kart sayısı göstergesi
KART DAĞITIMI (Ana oyun ekranı):

Oyun kontrol: Başlat / Duraklat / Bitir
Kalan kart sayısı
Bekleyen istekler kuyruğu:
Kullanıcı adı
Tier bilgisi
Son yorum
4 takım butonu (tıkla → kart çek)
Kart çekme sonucu popup:
✅ Eklendi
🔄 Değiştirildi (eski oyuncu bilgisi)
❌ Reddedildi (mevcut daha güçlü)
Canlı kadro durumu (4 takım mini)
İşlem logları (zaman damgalı)
Son işlemi geri al butonu
SKOR & FİNAL:

Oyunu Bitir butonu
Skor tablosu (1-4 sıralama)
İstatistikler
Profile Kaydet
Ekran Görüntüsü İndir (html2canvas)
Yeni Oyun Başlat
PROFİL:

Geçmiş oyunlar listesi
Toplam istatistikler
Her oyunun detayı
Game URL göstergesi:
Panel üstünde her zaman görünür:
"📋 OBS URL: https://domain.com/game?session=abc123 [Kopyala]"

=============================================================
SAYFA 3: LİSANS PANELİ
URL: /licensepanel
Yukarıda detaylı anlatıldı. Admin girişi gerektirir.
Tüm lisans yönetimi, aktif session izleme, istatistikler,
loglar bu panelden yapılır.

Dark theme, modern dashboard tasarım.
Gerçek zamanlı güncelleme (Socket.io).
Responsive tasarım (mobil uyumlu).

=============================================================
SAYFA 4: PROFİL SAYFASI
URL: /profile/:license_id
Herkese açık. Lisans sahibinin geçmiş oyunlarını gösterir.
Paylaşılabilir. Güzel tasarım.

=============================================================
SOCKET.IO EVENT'LERİ (Session Bazlı):
Her session bir Socket.io room'udur.
Room adı: "session_{session_id}"

Server → Game Ekranı (room bazlı):

"team-updated": Kadro değişikliği
"card-opened": Kart açılış animasyonu verisi
"notification": Bildirim göster
"card-result": Ekleme/değiştirme/red sonucu
"game-ended": Oyun bitti, skor göster
"settings-changed": Ayar değişikliği
Server → Panel (room bazlı):

"new-request": Yeni görev tamamlayan
"like-update": Beğeni sayacı güncelleme
"tiktok-status": Bağlantı durumu
"card-result": Kart sonucu
"game-state": Oyun durumu
Server → License Panel:

"session-started": Yeni session başladı
"session-ended": Session bitti
"license-updated": Lisans değişikliği
"system-stats": Sistem istatistikleri
Panel → Server:

"assign-card": Takım seçimi (kart dağıt)
"update-team-settings": Takım ayarları
"update-game-settings": Oyun ayarları
"start-game": Oyunu başlat
"end-game": Oyunu bitir
"undo-last": Son işlemi geri al
"connect-tiktok": TikTok'a bağlan
"disconnect-tiktok": TikTok bağlantısını kes
=============================================================
CSS TASARIM GEREKSİNİMLERİ:
OYUN EKRANI:

Şeffaf arka plan
Neon/gaming tarzı
FIFA kart tasarımı CSS ile
1920x1080 sabit
Animasyonlar smooth (60fps)
Glow efektleri (box-shadow, filter)
YAYINCI PANELİ:

Dark mode (#1a1a2e, #16213e, #0f3460)
Büyük tıklanabilir butonlar (yayın sırasında hızlı)
Renkli durum göstergeleri
Scroll edilebilir kuyruk
Modern form elemanları
LİSANS PANELİ:

Profesyonel admin dashboard
Dark mode
Sidebar navigasyon
Responsive (mobil uyumlu)
Tablolar sortable/filterable
Grafikler (Chart.js veya vanilla SVG)
Kartlar (summary cards) üstte
Modern toggle/switch elemanları
PROFİL SAYFASI:

Temiz, modern
Açık veya koyu tema
Paylaşılabilir tasarım
Grid layout
=============================================================
SES EFEKTLERİ:
notification.mp3: Bildirim sesi (ding)
card-bronze.mp3: Bronz kart açılış
card-silver.mp3: Gümüş kart açılış
card-gold.mp3: Altın kart açılış
card-elite.mp3: Elit kart açılış (epik müzik)
card-reject.mp3: Kart red sesi (buzz)
game-end.mp3: Oyun bitiş fanfar
Not: Ses dosyaları placeholder olarak oluşturulabilir.
Web Audio API ile basit synth sesler de üretilebilir.

=============================================================
HATA YÖNETİMİ:
TikTok bağlantı hatası → Panel'de uyarı + otomatik
yeniden bağlanma (5 deneme, her 10sn)
Python process crash → Otomatik restart + log
Geçersiz session → Oyun ekranında hata mesajı
Kart havuzu bitti → Bildirim + oyun durumu güncelle
Lisans süresi doldu → Mevcut session devam eder ama
yeni session açılamaz
Veritabanı hatası → Hata logla, kullanıcıya mesaj göster
WebSocket kopması → Otomatik reconnect
=============================================================
GÜVENLİK:
Admin şifresi bcrypt ile hashlenir
JWT token 24 saat geçerli
Lisans anahtarı formatı: KK-XXXX-XXXX-XXXX
(rastgele alfanumerik)
Rate limiting (API istekleri)
Session ID tahmin edilemez (uuid v4)
Input sanitization (XSS koruması)
CORS ayarları
Helmet.js (HTTP güvenlik başlıkları)
=============================================================
GELİŞTİRME ADIMLARI (Sıralı):
ADIM 1: Proje altyapısı

package.json, Dockerfile, klasör yapısı
Node.js sunucu (Express + Socket.io)
SQLite veritabanı (otomatik tablo oluşturma)
İlk admin hesabı oluşturma
ADIM 2: Lisans sistemi

Lisans CRUD API'leri
JWT authentication
/licensepanel admin arayüzü (tam fonksiyonel)
Lisans doğrulama endpoint'i
ADIM 3: Session yönetimi

Session oluşturma/durdurma API'leri
Python TikTok connector
Node.js ↔ Python WebSocket bridge
Session izolasyonu
ADIM 4: Yayıncı paneli

Lisans giriş ekranı
Takım ayarları
Oyun ayarları
TikTok bağlantısı
ADIM 5: Oyun motoru

players.json (500+ oyuncu)
Kart çekme algoritması
Kadro yerleştirme mantığı
Beğeni sayacı
Hediye algılama
ADIM 6: Oyun ekranı

4 takım kadro görünümü
FIFA tarzı kart CSS
Kart açılış animasyonları
Bildirim sistemi
ADIM 7: Kart dağıtım paneli

Bekleyen istekler kuyruğu
Takım seçme butonları
Kart sonuç popup
İşlem logları
Geri al butonu
ADIM 8: Skor ve profil

Oyun bitiş skor tablosu
Profile kaydetme
Profil sayfası
Geçmiş oyunlar
Ekran görüntüsü indirme
ADIM 9: Polish

Ses efektleri
Gelişmiş animasyonlar
Hata yönetimi
Performans optimizasyonu
Responsive düzenlemeler
ADIM 10: Deploy

Dockerfile finalize
Coolify test
README.md (kurulum adımları)
Environment variables dokümantasyonu
=============================================================
ÖNEMLİ NOTLAR:
Tüm kod TAMAMEN ÇALIŞIR olmalı, placeholder/mock değil
Hata yönetimi her yerde olmalı (try-catch)
Console.log ile debug bilgileri
Kod yorumları TÜRKÇE
Modern JavaScript (ES6+)
Python kodu PEP8 uyumlu
Responsive: Sadece lisans paneli responsive olsun
(mobil erişim için). Game ekranı 1920x1080 sabit.
Panel masaüstü optimize.
İlk çalışmada HİÇBİR harici kurulum gerekmemeli
(veritabanı, config dosyası, vs.)
Docker build tek komutla çalışmalı
Coolify'da tek tık deploy olmalı
TikTok bağlantısında GECİKME OLMAMALI
Tüm like combo'ları, gift streak'ler yakalanmalı
Multi-tenant: En az 50 eşzamanlı session desteklemeli