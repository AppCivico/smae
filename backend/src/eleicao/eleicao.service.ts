import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EleicaoDto } from './entity/eleicao.entity';

@Injectable()
export class EleicaoService {

    constructor(
        private readonly prisma: PrismaService
    ) {}

    async findAll(): Promise<EleicaoDto[]> {
        return await this.prisma.eleicao.findMany();
    }

}
