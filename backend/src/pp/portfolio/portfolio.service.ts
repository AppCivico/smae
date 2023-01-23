import { Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioDto } from './entities/portfolio.entity';

@Injectable()
export class PortfolioService {
    async create(createPortfolioDto: CreatePortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        return {
            id: 0
        }
    }

    async findAll(user: PessoaFromJwt): Promise<PortfolioDto> {
        return `This action returns all portfolio`;
    }

    async update(id: number, updatePortfolioDto: UpdatePortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        return {
            id: 0
        }
    }

    async remove(id: number, user: PessoaFromJwt) {

        return;
    }
}
