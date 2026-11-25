// API 응답 구조 확인용. 키는 환경변수로만 받고 출력하지 않는다.
const KEY = process.env.DATA_GO_KR_KEY;
if (!KEY) { console.log('키 없음: DATA_GO_KR_KEY Secret을 확인해줘'); process.exit(1); }
const BASE = 'https://api.odcloud.kr/api/gov24/v3';
async function get(path, perPage) {
  const u = `${BASE}/${path}?page=1&perPage=${perPage}&returnType=JSON&serviceKey=${encodeURIComponent(KEY)}`;
  const r = await fetch(u); const t = await r.text();
  try { return { status: r.status, j: JSON.parse(t) }; } catch { return { status: r.status, text: t.slice(0, 300) }; }
}
for (const [p, n] of [['serviceList', 300], ['serviceDetail', 2], ['supportConditions', 1000]]) {
  const { status, j, text } = await get(p, n);
  console.log(`\n##### ${p} HTTP ${status} total=${j?.totalCount} matched=${j?.matchCount}`);
  if (!j) { console.log(text); continue; }
  const d = j.data || [];
  if (p === 'supportConditions') {
    const cnt = {}; d.forEach(x => Object.entries(x).forEach(([k, v]) => { if (v != null && v !== '') cnt[k] = (cnt[k] || 0) + 1; }));
    console.log('필드별 값 있는 개수 (1000건 중):', JSON.stringify(cnt));
    console.log('예시:', JSON.stringify(d[0]));
    const ages = d.filter(x => x.JA0110 || x.JA0111).slice(0, 3).map(x => [x.JA0110, x.JA0111]);
    console.log('나이 예시:', JSON.stringify(ages));
  } else if (p === 'serviceList') {
    console.log('필드:', Object.keys(d[0] || {}).join(', '));
    console.log('예시:', JSON.stringify(d[0]).slice(0, 1500));
    const f = k => { const c = {}; d.forEach(x => { const v = String(x[k] ?? '').slice(0, 20); c[v] = (c[v] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12); };
    console.log('신청기한 분포:', JSON.stringify(f('신청기한')));
    console.log('소관기관유형:', JSON.stringify(f('소관기관유형')));
    console.log('서비스분야:', JSON.stringify(f('서비스분야')));
  } else console.log('예시:', JSON.stringify(d[0]).slice(0, 2500));
}
