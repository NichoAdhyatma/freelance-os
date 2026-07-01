'use client';

import { ArrowRight, Copy, Mail, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { EditableRow, type CellDef, useEditableRow } from '@/components/shared/EditableRow';
import { TextCell } from '@/components/shared/EditableRow/cells/TextCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { openContextMenu } from '@/components/shared/RowContextMenu';
import type { Client, ClientFormData } from '@/types/client';

// ── Column Width Config ────────────────────────────────────────────────────────
export const CLIENT_COLUMNS = {
  index: 'w-8',
  name: 'w-48',
  company: 'w-40',
  contact: 'w-52',
  projects: 'w-20',
  actions: 'w-10',
} as const;

interface ClientRowProps {
  client: Client;
  index: number;
  projectCount: number;
  onSave: (id: string, data: Partial<ClientFormData>) => Promise<void>;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddNew: () => void;
  onNavigate: () => void;
}

type CellKey = 'name' | 'company' | 'contact';

export function ClientRow({
  client,
  index,
  projectCount,
  onSave,
  onDelete,
  onDuplicate,
  onAddNew,
  onNavigate,
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
      if (key === 'name' || key === 'company') {
        await onSave(client.id, {
          name: editName.trim() || client.name,
          company: editCompany.trim() || undefined,
          email: client.email ?? undefined,
          whatsapp: client.whatsapp ?? undefined,
        });
      }
    },
    resetEditState: (key) => {
      if (key === 'name') setEditName(client.name);
      if (key === 'company') setEditCompany(client.company ?? '');
      if (key === 'contact') { setEditEmail(client.email ?? ''); setEditWhatsapp(client.whatsapp ?? ''); }
    },
  });

  const handleSaveAll = async () => {
    if (!editName.trim()) { toast.error('Name is required'); return; }
    try {
      await onSave(client.id, {
        name: editName.trim(),
        company: editCompany.trim() || undefined,
        email: editEmail.trim() || undefined,
        whatsapp: editWhatsapp.trim() || undefined,
      });
      setEditingCell(null);
      toast.success('Client updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const cells: CellDef<CellKey>[] = [
    {
      key: 'name',
      width: CLIENT_COLUMNS.name,
      display: (
        <div className="w-full truncate px-2 py-1 rounded font-medium hover:text-primary hover:bg-accent/50">
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
        <div className="w-full truncate px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50">
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
      key: 'contact',
      width: CLIENT_COLUMNS.contact,
      display: (
        <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/50">
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[100px]">{client.email}</span>
            </a>
          )}
          {client.whatsapp && (
            <a
              href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground flex items-center text-xs hover:text-green-500"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] font-semibold">WA</span>
            </a>
          )}
          {!client.email && !client.whatsapp && (
            <span className="text-xs text-muted-foreground">Click to add</span>
          )}
        </div>
      ),
      edit: (
        <div className="flex flex-col gap-1">
          <Input
            autoFocus
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="email@example.com"
            type="email"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveAll();
              if (e.key === 'Escape') { revertCell('contact'); }
            }}
          />
          <Input
            value={editWhatsapp}
            onChange={(e) => setEditWhatsapp(e.target.value)}
            placeholder="+62 xxx"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveAll();
              if (e.key === 'Escape') { revertCell('contact'); }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <EditableRow
      cells={cells}
      index={index}
      isEditing={isEditing}
      onCellClick={startEditing}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
          { label: 'Add New Client', icon: <Plus className="h-4 w-4" />, onClick: onAddNew },
          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: onDelete },
        ]);
      }}
      actions={
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onPointerDown={(e) => { e.preventDefault(); onNavigate(); }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      }
    />
  );
}

// ── Client row: Projects cell (read-only) ────────────────────────────────────

export function ClientProjectsCell({ clientId, count }: { clientId: string; count: number }) {
  return count > 0 ? (
    <Link href={`/dashboard/clients/${clientId}`} className="text-primary hover:underline text-sm">
      {count}
    </Link>
  ) : (
    <span className="text-muted-foreground text-sm">0</span>
  );
}
