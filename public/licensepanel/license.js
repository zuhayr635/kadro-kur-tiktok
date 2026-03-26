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
    showExtendModal: false,
    extendTarget: null,
    extendDays: 30,
    showPlayerModal: false,
    playerEdit: null,
    playerForm: { name: '', position: 'ST', overall: 75, club: '', league: '', nationality: '' },
    playerFilter: { tier: '', position: '', league: '' },

    async init() {
      if (this.token) {
        this.loadDashboard();
      }
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
        this.loginError = data?.error?.message || 'Giris basarisiz';
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
      this.licenseForm = { owner_name: '', owner_email: '', owner_tiktok: '', plan: 'basic', expires_at: '', notes: '' };
      this.showLicenseModal = true;
    },

    editLicense(lic) {
      this.licenseEdit = lic;
      this.licenseForm = {
        owner_name: lic.owner_name, owner_email: lic.owner_email || '',
        owner_tiktok: lic.owner_tiktok || '', plan: lic.plan,
        expires_at: lic.expires_at ? lic.expires_at.slice(0,10) : '', notes: lic.notes || ''
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
      } else {
        data = await this.api('POST', '/api/licenses', body);
      }
      if (data?.success) { this.showLicenseModal = false; this.loadLicenses(); }
    },

    extendLicense(lic) {
      this.extendTarget = lic;
      this.extendDays = 30;
      this.showExtendModal = true;
    },

    async confirmExtend() {
      await this.api('POST', `/api/licenses/${this.extendTarget.id}/extend`, { days: this.extendDays });
      this.showExtendModal = false;
      this.loadLicenses();
    },

    async toggleLicenseStatus(lic) {
      const action = lic.status === 'active' ? 'suspend' : 'activate';
      await this.api('POST', `/api/licenses/${lic.id}/${action}`);
      this.loadLicenses();
    },

    async deleteLicenseConfirm(lic) {
      if (!confirm(`"${lic.owner_name}" lisansini silmek istiyor musunuz?`)) return;
      await this.api('DELETE', `/api/licenses/${lic.id}`);
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
      if (data?.success) { this.showPlayerModal = false; this.loadPlayers(); }
      else alert(data?.error?.message || 'Hata olustu');
    },

    async deletePlayerConfirm(p) {
      if (!confirm(`"${p.name}" oyuncusunu silmek istiyor musunuz?`)) return;
      await this.api('DELETE', `/api/admin/players/${p.id}`);
      this.loadPlayers();
    },

    async loadSounds() {
      const data = await this.api('GET', '/api/admin/sounds');
      if (data?.success) this.sounds = data.data;
    },

    async setSoundMode(s, mode) {
      await this.api('PUT', `/api/admin/sounds/${s.sound_key}`, { mode });
      s.mode = mode;
    },

    async loadSettings() {
      const data = await this.api('GET', '/api/admin/settings');
      if (data?.success) this.settings = data.data;
    },

    async saveSetting(key, value) {
      await this.api('PUT', `/api/admin/settings/${key}`, { value });
    }
  };
}
