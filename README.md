# hsmocap

Firebase 기반 영어 단어 학습 웹앱입니다.

현재 `main` 브랜치는 아래를 모두 반영한 **최신 기준본**입니다.

- 최신 수현 UI
- 원준 비즈니스 로직
- 문장 퀴즈 서버 채점
- 이미지 힌트 Firebase Functions 연동
- 저장소 내 Firebase Functions 소스 복구

## Live URL

- [https://hsmocap-d907e.web.app](https://hsmocap-d907e.web.app)
- [https://hsmocap-d907e.firebaseapp.com](https://hsmocap-d907e.firebaseapp.com)

## 주요 기능

- 단어 목록 / 단어 상세
- 플래시카드 학습
- 문장 학습 / 문장 퀴즈
- 객관식 / 주관식 퀴즈
- 복습 / 오답 노트 흐름
- 즐겨찾기
- 프로필 / 학습 진행도 / 설정
- 커뮤니티 / 게시글 작성
- Google 로그인 / 게스트 로그인

## 문장 퀴즈 서버 연동 구조

문장 퀴즈는 프론트 단독 처리보다 **Firebase Functions 기반 서버 처리**를 우선 사용합니다.

- `gradeWordAnswerHttpV3`
  - 문장 퀴즈 정답 채점
  - `Authorization: Bearer <idToken>` 기반 인증
- `imageHintSearchHttp`
  - 단어 이미지 힌트 반환
  - 함수 실패 시 프론트에서 Wikimedia fallback 사용

현재 구조는 아래와 같습니다.

- 프론트 -> Firebase Functions -> 채점 / 이미지 힌트 응답
- 프론트 -> Firestore -> 단어 / 진행도 / 커뮤니티 데이터
- 프론트 -> Firebase Authentication -> Google / 익명 로그인

## 기술 스택

- React 18
- Vite
- React Router
- Firebase Hosting
- Firebase Authentication
- Firebase Firestore
- Firebase Functions

## 프로젝트 구조

```text
src/app/
  components/   공통 UI
  pages/        화면 단위 페이지
  lib/          Firebase 헬퍼, 학습 로직, 어댑터
  data/         시드 데이터
functions/
  src/index.ts  Firebase Functions 엔트리
  scripts/      관리자용 시드 스크립트
```

## 로컬 실행

### 프론트

```bash
npm install
npm run dev
```

### 프론트 빌드

```bash
npm run build
```

### Functions

```bash
cd functions
npm install
npm run build
```

## 환경 변수와 Secret

실제 값은 저장소에 커밋하지 않습니다.

### 프론트에서 선택적으로 사용할 수 있는 env

```env
VITE_GRADE_WORD_ANSWER_URL=
VITE_IMAGE_HINT_URL=
```

값이 비어 있으면 기본 Firebase Functions URL을 사용합니다.

### Firebase Functions Secret

```text
GROQ_API_KEY
PEXELS_API_KEY
```

## 배포

### Hosting 배포

```bash
npm run build
firebase deploy --only hosting
```

### Functions 배포

```bash
cd functions
npm run build
firebase deploy --only functions:gradeWordAnswerHttpV3
firebase deploy --only functions:imageHintSearchHttp
```

프로젝트에 레거시 함수가 남아 있을 수 있으므로, Functions는 전체 배포보다 **타깃 함수 배포**가 더 안전합니다.

## 참고 사항

- Preview Hosting 채널 도메인도 Functions CORS 허용 대상에 포함되어 있습니다.
- 이미지 힌트 품질은 단어 성격과 외부 소스 품질에 따라 달라질 수 있습니다.
- `seedWords` 정리는 후속 품질 개선 작업으로 분리할 수 있습니다.

## 현재 기준

`main` 브랜치는 현재 운영 기준 브랜치이며, 아래를 포함합니다.

- 최신 UI 기준
- 문장 퀴즈 서버 연동
- 이미지 힌트 서버 연동
- Firebase Functions 소스 복구
