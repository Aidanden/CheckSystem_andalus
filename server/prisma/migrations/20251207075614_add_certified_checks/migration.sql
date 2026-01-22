-- CreateTable
CREATE TABLE "certified_check_serials" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "last_serial" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certified_check_serials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certified_check_logs" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "branch_name" TEXT NOT NULL,
    "accounting_number" TEXT NOT NULL,
    "routing_number" TEXT NOT NULL,
    "first_serial" INTEGER NOT NULL,
    "last_serial" INTEGER NOT NULL,
    "total_checks" INTEGER NOT NULL,
    "operation_type" TEXT NOT NULL,
    "printed_by" INTEGER NOT NULL,
    "printed_by_name" TEXT NOT NULL,
    "print_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "certified_check_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certified_check_serials_branch_id_key" ON "certified_check_serials"("branch_id");

-- CreateIndex
CREATE INDEX "certified_check_logs_branch_id_idx" ON "certified_check_logs"("branch_id");

-- CreateIndex
CREATE INDEX "certified_check_logs_print_date_idx" ON "certified_check_logs"("print_date");

-- AddForeignKey
ALTER TABLE "certified_check_serials" ADD CONSTRAINT "certified_check_serials_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certified_check_logs" ADD CONSTRAINT "certified_check_logs_printed_by_fkey" FOREIGN KEY ("printed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certified_check_logs" ADD CONSTRAINT "certified_check_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
