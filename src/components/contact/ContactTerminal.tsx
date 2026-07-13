import { useEffect, useMemo, useRef, useState } from 'react';

type Locale = 'ja' | 'en' | 'ko';
type Phase = 'input' | 'confirm' | 'sending' | 'success' | 'error';
type Category = 'project' | 'community' | 'media' | 'other';

type FormState = {
  name: string;
  email: string;
  category: Category;
  subject: string;
  message: string;
  website: string;
};

type Config = {
  ready: boolean;
  turnstileSiteKey: string | null;
  recipient: string;
  discordEnabled: boolean;
};

declare global {
  interface Window {
    turnstile?: {
      render: (target: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const initialState: FormState = {
  name: '',
  email: '',
  category: 'project',
  subject: '',
  message: '',
  website: '',
};

const copy = {
  ja: {
    title: 'CONTACT TERMINAL',
    intro: '開発・制作、ivRm、配信・メディア、その他のご相談を受け付けています。',
    name: 'お名前', email: 'メールアドレス', category: 'お問い合わせ種別', subject: '件名', message: 'お問い合わせ内容',
    project: '開発・制作の相談', community: 'ivRm・コミュニティ', media: '配信・メディア', other: 'その他',
    confirm: '送信内容を確認', edit: '入力へ戻る', send: '送信する', sending: '送信中...',
    success: '送信を受け付けました', successBody: '受付番号を控えてください。必要に応じてご連絡します。',
    unavailable: '現在フォーム送信の初期設定中です。メールからお問い合わせください。',
    retry: 'もう一度試す', direct: 'メールを開く', security: 'Cloudflare Turnstileで保護されています。',
  },
  en: {
    title: 'CONTACT TERMINAL', intro: 'Contact ivuru about development, ivRm, media, or other topics.',
    name: 'Name', email: 'Email', category: 'Category', subject: 'Subject', message: 'Message',
    project: 'Development / Creative', community: 'ivRm / Community', media: 'Streaming / Media', other: 'Other',
    confirm: 'Review message', edit: 'Back to edit', send: 'Send', sending: 'Sending...',
    success: 'Message received', successBody: 'Keep the request ID. We will contact you when necessary.',
    unavailable: 'The form is being configured. Please use email for now.', retry: 'Try again', direct: 'Open email', security: 'Protected by Cloudflare Turnstile.',
  },
  ko: {
    title: 'CONTACT TERMINAL', intro: '개발·제작, ivRm, 방송·미디어 및 기타 문의를 접수합니다.',
    name: '이름', email: '이메일', category: '문의 유형', subject: '제목', message: '문의 내용',
    project: '개발·제작 문의', community: 'ivRm·커뮤니티', media: '방송·미디어', other: '기타',
    confirm: '내용 확인', edit: '입력으로 돌아가기', send: '보내기', sending: '전송 중...',
    success: '문의가 접수되었습니다', successBody: '접수 번호를 보관해 주세요. 필요한 경우 연락드리겠습니다.',
    unavailable: '현재 폼을 설정 중입니다. 이메일로 문의해 주세요.', retry: '다시 시도', direct: '이메일 열기', security: 'Cloudflare Turnstile로 보호됩니다.',
  },
};

export default function ContactTerminal({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [form, setForm] = useState<FormState>(initialState);
  const [phase, setPhase] = useState<Phase>('input');
  const [config, setConfig] = useState<Config | null>(null);
  const [token, setToken] = useState('');
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/contact', { headers: { accept: 'application/json' } })
      .then((response) => response.json())
      .then((value: Config) => { if (!cancelled) setConfig(value); })
      .catch(() => { if (!cancelled) setConfig({ ready: false, turnstileSiteKey: null, recipient: 'contact@ivrm.jp', discordEnabled: false }); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!config?.turnstileSiteKey || !widget.current || !['confirm', 'sending', 'error'].includes(phase)) return;
    const render = () => {
      if (!window.turnstile || !widget.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(widget.current, {
        sitekey: config.turnstileSiteKey,
        theme: 'dark',
        callback: (value: unknown) => setToken(String(value)),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    };

    if (window.turnstile) render();
    else {
      const existing = document.getElementById('turnstile-script');
      if (existing) existing.addEventListener('load', render, { once: true });
      else {
        const script = document.createElement('script');
        script.id = 'turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.addEventListener('load', render, { once: true });
        document.head.appendChild(script);
      }
    }
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [config, phase]);

  const canConfirm = useMemo(() => (
    form.name.trim().length > 0 && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(form.email) &&
    form.subject.trim().length >= 2 && form.message.trim().length >= 20
  ), [form]);

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!config?.ready || !token) return;
    setPhase('sending');
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...form, locale, turnstileToken: token }),
      });
      const result = await response.json() as { ok?: boolean; requestId?: string; code?: string };
      if (!response.ok || !result.ok) throw new Error(result.code || 'request_failed');
      setRequestId(result.requestId || 'ACCEPTED');
      setPhase('success');
      setForm(initialState);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'request_failed');
      setPhase('error');
      setToken('');
      if (window.turnstile) window.turnstile.reset(widgetId.current);
    }
  };

  return (
    <section className="contact-terminal" data-phase={phase}>
      <header className="contact-terminal-bar">
        <span><i /> SECURE CHANNEL</span>
        <code>contact@ivrm.jp</code>
        <small>{config?.discordEnabled ? 'MAIL + DISCORD' : 'MAIL ROUTE'}</small>
      </header>

      {!config?.ready && config !== null ? (
        <div className="contact-terminal-unavailable">
          <strong>CHANNEL / STANDBY</strong>
          <p>{t.unavailable}</p>
          <a href="mailto:contact@ivrm.jp">{t.direct} ↗</a>
        </div>
      ) : phase === 'success' ? (
        <div className="contact-terminal-result" role="status">
          <span>TRANSMISSION / ACCEPTED</span>
          <h2>{t.success}</h2>
          <p>{t.successBody}</p>
          <code>{requestId}</code>
          <button type="button" onClick={() => { setPhase('input'); setRequestId(''); }}>{t.retry}</button>
        </div>
      ) : (
        <>
          <div className="contact-terminal-copy">
            <span>&gt; OPEN_CHANNEL --WORLD=IVURU</span>
            <h2>{t.title}</h2>
            <p>{t.intro}</p>
          </div>

          {phase === 'confirm' || phase === 'sending' || phase === 'error' ? (
            <div className="contact-confirm-panel">
              <p className="terminal-prompt">&gt; REVIEW_PAYLOAD</p>
              <dl>
                <div><dt>{t.name}</dt><dd>{form.name}</dd></div>
                <div><dt>{t.email}</dt><dd>{form.email}</dd></div>
                <div><dt>{t.category}</dt><dd>{t[form.category]}</dd></div>
                <div><dt>{t.subject}</dt><dd>{form.subject}</dd></div>
                <div><dt>{t.message}</dt><dd>{form.message}</dd></div>
              </dl>
              {phase === 'error' && <p className="contact-error" role="alert">ERROR / {error}</p>}
              <div ref={widget} className="turnstile-slot" />
              <small>{t.security}</small>
              <div className="contact-actions">
                <button type="button" className="button-ghost" onClick={() => setPhase('input')} disabled={phase === 'sending'}>{t.edit}</button>
                <button type="button" className="button-primary" onClick={submit} disabled={!token || phase === 'sending'}>{phase === 'sending' ? t.sending : t.send}</button>
              </div>
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); if (canConfirm) setPhase('confirm'); }}>
              <label><span>01 / {t.name}</span><input value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={80} required autoComplete="name" /></label>
              <label><span>02 / {t.email}</span><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} maxLength={254} required autoComplete="email" /></label>
              <label><span>03 / {t.category}</span><select value={form.category} onChange={(e) => update('category', e.target.value)}><option value="project">{t.project}</option><option value="community">{t.community}</option><option value="media">{t.media}</option><option value="other">{t.other}</option></select></label>
              <label><span>04 / {t.subject}</span><input value={form.subject} onChange={(e) => update('subject', e.target.value)} minLength={2} maxLength={120} required /></label>
              <label className="contact-message"><span>05 / {t.message}</span><textarea value={form.message} onChange={(e) => update('message', e.target.value)} minLength={20} maxLength={5000} rows={10} required /><small>{form.message.length} / 5000</small></label>
              <label className="contact-honeypot" aria-hidden="true"><span>Website</span><input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} /></label>
              <button type="submit" className="button-primary contact-confirm" disabled={!canConfirm || config === null}>{t.confirm} →</button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
