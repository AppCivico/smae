import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ProjetoDetailDto, ProjetoDto } from './entities/projeto.entity';

@Injectable()
export class ProjetoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly portfolioService: PortfolioService,

    ) { }

    async create(dto: CreateProjetoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        if (!user.hasSomeRoles(['SMAE.admin_portfolio'])) {
            // logo é SMAE.gestor_de_projeto, só pode criar projetos em alguns portfolios
            const allowed = (await this.portfolioService.findAll(user)).map(r => +r.id);
            if (allowed.includes(+ dto.portfolio_id) == false)
                throw new HttpException('portfolio_id| Portifolio não está liberado para criação de projetos para seu usuário', 400);
        }

        throw '...'
    }

    async findAll(user: PessoaFromJwt): Promise<ProjetoDto[]> {
        throw '...'
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<ProjetoDetailDto> {
        throw '...'
    }

    async update(id: number, updateProjetoDto: UpdateProjetoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        throw '...'
    }

    async remove(id: number, user: PessoaFromJwt) {

        return;
    }
}
