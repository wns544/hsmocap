# Admin Dashboard Deploy Checklist

## 저장 위치

프로젝트 루트:

```txt
C:\hsmocap\onejun_branch
```

관리자 대시보드 주요 파일:

```txt
src/app/pages/AdminDashboard.tsx
src/app/lib/admin.ts
src/app/lib/feedback.ts
functions/src/index.ts
firestore.rules
```

## 배포 전 확인

1. 로컬 bootstrap UID 파일이 있는지 확인한다.

```txt
functions/.env.hsmocap-d907e
```

필수 내용:

```env
ADMIN_BOOTSTRAP_UIDS=xezvVnR7d2YmSXTqSatGzUBLGxI3
```

2. 로컬 프론트 접근 허용 파일이 있는지 확인한다.

```txt
.env.local
```

필수 내용:

```env
VITE_DEVELOPER_UIDS=xezvVnR7d2YmSXTqSatGzUBLGxI3
```

3. 빌드 검증을 실행한다.

```bash
npm run verify:admin
```

## 배포 명령

라이브 Firebase 프로젝트에 반영한다.

```bash
npm run deploy:admin
```

기본 프로젝트는 `.firebaserc` 기준 `hsmocap-d907e`이다.

## 배포 후 확인

1. 라이브 앱에 로그인한다.
2. 관리자 대시보드로 이동한다.

```txt
/app/admin
```

3. `admin claim 동기화`를 누른다.
4. 로그아웃 후 다시 로그인한다.
5. 다음 기능을 순서대로 확인한다.

- 개요 탭 데이터 로드
- 단어 생성/수정/삭제
- 게시글 삭제
- 댓글 삭제
- UID 기준 관리자 권한 부여/해제
- 사용자 목록 조회
- 사용자 학습 데이터 초기화
- 피드백 접수/상태 변경
- 중요 피드백 강조 표시
- 감사 로그 기록

## 보안 원칙

- 프론트의 `VITE_DEVELOPER_UIDS`는 임시 진입 장치다.
- 실제 위험 작업은 Cloud Functions에서 ID token을 검증하고 `admin` custom claim 또는 bootstrap UID를 확인한다.
- 관리자 작업은 `adminLogs` 컬렉션에 기록된다.
- `.env.local`과 `functions/.env.hsmocap-d907e`는 Git ignore 대상이다.
