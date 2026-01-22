-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "branch_id" INTEGER;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
