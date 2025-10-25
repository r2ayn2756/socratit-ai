-- ============================================================================
-- SEED DEMO SCHOOL
-- Creates a demo school for testing and development
-- ============================================================================

-- Insert demo school
INSERT INTO "School" (id, name, school_code, district_name, address, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Demo School',
  'DEMO0001',
  'Demo District',
  '123 Demo Street, Demo City, DC 12345',
  NOW(),
  NOW()
)
ON CONFLICT (school_code) DO NOTHING;

-- Verify the insert
SELECT id, name, school_code, district_name
FROM "School"
WHERE school_code = 'DEMO0001';
