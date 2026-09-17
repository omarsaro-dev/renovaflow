"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FileWarning, TrendingUp, Wallet, Receipt } from "lucide-react";
import { formatMoney, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogBody, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ExpenseForm } from "./expense-form";
import { ChangeRequestForm } from "./change-request-form";
import { ChangeRequestList, type ChangeRequestItem } from "./change-request-list";
import { EmptyState } from "@/components/ui/empty-state";

interface BudgetProps {
  projectId: string;
  projectName: string;
  canFinance: boolean;
  warnIfAtOrAbove: number;
  budget: { initialBudget: number; currentApprovedBudget: number; budgetWarningThreshold: number };
  summary: {
    originalBudget: number;
    approvedChanges: number;
    currentApprovedBudget: number;
    totalEstimated: number;
    totalActual: number;
    remainingBudget: number;
    usedPercent: number;
    variance: number;
    approvedVsEstimated: number;
  };
  categories: {
    id: string;
    name: string;
    type: string;
    estimatedAmount: number;
    approvedAmount: number;
    expenseCount: number;
  }[];
  expenses: {
    id: string;
    description: string;
    actualAmount: number;
    estimatedAmount: number | null;
    vendor: string | null;
    date: string;
    categoryId: string | null;
    categoryName: string | null;
    createdById: string;
    createdByName: string;
  }[];
  changeRequests: ChangeRequestItem[];
  currentUserId: string;
}

