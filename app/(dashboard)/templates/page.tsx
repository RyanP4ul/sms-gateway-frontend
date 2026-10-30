'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAction, useApi } from '@/lib/hooks';
import { fmtNum } from '@/lib/utils';

type Template = { id: number; name: string; content: string; variables: string[] | null; usage_count: number; is_active: boolean };

export default function TemplatesPage() {
  const { data, isLoading } = useApi<{ templates: Template[] }>('templates');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const detected = [...new Set([...content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!))];

  const create = useAction('templates', { invalidate: ['templates'], onDone: () => { setName(''); setContent(''); } });

  return (
    <>
      <PageHeader title="Templates" description="Reusable messages with {{placeholders}}. Pick one on the Send page and fill in the variables." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>New template</CardTitle></CardHeader><CardContent className="grid gap-4">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Order shipped" /></Field>
          <Field label="Content" hint="Wrap variables in double braces.">
            <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Hi {{name}}, order {{order}} is on its way." />
          </Field>
          {detected.length > 0 && <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">Variables: {detected.map((v) => <Badge key={v} variant="secondary" className="font-mono">{v}</Badge>)}</div>}
          <div><Button disabled={create.isPending || !name.trim() || !content.trim()} onClick={() => create.mutate({ name, content, variables: detected })}><Plus /> Save template</Button></div>
        </CardContent></Card>

        <Card className="gap-0 py-0 lg:col-span-3 overflow-hidden">
          <DataTable
            loading={isLoading} rows={data?.templates} rowKey={(t) => t.id} empty="No templates yet."
            columns={[
              { header: 'Template', cell: (t) => (<div><div className="font-medium">{t.name}</div><div className="mt-0.5 max-w-sm text-xs text-muted-foreground">{t.content}</div></div>) },
              { header: 'Variables', cell: (t) => <div className="flex flex-wrap gap-1">{(t.variables ?? []).map((v) => <Badge key={v} variant="secondary" className="font-mono">{v}</Badge>)}</div> },
              { header: 'Used', align: 'right', cell: (t) => <span className="num">{fmtNum(t.usage_count)}</span> },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
