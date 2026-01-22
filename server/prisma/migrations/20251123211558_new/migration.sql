-- AlterTable
ALTER TABLE "print_settings" ADD COLUMN     "account_number_align" TEXT DEFAULT 'left',
ADD COLUMN     "account_number_font_size" INTEGER DEFAULT 12,
ADD COLUMN     "account_number_x" DOUBLE PRECISION,
ADD COLUMN     "account_number_y" DOUBLE PRECISION,
ADD COLUMN     "check_sequence_align" TEXT DEFAULT 'left',
ADD COLUMN     "check_sequence_font_size" INTEGER DEFAULT 12,
ADD COLUMN     "check_sequence_x" DOUBLE PRECISION,
ADD COLUMN     "check_sequence_y" DOUBLE PRECISION;
