#!/bin/bash
# WAVE 앱 배치 크롤링 시스템 자동 시작 스크립트

echo "🌟 WAVE 앱 배치 크롤링 시스템 시작"

# 작업 디렉토리로 이동
cd "$(dirname "$0")"

# 로그 디렉토리 생성
mkdir -p logs

# 환경 변수 파일 확인
if [ ! -f ".env" ]; then
    echo "❌ .env 파일이 없습니다. 환경 변수를 설정해주세요."
    echo "다음 내용을 .env 파일에 추가하세요:"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co"
    echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo "YT_API_KEY=your-youtube-api-key"
    exit 1
fi

# Python 가상환경 확인 및 활성화
if [ -d "venv" ]; then
    echo "✅ 가상환경 발견, 활성화합니다..."
    source venv/bin/activate
fi

# 의존성 설치 확인
echo "📦 의존성 확인 중..."
python3 -c "import schedule, supabase, selenium, requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  필요한 패키지가 설치되지 않았습니다. 설치합니다..."
    pip install -r requirements.txt
fi

# 프로세스 실행
echo "🚀 배치 프로세서 시작..."
echo "💡 2시간마다 YouTube 플레이리스트를 자동으로 크롤링합니다."
echo "💡 중단하려면 Ctrl+C를 누르세요."
echo ""

# 백그라운드에서 실행
nohup python3 batch_processor.py > logs/batch_processor.log 2>&1 &
PROCESS_ID=$!

echo "✅ 배치 프로세서가 백그라운드에서 실행 중입니다. (PID: $PROCESS_ID)"
echo "📋 로그 파일: logs/batch_processor.log"
echo "🔍 실시간 로그 확인: tail -f logs/batch_processor.log"
echo ""
echo "🎵 WAVE 앱 배치 크롤링 시스템이 성공적으로 시작되었습니다!"
