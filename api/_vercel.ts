import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * The request/response helpers Vercel's Node runtime adds to every function in api/. Typed here
 * instead of depending on @vercel/node, whose dependency tree carried npm audit warnings that no
 * version fixed. Files starting with "_" are never deployed as endpoints.
 */
export type VercelRequest = IncomingMessage & {
  query: Partial<Record<string, string | string[]>>
  body: unknown
  cookies: Partial<Record<string, string>>
}

export type VercelResponse = ServerResponse & {
  status(code: number): VercelResponse
  json(body: unknown): VercelResponse
  send(body: unknown): VercelResponse
}
