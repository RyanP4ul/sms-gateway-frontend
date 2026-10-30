import { CheckCircle2, AlertTriangle, XCircle, Wrench } from "lucide-react";

import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BACKEND_URL } from "@/lib/server";
import { fmtDate } from "@/lib/utils";

type PublicStatus = {
  overall_status: string;
  uptime_30d: number;
  components: {
    component: string;
    status: string;
    message: string | null;
  }[];
  recent_incidents: {
    id: number;
    title: string;
    description: string | null;
    severity: string;
    status: string;
    affected_components: string[] | null;
    created_at: string;
  }[];
};

const LABEL: Record<string, string> = {
  operational: "All systems operational",
  degraded: "Degraded performance",
  partial_outage: "Partial outage",
  major_outage: "Major outage",
  maintenance: "Under maintenance",
};

const BANNER: Record<string, { cls: string; icon: React.ElementType }> = {
  operational: {
    cls: "bg-st-delivered/10 text-st-delivered",
    icon: CheckCircle2,
  },
  degraded: {
    cls: "bg-st-pending/12 text-st-pending",
    icon: AlertTriangle,
  },
  partial_outage: {
    cls: "bg-st-pending/15 text-st-pending",
    icon: AlertTriangle,
  },
  major_outage: {
    cls: "bg-st-failed/10 text-st-failed",
    icon: XCircle,
  },
  maintenance: {
    cls: "bg-st-processing/10 text-st-processing",
    icon: Wrench,
  },
};

async function load(): Promise<PublicStatus | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/status/public`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

export default async function StatusContent() {
  const data = await load();

  const banner = BANNER[data?.overall_status ?? ""] ?? BANNER.major_outage;

  const Icon = banner.icon;

  return (
    <>
      {!data ? (
        <div className="flex items-center gap-3 rounded-xl bg-st-failed/10 p-6 text-st-failed">
          <XCircle className="size-6" />
          Status is currently unavailable.
        </div>
      ) : (
        <>
          <div
            className={`mb-6 flex items-center gap-4 rounded-xl p-6 ${banner.cls}`}
          >
            <Icon className="size-8 shrink-0" />

            <div>
              <div className="text-lg font-semibold">
                {LABEL[data.overall_status] ?? data.overall_status}
              </div>

              <div className="num text-[13px] opacity-80">
                30-day API uptime: {data.uptime_30d}%
              </div>
            </div>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Components</CardTitle>
            </CardHeader>

            <CardContent className="divide-y">
              {data.components.map((c) => (
                <div
                  key={c.component}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="font-medium capitalize">
                      {c.component.replaceAll("_", " ")}
                    </div>

                    {c.message && (
                      <div className="text-xs text-muted-foreground">
                        {c.message}
                      </div>
                    )}
                  </div>

                  <StatusBadge status={c.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent incidents</CardTitle>
            </CardHeader>

            <CardContent>
              {data.recent_incidents.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted-foreground">
                  No incidents in the last 7 days.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recent_incidents.map((i) => (
                    <div
                      key={i.id}
                      className="rounded-lg border-l-4 bg-muted/40 p-4"
                      style={{
                        borderLeftColor:
                          i.severity === "critical"
                            ? "var(--st-failed)"
                            : "var(--st-pending)",
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{i.title}</span>
                        <StatusBadge status={i.severity} />
                        <StatusBadge status={i.status} />
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        {fmtDate(i.created_at)}
                        {i.affected_components?.length
                          ? ` · Affected: ${i.affected_components.join(", ")}`
                          : ""}
                      </div>

                      {i.description && (
                        <p className="mt-2 text-[13px] text-muted-foreground">
                          {i.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
