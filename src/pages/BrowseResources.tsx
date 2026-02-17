import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceWithProfile, ResourceType } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

const RESOURCE_TYPES: ResourceType[] = ["Notes", "Question Papers", "Solutions", "Project Reports", "Study Material"];
const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "most_popular", label: "Most Popular" },
];

export default function BrowseResources() {
  const [resources, setResources] = useState<ResourceWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("resources")
        .select("*, profiles(name, college_name, profile_picture)")
        .eq("is_deleted", false);

      if (search) {
        query = query.or(`title.ilike.%${search}%,subject_name.ilike.%${search}%`);
      }
      if (semester) query = query.eq("semester", semester);
      if (resourceType) query = query.eq("resource_type", resourceType as any);

      if (sortBy === "latest") query = query.order("created_at", { ascending: false });
      else if (sortBy === "highest_rated") query = query.order("average_rating", { ascending: false });
      else if (sortBy === "most_popular") query = query.order("download_count", { ascending: false });

      query = query.limit(50);

      const { data } = await query;
      setResources((data as ResourceWithProfile[]) || []);
      setLoading(false);
    };
    load();
  }, [search, semester, resourceType, sortBy]);

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">Browse Resources</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or subject..."
              className="pl-9"
            />
          </div>
          <Select value={semester} onValueChange={v => setSemester(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={resourceType} onValueChange={v => setResourceType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : resources.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No resources found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
