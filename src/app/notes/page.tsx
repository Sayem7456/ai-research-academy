/**
 * Notes Page - Personal Notes System
 * Phase 7: Offline-first notes with IndexedDB
 */

'use client';

import React, { useState } from 'react';
import {
  NoteCard,
  NoteEditor,
  NoteViewer,
  NotesList,
  NoteSearch,
} from '@/features/notes';
import { useNotes } from '@/features/notes';
import type { Note } from '@/store';

type ViewMode = 'list' | 'search' | 'editor' | 'viewer';

export default function NotesPage() {
  const { createNote, updateNote, deleteNote, pinNote, unpinNote, isLoading, error } =
    useNotes();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Handle creating a new note
  const handleCreateNote = () => {
    setEditingNote(null);
    setSelectedNote(null);
    setViewMode('editor');
  };

  // Handle editing an existing note
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setSelectedNote(null);
    setViewMode('editor');
  };

  // Handle viewing a note
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setEditingNote(null);
    setViewMode('viewer');
  };

  // Handle deleting a note
  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setViewMode('list');
    }
  };

  // Handle pinning/unpinning a note
  const handlePinNote = async (id: string) => {
    await pinNote(id);
  };

  const handleUnpinNote = async (id: string) => {
    await unpinNote(id);
  };

  // Handle saving a note (create or update)
  const handleSaveNote = async (
    noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingNote) {
      // Update existing note
      await updateNote(editingNote.id, noteData);
    } else {
      // Create new note
      await createNote(noteData);
    }
    setViewMode('list');
    setEditingNote(null);
  };

  // Handle canceling editor
  const handleCancelEdit = () => {
    setEditingNote(null);
    setViewMode('list');
  };

  // Handle closing viewer
  const handleCloseViewer = () => {
    setSelectedNote(null);
    setViewMode('list');
  };

  // Handle editing from viewer
  const handleEditFromViewer = (note: Note) => {
    setSelectedNote(null);
    setEditingNote(note);
    setViewMode('editor');
  };

  // Handle deleting from viewer
  const handleDeleteFromViewer = async (id: string) => {
    await handleDeleteNote(id);
    setSelectedNote(null);
    setViewMode('list');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                📝 Personal Notes
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Your personal learning journal - stored locally, offline-first
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ➕ New Note
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'list'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📋 All Notes
            </button>
            <button
              onClick={() => setViewMode('search')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'search'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">
              ⚠️ Error: {error}
            </p>
          </div>
        )}

        {/* Loading Display */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {viewMode === 'list' && (
              <NotesList
                onNoteClick={handleViewNote}
                onNoteEdit={handleEditNote}
                onNoteDelete={handleDeleteNote}
                onNotePin={handlePinNote}
                onNoteUnpin={handleUnpinNote}
              />
            )}

            {viewMode === 'search' && (
              <NoteSearch
                onNoteClick={handleViewNote}
                onNoteEdit={handleEditNote}
                onNoteDelete={handleDeleteNote}
                onNotePin={handlePinNote}
                onNoteUnpin={handleUnpinNote}
              />
            )}

            {viewMode === 'editor' && (
              <NoteEditor
                note={editingNote || undefined}
                onSave={handleSaveNote}
                onCancel={handleCancelEdit}
              />
            )}

            {viewMode === 'viewer' && selectedNote && (
              <NoteViewer
                note={selectedNote}
                onEdit={handleEditFromViewer}
                onDelete={handleDeleteFromViewer}
                onPin={handlePinNote}
                onUnpin={handleUnpinNote}
                onClose={handleCloseViewer}
              />
            )}
          </>
        )}

        {/* Offline Indicator */}
        {typeof window !== 'undefined' && !navigator.onLine && (
          <div className="fixed bottom-4 right-4 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg shadow-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
              🔌 Offline - Notes saved locally
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
