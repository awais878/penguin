import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CommentWithProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Reply, CornerDownRight } from "lucide-react";

interface CommentSectionProps {
  resourceId: string;
}

export function CommentSection({ resourceId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(name, profile_picture)")
      .eq("resource_id", resourceId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    const flat = (data as CommentWithProfile[]) || [];
    // Build tree
    const map = new Map<string, CommentWithProfile>();
    const roots: CommentWithProfile[] = [];
    flat.forEach(c => { c.replies = []; map.set(c.id, c); });
    flat.forEach(c => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies!.push(c);
      } else {
        roots.push(c);
      }
    });
    setComments(roots);
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [resourceId]);

  const handleSubmit = async (parentId: string | null = null) => {
    if (!user) return;
    const text = parentId ? replyContent : content;
    if (!text.trim()) return;
    setSubmitting(true);

    await supabase.from("comments").insert({
      resource_id: resourceId,
      user_id: user.id,
      parent_id: parentId,
      content: text.trim(),
    });

    if (parentId) {
      setReplyContent("");
      setReplyTo(null);
    } else {
      setContent("");
    }
    await loadComments();
    setSubmitting(false);
  };

  const renderComment = (comment: CommentWithProfile, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? "ml-6 border-l pl-4" : ""}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.profiles?.name || "Anonymous"}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{comment.content}</p>
        {user && depth < 3 && (
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Reply className="h-3 w-3" /> Reply
          </button>
        )}
        {replyTo === comment.id && (
          <div className="mt-2 flex gap-2">
            <Textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={() => handleSubmit(comment.id)} disabled={submitting}>
              <CornerDownRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      {comment.replies?.map(r => renderComment(r, depth + 1))}
    </div>
  );

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Discussion</h2>

      {user && (
        <div className="mb-6">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Ask a question or share your thoughts..."
            rows={3}
            className="mb-2"
          />
          <Button size="sm" onClick={() => handleSubmit()} disabled={submitting || !content.trim()}>
            {submitting ? "..." : "Post Comment"}
          </Button>
        </div>
      )}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : comments.length > 0 ? (
        <div className="divide-y">
          {comments.map(c => renderComment(c))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet. Start the discussion!</p>
      )}
    </section>
  );
}
