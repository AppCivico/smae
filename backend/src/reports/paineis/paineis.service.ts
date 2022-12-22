import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelPaineisDto } from './dto/create-paineis.dto';
import { ListRelPaineisDto } from './entities/paineis.entity';

@Injectable()
export class PaineisService implements ReportableService {
    private readonly logger = new Logger(PaineisService.name);
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(dto: CreateRelPaineisDto): Promise<ListRelPaineisDto> {
        throw 'not implemented';
    }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as ListRelPaineisDto;
        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });
        const out: FileOutput[] = [];

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(JSON.stringify({
                    params: params,
                    "horario": Date2YMD.tzSp2UTC(new Date())
                }), "utf8")
            },

        ]
    }
}
