INSERT INTO "School" (id, "school_code", name, "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'DEMO0001', 'Demo School', true, NOW(), NOW())
ON CONFLICT ("school_code") DO NOTHING;
