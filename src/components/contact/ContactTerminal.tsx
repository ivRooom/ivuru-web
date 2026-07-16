import { contactApiUrl } from '@/lib/contact-api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { emitAnalyticsEvent } from '@/lib/analytics';
import '@/styles/contact-validation.css';

type Locale = 'ja' | 'en' | 'ko';
type Phase = 'input' | 'confirm' | 'sending' | 'success' | 'error';
type Category = 'project' | 'community' | 'media' | 'other';
type ValidationField = 'name' | 'email' | 'subject' | 'message';

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
  queueEnabled?: boolean;
  statusEnabled?: boolean;
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
    name: 'お名前',
    email: 'メールアドレス',
    category: 'お問い合わせ種別',
    subject: '件名',
    message: 'お問い合わせ内容',
    project: '開発・制作の相談',
    community: 'ivRm・コミュニティ',
    media: '配信・メディア',
    other: 'その他',
    confirm: '送信内容を確認',
    edit: '入力へ戻る',
    send: '送信する',
    sending: '送信中...',
    success: '送信を受け付けました',
    successBody: '受付番号と照会キーを控えてください。必要に応じてご連絡します。',
    lookupKey: '照会キー',
    status: 'お問い合わせ状況を確認',
    unavailable: '現在フォーム送信の初期設定中です。メールからお問い合わせください。',
    retry: 'もう一度送信する',
    direct: 'メールを開く',
    security: 'Cloudflare Turnstileで保護されています。',
    initializing: '送信チャンネルを初期化しています…',
    requirements: '必須項目を入力してください。件名は2文字以上、本文は20文字以上です。',
    validationSummary: '未入力または条件を満たしていない項目があります。',
    nameError: 'お名前を入力してください。',
    emailError: '正しいメールアドレスを入力してください。',
    subjectError: '件名は2文字以上で入力してください。',
    messageError: 'お問い合わせ内容は20文字以上で入力してください。',
  },
  en: {
    title: 'CONTACT TERMINAL',
    intro: 'Contact ivuru about development, ivRm, media, or other topics.',
    name: 'Name',
    email: 'Email',
    category: 'Category',
    subject: 'Subject',
    message: 'Message',
    project: 'Development / Creative',
    community: 'ivRm / Community',
    media: 'Streaming / Media',
    other: 'Other',
    confirm: 'Review message',
    edit: 'Back to edit',
    send: 'Send',
    sending: 'Sending...',
    success: 'Message received',
    successBody: 'Keep the request ID and lookup key. We will contact you when necessary.',
    lookupKey: 'Lookup key',
    status: 'Check contact status',
    unavailable: 'The form is being configured. Please use email for now.',
    retry: 'Send another message',
    direct: 'Open email',
    security: 'Protected by Cloudflare Turnstile.',
    initializing: 'Initializing the secure contact channel…',
    requirements: 'Complete all required fields. Subject: 2+ characters. Message: 20+ characters.',
    validationSummary: 'Some required fields are missing or do not meet the requirements.',
    nameError: 'Enter your name.',
    emailError: 'Enter a valid email address.',
    subjectError: 'Enter at least 2 characters for the subject.',
    messageError: 'Enter at least 20 characters for the message.',
  },
  ko: {
    title: 'CONTACT TERMINAL',
    intro: '개발·제작, ivRm, 방송·미디어 및 기타 문의를 접수합니다.',
    name: '이름',
    email: '이메일',
    category: '문의 유형',
    subject: '제목',
    message: '문의 내용',
    project: '개발·제작 문의',
    community: 'ivRm·커뮤니티',
    media: '방송·미디어',
    other: '기타',
    confirm: '내용 확인',
    edit: '입력으로 돌아가기',
    send: '보내기',
    sending: '전송 중...',
    success: '문의가 접수되었습니다',
    successBody: '접수 번호와 조회 키를 보관해 주세요. 필요한 경우 연락드리겠습니다.',
    lookupKey: '조회 키',
    status: '문의 상태 확인',
    unavailable: '현재 폼을 설정 중입니다. 이메일로 문의해 주세요.',
    retry: '다른 문의 보내기',
    direct: '이메일 열기',
    security: 'Cloudflare Turnstile로 보호됩니다.',
    initializing: '보안 문의 채널을 초기화하고 있습니다…',
    requirements: '필수 항목을 입력해 주세요. 제목은 2자 이상, 문의 내용은 20자 이상입니다.',
    validationSummary: '입력하지 않았거나 조건을 충족하지 않은 항목이 있습니다.',
    nameError: '이름을 입력해 주세요.',
    emailError: '올바른 이메일 주소를 입력해 주세요.',
    subjectError: '제목을 2자 이상 입력해 주세요.',
    messageError: '문의 내용을 20자 이상 입력해 주세요.',
  },
};

const statusPath = (locale: Locale) =>
  locale === 'ja' ? '/contact/status/' : `/${locale}/contact/status/`;

const validationOrder: ValidationField[] = ['name', 'email', 'subject', 'message'];

