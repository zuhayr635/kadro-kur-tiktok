// tests/license-manager.test.js
process.env.DB_PATH = ':memory:';
const { initDatabase } = require('../server/database');
const lm = require('../server/license-manager');

beforeAll(() => { initDatabase(); });

test('HIRA- formatinda lisans anahtari uretir', () => {
  const key = lm.generateKey();
  expect(key).toMatch(/^HIRA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

test('lisans olusturur ve getirir', () => {
  const lic = lm.createLicense({ owner_name: 'Test Kullanici', plan: 'basic' });
  expect(lic.license_key).toMatch(/^HIRA-/);
  const found = lm.getLicenseByKey(lic.license_key);
  expect(found.owner_name).toBe('Test Kullanici');
});

test('aktif lisansi dogrular', () => {
  const lic = lm.createLicense({ owner_name: 'Yayinci', plan: 'pro' });
  const result = lm.validateLicense(lic.license_key, 0);
  expect(result.valid).toBe(true);
});

test('suresi dolmus lisansi reddeder', () => {
  const lic = lm.createLicense({
    owner_name: 'Eski',
    plan: 'basic',
    expires_at: new Date(Date.now() - 86400000).toISOString()
  });
  const result = lm.validateLicense(lic.license_key, 0);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/suresi/i);
});

test('max session limitini kontrol eder', () => {
  const lic = lm.createLicense({ owner_name: 'Basic', plan: 'basic' }); // max_sessions: 1
  const result = lm.validateLicense(lic.license_key, 1); // 1 aktif session var
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/session/i);
});
