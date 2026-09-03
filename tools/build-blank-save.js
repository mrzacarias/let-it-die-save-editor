const fs = require('fs');
const path = require('path');
const pako = require(path.join(__dirname, '..', 'pako.min.js'));

const DIR = path.join(__dirname, '..');
const SRC = process.env.BLANK_SAV || '/Users/mrzacarias/Downloads/blank.sav';

const buf = fs.readFileSync(SRC);
const u8 = new Uint8Array(buf);
function r32(a, o) { return a[o] | a[o + 1] << 8 | a[o + 2] << 16 | a[o + 3] << 24; }
let off = 16; const parts = [];
while (off < u8.length - 4) { const u = r32(u8, off), c = r32(u8, off + 4); off += 8; parts.push(pako.inflate(u8.subarray(off, off + c))); off += c; }
let n = 0; parts.forEach(p => n += p.length); const cat = new Uint8Array(n); let o = 0; parts.forEach(p => { cat.set(p, o); o += p.length; });
const save = JSON.parse(new TextDecoder().decode(cat));

// scrub personal identifiers / session keys
const u = save.user || {};
u.nm = 'Player';
u.psnacid = '';
u.skey = '';
u.sid = '';
u.uuid = '';
u.olid = '';
u.created = 0;
u.modified = 0;

fs.writeFileSync(path.join(DIR, 'data', 'blank-save.json'), JSON.stringify(save));
const js = 'window.BLANK_SAVE=' + JSON.stringify(save) + ';\n';
fs.writeFileSync(path.join(DIR, 'blank-save.js'), js);
console.log('blank save template written, uid=' + (save.soul && save.soul.uid));
