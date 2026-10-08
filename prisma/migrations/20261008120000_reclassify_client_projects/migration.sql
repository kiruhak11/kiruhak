BEGIN;

DO $$
DECLARE
  expected_count integer;
BEGIN
  SELECT count(*) INTO expected_count
  FROM "public"."projects"
  WHERE "id" IN (
    'cmewb3qvv0003o11ge17zb005', -- KES
    'cmm7z9yya0003o3013vri6scs', -- OKNA
    'cmmth95p90000qp017bjtfbkt', -- MALINA
    'cmowkemul0001qp01741xqdo9'  -- Prof Remont
  );

  IF expected_count <> 4 THEN
    RAISE EXCEPTION 'Expected exactly 4 target client projects; found %', expected_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM "public"."projects"
    WHERE "id" IN (
      'cmewb3qvv0003o11ge17zb005',
      'cmm7z9yya0003o3013vri6scs',
      'cmmth95p90000qp017bjtfbkt',
      'cmowkemul0001qp01741xqdo9'
    )
      AND COALESCE("ownershipType", 'UNVERIFIED') NOT IN ('PARTICIPATION', 'CLIENT')
  ) THEN
    RAISE EXCEPTION 'Target client project has an unexpected ownershipType; refusing reclassification';
  END IF;
END $$;

UPDATE "public"."projects"
SET "ownershipType" = 'CLIENT'
WHERE "id" IN (
  'cmewb3qvv0003o11ge17zb005',
  'cmm7z9yya0003o3013vri6scs',
  'cmmth95p90000qp017bjtfbkt',
  'cmowkemul0001qp01741xqdo9'
)
  AND "ownershipType" <> 'CLIENT';

DO $$
DECLARE
  client_count integer;
BEGIN
  SELECT count(*) INTO client_count
  FROM "public"."projects"
  WHERE "id" IN (
    'cmewb3qvv0003o11ge17zb005',
    'cmm7z9yya0003o3013vri6scs',
    'cmmth95p90000qp017bjtfbkt',
    'cmowkemul0001qp01741xqdo9'
  ) AND "ownershipType" = 'CLIENT';

  IF client_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 target projects classified CLIENT; found %', client_count;
  END IF;
END $$;

COMMIT;
