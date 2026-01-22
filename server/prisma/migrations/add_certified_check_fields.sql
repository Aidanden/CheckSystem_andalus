-- Add new fields to certified_check_logs table
ALTER TABLE "certified_check_logs" 
ADD COLUMN IF NOT EXISTS "number_of_books" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "custom_start_serial" INTEGER;

-- Add new field to certified_check_serials table
ALTER TABLE "certified_check_serials" 
ADD COLUMN IF NOT EXISTS "custom_start_serial" INTEGER;

-- Add index for overlap checking
CREATE INDEX IF NOT EXISTS "certified_check_logs_first_last_serial_idx" ON "certified_check_logs"("first_serial", "last_serial");
