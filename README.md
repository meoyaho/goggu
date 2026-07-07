# 번창 기원상

새 시작을 응원하는 모바일 우선 정적 웹앱입니다. 주인장은 `?mode=owner&table=...` 링크로 접속하고, 방문자는 `?table=...` 링크로 접속합니다.

## 실행

`index.html`을 브라우저에서 열면 바로 동작합니다. `app.js`의 `CONFIG.appsScriptUrl`이 비어 있으면 데이터는 브라우저 `localStorage`에만 저장됩니다.

## Google Sheets 연동

1. Google Sheet를 만들고 시트 두 개를 준비합니다.
   - `tables`: `table_id`, `date`, `owner_name`
   - `messages`: `table_id`, `user_name`, `message`
2. Google Sheet에서 `확장 프로그램 > Apps Script`를 엽니다.
3. [apps-script.gs](apps-script.gs)의 내용을 붙여넣고 저장합니다.
4. `배포 > 새 배포 > 웹 앱`으로 배포합니다.
   - 실행 사용자: 본인
   - 액세스 권한: 모든 사용자
5. 발급된 Web App URL을 [app.js](app.js)의 `CONFIG.appsScriptUrl`에 넣습니다.

## 링크 구조

- 주인장 링크: `index.html?mode=owner&table=table_...`
- 방문자 링크: `index.html?table=table_...`

처음 `index.html`에 접속하면 새 `table_id`가 자동 생성되고 주인장 작성 화면으로 이동합니다.

## 이미지

제사상 이미지는 built-in `image_gen`으로 생성한 뒤 배경을 투명 처리했고, 프로젝트에서는 [assets/ritual-table-pig-transparent.png](assets/ritual-table-pig-transparent.png)를 사용합니다.
