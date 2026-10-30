'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/app/field';

export function LoginForm() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Sign-in failed');
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed');
      setBusy(false);
    }
  }

  return (
    <Card className="py-6">
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Admin token">
            <Input type="password" autoFocus autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_TOKEN from the API .env" />
          </Field>
          <Button type="submit" disabled={busy || !token}>{busy && <Loader2 className="animate-spin" />} Sign in</Button>
        </form>
      </CardContent>
    </Card>
  );
}
