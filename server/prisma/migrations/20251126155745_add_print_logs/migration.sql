-- CreateTable
CREATE TABLE "print_logs" (
    "id" SERIAL NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_branch" TEXT NOT NULL,
    "branch_name" TEXT,
    "first_cheque_number" INTEGER NOT NULL,
    "last_cheque_number" INTEGER NOT NULL,
    "total_cheques" INTEGER NOT NULL,
    "account_type" INTEGER NOT NULL,
    "operation_type" TEXT NOT NULL,
    "printed_by" INTEGER NOT NULL,
    "printed_by_name" TEXT NOT NULL,
    "print_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "print_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printed_cheques" (
    "id" SERIAL NOT NULL,
    "account_number" TEXT NOT NULL,
    "cheque_number" INTEGER NOT NULL,
    "print_log_id" INTEGER NOT NULL,
    "print_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "can_reprint" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "printed_cheques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "print_logs_account_number_idx" ON "print_logs"("account_number");

-- CreateIndex
CREATE INDEX "print_logs_print_date_idx" ON "print_logs"("print_date");

-- CreateIndex
CREATE INDEX "print_logs_operation_type_idx" ON "print_logs"("operation_type");

-- CreateIndex
CREATE INDEX "printed_cheques_account_number_idx" ON "printed_cheques"("account_number");

-- CreateIndex
CREATE UNIQUE INDEX "printed_cheques_account_number_cheque_number_key" ON "printed_cheques"("account_number", "cheque_number");

-- AddForeignKey
ALTER TABLE "print_logs" ADD CONSTRAINT "print_logs_printed_by_fkey" FOREIGN KEY ("printed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
