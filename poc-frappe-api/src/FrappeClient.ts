import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { IAuthService } from './AuthService';
import { UserProfile, LMSCourse } from './models';

export class FrappeClient {
  private instance: AxiosInstance;
  private authService: IAuthService;

  constructor(baseUrl: string, authService: IAuthService) {
    this.authService = authService;
    this.instance = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.instance.interceptors.request.use(async (config) => {
      const credentials = await this.authService.getCredentials();
      if (credentials) {
        config.headers.Authorization = `token ${credentials.apiKey}:${credentials.apiSecret}`;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status } = error.response;
          if (status === 401 || status === 403) {
            console.error('[FrappeClient] Authentication failed. Clearing credentials.');
            this.authService.clearCredentials();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<{ data: T } | T>(url, config);
    return (response.data as any).data || response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<{ data: T } | T>(url, data, config);
    return (response.data as any).data || response.data;
  }

  async getProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/api/method/frappe.auth.get_logged_user_info');
  }

  async getCourses(): Promise<LMSCourse[]> {
    return this.get<LMSCourse[]>('/api/resource/LMS Course');
  }
}
