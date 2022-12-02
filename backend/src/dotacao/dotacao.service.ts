import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SofApiService } from '../sof-api/sof-api.service';
import { ValidateDotacaoDto } from './dto/dotacao.dto';

@Injectable()
export class DotacaoService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly sof: SofApiService,
    ) { }

    validate(createDotacaoDto: ValidateDotacaoDto) {
        return 'This action adds a new dotacao';
    }

}
