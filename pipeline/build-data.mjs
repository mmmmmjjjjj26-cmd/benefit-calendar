// 보조금24(행정안전부 공공서비스 정보) API에서 전국 서비스를 받아 앱이 읽는 data.json으로 만든다.
// 실행: DATA_GO_KR_KEY=... node pipeline/build-data.mjs out/data.json
// 키는 환경변수로만 받고 어디에도 출력하거나 저장하지 않는다.
import fs from 'node:fs';
import path from 'node:path';

const KEY = (process.env.DATA_GO_KR_KEY || '').trim();
if (!KEY) { console.error('DATA_GO_KR_KEY가 없어. 저장소 Secrets를 확인해줘.'); process.exit(1); }
const OUT = process.argv[2] || 'out/data.json';
const BASE = 'https://api.odcloud.kr/api/gov24/v3';
const keyParam = KEY.includes('%') ? KEY : encodeURIComponent(KEY);

async function fetchAll(endpoint) {
  const rows = [];
  for (let page = 1; ; page++) {
    let j;
    for (let tryN = 1; ; tryN++) {
      try {
        const r = await fetch(`${BASE}/${endpoint}?page=${page}&perPage=1000&returnType=JSON&serviceKey=${keyParam}`);
        j = await r.json();
        if (r.ok) break;
        throw new Error(`HTTP ${r.status} ${j?.msg || ''}`);
      } catch (e) {
        if (tryN >= 3) throw new Error(`${endpoint} ${page}쪽 받기 실패: ${e.message}`);
        await new Promise((res) => setTimeout(res, 3000 * tryN));
      }
    }
    rows.push(...(j.data || []));
    if (!j.data?.length || rows.length >= j.totalCount) return rows;
  }
}

// ---- 지역 ----
const SIDO = [['서울', '서울'], ['부산', '부산'], ['대구', '대구'], ['인천', '인천'], ['광주', '광주'], ['대전', '대전'], ['울산', '울산'], ['세종', '세종'], ['경기', '경기'], ['강원', '강원'], ['충북', '충청북|충북'], ['충남', '충청남|충남'], ['전북', '전라북|전북'], ['전남', '전라남|전남'], ['경북', '경상북|경북'], ['경남', '경상남|경남'], ['제주', '제주']];
const sidoOf = (name) => { const s = String(name || '').replace(/\s/g, ''); return SIDO.find(([, re]) => new RegExp(`^(${re})`).test(s))?.[0] || null; };
function area(svc) {
  const type = svc.소관기관유형, name = String(svc.소관기관명 || '').trim();
  if (type === '시군구') {
    const [sido, ...rest] = name.split(/\s+/);
    if (sidoOf(sido) && rest.length) return { scope: 'sigungu', sido, sigungu: rest.join(' ') };
    if (sidoOf(sido)) return { scope: 'sido', sido }; // 세종처럼 시군구가 없는 곳
  }
  if (type === '광역시도' && sidoOf(name)) return { scope: 'sido', sido: name.split(/\s+/)[0] };
  if (['지방출자_출연기관', '지방공기업', '교육청'].includes(type) && sidoOf(name)) return { scope: 'sido', sido: sidoOf(name) };
  return { scope: 'national' };
}

// ---- 지원조건 코드 (행정안전부 명세 기준) ----
const JOB = ['JA0313', 'JA0314', 'JA0315', 'JA0316', 'JA0317', 'JA0318', 'JA0319', 'JA0320', 'JA0326', 'JA0327', 'JA0328', 'JA0329', 'JA0330'];
const HOUSE = ['JA0401', 'JA0402', 'JA0403', 'JA0404', 'JA0411', 'JA0412', 'JA0413', 'JA0414'];
const INCOME = [['JA0201', 50], ['JA0202', 75], ['JA0203', 100], ['JA0204', 200]];
function conditions(c) {
  if (!c) return {};
  const Y = (k) => c[k] === 'Y', o = {};
  const a0 = Number(c.JA0110), a1 = Number(c.JA0111);
  if (a0 > 0) o.ageMin = a0;
  if (a1 > 0 && a1 < 100) o.ageMax = a1;
  if (Y('JA0101') !== Y('JA0102')) o.gender = Y('JA0102') ? 'f' : 'm';
  // 중위소득: 200% 초과 구간이 안 되면, 허용되는 가장 높은 구간을 상한으로
  if (INCOME.some(([k]) => Y(k)) && !Y('JA0205')) o.incomePct = Math.max(...INCOME.filter(([k]) => Y(k)).map(([, p]) => p));
  // 직업·가구 특성: '해당사항없음'이 Y면 누구나, 아니면 Y인 특성 중 하나여야 함
  const targets = [];
  if (!Y('JA0322')) { const t = JOB.filter(Y); if (t.length) targets.push(t); }
  if (!Y('JA0410')) { const t = HOUSE.filter(Y); if (t.length) targets.push(t); }
  if (targets.length) o.targets = targets;
  return o;
}

