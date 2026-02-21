/**
 * Validation Utilities
 */

/**
 * Validate if a string is a valid URL
 * Supports http, https, and allows localhost, IPs, and ports
 *
 * @param url - URL string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Validate URL with user-friendly error message
 *
 * @param url - URL string to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL tidak boleh kosong' }
  }

  if (!isValidUrl(url)) {
    return { isValid: false, error: 'URL tidak valid. Harus diawali dengan http:// atau https://' }
  }

  return { isValid: true }
}
