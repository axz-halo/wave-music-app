import supabase from './supabaseClient';

/**
 * API Client for making authenticated requests
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (supabase) {
      const session = await supabase.auth.getSession();
      if (session.data.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
      }
    }

    return headers;
  }

  static async get<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        ok: true,
        data,
      };
    } catch (error) {
      console.error('API GET Error:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async post<T = any>(
    url: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers: {
          ...headers,
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        ok: true,
        data,
      };
    } catch (error) {
      console.error('API POST Error:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async put<T = any>(
    url: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        ...options,
        method: 'PUT',
        headers: {
          ...headers,
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        ok: true,
        data,
      };
    } catch (error) {
      console.error('API PUT Error:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async delete<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(url, {
        ...options,
        method: 'DELETE',
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        ok: true,
        data,
      };
    } catch (error) {
      console.error('API DELETE Error:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

