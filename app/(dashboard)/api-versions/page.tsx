"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import { DataTable } from "@/components/app/data-table";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction, useApi } from "@/lib/hooks";
import { fmtDate } from "@/lib/utils";

type Version = {
  id: number;
  version: string;
  is_active: boolean;
  is_default: boolean;
  changelog: string | null;
  deprecated_at: string | null;
  sunset_at: string | null;
};

export default function ApiVersionsPage() {
  const { data, isLoading } = useApi<{ versions: Version[] }>("api-versions");
  const [f, setF] = useState({
    version: "",
    changelog: "",
    is_default: false,
    is_active: true,
    deprecated_at: "",
    sunset_at: "",
  });
  const save = useAction("api-versions", {
    invalidate: ["api-versions"],
    onDone: () => setF({ ...f, version: "", changelog: "" }),
  });

  return (
    <>
      <PageHeader
        title="API versions"
        description="Track which API versions exist, which one is the default, and when old ones are deprecated or sunset. Saving an existing version updates it."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2">
          <CardHeader>
            <CardTitle>Add or update a version</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Version">
              <Input
                value={f.version}
                maxLength={10}
                placeholder="v3"
                onChange={(e) => setF({ ...f, version: e.target.value })}
              />
            </Field>
            <Field label="Changelog">
              <Textarea
                rows={3}
                value={f.changelog}
                onChange={(e) => setF({ ...f, changelog: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Deprecated on">
                <Input
                  type="date"
                  value={f.deprecated_at}
                  onChange={(e) =>
                    setF({ ...f, deprecated_at: e.target.value })
                  }
                />
              </Field>
              <Field label="Sunset on">
                <Input
                  type="date"
                  value={f.sunset_at}
                  onChange={(e) => setF({ ...f, sunset_at: e.target.value })}
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
              <Checkbox
                checked={f.is_active}
                onCheckedChange={(checked) =>
                  setF({ ...f, is_active: checked === true })
                }
              />{" "}
              Active
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
              <Checkbox
                checked={f.is_default}
                onCheckedChange={(checked) =>
                  setF({ ...f, is_default: checked === true })
                }
              />{" "}
              Make default
            </label>
            <div>
              <Button
                disabled={save.isPending || !f.version.trim()}
                onClick={() =>
                  save.mutate({
                    version: f.version,
                    changelog: f.changelog || undefined,
                    is_active: f.is_active,
                    is_default: f.is_default,
                    deprecated_at: f.deprecated_at || null,
                    sunset_at: f.sunset_at || null,
                  })
                }
              >
                <GitBranch /> Save version
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
          <DataTable
            loading={isLoading}
            rows={data?.versions}
            rowKey={(v) => v.id}
            empty="No versions."
            columns={[
              {
                header: "Version",
                cell: (v) => (
                  <div>
                    <span className="font-mono font-medium">{v.version}</span>{" "}
                    {v.is_default && <Badge className="ml-1">default</Badge>}
                    <div className="mt-0.5 max-w-xs text-xs text-muted-foreground">
                      {v.changelog}
                    </div>
                  </div>
                ),
              },
              {
                header: "State",
                cell: (v) => (
                  <Badge variant={v.is_active ? "default" : "outline"}>
                    {v.is_active ? "active" : "inactive"}
                  </Badge>
                ),
              },
              {
                header: "Deprecated",
                cell: (v) => (
                  <span className="text-muted-foreground">
                    {v.deprecated_at ? fmtDate(v.deprecated_at) : "—"}
                  </span>
                ),
              },
              {
                header: "Sunset",
                cell: (v) => (
                  <span className="text-muted-foreground">
                    {v.sunset_at ? fmtDate(v.sunset_at) : "—"}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
