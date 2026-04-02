import { createBrowserRouter, Navigate } from "react-router";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Home from "./pages/Home";
import WordsList from "./pages/WordsList";
import WordDetail from "./pages/WordDetail";
import QuizStart from "./pages/QuizStart";
import MultipleChoiceQuiz from "./pages/MultipleChoiceQuiz";
import ShortAnswerQuiz from "./pages/ShortAnswerQuiz";
import QuizResult from "./pages/QuizResult";
import ReviewList from "./pages/ReviewList";
import WrongAnswers from "./pages/WrongAnswers";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import ScreensOverview from "./pages/ScreensOverview";
import FlashcardStudy from "./pages/FlashcardStudy";
import SentenceStudy from "./pages/SentenceStudy";
import SentenceQuiz from "./pages/SentenceQuiz";
import FlashcardFavorites from "./pages/FlashcardFavorites";
import SentenceFavorites from "./pages/SentenceFavorites";
import Layout from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/screens-overview" replace />,
  },
  {
    path: "/screens-overview",
    element: <ScreensOverview />,
  },
  {
    path: "/onboarding",
    element: <Onboarding />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/app",
    element: <Layout />,
    children: [
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "words",
        element: <WordsList />,
      },
      {
        path: "words/:id",
        element: <WordDetail />,
      },
      {
        path: "quiz",
        element: <QuizStart />,
      },
      {
        path: "quiz/multiple-choice",
        element: <MultipleChoiceQuiz />,
      },
      {
        path: "quiz/short-answer",
        element: <ShortAnswerQuiz />,
      },
      {
        path: "quiz/result",
        element: <QuizResult />,
      },
      {
        path: "review",
        element: <ReviewList />,
      },
      {
        path: "wrong-answers",
        element: <WrongAnswers />,
      },
      {
        path: "favorites",
        element: <Favorites />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "community",
        element: <Community />,
      },
      {
        path: "community/create",
        element: <CreatePost />,
      },
      {
        path: "community/:id",
        element: <PostDetail />,
      },
      {
        path: "flashcard-study",
        element: <FlashcardStudy />,
      },
      {
        path: "sentence-study",
        element: <SentenceStudy />,
      },
      {
        path: "sentence-quiz",
        element: <SentenceQuiz />,
      },
      {
        path: "flashcard-favorites",
        element: <FlashcardFavorites />,
      },
      {
        path: "sentence-favorites",
        element: <SentenceFavorites />,
      },
    ],
  },
]);