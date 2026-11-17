import { readFile } from 'node:fs/promises';
import path from 'node:path';

export class HttpError extends Error {
  constructor(status, message, details = undefined) { super(message); this.status = status; this.details = details; }
}
export function json(res, status, payload) {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify(payload));
}
export async function bodyJson(req, maxBytes=1024*1024) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size+=chunk.length; if(size>maxBytes) throw new HttpError(413,'Request body is too large'); chunks.push(chunk); }
  if(!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400,'Request body must be valid JSON'); }
}
export async function staticFile(res, publicDir, filename) {
  const base=path.basename(filename); if(!new Set(['index.html','app.js','styles.css']).has(base)) return false;
  try { const data=await readFile(path.join(publicDir,base)); const type=base.endsWith('.css')?'text/css; charset=utf-8':base.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8'; res.writeHead(200,{'content-type':type,'x-content-type-options':'nosniff'});res.end(data);return true;} catch{return false;}
}
export function fail(res,error) { const status=Number.isInteger(error?.status)?error.status:500; const payload={error:status===500?'Internal server error':error.message};if(error?.details!==undefined)payload.details=error.details;if(status===500)console.error(error);json(res,status,payload); }
export function nowIso(){return new Date().toISOString();}
