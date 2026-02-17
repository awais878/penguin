import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, ArrowLeft, FileUp } from "lucide-react";
import { ResourceType, PrivacyLevel } from "@/types";

const RESOURCE_TYPES: ResourceType[] = ["Notes", "Question Papers", "Solutions", "Project Reports", "Study Material"];
const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export default function UploadResource() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    subject_name: "",
    semester: "",
    branch_or_department: profile?.branch_or_department || "",
    resource_type: "" as ResourceType | "",
    academic_year_or_batch: "",
    description: "",
    tags: "",
    privacy_level: "Public" as PrivacyLevel,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (f.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 50MB", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !file) return;

    if (!profile.college_name) {
      toast({ title: "Complete your profile first", description: "Add your college name before uploading.", variant: "destructive" });
      navigate("/profile/edit");
      return;
    }

    if (!form.resource_type) {
      toast({ title: "Select a resource type", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Upload file
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create resource record
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      
      const { error: dbError } = await supabase.from("resources").insert({
        title: form.title,
        subject_name: form.subject_name,
        semester: form.semester,
        branch_or_department: form.branch_or_department,
        resource_type: form.resource_type as ResourceType,
        academic_year_or_batch: form.academic_year_or_batch || null,
        description: form.description || null,
        tags,
        uploaded_by: user.id,
        uploader_college: profile.college_name,
        privacy_level: form.privacy_level,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });

      if (dbError) throw dbError;

      toast({ title: "Resource uploaded successfully!" });
      navigate("/resources");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-2">Upload Resource</h1>
        <p className="text-muted-foreground mb-8">Share study materials with your peers</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File upload */}
          <div className="space-y-2">
            <Label>File</Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-foreground/30 transition-colors">
              <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : "Click to select a file (PDF, DOCX, PPT, Images)"}
              </span>
              {file && (
                <span className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp"
                required
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Data Structures Notes - Unit 1" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={form.subject_name} onChange={e => setForm({...form, subject_name: e.target.value})} placeholder="e.g. Data Structures" required />
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={form.semester} onValueChange={v => setForm({...form, semester: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s} Semester</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resource Type</Label>
              <Select value={form.resource_type} onValueChange={v => setForm({...form, resource_type: v as ResourceType})}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch / Department</Label>
              <Input id="branch" value={form.branch_or_department} onChange={e => setForm({...form, branch_or_department: e.target.value})} placeholder="e.g. CSE" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Privacy</Label>
              <Select value={form.privacy_level} onValueChange={v => setForm({...form, privacy_level: v as PrivacyLevel})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public — Anyone can access</SelectItem>
                  <SelectItem value="Private">Private — Same college only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Academic Year / Batch</Label>
              <Input id="batch" value={form.academic_year_or_batch} onChange={e => setForm({...form, academic_year_or_batch: e.target.value})} placeholder="e.g. 2024-25" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe what this resource covers..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. algorithms, sorting, trees" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <UploadIcon className="h-4 w-4 mr-2" />
            {loading ? "Uploading..." : "Upload Resource"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
