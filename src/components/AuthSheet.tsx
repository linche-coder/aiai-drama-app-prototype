import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Sheet } from './Sheets';
import { api, messageOf, type Session } from '../services/api';
import { useApp } from '../state/appState';
export function AuthSheet({ open, onClose, onPolicy, initialMode = 'login' }: { open: boolean; onClose: () => void; onPolicy: (kind: string) => void; initialMode?: 'login' | 'register' | 'forgot' }) {
  const { accept } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login'), [account, setAccount] = useState(''), [password, setPassword] = useState(''), [email, setEmail] = useState(''), [agreed, setAgreed] = useState(false), [visible, setVisible] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false);
  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);
  useEffect(() => { if (!open) { setPassword(''); setError(''); setDone(false); } }, [open]);
  const title = mode === 'login' ? '登录爱爱短剧' : mode === 'register' ? '注册账号' : '找回密码';
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setError('');
    if (mode !== 'forgot' && !agreed) { setError('请先阅读并同意用户协议与隐私政策。'); return; }
    if (mode !== 'forgot' && !account.trim()) { setError('请输入账号。'); return; }
    setBusy(true);
    try {
      if (mode === 'forgot') { await api('/auth/password-reset', 'POST', { email: email.trim() }); setDone(true); }
      else {
        const s = await api<Session>(mode === 'login' ? '/auth/sign-in' : '/auth/register', 'POST', mode === 'login' ? { account: account.trim(), password, returnTo: location.hash.slice(1) || '/' } : { account: account.trim(), password, ...(email ? { email: email.trim() } : {}) });
        if (!s.subject) throw new Error('登录未完成，请重新尝试。');
        accept(s); onClose();
      }
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  function change(next: typeof mode) { setMode(next); setError(''); setDone(false); setPassword(''); }
  return <Sheet open={open} title={title} onClose={() => { if (!busy) onClose(); }}><form className="auth-form" onSubmit={submit}>
    <div className="auth-brand"><img className="auth-logo" src="/assets/brand/logo-full.svg" alt="爱爱短剧" width="1000" height="301"/><p>{mode === 'forgot' ? '通过绑定邮箱重置密码' : '登录后管理你的追剧与评论'}</p></div>
    {mode !== 'forgot' && <><label>账号<input autoComplete="username" placeholder="请输入用户名 / 手机号 / 邮箱" value={account} maxLength={80} onChange={e => setAccount(e.target.value)} required/></label><label>密码<span className="password-field"><input autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? '设置 8–64 位密码' : '请输入密码'} type={visible ? 'text' : 'password'} minLength={mode === 'register' ? 8 : 1} maxLength={64} value={password} onChange={e => setPassword(e.target.value)} required/><button type="button" aria-label={visible ? '隐藏密码' : '显示密码'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label></>}
    {mode !== 'login' && <label>{mode === 'register' ? '邮箱（用于找回密码）' : '绑定邮箱'}<input type="email" autoComplete="email" placeholder="请输入邮箱地址" value={email} maxLength={100} onChange={e => setEmail(e.target.value)} required/></label>}
    {mode !== 'forgot' && <div className="agreement"><label><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}/>我已阅读并同意</label><button type="button" onClick={() => onPolicy('terms')}>用户协议</button><span>与</span><button type="button" onClick={() => onPolicy('privacy')}>隐私政策</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {done ? <p role="status">如果该邮箱已绑定账号，你将收到重置邮件，请查看邮箱。</p> : <button className="primary-button" disabled={busy}>{busy ? '正在提交…' : mode === 'login' ? '登录' : mode === 'register' ? '注册并登录' : '发送重置邮件'}</button>}
    {import.meta.env.DEV && mode === 'login' && import.meta.env.VITE_PREVIEW_PASSWORD && <div className="preview-accounts"><small>本地样式测试</small><div>{[[import.meta.env.VITE_PREVIEW_USER, '普通'], [import.meta.env.VITE_PREVIEW_VIP, '会员']].filter(([value]) => value).map(([value, label]) => <button key={label} type="button" disabled={busy} onClick={() => { setAccount(value); setPassword(import.meta.env.VITE_PREVIEW_PASSWORD); setAgreed(true); }}>填入{label}账号</button>)}</div></div>}
    <div className="auth-links">{mode === 'login' ? <><button type="button" disabled={busy} onClick={() => change('register')}>注册新账号</button><button type="button" disabled={busy} onClick={() => change('forgot')}>忘记密码？</button></> : <button type="button" disabled={busy} onClick={() => change('login')}>返回登录</button>}</div>
  </form></Sheet>;
}


