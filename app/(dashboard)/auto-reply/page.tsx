'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/app/confirm-button';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useAction, useApi } from '@/lib/hooks';
import { fmtNum } from '@/lib/utils';

type Rule = { id: number; keyword: string; match_type: string; reply_message: string; usage_count: number };

export default function AutoReplyPage() {
  const { data, isLoading } = useApi<{ rules: Rule[] }>('auto-reply');
  const [f, setF] = useState({ keyword: '', match_type: 'contains', reply_message: '' });
  const add = useAction('auto-reply', { invalidate: ['auto-reply'], onDone: () => setF({ keyword: '', match_type: 'contains', reply_message: '' }) });
  const remove = useAction<number>((id) => `auto-reply/${id}`, { method: 'DELETE', invalidate: ['auto-reply'] });

  return (
    <>
      <PageHeader title="Auto-reply" description="When an incoming SMS matches a rule, the first matching rule (oldest first) queues a reply from the same phone." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>New rule</CardTitle></CardHeader><CardContent className="grid gap-4">
          <Field label="Keyword / pattern"><Input value={f.keyword} onChange={(e) => setF({ ...f, keyword: e.target.value })} maxLength={100} placeholder="STOP" /></Field>
          <Field label="Match type" hint="Matching is case-insensitive. Regex uses JavaScript syntax.">
            <NativeSelect value={f.match_type} onChange={(e) => setF({ ...f, match_type: e.target.value })}>
              <option value="contains">Contains</option><option value="exact">Exact</option><option value="starts_with">Starts with</option><option value="regex">Regex</option>
            </NativeSelect>
          </Field>
          <Field label="Reply"><Textarea rows={3} value={f.reply_message} onChange={(e) => setF({ ...f, reply_message: e.target.value })} /></Field>
          <div><Button disabled={add.isPending || !f.keyword.trim() || !f.reply_message.trim()} onClick={() => add.mutate(f)}><Plus /> Add rule</Button></div>
        </CardContent></Card>
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
          <DataTable
            loading={isLoading} rows={data?.rules} rowKey={(r) => r.id} empty="No rules yet."
            columns={[
              { header: 'When', cell: (r) => (<div><span className="font-mono text-[13px]">{r.keyword}</span> <Badge variant="secondary" className="ml-1">{r.match_type.replace('_', ' ')}</Badge></div>) },
              { header: 'Reply', cell: (r) => <span className="line-clamp-2 max-w-xs text-[13px]">{r.reply_message}</span> },
              { header: 'Used', align: 'right', cell: (r) => <span className="num">{fmtNum(r.usage_count)}</span> },
              { header: '', align: 'right', cell: (r) => <ConfirmButton variant="ghost" size="icon-sm" title="Delete rule?" confirmLabel="Delete" onConfirm={() => remove.mutate(r.id)}><Trash2 className="text-destructive" /></ConfirmButton> },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
