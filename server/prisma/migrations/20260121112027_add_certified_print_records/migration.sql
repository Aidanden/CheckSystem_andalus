-- AlterTable
ALTER TABLE "print_settings" ADD COLUMN     "amount_numbers_align" TEXT DEFAULT 'left',
ADD COLUMN     "amount_numbers_font_size" INTEGER DEFAULT 14,
ADD COLUMN     "amount_numbers_x" DOUBLE PRECISION,
ADD COLUMN     "amount_numbers_y" DOUBLE PRECISION,
ADD COLUMN     "amount_words_align" TEXT DEFAULT 'right',
ADD COLUMN     "amount_words_font_size" INTEGER DEFAULT 11,
ADD COLUMN     "amount_words_x" DOUBLE PRECISION,
ADD COLUMN     "amount_words_y" DOUBLE PRECISION,
ADD COLUMN     "beneficiary_name_align" TEXT DEFAULT 'right',
ADD COLUMN     "beneficiary_name_font_size" INTEGER DEFAULT 12,
ADD COLUMN     "beneficiary_name_x" DOUBLE PRECISION,
ADD COLUMN     "beneficiary_name_y" DOUBLE PRECISION,
ADD COLUMN     "check_number_align" TEXT DEFAULT 'left',
ADD COLUMN     "check_number_font_size" INTEGER DEFAULT 11,
ADD COLUMN     "check_number_x" DOUBLE PRECISION,
ADD COLUMN     "check_number_y" DOUBLE PRECISION,
ADD COLUMN     "check_type_align" TEXT DEFAULT 'center',
ADD COLUMN     "check_type_font_size" INTEGER DEFAULT 12,
ADD COLUMN     "check_type_x" DOUBLE PRECISION,
ADD COLUMN     "check_type_y" DOUBLE PRECISION,
ADD COLUMN     "issue_date_align" TEXT DEFAULT 'right',
ADD COLUMN     "issue_date_font_size" INTEGER DEFAULT 10,
ADD COLUMN     "issue_date_x" DOUBLE PRECISION,
ADD COLUMN     "issue_date_y" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "certified_check_print_records" (
    "id" SERIAL NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "beneficiary_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "amount_dinars" TEXT NOT NULL,
    "amount_dirhams" TEXT NOT NULL,
    "amount_in_words" TEXT NOT NULL,
    "issue_date" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "check_number" TEXT NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certified_check_print_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certified_check_print_records_check_number_key" ON "certified_check_print_records"("check_number");

-- CreateIndex
CREATE INDEX "certified_check_print_records_branch_id_idx" ON "certified_check_print_records"("branch_id");

-- CreateIndex
CREATE INDEX "certified_check_print_records_created_at_idx" ON "certified_check_print_records"("created_at");
