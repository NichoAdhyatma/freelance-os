'use client';

import { Camera, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { BankDetails } from '@/types/user';

export function ProfileForm() {
  const { userProfile, updateProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name ?? '');
  const [avatar, setAvatar] = useState(userProfile?.avatar ?? '');
  const [company, setCompany] = useState(userProfile?.company ?? '');
  const [phone, setPhone] = useState(userProfile?.phone ?? '');
  const [address, setAddress] = useState(userProfile?.address ?? '');
  const [logo, setLogo] = useState(userProfile?.logo ?? '');

  // Bank details
  const [bankName, setBankName] = useState(userProfile?.bankDetails?.bankName ?? '');
  const [accountName, setAccountName] = useState(userProfile?.bankDetails?.accountName ?? '');
  const [accountNumber, setAccountNumber] = useState(userProfile?.bankDetails?.accountNumber ?? '');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Nama minimal 2 karakter');
      return;
    }

    setSaving(true);
    try {
      const bankDetails: BankDetails = {};
      if (bankName.trim()) bankDetails.bankName = bankName.trim();
      if (accountName.trim()) bankDetails.accountName = accountName.trim();
      if (accountNumber.trim()) bankDetails.accountNumber = accountNumber.trim();

      await updateProfile({
        name: name.trim(),
        avatar: avatar.trim() || undefined,
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        logo: logo.trim() || undefined,
        bankDetails: Object.keys(bankDetails).length > 0 ? bankDetails : undefined,
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

      {/* Company input */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="company-name">
          Nama Bisnis / Company
        </label>
        <Input
          id="company-name"
          placeholder="Contoh: Studio Kreatif ABC"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Ditampilkan di invoice sebagai pengirim.
        </p>
      </div>

      {/* Phone & Address */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="phone">
            Telepon
          </label>
          <Input
            id="phone"
            placeholder="+62 812 xxxx xxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="address">
            Alamat
          </label>
          <Input
            id="address"
            placeholder="Jakarta, Indonesia"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>

      {/* Logo URL */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="logo-url">
          Logo Bisnis
        </label>
        <Input
          id="logo-url"
          placeholder="https://example.com/logo.png"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
        />
        {logo && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={logo}
              alt="Logo preview"
              className="h-12 w-auto rounded border bg-white p-1"
              onError={() => setLogo('')}
            />
            <span className="text-xs text-muted-foreground">Preview logo</span>
          </div>
        )}
        <p className="text-muted-foreground text-xs">
          URL logo untuk ditampilkan di invoice PDF.
        </p>
      </div>

      {/* Bank Details Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <h3 className="text-sm font-semibold">Informasi Bank</h3>
        <p className="text-xs text-muted-foreground -mt-2">
          Ditampilkan di invoice untuk menerima pembayaran.
        </p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="bank-name">
            Nama Bank
          </label>
          <Input
            id="bank-name"
            placeholder="Contoh: BCA, Mandiri, BNI, GoPay"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="account-name">
            Nama Pemilik Rekening
          </label>
          <Input
            id="account-name"
            placeholder="Nama sesuai di rekening"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="account-number">
            Nomor Rekening
          </label>
          <Input
            id="account-number"
            placeholder="1234567890"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>
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