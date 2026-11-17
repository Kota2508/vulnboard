import {DatabaseSync}from'node:sqlite';import{readFileSync,mkdirSync}from'node:fs';import{dirname,resolve}from'node:path';import{randomUUID}from'node:crypto';import{fingerprintFor,severityFor,slaDueAt}from'./domain.js';
const schema=readFileSync(new URL('../database/schema.sql',import.meta.url),'utf8');
const seed=[
 ['api.staging.acme.in','scanner-a','CVE-2025-1001','Outdated OpenSSL library','Upgrade OpenSSL to a supported patched release.',9.8,'open'],
 ['auth.acme.in','scanner-a','WEB-401','Missing rate limit on login endpoint','Apply per-account and per-IP throttling.',8.1,'triaged'],
 ['10.20.4.12','scanner-b','TLS-003','Weak TLS configuration','Disable legacy protocol versions and weak ciphers.',6.5,'in_progress'],
 ['portal.acme.in','scanner-a','HDR-011','Content-Security-Policy header missing','Define a restrictive Content-Security-Policy.',4.3,'open'],
 ['dev-api.acme.in','scanner-b','INFO-008','Server version disclosed','Remove unnecessary version headers.',0,'false_positive']
];
export function createDatabase(dbPath=process.env.DB_PATH||'./data/vulnboard.sqlite'){
 if(dbPath!==':memory:')mkdirSync(dirname(resolve(dbPath)),{recursive:true});const db=new DatabaseSync(dbPath);db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');db.exec(schema);
 if(db.prepare('SELECT COUNT(*) AS count FROM findings').get().count===0){const insert=db.prepare(`INSERT INTO findings(id,fingerprint,asset,source,plugin_id,title,description,cvss,severity,status,assigned_to,occurrences,first_seen,last_seen,due_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?)`);const event=db.prepare(`INSERT INTO finding_events(id,finding_id,event_type,to_status,details,actor,created_at) VALUES(?,?,'created',?,'Seed finding','system',?)`);const stamp=new Date().toISOString();for(const row of seed){const [asset,source,plugin,title,description,cvss,status]=row;const id=randomUUID();insert.run(id,fingerprintFor(asset,plugin,title),asset,source,plugin,title,description,cvss,severityFor(cvss),status,'',stamp,stamp,slaDueAt(cvss,stamp),stamp,stamp);event.run(randomUUID(),id,status,stamp);}}
 return db;
}
