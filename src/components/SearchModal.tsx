"use client";
import React, { useEffect, useState } from 'react';
import { useSearch } from '@/hooks/useSearch';
import SearchInput from './SearchInput';

export default function SearchModal() {
  const { index, loading, search } = useSearch();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((s) => !s);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!query) return setResults([]);
    setResults(search(query));
  }, [query, index]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded shadow p-4">
        <div className="mb-2">
          <SearchInput value={query} onChange={setQuery} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }} />
        </div>
        <div className="max-h-80 overflow-auto">
          {loading && <div className="p-4">Loading index...</div>}
          {!loading && results.length === 0 && <div className="p-4 text-sm text-gray-500">No results</div>}
          <ul>
            {results.map((r: any) => (
              <li key={r.id} className="p-2 border-b">
                <a href={`/content/${r.section}/${r.slug}`} className="block">
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-sm text-gray-600">{r.excerpt}</div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
