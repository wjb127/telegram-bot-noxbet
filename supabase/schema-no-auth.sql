-- 사용자 테이블 (Auth 없이 텔레그램 ID로 관리)
CREATE TABLE users (
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
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(telegram_id),
  message_text TEXT,
  message_type TEXT, -- 'command', 'text', 'callback', 'photo', etc
  chat_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 사용자 설정 테이블 (Key-Value 저장)
CREATE TABLE user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(telegram_id),
  key TEXT NOT NULL,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, key)
);

-- 사용자 상태 테이블 (대화 컨텍스트 저장)
CREATE TABLE user_states (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(telegram_id) UNIQUE,
  current_state TEXT,
  state_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- RLS 비활성화 (서버에서만 접근)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_states DISABLE ROW LEVEL SECURITY;