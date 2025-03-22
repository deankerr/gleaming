import { customAlphabet } from 'nanoid'

const ALPHABET = '0123456789bcdefghjklmnpqrstvwxyz'
const nanoid = customAlphabet(ALPHABET)

export function generateExternalId() {
  return nanoid(8)
}
