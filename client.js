/**
 * ai-company-framework — composite client bundle (web).
 *
 * 单文件 bundle（DSH client-modules 要求）：员工侧边栏（收编自
 * 权利人授权的本地侧栏包，已按 P1 收编改造）+ 飞书机器人栏（收编自
 * 权利人授权的本地飞书桥，更名 ai-company-framework-feishu）组合为一个
 * `ai-company-framework` 模块，由 dsh.client 声明发现并注入 web UI。
 *
 * 诚实状态原则：所有能力状态来自宿主路由（/ai-company/sidebar/state、
 * /ai-company/feishu/state），未授权/未安装/离线一律如实展示并给引导，
 * 绝不冒充已内置/已连接。
 */
window.__ModuleLoader__.load({
  id: 'ai-company-framework',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    const React = require('react')
    const { useState, useEffect, useRef, useCallback } = React

    const inject = ['slots', 'layout', 'sessions']

    // ══════════════════════════════════════════════════════════════════════
    // 员工侧边栏（ai-company 命名空间）
    // ══════════════════════════════════════════════════════════════════════
    const SIDEBAR_STYLE_ID = 'ai-company-sidebar-style'
    const SIDEBAR_CSS = `
      .ac-hdbtn { cursor: pointer; background: none; color: inherit; font-size: 12px;
        border: 1px solid var(--dsw-alias-border-l2, #333); border-radius: 6px; padding: 3px 8px; }
      .ac-hdbtn:hover { background: var(--dsw-alias-bg-elevated, #1f2430); }
      .ac-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden;
        background: var(--dsw-alias-bg-base, #16181d); color: var(--dsw-alias-label-primary, #e6e6e6);
        font-family: inherit; position: relative; z-index: 5; }
      .ac-panel * { box-sizing: border-box; }
      .ac-h { display: flex; align-items: center; gap: 8px; padding: 10px 12px; flex: none;
        border-bottom: 1px solid var(--dsw-alias-border-l1, #26282e); font-weight: 600; }
      .ac-close { cursor: pointer; border: 1px solid var(--dsw-alias-border-l2, #333); border-radius: 6px;
        background: none; color: inherit; font-size: 12px; padding: 3px 8px; flex: none; }
      .ac-close:hover { background: var(--dsw-alias-bg-elevated, #1f2430); }
      .ac-diag { padding: 4px 12px; font-size: 11px; color: var(--dsw-alias-label-dimmed, #9aa0a6);
        background: var(--dsw-alias-bg-subtle, #20242c); border-bottom: 1px solid var(--dsw-alias-border-l1, #26282e);
        word-break: break-all; }
      .ac-list { flex: none; max-height: 42%; overflow-y: auto; border-bottom: 1px solid var(--dsw-alias-border-l1, #26282e); }
      .ac-section-title { padding: 8px 12px 4px; font-size: 11px; text-transform: uppercase;
        color: var(--dsw-alias-label-dimmed, #9aa0a6); letter-spacing: 1px; }
      .ac-member { display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer;
        border-bottom: 1px solid var(--dsw-alias-border-l1, #26282e); }
      .ac-member:hover { background: var(--dsw-alias-bg-elevated, #1f2430); }
      .ac-member.sel { background: var(--dsw-alias-bg-elevated, #1f2430); }
      .ac-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
      .ac-dot.running { background: #2f81f7; animation: ac-pulse 1.2s infinite; }
      .ac-dot.inactive { background: #4a5568; }
      @keyframes ac-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
      .ac-name { font-size: 13px; font-weight: 600; }
      .ac-role { font-size: 11px; color: var(--dsw-alias-label-dimmed, #9aa0a6); }
      .ac-model { margin-left: auto; font-size: 10px; padding: 2px 6px; border-radius: 4px;
        background: var(--dsw-alias-bg-subtle, #26282e); color: var(--dsw-alias-label-secondary, #b7bdc6);
        max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ac-chat { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; min-height: 0; }
      .ac-bubble { max-width: 92%; padding: 7px 10px; border-radius: 10px; font-size: 12.5px; line-height: 1.55;
        word-break: break-word; white-space: pre-wrap; }
      .ac-bubble.boss { align-self: flex-start; background: var(--dsw-alias-bg-subtle, #20242c);
        border: 1px solid var(--dsw-alias-border-l1, #2a2d35); border-top-left-radius: 2px; }
      .ac-bubble.staff { align-self: flex-end; background: rgba(47,129,247,.14); border: 1px solid rgba(47,129,247,.35);
        border-top-right-radius: 2px; }
      .ac-bubble .who { display: block; font-size: 10px; margin-bottom: 2px; color: var(--dsw-alias-label-dimmed, #9aa0a6); }
      .ac-bubble .when { display: block; font-size: 10px; margin-top: 2px; color: var(--dsw-alias-label-dimmed, #6e7681); text-align: right; }
      .ac-think { margin: 4px 0; }
      .ac-think summary { cursor: pointer; font-size: 11px; color: #b7bdc6; padding: 2px 0; list-style: none; }
      .ac-think summary::-webkit-details-marker { display: none; }
      .ac-think pre { margin: 0; padding: 8px; border-radius: 6px; background: rgba(255,255,255,.04);
        border: 1px solid var(--dsw-alias-border-l1, #26282e); font-size: 11px; line-height: 1.5;
        white-space: pre-wrap; word-break: break-word; color: #8b949e; max-height: 220px; overflow-y: auto; }
      .ac-tool { max-width: 92%; width: 92%; font-size: 11.5px; align-self: flex-end; }
      .ac-tool summary { cursor: pointer; list-style: none; padding: 4px 6px; border-radius: 6px;
        background: rgba(210,153,34,.12); border: 1px solid rgba(210,153,34,.3); color: #d29922;
        display: flex; align-items: center; gap: 6px; }
      .ac-tool summary::-webkit-details-marker { display: none; }
      .ac-tool .tname { font-weight: 600; flex: none; }
      .ac-tool .targs { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #b7bdc6; font-family: ui-monospace, monospace; }
      .ac-tool .tbody { margin-top: 2px; font-family: ui-monospace, monospace; font-size: 11px; color: #8b949e;
        background: var(--dsw-alias-bg-subtle, #20242c); border: 1px solid var(--dsw-alias-border-l1, #26282e);
        border-radius: 6px; padding: 6px 8px; max-height: 240px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; }
      .ac-tool .tbody.err { color: #e57368; }
      .ac-meta { text-align: center; color: var(--dsw-alias-label-dimmed, #6e7681); font-size: 10.5px; padding: 2px 0; }
      .ac-empty { padding: 16px 12px; color: var(--dsw-alias-label-dimmed, #9aa0a6); font-size: 12px; }
      .ac-modelrow { display: flex; gap: 6px; padding: 6px 12px; flex: none;
        border-top: 1px solid var(--dsw-alias-border-l1, #26282e); }
      .ac-select { flex: 1; margin: 0; min-width: 0; padding: 6px; background: var(--dsw-alias-bg-subtle, #26282e);
        color: inherit; border: 1px solid var(--dsw-alias-border-l2, #333); border-radius: 4px; }
      .ac-btn { padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid var(--dsw-alias-border-l2, #333);
        background: var(--dsw-alias-bg-elevated, #1f2430); color: inherit; font-size: 12px; }
      .ac-btn.primary { background: #2f81f7; border-color: #2f81f7; color: #fff; }
      .ac-btn:disabled { opacity: .5; cursor: default; }
      .ac-composer { border-top: 1px solid var(--dsw-alias-border-l1, #26282e); padding: 8px 12px; flex: none; }
      .ac-composer-row { display: flex; gap: 8px; align-items: flex-end; }
      .ac-textarea { flex: 1; resize: vertical; min-height: 44px; padding: 8px;
        background: var(--dsw-alias-bg-subtle, #26282e); color: inherit;
        border: 1px solid var(--dsw-alias-border-l2, #333); border-radius: 6px;
        font-family: inherit; font-size: 12.5px; line-height: 1.5; }
      .ac-textarea:focus { outline: 1px solid #2f81f7; }
      .ac-notice { padding: 6px 12px; font-size: 12px; border-radius: 4px; margin: 4px 12px; flex: none; }
      .ac-notice.ok { background: rgba(34,160,107,.15); color: #3fb98a; }
      .ac-notice.err { background: rgba(217,45,32,.15); color: #e57368; }
      .ac-notice.warn { background: rgba(210,153,34,.12); color: #d29922; }
      .ac-hint { font-size: 10.5px; color: var(--dsw-alias-label-dimmed, #6e7681); margin-top: 4px; }
      .ac-older { align-self: center; margin-bottom: 4px; }
    `
    function installSidebarStyles() {
      if (document.getElementById(SIDEBAR_STYLE_ID)) return
      const el = document.createElement('style')
      el.id = SIDEBAR_STYLE_ID
      el.textContent = SIDEBAR_CSS
      document.head.appendChild(el)
    }

    // transport: unary RPC via fetch (no service deps)
    let rpcSeq = 0
    async function unary(method, payload) {
      const rpcId = `ac-${Date.now()}-${++rpcSeq}`
      const resp = await fetch(`/api/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'client-request', rpcId, method, payload: payload ?? {} }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const full = await resp.json()
      if (!full?.result) throw new Error('bad envelope')
      if (full.result.ok !== true) {
        const err = new Error(full.result?.error?.message ?? 'unary failed')
        err.code = full.result?.error?.code
        throw err
      }
      return full.result.value
    }
    const api = {
      subagentList: (parentSessionId) => unary('subagent.list', { parentSessionId }),
      subagentHistory: (parentSessionId, childSessionId, beforeSeq, maxMessages) =>
        unary('subagent.history', {
          parentSessionId,
          childSessionId,
          mode: 'continuable',
          ...(beforeSeq == null ? {} : { beforeSeq }),
          maxMessages: maxMessages ?? 200,
        }),
      bossPrompt: (sessionId, text) =>
        unary('session.prompt', { sessionId, mode: 'queue', content: [{ type: 'text', text }] }),
      memberPrompt: (parentSessionId, childSessionId, text) =>
        unary('subagent.prompt', { parentSessionId, childSessionId, mode: 'continuable', content: [{ type: 'text', text }] }),
    }

    function fmtTime(t) {
      if (typeof t !== 'number') return ''
      const d = new Date(t)
      const p = (n) => String(n).padStart(2, '0')
      return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    }
    function truncate(value, n) {
      const s = String(value ?? '')
      return s.length > n ? s.slice(0, n) + '…' : s
    }
    function assistantParts(message) {
      const out = { thinking: '', text: '' }
      const blocks = Array.isArray(message?.content) ? message.content : []
      for (const block of blocks) {
        if (block?.type === 'reasoning' || block?.type === 'thinking') out.thinking += String(block.text ?? '')
        else if (typeof block?.text === 'string') out.text += block.text
      }
      return out
    }
    function userText(message) {
      const blocks = Array.isArray(message?.content) ? message.content : []
      return blocks.map((b) => (typeof b?.text === 'string' ? b.text : '')).join('').trim()
    }
    function eventToRow(item) {
      const e = item?.event ?? item
      if (!e || typeof e.type !== 'string') return null
      const t = e.time
      switch (e.type) {
        case 'user/message': {
          const text = userText(e.data)
          if (!text) return null
          const src = e.data?.source?.kind
          return { seq: e.seq, kind: 'boss', text, time: t, who: src === 'user' ? '用户' : '老板' }
        }
        case 'assistant/message': {
          const parts = assistantParts(e.data?.message)
          if (!parts.thinking && !parts.text) return null
          return { seq: e.seq, kind: 'staff', text: parts.text, thinking: parts.thinking, time: t }
        }
        case 'tool/call':
          return { seq: e.seq, kind: 'tool', name: e.data?.name ?? '?', text: truncate(e.data?.arguments, 2000), time: t }
        case 'tool/result': {
          const block = e.data?.message?.content?.[0]
          const text = Array.isArray(block?.content) ? block.content.map((b) => (typeof b?.text === 'string' ? b.text : '')).join('').trim() : ''
          const isErr = block?.isError === true || e.data?.error != null
          return { seq: e.seq, kind: 'tool-result', text: truncate(text, 3000), isErr, time: t }
        }
        case 'turn/end':
          return { seq: e.seq, kind: 'meta', text: '— 轮次结束 —', time: t }
        default:
          return null
      }
    }

    // the docked right panel (occupies the details column; main area shifts left)
    function EmployeePanel({ useSessions, closeDetails }) {
      const bossId = useSessions ? useSessions((s) => (s && typeof s === 'object' ? s.current : undefined)) : undefined
      const [team, setTeam] = useState(null)
      const [caps, setCaps] = useState(null)
      const [liveChildren, setLiveChildren] = useState([])
      const [selectedId, setSelectedId] = useState(null)
      const [older, setOlder] = useState([])
      const [latest, setLatest] = useState([])
      const [hasMore, setHasMore] = useState(false)
      const [historyError, setHistoryError] = useState(null)
      const [loadingOlder, setLoadingOlder] = useState(false)
      const [provider, setProvider] = useState('')
      const [model, setModel] = useState('')
      const [notice, setNotice] = useState(null)
      const [draft, setDraft] = useState('')
      const [sending, setSending] = useState(false)
      const [visible, setVisible] = useState(true)
      const [catalog, setCatalog] = useState(null)
      const chatRef = useRef(null)
      const rootRef = useRef(null)

      // 收起员工侧边栏：可观测的宿主接口调用（缺失/抛错都在【始终可见】的诊断条显示）
      const [diag, setDiag] = useState(`closeDetails 类型: ${typeof closeDetails}`)
      const tryClose = () => {
        let out = ''
        if (typeof closeDetails !== 'function') {
          out = '收起失败：宿主未提供 closeDetails 接口（typeof=' + typeof closeDetails + '）'
        } else {
          try {
            closeDetails()
            out = '已调用 closeDetails()，无异常（若面板未关则宿主 store 未生效）'
          } catch (e) {
            out = `收起失败：${String(e?.message ?? e)}`
          }
        }
        setDiag(out)
        setNotice({ kind: out.startsWith('收起失败') ? 'err' : 'ok', text: out })
      }
      // 原生捕获阶段 click 兜底：宿主拦截 React 合成事件（冒泡）时仍能触发
      const closeBtnRef = useRef(null)
      useEffect(() => {
        const el = closeBtnRef.current
        if (el === null) return
        const onNative = (ev) => { ev.preventDefault(); ev.stopPropagation(); tryClose() }
        el.addEventListener('click', onNative, true)
        return () => el.removeEventListener('click', onNative, true)
      }, [])

      // 活动面板恢复入口：重启后 AgentTeams 活动面板默认折叠，点此按钮
      // 派发 agent-teams 的公开 open-panel 事件，重新展开团队活动栏
      const openActivityPanel = () => {
        if (team == null) {
          setNotice({ kind: 'err', text: '当前会话还没有团队，无法打开活动面板。' })
          return
        }
        const detail = {
          teamId: team.id ?? team.name,
          captainSessionId: team.captainSessionId ?? bossId ?? '',
          teamName: team.name ?? team.id,
          members: Array.isArray(team.members)
            ? team.members.map((m) => ({ id: m.id, name: m.name, role: m.role ?? '' }))
            : [],
        }
        window.dispatchEvent(new CustomEvent('agent-teams:open-panel', { detail }))
        setNotice({ kind: 'ok', text: '已请求打开活动面板（右上角）。' })
      }

      // model catalog via the live RPC (authoritative); host route copy is a fallback
      useEffect(() => {
        if (!visible) return
        let stop = false
        ;(async () => {
          try {
            const cat = await unary('llm.models', {})
            if (!stop) setCatalog(cat ?? null)
          } catch {
            if (!stop) setCatalog(null)
          }
        })()
        return () => { stop = true }
      }, [visible])

      // only poll while the details column is actually open (width > 0)
      useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === 'undefined') return
        const io = new IntersectionObserver((entries) => {
          setVisible(entries.some((entry) => entry.isIntersecting))
        }, { threshold: 0 })
        io.observe(el)
        return () => io.disconnect()
      }, [])

      // team (with model catalog from host) + live child statuses + capabilities while visible
      useEffect(() => {
        if (!visible) return
        let stop = false
        const tick = async () => {
          if (stop) return
          try {
            const q = bossId != null ? `?sessionId=${encodeURIComponent(bossId)}` : ''
            const resp = await fetch(`/ai-company/sidebar/state${q}`, { cache: 'no-store' })
            const json = await resp.json()
            if (stop) return
            setCaps(json?.capabilities ?? null)
            const teams = Array.isArray(json?.teams) ? json.teams : []
            const current = teams.find((t) => t.captainSessionId === bossId) ?? teams[0] ?? null
            setTeam(current)
          } catch { /* keep previous */ }
          if (bossId != null) {
            try {
              const list = await api.subagentList(bossId)
              if (stop) return
              setLiveChildren(Array.isArray(list?.entries) ? list.entries : [])
            } catch { /* keep previous */ }
          }
        }
        tick()
        const timer = setInterval(tick, 2000)
        return () => { stop = true; clearInterval(timer) }
      }, [visible, bossId])

      // transcript polling for the selected member
      useEffect(() => {
        if (!visible || selectedId == null || bossId == null) {
          setLatest([]); setOlder([]); setHistoryError(null); return
        }
        let stop = false
        const tick = async () => {
          try {
            const page = await api.subagentHistory(bossId, selectedId, null, 200)
            if (stop) return
            setLatest((Array.isArray(page?.events) ? page.events : []).map(eventToRow).filter(Boolean))
            setHasMore(page?.hasMore === true)
            setHistoryError(null)
          } catch (err) {
            if (!stop) setHistoryError(String(err?.message ?? err))
          }
        }
        tick()
        const timer = setInterval(tick, 1500)
        return () => { stop = true; clearInterval(timer) }
      }, [visible, selectedId, bossId])

      // keep scrolled to the newest row
      useEffect(() => {
        const el = chatRef.current
        if (el) el.scrollTop = el.scrollHeight
      }, [latest, selectedId])

      const loadOlder = async () => {
        if (bossId == null || selectedId == null || loadingOlder) return
        setLoadingOlder(true)
        try {
          const firstSeq = older.length > 0 ? older[0].seq : latest[0]?.seq
          if (firstSeq == null) { setLoadingOlder(false); return }
          const page = await api.subagentHistory(bossId, selectedId, firstSeq - 1, 200)
          const rows = (Array.isArray(page?.events) ? page.events : []).map(eventToRow).filter(Boolean)
          setOlder((prev) => [...rows, ...prev])
          setHasMore(page?.hasMore === true)
        } catch (err) {
          setHistoryError(String(err?.message ?? err))
        } finally {
          setLoadingOlder(false)
        }
      }

      const members = Array.isArray(team?.members) ? team.members : []
      const selected = members.find((m) => m.id === selectedId) ?? null
      const liveOf = (id) => liveChildren.find((c) => c.id === id)

      // when the user picks a member, sync the model selectors once (never on polls)
      const pickMember = (m) => {
        const next = m.id === selectedId ? null : m.id
        setSelectedId(next)
        if (next != null) {
          setProvider(m.provider ?? '')
          setModel(m.model ?? '')
        }
      }

      const applyModel = async () => {
        if (selected == null || provider === '' || model === '' || selected.id == null) return
        // primary: lossless re-route through the plugin's host endpoint
        try {
          const resp = await fetch('/ai-company/sidebar/reconfigure', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId: bossId, childSessionId: selected.id, provider, model }),
          })
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const json = await resp.json()
          if (json?.ok !== true) throw new Error(json?.error ?? 'reconfigure failed')
          setNotice({
            kind: 'ok',
            text: `✅ 已无损改配「${selected.name}」→ ${json.provider}/${json.model}（对话历史保留${json.live ? '，即时生效' : '，下次唤醒生效'}）。`,
          })
          return
        } catch (err) {
          setNotice({ kind: 'err', text: `无损改配失败（${String(err?.message ?? err)}）。已回退：通知老板重建该成员。` })
        }
        // fallback: boss rebuild (old path)
        if (bossId == null) return
        const instruction = [
          '【员工侧边栏 · 改配模型指令（无损接口不可用，回退重建）】',
          `请把成员「${selected.name}」改配为 provider=${provider}、model=${model}，按公司老板技能的「成员改配 SOP」执行（remove → 清墓碑 → 同名重建 → 入职通知）。`,
          '完成后用一句话汇报新成员 id 与生效路由。',
        ].join('\n')
        try {
          await api.bossPrompt(bossId, instruction)
          setNotice({ kind: 'ok', text: `已通知老板重建「${selected.name}」→ ${provider}/${model}。` })
        } catch (err2) {
          setNotice({ kind: 'err', text: `通知老板失败：${String(err2?.message ?? err2)}` })
        }
      }

      const resetModel = async () => {
        if (selected == null || selected.id == null) return
        try {
          const resp = await fetch('/ai-company/sidebar/reconfigure', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId: bossId, childSessionId: selected.id }),
          })
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const json = await resp.json()
          if (json?.reset !== true) throw new Error(json?.error ?? 'reset failed')
          setNotice({ kind: 'ok', text: `已重置「${selected.name}」为创建时路由（历史保留）。` })
        } catch (err) {
          setNotice({ kind: 'err', text: `重置失败：${String(err?.message ?? err)}` })
        }
      }

      const sendMessage = async () => {
        const text = (draft ?? '').trim()
        if (bossId == null || selectedId == null || text === '' || sending) return
        setSending(true)
        try {
          await api.memberPrompt(bossId, selectedId, text)
          setDraft('')
          setNotice(null)
        } catch (err) {
          setNotice({ kind: 'err', text: `发送失败：${String(err?.message ?? err)}` })
        } finally {
          setSending(false)
        }
      }

      const hostCatalog = team?.models
      const cat = catalog ?? hostCatalog
      const groups = Array.isArray(cat?.groups) ? cat.groups : []
      const group = groups.find((g) => g.id === provider) ?? null
      const models = Array.isArray(group?.models) ? group.models : []
      const allRows = [...older, ...latest]

      // 诚实能力探测：AgentTeams（团队活动栏）未就绪时如实提示，不影响侧边栏本身。
      const agentTeamsMissing = caps != null && caps?.agentTeams?.present !== true

      return React.createElement(
        'div',
        { className: 'ac-panel', ref: rootRef },
        React.createElement(
          'div',
          { className: 'ac-h' },
          React.createElement('button', { ref: closeBtnRef, className: 'ac-close', onClick: tryClose, title: '收起员工侧边栏（不会关闭主窗口）' }, '← 收起'),
          React.createElement('button', { className: 'ac-close ac-panelbtn', onClick: openActivityPanel, title: '重新打开右上角 AgentTeams 活动面板（重启后找回团队栏）' }, '📊 活动面板'),
          React.createElement('span', null, '🏢 员工侧边栏'),
        ),
        React.createElement('div', { className: 'ac-diag' }, diag),
        agentTeamsMissing
          ? React.createElement('div', { className: 'ac-notice warn' },
              `⚠️ 团队活动栏（AgentTeams）未就绪${caps?.agentTeams?.version ? `（已装 ${caps.agentTeams.version}）` : ''}：请确认 @nanmicoder/dsh-agent-teams 已随本插件安装；员工侧边栏功能不受影响。`)
          : null,
        React.createElement(
          'div',
          { className: 'ac-list' },
          React.createElement('div', { className: 'ac-section-title' }, '员工'),
          members.length === 0
            ? React.createElement('div', { className: 'ac-empty' }, '未发现团队。请先让老板组建团队（agent_teams_create）。')
            : members.map((m) => {
                const live = liveOf(m.id)
                const running = live?.activity === 'running' || m.status === 'running'
                return React.createElement(
                  'div',
                  {
                    key: m.id,
                    className: 'ac-member' + (m.id === selectedId ? ' sel' : ''),
                    onClick: () => pickMember(m),
                  },
                  React.createElement('span', { className: 'ac-dot ' + (running ? 'running' : 'inactive') }),
                  React.createElement('div', null,
                    React.createElement('div', { className: 'ac-name' }, m.name),
                    React.createElement('div', { className: 'ac-role' }, m.role ?? '')),
                  React.createElement('span', { className: 'ac-model' },
                    `${m.provider ?? '?'} / ${m.model ?? '?'}`),
                )
              }),
        ),
        selected
          ? React.createElement(
              React.Fragment,
              null,
              React.createElement('div', { className: 'ac-section-title' }, `会话 · ${selected.name}`),
              React.createElement(
                'div',
                { className: 'ac-chat', ref: chatRef },
                hasMore || older.length > 0
                  ? React.createElement(
                      'button',
                      { className: 'ac-btn ac-older', onClick: loadOlder, disabled: loadingOlder || !hasMore },
                      loadingOlder ? '加载中…' : '↑ 加载更早的对话',
                    )
                  : null,
                historyError
                  ? React.createElement('div', { className: 'ac-empty' }, `读取失败：${historyError}`)
                  : allRows.length === 0
                    ? React.createElement('div', { className: 'ac-empty' }, '暂无内容（员工还没开始说话）。')
                    : allRows.map((row) => {
                        if (row.kind === 'meta') {
                          return React.createElement('div', { key: `m${row.seq}`, className: 'ac-meta' }, row.text)
                        }
                        if (row.kind === 'boss' || row.kind === 'staff') {
                          return React.createElement(
                            'div',
                            { key: `b${row.seq}`, className: 'ac-bubble ' + (row.kind === 'boss' ? 'boss' : 'staff') },
                            React.createElement('span', { className: 'who' },
                              row.kind === 'boss' ? `📨 ${row.who ?? '老板'}` : `🤖 ${selected.name}`),
                            row.thinking
                              ? React.createElement('details', { className: 'ac-think', open: false },
                                  React.createElement('summary', null, '💭 思考过程'),
                                  React.createElement('pre', null, row.thinking))
                              : null,
                            row.text,
                            React.createElement('span', { className: 'when' }, fmtTime(row.time)),
                          )
                        }
                        if (row.kind === 'tool') {
                          return React.createElement(
                            'details',
                            { key: `t${row.seq}`, className: 'ac-tool' },
                            React.createElement('summary', null,
                              React.createElement('span', { className: 'tname' }, `⚙ ${row.name}`),
                              React.createElement('span', { className: 'targs' }, truncate(row.text, 80))),
                            React.createElement('div', { className: 'tbody' }, row.text),
                          )
                        }
                        return React.createElement(
                          'details',
                          { key: `r${row.seq}`, className: 'ac-tool' },
                          React.createElement('summary', null,
                            React.createElement('span', { className: 'tname' }, row.isErr ? '⚠ 结果(失败)' : '↳ 结果'),
                            React.createElement('span', { className: 'targs' }, truncate(row.text, 80))),
                          React.createElement('div', { className: 'tbody' + (row.isErr ? ' err' : '') }, row.text),
                        )
                      }),
              ),
              React.createElement(
                'div',
                { className: 'ac-modelrow' },
                React.createElement('select', {
                  className: 'ac-select',
                  value: provider,
                  onChange: (ev) => { setProvider(ev.target.value); setModel('') },
                },
                  React.createElement('option', { value: '' }, '提供方…'),
                  groups.map((g) => React.createElement('option', { key: g.id, value: g.id }, g.name ?? g.id))),
                React.createElement('select', {
                  className: 'ac-select',
                  value: model,
                  disabled: provider === '',
                  onChange: (ev) => setModel(ev.target.value),
                },
                  React.createElement('option', { value: '' }, '模型…'),
                  models.map((m) => React.createElement('option', { key: m.id, value: m.id }, m.id))),
                React.createElement('button', {
                  className: 'ac-btn',
                  disabled: provider === '' || model === '' || (provider === selected.provider && model === selected.model),
                  title: '无损改配：保留对话历史，即时生效',
                  onClick: applyModel,
                }, '应用'),
                selected.routeOverride === true
                  ? React.createElement('button', {
                      className: 'ac-btn',
                      title: '恢复为创建时的模型路由',
                      onClick: resetModel,
                    }, '重置')
                  : null,
              ),
              notice ? React.createElement('div', { className: 'ac-notice ' + notice.kind }, notice.text) : null,
              React.createElement(
                'div',
                { className: 'ac-composer' },
                React.createElement(
                  'div',
                  { className: 'ac-composer-row' },
                  React.createElement('textarea', {
                    className: 'ac-textarea',
                    rows: 2,
                    placeholder: `给 ${selected.name} 发消息…（Enter 发送，Shift+Enter 换行）`,
                    value: draft,
                    onChange: (ev) => setDraft(ev.target.value),
                    onKeyDown: (ev) => {
                      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); sendMessage() }
                    },
                  }),
                  React.createElement('button', {
                    className: 'ac-btn primary',
                    disabled: sending || (draft ?? '').trim() === '',
                    onClick: sendMessage,
                  }, sending ? '发送中…' : '发送'),
                ),
                React.createElement('div', { className: 'ac-hint' }, '消息直达该员工；改模型点上方「应用」＝无损改配（保留历史、即时生效）。'),
              ),
            )
          : React.createElement('div', { className: 'ac-empty' }, '从上方列表选择一个员工，查看其完整对话。'),
      )
    }

    // header toggle button (opens the details column; main area shifts left)
    function ToggleButton({ openDetails }) {
      return React.createElement(
        'button',
        { className: 'ac-hdbtn', title: '打开员工侧边栏（右侧面板）', onClick: () => openDetails?.() },
        '👥 员工',
      )
    }

    // ══════════════════════════════════════════════════════════════════════
    // 飞书机器人栏（ai-company-framework-feishu）
    // ══════════════════════════════════════════════════════════════════════
    const FEISHU_STYLE_ID = 'ai-company-feishu-style'
    const FEISHU_CSS = `
      .fb-wrap { display:flex; flex-direction:column; gap:14px; padding:16px 4px; max-width:880px;
        font-family: inherit; }
      .fb-card { border:1px solid var(--dsw-alias-border-l1,#26282e); border-radius:10px;
        background: var(--dsw-alias-bg-base,#16181d); padding:14px 16px; }
      .fb-card h3 { margin:0 0 10px; font-size:13px; font-weight:600; color:var(--dsw-alias-label-primary,#e6e6e6); }
      .fb-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--dsw-alias-border-l1,#26282e); }
      .fb-row:last-child { border-bottom:none; }
      .fb-dot { width:8px; height:8px; border-radius:50%; flex:none; }
      .fb-dot.on { background:#2f81f7; } .fb-dot.off { background:#4a5568; } .fb-dot.fail { background:#e5484d; }
      .fb-name { font-size:13px; font-weight:600; }
      .fb-meta { font-size:11px; color:var(--dsw-alias-label-dimmed,#9aa0a6); }
      .fb-grow { flex:1; }
      .fb-btn { cursor:pointer; font-size:12px; border:1px solid var(--dsw-alias-border-l2,#333);
        background:var(--dsw-alias-bg-elevated,#1f2430); color:inherit; border-radius:6px; padding:3px 8px; }
      .fb-btn:hover { background:var(--dsw-alias-bg-subtle,#26282e); }
      .fb-btn.danger { color:#ff8b8e; border-color:#5b2b2e; }
      .fb-input, .fb-select { width:100%; box-sizing:border-box; margin:4px 0; padding:6px 8px; font-size:12.5px;
        background:var(--dsw-alias-bg-elevated,#1f2430); color:inherit;
        border:1px solid var(--dsw-alias-border-l2,#333); border-radius:6px; }
      .fb-label { font-size:11px; color:var(--dsw-alias-label-dimmed,#9aa0a6); margin-top:6px; display:block; }
      .fb-notice { font-size:12px; margin:6px 0; padding:8px 10px; border-radius:6px; }
      .fb-notice.ok { background:rgba(47,129,247,.1); color:#7fb4ff; }
      .fb-notice.err { background:rgba(229,72,77,.1); color:#ff8b8e; }
      .fb-hint { font-size:11.5px; color:var(--dsw-alias-label-dimmed,#9aa0a6); line-height:1.6; }
      .fb-log { max-height:260px; overflow-y:auto; font-size:11.5px; line-height:1.5;
        background:var(--dsw-alias-bg-subtle,#20242c); border-radius:6px; padding:8px; }
      .fb-log .rx { color:#7fb4ff; } .fb-log .tx { color:#7ee2a8; } .fb-log .wake { color:#d6b6ff; }
      .fb-company { display:flex; align-items:center; gap:10px; }
      .fb-company .badge { font-size:11px; padding:3px 8px; border-radius:999px;
        background:rgba(47,129,247,.15); color:#7fb4ff; border:1px solid rgba(47,129,247,.4); }
    `
    function installFeishuStyles() {
      if (document.getElementById(FEISHU_STYLE_ID)) return
      const el = document.createElement('style')
      el.id = FEISHU_STYLE_ID
      el.textContent = FEISHU_CSS
      document.head.appendChild(el)
    }

    async function feishuGetState(sessionId) {
      const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''
      const r = await fetch(`/ai-company/feishu/state${q}`, { cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    }
    async function feishuPost(path, body) {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || j.ok !== true) throw new Error(j.error ?? `HTTP ${r.status}`)
      return j
    }

    function dotClass(transport) {
      if (!transport) return 'off'
      if (transport.state === 'connected') return 'on'
      if (transport.state === 'failed') return 'fail'
      return 'off'
    }

    function BotList({ state, onRefresh }) {
      const bots = Object.values(state?.registry?.bots ?? {})
      if (bots.length === 0) {
        return React.createElement('div', { className: 'fb-hint' }, '本会话公司还没有机器人。用下方「绑定已有机器人」接入。')
      }
      return React.createElement('div', null,
        bots.map((bot) => React.createElement('div', { className: 'fb-row', key: bot.id },
          React.createElement('span', { className: `fb-dot ${dotClass(bot.transport)}` }),
          React.createElement('div', { className: 'fb-grow' },
            React.createElement('div', { className: 'fb-name' }, `${bot.displayName}（${bot.kind === 'boss' ? '老板' : '员工'}）`),
            React.createElement('div', { className: 'fb-meta' },
              `appId=${bot.appId}${bot.staffMemberId ? ` · 员工=${bot.staffMemberId}` : ''} · ${bot.transport?.state ?? 'idle'}`)),
          React.createElement('button', {
            className: 'fb-btn',
            onClick: async () => { await feishuPost('/ai-company/feishu/bot/enable', { botId: bot.id, status: bot.status === 'disabled' ? 'active' : 'disabled' }); onRefresh() },
          }, bot.status === 'disabled' ? '启用' : '停用'),
          React.createElement('button', {
            className: 'fb-btn danger',
            onClick: async () => { if (confirm(`删除机器人「${bot.displayName}」？`)) { await feishuPost('/ai-company/feishu/bot/delete', { botId: bot.id }); onRefresh() } },
          }, '删除'),
        )))
    }

    function Wizard({ companyKey, members = [], onDone }) {
      const [kind, setKind] = useState('boss')
      const [appId, setAppId] = useState('')
      const [appSecret, setAppSecret] = useState('')
      const [staffMemberId, setStaffMemberId] = useState('')
      const [displayName, setDisplayName] = useState('')
      const [allowGroup, setAllowGroup] = useState(false)
      const [busy, setBusy] = useState(false)
      const [scanBusy, setScanBusy] = useState(false)
      const [scan, setScan] = useState(null)
      const [notice, setNotice] = useState(null)

      useEffect(() => {
        if (!scan?.runId || scan.status === 'connected' || scan.status === 'failed') return undefined
        let cancelled = false
        const poll = async () => {
          try {
            const r = await fetch(`/ai-company/feishu/wizard/scan?runId=${encodeURIComponent(scan.runId)}`, { cache: 'no-store' })
            const j = await r.json()
            if (cancelled || !r.ok) return
            setScan(j)
            if (j.status === 'connected') {
              setNotice({ kind: 'ok', text: '✅ 应用已创建、凭据已加密、机器人已绑定并开始建立长连接。' })
              onDone?.()
            } else if (j.status === 'failed') {
              setNotice({ kind: 'err', text: `一键创建失败：${j.error ?? '未知错误'}` })
            }
          } catch { /* next poll retries */ }
        }
        poll()
        const timer = setInterval(poll, 1500)
        return () => { cancelled = true; clearInterval(timer) }
      }, [scan?.runId, scan?.status, onDone])

      const startScan = async () => {
        if (kind === 'staff' && !staffMemberId) {
          setNotice({ kind: 'err', text: '员工机器人必须先选择绑定员工。' })
          return
        }
        setScanBusy(true); setNotice(null)
        try {
          const j = await feishuPost('/ai-company/feishu/wizard/scan', {
            kind, companyKey: companyKey || undefined,
            staffMemberId: staffMemberId || undefined,
            displayName: displayName.trim() || undefined,
            allowGroup,
          })
          setScan(j)
          setNotice({ kind: 'ok', text: '确认链接已生成：打开一次并在飞书中确认，后续配置与凭据绑定全自动。' })
        } catch (e) {
          setNotice({ kind: 'err', text: `一键创建失败：${e.message}` })
        } finally {
          setScanBusy(false)
        }
      }

      const submit = async () => {
        setBusy(true); setNotice(null)
        try {
          await feishuPost('/ai-company/feishu/wizard/existing', {
            appId: appId.trim(), appSecret: appSecret.trim(), kind,
            companyKey: companyKey || undefined,
            staffMemberId: staffMemberId || undefined,
            displayName: displayName.trim() || undefined,
          })
          setNotice({ kind: 'ok', text: '✅ 机器人已绑定，长连接已建立。' })
          setAppSecret('')
          onDone?.()
        } catch (e) {
          setNotice({ kind: 'err', text: `绑定失败：${e.message}` })
        } finally {
          setBusy(false)
        }
      }

      return React.createElement('div', { className: 'fb-card' },
        React.createElement('h3', null, `接入飞书机器人${companyKey ? `（${companyKey}）` : ''}`),
        React.createElement('div', { className: 'fb-hint' },
          '推荐：飞书官方 registerApp 一键创建。只需打开一次确认链接；机器人能力、最小权限、消息事件、WebSocket、DPAPI 凭据与公司绑定全部自动完成。'),
        React.createElement('label', { className: 'fb-label' }, '类型'),
        React.createElement('select', { className: 'fb-select', value: kind, onChange: (e) => setKind(e.target.value) },
          React.createElement('option', { value: 'boss' }, '老板机器人（绑定公司老板会话）'),
          React.createElement('option', { value: 'staff' }, '员工机器人（绑定指定子 Agent）')),
        kind === 'staff' && React.createElement('div', null,
          React.createElement('label', { className: 'fb-label' }, '绑定员工'),
          React.createElement('select', { className: 'fb-select', value: staffMemberId, onChange: (e) => setStaffMemberId(e.target.value) },
            React.createElement('option', { value: '' }, '请选择员工'),
            members.map((member) => React.createElement('option', { key: member.id, value: member.id }, `${member.name}${member.role ? ` · ${member.role}` : ''}`)))),
        React.createElement('label', { className: 'fb-label' }, '显示名（可选）'),
        React.createElement('input', { className: 'fb-input', value: displayName, onChange: (e) => setDisplayName(e.target.value), placeholder: '公司名 · 客服助手' }),
        React.createElement('label', { className: 'fb-label' },
          React.createElement('input', { type: 'checkbox', checked: allowGroup, onChange: (e) => setAllowGroup(e.target.checked) }),
          ' 同时申请群聊 @机器人权限'),
        React.createElement('button', { className: 'fb-btn', disabled: scanBusy || !companyKey, onClick: startScan }, scanBusy ? '生成确认链接中…' : '扫码一键创建并绑定'),
        scan?.url && React.createElement('a', { className: 'fb-btn', href: scan.url, target: '_blank', rel: 'noopener noreferrer', style: { display: 'inline-block', marginLeft: 8 } }, '打开飞书确认链接'),
        scan?.status && React.createElement('div', { className: 'fb-meta', style: { marginTop: 6 } }, `状态：${scan.status}`),
        notice && React.createElement('div', { className: `fb-notice ${notice.kind}` }, notice.text),
        React.createElement('div', { className: 'fb-hint', style: { marginTop: 14 } },
          '已有应用备用通道：填 App ID / App Secret 直接绑定；Secret 仅经 Windows DPAPI 加密保存在本机。'),
        React.createElement('label', { className: 'fb-label' }, 'App ID'),
        React.createElement('input', { className: 'fb-input', value: appId, onChange: (e) => setAppId(e.target.value), placeholder: 'cli_xxxxxxxx' }),
        React.createElement('label', { className: 'fb-label' }, 'App Secret'),
        React.createElement('input', { className: 'fb-input', type: 'password', value: appSecret, onChange: (e) => setAppSecret(e.target.value), placeholder: '仅存本机，加密保存' }),
        React.createElement('button', { className: 'fb-btn', disabled: busy, onClick: submit }, busy ? '校验中…' : '绑定已有机器人'),
      )
    }

    function CompanyCard({ state }) {
      const key = state?.sessionCompanyKey ?? null
      const team = (state?.teams ?? []).find((t) => t.id === key)
      return React.createElement('div', { className: 'fb-card' },
        React.createElement('h3', null, '本会话 · 本公司'),
        key
          ? React.createElement('div', { className: 'fb-company' },
              React.createElement('span', { className: 'badge' }, key),
              React.createElement('div', { className: 'fb-grow' },
                React.createElement('div', { className: 'fb-name' }, team?.name ?? key),
                React.createElement('div', { className: 'fb-meta' },
                  `老板会话=${team?.captainSessionId ?? '?'} · 成员=${team?.memberCount ?? 0}`)))
          : React.createElement('div', { className: 'fb-hint' },
              '本会话还没有关联公司（团队）。先用 agent_teams_create 建团队，这里就会变成该公司的专属机器人管理。'),
      )
    }

    function GroupBind({ state, onRefresh }) {
      const bots = Object.values(state?.registry?.bots ?? {})
      const [botId, setBotId] = useState('')
      const [chatId, setChatId] = useState('')
      const [targetKind, setTargetKind] = useState('boss')
      const [staffMemberId, setStaffMemberId] = useState('')
      const [notice, setNotice] = useState(null)
      const companyKey = state?.sessionCompanyKey ?? undefined
      const submit = async () => {
        try {
          await feishuPost('/ai-company/feishu/group/bind', {
            chatId, botId,
            target: { kind: targetKind, companyKey, staffMemberId: targetKind === 'staff' ? staffMemberId || null : null },
          })
          setNotice({ kind: 'ok', text: '✅ 群已绑定。' }); onRefresh()
        } catch (e) { setNotice({ kind: 'err', text: e.message }) }
      }
      return React.createElement('div', { className: 'fb-card' },
        React.createElement('h3', null, '群聊绑定'),
        React.createElement('div', { className: 'fb-hint' }, '把某个群（chat_id）绑定到本公司机器人 → 目标（老板或员工）。群内 @机器人 才触发。'),
        React.createElement('label', { className: 'fb-label' }, '机器人'),
        React.createElement('select', { className: 'fb-select', value: botId, onChange: (e) => setBotId(e.target.value) },
          React.createElement('option', { value: '' }, '选择机器人…'),
          bots.map((b) => React.createElement('option', { key: b.id, value: b.id }, `${b.displayName}（${b.id}）`))),
        React.createElement('label', { className: 'fb-label' }, '群 chat_id'),
        React.createElement('input', { className: 'fb-input', value: chatId, onChange: (e) => setChatId(e.target.value), placeholder: 'oc_xxx' }),
        React.createElement('label', { className: 'fb-label' }, '目标类型'),
        React.createElement('select', { className: 'fb-select', value: targetKind, onChange: (e) => setTargetKind(e.target.value) },
          React.createElement('option', { value: 'boss' }, '老板'),
          React.createElement('option', { value: 'staff' }, '员工')),
        targetKind === 'staff' && React.createElement('input', { className: 'fb-input', value: staffMemberId, onChange: (e) => setStaffMemberId(e.target.value), placeholder: '员工会话 id' }),
        notice && React.createElement('div', { className: `fb-notice ${notice.kind}` }, notice.text),
        React.createElement('button', { className: 'fb-btn', onClick: submit }, '绑定群'),
      )
    }

    function LogViewer({ companyKey }) {
      const [chatId, setChatId] = useState('')
      const [lines, setLines] = useState([])
      const load = useCallback(async () => {
        if (!companyKey || !chatId) return
        try {
          const j = await (await fetch(`/ai-company/feishu/logs?company=${encodeURIComponent(companyKey)}&chatId=${encodeURIComponent(chatId)}&limit=200`, { cache: 'no-store' })).json()
          setLines(j?.lines ?? [])
        } catch { /* ignore */ }
      }, [companyKey, chatId])
      useEffect(() => { load() }, [load])
      return React.createElement('div', { className: 'fb-card' },
        React.createElement('h3', null, '会话留痕'),
        React.createElement('div', { className: 'fb-hint' }, `公司 ${companyKey ?? '（未绑定）'} · 输入 chat_id / open_id 查看双向对话日志（飞书 ↔ 员工/老板）。`),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement('input', { className: 'fb-input', value: chatId, onChange: (e) => setChatId(e.target.value), placeholder: 'chat_id / open_id' }),
          React.createElement('button', { className: 'fb-btn', onClick: load }, '查询')),
        React.createElement('div', { className: 'fb-log' },
          lines.length === 0
            ? React.createElement('div', { className: 'fb-hint' }, '（无记录）')
            : lines.map((l, i) => React.createElement('div', { key: i, className: l.t },
              `[${new Date(l.ts).toLocaleTimeString()}] ${l.t === 'rx' ? '客户 → 机器人' : l.t === 'tx' ? '机器人 → 客户' : '唤醒'}${l.text ? `：${String(l.text).slice(0, 200)}` : ''}`))),
      )
    }

    function FeishuCenter({ useSessions, onDone }) {
      const bossId = useSessions ? useSessions((s) => (s && typeof s === 'object' ? s.current : undefined)) : undefined
      const [state, setState] = useState(null)
      const [err, setErr] = useState(null)
      const refresh = useCallback(async () => {
        try { setState(await feishuGetState(bossId)) } catch (e) { setErr(String(e?.message ?? e)) }
      }, [bossId])
      useEffect(() => { refresh() }, [refresh])
      if (err) return React.createElement('div', { className: 'fb-wrap' }, React.createElement('div', { className: 'fb-notice err' }, `加载失败：${err}`))
      const companyKey = state?.sessionCompanyKey ?? undefined
      return React.createElement('div', { className: 'fb-wrap' },
        CompanyCard({ state }),
        React.createElement('div', { className: 'fb-card' },
          React.createElement('h3', null, `机器人（${Object.keys(state?.registry?.bots ?? {}).length} 个）`),
          React.createElement('div', { className: 'fb-hint' }, `收到 ${state?.counters?.received ?? 0} / 发出 ${state?.counters?.sent ?? 0} / 暂存 ${state?.counters?.queued ?? 0}`)),
        React.createElement('div', { className: 'fb-card' }, BotList({ state, onRefresh: refresh })),
        Wizard({ companyKey, members: state?.teams?.[0]?.members ?? [], onDone: refresh }),
        GroupBind({ state, onRefresh: refresh }),
        LogViewer({ companyKey }),
      )
    }

    // ── apply：组合注入员工侧栏 + 飞书栏 ───────────────────────────────────
    function apply(ctx) {
      installSidebarStyles()
      installFeishuStyles()
      const sessions = ctx.get('sessions')
      const useSessions = sessions !== void 0 && typeof sessions.list?.getSnapshot === 'function' && typeof sessions.list?.subscribe === 'function'
        ? (selector) => React.useSyncExternalStore(
            (cb) => sessions.list.subscribe(cb),
            () => selector(sessions.list.getSnapshot()),
          )
        : undefined
      // the docked panel lives in the layout's `details` column
      ctx.slots.inject('details', () =>
        ctx.slots.register(
          {
            name: 'details',
            id: 'ac-employee-panel',
            priority: -1,
            inject: () => ({ useSessions, closeDetails: () => ctx.layout.closeDetails() }),
          },
          EmployeePanel,
        ),
      )
      // the open toggle lives beside the subagent-catalog button in the session header
      ctx.slots.inject('conversation.session.header.actions', () =>
        ctx.slots.register(
          {
            name: 'conversation.session.header.actions',
            id: 'ac-employee-panel-toggle',
            order: 20,
            inject: () => ({ openDetails: () => ctx.layout.openDetails() }),
          },
          ToggleButton,
        ),
      )
      // feishu bar lives in the settings section
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'ai-company-feishu-center',
            order: 50,
            label: () => '飞书机器人',
            inject: () => ({ useSessions }),
          },
          FeishuCenter,
        ),
      )
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
