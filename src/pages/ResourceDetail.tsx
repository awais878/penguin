import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ReviewSection } from "@/components/resources/ReviewSection";
import { CommentSection } from "@/components/resources/CommentSection";
import { ResourceWithProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Download, Star, MessageSquare, FileText, Lock, Calendar,
  User, BookOpen, Loader2
} from "lucide-react";

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*, profiles(name, college_name, profile_picture)")
        .eq("id", id)
        .single();

      if (error) {
        toast({ title: "Resource not found or access denied", variant: "destructive" });
        navigate("/resources");
        return;
      }
      setResource(data as ResourceWithProfile);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDownload = async () => {
    if (!resource || !user) return;
    setDownloading(true);

    try {
      const { data, error } = await supabase.storage
        .from("resources")
        .download(resource.file_path);

      if (error) throw error;

      // Record download
      await supabase.from("downloads").insert({
        resource_id: resource.id,
        user_id: user.id,
      });

      // Trigger browser download
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = resource.file_name || "download";
      a.click();
      URL.revokeObjectURL(url);

      setResource(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!resource) return null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{resource.title}</h1>
              <p className="text-muted-foreground">{resource.subject_name}</p>
            </div>
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "..." : "Download"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">
              <FileText className="h-3 w-3 mr-1" />
              {resource.resource_type}
            </Badge>
            <Badge variant="outline">{resource.semester} Semester</Badge>
            <Badge variant="outline">{resource.branch_or_department}</Badge>
            {resource.privacy_level === "Private" && (
              <Badge variant="outline">
                <Lock className="h-3 w-3 mr-1" />
                {resource.uploader_college} Only
              </Badge>
            )}
          </div>

          {resource.description && (
            <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
          )}

          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {resource.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t pt-4">
            <Link to={`/profile/${resource.uploaded_by}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <User className="h-3.5 w-3.5" />
              {resource.profiles?.name || "Anonymous"}
            </Link>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(resource.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              {Number(resource.average_rating).toFixed(1)} ({resource.total_ratings})
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {resource.download_count} downloads
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {resource.total_comments} comments
            </span>
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection resourceId={resource.id} uploaderId={resource.uploaded_by} />

        {/* Comments */}
        <CommentSection resourceId={resource.id} />
      </div>
    </AppLayout>
  );
}
