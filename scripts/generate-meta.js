import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const versionId = crypto.randomUUID();

const meta = { versionId };

const outPath = path.resolve(process.cwd(), 'public', 'meta.json');
fs.writeFileSync(outPath, JSON.stringify(meta));
console.log('✅ Generated meta.json with versionId:', versionId);
