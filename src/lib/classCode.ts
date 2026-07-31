const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export function normalizeClassCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidClassCode(code: string): boolean {
  return new RegExp(`^[A-Z0-9]{${CODE_LENGTH}}$`).test(code)
}

export function generateClassCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
