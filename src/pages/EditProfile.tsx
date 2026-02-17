import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Save } from "lucide-react";

export default function EditProfile() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: profile?.name || "",
    college_name: profile?.college_name || "",
    branch_or_department: profile?.branch_or_department || "",
    current_semester_or_year: profile?.current_semester_or_year || "",
    bio: profile?.bio || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
      await refreshProfile();
      navigate(`/profile/${profile.id}`);
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="college">College Name</Label>
            <Input id="college" value={form.college_name} onChange={e => setForm({...form, college_name: e.target.value})} placeholder="e.g. MIT, Stanford University" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch / Department</Label>
              <Input id="branch" value={form.branch_or_department} onChange={e => setForm({...form, branch_or_department: e.target.value})} placeholder="e.g. Computer Science" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester / Year</Label>
              <Input id="semester" value={form.current_semester_or_year} onChange={e => setForm({...form, current_semester_or_year: e.target.value})} placeholder="e.g. 3rd Year" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={form.bio || ""} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Tell us about yourself..." rows={4} />
          </div>

          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
