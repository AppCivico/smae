import { Injectable } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';


@Injectable()
export class ImportacaoOrcamentoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) { }

    async create(dto: CreateImportacaoOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const arquivo_id = this.uploadService.checkUploadToken(dto.upload);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {

                const importacao = await prismaTxn.importacaoOrcamento.create({
                    data: {
                        criado_por: user.id,
                        arquivo_id: arquivo_id,
                        pdm_id: dto.pdm_id,
                        portfolio_id: dto.portfolio_id,
                    },
                    select: { id: true },
                });

                return importacao;
            }
        );

        return { id: created.id }
    }


}
