-- 사용자 테이블 (Auth 없이 텔레그램 ID로 관리)
CREATE TABLE kmong_17_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  is_bot BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 메시지 로그 테이블
CREATE TABLE kmong_17_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES kmong_17_users(telegram_id),
  message_text TEXT,
  message_type TEXT, -- 'command', 'text', 'callback', 'photo', etc
  chat_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 사용자 설정 테이블 (Key-Value 저장)
CREATE TABLE kmong_17_user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES kmong_17_users(telegram_id),
  key TEXT NOT NULL,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, key)
);

-- 사용자 상태 테이블 (대화 컨텍스트 저장)
CREATE TABLE kmong_17_user_states (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES kmong_17_users(telegram_id) UNIQUE,
  current_state TEXT,
  state_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_kmong_17_users_telegram_id ON kmong_17_users(telegram_id);
CREATE INDEX idx_kmong_17_messages_user_id ON kmong_17_messages(user_id);
CREATE INDEX idx_kmong_17_messages_created_at ON kmong_17_messages(created_at);
CREATE INDEX idx_kmong_17_user_settings_user_id ON kmong_17_user_settings(user_id);

-- RLS 비활성화 (서버에서만 접근)
ALTER TABLE kmong_17_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE kmong_17_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE kmong_17_user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE kmong_17_user_states DISABLE ROW LEVEL SECURITY;