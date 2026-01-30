// upload/dto/arquivo-preview.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { arquivo_preview_status, arquivo_preview_tipo } from '@prisma/client';
import { IsString } from 'class-validator';

/**
 * DTO para informações de preview de um arquivo
 * Retornado como parte do ArquivoBaseDto
 */
export class ArquivoPreviewDto {
    /**
     * Status atual do preview
     * @example "concluido"
     */
    @ApiProperty({
        enum: arquivo_preview_status,
        enumName: 'arquivo_preview_status',
        description: `Status do preview:
- pendente: Task criada, aguardando execução
- executando: Task em execução
- concluido: Preview gerado com sucesso
- erro: Erro durante a geração
- sem_suporte: Tipo de arquivo não suportado
- pulado: Arquivo muito grande ou é ZIP`,
        example: 'concluido',
    })
    status: arquivo_preview_status;

    /**
     * Tipo de preview gerado/a ser gerado
     * @example "conversao_pdf"
     */
    @ApiPropertyOptional({
        enum: arquivo_preview_tipo,
        enumName: 'arquivo_preview_tipo',
        description: `Tipo de preview:
- redimensionamento: Para imagens - apenas redimensiona
- conversao_pdf: Para documentos - converte para PDF
- conversao_csv: Para arquivos CSV - converte para PDF com tabela
- conversao_json: Para arquivos JSON - converte para PDF com syntax highlighting
- conversao_txt: Para arquivos TXT - converte para PDF`,
        example: 'conversao_pdf',
    })
    tipo: arquivo_preview_tipo | null;

    /**
     * Mensagem de erro caso o preview tenha falhado
     * Null se não houve erro
     * @example "Arquivo corrompido ou formato não suportado pelo conversor"
     */
    @ApiPropertyOptional({
        description: 'Mensagem de erro caso o preview tenha falhado',
        example: 'Arquivo corrompido ou formato não suportado pelo conversor',
        nullable: true,
    })
    erro_mensagem: string | null;

    /**
     * Token para download do arquivo de preview
     * Null se o preview ainda não foi gerado ou falhou
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiPropertyOptional({
        description: 'Token JWT para download do preview. Null se não disponível.',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        nullable: true,
    })
    download_token: string | null;

    /**
     * Mime type do arquivo de preview
     * - Para redimensionamento: image/jpeg ou image/png
     * - Para conversão: application/pdf
     * Null se o preview ainda não foi gerado
     * @example "application/pdf"
     */
    @ApiPropertyOptional({
        description: 'Mime type do arquivo de preview',
        example: 'application/pdf',
        nullable: true,
    })
    mime_type: string | null;

    /**
     * Tamanho do arquivo de preview em bytes
     * Null se o preview ainda não foi gerado
     * @example 102400
     */
    @ApiPropertyOptional({
        description: 'Tamanho do arquivo de preview em bytes',
        example: 102400,
        nullable: true,
    })
    tamanho_bytes: number | null;

    /**
     * Data/hora em que o preview foi criado/atualizado
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiPropertyOptional({
        description: 'Data/hora da última atualização do preview',
        example: '2024-01-15T10:30:00.000Z',
        nullable: true,
    })
    atualizado_em: Date | null;
}

/**
 * DTO base para arquivos - VERSÃO ATUALIZADA COM PREVIEW
 * Retornado em endpoints de listagem de documentos
 */
export class ArquivoBaseDto {
    /**
     * ID único do arquivo
     * @example 123
     */
    @ApiProperty({
        description: 'ID único do arquivo',
        example: 123,
    })
    id: number;

    /**
     * @deprecated Sempre null, não usar. Descrições estão nos documentos, não nos arquivos.
     */
    @ApiProperty({
        deprecated: true,
        description:
            'Sempre null, não usar, pois as descrições geralmente corretas estão nos documentos e não nos arquivos.',
        nullable: true,
    })
    descricao: string | null;

    /**
     * Tamanho do arquivo original em bytes
     * @example 1048576
     */
    @ApiProperty({
        description: 'Tamanho do arquivo em bytes',
        example: 1048576,
    })
    tamanho_bytes: number;

    /**
     * Nome original do arquivo quando foi feito o upload
     * @example "relatorio-2024.pdf"
     */
    @ApiProperty({
        description: 'Nome original do arquivo',
        example: 'relatorio-2024.pdf',
    })
    nome_original: string;

    /**
     * Token JWT para download do arquivo original
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiProperty({
        description: 'Token JWT para download do arquivo',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    download_token: string;

    /**
     * Caminho do diretório virtual onde o arquivo está organizado
     * @example "/Documentos/2024/Janeiro/"
     */
    @ApiPropertyOptional({
        description: 'Caminho do diretório virtual',
        example: '/Documentos/2024/Janeiro/',
        nullable: true,
    })
    diretorio_caminho: string | null;

    /**
     * Informações sobre o preview do arquivo
     * Null se preview não foi solicitado (tipo != DOCUMENTO)
     */
    @ApiPropertyOptional({
        type: ArquivoPreviewDto,
        description: `Informações sobre o preview do arquivo.
Null se o arquivo não é do tipo DOCUMENTO (ex: SHAPEFILE, ICONE_TAG, etc).

O frontend deve tratar os diferentes status:
- pendente/executando: Mostrar loading/skeleton
- concluido: Usar download_token para exibir o preview
- erro: Mostrar mensagem de erro
- sem_suporte: Mostrar mensagem "Preview não disponível para este tipo de arquivo"
- pulado: Mostrar mensagem "Arquivo muito grande para preview" ou similar`,
        nullable: true,
    })
    preview: ArquivoPreviewDto | null;
}

/**
 * DTO para solicitar geração de preview manualmente
 * (caso queira implementar um endpoint para forçar regeneração)
 */
export class SolicitarPreviewDto {
    /**
     * Token de upload ou download do arquivo
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiProperty({
        description: 'Token de upload ou download do arquivo',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    token: string;
}

/**
 * Resposta ao solicitar preview
 */
export class SolicitarPreviewResponseDto {
    /**
     * Se a solicitação foi aceita
     * @example true
     */
    @ApiProperty({
        description: 'Se a solicitação de preview foi aceita',
        example: true,
    })
    aceito: boolean;

    /**
     * Mensagem informativa
     * @example "Preview será gerado em breve"
     */
    @ApiProperty({
        description: 'Mensagem informativa',
        example: 'Preview será gerado em breve',
    })
    mensagem: string;

    /**
     * Status atual do preview
     */
    @ApiProperty({
        enum: arquivo_preview_status,
        enumName: 'arquivo_preview_status',
    })
    status: arquivo_preview_status;
}
