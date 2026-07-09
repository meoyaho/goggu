# 번창 기원상

새 시작을 응원하는 모바일 우선 정적 웹앱입니다. 주인장은 NFC 태그에 저장된 `?table=t-...&owner=...` 링크로 처음 접속해 고사상을 꾸미고, 방문자는 공유받은 `?table=t-...` 링크로 응원을 남깁니다.

## 실행

`index.html`을 브라우저에서 열면 바로 동작합니다. `app.js`의 `CONFIG.appsScriptUrl`이 비어 있으면 데이터는 브라우저 `localStorage`에만 저장됩니다.

## Google Sheets 연동

1. Google Sheet를 만들고 시트 두 개를 준비합니다.
   - `tables`: `table_id`, `date`, `owner_name`, `blessing`, `decoration_json`, `owner_token`
   - `messages`: `table_id`, `user_name`, `message`, `created_at`
2. Google Sheet에서 `확장 프로그램 > Apps Script`를 엽니다.
3. [apps-script.gs](apps-script.gs)의 내용을 붙여넣고 저장합니다.
4. `배포 > 새 배포 > 웹 앱`으로 배포합니다.
   - 실행 사용자: 본인
   - 액세스 권한: 모든 사용자
5. 발급된 Web App URL을 [app.js](app.js)의 `CONFIG.appsScriptUrl`에 넣습니다.

## 링크 구조

- 주인장 링크: `https://meoyaho.github.io/goggu/?table=<t-16자리-랜덤-id>&owner=<24자리-랜덤-토큰>`
- 방문자 링크: `https://meoyaho.github.io/goggu/?table=<t-16자리-랜덤-id>`

기본 주소만 열거나 지정되지 않은 `table_id`로 접속하면 새 상을 자동 생성하지 않고 NFC 태그로 시작하라는 안내를 보여줍니다.

## NFC 태그 20개

각 NFC 태그에는 주인장 링크를 저장합니다. 주인장이 상을 차린 뒤 앱의 `사람들 초대하기` 버튼을 누르면 방문자 공유 링크만 복사됩니다.

실제 발급된 20개 링크는 공개 저장소에 올리지 않는 [nfc-links.private.md](nfc-links.private.md)에 보관합니다.

새 ID와 주인장 토큰이 더 필요하면 아래처럼 생성합니다.

```sh
node -e "const crypto=require('crypto'); for(let i=0;i<20;i++) console.log('t-'+crypto.randomBytes(8).toString('hex'), crypto.randomBytes(12).toString('hex'))"
```

## 이미지

고사상과 제물은 투명 PNG 에셋으로 분리되어 있으며 [assets](assets) 폴더의 `asset-*.png` 파일을 사용합니다. 원본 `assets/img1.png`, `assets/img2.png`에서 에셋을 다시 추출해야 할 때는 `python3 scripts/extract_reference_png_assets.py`를 실행합니다.
