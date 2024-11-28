import { readFileSync } from 'fs';

interface Camada {
    id: number;
    tipo_camada: string;
    codigo: string;
    titulo: string;
    nivel_regionalizacao: number;
}

interface ProcessedProject {
    original: {
        projeto_id: number;
        endereco: string;
    };
    matches?: Array<{
        similarity: number;
        full_address: string;
        endereco: any;
        camadas: Array<{
            id: number;
            codigo: string;
            titulo: string;
            descricao: string;
            nivel_regionalizacao: number;
        }>;
    }>;
}

// Read and parse the lookup file
function loadLookupData(filePath: string): Camada[] {
    const content = readFileSync(filePath, 'utf-8');
    return content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
}

// Find matching camada from lookup data
function findCamada(camadas: Camada[], titulo: string, codigo: string): Camada | undefined {
    return camadas.find((c) => c.titulo === titulo && c.codigo === codigo);
}

function processAddresses(similarityPath: string, lookupPath: string, approvedIds: string) {
    // Parse approved IDs
    const approvedIdSet = new Set(
        approvedIds
            .split(',')
            .filter((id) => id)
            .map((id) => parseInt(id))
    );

    // Load data
    const similarityData = JSON.parse(readFileSync(similarityPath, 'utf-8'));
    const lookupData = loadLookupData(lookupPath);

    // Process each approved project
    Object.entries(similarityData)
        .filter(([id]) => approvedIdSet.has(parseInt(id)))
        .forEach(([projectId, data]) => {
            const project = data as ProcessedProject;
            if (!project.matches || project.matches.length === 0) return;

            // Get best match
            const bestMatch = project.matches[0]; // Matches are already sorted by similarity

            // Find distrito and subprefeitura
            let distritoId: number | undefined;
            let subprefeituraId: number | undefined;

            bestMatch.camadas.forEach((camada) => {
                const lookupCamada = findCamada(lookupData, camada.titulo, camada.codigo);
                if (!lookupCamada) return;

                if (camada.descricao === 'Distrito Municipal') {
                    distritoId = lookupCamada.id;
                } else if (camada.descricao === 'Subprefeitura') {
                    subprefeituraId = lookupCamada.id;
                }
            });

            // Print result
            console.log(`projeto-id: ${projectId}`);
            console.log(`  similarity: ${(bestMatch.similarity * 100).toFixed(1)}%`);
            console.log(`  original: ${project.original.endereco}`);
            console.log(`  match: ${bestMatch.full_address}`);
            console.log(`  distrito_id: ${distritoId || 'not found'}`);
            console.log(`  subprefeitura_id: ${subprefeituraId || 'not found'}`);
            console.log('---');
        });
}

// Example usage:
const SIMILARITY_FILE = process.env.SIMILARITY_FILE;
if (!SIMILARITY_FILE) {
    console.error('Missing SIMILARITY_FILE env variable');
    process.exit(1);
}
const LOOKUP_FILE = process.env.LOOKUP_FILE;
if (!LOOKUP_FILE) {
    console.error('Missing LOOKUP_FILE env variable');
    process.exit(1);
}
let APPROVED_IDS = process.env.APPROVED_IDS;
if (!APPROVED_IDS) {
    console.error('Missing APPROVED_IDS env variable');
    process.exit(1);
}
if (!APPROVED_IDS.startsWith(',') || !APPROVED_IDS.endsWith(',')) {
    APPROVED_IDS = ',' + APPROVED_IDS + ',';
}

processAddresses(SIMILARITY_FILE, LOOKUP_FILE, APPROVED_IDS);
