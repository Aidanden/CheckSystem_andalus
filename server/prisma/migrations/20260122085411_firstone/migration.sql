-- AddForeignKey
ALTER TABLE "certified_check_print_records" ADD CONSTRAINT "certified_check_print_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
