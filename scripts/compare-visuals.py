from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image, ImageChops


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('baseline')
    parser.add_argument('current')
    parser.add_argument('diff')
    parser.add_argument('--threshold', type=float, default=0.03)
    args = parser.parse_args()

    baseline_dir = Path(args.baseline)
    current_dir = Path(args.current)
    diff_dir = Path(args.diff)
    diff_dir.mkdir(parents=True, exist_ok=True)

    failures: list[tuple[str, float]] = []
    rows: list[tuple[str, float, str]] = []

    for current_path in sorted(current_dir.glob('*.png')):
        baseline_path = baseline_dir / current_path.name
        if not baseline_path.exists():
            failures.append((current_path.name, 1.0))
            rows.append((current_path.name, 1.0, 'MISSING BASELINE'))
            continue

        baseline = Image.open(baseline_path).convert('RGBA')
        current = Image.open(current_path).convert('RGBA')
        if baseline.size != current.size:
            failures.append((current_path.name, 1.0))
            rows.append((current_path.name, 1.0, 'SIZE MISMATCH'))
            continue

        diff = ImageChops.difference(baseline, current)
        pixels = diff.getdata()
        changed = sum(1 for pixel in pixels if max(pixel) > 24)
        ratio = changed / (baseline.width * baseline.height)

        highlighted = Image.new('RGBA', baseline.size, (0, 0, 0, 255))
        highlighted_pixels = highlighted.load()
        diff_pixels = diff.load()
        for y in range(baseline.height):
            for x in range(baseline.width):
                highlighted_pixels[x, y] = (255, 0, 120, 255) if max(diff_pixels[x, y]) > 24 else (0, 0, 0, 255)
        highlighted.save(diff_dir / current_path.name)

        status = 'PASS' if ratio <= args.threshold else 'FAIL'
        rows.append((current_path.name, ratio, status))
        if ratio > args.threshold:
            failures.append((current_path.name, ratio))

    print('| Screenshot | Difference | Result |')
    print('| --- | ---: | --- |')
    for name, ratio, status in rows:
        print(f'| {name} | {ratio:.2%} | {status} |')

    if failures:
        print('\nVisual regression threshold exceeded:')
        for name, ratio in failures:
            print(f'- {name}: {ratio:.2%}')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
