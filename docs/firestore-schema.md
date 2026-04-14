# Firestore Schema

이 문서는 현재 앱을 Firestore 기준으로 설계한 컬렉션 구조 초안이다. 기준은 다음이다.

- 앱은 이미 Firebase Auth + Firestore 사용 중
- 현재 코드에서 `words` 컬렉션 조회 사용
- 보안 규칙에서 `users/{uid}/...` 형태를 예상
- 커뮤니티는 `posts` 최상위 컬렉션을 기준으로 관리 가능

## 설계 원칙

- 공용 콘텐츠는 최상위 컬렉션에 둔다.
- 사용자별 상태 데이터는 `users/{uid}` 하위에 둔다.
- 카운트가 필요한 데이터는 원본 문서와 집계 필드를 함께 둔다.
- 읽기 패턴이 많은 화면은 문서 중복을 일부 허용한다.
- 단순 배열로 끝나는 작은 데이터는 문서 내부 배열로 저장하고, 증가 가능성이 큰 데이터는 서브컬렉션으로 분리한다.

## 권장 컬렉션 구조

```text
words/{wordId}
posts/{postId}
communityCategories/{categoryId}
achievements/{achievementId}

users/{uid}
users/{uid}/favorites_words/{wordId}
users/{uid}/favorite_posts/{postId}
users/{uid}/word_progress/{wordId}
users/{uid}/review_schedules/{wordId}
users/{uid}/study_sessions/{sessionId}
users/{uid}/study_sessions/{sessionId}/answers/{answerId}
users/{uid}/achievements/{achievementId}
users/{uid}/feedback/{feedbackId}
```

## 1. words

단어 학습의 공용 콘텐츠 컬렉션이다.

문서 ID 권장:

- 소문자 단어 자체를 쓰거나
- slug를 쓰거나
- UUID를 쓰되 `wordLower` 필드를 별도 보관

예시:

