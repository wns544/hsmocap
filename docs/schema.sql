CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'firebase',
  auth_uid VARCHAR(191) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
  user_id BIGINT PRIMARY KEY,
  nickname VARCHAR(50) NOT NULL,
  email VARCHAR(191),
  avatar_url VARCHAR(500),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_preferences (
  user_id BIGINT PRIMARY KEY,
  preferred_study_level VARCHAR(30) NOT NULL DEFAULT 'all',
  daily_goal_count INT NOT NULL DEFAULT 20,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_stats (
  user_id BIGINT PRIMARY KEY,
  total_xp INT NOT NULL DEFAULT 0,
  current_level INT NOT NULL DEFAULT 1,
  total_correct_answers INT NOT NULL DEFAULT 0,
  total_wrong_answers INT NOT NULL DEFAULT 0,
  completed_sessions INT NOT NULL DEFAULT 0,
  perfect_sessions INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_stats_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE words (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  word VARCHAR(120) NOT NULL,
  meaning VARCHAR(500) NOT NULL,
  pronunciation VARCHAR(120),
  level_code VARCHAR(30) NOT NULL,
  part_of_speech VARCHAR(30),
  example_sentence VARCHAR(1000),
  example_translation VARCHAR(1000),
  quiz_korean_blank VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_words_word_level ON words(word, level_code);

CREATE TABLE word_examples (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  word_id BIGINT NOT NULL,
  english_text VARCHAR(1000) NOT NULL,
  korean_text VARCHAR(1000) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_word_examples_word
    FOREIGN KEY (word_id) REFERENCES words(id)
);

CREATE TABLE word_synonyms (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  word_id BIGINT NOT NULL,
  synonym_text VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_word_synonyms_word
    FOREIGN KEY (word_id) REFERENCES words(id)
);

CREATE TABLE word_relations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  word_id BIGINT NOT NULL,
  related_word_id BIGINT,
  related_text VARCHAR(120),
  relation_type VARCHAR(30) NOT NULL DEFAULT 'related',
  sort_order INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_word_relations_word
    FOREIGN KEY (word_id) REFERENCES words(id),
  CONSTRAINT fk_word_relations_related_word
    FOREIGN KEY (related_word_id) REFERENCES words(id)
);

CREATE TABLE user_word_progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  word_id BIGINT NOT NULL,
  mastery INT NOT NULL DEFAULT 0,
  earned_xp INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  last_studied_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_word_progress_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_word_progress_word
    FOREIGN KEY (word_id) REFERENCES words(id),
  CONSTRAINT uq_user_word_progress UNIQUE (user_id, word_id),
  CONSTRAINT ck_user_word_progress_mastery CHECK (mastery BETWEEN 0 AND 100)
);

CREATE TABLE user_favorite_words (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  word_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_favorite_words_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_favorite_words_word
    FOREIGN KEY (word_id) REFERENCES words(id),
  CONSTRAINT uq_user_favorite_words UNIQUE (user_id, word_id)
);

CREATE TABLE review_schedules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  word_id BIGINT NOT NULL,
  review_count INT NOT NULL DEFAULT 0,
  next_review_at TIMESTAMP,
  due_date DATE,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_schedules_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_review_schedules_word
    FOREIGN KEY (word_id) REFERENCES words(id),
  CONSTRAINT uq_review_schedules UNIQUE (user_id, word_id)
);

CREATE TABLE study_sessions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  session_type VARCHAR(30) NOT NULL,
  study_level VARCHAR(30),
  total_questions INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  earned_xp INT NOT NULL DEFAULT 0,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT fk_study_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_study_sessions_user_started_at ON study_sessions(user_id, started_at DESC);

CREATE TABLE study_session_answers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  study_session_id BIGINT NOT NULL,
  word_id BIGINT,
  prompt_type VARCHAR(30) NOT NULL,
  prompt_text VARCHAR(2000),
  expected_answer VARCHAR(500),
  submitted_answer VARCHAR(500),
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_study_session_answers_session
    FOREIGN KEY (study_session_id) REFERENCES study_sessions(id),
  CONSTRAINT fk_study_session_answers_word
    FOREIGN KEY (word_id) REFERENCES words(id)
);

CREATE TABLE achievements (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  achievement_key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  condition_type VARCHAR(50) NOT NULL,
  condition_value INT NOT NULL
);

CREATE TABLE user_achievements (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  achievement_id BIGINT NOT NULL,
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_achievements_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_achievements_achievement
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
  CONSTRAINT uq_user_achievements UNIQUE (user_id, achievement_id)
);

CREATE TABLE community_categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 1
);

CREATE TABLE community_posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  bookmark_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_community_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_community_posts_category
    FOREIGN KEY (category_id) REFERENCES community_categories(id)
);

CREATE INDEX idx_community_posts_category_created_at ON community_posts(category_id, created_at DESC);

CREATE TABLE community_post_images (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id BIGINT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_community_post_images_post
    FOREIGN KEY (post_id) REFERENCES community_posts(id)
);

CREATE TABLE community_comments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  parent_comment_id BIGINT,
  content TEXT NOT NULL,
  like_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_community_comments_post
    FOREIGN KEY (post_id) REFERENCES community_posts(id),
  CONSTRAINT fk_community_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_community_comments_parent
    FOREIGN KEY (parent_comment_id) REFERENCES community_comments(id)
);

CREATE TABLE community_post_likes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_community_post_likes_post
    FOREIGN KEY (post_id) REFERENCES community_posts(id),
  CONSTRAINT fk_community_post_likes_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT uq_community_post_likes UNIQUE (post_id, user_id)
);

CREATE TABLE community_post_bookmarks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_community_post_bookmarks_post
    FOREIGN KEY (post_id) REFERENCES community_posts(id),
  CONSTRAINT fk_community_post_bookmarks_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT uq_community_post_bookmarks UNIQUE (post_id, user_id)
);

CREATE TABLE feedback_submissions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_submissions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);