export function BudgetOverview(props: BudgetProps) {
  const router = useRouter();
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [editExpense, setEditExpense] = React.useState<(typeof props.expenses)[number] | null>(null);
  const [crOpen, setCrOpen] = React.useState(false);
  const [deleteExpense, setDeleteExpense] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const { summary, budget } = props;
  const spent = summary.totalActual;
  const available = summary.currentApprovedBudget;
  const remaining = summary.remainingBudget;
  const usedPercent = summary.usedPercent;

  const health =
    usedPercent >= props.warnIfAtOrAbove
      ? "warning"
      : summary.variance > (props.warnIfAtOrAbove / 100) * available
        ? "attention"
        : "healthy";

  const categorySpent = (categoryId: string) =>
    props.expenses.filter((e) => e.categoryId === categoryId).reduce((s, e) => s + e.actualAmount, 0);

  async function removeExpense() {
    if (!deleteExpense) return;
    setDeleting(true);
    await fetch(`/api/expenses/${deleteExpense}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteExpense(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-[12px] text-ink-muted"><Wallet className="h-3.5 w-3.5" aria-hidden /> Approved budget</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-ink">{formatMoney(available)}</p>
            <p className="text-[12px] text-ink-faint">{formatMoney(budget.initialBudget)} base{summary.approvedChanges > 0 ? ` + ${formatMoney(summary.approvedChanges)} changes` : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-[12px] text-ink-muted"><Receipt className="h-3.5 w-3.5" aria-hidden /> Spent</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-ink">{formatMoney(spent)}</p>
            <p className="text-[12px] text-ink-faint">{props.expenses.length} expense{props.expenses.length !== 1 ? "s" : ""} logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-[12px] text-ink-muted"><TrendingUp className="h-3.5 w-3.5" aria-hidden /> Remaining</p>
            <p className={cn("mt-1 text-[22px] font-semibold tabular-nums", remaining < 0 ? "text-danger" : "text-ink")}>{formatMoney(remaining)}</p>
            <p className="text-[12px] text-ink-faint">{usedPercent}% of approved budget used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-[12px] text-ink-muted"><FileWarning className="h-3.5 w-3.5" aria-hidden /> Estimated vs approved</p>
            <p className={cn("mt-1 text-[22px] font-semibold tabular-nums", summary.approvedVsEstimated < 0 ? "text-danger" : "text-ink")}>{formatMoney(summary.approvedVsEstimated)}</p>
            <p className="text-[12px] text-ink-faint">Estimates total {formatMoney(summary.totalEstimated)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Used progress + health */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-ink">Budget usage</p>
            <Badge tone={health === "healthy" ? "success" : health === "warning" ? "warning" : "neutral"}>
              {health === "healthy" ? "On track" : health === "warning" ? "Approaching limit" : "Over estimate"}
            </Badge>
          </div>
          <Progress value={Math.min(100, usedPercent)} tone={health === "healthy" ? "brand" : health === "warning" ? "warning" : "danger"} />
          <div className="mt-2 flex justify-between text-[12px] text-ink-faint">
            <span>{formatMoney(spent)} spent</span>
            <span>{formatMoney(available)} approved</span>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Budget categories</CardTitle>
            <CardDescription>{props.categories.length} categories — estimates vs what&apos;s actually spent</CardDescription>
          </div>
          {props.canFinance && <AddCategoryButton categories={props.categories} projectId={props.projectId} />}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {props.categories.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-faint">No categories yet. Add one to start tracking your budget.</p>
          ) : (
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-[0.03em] text-ink-faint">
                  <th className="pb-2 pr-3">Category</th>
                  <th className="pb-2 pr-3">Estimate</th>
                  <th className="pb-2 pr-3">Approved</th>
                  <th className="pb-2 pr-3">Spent</th>
                  <th className="pb-2 pr-3">Remaining</th>
                  <th className="pb-2 pr-1 w-40">Usage</th>
                </tr>
              </thead>
              <tbody>
                {props.categories.map((c) => {
                  const spentNow = categorySpent(c.id);
                  const approved = c.approvedAmount > 0 ? c.approvedAmount : c.estimatedAmount;
                  const rem = approved - spentNow;
                  const pct = approved > 0 ? Math.min(100, Math.round((spentNow / approved) * 100)) : 0;
                  return (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-3">
                        <p className="text-[13px] font-medium text-ink">{c.name}</p>
                        <p className="text-[11px] text-ink-faint">{c.expenseCount} expense{c.expenseCount !== 1 ? "s" : ""}</p>
                      </td>
                      <td className="py-3 pr-3 text-[13px] tabular-nums text-ink">{formatMoney(c.estimatedAmount)}</td>
                      <td className="py-3 pr-3 text-[13px] tabular-nums text-ink">{formatMoney(approved)}</td>
                      <td className={cn("py-3 pr-3 text-[13px] tabular-nums", spentNow > approved ? "text-danger" : "text-ink")}>{formatMoney(spentNow)}</td>
                      <td className={cn("py-3 pr-3 text-[13px] tabular-nums", rem < 0 ? "text-danger" : "text-ink-faint")}>{formatMoney(rem)}</td>
                      <td className="py-3 pr-1">
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress value={pct} tone={pct >= props.warnIfAtOrAbove ? "warning" : pct >= 100 ? "danger" : "brand"} />
                          </div>
                          <span className="text-[11px] tabular-nums text-ink-faint">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Materials, labor, permits and everything tracked to this project</CardDescription>
          </div>
          {props.canFinance && (
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" aria-hidden />
                  Log expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>Log expense</DialogHeader>
                <DialogDescription>Add money spent on {props.projectName}.</DialogDescription>
                <DialogBody>
                  <ExpenseForm
                    projectId={props.projectId}
                    categories={props.categories}
                    onSaved={() => { setExpenseOpen(false); router.refresh(); }}
                  />
                </DialogBody>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {props.expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Log your first expense to start tracking your budget."
              action={props.canFinance ? (
                <Button size="sm" onClick={() => setExpenseOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Log expense
                </Button>
              ) : undefined}
            />
          ) : (
            props.expenses.map((e) => (
              <div key={e.id} className="group flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-3 transition-colors hover:border-brand/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{e.description}</p>
                  <p className="text-[12px] text-ink-faint">
                    {e.date} · {e.categoryName ?? "Uncategorized"} · {e.vendor ?? e.createdByName}
                  </p>
                </div>
                <p className={cn("text-[14px] font-semibold tabular-nums", e.actualAmount > (e.estimatedAmount ?? e.actualAmount) ? "text-ink" : "text-ink")}>
                  {formatMoney(e.actualAmount)}
                </p>
                {props.canFinance && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditExpense(e)}>
                      <Pencil className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteExpense(e.id)}>
                      <Trash2 className="h-4 w-4 text-danger" aria-hidden />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Change requests */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Change requests</CardTitle>
            <CardDescription>Scope changes that need customer approval</CardDescription>
          </div>
          {props.canFinance && (
            <Dialog open={crOpen} onOpenChange={setCrOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" aria-hidden />
                  New change request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>New change request</DialogHeader>
                <DialogDescription>Describe the change — the customer will be asked to approve it.</DialogDescription>
                <DialogBody>
                  <ChangeRequestForm
                    projectId={props.projectId}
                    categories={props.categories}
                    onSaved={() => { setCrOpen(false); router.refresh(); }}
                  />
                </DialogBody>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <ChangeRequestList
            items={props.changeRequests}
            canDecide={props.canFinance}
            isCustomer={false}
            onDecided={() => router.refresh()}
          />
        </CardContent>
      </Card>

      {/* Edit expense dialog */}
      <Dialog open={!!editExpense} onOpenChange={(o) => !o && setEditExpense(null)}>
        <DialogContent>
          <DialogHeader>Edit expense</DialogHeader>
          <DialogDescription>Correct the details or amount.</DialogDescription>
          <DialogBody>
            {editExpense && (
              <ExpenseForm
                projectId={props.projectId}
                categories={props.categories}
                expense={{
                  id: editExpense.id,
                  description: editExpense.description,
                  actualAmount: editExpense.actualAmount,
                  estimatedAmount: editExpense.estimatedAmount,
                  vendor: editExpense.vendor,
                  date: editExpense.date,
                  notes: null,
                  categoryId: editExpense.categoryId,
                }}
                onSaved={() => { setEditExpense(null); router.refresh(); }}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Delete expense */}
      <Dialog open={!!deleteExpense} onOpenChange={(o) => !o && setDeleteExpense(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>Delete expense?</DialogHeader>
          <DialogDescription>This will permanently remove the expense from the budget.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteExpense(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={removeExpense}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddCategoryButton({ categories, projectId }: { categories: { name: string }[]; projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [estimate, setEstimate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError("Give the category a name.");
      return;
    }
    setSaving(true);
    setError(null);
    const next = [
      ...categories.map((c) => ({ name: c.name, estimatedAmount: 0 })),
      { name: name.trim(), estimatedAmount: Number(estimate) || 0 },
    ];
    const res = await fetch(`/api/projects/${projectId}/budget`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: next }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not add the category.");
      return;
    }
    setOpen(false);
    setName("");
    setEstimate("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" aria-hidden />
          Add category
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>Add budget category</DialogHeader>
        <DialogDescription>Track a slice of the project budget separately.</DialogDescription>
        <DialogBody>
          <form onSubmit={save} className="space-y-4">
            {error && <p className="text-[13px] text-danger">{error}</p>}
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-ink-muted" htmlFor="bc-name">Category name</label>
              <input
                id="bc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flooring, Plumbing, Painting"
                className="w-full rounded-control border border-border bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-ink-muted" htmlFor="bc-est">Estimate ($)</label>
              <input
                id="bc-est"
                type="number"
                min="0"
                step="0.01"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-control border border-border bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="submit" loading={saving}>Add category</Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}