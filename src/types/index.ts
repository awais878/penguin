import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Resource = Database["public"]["Tables"]["resources"]["Row"];
export type ResourceInsert = Database["public"]["Tables"]["resources"]["Insert"];

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type PointLog = Database["public"]["Tables"]["point_logs"]["Row"];
export type Download = Database["public"]["Tables"]["downloads"]["Row"];

export type ResourceType = "Notes" | "Question Papers" | "Solutions" | "Project Reports" | "Study Material";
export type PrivacyLevel = "Public" | "Private";

export interface ResourceWithProfile extends Resource {
  profiles: Pick<Profile, "name" | "college_name" | "profile_picture"> | null;
}

export interface CommentWithProfile extends Comment {
  profiles: Pick<Profile, "name" | "profile_picture"> | null;
  replies?: CommentWithProfile[];
}

export interface ReviewWithProfile extends Review {
  profiles: Pick<Profile, "name" | "profile_picture"> | null;
}
