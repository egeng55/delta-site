-- Fix RLS policy to prevent users from escalating their own role.
-- The previous "Users can update own profile" policy allowed updating all columns
-- including `role`, which could allow privilege escalation.

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())
  );
