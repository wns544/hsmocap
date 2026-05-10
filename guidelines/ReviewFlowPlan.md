# 복습 기능 1차 구조 확정 문서

## 목표

- UI를 크게 바꾸지 않고 복습 기능을 붙인다.
- 복습은 "새 단어 다시 보기"가 아니라 **오답/미숙 단어 재학습**으로 정의한다.
- 기존 학습/문장 퀴즈 화면을 재사용하고, 데이터 흐름만 복습 모드로 연결한다.

## 이번 차수 범위

이번 차수에서 확정할 것:

1. `wordProgresses` 데이터 구조
2. 퀴즈 결과 저장 기준
3. 복습 대상 선정 기준

이번 차수에서 미루는 것:

1. 복잡한 spaced repetition 알고리즘
2. XP / 업적 / 보상 연동
3. 복습 전용 새 UI
4. 통계 그래프 / 대시보드

## 핵심 개념

복습하기는 아래 흐름으로 동작한다.

1. 사용자가 기존 학습/문장 퀴즈를 푼다.
2. 결과를 `wordProgresses`에 저장한다.
3. 홈의 `복습하기`가 복습 대상만 조회한다.
4. 기존 학습 UI가 복습 대상 배열을 받아 세션을 시작한다.
5. 복습 결과에 따라 다음 복습 시점을 갱신한다.

## Firestore 구조

```text
users/{uid}/wordProgresses/{wordId}
```

문서 ID:

- `{wordId}`

이 구조를 쓰는 이유:

- "내 진행도" 조회가 자연스럽다.
- 유저별 Rules 작성이 쉽다.
- 같은 단어 진행도 중복 생성이 어렵다.

## 최소 필드

```text
wordId: string
status: "NOT_STARTED" | "LEARNING" | "REVIEW" | "MASTERED"
currentStage: number
totalAnswerCount: number
correctAnswerCount: number
lastReviewedAt: Timestamp | null
nextReviewAt: Timestamp | null
lastResult: "correct" | "wrong" | null
createdAt: Timestamp
updatedAt: Timestamp
```

## 필드 의미

- `status`
  - 현재 단어의 학습 상태
- `currentStage`
  - 복습 단계
- `totalAnswerCount`
  - 총 시도 횟수
- `correctAnswerCount`
  - 정답 횟수
- `lastReviewedAt`
  - 마지막 학습/복습 시각
- `nextReviewAt`
  - 다음 복습 예정 시각
- `lastResult`
  - 최근 결과

## 1차 상태 규칙

최소 상태 규칙은 아래처럼 단순하게 둔다.

- `NOT_STARTED`
  - 아직 시도한 적 없음
- `LEARNING`
  - 학습/퀴즈를 시작했지만 아직 복습 대기 상태로 보기 애매함
- `REVIEW`
  - 오답이 있었거나 다시 봐야 하는 상태
- `MASTERED`
  - 충분히 익혔다고 판단한 상태

## 1차 단계 규칙

단계는 처음엔 단순하게 쓴다.

- `0`
  - 미학습
- `1`
  - 첫 학습 직후
- `2`
  - 1차 복습 대기
- `3`
  - 2차 복습 대기
- `4`
  - 숙달 후보

세부 알고리즘은 나중에 고도화하고, 1차는 **단계가 오르고 내려간다** 정도만 보장한다.

## 1차 결과 저장 규칙

문장 퀴즈 기준으로 먼저 연결한다.

정답:

- `totalAnswerCount + 1`
- `correctAnswerCount + 1`
- `lastResult = "correct"`
- `lastReviewedAt = now`

오답:

- `totalAnswerCount + 1`
- `lastResult = "wrong"`
- `status = "REVIEW"`
- `lastReviewedAt = now`

## 1차 복습 대상 선정 기준

처음엔 아래 기준만 쓴다.

1. `lastResult == "wrong"`
2. 또는 `nextReviewAt <= now`
3. 그리고 `status != "MASTERED"`

즉 1차 복습은 **최근 틀렸거나, 다시 볼 시점이 된 단어**를 모아주는 방식이다.

## UI 연결 원칙

UI는 새로 만들지 않는다.

- 홈의 `복습하기` 버튼 유지
- 기존 학습/퀴즈 화면 재사용

허용되는 최소 UI 수정:

- `복습할 단어가 없어요`
- `복습 2/8`

정도의 문구만 추가 가능

## 이번 차수 이후 예상 작업

1. `wordProgresses` helper 추가
2. 문장 퀴즈 결과 저장 연결
3. 복습 대상 조회 로직 추가
4. 홈 `복습하기` 버튼 연결
5. 기존 학습 화면에 review mode 추가
6. `nextReviewAt` 갱신 로직 추가

## 이번 차수 완료 기준

이번 문서 작업이 끝나면 아래가 합의된 상태여야 한다.

1. 어떤 Firestore 문서 구조를 쓸지
2. 어떤 필드를 저장할지
3. 어떤 단어를 복습 대상으로 볼지
4. UI를 새로 만들지 않는다는 원칙

## 한 줄 정리

복습 기능 1차는 **`users/{uid}/wordProgresses/{wordId}`에 오답/학습 결과를 저장하고, 홈의 `복습하기`가 그중 다시 봐야 할 단어만 기존 학습 UI로 넘기는 구조**로 간다.
