/*
  Warnings:

  - You are about to drop the column `account_holder_name_font_weight` on the `print_settings` table. All the data in the column will be lost.
  - You are about to drop the column `account_number_font_weight` on the `print_settings` table. All the data in the column will be lost.
  - You are about to drop the column `branch_name_font_weight` on the `print_settings` table. All the data in the column will be lost.
  - You are about to drop the column `check_sequence_font_weight` on the `print_settings` table. All the data in the column will be lost.
  - You are about to drop the column `micr_line_font_weight` on the `print_settings` table. All the data in the column will be lost.
  - You are about to drop the column `serial_number_font_weight` on the `print_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "accounting_number" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "branch_number" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "print_settings" DROP COLUMN "account_holder_name_font_weight",
DROP COLUMN "account_number_font_weight",
DROP COLUMN "branch_name_font_weight",
DROP COLUMN "check_sequence_font_weight",
DROP COLUMN "micr_line_font_weight",
DROP COLUMN "serial_number_font_weight";
