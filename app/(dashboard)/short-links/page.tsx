'use client';

import { useState } from 'react';
import { Copy, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAction, useApi } from '@/lib/hooks';
import { fmtDate, fmtNum } from '@/lib/utils';

type Link = { id: number; short_code: string; short_url: string; original_url: string; click_count: number; expires_at: string | null };

export default function ShortLinksPage() {
  const { data, isLoading } = useApi<{ links: Link[] }>('short-links');
  const [url, setUrl] = useState('');
  const [ttl, setTtl] = useState('');
  const create = useAction<any, { short_url: string }>('short-links', {
    invalidate: ['short-links'],
    success: (r) => `Created ${r.short_url}`,
    onDone: () => { setUrl(''); setTtl(''); },
  });
  const copy = async (text: string) => { await navigator.clipboard.writeText(text); toast.success('Copied'); };

  return (
    <>
      <PageHeader title="Short links" description="Compact, trackable links for SMS bodies. Only http(s) targets are accepted." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>New link</CardTitle></CardHeader><CardContent className="grid gap-4">
          <Field label="Destination URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/offer" /></Field>
          <Field label="Expires after (hours, optional)"><Input type="number" min={1} value={ttl} onChange={(e) => setTtl(e.target.value)} /></Field>
          <div><Button disabled={create.isPending || !url.trim()} onClick={() => create.mutate({ url, ...(ttl ? { ttl_hours: Number(ttl) } : {}) })}><Link2 /> Shorten</Button></div>
        </CardContent></Card>
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
          <DataTable
            loading={isLoading} rows={data?.links} rowKey={(l) => l.id} empty="No short links yet."
            columns={[
              { header: 'Link', cell: (l) => (<div className="max-w-xs"><div className="font-mono text-[13px]">{l.short_url}</div><div className="truncate text-xs text-muted-foreground" title={l.original_url}>{l.original_url}</div></div>) },
              { header: 'Clicks', align: 'right', cell: (l) => <span className="num">{fmtNum(l.click_count)}</span> },
              { header: 'Expires', cell: (l) => <span className="text-muted-foreground">{l.expires_at ? fmtDate(l.expires_at) : 'never'}</span> },
              { header: '', align: 'right', cell: (l) => <Button variant="ghost" size="icon-sm" aria-label="Copy link" onClick={() => copy(l.short_url)}><Copy /></Button> },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
