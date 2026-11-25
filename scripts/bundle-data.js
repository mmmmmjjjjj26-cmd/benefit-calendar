// web/data/data.json을 앱에 들어갈 기본 데이터(data.js)로 바꾼다. 인터넷이 안 될 때 이 데이터를 쓴다.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'web', 'data');
const json = JSON.parse(fs.readFileSync(path.join(dir, 'data.json'), 'utf8'));
fs.writeFileSync(path.join(dir, 'data.js'), 'window.BUNDLED_DATA=' + JSON.stringify(json) + ';\n');
console.log('data.js 생성: 공고', json.programs.length, '건');
