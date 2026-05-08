# hsmocap

Firebase-based English vocabulary learning web app.

The current `main` branch is the latest baseline that combines:

- the latest Soohyun UI
- Onejun business logic
- sentence quiz server grading
- image hint Functions
- Firebase Functions source in-repo

## Live URLs

- [https://hsmocap-d907e.web.app](https://hsmocap-d907e.web.app)
- [https://hsmocap-d907e.firebaseapp.com](https://hsmocap-d907e.firebaseapp.com)

## Core Features

- word list and word detail
- flashcard study
- sentence study and sentence quiz
- multiple choice and short answer quizzes
- review and wrong answers flow
- favorites
- profile, progress, and settings
- community and post creation
- Google login and guest login

## Sentence Quiz Server Flow

The sentence quiz uses Firebase Functions for the primary API flow.

- `gradeWordAnswerHttp`
  - grades sentence quiz answers on the server
  - uses `Authorization: Bearer <idToken>`
- `imageHintSearchHttp`
  - returns image hints for the target word
  - if the function fails, the frontend falls back to Wikimedia

Current architecture:

- frontend -> Firebase Functions -> grading / image hint response
- frontend -> Firestore -> words, progress, community data
- frontend -> Firebase Authentication -> Google / anonymous auth

## Tech Stack

- React 18
- Vite
- React Router
- Firebase Hosting
- Firebase Authentication
- Firebase Firestore
- Firebase Functions

## Project Structure

```text
src/app/
  components/   shared UI
  pages/        route-level pages
  lib/          Firebase helpers, learning logic, adapters
  data/         seed data
functions/
  src/index.ts  Firebase Functions entry
  scripts/      admin seed scripts
```

## Local Development

### Frontend

```bash
npm install
npm run dev
```

### Frontend Build

```bash
npm run build
```

### Functions

```bash
cd functions
npm install
npm run build
```

## Environment and Secrets

Do not commit real values.

Optional frontend env vars:

```env
VITE_GRADE_WORD_ANSWER_URL=
VITE_IMAGE_HINT_URL=
```

If unset, the app uses the default deployed Firebase Functions URLs.

Required Firebase Functions secrets:

```text
GROQ_API_KEY
PEXELS_API_KEY
```

## Deploy

### Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Functions

```bash
cd functions
npm run build
firebase deploy --only functions:gradeWordAnswerHttp
firebase deploy --only functions:imageHintSearchHttp
```

Targeted function deploys are recommended because legacy functions may still exist in the project.

## Notes

- preview hosting channel origins are allowed in Functions CORS
- image hint quality can vary by word and source result quality
- `seedWords` cleanup can be handled as a later quality task

## Current Baseline

`main` now represents the latest production baseline with:

- latest UI baseline
- sentence quiz server integration
- image hint server integration
- Firebase Functions source restored into the repository
