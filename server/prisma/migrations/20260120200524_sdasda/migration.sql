-- AlterTable
ALTER TABLE "certified_check_logs" ADD COLUMN     "custom_start_serial" INTEGER,
ADD COLUMN     "number_of_books" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "certified_check_serials" ADD COLUMN     "custom_start_serial" INTEGER;

-- CreateIndex
CREATE INDEX "certified_check_logs_first_serial_last_serial_idx" ON "certified_check_logs"("first_serial", "last_serial");
