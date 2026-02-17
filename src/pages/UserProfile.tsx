import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Profile, ResourceWithProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, BookOpen, TrendingUp, Edit, ArrowLeft } from "lucide-react";

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resources, setResources] = useState<ResourceWithProfile[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", id).single();
      setProfile(prof);

      const { data: res } = await supabase
        .from("resources")
        .select("*, profiles(name, college_name, profile_picture)")
        .eq("uploaded_by", id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20);
      setResources((res as ResourceWithProfile[]) || []);

      if (user && user.id !== id) {
        const { data: follow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", id)
          .maybeSingle();
        setIsFollowing(!!follow);
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user || !id || isOwnProfile) return;
    setFollowLoading(true);

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
      setIsFollowing(false);
      setProfile(prev => prev ? { ...prev, followers_count: Math.max(prev.followers_count - 1, 0) } : null);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
      setIsFollowing(true);
      setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
    }
    setFollowLoading(false);
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

  if (!profile) {
    return (
      <AppLayout>
        <p className="text-center text-muted-foreground py-20">User not found</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Profile header */}
        <div className="border rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold shrink-0">
                {profile.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="text-xl font-bold">{profile.name || "Unnamed"}</h1>
                {profile.college_name && (
                  <p className="text-sm text-muted-foreground">{profile.college_name}</p>
                )}
                {profile.branch_or_department && (
                  <p className="text-sm text-muted-foreground">
                    {profile.branch_or_department} · {profile.current_semester_or_year}
                  </p>
                )}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
                )}
              </div>
            </div>

            <div className="shrink-0">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/profile/edit">
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Link>
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={toggleFollow}
                  disabled={followLoading}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-6 mt-6 pt-4 border-t text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="font-medium text-foreground">{profile.followers_count}</span> followers
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">{profile.following_count}</span> following
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium text-foreground">{profile.total_points}</span> points
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium text-foreground">{resources.length}</span> uploads
            </div>
          </div>
        </div>

        {/* Resources */}
        <h2 className="text-lg font-semibold mb-4">Uploads</h2>
        {resources.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-10">No uploads yet</p>
        )}
      </div>
    </AppLayout>
  );
}
