export type ProjectCategory = 'Development' | 'Gaming' | 'Community' | 'Creative';

export type Project = {
  slug: string;
  title: string;
  category: ProjectCategory;
  year: string;
  status: 'Active' | 'In Development' | 'Concept';
  featured: boolean;
  sample: boolean;
  description: Record<'ja' | 'en' | 'ko', string>;
  technologies: string[];
  accent: string;
  externalUrl?: string;
};

export const projects: Project[] = [
  {
    slug: 'ivrm-community',
    title: 'ivRm Community',
    category: 'Community',
    year: 'Current',
    status: 'Active',
    featured: true,
    sample: false,
    description: {
      ja: 'ゲーム・雑談・配信・創作・勉強会・Minecraftが交差するデジタルルーム。オーナー兼運営として、場と仕組みを育てています。',
      en: 'A digital room where games, conversation, streaming, art, study sessions, and Minecraft meet—owned and operated by ivuruGG.',
      ko: '게임, 대화, 방송, 창작, 스터디, Minecraft가 만나는 디지털 룸입니다. ivuruGG가 오너이자 운영자로 함께 키워갑니다.',
    },
    technologies: ['Discord', 'Minecraft', 'Web', 'Community Operations'],
    accent: 'cyan',
    externalUrl: 'https://ivrm.jp',
  },
  {
    slug: 'personal-web-development',
    title: 'Personal Web Development',
    category: 'Development',
    year: 'Current',
    status: 'In Development',
    featured: true,
    sample: true,
    description: {
      ja: 'Webアプリケーション、API、クラウド構成を学びながら制作する個人開発群。詳細は実データへ差し替えるためのサンプルです。',
      en: 'Personal projects exploring web applications, APIs, and cloud architecture. This entry is an editable sample awaiting project details.',
      ko: '웹 애플리케이션, API, 클라우드 구성을 학습하며 제작하는 개인 개발입니다. 실제 정보로 교체하기 위한 샘플입니다.',
    },
    technologies: ['React', 'TypeScript', 'Node.js', 'Cloud'],
    accent: 'blue',
  },
  {
    slug: 'gaming-activity',
    title: 'Gaming Activity',
    category: 'Gaming',
    year: 'Current',
    status: 'Active',
    featured: true,
    sample: true,
    description: {
      ja: 'プレイ、マルチプレイ、イベントを通してゲーム世界を探究する活動。具体的なタイトルや実績は画像提供後に更新します。',
      en: 'Exploring virtual worlds through play, multiplayer, and community events. Specific titles and media will be added when available.',
      ko: '플레이, 멀티플레이, 이벤트를 통해 게임 세계를 탐구하는 활동입니다. 구체적인 게임과 미디어는 제공 후 추가합니다.',
    },
    technologies: ['Gaming', 'Multiplayer', 'Events'],
    accent: 'purple',
  },
  {
    slug: 'creative-log',
    title: 'Creative Log',
    category: 'Creative',
    year: 'Current',
    status: 'Concept',
    featured: false,
    sample: true,
    description: {
      ja: '映像・音楽・写真・イラストなどを記録するための編集可能なサンプル枠です。',
      en: 'An editable sample space for video, music, photography, illustration, and other creative work.',
      ko: '영상, 음악, 사진, 일러스트 등 창작 활동을 기록하기 위한 편집 가능한 샘플 공간입니다.',
    },
    technologies: ['Video', 'Music', 'Photography', 'Illustration'],
    accent: 'pink',
  },
];
