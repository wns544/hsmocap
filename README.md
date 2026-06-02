# Wordy

Firebase 기반 영어 단어 학습 서비스입니다.

이 저장소는 웹 버전과 Android 네이티브 앱을 함께 관리합니다. 웹은 React + Vite로 개발되어 Firebase Hosting에 배포되고, Android 앱은 `android-native/` 아래의 Kotlin 네이티브 프로젝트로 관리됩니다.

## Overview

- React + Vite 기반 웹앱
- Kotlin 기반 Android 네이티브 앱
- Firebase Authentication 로그인
- Cloud Firestore 단어, 학습 상태, 커뮤니티 데이터 연동
- Firebase Functions 기반 문장 퀴즈 채점
- Firebase Hosting 웹 배포 구성
- 게스트 접근 및 게스트 기능 제한 정책
- 단어 목록, 퀴즈, 플래시카드, 복습, 커뮤니티, 프로필 흐름 제공

## Live URL

- [https://hsmocap-d907e.web.app](https://hsmocap-d907e.web.app)
- [https://hsmocap-d907e.firebaseapp.com](https://hsmocap-d907e.firebaseapp.com)

## Repository Structure

```text
src/                    # 웹 앱 소스
  app/
    components/         # 웹 공통 컴포넌트
    contexts/           # 인증 컨텍스트
    data/               # 웹 단어 시드 데이터
    lib/                # Firebase 설정
    pages/              # 웹 화면
    routes.tsx          # 웹 라우팅

android-native/         # Android 네이티브 앱
  app/
    src/main/java/      # Kotlin 소스
    src/main/res/       # Android 리소스
    src/main/assets/    # 네이티브 앱 시드 데이터
  docs/                 # 네이티브 앱 문서
  gradle/               # Gradle wrapper

functions/              # Firebase Functions
  src/                  # 함수 소스
  scripts/              # 관리자용 시드 스크립트

scripts/                # Firestore 데이터 관리 스크립트
firebase.json           # Firebase Hosting 설정
firestore.rules         # Firestore 보안 규칙
storage.rules           # Firebase Storage 보안 규칙
```

## Web App

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Deploy

```bash
npm run deploy
```

## Android Native App

Android 네이티브 앱은 `android-native/` 폴더를 Android Studio에서 열어 개발합니다.

```text
android-native/
```

### Debug Build

```powershell
cd android-native
.\gradlew.bat assembleDebug
```

### Release Build

```powershell
cd android-native
.\gradlew.bat :app:assembleRelease
```

Release APK output:

```text
android-native/app/build/outputs/apk/release/app-release.apk
```

## Firebase Functions

문장 퀴즈 채점은 Firebase Functions 서버 처리를 우선 사용합니다.

- `gradeWordAnswerHttp`: 문장 퀴즈 정답 채점
- `imageHintSearchHttp`: 단어 이미지 힌트 반환

Functions 로컬 빌드:

```bash
cd functions
npm install
npm run build
```

Functions 배포:

```bash
cd functions
npm run build
firebase deploy --only functions:gradeWordAnswerHttp
firebase deploy --only functions:imageHintSearchHttp
```

프로젝트에 레거시 함수가 남아 있을 수 있으므로, Functions는 전체 배포보다 타깃 함수 배포를 권장합니다.

## Features

- 이메일, Google, 게스트 로그인
- 이메일 회원가입
- 로그인/회원가입 예외 처리 및 로딩 표시
- 게스트 기능 제한 안내
- 단어 목록 검색 및 카테고리 필터
- 단어 상세 화면
- 플래시카드 학습
- 문장 학습 및 문장 퀴즈
- 객관식, 주관식 퀴즈
- 즐겨찾기 및 오답 복습
- 커뮤니티 게시글, 댓글, 좋아요, 저장
- 게시글 이미지 전체화면 보기
- 프로필 및 설정

## Firebase

웹과 Android 앱 모두 Firebase를 사용합니다.

- Web Firebase config: `src/app/lib/firebase.ts`
- Android Firebase config: `android-native/app/google-services.json`
- Firestore rules: `firestore.rules`
- Storage rules: `storage.rules`
- Hosting config: `firebase.json`
- Functions source: `functions/src/index.ts`

Android의 `google-services.json`은 저장소에 커밋하지 않습니다. 새 개발 환경에서는 Firebase Console에서 package id `com.hsmocap.app`용 Android 앱을 등록한 뒤 파일을 내려받아 아래 위치에 직접 넣어야 합니다.

```text
android-native/app/google-services.json
```

자세한 네이티브 Firebase 설정은 다음 문서를 참고합니다.

```text
android-native/docs/firebase-native-setup.md
android-native/docs/final-acceptance-checklist.md
```

## Seed Data

웹 단어 데이터는 `src/app/data/seedWords.ts`에 있고, Android 네이티브 앱은 `android-native/app/src/main/assets/seedWords.json`을 사용합니다.

Firestore `words` 컬렉션 교체 스크립트:

```bash
node scripts/replace-words-from-seed.mjs
```

현재 시드 데이터 기준:

- Source: `hermitdave/FrequencyWords`
- Corpus base: `OpenSubtitles 2018`
- License: `CC BY-SA 4.0`

## Do Not Commit

다음 파일은 저장소에 올리지 않습니다.

```text
android-native/app/google-services.json
android-native/local.properties
android-native/keystore.properties
android-native/*.jks
android-native/*.keystore
android-native/pepk.jar
android-native/store-assets/
android-native/app/build/
android-native/build/
*.apk
*.aab
.env
.env.*
functions/.env
```

## Current Status

- 웹 버전 Firebase Hosting 배포 구성 완료
- Android 네이티브 앱 main 브랜치 반영 완료
- Firebase Auth, Firestore, Storage 연동 흐름 구성
- 게스트 제한, 커뮤니티, 프로필, 학습 화면 기본 구현
- Android release APK 빌드 및 기기 설치 확인

## Repository

- GitHub: [wns544/hsmocap](https://github.com/wns544/hsmocap)
- Main branch: `main`
