import { useEffect, useState, useMemo } from 'react';
import Fuse from 'fuse.js';

export type SearchItem = {
  id: string;
  section: string;
  slug: string;
  title: string;
  tags: string[];
  date: string | null;
  excerpt: string;
  text: string;
};

export function useSearch() {
  const [index, setIndex] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setIndex(data);
      })
      .catch(() => setIndex([]))
      .finally(() => setLoading(false));
    return () => { mounted = false };
  }, []);

  const fuse = useMemo(() => {
    if (!index) return null;
    return new Fuse(index, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'tags', weight: 0.4 },
        { name: 'excerpt', weight: 0.3 },
        { name: 'text', weight: 0.2 },
      ],
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [index]);

  function search(q: string) {
    if (!fuse || !q) return [];
    const results = fuse.search(q, { limit: 20 });
    return results.map((r) => r.item);
  }

  return { index, loading, search };
}
