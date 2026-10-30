"use client";

import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/app/confirm-button";
import { DataTable } from "@/components/app/data-table";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useAction, useApi } from "@/lib/hooks";
import { fmtDate } from "@/lib/utils";

/** Which config keys each channel type needs. */
const CHANNELS: Record<
  string,
  {
    label: string;
    fields: { key: string; label: string; placeholder?: string }[];
  }
> = {
  email: {
    label: "Email",
    fields: [
      { key: "to", label: "Recipient address", placeholder: "ops@example.com" },
    ],
  },
  telegram: {
    label: "Telegram",
    fields: [
      { key: "bot_token", label: "Bot token" },
      { key: "chat_id", label: "Chat ID" },
    ],
  },
  slack: {
    label: "Slack",
    fields: [
      {
        key: "webhook_url",
        label: "Incoming webhook URL",
        placeholder: "https://hooks.slack.com/…",
      },
    ],
  },
  webhook: {
    label: "Webhook",
    fields: [{ key: "url", label: "URL", placeholder: "https://…" }],
  },
  sms: {
    label: "SMS",
    fields: [
      {
        key: "phone_number",
        label: "Phone number",
        placeholder: "+905551234567",
      },
    ],
  },
};
const EVENTS = [
  "anomaly.detected",
  "device.offline",
  "sms.failed",
  "autoscale.action",
  "incident.created",
];
type Channel = {
  id: number;
  channel_type: string;
  events: string[];
  is_active: boolean;
  last_sent_at: string | null;
  config: Record<string, unknown>;
};

export default function AlertsPage() {
  const { data, isLoading } = useApi<{ channels: Channel[] }>(
    "alerts/channels",
  );
  const [type, setType] = useState("email");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<string[]>([
    "anomaly.detected",
    "device.offline",
  ]);
  const create = useAction("alerts/channels", {
    invalidate: ["alerts/channels"],
    onDone: () => setConfig({}),
  });
  const remove = useAction<number>((id) => `alerts/channels/${id}`, {
    method: "DELETE",
    invalidate: ["alerts/channels"],
  });
  const spec = CHANNELS[type]!;
  const ready =
    spec.fields.every((f) => config[f.key]?.trim()) && events.length > 0;

  return (
    <>
      <PageHeader
        title="Alert channels"
        description="Where notifications about anomalies, offline devices and incidents should go."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2">
          <CardHeader>
            <CardTitle>New channel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Type">
              <NativeSelect
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setConfig({});
                }}
              >
                {Object.entries(CHANNELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {spec.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                <Input
                  value={config[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) =>
                    setConfig({ ...config, [f.key]: e.target.value })
                  }
                />
              </Field>
            ))}
            <Field label="Notify on">
              <div className="grid gap-2">
                {EVENTS.map((ev) => (
                  <label
                    key={ev}
                    className="flex cursor-pointer items-center gap-2.5 text-[13px]"
                  >
                    <Checkbox
                      checked={events.includes(ev)}
                      onCheckedChange={(checked) =>
                        setEvents((current) =>
                          checked
                            ? [...current, ev]
                            : current.filter((x) => x !== ev),
                        )
                      }
                    />
                    <span className="font-mono">{ev}</span>
                  </label>
                ))}
              </div>
            </Field>
            <div>
              <Button
                disabled={create.isPending || !ready}
                onClick={() =>
                  create.mutate({ channel_type: type, config, events })
                }
              >
                <Bell /> Add channel
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
          <DataTable
            loading={isLoading}
            rows={data?.channels}
            rowKey={(c) => c.id}
            empty="No channels yet."
            columns={[
              {
                header: "Channel",
                cell: (c) => (
                  <div>
                    <div className="font-medium">
                      {CHANNELS[c.channel_type]?.label ?? c.channel_type}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.events.map((e) => (
                        <Badge
                          key={e}
                          variant="secondary"
                          className="font-mono"
                        >
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                header: "State",
                cell: (c) => (
                  <StatusBadge status={c.is_active ? "active" : "inactive"} />
                ),
              },
              {
                header: "Last sent",
                cell: (c) => (
                  <span className="text-muted-foreground">
                    {fmtDate(c.last_sent_at)}
                  </span>
                ),
              },
              {
                header: "",
                align: "right",
                cell: (c) => (
                  <ConfirmButton
                    variant="ghost"
                    size="icon-sm"
                    title="Delete channel?"
                    confirmLabel="Delete"
                    onConfirm={() => remove.mutate(c.id)}
                  >
                    <Trash2 className="text-destructive" />
                  </ConfirmButton>
                ),
              },
            ]}
          />
        </Card>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Note: channels are stored and managed here; the original PHP app also
        only stored them (it never dispatched notifications), and this port
        keeps that behaviour.
      </p>
    </>
  );
}
