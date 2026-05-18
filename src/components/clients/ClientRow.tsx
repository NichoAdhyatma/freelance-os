'use client';

import { ArrowRight, Copy, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { openContextMenu } from '@/components/shared/RowContextMenu';
import type { Client, ClientFormData } from '@/types/client';
import { Mail } from 'lucide-react';
import Link from 'next/link';

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
  type CellKey = 'name' | 'company' | 'contact' | null;

  const [activeCell, setActiveCell] = useState<CellKey>(null);
  const [editName, setEditName] = useState(client.name);
  const [editCompany, setEditCompany] = useState(client.company ?? '');
  const [editEmail, setEditEmail] = useState(client.email ?? '');
  const [editWhatsapp, setEditWhatsapp] = useState(client.whatsapp ?? '');
  const wasFocusedRef = useRef(false);

  const activate = (key: CellKey) => {
    // Auto-save name + company when switching away to another cell
    if (activeCell === 'name' || activeCell === 'company') {
      const finalName = editName.trim() || client.name;
      const finalCompany = editCompany.trim();
      onSave(client.id, {
        name: finalName,
        company: finalCompany || undefined,
        email: client.email ?? undefined,
        whatsapp: client.whatsapp ?? undefined,
      }).catch(() => {});
      setEditName(client.name);
      setEditCompany(client.company ?? '');
    }
    setActiveCell(key);
    if (key === 'contact') { setEditEmail(client.email ?? ''); setEditWhatsapp(client.whatsapp ?? ''); }
  };

  const handleSave = async () => {
    if (!editName.trim()) { toast.error('Name is required'); return; }
    try {
      await onSave(client.id, {
        name: editName.trim(),
        company: editCompany.trim() || undefined,
        email: editEmail.trim() || undefined,
        whatsapp: editWhatsapp.trim() || undefined,
      });
      setActiveCell(null);
      toast.success('Client updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleCancel = () => {
    setEditName(client.name);
    setEditCompany(client.company ?? '');
    setEditEmail(client.email ?? '');
    setEditWhatsapp(client.whatsapp ?? '');
    setActiveCell(null);
  };

  return (
    <TableRow
      className="border-b border-border hover:bg-accent/50"
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
          { label: 'Add New Client', icon: <Plus className="h-4 w-4" />, onClick: onAddNew },
          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: onDelete },
        ]);
      }}
    >
      {/* # */}
      <TableCell className="w-8 border-r border-border py-3 pl-4 pr-2 text-muted-foreground text-sm">
        {index}
      </TableCell>

      {/* Name */}
      <TableCell className="w-fit border-r border-border py-3 pr-2" onClick={(e) => e.stopPropagation()}>
        {activeCell === 'name' ? (
          <Input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            onBlur={() => {
                if (!wasFocusedRef.current) return;
                wasFocusedRef.current = false;
                handleSave();
              }}
              onFocus={() => { wasFocusedRef.current = true; }}
          />
        ) : (
          <span
            className="block cursor-pointer font-medium hover:text-primary"
            onClick={() => activate('name')}
          >
            {client.name}
          </span>
        )}
      </TableCell>

      {/* Company */}
      <TableCell className="w-fit border-r border-border py-3 pr-2 text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {activeCell === 'company' ? (
          <Input
            autoFocus
            value={editCompany}
            onChange={(e) => setEditCompany(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            onBlur={() => {
                if (!wasFocusedRef.current) return;
                wasFocusedRef.current = false;
                handleSave();
              }}
              onFocus={() => { wasFocusedRef.current = true; }}
          />
        ) : (
          <span
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => activate('company')}
          >
            {client.company || '—'}
          </span>
        )}
      </TableCell>

      {/* Contact */}
      <TableCell className="border-r border-border py-3" onClick={(e) => e.stopPropagation()}>
        {activeCell === 'contact' ? (
          <div className="flex flex-col gap-1">
            <Input
              autoFocus
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="email@example.com"
              type="email"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <Input
              value={editWhatsapp}
              onChange={(e) => setEditWhatsapp(e.target.value)}
              placeholder="+62 xxx"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
          </div>
        ) : (
          <div
            className="flex items-center gap-2"
            onClick={() => activate('contact')}
          >
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{client.email}</span>
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
                <span className="text-[10px]">WA</span>
              </a>
            )}
            {!client.email && !client.whatsapp && (
              <span className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Click to add
              </span>
            )}
          </div>
        )}
      </TableCell>

      {/* Projects */}
      <TableCell className="border-r border-border py-3 text-sm" onClick={(e) => e.stopPropagation()}>
        {projectCount > 0 ? (
          <Link
            href={`/dashboard/clients/${client.id}`}
            className="text-primary hover:underline"
          >
            {projectCount}
          </Link>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="py-3 pr-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onPointerDown={(e) => { e.preventDefault(); onNavigate(); }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
