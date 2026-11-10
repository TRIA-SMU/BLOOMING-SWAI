import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consumeOAuthCallback } from './api/auth'
import { ReportPreview } from './pages/ReportPreview'

const callback = consumeOAuthCallback(window.location.href, (url) => window.history.replaceState(null, '', url))
const previewNickname = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'nickname'
const previewReport = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'report'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {previewReport ? <ReportPreview /> : <App initialAuthError={callback.error} previewNickname={previewNickname} />}
  </StrictMode>,
)
