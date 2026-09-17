"use client";

import * as React from "react";
import { ChangeRequestStatusBadge } from "@/components/shared/status-badges";
import { formatMoney } from "@/lib/utils";
import { relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export interface ChangeRequestItem {
  id: string;
  title: string;
  reason: string;
  costImpact: number;
  scheduleImpactDays: number;
  scheduleImpactNote: string | null;
  status: string;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: string;
  customerComment: string | null;
  decisionAt: string | null;
}

export function ChangeRequestList({
  items,
  canDecide,
  isCustomer,
  onDecided,
}: {
  items: ChangeRequestItem[];
  canDecide: boolean;
  isCustomer: boolean;
  onDecided: () => void;
}) {
  const [decidingId, setDecidingId] = React.useState<string | null>(null);
  const [decision, setDecision] = React.useState<"APPROVED" | "REJECTED">("APPROVED");
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const pending = items.filter((i) => i.status === "PENDING_APPROVAL");
  const decided = items.filter((i) => i.status !== "PENDING_APPROVAL");

  async function submitDecision(id: string) {
    setSubmitting(true);
    const res = await fetch(`/api/change-requests/${id}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment: comment || null }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setDecidingId(null);
      setComment("");
      onDecided();
    } else {
      alert(json.error?.message ?? "Could not save your decision.");
    }
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-ink">Awaiting decision</h3>
          {pending.map((cr) => (
            <Card key={cr.id}>
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-ink">{cr.title}</p>
                    <ChangeRequestStatusBadge status={cr.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{cr.reason}</p>
                  <p className="mt-2 text-[12px] text-ink-faint">
                    {formatMoney(cr.costImpact)} impact · {cr.scheduleImpactDays > 0 ? `${cr.scheduleImpactDays}d schedule change` : "No schedule change"} · {cr.categoryName ?? "Uncategorized"} · requested {relativeTime(cr.createdAt)}
                  </p>
                </div>
                {canDecide && !isCustomer && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setDecidingId(decidingId === cr.id ? null : cr.id); setDecision("APPROVED"); setComment(""); }}>
                      Review
                    </Button>
                  </div>
                )}
              </div>
              {decidingId === cr.id && canDecide && (
                <div className="border-t border-border bg-elevated px-4 pb-4 pt-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={decision === "APPROVED" ? "primary" : "outline"}
                      onClick={() => setDecision("APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant={decision === "REJECTED" ? "primary" : "outline"}
                      className={decision === "REJECTED" ? "border-danger text-danger" : ""}
                      onClick={() => setDecision("REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-2 min-h-[56px]"
                    placeholder="Add a note (optional)"
                  />
                  <Button size="sm" className="mt-2" loading={submitting} onClick={() => submitDecision(cr.id)}>
                    Confirm {decision === "APPROVED" ? "approval" : "rejection"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-ink">History</h3>
          {decided.map((cr) => (
            <Card key={cr.id}>
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-ink">{cr.title}</p>
                  <ChangeRequestStatusBadge status={cr.status} />
                </div>
                <p className="text-[12px] text-ink-faint">
                  {formatMoney(cr.costImpact)} impact · decided {relativeTime(cr.decisionAt ?? cr.createdAt)}
                </p>
                {cr.customerComment && (
                  <p className="text-[12px] text-ink-muted italic">Customer comment: {cr.customerComment}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="py-8 text-center text-[13px] text-ink-faint">No change requests yet for this project.</p>
      )}
    </div>
  );
}