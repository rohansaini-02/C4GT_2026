import axios from 'axios';
import { FrappeClient } from '../src/FrappeClient';
import { MockAuthService } from '../src/AuthService';

describe('FrappeClient', () => {
  let client: FrappeClient;
  let authService: MockAuthService;
  const BASE_URL = 'https://tap-buddy.frappe.cloud';

  beforeEach(() => {
    authService = new MockAuthService();
    client = new FrappeClient(BASE_URL, authService);
  });

  it('should handle 401 errors by clearing credentials', async () => {
    await authService.saveCredentials('old_key', 'old_secret');
    
    const interceptor = (client as any).instance.interceptors.response.handlers[0];
    const error = {
      response: { status: 401 }
    };

    try {
      await interceptor.rejected(error);
    } catch (e) {}

    const creds = await authService.getCredentials();
    expect(creds).toBeNull();
  });

  it('should inject Authorization header in request interceptor', async () => {
    await authService.saveCredentials('my_key', 'my_secret');
    
    const interceptor = (client as any).instance.interceptors.request.handlers[0];
    const config = { headers: {} };

    const updatedConfig = await interceptor.fulfilled(config);
    
    expect(updatedConfig.headers.Authorization).toBe('token my_key:my_secret');
  });
});