// ---- 문장에서 뽑는 값 ----
function residencyMonths(text) {
  const m = String(text || '').match(/(\d+)\s*(년|개월)\s*이상\s*(?:계속\s*|연속\s*)?(?:거주|주민등록)/);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] === '년' ? 12 : 1);
  return n > 0 && n <= 240 ? n : null;
}
const pad = (n) => String(n).padStart(2, '0');
function period(text) {
  const s = String(text || '');
  const m = s.match(/(20\d\d)\s*[.\-년/]\s*(\d{1,2})\s*[.\-월/]\s*(\d{1,2})\s*일?\.?\s*(?:\([^)]*\))?\s*[~∼～\-]\s*(?:(20\d\d)\s*[.\-년/]\s*)?(\d{1,2})\s*[.\-월/]\s*(\d{1,2})/);
  if (!m) return null;
  const [, y1, m1, d1, y2, m2, d2] = m.map((x) => (x == null ? x : Number(x)));
  const start = `${y1}-${pad(m1)}-${pad(d1)}`, end = `${y2 || y1}-${pad(m2)}-${pad(d2)}`;
  const ok = (y, mo, d) => mo >= 1 && mo <= 12 && d >= 1 && d <= 31;
  if (!ok(y1, m1, d1) || !ok(y2 || y1, m2, d2) || end < start) return null;
  return { applyStart: start, applyEnd: end };
}
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').replace(/^[○ㅇ\-•·\s]+/, '').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

// ---- 실행 ----
const [list, conds] = await Promise.all([fetchAll('serviceList'), fetchAll('supportConditions')]);
const condById = new Map(conds.map((c) => [c.서비스ID, c]));
const programs = [];
for (const s of list) {
  if (!/개인|가구/.test(s.사용자구분 || '')) continue; // 법인·소상공인 전용은 뺀다
  const a = area(s), c = conditions(condById.get(s.서비스ID));
  const text = `${s.선정기준 || ''}\n${s.지원대상 || ''}`;
  const p = {
    id: s.서비스ID, title: clip(s.서비스명, 60), org: clip(s.소관기관명, 40), category: s.서비스분야 || '기타',
    source: '보조금24', url: String(s.상세조회URL || '').startsWith('https://') ? s.상세조회URL : '',
    benefit: clip(s.지원내용, 110), summary: clip(s.서비스목적요약 || s.지원대상, 140),
    ...a, ...c,
  };
  if (a.scope !== 'national') { const r = residencyMonths(text); if (r) p.residencyMonths = r; }
  const pr = s.신청기한유형 === '상시신청' ? null : period(s.신청기한);
  if (pr) Object.assign(p, pr);
  else if (s.신청기한 && s.신청기한유형 !== '상시신청') p.periodText = clip(s.신청기한, 28);
  programs.push(p);
}

const now = new Date(Date.now() + 9 * 3600e3); // 한국 시간
const lastRun = now.toISOString().slice(0, 16).replace('T', ' ');
const config = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url)));
const years = Object.keys(config.median).map(Number).sort();
const year = years.filter((y) => y <= now.getUTCFullYear()).pop() || years[0];
const data = {
  version: 2,
  meta: { lastRun, note: '보조금24', median: { year, table: config.median[year] } },
  tax: config.tax,
  programs,
};
if (programs.length < 1000) { console.error(`서비스가 ${programs.length}건뿐이라 이상해서 저장하지 않았어.`); process.exit(1); }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data));
const cnt = (f) => programs.filter(f).length;
console.log(`완료 ${lastRun}: 전체 ${list.length}건 중 개인·가구 ${programs.length}건, ${(fs.statSync(OUT).size / 1e6).toFixed(1)}MB`);
console.log(`지역 ${cnt((p) => p.scope !== 'national')} · 나이 ${cnt((p) => p.ageMin || p.ageMax)} · 소득 ${cnt((p) => p.incomePct)} · 대상특성 ${cnt((p) => p.targets)} · 거주기간 ${cnt((p) => p.residencyMonths)} · 신청기간 ${cnt((p) => p.applyEnd)}`);
fs.writeFileSync(path.join(path.dirname(OUT), 'status.json'), JSON.stringify({ lastRun, programs: programs.length }) + '\n');
