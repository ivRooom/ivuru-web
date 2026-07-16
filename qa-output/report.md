# Anime Scroll Story QA

- check: PASS
- lint: PASS
- format: PASS
- unit: PASS
- build: PASS
- performance: PASS
- deploy-check: PASS
- e2e: FAIL (1)

## check.log
```text

> ivuru-web@0.1.0 check
> astro check

[2m23:47:06[22m [34m[content][39m Syncing content
[2m23:47:06[22m [34m[content][39m Synced content
[2m23:47:06[22m [34m[types][39m Generated [2m636ms[22m
[2m23:47:06[22m [34m[check][39m Getting diagnostics for Astro files in /home/runner/work/ivuru-web/ivuru-web...
[96meslint.config.js[0m:[93m7[0m:[93m25[0m - [93mwarning[0m[90m ts(6387): [0mThe signature '(...configs: InfiniteDepthConfigWithExtends[]): ConfigArray' of 'tseslint.config' is deprecated.

[7m7[0m export default tseslint.config(
[7m [0m [93m                        ~~~~~~[0m

[96msrc/worker.ts[0m:[93m121[0m:[93m7[0m - [93mwarning[0m[90m ts(80006): [0mThis may be converted to an async function.

[7m121[0m const fetchWithTimeout = (input: RequestInfo | URL, init: RequestInit, timeoutMs = 8_000) => {
[7m   [0m [93m      ~~~~~~~~~~~~~~~~[0m

[96msrc/components/contact/ContactStatusTerminal.tsx[0m:[93m73[0m:[93m32[0m - [93mwarning[0m[90m ts(6385): [0m'FormEvent' is deprecated.

[7m73[0m   const submit = async (event: FormEvent) => {
[7m  [0m [93m                               ~~~~~~~~~[0m
[96msrc/components/contact/ContactStatusTerminal.tsx[0m:[93m1[0m:[93m31[0m - [93mwarning[0m[90m ts(6385): [0m'FormEvent' is deprecated.

[7m1[0m import { useEffect, useState, type FormEvent } from 'react';
[7m [0m [93m                              ~~~~~~~~~~~~~~[0m

Result (157 files): 
- 0 errors
- 0 warnings
- 4 hints

```

## e2e.log
```text
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.

[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.

[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.

[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[141/122] [mobile] › tests/e2e/x-profile.spec.ts:74:3 › X profile identity › Xユーザーに画像がない場合も旧PNGを表示せずブランドへ切り替える

[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.

[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.

[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
[WebServer] Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
[WebServer] 1. You might have mismatching versions of React and the renderer (such as React DOM)
[WebServer] 2. You might be breaking the Rules of Hooks
[WebServer] 3. You might have more than one copy of React in the same app
[WebServer] See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
  7 failed
    [chromium] › tests/e2e/blue-mobile-menu.spec.ts:15:3 › blue mobile navigation › opens with the blue signal core and closes with Escape 
    [chromium] › tests/e2e/immersive-worlds.spec.ts:38:1 › home exposes anime scenes to News, Games, and Profile Favorites 
    [mobile] › tests/e2e/blue-mobile-menu.spec.ts:15:3 › blue mobile navigation › opens with the blue signal core and closes with Escape 
    [mobile] › tests/e2e/contact.spec.ts:114:1 › header and footer expose Contact ──────────────────
    [mobile] › tests/e2e/hero-motion.spec.ts:79:3 › anime scroll story › responds to a fine pointer with depth and chapter-three card tilt 
    [mobile] › tests/e2e/immersive-worlds.spec.ts:38:1 › home exposes anime scenes to News, Games, and Profile Favorites 
    [mobile] › tests/e2e/site.spec.ts:45:1 › chapter cut shows the destination chapter without replaying the intro loader 
  3 flaky
    [chromium] › tests/e2e/anime-experience.spec.ts:37:3 › blue signal loading experience › uses the compact loader after the first visit 
    [chromium] › tests/e2e/site.spec.ts:33:1 › world loader appears on access and clears safely ────
    [mobile] › tests/e2e/hero-motion.spec.ts:48:3 › anime scroll story › switches scenes and makes foreground objects fly toward the viewer 
  112 passed (9.0m)
```
