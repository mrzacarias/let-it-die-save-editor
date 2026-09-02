const fs = require('fs');
const z = require('zlib');

const SAVE_PATH = process.argv[2];
if (!SAVE_PATH) {
  console.error('Usage: node add-decal.js <path/to/save.sav>');
  process.exit(1);
}
const CHUNK = 1296894;

function decode(buf) {
  const hdr = buf.subarray(0, 4).toString('ascii');
  if (hdr !== 'BRG\0') throw new Error('bad BRG header: ' + hdr);
  const ver = buf.readUInt32LE(4);
  if (ver !== 2) throw new Error('unexpected version: ' + ver);
  let off = 16;
  const chunks = [];
  while (off < buf.length - 4) {
    const u = buf.readUInt32LE(off);
    const c = buf.readUInt32LE(off + 4);
    off += 8;
    chunks.push(z.inflateSync(buf.subarray(off, off + c)));
    off += c;
  }
  const json = Buffer.concat(chunks).toString('utf8');
  return { ver, json, chunks };
}

function encode(json) {
  const jsonBuf = Buffer.from(json, 'utf8');
  const header = Buffer.alloc(16);
  header.write('BRG\0', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(jsonBuf.length, 8);
  header.write('ZLIB', 12, 'ascii');
  const parts = [header];
  for (let i = 0; i < jsonBuf.length; i += CHUNK) {
    const raw = jsonBuf.subarray(i, Math.min(i + CHUNK, jsonBuf.length));
    const comp = z.deflateSync(raw);
    const h = Buffer.alloc(8);
    h.writeUInt32LE(raw.length, 0);
    h.writeUInt32LE(comp.length, 4);
    parts.push(h, comp);
  }
  parts.push(Buffer.from([0, 0, 0, 0]));
  return Buffer.concat(parts);
}

const DECALS = [
  'SKL_ATKUP_03_P',             // Golden Gym
  'SKL_ADVENTURE_01_P',         // Spy
  'SKL_FIGHTER_STUP_02_P',      // Ultimate Fighter's Return
  'SKL_ARRNG_STATUP_ALL_P',     // Professional Cosplayer
  'SKL_GUNMAN_01_P',            // Billy the Kid
  'SKL_CRIUP_ATKUP_01_P',       // Below the Belt
  'SKL_EXPLODE_DRAIN_P',        // Vampire Queen
  'SKL_NTHEAL_ATDFUPHPMAX_P',   // Final Hero
  'SKL_CRIUP_03_P',             // Six-leaf Clover
  'SKL_RESUP_DECDOWN_P',        // Rich Family
  'SKL_STUP_FEAT_HPCUREUP_P',   // Ultimate Food Fighter
  'SKL_ATKUP_CRIUP_DEFDWN_P',   // Special Unit Captain
  'SKL_ATK_CRIATK_MONEYUP_P',   // Dog Day Afternoon
  'SKL_MIL_UP_02_P',            // Hellish Drill Sergeant
  'SKL_SYLVIA_NMH_02_P',        // Queen of Spades
  'SKL_ATKUP_NODMG',            // Serial Killer (non-premium)
  'SKL_ATKUP_NODMG_P',          // Serial Killer (premium)
  'SKL_RIFLE_ATK_UP_01_P',      // Assault Rifle Addict
];

const raw = fs.readFileSync(SAVE_PATH);
const { json } = decode(raw);

const parsed = JSON.parse(json);
const existing = new Set(parsed.soul.skl.psskl.map(r => r.sklid));

const toAdd = DECALS.filter(id => !existing.has(id));
if (toAdd.length === 0) {
  console.log('All requested decals already present. No change.');
  process.exit(0);
}

const now = Math.floor(Date.now() / 1000);
const newRecords = toAdd
  .map(id => `{"sklid":"${id}","cnt":1,"updated":${now},"is_checked":0}`)
  .join(',');

const anchor = '"psskl":[';
const idx = json.indexOf(anchor);
if (idx < 0) throw new Error('psskl anchor not found');
const modified = json.slice(0, idx + anchor.length) + newRecords + ',' + json.slice(idx + anchor.length);

const out = encode(modified);

const backup = SAVE_PATH + '.pre-decals.bak';
fs.copyFileSync(SAVE_PATH, backup);
fs.writeFileSync(SAVE_PATH, out);

console.log('Added ' + toAdd.length + ' decals:');
toAdd.forEach(id => console.log('  + ' + id));
console.log('Skipped (already present): ' + DECALS.filter(id => existing.has(id)).join(', ') || 'none');
console.log('Backup: ' + backup);
console.log('Old JSON bytes: ' + json.length + ' -> New JSON bytes: ' + modified.length);
console.log('Old file: ' + raw.length + ' -> New file: ' + out.length);
