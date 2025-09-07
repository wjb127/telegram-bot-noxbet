# 📱 텔레그램 봇 개발 가이드

## 🎯 목차
1. [빠른 시작 (MVP)](#빠른-시작-mvp)
2. [상세 설정 과정](#상세-설정-과정)
3. [기능 확장 로드맵](#기능-확장-로드맵)
4. [트러블슈팅](#트러블슈팅)

---

## 🚀 빠른 시작 (MVP)

### 필요한 것들
- Telegram 계정
- GitHub 계정
- Vercel 계정 (GitHub 로그인)
- Supabase 계정 (GitHub 로그인)

### 15분 안에 봇 만들기

#### 1️⃣ 텔레그램 봇 생성 (2분)
```
1. 텔레그램에서 @BotFather 검색
2. /newbot 입력
3. 봇 이름 입력: "My Test Bot"
4. 봇 username 입력: "mytestbot_bot" (반드시 bot으로 끝나야 함)
5. 토큰 복사 저장
```

#### 2️⃣ 코드 복사 (1분)
```bash
# GitHub에서 코드 복사
git clone https://github.com/wjb127/telegram-bot-noxbet.git
cd telegram-bot-noxbet
```

#### 3️⃣ Supabase 설정 (5분)
```
1. https://supabase.com 접속
2. "New project" 클릭
3. 프로젝트 이름과 비밀번호 설정
4. SQL Editor 열기
5. supabase/schema-no-auth.sql 내용 복사-붙여넣기-실행
6. Settings > API에서 URL과 anon key 복사
```

#### 4️⃣ Vercel 배포 (5분)
```bash
# Vercel CLI 방법
npm install -g vercel
vercel

# 또는 웹에서
1. https://vercel.com 접속
2. "Import Git Repository"
3. 환경변수 3개 입력:
   - TELEGRAM_BOT_TOKEN
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy 클릭
```

#### 5️⃣ Webhook 연결 (2분)
```
1. 배포된 URL 확인 (예: https://mybot.vercel.app)
2. https://mybot.vercel.app/admin 접속
3. URL 입력하고 "Webhook 설정" 클릭
4. 텔레그램에서 봇 테스트
```

---

## 📋 상세 설정 과정

### 1. 텔레그램 봇 설정

#### BotFather 명령어
```
/newbot - 새 봇 생성
/mybots - 내 봇 목록
/setdescription - 봇 설명 설정
/setabouttext - 봇 정보 설정
/setuserpic - 봇 프로필 사진
/setcommands - 명령어 메뉴 설정
```

#### 명령어 메뉴 설정 예시
```
/setcommands 입력 후:
start - 봇 시작
help - 도움말
profile - 내 프로필
settings - 설정
stats - 통계
```

### 2. 환경변수 설명

#### `.env.local` 파일
```env
# 필수 설정
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234  # BotFather에서 받은 토큰
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co  # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...  # Supabase anon key

# 선택 설정
NEXT_PUBLIC_APP_URL=https://mybot.vercel.app  # 배포 후 URL
```

### 3. Supabase 테이블 구조

#### users 테이블
- `telegram_id`: 텔레그램 사용자 ID (Primary Key)
- `username`: 텔레그램 username
- `first_name`, `last_name`: 사용자 이름
- `created_at`: 가입 시간
- `last_active_at`: 마지막 활동

#### messages 테이블
- 모든 메시지 로그 저장
- 통계 분석용

#### user_settings 테이블
- Key-Value 방식으로 유연한 설정 저장
- 언어, 알림, 테마 등

### 4. 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# ngrok으로 로컬 테스트 (선택)
ngrok http 3000
# ngrok URL을 텔레그램 webhook에 설정
```

---

## 🔨 기능 확장 로드맵

### Phase 1: 기본 기능 (현재 완료)
- ✅ 메시지 수신/응답
- ✅ 사용자 자동 등록
- ✅ 기본 명령어 처리
- ✅ 인라인 키보드
- ✅ 사용자 설정 저장

### Phase 2: 중급 기능
```typescript
// 1. 멀티미디어 처리
if (message.photo) {
  // 사진 처리
  const photoId = message.photo[message.photo.length - 1].file_id
  await handlePhoto(photoId)
}

// 2. 파일 다운로드/업로드
if (message.document) {
  const fileUrl = await getFileUrl(message.document.file_id)
  // 파일 처리
}

// 3. 그룹 채팅 지원
if (message.chat.type === 'group') {
  // 그룹 전용 기능
}

// 4. 스케줄 메시지
const scheduledJobs = new Map()
scheduledJobs.set(userId, setTimeout(() => {
  sendMessage(chatId, "예약된 메시지")
}, delay))
```

### Phase 3: 고급 기능

#### 결제 연동
```typescript
// 토스페이먼츠 연동 예시
app/api/payment/route.ts:
- 결제 위젯 생성
- 결제 확인 webhook
- 구독 관리

// 텔레그램 Stars 결제
await bot.sendInvoice(chatId, {
  title: "Premium 구독",
  description: "월간 프리미엄",
  payload: "premium_monthly",
  currency: "XTR",
  prices: [{ label: "Premium", amount: 100 }]
})
```

#### AI 기능 추가
```typescript
// OpenAI API 연동
import OpenAI from 'openai'

const openai = new OpenAI()
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: text }]
})
```

#### 대시보드 페이지
```typescript
// app/dashboard/page.tsx
- 실시간 사용자 통계
- 메시지 분석
- 사용자 행동 패턴
- 수익 리포트
```

### Phase 4: 엔터프라이즈

#### 다중 봇 관리
```typescript
// 하나의 앱에서 여러 봇 운영
const bots = {
  support: process.env.SUPPORT_BOT_TOKEN,
  sales: process.env.SALES_BOT_TOKEN,
  admin: process.env.ADMIN_BOT_TOKEN
}
```

#### 웹 앱 연동
```typescript
// Telegram Mini App
const webAppUrl = `https://myapp.com/webapp?user=${userId}`
await sendMessage(chatId, "앱 열기", {
  reply_markup: {
    inline_keyboard: [[
      { text: "웹앱 열기", web_app: { url: webAppUrl }}
    ]]
  }
})
```

---

## 🐛 트러블슈팅

### 자주 발생하는 문제

#### 1. Webhook이 작동하지 않음
```bash
# Webhook 상태 확인
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo

