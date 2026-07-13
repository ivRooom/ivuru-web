export const profile = {
  name: 'いゔる。',
  id: 'ivuru',
  roles: ['Developer', 'Gamer', 'ivRm Owner / Community Operator', 'Creator'],
  interests: ['Web Development', 'Gaming', 'Cloud', 'Automation', 'Community', 'Music', 'Travel'],
  stack: {
    Frontend: [
      { name: 'HTML / CSS', status: 'experienced' },
      { name: 'JavaScript', status: 'experienced' },
      { name: 'TypeScript', status: 'learning' },
      { name: 'React / Next.js', status: 'learning' },
      { name: 'Astro', status: 'learning' },
    ],
    Backend: [
      { name: 'Node.js', status: 'learning' },
      { name: 'Java', status: 'learning' },
      { name: 'REST API', status: 'learning' },
    ],
    'Cloud / Infrastructure': [
      { name: 'AWS', status: 'learning' },
      { name: 'Cloudflare', status: 'learning' },
      { name: 'OCI', status: 'experienced' },
      { name: 'Docker', status: 'learning' },
    ],
    Database: [
      { name: 'PostgreSQL', status: 'learning' },
      { name: 'Supabase', status: 'learning' },
    ],
    Tools: [
      { name: 'Git / GitHub', status: 'experienced' },
      { name: 'GitHub Actions', status: 'learning' },
      { name: 'VS Code / Cursor', status: 'experienced' },
    ],
    Creative: [
      { name: 'UI Implementation', status: 'experienced' },
      { name: 'GSAP', status: 'experienced' },
    ],
    Community: [
      { name: 'Discord Community', status: 'experienced' },
      { name: 'Minecraft Server', status: 'experienced' },
    ],
  },
  timeline: [
    { year: 'Now', key: 'now' },
    { year: '2025', key: 'community' },
    { year: 'Future', key: 'future' },
  ],
} as const;