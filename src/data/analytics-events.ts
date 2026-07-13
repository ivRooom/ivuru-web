export const analyticsEventNames = [
  'page_view',
  'nav_open',
  'nav_select',
  'works_open',
  'portfolio_open',
  'clip_open',
  'social_open',
  'contact_start',
  'contact_confirm',
  'contact_submit',
  'contact_success',
  'contact_error',
  'command_center_open',
  'language_change',
  'theme_change',
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type AnalyticsEventDetail = {
  name: AnalyticsEventName;
  path: string;
  locale: 'ja' | 'en' | 'ko';
  target?: string;
  surface?: string;
  category?: string;
  position?: string;
  status?: string;
};

export const analyticsParameterAllowlist = [
  'path',
  'locale',
  'target',
  'surface',
  'category',
  'position',
  'status',
] as const;

export const analyticsEventMap: Record<
  AnalyticsEventName,
  { purpose: string; parameters: readonly string[] }
> = {
  page_view: {
    purpose: 'ページ閲覧とAstro ClientRouterによるページ遷移を把握する',
    parameters: ['path', 'locale'],
  },
  nav_open: {
    purpose: 'モバイルナビゲーションの利用状況を把握する',
    parameters: ['path', 'locale', 'surface'],
  },
  nav_select: {
    purpose: 'ナビゲーションから選択された主要ページを把握する',
    parameters: ['path', 'locale', 'target', 'surface', 'position'],
  },
  works_open: {
    purpose: '作品・ミッション詳細への導線利用を把握する',
    parameters: ['path', 'locale', 'target', 'surface', 'category', 'position'],
  },
  portfolio_open: {
    purpose: 'Developer Portfolioへの導線利用を把握する',
    parameters: ['path', 'locale', 'surface'],
  },
  clip_open: {
    purpose: 'ゲームクリップの外部再生導線を把握する',
    parameters: ['path', 'locale', 'target', 'surface', 'category', 'position'],
  },
  social_open: {
    purpose: 'SNS・Discord・メールへの外部導線利用を把握する',
    parameters: ['path', 'locale', 'target', 'surface', 'position'],
  },
  contact_start: {
    purpose: 'Contact Terminalの入力開始を把握する',
    parameters: ['path', 'locale', 'surface'],
  },
  contact_confirm: {
    purpose: '送信確認画面まで進んだ割合を把握する',
    parameters: ['path', 'locale', 'category'],
  },
  contact_submit: {
    purpose: 'Contact APIへの送信試行を把握する',
    parameters: ['path', 'locale', 'category'],
  },
  contact_success: {
    purpose: 'お問い合わせ受付成功を把握する',
    parameters: ['path', 'locale', 'category', 'status'],
  },
  contact_error: {
    purpose: 'お問い合わせ送信失敗の傾向を把握する',
    parameters: ['path', 'locale', 'category', 'status'],
  },
  command_center_open: {
    purpose: 'Activity Command Centerからの主要導線利用を把握する',
    parameters: ['path', 'locale', 'target', 'surface', 'position'],
  },
  language_change: {
    purpose: '表示言語切替の利用状況を把握する',
    parameters: ['path', 'locale', 'target'],
  },
  theme_change: {
    purpose: 'テーマ切替の利用状況を把握する',
    parameters: ['path', 'locale', 'target'],
  },
};
