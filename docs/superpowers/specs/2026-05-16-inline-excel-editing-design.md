# Freelancer OS — Inline Excel-Style Row Editing (Cell-Level)

## Context

**Goal:** Click any cell → that cell becomes editable immediately. No row-level edit mode. No ✅❌ buttons. Per-cell save on Enter/blur, revert on Escape.

## Design

### Behavior

| Action | Result |
|--------|--------|
| Click any cell in display row | That cell becomes editable (Input/Select/Popover) |
| Press Enter on editable cell | Save that cell, revert to display |
| Blur / focus leaves editable cell | Save that cell, revert to display |
| Press Escape | Revert to original value, revert to display |
| Click `→` icon in Actions | Save that cell + navigate to detail |
| Right-click row | Context menu: Delete Project |
| Click New Project | Full add row (all cells editable, explicit ✅) |

### Per-Cell Edit State

Each cell in the display row is independent. Editing is cell-level, not row-level.

| Column | Display | Edit |
|--------|---------|------|
| Title | `<span>` clickable | `<Input>` — auto-focus, Enter/blur save |
| Client | `<span>` clickable | `<Select>` — blur saves |
| Priority | Badge clickable | `<Select>` — blur saves |
| Budget | IDR string clickable | `<Input type="number">` — Enter/blur saves |
| Progress | % + bar clickable | `<Input type="number">` + bar — Enter/blur saves |
| Deadline | Date string clickable | `<Popover+Calendar>` — blur saves |
| Actions | `→` icon | Same in add row |

### State Architecture

**page.tsx** — no edit state:
- `addingRow` — controls add row visibility
- `addClientInline` — controls add client card
- `pendingClientId` — for client creation flow
- No `editingProjectId` — row-level edit state is gone

**ProjectInlineRow** — per-cell edit:
- `editingCell: CellKey | null` — which cell is being edited
- Each editable cell has local state: `editTitle`, `editClient`, etc.
- `originalValues: RefObject` — stores pre-edit values for Escape revert
- When `editingCell` is set → that cell renders editable, others render display
- When `editingCell` is null → all cells render display

### Save Flow (Per-Cell)

```
Click cell → setEditingCell('title')
  → Cell renders Input, autoFocus
  → User edits
  → Enter/blur → call onSave({ title: newValue })
    → Firestore update
    → toast.success
    → setEditingCell(null)
  → OR Escape → revert originalValues → setEditingCell(null)
```

### Add Row (New Project)

Always full row editable — all cells are Input/Select. Explicit ✅❌ buttons.
This is intentional — new rows need explicit save action (no partial saves).

### Files to Modify

| File | Changes |
|------|---------|
| `src/app/dashboard/projects/page.tsx` | Remove `editingProjectId` state. Remove `handleEditSubmitInline`. Update add row to full editable. Add `→` nav button with `onPointerDown`. Keep `onContextMenu` for delete. |
| `src/components/projects/ProjectInlineRow.tsx` | Complete rewrite: per-cell edit state, display cells clickable, editable cells with local state + onBlur/Enter save, Escape revert, remove ✅❌ buttons from edit row |
| `src/components/clients/InlineAddClientCard.tsx` | No changes |

## Verification

1. Klik cell Title → input auto-focus, edit, Enter/blur → save ✅
2. Klik cell Client → Select open, pilih → blur → save ✅
3. Klik cell Priority → Select open, pilih → blur → save ✅
4. Klik cell Budget → number input, ketik, Enter/blur → save ✅
5. Klik cell Progress → number input + bar live preview, Enter/blur → save ✅
6. Klik cell Deadline → calendar, pilih tanggal → blur → save ✅
7. Escape saat edit cell → revert ke nilai asli ✅
8. Klik `→` → save cell + navigate ✅
9. Right-click row → Delete Project ✅
10. New Project → full editable row + ✅❌ buttons ✅