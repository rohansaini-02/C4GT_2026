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
