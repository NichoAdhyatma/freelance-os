'use client';

import { Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { EditableRow, type CellDef, useEditableRow } from '@/components/shared/EditableRow';
import { TextCell } from '@/components/shared/EditableRow/cells/TextCell';
import { Input } from '@/components/ui/input';
import { openContextMenu } from '@/components/shared/RowContextMenu';
import type { Client, ClientFormData } from '@/types/client';

// ── Column Width Config ────────────────────────────────────────────────────────
export const CLIENT_COLUMNS = {
  index: 'w-8',
  name: 'flex-1',
  company: 'w-40',
  email: 'w-48',
  whatsapp: 'w-40',
  actions: 'w-20',
} as const;

interface ClientRowProps {
  client: Client;
  index: number;
  showActions?: boolean;
  onSave: (id: string, data: Partial<ClientFormData>) => Promise<void>;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddNew: () => void;
  onOpen: () => void;
}

type CellKey = 'name' | 'company' | 'email' | 'whatsapp';

export function ClientRow({
  client,
  index,
  showActions = true,
  onSave,
  onDelete,
  onDuplicate,
  onAddNew,
  onOpen,
}: ClientRowProps) {
  const [editingCell, setEditingCell] = useState<CellKey | null>(null);
  const [editName, setEditName] = useState(client.name);
  const [editCompany, setEditCompany] = useState(client.company ?? '');
  const [editEmail, setEditEmail] = useState(client.email ?? '');
  const [editWhatsapp, setEditWhatsapp] = useState(client.whatsapp ?? '');

  const { isEditing, startEditing, revertCell } = useEditableRow<CellKey>({
    editingCell,
    setEditingCell,
    onSwitchCell: async (key) => {
      if (key === 'name' || key === 'company' || key === 'email' || key === 'whatsapp') {
        await onSave(client.id, {
          name: editName.trim() || client.name,
          company: editCompany.trim() || undefined,
          email: editEmail.trim() || undefined,
          whatsapp: editWhatsapp.trim() || undefined,
        });
      }
    },
    resetEditState: (key) => {
      if (key === 'name') setEditName(client.name);
      if (key === 'company') setEditCompany(client.company ?? '');
      if (key === 'email') setEditEmail(client.email ?? '');
      if (key === 'whatsapp') setEditWhatsapp(client.whatsapp ?? '');
    },
  });

  const handleSaveAll = async () => {
    if (!editName.trim()) { toast.error('Nama harus diisi'); return; }
    try {
      await onSave(client.id, {
        name: editName.trim(),
        company: editCompany.trim() || undefined,
        email: editEmail.trim() || undefined,
        whatsapp: editWhatsapp.trim() || undefined,
      });
      setEditingCell(null);
      toast.success('Client diupdate');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const cells: CellDef<CellKey>[] = [
    {
      key: 'name',
      width: CLIENT_COLUMNS.name,
      display: (
        <div className="w-full truncate px-2 py-1 rounded font-medium">
          {client.name}
        </div>
      ),
      edit: (
        <TextCell
          value={editName}
          onSave={async (v) => { await onSave(client.id, { name: v }); setEditingCell(null); }}
          onRevert={() => revertCell('name')}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: 'company',
      width: CLIENT_COLUMNS.company,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-muted-foreground">
          {client.company || '—'}
        </div>
      ),
      edit: (
        <TextCell
          value={editCompany}
          onSave={async (v) => { await onSave(client.id, { company: v || undefined }); setEditingCell(null); }}
          onRevert={() => revertCell('company')}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: 'email',
      width: CLIENT_COLUMNS.email,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-muted-foreground text-xs">
          {client.email || <span className="text-muted-foreground/30">—</span>}
        </div>
      ),
      edit: (
        <Input
          autoFocus
          value={editEmail}
          onChange={(e) => setEditEmail(e.target.value)}
          placeholder="email@example.com"
          type="email"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveAll();
            if (e.key === 'Escape') { revertCell('email'); }
          }}
        />
      ),
    },
    {
      key: 'whatsapp',
      width: CLIENT_COLUMNS.whatsapp,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-muted-foreground text-xs">
          {client.whatsapp || <span className="text-muted-foreground/30">—</span>}
        </div>
      ),
      edit: (
        <Input
          autoFocus
          value={editWhatsapp}
          onChange={(e) => setEditWhatsapp(e.target.value)}
          placeholder="+62 xxx"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveAll();
            if (e.key === 'Escape') { revertCell('whatsapp'); }
          }}
        />
      ),
    },
  ];

  return (
    <EditableRow
      cells={cells}
      index={index}
      showActions={showActions}
      isEditing={isEditing}
      onCellClick={startEditing}
      onDoubleClick={onOpen}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
          { label: 'Open', icon: <ExternalLink className="h-4 w-4" />, onClick: onOpen },
          { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => startEditing('name') },
          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: onDelete },
        ]);
      }}
      actions={<span className="text-xs text-muted-foreground/50 pr-2">{index}</span>}
    />
  );
}
