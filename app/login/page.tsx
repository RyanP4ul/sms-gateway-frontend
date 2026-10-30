import type { Metadata } from 'next';
import { Radio } from 'lucide-react';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '44px 44px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Radio className="size-5" /></div>
          <div>
            <h1 className="text-lg leading-tight font-semibold">SMS Gateway</h1>
            <p className="text-[13px] text-muted-foreground">Operator console</p>
          </div>
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">The token is checked by the API and kept in an httpOnly cookie.</p>
      </div>
    </main>
  );
}
