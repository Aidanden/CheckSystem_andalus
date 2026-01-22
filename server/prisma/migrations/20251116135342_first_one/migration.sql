-- CreateTable
CREATE TABLE "print_settings" (
    "id" SERIAL NOT NULL,
    "account_type" INTEGER NOT NULL,
    "check_width" DOUBLE PRECISION NOT NULL,
    "check_height" DOUBLE PRECISION NOT NULL,
    "branch_name_x" DOUBLE PRECISION NOT NULL,
    "branch_name_y" DOUBLE PRECISION NOT NULL,
    "branch_name_font_size" INTEGER NOT NULL DEFAULT 14,
    "branch_name_align" TEXT NOT NULL DEFAULT 'center',
    "serial_number_x" DOUBLE PRECISION NOT NULL,
    "serial_number_y" DOUBLE PRECISION NOT NULL,
    "serial_number_font_size" INTEGER NOT NULL DEFAULT 12,
    "serial_number_align" TEXT NOT NULL DEFAULT 'right',
    "account_holder_name_x" DOUBLE PRECISION NOT NULL,
    "account_holder_name_y" DOUBLE PRECISION NOT NULL,
    "account_holder_name_font_size" INTEGER NOT NULL DEFAULT 10,
    "account_holder_name_align" TEXT NOT NULL DEFAULT 'left',
    "micr_line_x" DOUBLE PRECISION NOT NULL,
    "micr_line_y" DOUBLE PRECISION NOT NULL,
    "micr_line_font_size" INTEGER NOT NULL DEFAULT 12,
    "micr_line_align" TEXT NOT NULL DEFAULT 'center',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "print_settings_account_type_key" ON "print_settings"("account_type");
