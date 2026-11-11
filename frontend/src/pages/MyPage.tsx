import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, CheckSquare, CircleDot, Flower2, Heart, Pencil, Trash2, UserRound } from 'lucide-react'
import { mypageApi, postToDraft } from '../api/mypage'
import type { MyPageApi, MyPageResponse, MyPost } from '../api/mypage'
import { errorMessage } from '../api/client'
import { challengeLabels, resultLabels } from '../data/writeOptions'
import { ResultBadge } from '../components/ResultBadge'
import { BoardGrowthIcon } from '../components/BoardGrowthIcon'
import { WriteModal } from './WriteModal'
import type { ExperienceDraft } from '../utils/experienceDraft'
import './MyPage.css'

const growthLabels = { SEED: '씨앗', SPROUT: '싹', BUD: '봉우리', FLOWER: '꽃' } as const

function DeletePostDialog({ post, onClose, onConfirm }: { post: MyPost; onClose: () => void; onConfirm: () => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const dialog = dialogRef.current
    const focus = document.activeElement
    const overflow = document.body.style.overflow
    dialog?.showModal(); document.body.style.overflow = 'hidden'
    return () => { dialog?.close(); document.body.style.overflow = overflow; if (focus instanceof HTMLElement) focus.focus() }
  }, [])
  const remove = async () => {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try { await onConfirm() }
    catch (err) { setError(errorMessage(err)) }
    finally { lock.current = false; setBusy(false) }
  }
  return <dialog className="delete-post-dialog" ref={dialogRef} aria-labelledby="delete-post-title" onCancel={(event) => { event.preventDefault(); if (!lock.current) onClose() }}>
    <h2 id="delete-post-title">이 경험을 삭제할까요?</h2><p className="delete-post-name">{post.title}</p><p>삭제한 글은 복구할 수 없고, 글에 달린 반응과 신고도 함께 삭제돼요.</p>
    {error && <p className="form-alert" role="alert">{error}</p>}
    <div><button className="button button--secondary" disabled={busy} onClick={onClose} autoFocus>취소</button><button className="button button--primary" disabled={busy} onClick={() => void remove()}>{busy ? '삭제 중…' : '삭제하기'}</button></div>
  </dialog>
}

