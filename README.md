# 내 혜택 캘린더

내 나이·주소·소득에 맞는 정부·지자체 혜택을 마감 순으로 모아 보는 데스크탑 앱.
입력한 정보는 사용자 컴퓨터에만 저장되고 어디로도 보내지 않는다.

## 폴더 구조

```
web/index.html        앱 화면 전체 (웹 버전과 같이 쓰는 원본, 레이아웃 수정은 여기서)
web/data/data.json    앱에 들어가는 기본 공고 데이터 (인터넷이 안 될 때 사용)
web/fonts/            앱에 포함한 폰트 (Inter, Noto Sans KR)
main.js               데스크탑 창 + 업데이트 확인
build/icon.png        앱 아이콘
.github/workflows/    태그를 올리면 Windows·Mac 설치 파일을 자동 빌드
```

## 처음 한 번만: GitHub에 올리기

1. GitHub에서 새 저장소 `benefit-calendar` 만들기 (Public)
2. 아래 세 곳의 `YOUR_ID`를 내 GitHub 아이디로 바꾸기
   - `package.json` → `build.publish[0].owner`
   - `main.js` → `REPO`
   - `web/index.html` → `DATA_URL` (데이터 파이프라인 만든 뒤)
3. 이 폴더 전체를 저장소에 올리기 (`node_modules`, `dist`는 제외)

## 새 버전 배포하기

1. `package.json`의 `version`을 올리기 (예: 0.1.0 → 0.1.1)
2. GitHub 저장소 → Actions 탭 → `release` → `Run workflow`
3. 빌드가 끝나면 (10분쯤) Releases에 `v0.1.1`이 생기고 설치 파일이 붙는다
   - Windows: `benefit-calendar-setup-0.1.1.exe`
   - Mac: `benefit-calendar-0.1.1-mac-arm64.dmg`, `benefit-calendar-0.1.1-mac-x64.dmg`

이미 설치한 사용자는 다음에 앱을 열 때
- Windows: 자동으로 받아서 업데이트
- Mac: "새 버전이 나왔어" 안내 → 다운로드 페이지로 이동 (서명이 없으면 Mac 자동 설치가 안 됨)

## 사용자 안내 문구 (Release 설명에 붙여넣기)

**Windows**: "Windows의 PC 보호" 창이 뜨면 `추가 정보` → `실행`을 누르세요.

**Mac**: 처음 열 때 막히면 시스템 설정 → 개인정보 보호 및 보안 → 아래쪽 `그래도 열기`를 누르세요.
"손상되었습니다"라고 나오면 터미널에서 아래 한 줄을 실행한 뒤 다시 여세요.

```
xattr -cr /Applications/BenefitCalendar.app
```

## 내 컴퓨터에서 실행해보기 (선택)

Node.js 설치 후 이 폴더에서:

```
npm install
npm start
```
