/**
 * NoteCard - Single note card component
 * Displays a note preview with metadata and actions
 */

import React from 'react';
import type { Note } from '@/store';

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onClick?: (note: Note) => void;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onClick,
}: NoteCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete?.(note.id);
    }
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (note.isPinned) {
      onUnpin?.(note.id);
    } else {
      onPin?.(note.id);
    }
  };

  const handleClick = () => {
    onClick?.(note);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get preview text (first 150 chars)
  const preview = note.content.slice(0, 150) + (note.content.length > 150 ? '...' : '');

  return (
    <div
      onClick={handleClick}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {note.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>Updated {formatDate(note.updatedAt)}</span>
            {note.category && (
              <>
                <span>•</span>
                <span className="capitalize">{note.category}</span>
              </>
            )}
          </div>
        </div>

        {/* Pin indicator */}
        {note.isPinned && (
          <div className="ml-2">
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 3.5L6.5 7H4v2h1v7l2 1.5h6l2-1.5v-7h1V7h-2.5L10 3.5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Preview */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
        {preview}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePin}
          className="text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={note.isPinned ? 'Unpin' : 'Pin'}
        >
          {note.isPinned ? '📌 Unpin' : '📍 Pin'}
        </button>
        <button
          onClick={handleEdit}
          className="text-sm px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-sm px-3 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