export function MyPage({ authenticated, userId, nickname, refreshKey, onLogin, onNickname, onDetail, onWrite, onChecklist, onChanged, api = mypageApi }: {
  authenticated: boolean; userId?: number; nickname?: string; refreshKey: number
  onLogin: () => void; onNickname: () => void; onDetail: (id: number) => void; onWrite: () => void
  onChecklist: () => void; onChanged: () => void; api?: MyPageApi
}) {
  const [data, setData] = useState<MyPageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all')
  const [notice, setNotice] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editRetry, setEditRetry] = useState(0)
  const [editing, setEditing] = useState<{ id: number; draft: ExperienceDraft } | null>(null)
  const [deleting, setDeleting] = useState<MyPost | null>(null)
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (!authenticated) return
    const controller = new AbortController()
    api.get(controller.signal).then((result) => { if (!controller.signal.aborted) { setData(result); setError('') } })
      .catch((err: unknown) => { if (!controller.signal.aborted) setError(errorMessage(err)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [authenticated, api, refreshKey, retry])
  useEffect(() => {
    if (editId == null) return
    const controller = new AbortController()
    api.detail(editId, controller.signal).then((post) => {
      if (controller.signal.aborted) return
      if (post.authorId !== userId) throw new Error('내가 작성한 글만 수정할 수 있어요.')
      setEditing({ id: post.id, draft: postToDraft(post) })
    }).catch((err: unknown) => { if (!controller.signal.aborted) setEditError(errorMessage(err)) })
      .finally(() => { if (!controller.signal.aborted) setEditLoading(false) })
    return () => controller.abort()
  }, [editId, editRetry, api, userId])
  const closeEdit = () => { setEditId(null); setEditing(null); setEditLoading(false); setEditError('') }
  const saveEdit = async (draft: ExperienceDraft) => {
    if (!editing) return
    const post = await api.update(editing.id, draft)
    if (!mounted.current) return
    setData((previous) => previous ? { ...previous, posts: previous.posts.map((item) => item.id === post.id ? { ...item, ...post } : item) } : previous)
    closeEdit(); setNotice('경험을 수정했어요. 결과를 바꿨다면 해당 게시판으로 옮겨졌어요.'); onChanged()
  }
  const remove = async () => {
    if (!deleting) return
    await api.remove(deleting.id)
    if (!mounted.current) return
    setData((previous) => previous ? { ...previous, helpedCount: Math.max(0, previous.helpedCount - deleting.helpfulCount), posts: previous.posts.filter((post) => post.id !== deleting.id) } : previous)
    setDeleting(null); setNotice('경험을 삭제했어요.'); onChanged()
  }
  const posts = data?.posts ?? []
  const successCount = posts.filter((post) => post.resultType === 'SUCCESS').length
  const visible = posts.filter((post) => filter === 'all' || (filter === 'success' ? post.resultType === 'SUCCESS' : post.resultType !== 'SUCCESS'))

  return <main id="main-content" className="mypage">
    {!authenticated ? <section className="my-page-guide"><UserRound size={28} /><h1>나의 경험을 이어서 확인해요</h1><p>로그인하면 내가 쓴 글과 받은 반응을 볼 수 있어요.</p><button className="button button--primary" onClick={onLogin}>로그인하고 확인하기</button></section>
      : loading ? <section className="my-page-guide" role="status"><h1>내 경험을 불러오고 있어요</h1></section> : <>
      {error && <div className="api-banner" role="alert"><span>{error}</span><button onClick={() => { setError(''); if (!data) setLoading(true); setRetry((value) => value + 1) }}>다시 시도</button></div>}
      {data && <>
        <section className="profile-card"><div className="profile-main"><span className="profile-avatar"><UserRound size={28} /></span><div><h1>{nickname ?? data.nickname}</h1><p>내 경험이 받은 도움이 돼요 <strong>{data.helpedCount}개</strong></p></div></div><button className="button button--secondary profile-edit" onClick={onNickname}><Pencil size={15} />닉네임 변경</button></section>
        <section className="my-summary" aria-label="나의 경험 요약"><div><span>전체 경험</span><strong>{posts.length}</strong></div><div><Flower2 size={17} /><span>성공 경험</span><strong>{successCount}</strong></div><div><CircleDot size={17} /><span>실패·중단 경험</span><strong>{posts.length - successCount}</strong></div><div><Heart size={17} /><span>받은 도움</span><strong>{data.helpedCount}</strong></div></section>
        <section className="records-manager" aria-label="내 경험 관리"><div className="record-tabs"><h2>내 경험 <span>{posts.length}</span></h2><button className="button button--secondary" onClick={onWrite}>경험 기록하기</button></div>
          <div className="record-toolbar"><div role="group" aria-label="내 경험 결과 필터">{(['all', 'success', 'failure'] as const).map((value) => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? '전체' : value === 'success' ? '성공' : '실패·중단'}</button>)}</div><span><ArrowUpDown size={13} />최신순</span></div>
          {visible.length ? <div className="managed-list">{visible.map((post) => <article className="managed-record" key={post.id}>
            <button className="managed-record-main" onClick={() => onDetail(post.id)}><ResultBadge result={resultLabels[post.resultType]} /><div><h3>{post.title}</h3><p>{challengeLabels[post.challengeType]} · {post.createdAt.slice(0, 10).replaceAll('-', '. ')}</p>{post.status === 'HIDDEN' && <span className="review-status">검토 중 · 작성자에게만 보여요</span>}</div></button>
            <div className="managed-growth"><BoardGrowthIcon stage={growthLabels[post.growthStage]} /><span>{growthLabels[post.growthStage]}</span><small>도움이 돼요 {post.helpfulCount}</small></div>
            <div className="managed-actions"><button aria-label={`${post.title} 수정`} disabled={editLoading} onClick={() => { setEditId(post.id); setEditLoading(true); setEditError(''); setEditRetry((value) => value + 1) }}><Pencil size={16} /></button><button aria-label={`${post.title} 삭제`} disabled={editLoading} onClick={() => setDeleting(post)}><Trash2 size={16} /></button></div>
          </article>)}</div> : <div className="my-empty"><p>{posts.length ? '이 조건에 해당하는 경험이 아직 없어요.' : '아직 남긴 경험이 없어요. 첫 경험을 기록해 보세요.'}</p><button className="button button--secondary" onClick={onWrite}>경험 기록하기</button></div>}
        </section>
        <button className="my-checklist-link" onClick={onChecklist}><CheckSquare size={18} /><span>내 준비 체크리스트</span><span>확인하기 →</span></button>
      </>}
      {(editLoading || editError) && <div className="api-banner" role={editError ? 'alert' : 'status'}><span>{editLoading ? '수정할 경험을 불러오고 있어요.' : editError}</span>{editError && <button onClick={() => { setEditLoading(true); setEditError(''); setEditRetry((value) => value + 1) }}>다시 시도</button>}<button onClick={closeEdit}>닫기</button></div>}
      {editing && <WriteModal key={editing.id} mode="edit" draft={editing.draft} onChange={(draft) => setEditing({ ...editing, draft })} onClose={closeEdit} onComplete={saveEdit} />}
      {deleting && <DeletePostDialog post={deleting} onClose={() => setDeleting(null)} onConfirm={remove} />}
    </>}
    {notice && <div className="api-banner mypage-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')}>닫기</button></div>}
  </main>
}
