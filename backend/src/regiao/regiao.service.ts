import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateRegiaoDto, FilterRegiaoDto } from './dto/create-regiao.dto';
import { UpdateRegiaoDto } from './dto/update-regiao.dto';

@Injectable()
export class RegiaoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) {}

    async create(createRegiaoDto: CreateRegiaoDto, user: PessoaFromJwt) {
        if (!createRegiaoDto.parente_id) {
            createRegiaoDto.parente_id = undefined;

            if (createRegiaoDto.nivel != 1) throw new HttpException('Região sem parente_id precisa ser nível 1', 400);
        }

        if (createRegiaoDto.parente_id) {
            const upper = await this.prisma.regiao.findFirst({
                where: { id: createRegiaoDto.parente_id, removido_em: null },
                select: { nivel: true, descricao: true },
            });
            if (!upper) throw new HttpException('Região acima não encontrada', 404);

            if (upper.nivel != createRegiaoDto.nivel - 1) {
                throw new HttpException(
                    'Região acima precisa ser do nível menor que a nova região' +
                        ` (região acima, "${upper.descricao}" (nível ${upper.nivel}) != nova região (nível ${createRegiaoDto.nivel}) - 1)`,
                    400
                );
            }
        }

        if (createRegiaoDto.nivel === 1) {
            const nivel1exists = await this.prisma.regiao.count({
                where: {
                    removido_em: null,
                    nivel: 1,
                },
            });
            if (nivel1exists > 0)
                throw new HttpException(
                    'nivel| Já existe uma região nivel 1 no SMAE, só é suportado um município por vez.',
                    400
                );
        }

        const similarExists = await this.prisma.regiao.count({
            where: {
                descricao: { endsWith: createRegiaoDto.descricao, mode: 'insensitive' },
                removido_em: null,
                nivel: createRegiaoDto.nivel,
            },
        });
        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        let uploadId: number | null = null;
        if (createRegiaoDto.upload_shapefile) {
            uploadId = this.uploadService.checkUploadOrDownloadToken(createRegiaoDto.upload_shapefile);
        }
        delete createRegiaoDto.upload_shapefile;

        const created = await this.prisma.regiao.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createRegiaoDto,
                arquivo_shapefile_id: uploadId,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(filters: FilterRegiaoDto, user: PessoaFromJwt) {
        const ehParaCasaCivil = user.modulo_sistema.includes('CasaCivil');

        const listActive = await this.prisma.regiao.findMany({
            where: {
                removido_em: null,
                nivel: filters.nivel,
                parente_id: filters.parente_id,
                AND: ehParaCasaCivil
                    ? undefined
                    : [
                          // god forgive me
                          {
                              OR: [
                                  { descricao: 'São Paulo', nivel: 1 },
                                  { RegiaoAcima: { descricao: 'São Paulo', nivel: 1 } },
                                  { RegiaoAcima: { RegiaoAcima: { descricao: 'São Paulo', nivel: 1 } } },
                              ],
                          },
                      ],
            },
            orderBy: [{ nivel: 'asc' }, { parente_id: 'asc' }],
            take: ehParaCasaCivil ? undefined : 1, // limitando artificialmente a lista de CRUD até resolver o problema no frontend
            select: {
                id: true,
                descricao: true,
                nivel: true,
                codigo: true,
                parente_id: true,
                arquivo_shapefile_id: true,
                shapefile: true,
                pdm_codigo_sufixo: true,
            },
        });

        for (const item of listActive) {
            if (item.arquivo_shapefile_id)
                item.shapefile = this.uploadService.getDownloadToken(
                    item.arquivo_shapefile_id,
                    '1 days'
                ).download_token;
        }

        return listActive;
    }

    async update(id: number, updateRegiaoDto: UpdateRegiaoDto, user: PessoaFromJwt) {
        const self = await this.prisma.regiao.findFirst({
            where: { id: id, removido_em: null },
            select: { nivel: true, descricao: true },
        });
        if (!self) throw new HttpException('Região não encontrada', 404);

        if (updateRegiaoDto.parente_id) {
            const upper = await this.prisma.regiao.findFirst({
                where: { id: updateRegiaoDto.parente_id, removido_em: null },
                select: { nivel: true, descricao: true },
            });
            if (!upper) throw new HttpException('Região acima não encontrada', 404);

            if (upper.nivel != self.nivel - 1) {
                throw new HttpException(
                    'Região acima precisa ser do nível menor que região atual' +
                        ` (região acima, "${upper.descricao}" (nível ${upper.nivel}) != região "${self.descricao}" (nível ${self.nivel}) - 1)`,
                    400
                );
            }
        }

        if (updateRegiaoDto.parente_id) {
            const similarExists = await this.prisma.regiao.count({
                where: {
                    descricao: { endsWith: updateRegiaoDto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    nivel: self.nivel,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException(
                    'descricao| Descrição igual ou semelhante já existe em outro registro ativo',
                    400
                );
        }

        let uploadId: number | null | undefined = undefined;
        if (updateRegiaoDto.upload_shapefile === null || updateRegiaoDto.upload_shapefile === '') {
            // remove o arquivo
            uploadId = null;
        } else if (updateRegiaoDto.upload_shapefile) {
            uploadId = this.uploadService.checkUploadOrDownloadToken(updateRegiaoDto.upload_shapefile);
        }
        delete updateRegiaoDto.upload_shapefile;

        await this.prisma.regiao.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateRegiaoDto,
                arquivo_shapefile_id: uploadId,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const self = await this.prisma.regiao.findFirst({
            where: { id: id },
            select: { parente_id: true },
        });
        if (!self) throw new HttpException('Região não encontrada', 404);

        const existsDown = await this.prisma.regiao.count({
            where: { parente_id: id, removido_em: null },
        });
        if (existsDown > 0)
            throw new HttpException(
                `Há ${existsDown} região(ões) dependentes. Apague primeiro as regiões abaixo.`,
                400
            );

        const created = await this.prisma.regiao.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }

    async getDetail(id: number, user: PessoaFromJwt) {
        const first = await this.prisma.regiao.findFirst({
            where: {
                id: id,
            },
            select: {
                id: true,
                descricao: true,
                nivel: true,
                codigo: true,
                parente_id: true,
                shapefile: true,
                pdm_codigo_sufixo: true,
            },
        });
        if (!first) throw new HttpException('Região não encontrada', 404);

        return first;
    }
}
