import { readFileSync, writeFileSync } from 'fs';
import stringSimilarity from 'string-similarity';

interface ProcessedProject {
    original: any;
    error?: any;
    matches?: Array<{
        rua: string;
        similarity: number;
        full_address: string;
        endereco: any;
        camadas: any[];
    }>;
}

function processProjetos(inputPath: string, outputPath: string) {
    const jsonContent = readFileSync(inputPath, 'utf-8');
    const data = JSON.parse(jsonContent);
    const processed: { [key: string]: ProcessedProject } = {};

    Object.entries(data.processed).forEach(([projectId, projectData]: [string, any]) => {
        const processedProject: ProcessedProject = {
            original: projectData.original,
        };

        if (projectData.error) {
            processedProject.error = projectData.error;
        } else if (projectData.response?.linhas) {
            const originalAddress = projectData.original.endereco.toLowerCase();
            const matches = projectData.response.linhas
                .filter((linha: any) => linha.endereco.properties.rua)
                .map((linha: any) => ({
                    rua: linha.endereco.properties.rua,
                    similarity: stringSimilarity.compareTwoStrings(
                        originalAddress,
                        linha.endereco.properties.rua.toLowerCase()
                    ),
                    full_address: linha.endereco.properties.string_endereco,
                    endereco: linha.endereco,
                    camadas: linha.camadas || [],
                }))
                .sort((a: any, b: any) => b.similarity - a.similarity);

            processedProject.matches = matches;
        }

        processed[projectId] = processedProject;
    });

    writeFileSync(outputPath, JSON.stringify(processed, null, 2), 'utf-8');
}

function processProjectsToCsv(inputPath: string, outputPath: string) {
    const data = JSON.parse(readFileSync(inputPath, 'utf-8'));

    // Define CSV headers
    const headers = [
        'projeto_id',
        'status',
        'original_endereco',
        'original_cep',
        'best_match_rua',
        'similarity_percentage',
        'best_match_full_address',
        'best_match_bairro',
        'best_match_cep',
        'best_match_coordinates',
        'distrito_municipal',
        'subprefeitura',
        'error_details',
    ];

    const lines: string[] = [headers.join('|')];

    // Sort projects by ID
    const sortedProjects = Object.entries(data).sort(([idA], [idB]) => parseInt(idA) - parseInt(idB));

    sortedProjects.forEach(([projectId, project]: [string, any]) => {
        if (!project) {
            lines.push(`${projectId}|ERROR|||||||||||||No data`);
            return;
        }

        const original = project.original || {};
        const bestMatch = project.matches?.[0] || {};
        const error = project.error;

        // Format coordinates if they exist
        const coordinates = bestMatch.endereco?.geometry?.coordinates
            ? `${bestMatch.endereco.geometry.coordinates[0]},${bestMatch.endereco.geometry.coordinates[1]}`
            : '';

        // Get district information
        const distrito = bestMatch.camadas?.find((c: any) => c.descricao === 'Distrito Municipal');
        const subprefeitura = bestMatch.camadas?.find((c: any) => c.descricao === 'Subprefeitura');

        const row = [
            projectId,
            error ? 'ERROR' : project.matches?.[0] ? 'Sem resultados' : 'OK',
            original.endereco || '',
            original.cep || '',
            bestMatch.rua || '',
            bestMatch.similarity ? (bestMatch.similarity * 100).toFixed(1) : '',
            bestMatch.full_address || '',
            bestMatch.endereco?.properties?.bairro || '',
            bestMatch.endereco?.properties?.cep || '',
            coordinates,
            distrito ? `${distrito.titulo} (${distrito.codigo})` : '',
            subprefeitura ? `${subprefeitura.titulo} (${subprefeitura.codigo})` : '',
            error ? `${error.statusCode} - ${error.message}` : '',
        ];

        // Escape any pipe characters in the data and join with pipe separator
        lines.push(row.map((field) => String(field).replace(/\|/g, ';')).join('|'));
    });

    writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}

const STATE_FILE = process.env.STATE_FILE as string;
if (!STATE_FILE) {
    console.error('STATE_FILE environment variable is required');
    process.exit(1);
}
const OUTPUT_FILE = process.env.OUTPUT_FILE as string;
if (!OUTPUT_FILE) {
    console.error('OUTPUT_FILE environment variable is required');
    process.exit(1);
}
processProjetos(STATE_FILE, OUTPUT_FILE);
processProjectsToCsv(OUTPUT_FILE, OUTPUT_FILE + '.csv');
