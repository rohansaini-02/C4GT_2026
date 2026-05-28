export interface IAuthService {
  getCredentials(): Promise<{ apiKey: string; apiSecret: string } | null>;
  saveCredentials(apiKey: string, apiSecret: string): Promise<void>;
  clearCredentials(): Promise<void>;
}

export class MockAuthService implements IAuthService {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;

  async getCredentials() {
    if (!this.apiKey || !this.apiSecret) return null;
    return { apiKey: this.apiKey, apiSecret: this.apiSecret };
  }

  async saveCredentials(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async clearCredentials() {
    this.apiKey = null;
    this.apiSecret = null;
  }
}

export interface IStorageProvider {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export class StorageAuthService implements IAuthService {
  private storage: IStorageProvider;
  private readonly storageKey: string;

  constructor(storage: IStorageProvider, storageKey: string = 'frappe_credentials') {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  public async getCredentials(): Promise<{ apiKey: string; apiSecret: string } | null> {
    try {
      const data = await this.storage.getItem(this.storageKey);
      if (!data) {
        return null;
      }
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.apiKey === 'string' && typeof parsed.apiSecret === 'string') {
        return { apiKey: parsed.apiKey, apiSecret: parsed.apiSecret };
      }
      return null;
    } catch {
      return null;
    }
  }

  public async saveCredentials(apiKey: string, apiSecret: string): Promise<void> {
    const data = JSON.stringify({ apiKey, apiSecret });
    await this.storage.setItem(this.storageKey, data);
  }

  public async clearCredentials(): Promise<void> {
    await this.storage.removeItem(this.storageKey);
  }
}
