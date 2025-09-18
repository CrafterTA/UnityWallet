const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'

interface ApiResponse<T = any> {
  data: T
  message?: string
  status: 'success' | 'error'
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    // Add auth token if available - get from session store
    const authData = localStorage.getItem('unity-wallet-auth')
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        const token = parsed.state?.token
        if (token) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
          }
        }
      } catch (error) {
        console.error('Failed to parse auth data:', error)
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Backend returns data directly, not wrapped in {data: T}
      return { data, status: 'success' as const }
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
