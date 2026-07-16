import { contactApiUrl } from '@/lib/contact-api';
import { useEffect, useState, type FormEvent } from 'react';

type Locale = 'ja' | 'en' | 'ko';

type StatusResponse = {
  ok?: boolean;
  code?: string;
  requestId?: string;
  status?: string;
  deliveryStatus?: string;
  updatedAt?: string;
  expiresAt?: string;
};

const copy = {
  ja: {
    title: 'CONTACT STATUS',
    intro: '受付完了時に表示された受付番号と照会キーで、個人情報を含まない処理状況を確認できます。',
    requestId: '受付番号',
    token: '照会キー',
    submit: '状況を確認',
    checking: '確認中...',
    notFound: '一致する受付情報が見つからないか、保存期間が終了しています。',
    updated: '最終更新',
    expires: '照会期限',
  },
  en: {
    title: 'CONTACT STATUS',
    intro:
      'Check a privacy-safe delivery status using the request ID and lookup key shown after submission.',
    requestId: 'Request ID',
    token: 'Lookup key',
    submit: 'Check status',
    checking: 'Checking...',
    notFound: 'No matching active request was found.',
    updated: 'Updated',
    expires: 'Lookup expires',
  },
  ko: {
    title: 'CONTACT STATUS',
    intro:
      '접수 완료 시 표시된 접수 번호와 조회 키로 개인정보가 포함되지 않은 처리 상태를 확인할 수 있습니다.',
    requestId: '접수 번호',
    token: '조회 키',
    submit: '상태 확인',
    checking: '확인 중...',
    notFound: '일치하는 접수 정보가 없거나 보관 기간이 종료되었습니다.',
    updated: '최종 업데이트',
    expires: '조회 만료',
  },
} as const;

export default function ContactStatusTerminal({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [requestId, setRequestId] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('ivuru-contact-status');
      if (!saved) return;
      const value = JSON.parse(saved) as { requestId?: string; token?: string };
      setRequestId(value.requestId ?? '');
      setToken(value.token ?? '');
    } catch {
      sessionStorage.removeItem('ivuru-contact-status');
    }
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(contactApiUrl('/api/contact/status'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ requestId: requestId.trim(), token: token.trim() }),
      });
      const body = (await response.json()) as StatusResponse;
      if (!response.ok || !body.ok) throw new Error(body.code || 'status_lookup_failed');
      setResult(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'status_lookup_failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-terminal contact-status-terminal">
      <header className="contact-terminal-bar">
        <span>
          <i /> SECURE LOOKUP
        </span>
        <code>NO PII RESPONSE</code>
        <small>STATUS CHANNEL</small>
      </header>
      <div className="contact-terminal-copy">
        <span>&gt; QUERY_CONTACT_STATUS</span>
        <h2>{t.title}</h2>
        <p>{t.intro}</p>
      </div>
      <form onSubmit={submit}>
        <label>
          <span>01 / {t.requestId}</span>
          <input
            value={requestId}
            onChange={(event) => setRequestId(event.target.value)}
            required
            maxLength={40}
            autoComplete="off"
          />
        </label>
        <label>
          <span>02 / {t.token}</span>
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            minLength={32}
            maxLength={96}
            autoComplete="off"
          />
        </label>
        <button type="submit" className="button-primary" disabled={loading}>
          {loading ? t.checking : t.submit}
        </button>
      </form>
      {error && (
        <p className="contact-error" role="alert">
          ERROR / {error === 'not_found' ? t.notFound : error}
        </p>
      )}
      {result && (
        <div className="contact-terminal-result" role="status">
          <span>STATUS / {result.deliveryStatus?.toUpperCase()}</span>
          <h2>{result.status}</h2>
          <code>{result.requestId}</code>
          <p>
            {t.updated}: {result.updatedAt}
          </p>
          <p>
            {t.expires}: {result.expiresAt}
          </p>
        </div>
      )}
    </section>
  );
}
