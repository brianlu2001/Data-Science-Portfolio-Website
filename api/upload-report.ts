import { uploadHandler } from '../lib/uploads.js';
export const config = { api: { bodyParser: false } };
export default uploadHandler('report');
