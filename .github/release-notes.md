## 설치 방법

**Mac**: Apple 실리콘(M1 이후)은 `…-mac-arm64.dmg`, Intel Mac은 `…-mac-x64.dmg`를 받아서 `BenefitCalendar` 앱을 응용 프로그램 폴더로 옮기세요.
처음 열 때 막히면 시스템 설정 → 개인정보 보호 및 보안 → 아래쪽 `그래도 열기`를 누르세요.
"손상되었습니다"라고 나오면 터미널에서 아래 한 줄을 실행한 뒤 다시 여세요.

```
xattr -cr /Applications/BenefitCalendar.app
```

**Windows**: `benefit-calendar-setup-….exe`를 받아서 실행하세요.
"Windows의 PC 보호" 창이 뜨면 `추가 정보` → `실행`을 누르세요.

입력한 정보는 이 컴퓨터에만 저장되고 어디로도 보내지 않아요.
