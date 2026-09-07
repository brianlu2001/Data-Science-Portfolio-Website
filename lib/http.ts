import type { IncomingMessage, ServerResponse } from 'node:http';
// Structural types for Vercel's Node functions; no deployment tooling at runtime.
export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
  body?: any;
}
export interface VercelResponse extends ServerResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  redirect(code: number, url: string): VercelResponse;
}
