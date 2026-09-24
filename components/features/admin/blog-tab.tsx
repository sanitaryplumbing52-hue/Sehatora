"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  slug: string;
}

export function BlogTab() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", status: "DRAFT" as "DRAFT" | "PUBLISHED" });

  function reload() {
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((json) => setPosts(json.posts ?? []));
  }

  useEffect(reload, []);

  async function createPost() {
    if (!form.title || !form.content) {
      toast({ title: "Title and content are required" });
      return;
    }
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ title: "", excerpt: "", content: "", status: "DRAFT" });
      reload();
      toast({ title: "Post created" });
    }
  }

  async function togglePublish(post: Post) {
    await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
    });
    reload();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 rounded-xl border border-border p-4">
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <Textarea
          placeholder="Content (markdown supported)"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="min-h-[160px]"
        />
        <div className="flex items-center gap-3">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "DRAFT" | "PUBLISHED" })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={createPost}>Create post</Button>
        </div>
      </div>

      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">/blog/{p.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={p.status === "PUBLISHED" ? "success" : "outline"}>{p.status}</Badge>
              <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
