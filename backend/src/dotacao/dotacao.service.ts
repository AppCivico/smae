import { DateTime } from "luxon";
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

    async validate(dto: ValidateDotacaoDto) {


        if (dto.planejado) {
            const r = await this.sof.empenhoDotacao({
                dotacao: dto.dotacao,
                ano: dto.ano,
                mes: 1
            });
            console.log(r);


        } else {

            const currentMonth = DateTime.now().month;
            await this.sof.empenhoDotacao({
                dotacao: dto.dotacao,
                ano: dto.ano,
                mes: DateTime.now().year < dto.ano ? 12 : currentMonth
            });

        }


        return 'This action adds a new dotacao';
    }

}
