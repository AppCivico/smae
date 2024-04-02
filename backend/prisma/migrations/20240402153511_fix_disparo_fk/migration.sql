-- DropForeignKey
ALTER TABLE "aviso_email_disparos" DROP CONSTRAINT "aviso_email_disparos_id_fkey";

-- AddForeignKey
ALTER TABLE "aviso_email_disparos" ADD CONSTRAINT "aviso_email_disparos_aviso_email_id_fkey" FOREIGN KEY ("aviso_email_id") REFERENCES "aviso_email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
