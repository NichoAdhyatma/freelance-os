'use client';

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SortableItem({ id, children, className }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-[opacity,transform] duration-200',
        isDragging && 'shadow-lg rounded-xl cursor-grabbing',
        className,
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

interface SortableGridProps<T extends { id: string }> {
  items: T[];
  onReorder: (newOrder: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  strategy?: 'vertical' | 'horizontal';
}

export function SortableGrid<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  strategy = 'vertical',
}: SortableGridProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...items];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    onReorder(newOrder);
  };

  const ids = items.map((item) => item.id);
  const listStrategy = strategy === 'vertical' ? verticalListSortingStrategy : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={listStrategy}>
        <div
          className={cn(
            strategy === 'horizontal' ? 'flex gap-3 overflow-x-auto' : 'flex flex-col gap-3',
            className,
          )}
          data-dragging={activeId !== null}
        >
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
            >
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}