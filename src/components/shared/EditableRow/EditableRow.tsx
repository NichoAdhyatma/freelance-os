'use client';

import React from 'react';
import { Pencil } from 'lucide-react';
import type { ReactNode, MouseEvent } from 'react';

import { TableCell, TableRow } from '@/components/ui/table';
import { ClientSelectCell } from './cells/SelectCell';
import { PopoverCell } from './cells/PopoverCell';
import { SelectCell } from './cells/SelectCell';

export interface CellDef<T extends string> {
  key: T;
  display: ReactNode;
  edit: ReactNode | null;
  width: string;
  editable?: boolean;
}

interface EditableRowProps<T extends string> {
  cells: CellDef<T>[];
  index: number;
  onContextMenu?: (e: MouseEvent) => void;
  actions?: ReactNode;
  rowHeight?: string;
  isEditing?: (key: T) => boolean;
  onCellClick?: (key: T) => void;
}

export function EditableRow<T extends string>({
  cells,
  index,
  onContextMenu,
  actions,
  rowHeight = 'h-12',
  isEditing,
  onCellClick,
}: EditableRowProps<T>) {
  return (
    <TableRow
      className={`border-b border-border hover:bg-accent/50 ${rowHeight}`}
      onContextMenu={onContextMenu}
    >
      <TableCell className="w-8 border-r border-border py-2 pl-4 pr-2 text-muted-foreground text-sm h-full shrink-0">
        {index}
      </TableCell>
      {cells.map((cell) => (
        <TableCell
          key={cell.key}
          className={`${cell.width} border-r border-border py-2 pr-2 h-full overflow-hidden shrink-0`}
        >
          <div className="group relative w-full h-full flex items-center">
            <CellContent
              cell={cell}
              isEditMode={isEditing?.(cell.key)}
              onCellClick={onCellClick}
            />
            {cell.editable !== false && (
              <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
            )}
          </div>
        </TableCell>
      ))}
      <TableCell className="w-10 py-2 pr-4 h-full shrink-0">
        {actions}
      </TableCell>
    </TableRow>
  );
}

function isSelectCell(el: React.ReactElement): boolean {
  const type = el.type as any;
  return type === SelectCell || type === ClientSelectCell || type === PopoverCell;
}

/** Select/Popover always render. Text/input cells only in edit mode. */
function CellContent({
  cell,
  isEditMode,
  onCellClick,
}: {
  cell: CellDef<string>;
  isEditMode?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCellClick?: any;
}) {
  if (!cell.edit) {
    return (
      <div className="w-full flex items-center" onClick={(e) => { e.stopPropagation(); onCellClick?.(cell.key); }}>
        {cell.display}
      </div>
    );
  }
  if (typeof cell.edit !== 'object') {
    return isEditMode ? cell.edit : (
      <div className="w-full flex items-center" onClick={(e) => { e.stopPropagation(); onCellClick?.(cell.key); }}>
        {cell.display}
      </div>
    );
  }

  const el = cell.edit as React.ReactElement<any>;

  if (isSelectCell(el)) {
    // Defer state update so popup can open before React re-renders
    const handleTrigger = () => { queueMicrotask(() => onCellClick?.(cell.key)); };
    return React.cloneElement<any>(el, { onTriggerEdit: handleTrigger });
  }

  // TextCell etc: show display, click enters edit mode
  return isEditMode ? React.cloneElement(el, {}) : (
    <div className="w-full flex items-center" onClick={(e) => { e.stopPropagation(); onCellClick?.(cell.key); }}>
      {cell.display}
    </div>
  );
}
