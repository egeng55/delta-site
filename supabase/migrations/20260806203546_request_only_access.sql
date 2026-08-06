-- Request-only private-preview access ledger.
-- Hosted Supabase Auth must also have "Allow new users to sign up" disabled.

CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL CHECK (
    char_length(email) BETWEEN 3 AND 254
    AND email = LOWER(email)
  ),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 1200),
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'reviewing', 'approved', 'declined', 'invited')),
  source TEXT NOT NULL DEFAULT 'delta-site/signup',
  privacy_notice_version TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS access_requests_email_unique
  ON public.access_requests (LOWER(email));
CREATE INDEX IF NOT EXISTS access_requests_status_submitted_idx
  ON public.access_requests (status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS public.access_request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.access_requests(id) ON DELETE CASCADE,
  from_status TEXT CHECK (
    from_status IS NULL OR from_status IN ('submitted', 'reviewing', 'approved', 'declined', 'invited')
  ),
  to_status TEXT NOT NULL
    CHECK (to_status IN ('submitted', 'reviewing', 'approved', 'declined', 'invited')),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS access_request_events_request_created_idx
  ON public.access_request_events (request_id, created_at);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_request_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.access_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.access_request_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.access_requests TO service_role;
GRANT SELECT ON TABLE public.access_request_events TO service_role;

CREATE OR REPLACE FUNCTION public.set_access_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_access_request_updated_at() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_access_request_status_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.access_request_events (
      request_id,
      from_status,
      to_status,
      actor_user_id
    ) VALUES (
      NEW.id,
      NULL,
      NEW.status,
      NEW.reviewed_by
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.access_request_events (
      request_id,
      from_status,
      to_status,
      actor_user_id
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.reviewed_by
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.record_access_request_status_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS access_requests_updated_at ON public.access_requests;
CREATE TRIGGER access_requests_updated_at
  BEFORE UPDATE ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_access_request_updated_at();

DROP TRIGGER IF EXISTS access_request_status_audit ON public.access_requests;
CREATE TRIGGER access_request_status_audit
  AFTER INSERT OR UPDATE OF status ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.record_access_request_status_event();

COMMENT ON TABLE public.access_requests IS
  'Minimal request-only private-preview application data; server and owner access only.';
COMMENT ON TABLE public.access_request_events IS
  'Append-only lifecycle evidence for access request status changes.';
