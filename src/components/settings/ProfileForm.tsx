'use client';

import { Camera, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function ProfileForm() {
  const { userProfile, updateProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name ?? '');
  const [avatar, setAvatar] = useState(userProfile?.avatar ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Nama minimal 2 karakter');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatar: avatar.trim() || undefined,
      });
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || userProfile?.name?.slice(0, 2).toUpperCase() || 'U';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar preview"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
              onError={() => setAvatar('')}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-lg font-semibold ring-2 ring-border">
              {initials}
            </div>
          )}
          <div className="bg-muted absolute -bottom-1 -right-1 rounded-full p-1">
            <Camera className="text-muted-foreground h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium">Foto Profil</p>
          <p className="text-muted-foreground text-xs">Link gambar untuk avatar</p>
        </div>
      </div>

      {/* Avatar URL input */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="avatar-url">
          Avatar URL
        </label>
        <Input
          id="avatar-url"
          placeholder="https://example.com/avatar.jpg"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Paste URL gambar. Kosongkan untuk menggunakan inisial.
        </p>
      </div>

      {/* Name input */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="display-name">
          Nama
        </label>
        <Input
          id="display-name"
          placeholder="Nama lengkap kamu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}