ALTER TABLE public.shop_data ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;

-- Members can no longer write the data row directly; all writes go through save_shop_data, which enforces role rules and version checks.
REVOKE INSERT, UPDATE ON public.shop_data FROM authenticated;

CREATE OR REPLACE FUNCTION public.save_shop_data(_shop uuid, _data jsonb, _version bigint) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.shop_role := public.shop_role_of(_shop, auth.uid()); _old jsonb; _ver bigint; k text;
BEGIN
  IF _role IS NULL THEN RAISE EXCEPTION 'forbidden: not a member'; END IF;
  SELECT data, version INTO _old, _ver FROM public.shop_data WHERE shop_id = _shop FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'forbidden: no shop data'; END IF;
  IF _ver <> _version THEN RAISE EXCEPTION 'conflict'; END IF;
  IF jsonb_typeof(_data) <> 'object' THEN RAISE EXCEPTION 'forbidden: bad data'; END IF;

  IF _old <> '{}'::jsonb AND _role <> 'owner' THEN
    IF (_old->'settings') IS DISTINCT FROM (_data->'settings') THEN RAISE EXCEPTION 'forbidden: settings'; END IF;
    IF _role = 'cashier' THEN
      FOREACH k IN ARRAY ARRAY['categories','suppliers','purchases','expenses'] LOOP
        IF (_old->k) IS DISTINCT FROM (_data->k) THEN RAISE EXCEPTION 'forbidden: %', k; END IF;
      END LOOP;
      -- existing sales/customers/payments may not be edited or removed
      IF NOT (coalesce(_data->'sales','[]') @> coalesce(_old->'sales','[]')) THEN RAISE EXCEPTION 'forbidden: sales'; END IF;
      IF NOT (coalesce(_data->'customers','[]') @> coalesce(_old->'customers','[]')) THEN RAISE EXCEPTION 'forbidden: customers'; END IF;
      IF NOT (coalesce(_data->'payments','[]') @> coalesce(_old->'payments','[]')) THEN RAISE EXCEPTION 'forbidden: payments'; END IF;
      IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(_data->'payments','[]')) p(v) WHERE p.v->>'kind' <> 'customer'
                 AND NOT (coalesce(_old->'payments','[]') @> jsonb_build_array(p.v))) THEN RAISE EXCEPTION 'forbidden: supplier payment'; END IF;
      -- medicines: same list, only stock/batches/expiry may change, and stock may only go down (sales)
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements(coalesce(_old->'medicines','[]')) o(v)
        FULL JOIN jsonb_array_elements(coalesce(_data->'medicines','[]')) n(v) ON o.v->>'id' = n.v->>'id'
        WHERE o.v IS NULL OR n.v IS NULL
           OR (o.v - 'stock' - 'batches' - 'expiry') <> (n.v - 'stock' - 'batches' - 'expiry')
           OR coalesce((n.v->>'stock')::numeric, 0) > coalesce((o.v->>'stock')::numeric, 0)
      ) THEN RAISE EXCEPTION 'forbidden: medicines'; END IF;
    END IF;
  END IF;

  UPDATE public.shop_data SET data = _data, version = _ver + 1, updated_at = now() WHERE shop_id = _shop;
  RETURN _ver + 1;
END $$;
REVOKE EXECUTE ON FUNCTION public.save_shop_data(uuid, jsonb, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_shop_data(uuid, jsonb, bigint) TO authenticated;