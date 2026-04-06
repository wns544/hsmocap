# hsmocap-app

Firebase 기반 영어 단어 학습 웹앱입니다.  
단어 목록 조회, 플래시카드 학습, 문장 퀴즈, 즐겨찾기, 오답 복습, 커뮤니티, 로그인 흐름까지 하나의 학습 경험으로 묶는 것을 목표로 만든 프로젝트입니다.

## Overview

- React + Vite 기반 단일 페이지 애플리케이션
- Firebase Authentication을 통한 로그인 및 게스트 접근 처리
- Cloud Firestore를 이용한 단어 데이터 저장 및 조회
- Firebase Hosting 배포 구성
- FrequencyWords 기반 단어 시드 데이터 100개 적용

## Features

- 단어 목록 검색 및 카테고리 필터링
- 단어 상세 화면
- 플래시카드 학습
- 문장 학습 및 문장 퀴즈
- 객관식 / 주관식 퀴즈
- 즐겨찾기 및 오답 복습 화면
- 커뮤니티 게시글 UI
- 프로필 및 설정 화면
- Google 로그인 및 익명 로그인
- 인증 가드 기반 라우팅

## Tech Stack

- React 18
- Vite
- React Router 7
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting
- Tailwind CSS 4
- Radix UI
- Lucide React

## Project Structure

```text
src/
  app/
    components/   # 레이아웃, 가드, UI 컴포넌트
    contexts/     # 인증 컨텍스트
    data/         # 단어 시드 데이터
    lib/          # Firebase 설정
    pages/        # 화면 단위 페이지
    routes.tsx    # 라우팅 정의
  firebase.ts     # Firebase 재export
  main.tsx        # 앱 엔트리

scripts/
  replace-words-from-seed.mjs  # Firestore words 컬렉션 교체 스크립트
```

## Main Routes

- `/onboarding`
- `/login`
- `/app/home`
- `/app/words`
- `/app/quiz`
- `/app/review`
- `/app/community`
- `/app/profile`
- `/screens-overview`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview the production build

```bash
npm run preview
```

## Firebase

이 프로젝트는 Firebase Web App 설정을 사용합니다.

- Firebase 설정 파일: `src/app/lib/firebase.ts`
- Firestore 보안 규칙: `firestore.rules`
- Hosting 설정: `firebase.json`

배포 명령:

```bash
npm run deploy
```

## Seed Data

단어 데이터는 `src/app/data/seedWords.ts`에 정리되어 있으며,  
`scripts/replace-words-from-seed.mjs` 스크립트로 Firestore `words` 컬렉션을 교체할 수 있습니다.

현재 시드 데이터는 다음 기준을 사용합니다.

- Source: `hermitdave/FrequencyWords`
- Corpus base: `OpenSubtitles 2018`
- License: `CC BY-SA 4.0`

## Current Status

- Firebase Authentication 연동 완료
- Firestore `words` 컬렉션 연동 완료
- FrequencyWords 상위 100개 단어 시드 반영 완료
- Firebase Hosting 배포 구성 완료
- 기본 보안 규칙 초안 적용 완료

## Notes

- Firebase 웹 설정의 `apiKey`는 프로젝트 식별용이며, 실제 데이터 접근 제어는 Firestore Security Rules와 인증 설정에 의해 결정됩니다.
- 운영 환경에서는 Firebase 키 제한, App Check, 환경 분리 설정을 함께 점검하는 것을 권장합니다.

## Repository

- GitHub: [wns544/hsmocap](https://github.com/wns544/hsmocap)
- Branch in progress: `onejun`
