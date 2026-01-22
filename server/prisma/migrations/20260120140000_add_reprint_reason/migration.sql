-- AlterTable
ALTER TABLE "print_logs" ADD COLUMN IF NOT EXISTS "reprint_reason" VARCHAR(20);

-- Add comment
COMMENT ON COLUMN "print_logs"."reprint_reason" IS 'سبب إعادة الطباعة: damaged (تالفة) أو not_printed (لم تطبع)';
