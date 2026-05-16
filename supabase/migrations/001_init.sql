-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (metadata about each athlete)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '💪',
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User settings (preferences, physical data, etc.)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  athlete_name TEXT,
  sex TEXT DEFAULT 'prefer-not-to-say',
  load_unit TEXT DEFAULT 'kg',
  current_weight_kg NUMERIC,
  target_weight_kg NUMERIC,
  bench_one_rep_max_kg NUMERIC,
  age INTEGER,
  height_cm INTEGER,
  gym TEXT,
  main_goal TEXT,
  cardio_level TEXT,
  sleep_quality TEXT,
  recovery_profile TEXT DEFAULT 'irregular',
  medical_notes TEXT,
  watch_points TEXT[], -- JSON array
  preferences JSONB,
  avoid TEXT[],
  available_days TEXT[] DEFAULT '{monday,tuesday,wednesday,thursday,friday,saturday,sunday}'::text[],
  external_sports JSONB,
  constraints JSONB,
  strength_references JSONB,
  load_bias_by_pattern JSONB,
  exercise_swap_preferences JSONB,
  set_bias_by_pattern JSONB,
  rep_bias_by_pattern JSONB,
  rest_bias_by_pattern JSONB,
  calibration_events JSONB,
  session_duration_preference TEXT DEFAULT 'standard',
  ai_enabled BOOLEAN DEFAULT false,
  dark_mode BOOLEAN DEFAULT true,
  caution_level TEXT DEFAULT 'normal',
  experience_level TEXT,
  primary_goal TEXT,
  equipment TEXT,
  weekly_frequency INTEGER,
  judo_days TEXT[],
  complementary_programs JSONB,
  schema_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Planned sessions (weekly program)
CREATE TABLE planned_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  focus TEXT,
  weekday TEXT NOT NULL,
  exercises JSONB NOT NULL, -- Array of exercises
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Completed sessions (history)
CREATE TABLE completed_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_id TEXT UNIQUE NOT NULL,
  date_key TEXT NOT NULL,
  session_id TEXT NOT NULL,
  title TEXT,
  focus TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  logs JSONB NOT NULL, -- exerciseId -> ExerciseLog
  feedback JSONB, -- SessionFeedback
  timer JSONB, -- Timer info
  timing JSONB, -- Timing info
  progressions JSONB, -- exerciseId -> ExerciseProgressionLog
  main_exercises TEXT[],
  next_session_title TEXT,
  next_session_date_key TEXT,
  total_duration_ms INTEGER,
  exercise_durations_ms JSONB,
  adaptation_explanations JSONB,
  ai_coach JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Active sessions (current in-progress session, optional, can use session storage instead)
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  data JSONB NOT NULL, -- Full ActiveSession object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Row Level Security (RLS) - Users can only see their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for planned_sessions
CREATE POLICY "Users can view their own sessions"
  ON planned_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON planned_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON planned_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON planned_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for completed_sessions
CREATE POLICY "Users can view their own history"
  ON completed_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON completed_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON completed_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for active_sessions
CREATE POLICY "Users can view their own active session"
  ON active_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active session"
  ON active_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active session"
  ON active_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active session"
  ON active_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_planned_sessions_user_id ON planned_sessions(user_id);
CREATE INDEX idx_completed_sessions_user_id ON completed_sessions(user_id);
CREATE INDEX idx_completed_sessions_date_key ON completed_sessions(user_id, date_key);
CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
