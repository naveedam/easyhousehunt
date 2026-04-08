
-- 1. Messages table for chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view messages"
ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enquiries e
    JOIN public.properties p ON p.id = e.property_id
    WHERE e.id = messages.enquiry_id
    AND (e.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Chat participants can send messages"
ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.enquiries e
    JOIN public.properties p ON p.id = e.property_id
    WHERE e.id = messages.enquiry_id
    AND (e.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
  )
);

-- 2. Saved properties (bookmarks)
CREATE TABLE public.saved_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved properties"
ON public.saved_properties FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save properties"
ON public.saved_properties FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave properties"
ON public.saved_properties FOR DELETE USING (auth.uid() = user_id);

-- 3. Add is_featured to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 4. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 5. Rate-limit function: max 5 enquiries/day per tenant
CREATE OR REPLACE FUNCTION public.check_enquiry_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM public.enquiries
  WHERE tenant_id = NEW.tenant_id
  AND created_at > now() - interval '1 day';

  IF daily_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 5 enquiries per day';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_enquiry_rate_limit
BEFORE INSERT ON public.enquiries
FOR EACH ROW
EXECUTE FUNCTION public.check_enquiry_rate_limit();

-- 6. Auto-assign admin role to specific email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'tenant');
  
  -- Auto-assign admin to specific email
  IF NEW.email = 'naveedahmedm@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Index for performance
CREATE INDEX idx_messages_enquiry_id ON public.messages(enquiry_id);
CREATE INDEX idx_saved_properties_user_id ON public.saved_properties(user_id);
CREATE INDEX idx_enquiries_tenant_created ON public.enquiries(tenant_id, created_at);
