import { Hono } from 'hono'

export function createRouter() {
  return new Hono<{ Bindings: CloudflareBindings }>()
}
