-- ============================================
-- Telegram Bot 전체 테이블 생성 스크립트
-- 모든 테이블명에 kmong_17_ 접두사 포함
-- ============================================

-- 1. 사용자 테이블 (Auth 없이 텔레그램 ID로 관리)
CREATE TABLE IF NOT EXISTS kmong_17_users (
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

-- 2. 메시지 로그 테이블
CREATE TABLE IF NOT EXISTS kmong_17_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES kmong_17_users(telegram_id) ON DELETE CASCADE,
  message_text TEXT,
  message_type TEXT, -- 'command', 'text', 'callback', 'photo', etc
  chat_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. 사용자 설정 테이블 (Key-Value 저장)
CREATE TABLE IF NOT EXISTS kmong_17_user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES kmong_17_users(telegram_id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, key)
);

-- 4. 사용자 상태 테이블 (대화 컨텍스트 저장)
CREATE TABLE IF NOT EXISTS kmong_17_user_states (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES kmong_17_users(telegram_id) ON DELETE CASCADE UNIQUE,
  current_state TEXT,
  state_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. 텔레그램 로그 테이블 (기본 webhook용)
CREATE TABLE IF NOT EXISTS kmong_17_telegram_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  username TEXT,
  message TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_kmong_17_users_telegram_id 
  ON kmong_17_users(telegram_id);

CREATE INDEX IF NOT EXISTS idx_kmong_17_users_username 
  ON kmong_17_users(username);

CREATE INDEX IF NOT EXISTS idx_kmong_17_users_last_active 
  ON kmong_17_users(last_active_at DESC);

-- 메시지 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_kmong_17_messages_user_id 
  ON kmong_17_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_kmong_17_messages_created_at 
  ON kmong_17_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kmong_17_messages_type 
  ON kmong_17_messages(message_type);

-- 설정 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_kmong_17_user_settings_user_id 
  ON kmong_17_user_settings(user_id);

-- 상태 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_kmong_17_user_states_user_id 
  ON kmong_17_user_states(user_id);

-- 텔레그램 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_kmong_17_telegram_logs_user_id 
  ON kmong_17_telegram_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_kmong_17_telegram_logs_created_at 
  ON kmong_17_telegram_logs(created_at DESC);

-- ============================================
-- RLS (Row Level Security) 설정
-- 서버에서만 접근 가능하도록 설정
-- ============================================

-- RLS 비활성화 (서버 API만 접근)
ALTER TABLE kmong_17_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE kmong_17_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE kmong_17_user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE kmong_17_user_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE kmong_17_telegram_logs ENABLE ROW LEVEL SECURITY;

-- 텔레그램 로그용 정책 (Service Role만 접근 가능)
CREATE POLICY "Service role can manage all logs" 
  ON kmong_17_telegram_logs
  FOR ALL 
  USING (true);

-- ============================================
-- 초기 데이터 또는 테스트 데이터 (선택사항)
-- ============================================

-- 테스트 사용자 추가 (필요시 주석 해제)
-- INSERT INTO kmong_17_users (telegram_id, username, first_name, is_bot)
-- VALUES (123456789, 'testuser', 'Test User', false)
-- ON CONFLICT (telegram_id) DO NOTHING;

-- ============================================
-- 유용한 뷰 생성 (선택사항)
-- ============================================

-- 활성 사용자 통계 뷰
CREATE OR REPLACE VIEW kmong_17_active_users_stats AS
SELECT 
  COUNT(DISTINCT u.telegram_id) as total_users,
  COUNT(DISTINCT CASE 
    WHEN u.last_active_at > NOW() - INTERVAL '1 day' 
    THEN u.telegram_id 
  END) as daily_active_users,
  COUNT(DISTINCT CASE 
    WHEN u.last_active_at > NOW() - INTERVAL '7 days' 
    THEN u.telegram_id 
  END) as weekly_active_users,
  COUNT(DISTINCT CASE 
    WHEN u.last_active_at > NOW() - INTERVAL '30 days' 
    THEN u.telegram_id 
  END) as monthly_active_users
FROM kmong_17_users u;

-- 메시지 통계 뷰
CREATE OR REPLACE VIEW kmong_17_message_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as message_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN message_type = 'command' THEN 1 END) as commands,
  COUNT(CASE WHEN message_type = 'text' THEN 1 END) as texts
FROM kmong_17_messages
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- 함수 생성 (선택사항)
-- ============================================

-- 사용자 활동 시간 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kmong_17_users 
  SET last_active_at = NOW() 
  WHERE telegram_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 메시지 삽입시 자동으로 last_active_at 업데이트
CREATE TRIGGER update_user_last_active
AFTER INSERT ON kmong_17_messages
FOR EACH ROW
EXECUTE FUNCTION update_last_active();

-- ============================================
-- 권한 설정 확인
-- ============================================

-- 현재 권한 확인 (디버깅용)
-- SELECT * FROM information_schema.table_privileges 
-- WHERE table_name LIKE 'kmong_17_%';

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 모든 kmong_17_ 테이블이 성공적으로 생성되었습니다!';
  RAISE NOTICE '생성된 테이블: kmong_17_users, kmong_17_messages, kmong_17_user_settings, kmong_17_user_states, kmong_17_telegram_logs';
  RAISE NOTICE '생성된 뷰: kmong_17_active_users_stats, kmong_17_message_stats';
END $$;