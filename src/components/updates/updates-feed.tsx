"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Newspaper, Send, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export interface UpdateItem {
  id: string;
  title: string;
  body: string;
  isPublished: boolean;
  visibility: string;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string };
  project?: { id: string; name: string };
  comments: Array<{ id: string; body: string; createdAt: string; author: { id: string; name: string } }>;
  files: Array<{ id: string; originalName: string; url: string; thumbnailUrl: string | null; isImage: boolean }>;
}

export function UpdatesFeed({
  updates,
  projectId,
  canWrite,
}: {
  updates: UpdateItem[];
  projectId: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [draft, setDraft] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [commentDrafts, setCommentDrafts] = React.useState<Record<string, string>>({});
  const [commenting, setCommenting] = React.useState<string | null>(null);

  async function submitCreate() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, visibility: "CUSTOMER_VISIBLE", publish: !draft }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not save the update.");
      return;
    }
    setTitle("");
    setBody("");
    setDraft(false);
    router.refresh();
  }

  async function togglePublish(update: UpdateItem) {
    const res = await fetch(`/api/updates/${update.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: update.title, body: update.body, visibility: update.visibility, publish: !update.isPublished }),
    });
    if (res.ok) router.refresh();
  }

  async function remove(update: UpdateItem) {
    const res = await fetch(`/api/updates/${update.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function submitComment(updateId: string) {
    const text = commentDrafts[updateId]?.trim();
    if (!text) return;
    setCommenting(updateId);
    const res = await fetch(`/api/updates/${updateId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setCommenting(null);
    if (res.ok) {
      setCommentDrafts((d) => ({ ...d, [updateId]: "" }));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[16px]">Post an update</CardTitle>
            <CardDescription>Keep the customer in the loop on progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormMessage error={error} />
            <Input placeholder="Headline" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="What's happening on site? Describe progress, results, next steps."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-muted">
                <input type="checkbox" checked={!draft} onChange={(e) => setDraft(!e.target.checked)} className="accent-brand" />
                Publish to customer
              </label>
              <Button onClick={submitCreate} disabled={saving || !title.trim() || !body.trim()} loading={saving}>
                <Send className="h-4 w-4" aria-hidden />
                {draft ? "Save draft" : "Publish update"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {updates.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No updates yet"
          description={canWrite ? "Post your first update to share progress with the customer." : "Updates from your team will appear here."}
        />
      ) : (
        updates.map((update) => (
          <Card key={update.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-[15px]">{update.title}</CardTitle>
                  {update.isPublished ? (
                    <Badge tone="success">
                      <Eye className="h-3 w-3" aria-hidden />
                      Published
                    </Badge>
                  ) : (
                    <Badge tone="neutral">
                      <EyeOff className="h-3 w-3" aria-hidden />
                      Draft
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {update.project && (
                    <>
                      <Link href={`/portal/projects/${update.project.id}/updates`} className="font-medium text-brand hover:underline">
                        {update.project.name}
                      </Link>
                      {" · "}
                    </>
                  )}
                  {update.author.name} · {relativeTime(update.publishedAt ?? update.createdAt)}
                </CardDescription>
              </div>
              {canWrite && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => togglePublish(update)}>
                    {update.isPublished ? (
                      <>
                        <EyeOff className="h-4 w-4" aria-hidden />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" aria-hidden />
                        Publish
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(update)} className="text-danger hover:bg-dangerTint">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{update.body}</p>
                {update.files.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {update.files.map((f) => (
                      <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="group block aspect-[4/3] overflow-hidden rounded-control border border-border">
                        {f.isImage && f.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.thumbnailUrl} alt={f.originalName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] text-ink-muted">
                            {f.originalName}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {update.comments.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  {update.comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <Avatar name={c.author.name} size="xs" />
                      <div className="min-w-0 flex-1 rounded-control bg-elevated px-3 py-2">
                        <p className="flex items-baseline justify-between gap-2 text-[12px]">
                          <span className="font-medium text-ink">{c.author.name}</span>
                          <span className="text-ink-faint">{relativeTime(c.createdAt)}</span>
                        </p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 border-t border-border pt-3">
                <Input
                  placeholder="Reply with a note…"
                  value={commentDrafts[update.id] ?? ""}
                  onChange={(e) => setCommentDrafts((d) => ({ ...d, [update.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment(update.id);
                  }}
                  className="flex-1"
                />
                <Button size="sm" onClick={() => submitComment(update.id)} disabled={commenting === update.id}>
                  {commenting === update.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}