// Only emits credential names and paths, never their values.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const configured = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .map(line => line.match(/^([A-Z_0-9]+)=(.*)$/)).filter(Boolean)
  .filter(match => /SECRET|TOKEN|PASSWORD|API_KEY|DATABASE_URL|POSTGRES.*URL/.test(match[1]))
  .map(match => [match[1], match[2].replace(/^['"]|['"]$/g, '')])
  .filter(([, value]) => value.length > 12);
const hits = [];
for (const file of files) {
  if (!fs.existsSync(file) || fs.statSync(file).size > 5_000_000) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const [variable, value] of configured) {
    if (source.includes(value)) hits.push({ file, variable });
  }
}
const dump = fs.readFileSync('replit_dump.sql', 'utf8');
const match = dump.match(/COPY public.sessions[^\n]*\n([^\n]*)/);
const record = match && match[1].includes('\t') ? JSON.parse(match[1].split('\t')[1]) : {};
const result = {
  scope: 'Exact current configured credential matches in tracked working-tree files up to 5 MB; targeted dump inspection. Not an exhaustive historical secret scan.',
  currentCredentialMatches: hits,
  dumpSessionCredentialFieldNames: Object.keys(record.passport?.user ?? {}),
  dumpSessionCookieExpiry: record.cookie?.expires,
};
console.log(JSON.stringify(result, null, 2));
fs.writeFileSync('security-credential-inventory.json', JSON.stringify(result, null, 2) + '\n');
