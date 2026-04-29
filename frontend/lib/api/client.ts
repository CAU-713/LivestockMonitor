/**
 * 统一的 HTTP 客户端
 * 基于 Fetch API 封装，提供统一的请求拦截、错误处理和超时控制等功能
 */

interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  data?: any;
  /** 请求超时毫秒数，默认 15000ms（15秒） */
  timeout?: number;
}

interface ApiResponse<T = any> {
  code?: number;
  data: T;
  message?: string;
}

const DEFAULT_TIMEOUT = 15000;

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
   * 带超时控制的 fetch 封装
   * 使用 AbortController 在指定时间后中止请求，避免请求无限 pending。
   *
   * @param url 请求地址
   * @param options fetch 选项
   * @param timeout 超时毫秒数
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = DEFAULT_TIMEOUT,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: this.getHeaders(config?.headers),
        ...config,
      },
      config?.timeout ?? DEFAULT_TIMEOUT,
    );

    return this.handleResponse<T>(response);
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: this.getHeaders(config?.headers),
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      },
      config?.timeout ?? DEFAULT_TIMEOUT,
    );

    return this.handleResponse<T>(response);
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'PUT',
        headers: this.getHeaders(config?.headers),
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      },
      config?.timeout ?? DEFAULT_TIMEOUT,
    );

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'DELETE',
        headers: this.getHeaders(config?.headers),
        ...config,
      },
      config?.timeout ?? DEFAULT_TIMEOUT,
    );

    return this.handleResponse<T>(response);
  }
}

// 创建默认实例
const apiClient = new HttpClient(process.env.NEXT_PUBLIC_API_BASE_URL || '/api');

export { HttpClient, apiClient };
export type { ApiResponse, RequestConfig };
