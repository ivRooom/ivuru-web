import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function BlogSearch({
  placeholder,
  noResults,
}: {
  placeholder: string;
  noResults: string;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [count, setCount] = useState(0);
  const categories = [
    'All',
    'Development',
    'Gaming',
    'ivRm',
    'Creator',
    'Music',
    'Travel',
    'Diary',
  ];
  useEffect(() => {
    const items = [...document.querySelectorAll<HTMLElement>('[data-blog-item]')];
    let visible = 0;
    items.forEach((item) => {
      const matchesQuery = !query || item.dataset.search?.includes(query.toLowerCase());
      const matchesCategory = category === 'All' || item.dataset.category === category;
      const show = Boolean(matchesQuery && matchesCategory);
      item.hidden = !show;
      if (show) visible++;
    });
    setCount(visible);
  }, [query, category]);
  return (
    <div className="blog-search">
      <label>
        <Search aria-hidden="true" />
        <span className="sr-only">{placeholder}</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} />
      </label>
      <div className="filter-scroll">
        {categories.map((item) => (
          <button
            type="button"
            key={item}
            className={category === item ? 'active' : ''}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {count === 0 && <p className="no-results">{noResults}</p>}
    </div>
  );
}
