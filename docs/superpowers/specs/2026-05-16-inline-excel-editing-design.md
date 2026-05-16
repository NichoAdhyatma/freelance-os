# Freelancer OS — Inline Excel-Style Row Editing

## Context

**Why:** Pengguna Freelancer OS saat ini harus klik button untuk membuka edit mode. UX tidak seamless — berbeda dengan Excel atau Notion yang langsung editable dengan single-click.

**Goal:** Ubah behavior Projects table menjadi Excel-style: 1 klik pada row → seluruh row langsung editable. Text cell jadi input, dropdown cell jadi combo. Auto-save on blur/click outside.

---

## Design

### Behavior

| Action | Result |
|--------|--------|
| Single-click row | Row enters edit mode. All editable cells transform to inputs. Save/Cancel buttons appear in Actions column. |
| Single-click cell in edit mode | Focus that cell's input/combo |
| Click outside any cell in edit mode | Auto-save to Firestore → row exits edit mode |
| Press Escape | Cancel changes → revert to original values → row exits edit mode |
| Enter on Title cell | Auto-save → row exits edit mode |

### Editable Cells & Their Types

| Column | Display Mode | Edit Mode |
|--------|-------------|-----------|
| Title | Text (truncated) | `<Input>` — auto-focused on row click |
| Client | Client name | `<Select>` dropdown |
| Priority | Badge | `<Select>` dropdown |
| Budget | IDR format | `<Input type="number">` — numeric input with IDR formatting |
| Progress | Progress bar + % | `<Input type="number" min="0" max="100">` + immediate `<Progress>` bar update |
| Deadline | Date string | `<Popover>` + `<Calendar>` |
| Actions | ✏️ pencil icon | ✅ Save + ❌ Cancel buttons |

### Budget Edit — UX Detail
- Input shows raw number (e.g. `1500000`)
- On blur/focusout: format to IDR (e.g. `Rp 1.500.000`) for display
- Accepts numeric input only — non-numeric characters stripped automatically
- Empty or `0` → shows `—` in display mode

### Progress Edit — UX Detail
- `<input type="number" min="0" max="100">` — user types or clears
- `<Progress>` bar updates immediately as user types (live preview)
- `%` suffix shown inside input on blur
- If invalid (< 0 or > 100), clamp to valid range.

### Save Flow
1. User klik row → row enters edit mode. Title input auto-focused.
2. User edit 1+ cells (Title, Client, Priority, Deadline)
3. User triggers save:
   - **Enter** on Title → save & exit
   - **Click outside row** (on header, another row, backdrop) → save & exit
   - Trigger `handleSaveInlineEdit(projectId, formData)` → updates Firestore → `toast.success('Project updated')` → row exits edit mode

### Cancel Flow
1. User klik row → row enters edit mode
2. User edit cells
3. User press Escape:
   - Discard all local state changes
   - `toast.info('Changes discarded')` (subtle, optional)
   - Row exits edit mode

### New Project Row (Add Mode)
- Always in edit mode (all cells editable)
- No auto-save trigger on outside-click — user MUST click ✅ or ❌
- This is intentional: new rows need explicit save action

### State Management

```
// useProjects hook — add these functions:
editProjectInline(projectId: string, data: Partial<ProjectFormData>): Promise<void>
```

### Edit Mode Activation
Instead of `editingProjectId` state, use per-row `editing` boolean:

```tsx
// projects/page.tsx
const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
// edit mode aktif jika editingProjectId === project.id
```

---

## Component Changes

### ProjectInlineRow
- `mode: 'add' | 'edit'`
- In `edit` mode: all cells always editable (no per-cell `editingCell` state)
- Title input gets `autoFocus` when row enters edit mode
- Accepts `onRowClick` to signal parent to enter edit mode

### projects/page.tsx
- Row click handler: `onClick={() => setEditingProjectId(project.id)}`
- Row blur/focusout handler: saves & exits edit mode
- Separate edit-mode `<ProjectInlineRow mode="edit">` rendered in a dedicated edit slot

### Edit Row Positioning
The edit row replaces the display row at the same position — no moving around. When `editingProjectId` is set, the target row transforms from display → edit (no second row appended). This keeps the UX clean and the row anchored.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/dashboard/projects/page.tsx` | Row click handler, blur save, edit mode state management |
| `src/components/projects/ProjectInlineRow.tsx` | Simplified: in `edit` mode, all cells always editable. Remove per-cell `editingCell` state. |
| `src/hooks/useProjects.ts` | Add `editProjectInline` function |

---

## Verification

1. Klik "New Project" → inline add row (already works)
2. Klik 1x pada row project → row langsung editable (Title focused)
3. Semua cell (Title, Client, Priority, Budget, Progress, Deadline) berubah jadi input/select
4. Edit Budget → number input, blur → format ke IDR display
5. Edit Progress → number input, progress bar live preview
6. Klik di luar row → auto-save, row kembali ke display
7. Tekan Escape → cancel, row kembali ke display
8. Tekan Enter di Title → save, row kembali ke display
9. Klik row lain saat satu row lagi di-edit → row sebelumnya auto-save, row baru masuk edit mode