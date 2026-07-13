# ivuruGG Asset Requirements

The site never displays broken or unrelated stock media. Until real media is supplied, it uses branded abstract placeholders.

## Recommended sizes

| Use                      | Preferred size |  Ratio | Format                    |
| ------------------------ | -------------: | -----: | ------------------------- |
| Home hero                | 2400 × 1500 px |  16:10 | AVIF / WebP, JPG fallback |
| Profile key visual       | 1600 × 2000 px |    4:5 | AVIF / WebP               |
| Work cover               | 1920 × 1200 px |  16:10 | AVIF / WebP               |
| Work gallery             | 1920 × 1080 px |   16:9 | AVIF / WebP               |
| Blog thumbnail           |  1600 × 900 px |   16:9 | AVIF / WebP               |
| Community / gaming media | 1920 × 1080 px |   16:9 | AVIF / WebP               |
| OGP                      |  1200 × 630 px | 1.91:1 | PNG / JPG                 |

## Video

- Master: 1920 × 1080, 24–30 fps, no audio required.
- Web delivery: WebM (VP9/AV1) plus MP4 (H.264) fallback.
- Keep short background loops under 8–12 seconds and preferably under 4 MB.
- Always provide a matching poster image.
- Avoid gameplay footage, music, characters, logos, or artwork without publishing rights.

## Naming

Use lowercase kebab-case: `category-project-purpose-01.webp`.

Examples:

- `development-ivuru-web-cover-01.webp`
- `gaming-event-reel-01.webm`
- `community-ivrm-minecraft-01.avif`
- `blog-cloudflare-pages-01.webp`

## Directories

Place files in the matching folder under `public/assets/`: `brand`, `profile`, `works`, `blog`, `community`, `gaming`, `development`, `creative`, `video`, or `og`.

## Publishing checklist

- Confirm rights, consent, and attribution requirements.
- Remove private account names, chat logs, server addresses, API keys, and personal information.
- Export a poster for every video.
- Set meaningful alt text in the data or content file.
- Replace every `sample: true` item only with verified information.
