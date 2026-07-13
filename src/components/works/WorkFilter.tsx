import { useEffect, useState } from 'react';
export default function WorkFilter({ noResults }: { noResults: string }) {
  const [filter, setFilter] = useState('All');
  const [count, setCount] = useState(0);
  const items = ['All', 'Development', 'Gaming', 'Community', 'Creative'];
  useEffect(() => {
    const cards = [...document.querySelectorAll<HTMLElement>('[data-work-card]')];
    let visible = 0;
    cards.forEach((card) => {
      const show = filter === 'All' || card.dataset.category === filter;
      card.hidden = !show;
      if (show) visible++;
    });
    setCount(visible);
  }, [filter]);
  return (
    <div className="work-filter" role="group" aria-label="Project category">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          className={filter === item ? 'active' : ''}
          aria-pressed={filter === item}
          onClick={() => setFilter(item)}
        >
          {item}
        </button>
      ))}
      {count === 0 && <p>{noResults}</p>}
    </div>
  );
}
