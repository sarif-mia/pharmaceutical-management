CREATE TYPE public.shop_role AS ENUM ('owner','manager','cashier');

CREATE TABLE public.shops (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL DEFAULT 'আমার ফার্মেসি', owner_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.shop_members (shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE, user_id uuid NOT NULL, email text NOT NULL DEFAULT '', role public.shop_role NOT NULL DEFAULT 'cashier', created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (shop_id, user_id), UNIQUE (user_id));
CREATE TABLE public.shop_invites (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE, email text NOT NULL, role public.shop_role NOT NULL DEFAULT 'cashier', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (shop_id, email));
CREATE TABLE public.shop_data (shop_id uuid PRIMARY KEY REFERENCES public.shops(id) ON DELETE CASCADE, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());

GRANT SELECT ON public.shops TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.shop_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.shop_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.shop_data TO authenticated;
GRANT ALL ON public.shops, public.shop_members, public.shop_invites, public.shop_data TO service_role;

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_data ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.shop_role_of(_shop uuid, _user uuid) RETURNS public.shop_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.shop_members WHERE shop_id = _shop AND user_id = _user
$$;

CREATE POLICY "members read shop" ON public.shops FOR SELECT TO authenticated USING (public.shop_role_of(id, auth.uid()) IS NOT NULL);
CREATE POLICY "members read members" ON public.shop_members FOR SELECT TO authenticated USING (public.shop_role_of(shop_id, auth.uid()) IS NOT NULL);
CREATE POLICY "owner updates members" ON public.shop_members FOR UPDATE TO authenticated USING (public.shop_role_of(shop_id, auth.uid()) = 'owner' AND user_id <> auth.uid()) WITH CHECK (public.shop_role_of(shop_id, auth.uid()) = 'owner' AND role <> 'owner');
CREATE POLICY "owner removes members" ON public.shop_members FOR DELETE TO authenticated USING (public.shop_role_of(shop_id, auth.uid()) = 'owner' AND user_id <> auth.uid());
CREATE POLICY "owner reads invites" ON public.shop_invites FOR SELECT TO authenticated USING (public.shop_role_of(shop_id, auth.uid()) = 'owner');
CREATE POLICY "owner adds invites" ON public.shop_invites FOR INSERT TO authenticated WITH CHECK (public.shop_role_of(shop_id, auth.uid()) = 'owner' AND role <> 'owner');
CREATE POLICY "owner deletes invites" ON public.shop_invites FOR DELETE TO authenticated USING (public.shop_role_of(shop_id, auth.uid()) = 'owner');
CREATE POLICY "members read data" ON public.shop_data FOR SELECT TO authenticated USING (public.shop_role_of(shop_id, auth.uid()) IS NOT NULL);
CREATE POLICY "members insert data" ON public.shop_data FOR INSERT TO authenticated WITH CHECK (public.shop_role_of(shop_id, auth.uid()) IS NOT NULL);
CREATE POLICY "members update data" ON public.shop_data FOR UPDATE TO authenticated USING (public.shop_role_of(shop_id, auth.uid()) IS NOT NULL) WITH CHECK (public.shop_role_of(shop_id, auth.uid()) IS NOT NULL);

-- Joins the caller to an invited shop, or creates their own shop (copying old personal data). Returns shop id and role.
CREATE OR REPLACE FUNCTION public.ensure_shop() RETURNS TABLE(shop_id uuid, role public.shop_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _email text; _inv record; _sid uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT lower(email) INTO _email FROM auth.users WHERE id = _uid;
  IF NOT EXISTS (SELECT 1 FROM public.shop_members m WHERE m.user_id = _uid) THEN
    SELECT * INTO _inv FROM public.shop_invites i WHERE lower(i.email) = _email ORDER BY created_at LIMIT 1;
    IF FOUND THEN
      INSERT INTO public.shop_members(shop_id, user_id, email, role) VALUES (_inv.shop_id, _uid, _email, _inv.role);
      DELETE FROM public.shop_invites i WHERE lower(i.email) = _email;
    ELSE
      INSERT INTO public.shops(owner_id) VALUES (_uid) RETURNING id INTO _sid;
      INSERT INTO public.shop_members(shop_id, user_id, email, role) VALUES (_sid, _uid, coalesce(_email,''), 'owner');
      INSERT INTO public.shop_data(shop_id, data) SELECT _sid, coalesce((SELECT p.data FROM public.pharmacy_data p WHERE p.user_id = _uid), '{}'::jsonb);
    END IF;
  END IF;
  RETURN QUERY SELECT m.shop_id, m.role FROM public.shop_members m WHERE m.user_id = _uid;
END $$;
REVOKE EXECUTE ON FUNCTION public.ensure_shop() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_shop() TO authenticated;
COMMENT ON TABLE public.pharmacy_data IS 'DEPRECATED: replaced by shop_data (copied on first ensure_shop call)';