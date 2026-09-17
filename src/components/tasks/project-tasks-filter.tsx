"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ProjectTasksFilter({
  projects,
  isWorker,
}: {
  projects: { id: string; name: string }[];
  isWorker: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = searchParams.get("project") ?? "ALL";
  const mine = searchParams.get("mine");

  function setProject(value: string) {
    const next = new URLSearchParams();
    if (value !== "ALL") next.set("project", value);
    if (mine === "1") next.set("mine", "1");
    const qs = next.toString();
    router.replace(qs ? `/app/tasks?${qs}` : "/app/tasks");
  }

  return (
    <div className={cn("flex items-center gap-3", !isWorker && "justify-between")}>
      <Select value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project" className="w-full max-w-[260px]">
        <option value="ALL">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>
      {isWorker && (
        <p className="text-[13px] text-ink-muted">
          Showing tasks assigned to you.
        </p>
      )}
    </div>
  );
}