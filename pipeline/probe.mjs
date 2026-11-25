// 명세의 코드 설명, 기관·신청기한 형식 확인용. 키는 출력하지 않는다.
const KEY = (process.env.DATA_GO_KR_KEY || '').trim();
const BASE = 'https://api.odcloud.kr/api/gov24/v3';
const get = async (p, page, n) => (await (await fetch(`${BASE}/${p}?page=${page}&perPage=${n}&returnType=JSON&serviceKey=${KEY.includes('%') ? KEY : encodeURIComponent(KEY)}`)).json());
const spec = await (await fetch('https://infuser.odcloud.kr/api/stages/44436/api-docs')).json();
const findProps = (o, out = {}) => { if (o && typeof o === 'object') { for (const [k, v] of Object.entries(o)) { if (/^JA\d{4}$/.test(k) && v?.description) out[k] = v.description; else findProps(v, out); } } return out; };
console.log('코드설명', JSON.stringify(findProps(spec)));
let all = [];
for (let p = 1; p <= 11; p++) { const j = await get('serviceList', p, 1000); all = all.concat(j.data || []); }
const dist = (k, n = 10) => { const c = {}; all.forEach(x => { const v = String(x[k] ?? ''); c[v] = (c[v] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n); };
console.log('총', all.length, 'JSON크기MB', (JSON.stringify(all).length / 1e6).toFixed(1));
console.log('기관유형', JSON.stringify(dist('소관기관유형')));
console.log('사용자구분', JSON.stringify(dist('사용자구분')));
console.log('신청기한유형', JSON.stringify(dist('신청기한유형')));
console.log('지자체 기관명 예', JSON.stringify(all.filter(x => x.소관기관유형 === '지자체').slice(0, 8).map(x => x.소관기관명)));
console.log('기관명 예(기타유형)', JSON.stringify([...new Set(all.filter(x => !['중앙행정기관', '지자체'].includes(x.소관기관유형)).map(x => x.소관기관유형 + ':' + x.소관기관명))].slice(0, 8)));
console.log('날짜 있는 신청기한', JSON.stringify(all.map(x => x.신청기한 || '').filter(s => /20\d\d/.test(s)).slice(0, 10).map(s => s.slice(0, 60))));
console.log('거주기간 문구', JSON.stringify(all.map(x => (x.선정기준 || '') + (x.지원대상 || '')).map(s => (s.match(/.{0,15}(\d+)\s*(년|개월)\s*이상\s*(거주|주민등록).{0,5}/) || [])[0]).filter(Boolean).slice(0, 6)));
