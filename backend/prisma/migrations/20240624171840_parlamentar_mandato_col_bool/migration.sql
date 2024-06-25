-- AlterTable
ALTER TABLE "parlamentar" ADD COLUMN     "tem_mandato" BOOLEAN;

UPDATE parlamentar SET tem_mandato = TRUE WHERE EXISTS (SELECT 1 FROM parlamentar_mandato WHERE parlamentar_id = parlamentar.id);