/**
 * API Client Helper
 * Centralized fetch wrapper with error handling for Yoonjaespace API
 */

export interface ApiResponse<T> {
  data?: T
  error?: string
}

/**
 * Generic API client with credentials and error handling
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(endpoint, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return { 
        error: errorData.error || errorData.message || `Request failed with status ${res.status}` 
      }
    }

    const data = await res.json()
    return { data }
  } catch (error) {
    console.error('API Client Error:', error)
    return { error: 'Network error. Please check your connection.' }
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { method: 'GET' })
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiClient<T>(endpoint, { method: 'DELETE' })
}

/**
 * SWR Fetcher
 * Throws error if request fails, suitable for useSWR
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const error = new Error(errorData.error || errorData.message || 'An error occurred while fetching the data.')
    // Attach extra info to the error object.
    // @ts-ignore
    error.info = errorData
    // @ts-ignore
    error.status = res.status
    throw error
  }

  return res.json()
}
