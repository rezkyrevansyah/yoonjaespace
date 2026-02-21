/**
 * Template parser for reminder messages
 * Replaces variables in template with actual booking data
 */

interface ReminderTemplateData {
  clientName: string
  date: string
  time: string
  packageName: string
  studioName?: string
  location?: string
  numberOfPeople?: number
  clientPageLink?: string
  [key: string]: any
}

/**
 * Default reminder message template
 */
export const DEFAULT_REMINDER_TEMPLATE = `Halo {{clientName}}, ini reminder untuk sesi foto kamu di {{studioName}} pada {{date}} pukul {{time}}. Paket: {{packageName}}. Ditunggu ya! 😊

Cek status booking kamu di: {{clientPageLink}}`

/**
 * Default thank you message template (after payment)
 */
export const DEFAULT_THANK_YOU_PAYMENT_TEMPLATE = `Terima kasih {{clientName}} sudah melakukan pembayaran untuk sesi foto di {{studioName}}! 🙏

Sesi foto kamu dijadwalkan pada {{date}} pukul {{time}}.
Paket: {{packageName}}

Ditunggu kehadirannya ya! Kalau ada pertanyaan, jangan ragu untuk chat kami.

Cek status booking: {{clientPageLink}}`

/**
 * Default thank you message template (after session)
 */
export const DEFAULT_THANK_YOU_SESSION_TEMPLATE = `Halo {{clientName}}, terima kasih sudah memilih {{studioName}} untuk sesi foto kamu! 🙏✨

Kami harap kamu puas dengan hasilnya. Jangan lupa cek status booking untuk melihat update foto kamu:
{{clientPageLink}}

Sampai jumpa lagi! 😊`

/**
 * Parse reminder template and replace variables
 * @param template - Template string with {{variable}} placeholders
 * @param data - Data object containing variable values
 * @returns Parsed message string
 */
export function parseReminderTemplate(template: string, data: ReminderTemplateData): string {
  let message = template

  // Replace all variables in format {{variableName}}
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    message = message.replace(regex, String(value ?? ''))
  })

  return message
}

/**
 * Get available template variables for documentation
 */
export const TEMPLATE_VARIABLES = [
  { key: '{{clientName}}', description: 'Nama klien' },
  { key: '{{date}}', description: 'Tanggal sesi (format: Senin, 1 Januari 2025)' },
  { key: '{{time}}', description: 'Waktu sesi (format: 10:00)' },
  { key: '{{packageName}}', description: 'Nama paket yang dibooking' },
  { key: '{{studioName}}', description: 'Nama studio' },
  { key: '{{numberOfPeople}}', description: 'Jumlah orang' },
  { key: '{{clientPageLink}}', description: 'Link halaman status booking untuk client' },
]

/**
 * Validate template syntax
 * @param template - Template string to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateTemplate(template: string): { isValid: boolean; error?: string } {
  if (!template || template.trim().length === 0) {
    return { isValid: false, error: 'Template tidak boleh kosong' }
  }

  // Check for unclosed brackets
  const openBrackets = (template.match(/\{\{/g) || []).length
  const closeBrackets = (template.match(/\}\}/g) || []).length

  if (openBrackets !== closeBrackets) {
    return { isValid: false, error: 'Ada bracket {{ }} yang tidak tertutup dengan benar' }
  }

  // Check for invalid variable format
  const variablePattern = /\{\{[^}]*\}\}/g
  const variables = template.match(variablePattern) || []

  for (const variable of variables) {
    // Check if variable has proper format
    if (!/^\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}$/.test(variable)) {
      return {
        isValid: false,
        error: `Variable "${variable}" tidak valid. Gunakan format {{namaVariable}} dengan huruf, angka, dan underscore saja`
      }
    }
  }

  return { isValid: true }
}
