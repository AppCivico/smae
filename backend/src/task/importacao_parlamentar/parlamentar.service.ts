import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Database } from 'duckdb-async';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { TaskableService } from '../entities/task.entity';
import { CreateImportacaoParlamentarDto } from './dto/create-parlamentar.dto';

const TMP_PATH = '/tmp/';
@Injectable()
export class ImportacaoParlamentarService implements TaskableService {
    private readonly logger = new Logger(ImportacaoParlamentarService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => UploadService)) private readonly uploadService: UploadService
    ) {}

    private getTmpFilePath(fileName: string, taskId: string): string {
        return TMP_PATH + ['job', taskId, fileName].join('-');
    }
    async executeJob(inputParams: CreateImportacaoParlamentarDto, taskId: string): Promise<any> {
        this.logger.verbose(`Carregando importação parlamentar id ${inputParams.upload_token}`);

        const uploadId = this.uploadService.checkDownloadToken(inputParams.upload_token);
        if (!uploadId) {
            throw new Error('Upload não encontrado');
        }

        const path = this.uploadService.getPathById(uploadId);

        const db = await Database.create(this.getTmpFilePath('db-at-' + Date.now() + '.duckdb', taskId));

        db.all('INSTALL https; INSTALL postgres; INSTALL sqlite;');
        db.all('LOAD https; LOAD postgres; LOAD sqlite;');

        db.run('ATTACH ? (TYPE SQLITE) AS importacao;', path);

        let psqlUrl = process.env.DATABASE_URL;
        const index = psqlUrl!.indexOf('?');
        if (index !== -1) {
            psqlUrl = psqlUrl!.substring(0, index);
        }
        db.run('ATTACH ? (TYPE POSTGRES) AS smae;', psqlUrl);

        db.run(`INSERT INTO smae.eleicao (tipo, ano, atual_para_mandatos)
            SELECT 
            (
                CASE WHEN de.abrangencia = 'municipal' THEN 'Municipal'
                ELSE 'Estadual'
                END
            ) tipo,
            de.ano,
            false as atual_para_mandatos
        FROM importacao.eleicao de;`);

        db.run(`INSERT INTO smae.partido (nome, sigla, numero)
            SELECT
                c.sigla_partido,
                c.sigla_partido,
                c.numero_partido
            FROM importacao.candidatura c
            WHERE NOT EXISTS (SELECT 1 FROM smae.partido sp WHERE sp.sigla = c.sigla_partido)
            GROUP BY c.sigla_partido, c.numero_partido;
        `);

        db.run(`
           INSERT INTO smae.parlamentar (nome, nome_popular, email)
            SELECT
                dp.nome,
                '' nome_popular,
                dp.email
            FROM importacao.dadospessoais dp
            WHERE dp.cpf != '-4000000000'; 
        `);

        db.run(`
            INSERT INTO smae.parlamentar_mandato (parlamentar_id, eleicao_id, partido_candidatura_id, partido_atual_id, eleito, cargo, uf, suplencia, codigo_identificador)
            SELECT
                ( SELECT id FROM smae.parlamentar WHERE nome = dp.nome ) parlamentar_id,
                ( SELECT id FROM smae.eleicao WHERE ano = c.ano ) eleicao_id,
                ( SELECT id FROM smae.partido WHERE sigla = c.sigla_partido ) partido_candidatura_id, 
                ( SELECT id FROM smae.partido WHERE sigla = c.sigla_partido ) partido_atual_id, 
                c.is_eleito,
                (
                    CASE
                        WHEN c.cargo_que_concorre = 'deputado federal' THEN 'DeputadoFederal'
                        WHEN c.cargo_que_concorre = 'deputado estadual' THEN 'DeputadoEstadual'
                        WHEN c.cargo_que_concorre = 'vereador' THEN 'Vereador'
                        ELSE 'Senador'
                    END
                ),
                'SP',
                (
                    CASE
                        WHEN c.is_suplente = 1 THEN 'PrimeiroSuplente'
                        ELSE null
                    END
                ),
                c.codigo_candidato
            FROM importacao.dadospessoais dp
            JOIN importacao.candidatura c ON dp.codigo_candidato_eleicao = c.codigo_candidato
            WHERE EXISTS (SELECT 1 FROM smae.parlamentar WHERE nome = dp.nome);
        `);

        await db.close();

        return {
            _taskId: taskId,
        };
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        this.logger.verbose(JSON.stringify(executeOutput));
        return JSON.stringify(executeOutput) as any;
    }
}
