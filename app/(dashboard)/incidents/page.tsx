"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { DataTable } from "@/components/app/data-table";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAction, useApi } from "@/lib/hooks";
import { fmtDate } from "@/lib/utils";

const COMPONENT_STATES = [
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
];
const INCIDENT_STATES = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
];
type Component = {
  id: number;
  component: string;
  status: string;
  message: string | null;
  updated_by: string;
};
type Incident = {
  id: number;
  title: string;
  severity: string;
  status: string;
  affected_components: string[] | null;
  created_at: string;
  resolved_at: string | null;
};

export default function IncidentsPage() {
  const { data, isLoading } = useApi<{
    components: Component[];
    incidents: Incident[];
  }>("status", undefined, { refetchInterval: 20_000 });
  const [f, setF] = useState({ title: "", description: "", severity: "minor" });
  const [affected, setAffected] = useState<string[]>([]);

  const setComponent = useAction<{ component: string; status: string }>(
    "status/components",
    { invalidate: ["status"] },
  );
  const create = useAction("status/incidents", {
    invalidate: ["status"],
    onDone: () => {
      setF({ title: "", description: "", severity: "minor" });
      setAffected([]);
    },
  });
  const update = useAction<{ id: number; status: string }>(
    "status/incidents/update",
    { invalidate: ["status"] },
  );

  return (
    <>
      <PageHeader
        title="Status & incidents"
        description="What customers see on the public status page. Component states are also updated automatically from live metrics every minute."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="grid content-start gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Components</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {isLoading && !data && (
                <p className="text-[13px] text-muted-foreground">Loading…</p>
              )}
              {data?.components.map((c) => (
                <div
                  key={c.component}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium capitalize">
                      {c.component.replaceAll("_", " ")}
                    </div>
                    <StatusBadge status={c.status} className="mt-0.5" />
                  </div>
                  <div className="w-40">
                    <NativeSelect
                      value={c.status}
                      onChange={(e) =>
                        setComponent.mutate({
                          component: c.component,
                          status: e.target.value,
                        })
                      }
                    >
                      {COMPONENT_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report an incident</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Title">
                <Input
                  value={f.title}
                  onChange={(e) => setF({ ...f, title: e.target.value })}
                  maxLength={200}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                />
              </Field>
              <Field
                label="Severity"
                hint="Critical → major outage, major → partial outage, minor → degraded, on the affected components."
              >
                <NativeSelect
                  value={f.severity}
                  onChange={(e) => setF({ ...f, severity: e.target.value })}
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </NativeSelect>
              </Field>
              <Field label="Affected components">
                <div className="grid gap-2">
                  {data?.components.map((c) => (
                    <label
                      key={c.component}
                      className="flex cursor-pointer items-center gap-2.5 text-[13px] capitalize"
                    >
                      <Checkbox
                        checked={affected.includes(c.component)}
                        onCheckedChange={() =>
                          setAffected((a) =>
                            a.includes(c.component)
                              ? a.filter((x) => x !== c.component)
                              : [...a, c.component],
                          )
                        }
                      />
                      {c.component.replaceAll("_", " ")}
                    </label>
                  ))}
                </div>
              </Field>
              <div>
                <Button
                  disabled={create.isPending || !f.title.trim()}
                  onClick={() =>
                    create.mutate({ ...f, affected_components: affected })
                  }
                >
                  <Megaphone /> Publish incident
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3 h-fit">
          <CardHeader className="py-4">
            <CardTitle>Incidents</CardTitle>
          </CardHeader>
          <DataTable
            loading={isLoading}
            rows={data?.incidents}
            rowKey={(i) => i.id}
            empty="No incidents recorded."
            columns={[
              {
                header: "Incident",
                cell: (i) => (
                  <div>
                    <div className="font-medium">{i.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(i.created_at)}
                      {i.affected_components?.length
                        ? ` · ${i.affected_components.join(", ")}`
                        : ""}
                    </div>
                  </div>
                ),
              },
              {
                header: "Severity",
                cell: (i) => <StatusBadge status={i.severity} />,
              },
              {
                header: "Status",
                cell: (i) =>
                  i.status === "resolved" ? (
                    <StatusBadge status="resolved" />
                  ) : (
                    <div className="w-36">
                      <NativeSelect
                        value={i.status}
                        onChange={(e) =>
                          update.mutate({ id: i.id, status: e.target.value })
                        }
                      >
                        {INCIDENT_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  ),
              },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
