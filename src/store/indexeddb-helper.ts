/**
 * IndexedDB Helper Utility
 * Manages IndexedDB operations for notes storage
 */

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const DB_NAME = 'ai-research-academy-db';
const DB_VERSION = 1;
const NOTES_STORE_NAME = 'notes';

// ============================================================================
// TYPES
// ============================================================================

interface DBNote {
  id: string;
  title: string;
  content: string;
  topicId?: string;
  category?: 'math' | 'ml' | 'cv' | 'llm' | 'research';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize and open IndexedDB connection
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create notes object store if it doesn't exist
      if (!db.objectStoreNames.contains(NOTES_STORE_NAME)) {
        const notesStore = db.createObjectStore(NOTES_STORE_NAME, {
          keyPath: 'id',
        });

        // Create indexes for efficient querying
        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        notesStore.createIndex('category', 'category', { unique: false });
        notesStore.createIndex('topicId', 'topicId', { unique: false });
        notesStore.createIndex('isPinned', 'isPinned', { unique: false });
      }
    };
  });
};

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all notes from IndexedDB
 */
export const getAllNotes = async (): Promise<DBNote[]> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE_NAME, 'readonly');
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get notes'));
    };
  });
};

/**
 * Get a single note by ID
 */
export const getNoteById = async (id: string): Promise<DBNote | undefined> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE_NAME, 'readonly');
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get note'));
    };
  });
};

/**
 * Add a new note to IndexedDB
 */
export const addNote = async (note: DBNote): Promise<void> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.add(note);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to add note'));
    };
  });
};

/**
 * Update an existing note in IndexedDB
 */
export const updateNote = async (note: DBNote): Promise<void> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.put(note);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to update note'));
    };
  });
};

/**
 * Delete a note from IndexedDB
 */
export const deleteNote = async (id: string): Promise<void> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete note'));
    };
  });
};

/**
 * Clear all notes from IndexedDB
 */
export const clearAllNotes = async (): Promise<void> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear notes'));
    };
  });
};

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get notes by category
 */
export const getNotesByCategory = async (
  category: string
): Promise<DBNote[]> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE_NAME, 'readonly');
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const index = store.index('category');
    const request = index.getAll(category);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get notes by category'));
    };
  });
};

/**
 * Get notes by topic ID
 */
export const getNotesByTopic = async (topicId: string): Promise<DBNote[]> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE_NAME, 'readonly');
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const index = store.index('topicId');
    const request = index.getAll(topicId);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get notes by topic'));
    };
  });
};

/**
 * Get pinned notes
 */
export const getPinnedNotes = async (): Promise<DBNote[]> => {
  const allNotes = await getAllNotes();
  return allNotes.filter((note) => note.isPinned === true);
};
