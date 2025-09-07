# 텔레그램 봇 - Next.js + Vercel + Supabase

## 🚀 완전 서버리스 아키텍처
- **Vercel Edge Functions**: 서버 비용 없음
- **Supabase Free Tier**: 무료 데이터베이스
- **Webhook 방식**: 폴링 대신 웹훅 사용으로 효율적

## 📋 설정 방법

### 1. Telegram Bot 생성
1. @BotFather에서 `/newbot` 명령어로 봇 생성
2. 봇 토큰 저장

### 2. Supabase 설정
1. [Supabase](https://supabase.com) 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. API 설정에서 URL과 anon key 복사

### 3. 환경변수 설정
`.env.local` 파일 수정:
```
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정 (Vercel 대시보드에서도 가능)
vercel env add TELEGRAM_BOT_TOKEN
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 5. Webhook 설정
1. 배포 후 `/admin` 페이지 접속
2. Vercel URL 입력 (예: https://your-app.vercel.app)
3. "Webhook 설정" 클릭

## 🎯 주요 기능

- `/start` - 봇 시작
- `/help` - 도움말
- `/info` - 사용자 정보
- `/stats` - 사용 통계
- `/menu` - 인터랙티브 메뉴

## 💰 비용 절감 포인트

1. **Vercel Free Tier**
   - 월 100GB 대역폭
   - 월 100,000 함수 실행
   - 충분한 무료 사용량

2. **Supabase Free Tier**
   - 500MB 데이터베이스
   - 월 2GB 대역폭
   - 월 50,000 요청

3. **예상 비용: $0**
   - 일반적인 사용량에서는 무료
   - 대규모 사용자도 최소 비용

## 📁 프로젝트 구조
```
/app
  /api
    /telegram
      /webhook - 메시지 수신 엔드포인트
      /setup - Webhook 설정 엔드포인트
  /admin - 관리자 페이지
/lib
  telegram.ts - 텔레그램 API 유틸리티
  supabase.ts - Supabase 클라이언트
```

## 🔧 추가 개발 아이디어

- 사용자별 설정 저장
- 스케줄 메시지 기능
- 파일 업로드/다운로드
- 결제 연동 (Stripe/토스페이먼츠)
- 멀티 언어 지원
- 분석 대시보드