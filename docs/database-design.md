# Database Design

이 문서는 현재 앱 구조를 기준으로 관계형 데이터베이스 초안을 정리한 것이다. 기준 기능은 다음과 같다.

- 사용자 인증 및 프로필
- 단어 목록/상세
- 퀴즈, 플래시카드, 복습
- 사용자별 학습 진도, XP, 업적
- 즐겨찾기
- 커뮤니티 게시글, 댓글, 좋아요, 북마크
- 피드백 접수

## 핵심 도메인

### 1. 사용자

사용자는 인증의 기준 엔터티다.

- `users`
  - 로그인 계정의 기본 키
  - Firebase UID 같은 외부 인증 식별자 저장
- `user_profiles`
  - 닉네임, 이메일, 아바타, 가입일
  - 앱 화면용 프로필 정보
- `user_preferences`
  - 선호 학습 레벨, 일일 목표, 알림 여부 등

### 2. 단어 콘텐츠

단어는 학습의 중심 콘텐츠다.

- `words`
  - 단어명, 뜻, 발음, 난이도, 품사, 생성일
- `word_examples`
  - 예문 영문/한글 번역
  - 한 단어에 여러 예문 가능
- `word_synonyms`
  - 유의어
- `word_relations`
  - 관련 단어
  - `related_word_id`를 사용하면 단어 간 연결도 가능

### 3. 사용자별 단어 상태

단어 자체와 사용자 상태를 분리해야 한다.

- `user_word_progress`
  - 사용자별 단어 숙련도
  - 정답 수, 오답 수, 누적 XP, 마지막 학습일
- `user_favorite_words`
  - 사용자가 저장한 단어
- `review_schedules`
  - 복습 대상, 다음 복습일, 복습 횟수, 긴급 여부

### 4. 학습 세션과 답안

학습 기록은 세션과 세션 내 답안으로 나누는 편이 좋다.

- `study_sessions`
  - 한 번의 학습 실행
  - 유형: `sentence_quiz`, `flashcard`, `multiple_choice`, `short_answer`, `review`
  - 시작/종료 시각, 총 문제 수, 정답 수, 오답 수, 획득 XP
- `study_session_answers`
  - 세션 안의 문제별 제출 결과
  - 문제 유형, 대상 단어, 사용자 입력값, 정답 여부

### 5. 업적과 누적 통계

화면상 업적과 XP/레벨이 존재하므로 별도 관리가 필요하다.

- `user_stats`
  - 누적 XP, 현재 레벨, 전체 정답 수, 전체 오답 수, 완료 세션 수, 퍼펙트 세션 수
- `achievements`
  - 업적 마스터 데이터
- `user_achievements`
  - 사용자가 어떤 업적을 언제 달성했는지 저장

### 6. 커뮤니티

커뮤니티는 게시글, 댓글, 반응을 분리한다.

- `community_categories`
  - 학습팁, 시험대비, 질문, 후기, 자유 등
- `community_posts`
  - 작성자, 카테고리, 제목, 본문, 조회수, 공개 여부
- `community_post_images`
  - 게시글 첨부 이미지
- `community_comments`
  - 댓글 및 대댓글
- `community_post_likes`
  - 게시글 좋아요
- `community_post_bookmarks`
  - 게시글 저장

### 7. 피드백

설정 화면의 피드백 제출은 커뮤니티 글과 분리하는 것이 맞다.

- `feedback_submissions`
  - 버그 제보, 기능 제안, 사용성, 디자인, 기타
  - 제목, 내용, 상태, 접수일

## 관계 요약

- 사용자 1:1 프로필
- 사용자 1:1 환경설정
- 단어 1:N 예문
- 단어 1:N 유의어
- 단어 N:M 관련 단어
- 사용자 N:M 단어
  - 연결 테이블: `user_word_progress`, `user_favorite_words`
- 사용자 1:N 학습 세션
- 학습 세션 1:N 답안
- 사용자 1:N 복습 일정
- 사용자 1:N 게시글
- 게시글 1:N 이미지
- 게시글 1:N 댓글
- 사용자 N:M 게시글
  - 연결 테이블: `community_post_likes`, `community_post_bookmarks`
- 사용자 1:N 피드백

## 권장 테이블 목록

필수:

- `users`
- `user_profiles`
- `user_preferences`
- `user_stats`
- `words`
- `word_examples`
- `word_synonyms`
- `word_relations`
- `user_word_progress`
- `user_favorite_words`
- `review_schedules`
- `study_sessions`
- `study_session_answers`
- `community_categories`
- `community_posts`
- `community_post_images`
- `community_comments`
- `community_post_likes`
- `community_post_bookmarks`
- `feedback_submissions`
- `achievements`
- `user_achievements`

## 설계 포인트

- `words.mastery` 같은 값은 단어 공통 속성이 아니라 사용자별 상태이므로 `user_word_progress`로 이동하는 것이 맞다.
- `isFavorite`도 단어 테이블 컬럼이 아니라 사용자-단어 관계 테이블에서 관리해야 한다.
- 조회수, 좋아요 수, 댓글 수는 `community_posts`에 캐시 컬럼으로 둘 수 있지만, 원본 데이터는 반응 테이블에서 관리하는 편이 안전하다.
- 퀴즈 결과는 나중에 분석과 추천 로직에 쓰이므로 세션 단위와 답안 단위를 둘 다 남기는 편이 좋다.
- Firebase를 계속 쓸 경우에도 구조는 동일하고, 컬렉션/서브컬렉션 구조로만 변환하면 된다.

## 간단 ERD

```text
users - user_profiles
users - user_preferences
users - user_stats

words - word_examples
words - word_synonyms
words - word_relations

users -< user_word_progress >- words
users -< user_favorite_words >- words
users -< review_schedules >- words

users -< study_sessions -< study_session_answers >- words

users -< community_posts >- community_categories
community_posts -< community_post_images
community_posts -< community_comments
users -< community_comments
users -< community_post_likes >- community_posts
users -< community_post_bookmarks >- community_posts

users -< feedback_submissions
users -< user_achievements >- achievements
```
