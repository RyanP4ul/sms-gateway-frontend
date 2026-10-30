import { Suspense } from "react";

import { AutoRefresh } from "./auto-refresh";
import StatusContent from "./status-content";

export default function StatusPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <AutoRefresh />

      <h1 className="text-2xl font-semibold tracking-tight">SMS Gateway</h1>

      <p className="mb-8 text-[13px] text-muted-foreground">System status</p>

      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-48 rounded-xl bg-muted" />
            <div className="h-48 rounded-xl bg-muted" />
          </div>
        }
      >
        <StatusContent />
      </Suspense>
    </main>
  );
}
