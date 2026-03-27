// public/licensepanel/license.js
function app() {
  return {
    token: localStorage.getItem('admin_token'),
    tab: 'dashboard',
    loginForm: { username: '', password: '' },
    loginError: '',
    loginLoading: false,
    dashboard: {},
    licenses: [],
    players: [],
    sounds: [],
    settings: {},
    showLicenseModal: false,
    licenseEdit: null,
    licenseForm: { owner_name: '', owner_email: '', owner_tiktok: '', plan: 'basic', expires_at: '', notes: '' },
    createdLicenseKey: '',
    showExtendModal: false,
    extendTarget: null,
    extendDays: 30,
    showPlayerModal: false,
    playerEdit: null,
    playerForm: { name: '', position: 'ST', overall: 75, club: '', league: '', nationality: '' },
    playerFilter: { tier: '', position: '', league: '' },
    toast: { show: false, msg: '', type: 'success' },

    // Ses efektleri için anlaşılır etiketler
    soundLabels: {
      'notification': 'Bildirim Sesi',
      'card-bronze': 'Bronz Kart Açılışı',
      'card-silver': 'Gümüş Kart Açılışı',
      'card-gold': 'Altın Kart Açılışı',
      'card-elite': 'Elit Kart Açılışı',
      'card-reject': 'Kart Red Sesi',
      'game-end': 'Oyun Bitiş Müziği'
    },

    // Sistem ayarları için anlaşılır etiketler
    settingLabels: {
      'game_layout': { title: 'Oyun Ekranı Düzeni', desc: '2x2 (kare grid), 4col (yan yana), focus (odak modu)' },
      'like_threshold': { title: 'Beğeni Hedefi', desc: 'Bronz kart için gereken beğeni sayısı' },
      'max_concurrent_sessions': { title: 'Maksimum Eş Zamanlı Yayın', desc: 'Sistemdeki toplam eş zamanlı yayın limiti' },
      'session_timeout_minutes': { title: 'Yayın Zaman Aşımı (dakika)', desc: 'Otomatik kapanma süresi (dakika cinsinden)' },
      'log_retention_days': { title: 'Log Saklama Süresi (gün)', desc: 'Sistem logları kaç gün saklanacak' },
      'ws_port_start': { title: 'WebSocket Başlangıç Portu', desc: 'TikTok bağlantısı için port aralığı başlangıcı' },
      'ws_port_end': { title: 'WebSocket Bitiş Portu', desc: 'TikTok bağlantısı için port aralığı bitişi' }
    },

    async init() {
      if (this.token) {
        this.loadDashboard();
      }
    },

    showToast(msg, type = 'success') {
      this.toast = { show: true, msg, type };
      setTimeout(() => { this.toast.show = false; }, 3000);
    },

    async api(method, path, body) {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) }
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(path, opts);
      const data = await res.json();
      if (res.status === 401) { this.logout(); return null; }
      return data;
    },

    async login() {
      this.loginLoading = true;
      this.loginError = '';
      const data = await this.api('POST', '/api/admin/login', this.loginForm);
      this.loginLoading = false;
      if (data?.success) {
        this.token = data.data.token;
        localStorage.setItem('admin_token', this.token);
        this.loadDashboard();
      } else {
        this.loginError = data?.error?.message || 'Giriş başarısız';
      }
    },

    logout() {
      this.token = null;
      localStorage.removeItem('admin_token');
    },

    async loadDashboard() {
      this.tab = 'dashboard';
      const data = await this.api('GET', '/api/admin/dashboard');
      if (data?.success) this.dashboard = data.data;
    },

    async loadLicenses() {
      const data = await this.api('GET', '/api/licenses');
      if (data?.success) this.licenses = data.data;
    },

    openLicenseModal() {
      this.licenseEdit = null;
      this.createdLicenseKey = '';
      this.licenseForm = { owner_name: '', owner_email: '', owner_tiktok: '', plan: 'basic', expires_at: '', notes: '' };
      this.showLicenseModal = true;
    },

    editLicense(lic) {
      this.licenseEdit = lic;
      this.createdLicenseKey = '';
      this.licenseForm = {
        owner_name: lic.owner_name, owner_email: lic.owner_email || '',
        owner_tiktok: lic.owner_tiktok || '', plan: lic.plan,
        expires_at: lic.expires_at ? lic.expires_at.slice(0, 10) : '', notes: lic.notes || ''
      };
      this.showLicenseModal = true;
    },

    async saveLicense() {
      const body = { ...this.licenseForm };
      if (body.expires_at) body.expires_at = new Date(body.expires_at).toISOString();
      else delete body.expires_at;
      let data;
      if (this.licenseEdit) {
        data = await this.api('PUT', `/api/licenses/${this.licenseEdit.id}`, body);
        if (data?.success) {
          this.showLicenseModal = false;
          this.showToast('Lisans güncellendi');
          this.loadLicenses();
        }
      } else {
        data = await this.api('POST', '/api/licenses', body);
        if (data?.success && data.data) {
          // Yeni lisans olusturuldu - anahtari goster
          this.createdLicenseKey = data.data.license_key;
          this.showToast('Lisans oluşturuldu');
          this.loadLicenses();
        }
      }
      if (!data?.success) {
        this.showToast(data?.error?.message || 'Bir hata oluştu', 'error');
      }
    },

    copyKey() {
      if (this.createdLicenseKey) {
        navigator.clipboard.writeText(this.createdLicenseKey);
        this.showToast('Lisans anahtarı panoya kopyalandı');
      }
    },

    extendLicense(lic) {
      this.extendTarget = lic;
      this.extendDays = 30;
      this.showExtendModal = true;
    },

    async confirmExtend() {
      const data = await this.api('POST', `/api/licenses/${this.extendTarget.id}/extend`, { days: this.extendDays });
      this.showExtendModal = false;
      if (data?.success) {
        this.showToast(`Lisans ${this.extendDays} gün uzatıldı`);
      }
      this.loadLicenses();
    },

    async toggleLicenseStatus(lic) {
      const action = lic.status === 'active' ? 'suspend' : 'activate';
      const data = await this.api('POST', `/api/licenses/${lic.id}/${action}`);
      if (data?.success) {
        this.showToast(action === 'suspend' ? 'Lisans askıya alındı' : 'Lisans aktif edildi');
      }
      this.loadLicenses();
    },

    async deleteLicenseConfirm(lic) {
      if (!confirm(`"${lic.owner_name}" adli lisansı silmek istediğinize emin misiniz?`)) return;
      await this.api('DELETE', `/api/licenses/${lic.id}`);
      this.showToast('Lisans silindi');
      this.loadLicenses();
    },

    async loadPlayers() {
      const params = new URLSearchParams();
      if (this.playerFilter.tier) params.set('tier', this.playerFilter.tier);
      if (this.playerFilter.position) params.set('position', this.playerFilter.position);
      if (this.playerFilter.league) params.set('league', this.playerFilter.league);
      const data = await this.api('GET', `/api/admin/players?${params}`);
      if (data?.success) this.players = data.data;
    },

    openPlayerModal() {
      this.playerEdit = null;
      this.playerForm = { name: '', position: 'ST', overall: 75, club: '', league: '', nationality: '' };
      this.showPlayerModal = true;
    },

    editPlayer(p) {
      this.playerEdit = p;
      this.playerForm = { name: p.name, position: p.position, overall: p.overall, club: p.club || '', league: p.league || '', nationality: p.nationality || '' };
      this.showPlayerModal = true;
    },

    async savePlayer() {
      let data;
      if (this.playerEdit) {
        data = await this.api('PUT', `/api/admin/players/${this.playerEdit.id}`, this.playerForm);
      } else {
        data = await this.api('POST', '/api/admin/players', this.playerForm);
      }
      if (data?.success) {
        this.showPlayerModal = false;
        this.showToast(this.playerEdit ? 'Oyuncu güncellendi' : 'Oyuncu eklendi');
        this.loadPlayers();
      } else {
        this.showToast(data?.error?.message || 'Bir hata oluştu', 'error');
      }
    },

    async deletePlayerConfirm(p) {
      if (!confirm(`"${p.name}" adli oyuncuyu silmek istediğinize emin misiniz?`)) return;
      await this.api('DELETE', `/api/admin/players/${p.id}`);
      this.showToast('Oyuncu silindi');
      this.loadPlayers();
    },

    async loadSounds() {
      const data = await this.api('GET', '/api/admin/sounds');
      if (data?.success) this.sounds = data.data;
    },

    async setSoundMode(s, mode) {
      await this.api('PUT', `/api/admin/sounds/${s.sound_key}`, { mode });
      s.mode = mode;
      this.showToast(mode === 'synth' ? 'Otomatik ses seçildi' : 'Özel ses modu seçildi');
    },

    async uploadSound(s, event) {
      const file = event.target.files[0];
      if (!file) return;
      // Ses dosyasi yukleme - sunucu destegi eklendiginde aktif olacak
      this.showToast(`"${file.name}" dosyası seçildi (yükleme yakında)`);
    },

    async loadSettings() {
      const data = await this.api('GET', '/api/admin/settings');
      if (data?.success) this.settings = data.data;
    },

    async saveSetting(key, value) {
      const data = await this.api('PUT', `/api/admin/settings/${key}`, { value });
      if (data?.success) {
        this.showToast('Ayar kaydedildi');
      }
    }
  };
}
