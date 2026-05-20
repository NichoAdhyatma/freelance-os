import { Pencil } from 'lucide-react';
import { type ReactNode } from 'react';

interface EditableCellProps {
  children: ReactNode;
  onEdit: () => void;
}

export function EditableCell({ children, onEdit }: EditableCellProps) {
  return (
    <div
      className="group relative flex items-center gap-1 cursor-pointer"
      onClick={onEdit}
    >
      <span className="group-hover:opacity-60 transition-opacity">
        {children}
      </span>
      <Pencil
        className="invisible group-hover:visible h-3 w-3 text-muted-foreground ml-1 shrink-0 transition-all"
        style={{ opacity: 0 }}
      />
    </div>
  );
}