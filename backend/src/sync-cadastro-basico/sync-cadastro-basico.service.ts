import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
//import { SyncResponseDto, SyncCadastroBasicoDto } from './dto/sync-cadastro-basico.dto';

@Injectable()
export class SyncCadastroBasicoService {
    constructor(private readonly prisma: PrismaService) {}
}
