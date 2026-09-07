import type { VercelRequest } from './http.js';
import { IncomingForm } from 'formidable';
import { put } from '@vercel/blob';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { endpoint, requireAuth, rateLimit, HttpError } from './security.js';
let localDirectory: string | undefined;
export function useLocalUploads(directory: string) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Local uploads forbidden');
  localDirectory = directory;
}
export async function validateUpload(buffer: Buffer, name: string, mime: string, kind: 'image' | 'report') {
  const detected = await fileTypeFromBuffer(buffer).catch(() => undefined);
  const ext = path.extname(name).toLowerCase().slice(1);
  const accepted = kind === 'image' ? ['jpg','png','gif','webp'] : ['pdf','docx'];
  if (!detected || !accepted.includes(detected.ext) ||
      ![detected.ext, ...(detected.ext === 'jpg' ? ['jpeg'] : [])].includes(ext) ||
      mime !== detected.mime) throw new HttpError(400, 'File content, extension and type must match');
  if (kind === 'image') {
    try {
      // Decode and re-encode to strip metadata and non-image payloads.
      const clean = await sharp(buffer, { limitInputPixels: 25_000_000, animated: true }).webp().toBuffer();
      if (clean.length > 4 * 1024 * 1024) throw new Error('Too large');
      return { buffer: clean, ext: 'webp', mime: 'image/webp' };
    } catch { throw new HttpError(400, 'Invalid or oversized image'); }
  }
  return { buffer, ext: detected.ext, mime: detected.mime };
}
async function readFile(req: VercelRequest, kind: 'image' | 'report') {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-upload-'));
  try {
    const form = new IncomingForm({ uploadDir: directory, maxFiles: 1, maxFileSize: 4 * 1024 * 1024,
      maxTotalFileSize: 4 * 1024 * 1024, maxFields: 0, maxFieldsSize: 1024, allowEmptyFiles: false });
    let files;
    try { [, files] = await form.parse(req); }
    catch { throw new HttpError(400, 'Invalid upload. One file under 4 MB is required.'); }
    const items = files[kind];
    if (!items || items.length !== 1 || Object.keys(files).length !== 1) throw new HttpError(400, 'One file required');
    const file = items[0];
    return await validateUpload(await fs.readFile(file.filepath), file.originalFilename ?? '', file.mimetype ?? '', kind);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
}
export function uploadHandler(kind: 'image' | 'report') {
  return endpoint(['POST'], async (req, res) => {
    await requireAuth(req);
    await rateLimit('uploads:admin', 30, 3600, res);
    const file = await readFile(req, kind);
    const name = randomUUID() + '.' + file.ext;
    let url: string;
    if (localDirectory) {
      await fs.mkdir(localDirectory, { recursive: true });
      await fs.writeFile(path.join(localDirectory, name), file.buffer, { flag: 'wx' });
      url = '/local-files/' + name;
    } else {
      if (!process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, 'Storage unavailable');
      const result = await put((kind === 'image' ? 'uploads/' : 'reports/') + name, file.buffer,
        { access: 'public', contentType: file.mime, addRandomSuffix: true });
      url = result.url;
    }
    return res.json({ success: true, [kind === 'image' ? 'imageUrl' : 'reportUrl']: url, fileName: name });
  });
}
