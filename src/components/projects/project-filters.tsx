"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ProjectFilters({
  managers,
  customers,
  isWorker,
}: {
  managers: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  isWorker: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [status, setStatus] = React.useState(searchParams.get("status") ?? "ALL");
  const [managerId, setManagerId] = React.useState(searchParams.get("manager") ?? "ALL");
  const [customerId, setCustomerId] = React.useState(searchParams.get("customer") ?? "ALL");
  const [sort, setSort] = React.useState(searchParams.get("sort") ?? "updated");
  const [showFilters, setShowFilters] = React.useState(false);

  React.useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setStatus(searchParams.get("status") ?? "ALL");
    setManagerId(searchParams.get("manager") ?? "ALL");
    setCustomerId(searchParams.get("customer") ?? "ALL");
    setSort(searchParams.get("sort") ?? "updated");
  }, [searchParams]);

  function push(params: Record<string, string>) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.status && params.status !== "ALL") next.set("status", params.status);
    if (params.manager && params.manager !== "ALL") next.set("manager", params.manager);
    if (params.customer && params.customer !== "ALL") next.set("customer", params.customer);
    if (params.sort && params.sort !== "updated") next.set("sort", params.sort);
    const qs = next.toString();
    router.replace(qs ? `/app/projects?${qs}` : "/app/projects");
  }

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault();
    push({ search, status, manager: managerId, customer: customerId, sort });
  }

  function change(next: Partial<{ search: string; status: string; manager: string; customer: string; sort: string }>) {
    push({ search, status, manager: managerId, customer: customerId, sort, ...next });
  }

  const activeCount = [status, managerId, customerId].filter((v) => v !== "ALL").length;

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmitSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, addresses, customers…"
            className="pl-9"
            aria-label="Search projects"
          />
        </div>
        <div className="flex gap-3">
          <Select value={sort} onChange={(e) => change({ sort: e.target.value })} aria-label="Sort projects" className="w-40">
            <option value="updated">Recently updated</option>
            <option value="deadline">Nearest deadline</option>
            <option value="progress">Progress</option>
            <option value="budget">Largest budget</option>
            <option value="created">Newest</option>
          </Select>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              "inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 text-sm font-medium transition-colors",
              showFilters || activeCount > 0 ? "text-brand" : "text-ink-muted hover:bg-elevated"
            )}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">{activeCount}</span>}
          </button>
        </div>
      </form>

      {showFilters && (
        <div className="grid gap-3 rounded-control border border-border bg-elevated/60 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-ink-muted">Status</label>
            <Select value={status} onChange={(e) => change({ status: e.target.value })}>
              <option value="ALL">All statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="READY_FOR_REVIEW">Ready for review</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>
          {!isWorker && (
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-ink-muted">Project manager</label>
              <Select value={managerId} onChange={(e) => change({ manager: e.target.value })}>
                <option value="ALL">All managers</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-ink-muted">Customer</label>
            <Select value={customerId} onChange={(e) => change({ customer: e.target.value })}>
              <option value="ALL">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}