/**
 * 统一的 HTTP 客户端
 * 基于 Fetch API 封装，提供统一的请求拦截、错误处理等功能
 */

interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  data?: any;
}

interface ApiResponse<T = any> {
  code?: number;
  data: T;
  message?: string;
}

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 构建完整的 URL，包含查询参数
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    return url.toString();
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP Error: ${response.status}`,
      }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  }

  /**
   * 获取 Token（从 localStorage 或其他地方）
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  /**
   * 构建请求头
   */
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders as Record<string, string>,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(config?.headers),
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(config?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(config?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(config?.headers),
      ...config,
    });

    return this.handleResponse<T>(response);
  }
}

// 创建默认实例
const apiClient = new HttpClient(process.env.NEXT_PUBLIC_API_BASE_URL || '/api');

export { HttpClient, apiClient };
export type { ApiResponse, RequestConfig };
