import { z } from 'zod';
import { HttpError } from './security.js';
export function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(400, 'Invalid request');
  return result.data;
}
const url = z.string().max(2048).refine(value => {
  if (!value) return true;
  if (/[\x00-\x1f\x7f\\]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try { const parsed = new URL(value); return parsed.protocol === 'https:' && !parsed.username && !parsed.password; }
  catch { return false; }
}, 'Invalid URL').transform(value => value.replace(/ /g, '%20'));
export const projectSchema = z.object({
  title: z.string().trim().min(1).max(255), simplifiedDescription: z.string().max(10000),
  fullDescription: z.string().max(100000).default(''), technologies: z.array(z.string().max(100)).max(50).default([]),
  category: z.string().max(100).nullable().optional(),
  imageUrl: url.nullable().optional(), projectUrl: url.nullable().optional(), githubUrl: url.nullable().optional(),
  status: z.enum(['finished', 'ongoing']).default('finished'),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});
export const settingsSchema = z.object({
  contactEmail: z.union([z.string().email().max(254), z.literal('')]).nullable().optional(),
  contactPhone: z.string().max(80).nullable().optional(), bio: z.string().max(20000).nullable().optional(),
  linkedinUrl: url.nullable().optional(), logoUrls: z.array(url).max(20).default([]),
});
export function projectId(value: unknown) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,9}$/.test(value)) throw new HttpError(400, 'Invalid project ID');
  const id = Number(value);
  if (id > 2147483647) throw new HttpError(400, 'Invalid project ID');
  return id;
}
