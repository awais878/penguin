
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'student');
CREATE TYPE public.resource_type AS ENUM ('Notes', 'Question Papers', 'Solutions', 'Project Reports', 'Study Material');
CREATE TYPE public.privacy_level AS ENUM ('Public', 'Private');
CREATE TYPE public.point_action AS ENUM ('upload', 'download', 'rating', 'comment', 'credit_deduction');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  college_name TEXT NOT NULL DEFAULT '',
  branch_or_department TEXT NOT NULL DEFAULT '',
  current_semester_or_year TEXT NOT NULL DEFAULT '',
  profile_picture TEXT,
  bio TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_credits INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- USER ROLES TABLE
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RESOURCES TABLE
-- =============================================
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  semester TEXT NOT NULL,
  branch_or_department TEXT NOT NULL,
  resource_type resource_type NOT NULL,
  academic_year_or_batch TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploader_college TEXT NOT NULL,
  privacy_level privacy_level NOT NULL DEFAULT 'Public',
  download_count INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Public resources: all authenticated can see. Private: only same college
CREATE POLICY "View public resources" ON public.resources FOR SELECT
  USING (
    NOT is_deleted AND (
      privacy_level = 'Public'
      OR uploader_college = (SELECT college_name FROM public.profiles WHERE id = auth.uid())
      OR uploaded_by = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Users can insert own resources" ON public.resources FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own resources" ON public.resources FOR UPDATE
  USING (auth.uid() = uploaded_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can soft-delete own resources" ON public.resources FOR DELETE
  USING (auth.uid() = uploaded_by OR public.has_role(auth.uid(), 'admin'));

-- Indexes for search/filter performance
CREATE INDEX idx_resources_subject ON public.resources(subject_name);
CREATE INDEX idx_resources_semester ON public.resources(semester);
CREATE INDEX idx_resources_type ON public.resources(resource_type);
CREATE INDEX idx_resources_branch ON public.resources(branch_or_department);
CREATE INDEX idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX idx_resources_created_at ON public.resources(created_at DESC);

-- =============================================
-- RATINGS / REVIEWS TABLE
-- =============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Auth users can create review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own review" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- COMMENTS TABLE (threaded)
-- =============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth users can create comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comment" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_comments_resource ON public.comments(resource_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

-- =============================================
-- FOLLOWS TABLE
-- =============================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- =============================================
-- POINT LOGS TABLE
-- =============================================
CREATE TABLE public.point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action point_action NOT NULL,
  points INTEGER NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own point logs" ON public.point_logs FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- DOWNLOADS TABLE (track who downloaded what)
-- =============================================
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own downloads" ON public.downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth users can insert download" ON public.downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: Update timestamps
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- TRIGGER: Recalculate rating on review change
-- =============================================
CREATE OR REPLACE FUNCTION public.recalculate_resource_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _resource_id UUID;
BEGIN
  _resource_id := COALESCE(NEW.resource_id, OLD.resource_id);
  
  UPDATE public.resources
  SET average_rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE resource_id = _resource_id), 0),
      total_ratings = (SELECT COUNT(*) FROM public.reviews WHERE resource_id = _resource_id)
  WHERE id = _resource_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_resource_rating();

-- =============================================
-- TRIGGER: Update total_comments on comment change
-- =============================================
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _resource_id UUID;
BEGIN
  _resource_id := COALESCE(NEW.resource_id, OLD.resource_id);
  
  UPDATE public.resources
  SET total_comments = (SELECT COUNT(*) FROM public.comments WHERE resource_id = _resource_id AND NOT is_deleted)
  WHERE id = _resource_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();

-- =============================================
-- TRIGGER: Update follow counts
-- =============================================
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- =============================================
-- FUNCTION: Award points (called from edge function)
-- =============================================
CREATE OR REPLACE FUNCTION public.award_points(
  _user_id UUID,
  _action point_action,
  _points INTEGER,
  _resource_id UUID DEFAULT NULL,
  _triggered_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Don't award points for self-actions
  IF _user_id = _triggered_by THEN
    RETURN;
  END IF;

  -- Log the points
  INSERT INTO public.point_logs (user_id, action, points, resource_id, triggered_by)
  VALUES (_user_id, _action, _points, _resource_id, _triggered_by);

  -- Update total points
  UPDATE public.profiles
  SET total_points = total_points + _points
  WHERE id = _user_id;

  -- Check for credit conversion (10000 points = 1 credit)
  IF (SELECT total_points FROM public.profiles WHERE id = _user_id) >= 10000 THEN
    UPDATE public.profiles
    SET total_points = total_points - 10000,
        total_credits = total_credits + 1
    WHERE id = _user_id;

    INSERT INTO public.point_logs (user_id, action, points, resource_id, triggered_by)
    VALUES (_user_id, 'credit_deduction', -10000, NULL, NULL);
  END IF;
END;
$$;

-- =============================================
-- TRIGGER: Award points on upload
-- =============================================
CREATE OR REPLACE FUNCTION public.on_resource_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.award_points(NEW.uploaded_by, 'upload', 10, NEW.id, NEW.uploaded_by);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_resource_created
  AFTER INSERT ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.on_resource_upload();

-- =============================================
-- TRIGGER: Award points on download
-- =============================================
CREATE OR REPLACE FUNCTION public.on_download_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uploader_id UUID;
BEGIN
  SELECT uploaded_by INTO _uploader_id FROM public.resources WHERE id = NEW.resource_id;
  
  -- Update download count
  UPDATE public.resources SET download_count = download_count + 1 WHERE id = NEW.resource_id;
  
  -- Award points to uploader (not self)
  IF _uploader_id != NEW.user_id THEN
    PERFORM public.award_points(_uploader_id, 'download', 2, NEW.resource_id, NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_download_created
  AFTER INSERT ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.on_download_created();

-- =============================================
-- TRIGGER: Award points on rating (4-5 stars)
-- =============================================
CREATE OR REPLACE FUNCTION public.on_review_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uploader_id UUID;
BEGIN
  SELECT uploaded_by INTO _uploader_id FROM public.resources WHERE id = NEW.resource_id;
  
  IF NEW.rating >= 4 AND _uploader_id != NEW.user_id THEN
    PERFORM public.award_points(_uploader_id, 'rating', 5, NEW.resource_id, NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_created_points
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.on_review_created();

-- =============================================
-- TRIGGER: Award points on comment
-- =============================================
CREATE OR REPLACE FUNCTION public.on_comment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uploader_id UUID;
BEGIN
  SELECT uploaded_by INTO _uploader_id FROM public.resources WHERE id = NEW.resource_id;
  
  IF _uploader_id != NEW.user_id THEN
    PERFORM public.award_points(_uploader_id, 'comment', 1, NEW.resource_id, NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_created_points
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.on_comment_created();

-- =============================================
-- STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources',
  'resources',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']
);

-- Storage policies
CREATE POLICY "Auth users can upload resources" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth users can view resource files" ON storage.objects FOR SELECT
  USING (bucket_id = 'resources');

CREATE POLICY "Users can update own resource files" ON storage.objects FOR UPDATE
  USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own resource files" ON storage.objects FOR DELETE
  USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatar storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
