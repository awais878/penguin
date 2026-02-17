import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceWithProfile } from "@/types";
import { Loader2, BookOpen, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [feedResources, setFeedResources] = useState<ResourceWithProfile[]>([]);
  const [trendingResources, setTrendingResources] = useState<ResourceWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalResources: 0, totalDownloads: 0 });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get followed user IDs
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followedIds = follows?.map(f => f.following_id) || [];

      // Feed from followed users
      if (followedIds.length > 0) {
        const { data } = await supabase
          .from("resources")
          .select("*, profiles(name, college_name, profile_picture)")
          .in("uploaded_by", followedIds)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(10);
        setFeedResources((data as ResourceWithProfile[]) || []);
      }

      // Trending resources
      const { data: trending } = await supabase
        .from("resources")
        .select("*, profiles(name, college_name, profile_picture)")
        .eq("is_deleted", false)
        .eq("privacy_level", "Public")
        .order("download_count", { ascending: false })
        .limit(6);
      setTrendingResources((trending as ResourceWithProfile[]) || []);

      // Stats
      const { count: resCount } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("uploaded_by", user.id);

      const { data: downloads } = await supabase
        .from("downloads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({ totalResources: resCount || 0, totalDownloads: 0 });
      setLoading(false);
    };
    load();
  }, [user]);

  const needsProfile = profile && (!profile.college_name || !profile.branch_or_department);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-10">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Welcome back{profile?.name ? `, ${profile.name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Your academic resource hub
          </p>
        </div>

        {/* Complete profile nudge */}
        {needsProfile && (
          <div className="border rounded-lg p-4 bg-secondary">
            <p className="text-sm font-medium mb-2">Complete your profile</p>
            <p className="text-sm text-muted-foreground mb-3">
              Add your college and department to access private resources from your institution.
            </p>
            <Link
              to="/profile/edit"
              className="text-sm font-medium underline underline-offset-4 hover:text-foreground"
            >
              Complete Profile →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Your Uploads", value: stats.totalResources, icon: BookOpen },
            { label: "Points", value: profile?.total_points || 0, icon: TrendingUp },
            { label: "Credits", value: profile?.total_credits || 0, icon: TrendingUp },
            { label: "Followers", value: profile?.followers_count || 0, icon: Users },
          ].map(stat => (
            <div key={stat.label} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Feed */}
        {feedResources.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">From People You Follow</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {feedResources.map(r => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          </section>
        )}

        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Trending Resources</h2>
            <Link to="/resources" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse all →
            </Link>
          </div>
          {trendingResources.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trendingResources.map(r => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No resources yet</p>
              <Link to="/upload" className="text-sm font-medium underline underline-offset-4">
                Be the first to upload →
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
