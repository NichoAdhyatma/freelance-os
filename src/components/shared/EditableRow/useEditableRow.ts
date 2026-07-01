import { useCallback, useRef, useState } from 'react';

export interface EditableRowState<T extends string> {
  editingCell: T | null;
  isEditing: (key: T) => boolean;
  startEditing: (key: T) => void;
  revertCell: (key: T) => void;
}

interface UseEditableRowOptions<T extends string> {
  /** Current editing cell key */
  editingCell: T | null;
  /** Setter for editing cell */
  setEditingCell: (key: T | null) => void;
  /** Called before switching to a new cell — implement auto-save here */
  onSwitchCell?: (fromKey: T) => Promise<void>;
  /** Reset edit state for a given key back to original values */
  resetEditState?: (key: T) => void;
}

export function useEditableRow<T extends string>({
  editingCell,
  setEditingCell,
  onSwitchCell,
  resetEditState,
}: UseEditableRowOptions<T>): EditableRowState<T> {
  const switchInProgress = useRef(false);

  const isEditing = useCallback(
    (key: T) => editingCell === key,
    [editingCell],
  );

  const startEditing = useCallback(
    async (key: T) => {
      if (switchInProgress.current) return;
      if (editingCell === key) return;

      // Auto-save the currently editing cell before switching
      if (editingCell && onSwitchCell) {
        switchInProgress.current = true;
        try {
          await onSwitchCell(editingCell);
        } finally {
          switchInProgress.current = false;
        }
      }

      setEditingCell(key);
    },
    [editingCell, onSwitchCell, setEditingCell],
  );

  const revertCell = useCallback(
    (key: T) => {
      setEditingCell(null);
      resetEditState?.(key);
    },
    [setEditingCell, resetEditState],
  );

  return { editingCell, isEditing, startEditing, revertCell };
}