```json
{
  "word": "serendipity",
  "wordLower": "serendipity",
  "meaning": "뜻",
  "pronunciation": "/ˌserənˈdipədē/",
  "level": "advanced",
  "partOfSpeech": "noun",
  "examples": [
    {
      "en": "Finding that book was pure serendipity.",
      "ko": "그 책을 찾은 건 뜻밖의 행운이었다."
    }
  ],
  "synonyms": ["fortune", "luck", "chance"],
  "relatedWords": ["fortune", "destiny", "coincidence"],
  "exampleSentence": "Finding that book was pure serendipity.",
  "exampleTranslation": "그 책을 찾은 건 뜻밖의 행운이었다.",
  "quizKoreanBlank": "뜻밖의 행운",
  "quizAnswers": ["뜻밖의 행운", "우연한 행운"],
  "isPublished": true,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

설명:

- 현재 코드가 `examples`, `synonyms`, `relatedWords`를 직접 쓰므로 배열 유지가 편하다.
- `SentenceQuiz`가 `exampleSentence`, `exampleTranslation`, `quizKoreanBlank`, `quizAnswers`를 사용하므로 같은 문서 안에 두는 것이 좋다.
- 단어 수가 많아져도 문서 하나 크기는 충분히 관리 가능하다.

## 2. communityCategories

커뮤니티 카테고리 마스터 데이터다.

예시:

```json
{
  "slug": "study-tip",
  "name": "학습팁",
  "sortOrder": 1,
  "isActive": true
}
```

필수는 아니지만 카테고리 명칭을 코드에 박아두지 않으려면 두는 편이 낫다.

## 3. posts

커뮤니티 게시글 최상위 컬렉션이다.

예시:

```json
{
  "authorId": "firebase_uid",
  "authorSnapshot": {
    "nickname": "사용자",
    "avatarUrl": "",
    "level": 7
  },
  "categoryId": "study-tip",
  "categoryName": "학습팁",
  "title": "효율적인 단어 암기법",
  "content": "게시글 본문",
  "imageUrls": [
    "https://..."
  ],
  "isPublic": true,
  "isHot": false,
  "viewCount": 120,
  "likeCount": 10,
  "commentCount": 3,
  "bookmarkCount": 2,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

설명:

- 작성자 닉네임과 레벨은 `authorSnapshot`으로 일부 중복 저장하는 편이 목록 조회에 유리하다.
- 이미지가 최대 5장 수준이면 배열 `imageUrls`로 충분하다.
- `likeCount`, `commentCount`, `bookmarkCount`, `viewCount`는 집계 필드다.

### posts/{postId}/comments

댓글은 게시글 하위 서브컬렉션으로 두는 것이 자연스럽다.

예시:

```json
{
  "authorId": "firebase_uid",
  "authorSnapshot": {
    "nickname": "댓글작성자",
    "avatarUrl": "",
    "level": 3
  },
  "content": "댓글 내용",
  "parentCommentId": null,
  "likeCount": 0,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

대댓글이 필요하면 `parentCommentId`를 사용한다.

### posts/{postId}/likes/{uid}

좋아요 여부 확인이 빠르다.

예시:

```json
{
  "userId": "firebase_uid",
  "createdAt": "serverTimestamp"
}
```

### posts/{postId}/bookmarks/{uid}

실제로는 사용자 기준 조회가 더 많아서 아래 `users/{uid}/favorite_posts`만 둬도 된다. 다만 게시글 단위 집계나 관리자 조회가 많으면 같이 둘 수 있다.

## 4. achievements

업적 마스터 컬렉션이다.

예시:

```json
{
  "key": "first_word",
  "name": "첫 단어",
  "description": "첫 단어를 학습하면 달성",
  "icon": "sprout",
  "conditionType": "unique_studied_words",
  "conditionValue": 1,
  "isActive": true
}
```

## 5. users/{uid}

사용자 문서는 프로필, 설정, 누적 통계를 함께 담는다.

예시:

```json
{
  "authProvider": "anonymous",
  "nickname": "사용자",
  "email": null,
  "avatarUrl": "",
  "joinedAt": "serverTimestamp",
  "preferences": {
    "preferredStudyLevel": "all",
    "dailyGoalCount": 20,
    "notificationsEnabled": true
  },
  "stats": {
    "totalXp": 320,
    "currentLevel": 4,
    "totalCorrectAnswers": 58,
    "totalWrongAnswers": 12,
    "completedSessions": 9,
    "perfectSessions": 3,
    "accuracyRate": 83
  },
  "updatedAt": "serverTimestamp"
}
```

설명:

- Firestore에서는 1:1 성격의 작은 데이터는 굳이 별도 컬렉션으로 쪼개지 않아도 된다.
- 프로필, 환경설정, 누적 통계는 사용자 문서에 합치는 편이 단순하다.

## 6. users/{uid}/word_progress/{wordId}

사용자별 단어 숙련도 저장용이다.

예시:

```json
{
  "wordId": "serendipity",
  "word": "Serendipity",
  "meaning": "뜻",
  "level": "advanced",
  "mastery": 78,
  "earnedXp": 48,
  "correctCount": 4,
  "wrongCount": 1,
  "lastStudiedAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

설명:

- 화면에서 즉시 보여줄 `word`, `meaning`, `level` 정도는 중복 저장해도 된다.
- 단어 삭제/수정 동기화가 중요하면 Cloud Functions로 보정하면 된다.

## 7. users/{uid}/favorites_words/{wordId}

즐겨찾기 단어다.

예시:

```json
{
  "wordId": "serendipity",
  "word": "Serendipity",
  "meaning": "뜻",
  "level": "advanced",
  "mastery": 78,
  "addedAt": "serverTimestamp"
}
```

설명:

- `Favorites` 화면이 바로 리스트를 그릴 수 있게 일부 표시 데이터를 복제한다.

## 8. users/{uid}/favorite_posts/{postId}

사용자가 저장한 게시글이다.

예시:

```json
{
  "postId": "post_123",
  "title": "효율적인 단어 암기법",
  "categoryName": "학습팁",
  "authorNickname": "작성자",
  "likedCount": 10,
  "commentCount": 3,
  "createdAt": "postCreatedAt",
  "savedAt": "serverTimestamp"
}
```

설명:

- 저장 목록 화면은 사용자 기준 조회가 주이므로 `users/{uid}` 하위가 맞다.
- 게시글 원문은 `posts/{postId}`에서 상세 조회한다.

## 9. users/{uid}/review_schedules/{wordId}

복습 화면용 데이터다.

예시:

```json
{
  "wordId": "serendipity",
  "word": "Serendipity",
  "meaning": "뜻",
  "level": "advanced",
  "reviewCount": 3,
  "nextReviewAt": "timestamp",
  "dueDate": "2026-04-16",
  "isUrgent": true,
  "status": "pending",
  "updatedAt": "serverTimestamp"
}
```

설명:

- Firestore는 날짜 범위 조회가 쉬우므로 `nextReviewAt` 기준 조회가 유용하다.
- 문자열 날짜보다 `Timestamp`를 기본으로 쓰는 편이 낫다.

## 10. users/{uid}/study_sessions/{sessionId}

한 번의 학습 실행 단위다.

예시:

```json
{
  "sessionType": "sentence_quiz",
  "studyLevel": "advanced",
  "totalQuestions": 10,
  "correctCount": 8,
  "wrongCount": 2,
  "earnedXp": 52,
  "startedAt": "serverTimestamp",
  "completedAt": "serverTimestamp"
}
```

### users/{uid}/study_sessions/{sessionId}/answers/{answerId}

문제별 답안이다.

예시:

```json
{
  "wordId": "serendipity",
  "word": "Serendipity",
  "promptType": "sentence_quiz",
  "promptText": "Finding that book was pure serendipity.",
  "expectedAnswer": "뜻밖의 행운",
  "submittedAnswer": "뜻밖의 행운",
  "isCorrect": true,
  "responseTimeMs": 2400,
  "createdAt": "serverTimestamp"
}
```

설명:

- 세션당 답안 개수는 제한적이라 서브컬렉션이 적합하다.
- 나중에 오답 노트 자동 생성이나 추천 알고리즘에 활용 가능하다.

## 11. users/{uid}/achievements/{achievementId}

사용자 달성 업적이다.

예시:

```json
{
  "achievementKey": "first_word",
  "name": "첫 단어",
  "description": "첫 단어를 학습하면 달성",
  "icon": "sprout",
  "earnedAt": "serverTimestamp"
}
```

## 12. users/{uid}/feedback/{feedbackId}

사용자가 보낸 피드백이다.

예시:

```json
{
  "category": "기능 제안",
  "title": "복습 정렬 기능",
  "content": "복습 목록을 난이도별로 정렬하고 싶습니다.",
  "status": "submitted",
  "createdAt": "serverTimestamp"
}
```

운영자 처리까지 고려하면 최상위 `feedbacks` 컬렉션으로 올리는 방안도 있다. 다만 현재 규칙 구조상 `users/{uid}` 하위가 더 단순하다.

## 화면별 읽기 패턴

### 단어 목록

- `words`
- 정렬: `createdAt desc`
- 필터: `level == selectedLevel`

### 단어 상세

- `words/{wordId}`
- `users/{uid}/word_progress/{wordId}`
- `users/{uid}/favorites_words/{wordId}`

### 홈/프로필

- `users/{uid}`
- 최근 학습 이력 일부가 필요하면 `study_sessions` 최근 5건 조회

### 복습 목록

- `users/{uid}/review_schedules`
- 조건: `status == "pending"`
- 정렬: `nextReviewAt asc`

### 즐겨찾기

- `users/{uid}/favorites_words`
- `users/{uid}/favorite_posts`

### 커뮤니티 목록

- `posts`
- 정렬: `createdAt desc`
- 필터: `categoryId == ...`

### 게시글 상세

- `posts/{postId}`
- `posts/{postId}/comments`
- `posts/{postId}/likes/{uid}` 존재 여부
- `users/{uid}/favorite_posts/{postId}` 존재 여부

## 추천 인덱스

Firestore 복합 인덱스 후보:

- `words(level asc, createdAt desc)`
- `posts(categoryId asc, createdAt desc)`
- `posts(isHot desc, createdAt desc)`
- `users/{uid}/review_schedules(status asc, nextReviewAt asc)`
- `users/{uid}/study_sessions(completedAt desc)`

## 보안 규칙 방향

현재 규칙과 잘 맞는 구조는 아래와 같다.

- `words/*`: 로그인 사용자 읽기, 등록 사용자 쓰기
- `posts/*`: 로그인 사용자 읽기, 작성자만 수정/삭제
- `posts/{postId}/comments/*`: 로그인 사용자 읽기, 작성자만 수정/삭제
- `users/{uid}/...`: 본인만 읽기/쓰기

## 현재 앱에서 바로 대응되는 매핑

- `src/app/pages/WordsList.tsx`
  - 그대로 `words` 사용 가능
- `src/app/pages/SentenceQuiz.tsx`
  - 그대로 `words` 사용 가능
- `src/app/lib/studyProgress.ts`
  - `localStorage` 대신 `users/{uid}`, `word_progress`, `study_sessions`로 이전
- `src/app/lib/community.ts`
  - 하드코딩 데이터 대신 `posts`, `users/{uid}/favorite_posts`로 이전

## 최소 도입 순서

1. `words`
2. `users/{uid}`
3. `users/{uid}/word_progress`
4. `users/{uid}/favorites_words`
5. `users/{uid}/review_schedules`
6. `posts`
7. `posts/{postId}/comments`
8. `users/{uid}/favorite_posts`
9. `users/{uid}/study_sessions`

## 결론

이 앱은 Firestore에서 다음 방식이 가장 자연스럽다.

- 공용 데이터: `words`, `posts`, `communityCategories`, `achievements`
- 개인 데이터: `users/{uid}` 하위 서브컬렉션
- 집계 데이터: 게시글과 사용자 루트 문서에 캐시
- 상세 이벤트 데이터: 학습 세션과 답안 서브컬렉션

즉, 관계형처럼 모든 것을 정규화하기보다, 화면 조회를 빠르게 만들기 위한 부분 중복과 사용자 하위 컬렉션 분리가 핵심이다.
