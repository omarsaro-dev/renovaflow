"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChangeRequestStatusBadge } from "@/components/shared/status-badges";
import { formatMoney, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea, FormMessage } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckSquare } from "lucide-react";

export interface CustomerChangeRequestItem {
  id: string;
  title: string;
  reason: string;
  costImpact: number;
  scheduleImpactDays: number;
  scheduleImpactNote: string | null;
  status: string;
  categoryName: string | null;
  createdAt: string;
  customerComment: string | null;
  decisionAt: string | null;
  projectName: string | null;
}

export function CustomerChangeRequests({
  requests,
}: {
  requests: CustomerChangeRequestItem[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const pending = requests.filter((r) => r.status === "PENDING_APPROVAL");
  const decided = requests.filter((r) => r.status !== "PENDING_APPROVAL");

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (!openId) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/change-requests/${openId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment: comment || null }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not save your decision.");
      return;
    }
    setOpenId(null);
    setComment("");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-[14px] font-semibold text-ink">Needs your approval</h2>
        {pending.length === 0 ? (
          <EmptyState icon={CheckSquare} title="Nothing waiting" description="When your contractor requests a change, you approve or reject it here." />
        ) : (
          pending.map((r) => (
            <Card key={r.id} className="border-accent/30">
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold text-ink">{r.title}</p>
                      <ChangeRequestStatusBadge status={r.status} />
                    </div>
                    {r.projectName && <p className="mt-0.5 text-[12px] text-ink-faint">{r.projectName}</p>}
                  </div>
                  <p className="rounded-control border border-accent/25 bg-accentTint px-3 py-1.5 text-[15px] font-semibold text-[#7D5A23]">
                    {r.costImpact > 0 ? `+${formatMoney(r.costImpact)}` : formatMoney(0)}
                  </p>
                </div>

                <p className="text-[14px] leading-relaxed text-ink-muted">{r.reason}</p>

                <p className="text-[12px] text-ink-faint">
                  {r.categoryName ?? "Overall budget"} ·{" "}
                  {r.scheduleImpactDays !== 0
                    ? `${r.scheduleImpactDays > 0 ? "+" : ""}${r.scheduleImpactDays} days${r.scheduleImpactDays === 1 ? "" : ""} schedule impact`
                    : "No schedule change"}
                  {r.scheduleImpactNote && <> · {r.scheduleImpactNote}</>}
                  {" · "}requested {relativeTime(r.createdAt)}
                </p>

                {openId === r.id ? (
                  <div className="rounded-control border border-border bg-elevated p-4">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[72px]"
                      placeholder="Add a note to the contractor (optional)"
                    />
                    <FormMessage error={error} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={() => decide("APPROVED")} disabled={submitting} loading={submitting}>
                        Approve {r.costImpact > 0 ? formatMoney(r.costImpact) : "change"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => decide("REJECTED")}
                        disabled={submitting}
                        className="border-danger/40 text-danger hover:bg-dangerTint"
                      >
                        Reject
                      </Button>
                      <Button variant="ghost" onClick={() => { setOpenId(null); setComment(""); setError(null); }} disabled={submitting}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setOpenId(r.id); setError(null); }}>
                    Review
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {decided.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold text-ink">History</h3>
          {decided.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-medium text-ink">{r.title}</p>
                    <ChangeRequestStatusBadge status={r.status} />
                  </div>
                  {r.projectName && <p className="mt-0.5 text-[12px] text-ink-faint">{r.projectName}</p>}
                </div>
                <p className="text-[12px] text-ink-faint">
                  {r.costImpact > 0 && <>+{formatMoney(r.costImpact)} · </>}decided {relativeTime(r.decisionAt ?? r.createdAt)}
                </p>
              </div>
              {r.customerComment && (
                <p className="border-t border-border px-4 py-3 text-[12px] text-ink-muted italic">
                  Your note: {r.customerComment}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}