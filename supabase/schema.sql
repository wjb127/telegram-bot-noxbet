-- Telegram 로그 테이블
CREATE TABLE kmong_17_telegram_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  username TEXT,
  message TEXT,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_kmong_17_telegram_logs_user_id ON kmong_17_telegram_logs(user_id);
CREATE INDEX idx_kmong_17_telegram_logs_created_at ON kmong_17_telegram_logs(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE kmong_17_telegram_logs ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (서비스 역할만 접근 가능)
CREATE POLICY "Service role can manage all logs" ON kmong_17_telegram_logs
  FOR ALL USING (true);