# Webhook 재설정
curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -d "url=https://mybot.vercel.app/api/telegram/webhook"
```

#### 2. Vercel 함수 타임아웃
```json
// vercel.json
{
  "functions": {
    "app/api/telegram/webhook/route.ts": {
      "maxDuration": 10  // 최대 10초
    }
  }
}
```

#### 3. Supabase 연결 오류
```typescript
// 연결 재시도 로직
const MAX_RETRIES = 3
let retries = 0

while (retries < MAX_RETRIES) {
  try {
    const { data, error } = await supabase.from('users').select()
    if (!error) break
  } catch (e) {
    retries++
    await new Promise(r => setTimeout(r, 1000))
  }
}
```

#### 4. 메시지 중복 처리
```typescript
// 중복 방지 캐시
const processedMessages = new Set()

if (processedMessages.has(update.update_id)) {
  return // 이미 처리됨
}
processedMessages.add(update.update_id)

// 오래된 항목 정리
setTimeout(() => {
  processedMessages.delete(update.update_id)
}, 60000)
```

---

## 📚 참고 자료

### 공식 문서
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)

### 유용한 도구
- [Bot API Test](https://telegram-bot-sdk.readme.io/reference/test)
- [Webhook Tester](https://webhook.site)
- [ngrok](https://ngrok.com) - 로컬 테스트

### 커뮤니티
- [Telegram Bot Talk](https://t.me/BotTalk)
- [Next.js Discord](https://nextjs.org/discord)
- [Supabase Discord](https://discord.supabase.com)

---

## 💡 팁과 베스트 프랙티스

### 1. 보안
```typescript
// 환경변수 검증
if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('Bot token is required')
}

// Webhook 검증
const isValidUpdate = (update: any) => {
  return update.update_id && (update.message || update.callback_query)
}
```

### 2. 성능 최적화
```typescript
// 배치 처리
const messageQueue: Message[] = []
const BATCH_SIZE = 10

setInterval(async () => {
  if (messageQueue.length >= BATCH_SIZE) {
    await processBatch(messageQueue.splice(0, BATCH_SIZE))
  }
}, 1000)
```

### 3. 사용자 경험
```typescript
// 타이핑 표시
await sendChatAction(chatId, 'typing')

// 진행 상황 표시
const progressMessage = await sendMessage(chatId, "처리 중... 0%")
// 업데이트
await editMessage(chatId, progressMessage.message_id, "처리 중... 50%")
```

### 4. 에러 처리
```typescript
// 글로벌 에러 핸들러
export async function handleError(error: any, chatId?: number) {
  console.error('Bot Error:', error)
  
  if (chatId) {
    await sendMessage(chatId, "⚠️ 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
  }
  
  // 에러 로깅
  await supabase.from('error_logs').insert({
    error: error.message,
    stack: error.stack,
    timestamp: new Date()
  })
}
```

---

## 🎯 체크리스트

### MVP 런칭 전
- [ ] 봇 토큰 설정
- [ ] Supabase 테이블 생성
- [ ] 환경변수 설정
- [ ] Vercel 배포
- [ ] Webhook 연결
- [ ] 기본 명령어 테스트

### 프로덕션 준비
- [ ] 에러 로깅 구현
- [ ] 레이트 리밋 설정
- [ ] 백업 전략 수립
- [ ] 모니터링 도구 설정
- [ ] 사용자 피드백 채널
- [ ] 개인정보 처리방침