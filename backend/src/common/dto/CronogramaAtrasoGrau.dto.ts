import { MaxLength } from "class-validator";

export class CronogramaAtrasoGrau {
    id: number | null;

    @MaxLength(255, { message: 'O campo "Atraso grau" deve ter no máximo 255 caracteres' })
    atraso_grau: string | null;
}
