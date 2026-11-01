-- Intentional RED fixture: the exact residual assertion must fail when a
-- caller expects a removed v2 column to exist after clean down.
\set ON_ERROR_STOP on
DO $$
BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'catalog' AND table_name = 'sku' AND column_name = 'standardization_mode') <> 1 THEN
    RAISE EXCEPTION 'negative fixture detected missing v2 column' USING ERRCODE = '55000';
  END IF;
END $$;
