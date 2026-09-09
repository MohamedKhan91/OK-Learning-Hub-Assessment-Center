/**
 * NOK DRIVE SYNC — Google Apps Script backend for the NOK Learning Hub Assessment Center
 * ─────────────────────────────────────────────────────────────────────────────
 * Where this runs: inside your Google Drive. All trainee records are stored in
 * the sheet "NOK Trainee Records", which lives in your NOK Drive folder.
 *
 * SETUP (≈2 minutes, one time):
 *  1. Open your Drive folder → New → Google Sheets → name it:  NOK Trainee Records
 *  2. In that sheet: Extensions → Apps Script
 *  3. Delete whatever is there, paste THIS whole file, press Save (Ctrl+S)
 *  4. Deploy → New deployment → type "Web app"
 *       - Execute as: Me
 *       - Who has access: Anyone                      ← required for trainees to save
 *  5. Authorize when prompted (your own Google account)
 *  6. Copy the Web app URL (ends in /exec) and paste it into the site:
 *       Trainer dashboard → section 5 → Save & test
 *     Optionally send me the URL and I'll bake it into the shared site file so
 *     every trainee auto-syncs from their very first badge.
 *
 * What happens afterwards:
 *  - Every trainee milestone silently upserts their row (one row per trainee,
 *    updated live — name, XP, badges, games, coach rank, tracks completed,
 *    and their full share code for the dashboard).
 *  - Your Trainer dashboard's "Pull roster from Drive" rebuilds the whole
 *    roster from the sheet on any device.
 *  - CSV export still works from the dashboard; the sheet itself is also a
 *    spreadsheet you can filter/pivot however you like.
 */

const SHEET = 'Trainees';

function ss_(){ return SpreadsheetApp.getActiveSpreadsheet(); }

function sh_(){
  let s = ss_().getSheetByName(SHEET);
  if (!s) {
    s = ss_().insertSheet(SHEET);
    s.appendRow(['First seen','Last update','Trainee ID','Name','XP','Badges','Games cleared','Coach rank','Tracks completed','Share code (full journey)']);
    s.setFrozenRows(1);
  }
  return s;
}

function decodeCode_(code){
  let b = String(code).split('.')[1] || '';
  b = b.replace(/-/g,'+').replace(/_/g,'/');
  while (b.length % 4) b += '=';
  return JSON.parse(Utilities.newString(Utilities.base64Decode(b)));
}

function out_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (!d.code || String(d.code).indexOf('NOKROSTER1.') !== 0) return out_({ok:false, error:'bad code'});
    const p = decodeCode_(d.code);
    const sh = sh_();
    const uid = p.u || (p.n + '|' + p.d);
    const data = sh.getDataRange().getValues();
    let row = -1;
    for (let i = 1; i < data.length; i++) { if (String(data[i][2]) === String(uid)) { row = i + 1; break; } }
    const t = new Date();
    const trk = p.t || {};
    const done = [
      ['EQ', trk.eq], ['Career+CV', trk.career || trk.cv], ['Leadership', trk.leadership],
      ['Teams', trk.team], ['Centre', trk.center], ['Coaching', (p.cr || 0) >= 2],
      ['Games', (trk.games || 0) >= 4], ['Dossier', trk.dossier]
    ].filter(x => x[1]).map(x => x[0]).join(', ');
    const games = p.g ? p.g.length : (trk.games || 0);
    if (row > 0) {
      sh.getRange(row, 2, 1, 9).setValues([[t, uid, p.n || '', p.x || 0, p.b || 0, games, p.cr || 0, done, d.code]]);
      return out_({ok:true, action:'updated'});
    } else {
      sh.appendRow([t, t, uid, p.n || '', p.x || 0, p.b || 0, games, p.cr || 0, done, d.code]);
      return out_({ok:true, action:'created'});
    }
  } catch (err) {
    return out_({ok:false, error:String(err)});
  }
}

function doGet(){
  try {
    const v = sh_().getDataRange().getValues();
    const codes = [];
    for (let i = 1; i < v.length; i++) { if (v[i][9]) codes.push(String(v[i][9])); }
    return out_({ok:true, rows: Math.max(0, v.length - 1), codes: codes});
  } catch (e) {
    return out_({ok:false, error:String(e)});
  }
}
