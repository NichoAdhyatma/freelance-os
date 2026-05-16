# Inline Excel-Style Row Editing — Auto-Save + Context Menu

> **Plan update:** No Save/Cancel buttons. Auto-save on blur. Icon `→` for detail. Delete via right-click context menu.

---

## UX Flow

| Action | Result |
|--------|--------|
| Click row | Row enters edit mode (all cells editable) |
| Click outside row | Auto-save + exit edit mode |
| Click `→` icon | Save + navigate to `/dashboard/projects/[id]` |
| Press Escape | Cancel changes + exit edit mode |
| Right-click row | Context menu: Delete Project |
| Tab through fields | Works normally |

---

## Approach

### Auto-save: `onFocusOut` on `<tr>`

In `ProjectInlineRow`, add a `rowRef` and `onFocusOut` handler:

```tsx
const rowRef = useRef<HTMLTableRowElement>(null);

const handleFocusOut = (e: React.FocusEvent) => {
  // relatedTarget = where focus is going. If outside the row → blur-save
  if (!rowRef.current?.contains(e.relatedTarget as Node)) {
    handleSaveAndExit();
  }
};

<tr ref={rowRef} onFocusOut={handleFocusOut}>
```

`handleSaveAndExit()` = call `onSave()` then call `onCancel()` (parent exits edit mode).

### Navigate: `onPointerDown` on `→` button

```tsx
<Button
  onPointerDown={(e) => {
    e.preventDefault(); // prevents blur from firing
    handleSaveAndNavigate();
  }}
>
```

Fires BEFORE blur → prevents double-save.

### Delete: `onContextMenu` on `TableRow` in `page.tsx`

Uses existing `openContextMenu` pattern (already in dashboard layout):

```tsx
<TableRow
  onContextMenu={(e) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, [
      { label: 'Delete Project', destructive: true, onClick: () => handleDelete(project.id) }
    ]);
  }}
>
```

---

## File Changes

### `ProjectInlineRow.tsx` — Remove buttons, add auto-save

- Remove ✅❌ Button components from Actions cell
- Remove `onCancel` usage from `handleKeyDown` (Escape now calls `onCancel()` directly)
- Add `rowRef` and `handleFocusOut`
- Add `handleSaveAndExit()` that calls `onSave()` then `onCancel()`
- Add navigation button (`ArrowRight` icon from lucide-react) with `onPointerDown`
- Escape key → `onCancel()`
- `onSave` callback gets `{ title, clientId, priority, budget, progress, deadline, status }`

### `page.tsx` — Replace Actions buttons

- Replace pencil + trash `<Button>` pair with single `<Link>` + `onPointerDown` + `onContextMenu`
- `→` icon: `ArrowRight` from lucide-react
- `onPointerDown`: saves then navigates via `router.push()`
- `onContextMenu`: calls `openContextMenu` with Delete option
- Remove unused `handleEditInline`, `handleCancelEdit` functions (already done in Task 2)

### `InlineAddClientCard.tsx` — No changes

---

## State: Escape → Cancel

When Escape is pressed, `onCancel()` is called. The parent (`page.tsx`) sets `editingProjectId = null`. This is the cancel flow — no Firestore update.

---

## Implementation Tasks

1. **`ProjectInlineRow.tsx`** — remove ✅❌ buttons, add `rowRef`, `onFocusOut`, `handleSaveAndExit`, navigation button with `onPointerDown`
2. **`page.tsx`** — replace pencil/trash with `→` + `onContextMenu` for delete
3. **Verify** — type check + manual test