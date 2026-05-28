import { StorageAuthService, IStorageProvider } from '../src/AuthService';

class SyncMockStorage implements IStorageProvider {
  private store: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}

class AsyncMockStorage implements IStorageProvider {
  private store: { [key: string]: string } = {};

  async getItem(key: string): Promise<string | null> {
    return this.store[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.store[key];
  }
}

describe('StorageAuthService', () => {
  describe('with Synchronous Storage', () => {
    let storage: SyncMockStorage;
    let authService: StorageAuthService;

    beforeEach(() => {
      storage = new SyncMockStorage();
      authService = new StorageAuthService(storage);
    });

    it('should return null when credentials do not exist', async () => {
      const creds = await authService.getCredentials();
      expect(creds).toBeNull();
    });

    it('should save and retrieve credentials successfully', async () => {
      await authService.saveCredentials('key123', 'secret456');
      const creds = await authService.getCredentials();
      expect(creds).toEqual({ apiKey: 'key123', apiSecret: 'secret456' });
    });

    it('should clear credentials successfully', async () => {
      await authService.saveCredentials('key123', 'secret456');
      await authService.clearCredentials();
      const creds = await authService.getCredentials();
      expect(creds).toBeNull();
    });

    it('should handle corrupted JSON data gracefully by returning null', async () => {
      storage.setItem('frappe_credentials', '{invalid_json}');
      const creds = await authService.getCredentials();
      expect(creds).toBeNull();
    });

    it('should handle missing fields in stored JSON gracefully by returning null', async () => {
      storage.setItem('frappe_credentials', JSON.stringify({ apiKey: 'only_key' }));
      const creds = await authService.getCredentials();
      expect(creds).toBeNull();
    });
  });

  describe('with Asynchronous Storage', () => {
    let storage: AsyncMockStorage;
    let authService: StorageAuthService;

    beforeEach(() => {
      storage = new AsyncMockStorage();
      authService = new StorageAuthService(storage);
    });

    it('should save and retrieve credentials successfully over async boundary', async () => {
      await authService.saveCredentials('asyncKey', 'asyncSecret');
      const creds = await authService.getCredentials();
      expect(creds).toEqual({ apiKey: 'asyncKey', apiSecret: 'asyncSecret' });
    });

    it('should clear credentials successfully over async boundary', async () => {
      await authService.saveCredentials('asyncKey', 'asyncSecret');
      await authService.clearCredentials();
      const creds = await authService.getCredentials();
      expect(creds).toBeNull();
    });
  });
});
