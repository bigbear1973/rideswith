-- Migration script to convert ChapterRole enum from LEAD/AMBASSADOR to OWNER/ADMIN/MODERATOR
-- Run this script BEFORE deploying the new schema

-- Step 1: Update existing data to map old roles to new roles
-- LEAD -> OWNER (full control)
-- AMBASSADOR -> MODERATOR (basic permissions)
UPDATE "ChapterMember" SET "role" = 'OWNER' WHERE "role" = 'LEAD';
UPDATE "ChapterMember" SET "role" = 'MODERATOR' WHERE "role" = 'AMBASSADOR';

-- Note: After running this, deploy the app and Prisma will update the enum
