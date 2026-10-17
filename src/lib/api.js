const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export const ACCESS_TOKEN_KEY = 'sherides_access_token'
export const API_USER_KEY = 'sherides_api_user'

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function storeSession(token, user) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  sessionStorage.setItem(API_USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(API_USER_KEY)
}

export async function apiRequest(path, { method = 'GET', body, token = getAccessToken() } = {}) {
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the SheRides server. Check the API address and try again.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    const contentType = response.headers.get('content-type') || ''
    const error = !contentType.includes('application/json')
      ? new Error('The MongoDB API is not connected to this site. Deploy the API and set VITE_API_URL to its public URL.')
      : new Error('The server returned an invalid response. Please try again.')
    error.status = response.status
    throw error
  }

  if (!response.ok) {
    const error = new Error(payload.error || 'The server could not complete your request.')
    error.status = response.status
    throw error
  }
  return payload
}
