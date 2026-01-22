-- AlterTable
ALTER TABLE "print_settings" ADD COLUMN     "account_holder_name_font_weight" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "account_number_font_weight" TEXT DEFAULT 'bold',
ADD COLUMN     "branch_name_font_weight" TEXT NOT NULL DEFAULT 'bold',
ADD COLUMN     "check_sequence_font_weight" TEXT DEFAULT 'normal',
ADD COLUMN     "micr_line_font_weight" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "serial_number_font_weight" TEXT NOT NULL DEFAULT 'normal';
