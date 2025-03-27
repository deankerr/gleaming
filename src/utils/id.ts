import { customAlphabet } from 'nanoid'
import { ulid } from 'ulidx'

const ALPHABET = '0123456789bcdfghjklmnpqrstvwxyz'
const nanoid = customAlphabet(ALPHABET)

export function generateExternalId() {
  return nanoid(10)
}

export function generateUniqueId() {
  return ulid()
}
