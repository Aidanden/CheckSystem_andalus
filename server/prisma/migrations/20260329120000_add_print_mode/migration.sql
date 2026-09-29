-- AlterTable
ALTER TABLE "print_settings" ADD COLUMN IF NOT EXISTS "print_mode" TEXT NOT NULL DEFAULT 'single';
