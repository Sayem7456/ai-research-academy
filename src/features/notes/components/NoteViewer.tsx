/**
 * NoteViewer - Display a note with rendered markdown
 */

import React from 'react';
import type { Note } from '@/store';

interface NoteViewerProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onClose?: () => void;
}

export function NoteViewer({
  note,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onClose,
}: NoteViewerProps) {
  const handleEdit = () => {
    onEdit?.(note);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete?.(note.id);
    }
  };

  const handlePin = () => {
    if (note.isPinned) {
      onUnpin?.(note.id);
    } else {
      onPin?.(note.id);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {note.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>Created: {formatDate(note.createdAt)}</span>
              {note.createdAt !== note.updatedAt && (
                <>
                  <span>•</span>
                  <span>Updated: {formatDate(note.updatedAt)}</span>
                </>
              )}
              {note.category && (
                <>
                  <span>•</span>
                  <span className="capitalize">{note.category}</span>
                </>
              )}
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Topic link */}
        {note.topicId && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            📎 Linked to: <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{note.topicId}</code>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePin}
            className="px-4 py-2 text-sm border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {note.isPinned ? '📌 Unpin' : '📍 Pin'}
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 text-sm border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }} />
      </div>
    </div>
  );
}

/**
 * Render markdown to HTML
 * (Basic implementation - could be enhanced with a library like marked or remark)
 */
function renderMarkdown(markdown: string): string {
  let html = markdown;

  // Escape HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```...```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

  // Headers
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists (unordered)
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return html;
}