export default function ContactTerminal({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [form, setForm] = useState<FormState>(initialState);
  const [phase, setPhase] = useState<Phase>('input');
  const [config, setConfig] = useState<Config | null>(null);
  const [token, setToken] = useState('');
  const [requestId, setRequestId] = useState('');
  const [statusToken, setStatusToken] = useState('');
  const [statusEnabled, setStatusEnabled] = useState(false);
  const [error, setError] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const started = useRef(false);
  const configLoading = config === null;

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const response = await fetch(contactApiUrl('/api/contact'), {
          headers: { accept: 'application/json' },
        });
        if (!response.ok) throw new Error('contact_config_failed');
        const value = (await response.json()) as Config;
        if (!cancelled) setConfig(value);
      } catch {
        if (!cancelled) {
          setConfig({
            ready: false,
            turnstileSiteKey: null,
            recipient: 'contact.ivuru@ivrm.jp',
            discordEnabled: false,
            queueEnabled: false,
            statusEnabled: false,
          });
        }
      }
    };

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      !config?.turnstileSiteKey ||
      !widget.current ||
      !['confirm', 'sending', 'error'].includes(phase)
    ) {
      return;
    }

    const render = () => {
      if (!window.turnstile || !widget.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(widget.current, {
        sitekey: config.turnstileSiteKey,
        action: 'contact_submit',
        theme: 'dark',
        callback: (value: unknown) => setToken(String(value)),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const existing = document.getElementById('turnstile-script');
      if (existing) {
        existing.addEventListener('load', render, { once: true });
      } else {
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

  const validation = useMemo(
    () => ({
      name: form.name.trim().length > 0,
      email: /[^\s@]+@[^\s@]+\.[^\s@]+/.test(form.email),
      subject: form.subject.trim().length >= 2,
      message: form.message.trim().length >= 20,
    }),
    [form],
  );

  const canConfirm = validationOrder.every((field) => validation[field]);

  const update = (key: keyof FormState, value: string) => {
    if (!started.current && key !== 'website' && value.trim()) {
      started.current = true;
      emitAnalyticsEvent('contact_start', { surface: 'contact_terminal' });
    }
    setForm((current) => ({ ...current, [key]: value }));
  };

  const confirm = () => {
    if (!canConfirm) {
      setShowValidation(true);
      requestAnimationFrame(() => {
        const firstInvalid = validationOrder.find((field) => !validation[field]);
        if (firstInvalid) document.getElementById(`contact-${firstInvalid}`)?.focus();
      });
      return;
    }

    setShowValidation(false);
    emitAnalyticsEvent('contact_confirm', { category: form.category, surface: 'contact_terminal' });
    setPhase('confirm');
  };

  const submit = async () => {
    if (!config?.ready || !token) return;
    setPhase('sending');
    setError('');
    emitAnalyticsEvent('contact_submit', { category: form.category, surface: 'contact_terminal' });

    try {
      const response = await fetch(contactApiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...form, locale, turnstileToken: token }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        requestId?: string;
        statusToken?: string;
        statusEnabled?: boolean;
        code?: string;
      };
      if (!response.ok || !result.ok) throw new Error(result.code || 'request_failed');

      const nextRequestId = result.requestId || 'ACCEPTED';
      const nextStatusToken = result.statusToken || '';
      const nextStatusEnabled = Boolean(result.statusEnabled && nextStatusToken);
      if (nextStatusEnabled) {
        sessionStorage.setItem(
          'ivuru-contact-status',
          JSON.stringify({ requestId: nextRequestId, token: nextStatusToken }),
        );
      }

      emitAnalyticsEvent('contact_success', { category: form.category, status: 'accepted' });
      setRequestId(nextRequestId);
      setStatusToken(nextStatusToken);
      setStatusEnabled(nextStatusEnabled);
      setPhase('success');
      setForm(initialState);
      setShowValidation(false);
      started.current = false;
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : 'request_failed';
      emitAnalyticsEvent('contact_error', { category: form.category, status: code });
      setError(code);
      setPhase('error');
      setToken('');
      if (window.turnstile) window.turnstile.reset(widgetId.current);
    }
  };

  const guidance = configLoading
    ? t.initializing
    : showValidation && !canConfirm
      ? t.validationSummary
      : t.requirements;

  return (
    <section className="contact-terminal" data-phase={phase}>
      <header className="contact-terminal-bar">
        <span>
          <i /> SECURE CHANNEL
        </span>
        <code>contact.ivuru@ivrm.jp</code>
        <small>
          {config?.queueEnabled
            ? 'QUEUE + MAIL + DISCORD'
            : config?.discordEnabled
              ? 'MAIL + DISCORD'
              : 'MAIL ROUTE'}
        </small>
      </header>

      {!config?.ready && config !== null ? (
        <div className="contact-terminal-unavailable">
          <strong>CHANNEL / STANDBY</strong>
          <p>{t.unavailable}</p>
          <a
            href="mailto:contact.ivuru@ivrm.jp"
            data-analytics-event="social_open"
            data-analytics-target="email"
            data-analytics-surface="contact_fallback"
          >
            {t.direct} ↗
          </a>
        </div>
      ) : phase === 'success' ? (
        <div className="contact-terminal-result" role="status">
          <span>TRANSMISSION / ACCEPTED</span>
          <h2>{t.success}</h2>
          <p>{t.successBody}</p>
          <code>{requestId}</code>
          {statusEnabled && (
            <>
              <p>
                <strong>{t.lookupKey}</strong>
              </p>
              <code>{statusToken}</code>
              <a className="button-primary" href={statusPath(locale)}>
                {t.status} →
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setPhase('input');
              setRequestId('');
              setStatusToken('');
              setStatusEnabled(false);
              setToken('');
            }}
          >
            {t.retry}
          </button>
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
                <div>
                  <dt>{t.name}</dt>
                  <dd>{form.name}</dd>
                </div>
                <div>
                  <dt>{t.email}</dt>
                  <dd>{form.email}</dd>
                </div>
                <div>
                  <dt>{t.category}</dt>
                  <dd>{t[form.category]}</dd>
                </div>
                <div>
                  <dt>{t.subject}</dt>
                  <dd>{form.subject}</dd>
                </div>
                <div>
                  <dt>{t.message}</dt>
                  <dd>{form.message}</dd>
                </div>
              </dl>
              {phase === 'error' && (
                <p className="contact-error" role="alert">
                  ERROR / {error}
                </p>
              )}
              <div ref={widget} className="turnstile-slot" />
              <small>{t.security}</small>
              <div className="contact-actions">
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => {
                    setPhase('input');
                    setToken('');
                  }}
                  disabled={phase === 'sending'}
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={submit}
                  disabled={!token || phase === 'sending'}
                >
                  {phase === 'sending' ? t.sending : t.send}
                </button>
              </div>
            </div>
          ) : (
            <form
              noValidate
              aria-busy={configLoading}
              onSubmit={(event) => {
                event.preventDefault();
                confirm();
              }}
            >
              <label>
                <span>01 / {t.name}</span>
                <input
                  id="contact-name"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  maxLength={80}
                  required
                  autoComplete="name"
                  disabled={configLoading}
                  aria-invalid={showValidation && !validation.name}
                  aria-describedby={
                    showValidation && !validation.name ? 'contact-name-error' : undefined
                  }
                />
                {showValidation && !validation.name && (
                  <small id="contact-name-error" className="contact-field-error">
                    {t.nameError}
                  </small>
                )}
              </label>
              <label>
                <span>02 / {t.email}</span>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  maxLength={254}
                  required
                  autoComplete="email"
                  disabled={configLoading}
                  aria-invalid={showValidation && !validation.email}
                  aria-describedby={
                    showValidation && !validation.email ? 'contact-email-error' : undefined
                  }
                />
                {showValidation && !validation.email && (
                  <small id="contact-email-error" className="contact-field-error">
                    {t.emailError}
                  </small>
                )}
              </label>
              <label>
                <span>03 / {t.category}</span>
                <select
                  value={form.category}
                  onChange={(event) => update('category', event.target.value)}
                  disabled={configLoading}
                >
                  <option value="project">{t.project}</option>
                  <option value="community">{t.community}</option>
                  <option value="media">{t.media}</option>
                  <option value="other">{t.other}</option>
                </select>
              </label>
              <label>
                <span>04 / {t.subject}</span>
                <input
                  id="contact-subject"
                  value={form.subject}
                  onChange={(event) => update('subject', event.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                  disabled={configLoading}
                  aria-invalid={showValidation && !validation.subject}
                  aria-describedby={
                    showValidation && !validation.subject ? 'contact-subject-error' : undefined
                  }
                />
                {showValidation && !validation.subject && (
                  <small id="contact-subject-error" className="contact-field-error">
                    {t.subjectError}
                  </small>
                )}
              </label>
              <label className="contact-message">
                <span>05 / {t.message}</span>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(event) => update('message', event.target.value)}
                  minLength={20}
                  maxLength={5000}
                  rows={10}
                  required
                  disabled={configLoading}
                  aria-invalid={showValidation && !validation.message}
                  aria-describedby={
                    showValidation && !validation.message ? 'contact-message-error' : undefined
                  }
                />
                <div className="contact-message-meta">
                  {showValidation && !validation.message && (
                    <small id="contact-message-error" className="contact-field-error">
                      {t.messageError}
                    </small>
                  )}
                  <small>{form.message.length} / 5000</small>
                </div>
              </label>
              <label className="contact-honeypot" aria-hidden="true">
                <span>Website</span>
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => update('website', event.target.value)}
                  disabled={configLoading}
                />
              </label>
              <p
                id="contact-form-guidance"
                className={
                  showValidation && !canConfirm
                    ? 'contact-form-guidance is-error'
                    : 'contact-form-guidance'
                }
                role={showValidation && !canConfirm ? 'alert' : 'status'}
              >
                {guidance}
              </p>
              <button
                type="submit"
                className="button-primary contact-confirm"
                disabled={configLoading}
                aria-describedby="contact-form-guidance"
              >
                {t.confirm} →
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
