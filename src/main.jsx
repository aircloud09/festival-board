import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { isSupabaseConfigured } from './lib/supabase'
import './index.css'

// 환경변수가 없으면 빈 화면 대신 무엇을 해야 하는지 알려줍니다.
function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="card max-w-md">
        <h1 className="text-[17px] font-bold">환경변수 설정이 필요합니다</h1>
        <p className="mt-2 text-[15px]">
          프로젝트 루트에 <code>.env.local</code> 파일을 만들고 아래 두 값을 채운 뒤 개발 서버를
          다시 시작하세요.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-canvas p-3 text-[13px]">
          VITE_SUPABASE_URL=https://xxxxx.supabase.co{'\n'}
          VITE_SUPABASE_ANON_KEY=eyJhbGci...
        </pre>
        <p className="mt-3 text-[13px] text-ink-soft">
          자세한 순서는 README.md의 &quot;처음 세팅하는 순서&quot;를 참고하세요.
        </p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isSupabaseConfigured ? <App /> : <SetupNotice />}</React.StrictMode>
)
