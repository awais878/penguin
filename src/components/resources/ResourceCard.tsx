import { Link } from "react-router-dom";
import { ResourceWithProfile } from "@/types";
import { Star, Download, MessageSquare, FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResourceCardProps {
  resource: ResourceWithProfile;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const isPrivate = resource.privacy_level === "Private";

  return (
    <Link
      to={`/resources/${resource.id}`}
      className="group block border rounded-lg p-5 hover:shadow-md transition-all bg-card"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm group-hover:underline underline-offset-2 truncate">
            {resource.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {resource.subject_name} · {resource.semester}
          </p>
        </div>
        {isPrivate && (
          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="secondary" className="text-xs font-normal">
          <FileText className="h-3 w-3 mr-1" />
          {resource.resource_type}
        </Badge>
        {resource.branch_or_department && (
          <Badge variant="outline" className="text-xs font-normal">
            {resource.branch_or_department}
          </Badge>
        )}
      </div>

      {resource.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {resource.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
        <span className="truncate">
          {resource.profiles?.name || "Anonymous"}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {resource.average_rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {Number(resource.average_rating).toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {resource.download_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {resource.total_comments}
          </span>
        </div>
      </div>
    </Link>
  );
}
