import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consumeOAuthCallback } from './api/auth'

const callback = consumeOAuthCallback(window.location.href, (url) => window.history.replaceState(null, '', url))
const previewNickname = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'nickname'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialAuthError={callback.error} previewNickname={previewNickname} />
  </StrictMode>,
)
