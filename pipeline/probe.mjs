// 지원조건 코드 뜻 검증용. 코드별로 그 코드만 해당하는 서비스 이름을 뽑는다. 키는 출력하지 않는다.
const KEY = (process.env.DATA_GO_KR_KEY || '').trim();
const BASE = 'https://api.odcloud.kr/api/gov24/v3';
const get = async (p, page, n) => (await (await fetch(`${BASE}/${p}?page=${page}&perPage=${n}&returnType=JSON&serviceKey=${KEY.includes('%') ? KEY : encodeURIComponent(KEY)}`)).json());
for (const u of ['https://infuser.odcloud.kr/oas/docs?namespace=15113968/v1', 'https://infuser.odcloud.kr/api/stages/44436/api-docs']) {
  try { const t = await (await fetch(u)).text(); const m = t.match(/JA0326[^,}]{0,80}/g); console.log('명세', u.slice(26, 70), t.length, m ? m.slice(0, 2) : '없음'); } catch (e) { console.log('명세 실패', e.message); }
}
let all = [];
for (let p = 1; p <= 11; p++) { const j = await get('supportConditions', p, 1000); all = all.concat(j.data || []); }
console.log('총', all.length);
const groups = { 성별: /^JA010[12]$/, 소득: /^JA020/, 생애: /^JA03(0[1-3])$/, 직업학생: /^JA03(1[3-9]|2\d|30)$/, 가구: /^JA04/, 소상공인: /^JA1/, 법인: /^JA2/ };
for (const [g, re] of Object.entries(groups)) {
  const codes = Object.keys(all[0]).filter(k => re.test(k)).sort();
  console.log(`\n## ${g}`);
  for (const c of codes) {
    const only = all.filter(x => x[c] === 'Y' && codes.every(k => k === c || x[k] !== 'Y'));
    console.log(c, 'Y', all.filter(x => x[c] === 'Y').length, '| 단독', only.length, '|', only.slice(0, 4).map(x => x.서비스명.slice(0, 22)).join(' / '));
  }
}
