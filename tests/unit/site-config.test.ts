import { describe, expect, it } from 'vitest';
import { localePath } from '../../src/data/site-config';
import { projects } from '../../src/data/projects';

describe('locale routing', () => {
  it('keeps Japanese routes unprefixed', () => expect(localePath('ja', '/works')).toBe('/works'));
  it('prefixes English and Korean routes', () => {
    expect(localePath('en', '/profile')).toBe('/en/profile');
    expect(localePath('ko', '/blog')).toBe('/ko/blog');
  });
});

describe('project data integrity', () => {
  it('uses unique slugs and marks editable samples', () => {
    expect(new Set(projects.map((project) => project.slug)).size).toBe(projects.length);
    expect(projects.filter((project) => project.sample).length).toBeGreaterThan(0);
  });
});
