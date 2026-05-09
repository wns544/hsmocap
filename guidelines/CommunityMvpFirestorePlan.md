# Community MVP Firestore Plan

## 목적

월요일 시연 기준으로 **커뮤니티 기본 흐름이 실제로 동작하는 상태**를 만드는 것을 목표로 한다.

이번 1차에서는 완전한 커뮤니티 전체 기능이 아니라, 아래 흐름만 안정적으로 구현한다.

- 카테고리 목록
- 카테고리별 게시글 목록
- 게시글 작성
- 게시글 상세 조회
- 댓글 작성 / 댓글 목록
- 좋아요 / 좋아요 취소
- 본인 게시글 / 댓글 권한 처리

## 1차 구현 범위

### 포함

- `boardCategories/{categoryId}`
- `posts/{postId}`
- `posts/{postId}/comments/{commentId}`
- `posts/{postId}/likes/{uid}`
- `users/{uid}`

### 제외

- 게시글 저장 / 북마크
- 대댓글
- 신고 기능
- 인기글 정렬
- 관리자 숨김 / 강제 삭제
- 정확한 `likeCount` / `commentCount` / `viewCount` 집계

## Firestore 구조

### 1. 카테고리

```text
boardCategories/{categoryId}
```

예상 필드:

```ts
{
  name: string
  description: string
}
```

용도:

- 카테고리 목록 출력
- 게시글 작성 시 category 선택
- 카테고리별 게시글 필터링

### 2. 게시글

```text
posts/{postId}
```

예상 필드:

```ts
{
  categoryId: string
  categoryName: string
  userId: string
  authorSnapshot: {
    name: string
  }
  title: string
  body: string
  createdAt: Timestamp
  updatedAt: Timestamp

  // 선택 사항, 정확한 집계는 후순위
  likeCount?: number
  commentCount?: number
  viewCount?: number
}
```

메모:

- `authorSnapshot`은 작성 시점 이름만 저장한다
- 이메일은 저장하지 않는다
- 이름 변경 시 기존 게시글 작성자명은 자동 갱신하지 않는다

### 3. 댓글

```text
posts/{postId}/comments/{commentId}
```

예상 필드:

```ts
{
  userId: string
  authorSnapshot: {
    name: string
  }
  content: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

메모:

- 1차에서는 대댓글 없음
- 댓글 수정은 가능하면 구현, 시간이 부족하면 삭제 우선

### 4. 좋아요

```text
posts/{postId}/likes/{uid}
```

예상 필드:

```ts
{
  userId: string
  createdAt: Timestamp
}
```

메모:

- 문서 ID가 `uid`이므로 1인 1좋아요 보장
- 좋아요 취소는 문서 삭제로 처리

### 5. 유저

```text
users/{uid}
```

커뮤니티 MVP에서 필요한 최소 필드 예시:

```ts
{
  name: string
  email: string | null
  role: "USER" | "ADMIN"
}
```

메모:

- 인증은 Firebase Auth 사용
- `password_hash` 같은 자체 비밀번호 저장은 하지 않음

## 1차에 보장할 기능

### 카테고리

- 카테고리 목록 보기
- 카테고리 선택
- 카테고리별 게시글 필터링

### 게시글

- 게시글 목록 보기
- 게시글 상세 보기
- 게시글 작성
- 본인 게시글 수정
- 본인 게시글 삭제

### 댓글

- 댓글 목록 보기
- 댓글 작성
- 본인 댓글 삭제
- 가능하면 본인 댓글 수정

### 좋아요

- 게시글 좋아요 누르기
- 좋아요 취소
- 내가 좋아요 눌렀는지 표시

### 권한

- 로그인한 사용자만 게시글 작성 가능
- 로그인한 사용자만 댓글 작성 가능
- 로그인한 사용자만 좋아요 가능
- 본인 게시글만 수정 / 삭제 가능
- 본인 댓글만 수정 / 삭제 가능

## 1차에서 확정하지 않는 것

아래는 구조상 가능하지만 이번 단계에서 확정 구현 대상으로 보지 않는다.

- `likeCount` 실시간 정확 집계
- `commentCount` 실시간 정확 집계
- `viewCount`
- 게시글 저장 / 북마크
- 대댓글
- 신고
- 인기글 정렬
- 관리자 모더레이션

## Rules 원칙

최소 원칙만 먼저 확정한다.

### 읽기

- 카테고리 / 게시글 / 댓글은 공개 읽기 가능

### 쓰기

- 로그인한 사용자만 게시글 작성 가능
- 로그인한 사용자만 댓글 작성 가능
- 로그인한 사용자만 좋아요 생성 / 삭제 가능

### 수정 / 삭제

- 게시글: 작성자 본인만
- 댓글: 작성자 본인만
- 좋아요: 자기 uid 문서만

## 인덱스 예상

추후 필요 가능성이 높은 쿼리:

- `posts`: `categoryId + createdAt desc`
- `comments`: `createdAt asc|desc`

Firestore에서 링크가 뜨면 콘솔에서 인덱스를 생성한다.

## 구현 순서

### 작업 0

구조 확정 문서

### 작업 1

카테고리 / 게시글 목록 읽기

### 작업 2

게시글 상세 / 댓글 목록 읽기

### 작업 3

게시글 작성

### 작업 4

댓글 작성

### 작업 5

좋아요 생성 / 취소

### 작업 6

본인 권한 처리

### 작업 7

Firestore Rules 최소 적용

## 구현 원칙

- 한 번에 한 작업만
- 작업 범위는 수정 파일 2~4개 안으로 제한
- 매 작업 후 build 또는 최소 동작 확인
- 큰 기능 묶음 한 번에 구현 금지
- count 집계는 후순위

## 팀 합의가 필요한 최소 항목

1. `authorSnapshot.name`만 저장할지
2. 댓글 수정까지 1차에 포함할지
3. `likeCount`, `commentCount` 필드를 일단 둘지
4. 카테고리 기본 목록을 무엇으로 둘지

## 한 줄 요약

이번 커뮤니티 1차는 **게시글 + 댓글 + 좋아요 + 권한 처리**까지만 확실히 구현하고, 나머지 고도화 기능은 후순위로 미룬다.
