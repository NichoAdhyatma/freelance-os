# Freelancer OS — Project Tasks Kanban Design Spec

**Date:** 2026-05-14
**Project:** Freelancer OS
**Status:** Approved

---

## Overview

Membuat task management system di dalam project. Setiap project punya dedicated detail page dengan task kanban board (drag-and-drop). Project progress auto-calculated dari task completion.

---

## UX Philosophy

**Hybrid approach:** Project status tetap independent (managed manual), tapi task completion mempengaruhi project `progress` field (0–100%). Formula: `(done tasks / total tasks) × 100`.

---

## Data Model

### Task Collection
**Firestore path:** `users/{uid}/projects/{projectId}/tasks/{taskId}`

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  dueDate?: Timestamp;
  order: number; // for drag ordering within column
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Task kanban columns:** Todo | In Progress | Done

### Progress Sync
- `useTasks` hook recalculates progress whenever tasks change
- Formula: `(tasks with status "done" / total tasks) × 100`
- Updates `project.progress` via `projectService.updateProjectProgress()` — fire-and-forget

---

## Pages & Components

### 1. Project Detail Page
**URL:** `/dashboard/projects/[id]`
**File:** `src/app/dashboard/projects/[id]/page.tsx`

Layout:
```
┌─────────────────────────────────────────┐
│ ← Projects  |  [Project Title]  | Edit  │
├─────────────────────────────────────────┤
│ [4 stat cards: Progress, Tasks, Due, $] │
├─────────────────────────────────────────┤
│ [Tasks] [Details] [Notes]               │
├─────────────────────────────────────────┤
│ [Task Kanban Board — 3 columns]          │
└─────────────────────────────────────────┘
```

Tabs:
- **Tasks** — Kanban board (default)
- **Details** — Project info: title, description, client, deadline, budget, priority, status
- **Notes** — Project notes

### 2. Task Kanban Board
**File:** `src/components/projects/TaskKanban.tsx`
**Library:** `@dnd-kit/core` + `@dnd-kit/sortable`

Columns: Todo | In Progress | Done

**Drag behavior:**
- Drag task between columns → update `status` in Firestore
- Drag within column → update `order` field
- Both fire immediately to Firestore

**Add task inline:**
- Click `+` in any column → inline Input field
- Type title + Enter → create task with that column's status
- Escape → cancel

### 3. Projects Page — Table Grid
**File:** `src/app/dashboard/projects/page.tsx`

Replaces Kanban/List tabs with table grid view.

Columns: No | Title | Client | Status | Priority | Progress | Deadline | Actions

- Status is inline dropdown (change without opening detail)
- Progress is progress bar (0–100%)
- Actions: edit, delete
- Client name resolved from `useClients`
- Deadline shows warning icon if overdue

### 4. ProjectCard → Clickable
**File:** `src/components/projects/ProjectCard.tsx`

- Click anywhere on card → navigate to `/dashboard/projects/[id]`
- Stop propagation on action buttons (edit, delete, status change)

---

## File Inventory

### New Files
| File | Description |
|---|---|
| `src/types/task.ts` | Task type definition |
| `src/lib/services/taskService.ts` | Task CRUD + real-time subscription |
| `src/hooks/useTasks.ts` | React hook for task management |
| `src/components/projects/TaskCard.tsx` | Task card for kanban (drag handle, priority badge, due date) |
| `src/components/projects/TaskKanban.tsx` | DnD kanban board with 3 columns |
| `src/components/projects/TaskForm.tsx` | Add/edit task dialog |
| `src/app/dashboard/projects/[id]/page.tsx` | Project detail page |

### Modified Files
| File | Change |
|---|---|
| `src/components/projects/ProjectCard.tsx` | Clickable navigation to detail |
| `src/app/dashboard/projects/page.tsx` | Replace Kanban/List with table grid |
| `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

---

## Firestore Indexes

```json
// firestore.indexes.json — add to existing
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "order", "order": "ASCENDING" }]
    }
  ]
}
```

Note: Task collection is a subcollection under `projects/{projectId}`, so it inherits the parent document's owner. No special security rules needed — same as existing subcollection rules.

---

## Implementation Order

1. Install: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
2. `taskService.ts` + `useTasks.ts` — CRUD + subscription + progress sync
3. `TaskCard.tsx` — static card (no drag)
4. `TaskKanban.tsx` — columns + inline add (no drag yet)
5. `TaskForm.tsx` — add/edit dialog
6. Drag-and-drop logic in `TaskKanban.tsx` (use @dnd-kit)
7. Progress sync in `useTasks` → auto-update `project.progress`
8. `projects/[id]/page.tsx` — detail page with tabs + kanban
9. `ProjectCard.tsx` — clickable navigation
10. Update `projects/page.tsx` — table grid view

---

## Constraints

- Use `@dnd-kit` (not `react-beautiful-dnd` — deprecated)
- Only drag via drag handle (6-dot icon on left of card)
- Fire-and-forget on progress sync (don't block task operations)
- Dark mode styling throughout
- Same pattern as existing services (subscribeToX, createX, updateX, deleteX)