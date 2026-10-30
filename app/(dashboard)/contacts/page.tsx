'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Pager } from '@/components/app/pager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAction, useApi } from '@/lib/hooks';
import type { Paged } from '@/lib/types';
import { fmtDate } from '@/lib/utils';

type Contact = { id: number; name: string; phone_number: string; group_name: string | null; created_at: string };

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [group, setGroup] = useState('');
  const [f, setF] = useState({ name: '', phone_number: '', group_name: '' });
  const { data, isLoading } = useApi<Paged & { contacts: Contact[] }>('contacts', { page, limit: 20, group: group.trim() });
  const add = useAction('contacts', { invalidate: ['contacts'], onDone: () => setF({ name: '', phone_number: '', group_name: '' }) });

  return (
    <>
      <PageHeader title="Contacts" description="A simple address book, optionally grouped." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>Add contact</CardTitle></CardHeader><CardContent className="grid gap-4">
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone number"><Input className="font-mono" value={f.phone_number} onChange={(e) => setF({ ...f, phone_number: e.target.value })} placeholder="+905551234567" /></Field>
          <Field label="Group (optional)"><Input value={f.group_name} onChange={(e) => setF({ ...f, group_name: e.target.value })} maxLength={100} /></Field>
          <div><Button disabled={add.isPending || !f.name.trim() || !f.phone_number.trim()} onClick={() => add.mutate({ ...f, group_name: f.group_name || null })}><UserPlus /> Add contact</Button></div>
        </CardContent></Card>

        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
          <div className="border-b p-4"><Input className="max-w-56" placeholder="Filter by group" value={group} onChange={(e) => { setGroup(e.target.value); setPage(1); }} /></div>
          <DataTable
            loading={isLoading} rows={data?.contacts} rowKey={(c) => c.id} empty="No contacts."
            columns={[
              { header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> },
              { header: 'Phone', cell: (c) => <span className="font-mono text-[13px]">{c.phone_number}</span> },
              { header: 'Group', cell: (c) => (c.group_name ? <Badge variant="secondary">{c.group_name}</Badge> : <span className="text-muted-foreground">—</span>) },
              { header: 'Added', cell: (c) => <span className="text-muted-foreground">{fmtDate(c.created_at)}</span> },
            ]}
          />
          {data && <Pager page={data.page} totalPages={data.total_pages} total={data.total} onPage={setPage} />}
        </Card>
      </div>
    </>
  );
}
