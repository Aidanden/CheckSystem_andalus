-- Create Certified Check Serial Tracker table
CREATE TABLE IF NOT EXISTS "certified_check_serials" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "last_serial" INTEGER NOT NULL DEFAULT 0,
    "custom_start_serial" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certified_check_serials_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on branch_id
CREATE UNIQUE INDEX IF NOT EXISTS "certified_check_serials_branch_id_key" ON "certified_check_serials"("branch_id");

-- Create Certified Check Log table
CREATE TABLE IF NOT EXISTS "certified_check_logs" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "branch_name" TEXT NOT NULL,
    "accounting_number" TEXT NOT NULL,
    "routing_number" TEXT NOT NULL,
    "first_serial" INTEGER NOT NULL,
    "last_serial" INTEGER NOT NULL,
    "total_checks" INTEGER NOT NULL,
    "number_of_books" INTEGER NOT NULL DEFAULT 1,
    "custom_start_serial" INTEGER,
    "operation_type" TEXT NOT NULL,
    "printed_by" INTEGER NOT NULL,
    "printed_by_name" TEXT NOT NULL,
    "print_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "certified_check_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "certified_check_logs_branch_id_idx" ON "certified_check_logs"("branch_id");
CREATE INDEX IF NOT EXISTS "certified_check_logs_print_date_idx" ON "certified_check_logs"("print_date");
CREATE INDEX IF NOT EXISTS "certified_check_logs_first_last_serial_idx" ON "certified_check_logs"("first_serial", "last_serial");

-- Add foreign key constraints (assuming branches and users tables exist)
-- ALTER TABLE "certified_check_serials" ADD CONSTRAINT "certified_check_serials_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "certified_check_logs" ADD CONSTRAINT "certified_check_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ALTER TABLE "certified_check_logs" ADD CONSTRAINT "certified_check_logs_printed_by_fkey" FOREIGN KEY ("printed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
