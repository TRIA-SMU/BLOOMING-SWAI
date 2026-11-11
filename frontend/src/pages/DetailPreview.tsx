import { useState } from 'react'
import { DetailModal } from './DetailModal'
import { experiences } from '../data/experiences'
import type { Experience } from '../types/experience'

export function DetailPreview() {
  const [open, setOpen] = useState(true)
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState('')
  const state = new URLSearchParams(window.location.search).get('state')
  const item: Experience = { ...experiences[0], authorId: 1, title: '혼자 공부하며 배운 목표 설정의 중요성', content: {
    good: state === 'empty' ? '' : state === 'long' ? '시작 전에 교재와 강의를 비교해 내 수준에 맞는 자료를 골랐다.\n\n주중에는 짧게 복습하고 주말에는 문제를 풀며 이해한 내용을 확인했다. 작은 단위로 나눈 학습 기록 덕분에 무엇을 배웠는지 돌아볼 수 있었다.' : '교재와 강의는 골라 두었다.',
    regret: state === 'empty' ? '' : state === 'long' ? '구체적인 목표 없이 시작하다 보니 공부를 미루는 날이 늘어났다. 강의를 얼마나 들었는지만 확인하고, 실제로 설명하거나 문제를 풀 수 있는지는 충분히 점검하지 않았다.' : '목표 없이 시작해 금방 흐지부지됐다.',
    learned: state === 'long' ? '목표가 있어야 공부가 이어진다. 막연히 열심히 하겠다는 다짐보다 언제까지 무엇을 해낼지 정하는 것이 도움이 됐다.\n\n다음에는 결과뿐 아니라 매주 실천할 수 있는 작은 목표도 함께 정하려고 한다.' : '목표가 있어야 공부가 이어진다.',
    next: state === 'empty' ? '' : '시험 날짜를 먼저 정하고 공부를 시작한다. 매주 일요일에는 진행 상황을 점검하고 다음 주 분량을 조정한다.',
  } }
  return <main className="page-container"><div className="api-banner">후기 본문 디자인 미리보기 · 실제 API는 사용하지 않아요.</div><button className="button button--primary" onClick={() => setOpen(true)}>상세 열기</button>{notice && <p role="status">{notice}</p>}
    {open && <DetailModal item={item} currentUserId={1} helped={false} helpfulDisabled saved={saved} onClose={() => setOpen(false)} onToggleHelpful={() => {}} onToggleSave={() => setSaved(!saved)} onWrite={() => setNotice('디자인 미리보기입니다.')} />}
  </main>
}
