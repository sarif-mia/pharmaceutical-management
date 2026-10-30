CREATE TABLE public.pharmacy_data (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharmacy_data TO authenticated;
GRANT ALL ON public.pharmacy_data TO service_role;
ALTER TABLE public.pharmacy_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own data select" ON public.pharmacy_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own data insert" ON public.pharmacy_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own data update" ON public.pharmacy_data FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own data delete" ON public.pharmacy_data FOR DELETE TO authenticated USING (auth.uid() = user_id);