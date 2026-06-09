/**
 * NoteEditor - Markdown editor for creating and editing notes
 */

import React, { useState, useEffect } from 'react';
import type { Note } from '@/store';

interface NoteEditorProps {
  note?: Note;
  topicId?: string;
  category?: Note['category'];
  onSave: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export function NoteEditor({
  note,
  topicId,
  category,
  onSave,
  onCancel,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [selectedCategory, setSelectedCategory] = useState<Note['category'] | undefined>(
    note?.category || category
  );
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [linkedTopicId, setLinkedTopicId] = useState(topicId || note?.topicId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isEditMode = !!note;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    setIsSaving(true);

    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
        topicId: linkedTopicId.trim() || undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        isPinned: note?.isPinned || false,
      };

      await onSave(noteData);
    } catch (error) {
      alert('Failed to save note');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditMode ? 'Edit Note' : 'Create Note'}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {showPreview ? '📝 Edit' : '👁️ Preview'}
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* Category and Topic */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory || ''}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value ? (e.target.value as Note['category']) : undefined
                )
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">None</option>
              <option value="math">Mathematics</option>
              <option value="ml">Machine Learning</option>
              <option value="cv">Computer Vision</option>
              <option value="llm">LLM</option>
              <option value="research">Research</option>
            </select>
          </div>

          <div>
            <label htmlFor="topicId" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Linked Topic ID (optional)
            </label>
            <input
              id="topicId"
              type="text"
              value={linkedTopicId}
              onChange={(e) => setLinkedTopicId(e.target.value)}
              placeholder="lesson-id, paper-id, etc."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="important, todo, review"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* Content Editor/Preview */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Content (Markdown supported)
          </label>

          {showPreview ? (
            <div className="w-full min-h-[300px] px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-900 prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(content) }} />
            </div>
          ) : (
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note content here... Markdown is supported!"
              required
              rows={15}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          )}
        </div>

        {/* Markdown Help */}
        {!showPreview && (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <strong>Markdown tips:</strong> **bold**, *italic*, `code`, # Heading, - List, [link](url)
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update Note' : 'Create Note'}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Simple markdown to HTML renderer for preview
 * (Basic implementation - could be enhanced with a library)
 */
function renderMarkdownPreview(markdown: string): string {
  let html = markdown;

  // Headers
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
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}
