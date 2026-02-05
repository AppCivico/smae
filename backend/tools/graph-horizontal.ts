/**
 * Generate horizontal (left-to-right) layout for module dependencies
 * Groups by layer/feature area arranged horizontally
 * Usage: npx ts-node tools/graph-horizontal.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { globSync } from 'glob';

interface ModuleNode {
    name: string;
    path: string;
    imports: string[];
    forwardRefs: string[];
    area: string;
}

function extractModules(): ModuleNode[] {
    const moduleFiles = globSync('src/**/*.module.ts', { absolute: true });
    const modules: ModuleNode[] = [];
    
    for (const filePath of moduleFiles) {
        const content = readFileSync(filePath, 'utf-8');
        
        const nameMatch = content.match(/export class (\w+Module)/);
        if (!nameMatch) continue;
        
        const moduleName = nameMatch[1];
        const relativePath = filePath.replace(process.cwd(), '.');
        const area = relativePath.split('/')[2] || 'root';
        
        const importsMatch = content.match(/imports:\s*\[([^\]]+)\]/s);
        const imports: string[] = [];
        const forwardRefs: string[] = [];
        
        if (importsMatch) {
            const importsContent = importsMatch[1];
            
            const forwardRefRegex = /forwardRef\s*\(\s*\(\)\s*=>\s*(\w+Module)\s*\)/g;
            let match;
            while ((match = forwardRefRegex.exec(importsContent)) !== null) {
                forwardRefs.push(match[1]);
            }
            
            const directImportRegex = /(?<!forwardRef\s*\(\s*\(\)\s*=>\s*)(\w+Module)(?!\s*\w)/g;
            while ((match = directImportRegex.exec(importsContent)) !== null) {
                const mod = match[1];
                if (!forwardRefs.includes(mod) && 
                    !['PrismaModule', 'JwtModule', 'ScheduleModule', 'ConfigModule'].includes(mod)) {
                    imports.push(mod);
                }
            }
        }
        
        modules.push({
            name: moduleName,
            path: relativePath,
            imports,
            forwardRefs,
            area
        });
    }
    
    return modules;
}

function findCircularDependencies(modules: ModuleNode[]): string[][] {
    const graph = new Map<string, Set<string>>();
    
    for (const mod of modules) {
        const deps = new Set([...mod.imports, ...mod.forwardRefs]);
        graph.set(mod.name, deps);
    }
    
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    function dfs(node: string): void {
        if (recursionStack.has(node)) {
            const cycleStart = path.indexOf(node);
            if (cycleStart !== -1) {
                const cycle = [...path.slice(cycleStart), node];
                const cycleKey = cycle.join(',');
                
                if (!cycles.some(c => [...c, c[0]].join(',') === cycleKey)) {
                    cycles.push([...path.slice(cycleStart), node]);
                }
            }
            return;
        }
        
        if (visited.has(node)) return;
        
        visited.add(node);
        recursionStack.add(node);
        path.push(node);
        
        const deps = graph.get(node) || new Set();
        for (const dep of deps) {
            if (graph.has(dep)) {
                dfs(dep);
            }
        }
        
        path.pop();
        recursionStack.delete(node);
    }
    
    for (const mod of modules) {
        if (!visited.has(mod.name)) {
            dfs(mod.name);
        }
    }
    
    return cycles;
}

function generateHorizontalDot(modules: ModuleNode[], cycles: string[][]): string {
    const modulesInCycles = new Set<string>();
    for (const cycle of cycles) {
        for (const mod of cycle) modulesInCycles.add(mod);
    }

    // Define layers based on architectural patterns
    const layerMap: Record<string, number> = {
        // Layer 0: Core infrastructure
        'PrismaModule': 0,
        'ConfigModule': 0,
        'ScheduleModule': 0,
        
        // Layer 1: Common/Shared services
        'SmaeConfigModule': 1,
        'CacheKVModule': 1,
        'UploadModule': 1,
        'CommonBaseModule': 1,
        'DuckDBModule': 1,
        'GraphvizModule': 1,
        'SofApiModule': 1,
        'SeiApiModule': 1,
        'GeoApiModule': 1,
        'TransfereGovApiModule': 1,
        
        // Layer 2: Base domain modules
        'PessoaModule': 2,
        'OrgaoModule': 2,
        'PessoaPrivilegioModule': 2,
        'EquipeRespModule': 2,
        'GeoLocModule': 2,
        'DotacaoModule': 2,
        
        // Layer 3: Feature modules
        'WorkflowModule': 3,
        'PdmModule': 3,
        'ProjetoModule': 3,
        'TransferenciaModule': 3,
        'DemandaModule': 3,
        'MetaModule': 3,
        'VariavelModule': 3,
        'IndicadorModule': 3,
        
        // Layer 4: Reports and aggregations
        'ReportsModule': 4,
        'TaskModule': 4,
        'DashboardModule': 4,
    };

    // Calculate layer for each module based on dependencies
    function getLayer(modName: string, visited = new Set<string>()): number {
        if (visited.has(modName)) return 5; // Circular, put at end
        if (layerMap[modName] !== undefined) return layerMap[modName];
        
        const mod = modules.find(m => m.name === modName);
        if (!mod) return 5;
        
        visited.add(modName);
        const deps = [...mod.imports, ...mod.forwardRefs];
        if (deps.length === 0) return 1; // No deps = base layer
        
        const depLayers = deps.map(d => getLayer(d, new Set(visited)));
        const maxDepLayer = Math.max(...depLayers, 0);
        return maxDepLayer + 1;
    }

    // Build layers
    const layers = new Map<number, ModuleNode[]>();
    for (const mod of modules) {
        const layer = Math.min(getLayer(mod.name), 6);
        if (!layers.has(layer)) layers.set(layer, []);
        layers.get(layer)!.push(mod);
    }

    const lines = [
        'digraph NestJSModulesHorizontal {',
        '    rankdir=LR;  // Left to right layout',
        '    node [shape=box, style=filled, fontname="Arial", fontsize=9, margin="0.2,0.1"];',
        '    edge [fontname="Arial", fontsize=8, arrowsize=0.7];',
        '    splines=ortho;  // Orthogonal edges for cleaner look',
        '    nodesep=0.4;',
        '    ranksep=1.5;',
        '    concentrate=true;',
        ''
    ];

    // Color scheme
    const areaColors: Record<string, string> = {
        'auth': '#e3f2fd',
        'casa-civil': '#fce4ec',
        'pp': '#e8f5e9',
        'pdm': '#fff3e0',
        'mf': '#f3e5f5',
        'reports': '#e0f2f1',
        'task': '#fff8e1',
        'common': '#efebe9',
        'geo': '#e1f5fe',
        'bloco-nota': '#fbe9e7',
        'default': '#fafafa'
    };

    // Create layers as clusters arranged horizontally
    for (let i = 0; i <= 6; i++) {
        const layerMods = layers.get(i) || [];
        if (layerMods.length === 0) continue;

        lines.push(`    subgraph cluster_layer${i} {`);
        lines.push(`        label="Layer ${i}";`);
        lines.push('        style=filled;');
        lines.push('        fillcolor=gray95;');
        lines.push('        color=gray70;');
        lines.push('        penwidth=1;');
        lines.push('        labelloc=t;');
        lines.push('        labeljust=center;');
        lines.push('');

        // Group by area within layer
        const areasInLayer = new Map<string, ModuleNode[]>();
        for (const mod of layerMods) {
            if (!areasInLayer.has(mod.area)) areasInLayer.set(mod.area, []);
            areasInLayer.get(mod.area)!.push(mod);
        }

        let areaIdx = 0;
        for (const [area, mods] of areasInLayer) {
            if (mods.length > 1) {
                lines.push(`        // ${area}`);
                for (const mod of mods) {
                    const color = modulesInCycles.has(mod.name) ? '#ffccbc' : (areaColors[area] || areaColors.default);
                    const shape = modulesInCycles.has(mod.name) ? 'box, peripheries=2' : 'box';
                    const penwidth = modulesInCycles.has(mod.name) ? '2' : '1';
                    lines.push(`        "${mod.name}" [fillcolor="${color}", shape=${shape}, penwidth=${penwidth}];`);
                }
                lines.push('');
            } else {
                const mod = mods[0];
                const color = modulesInCycles.has(mod.name) ? '#ffccbc' : (areaColors[area] || areaColors.default);
                const shape = modulesInCycles.has(mod.name) ? 'box, peripheries=2' : 'box';
                const penwidth = modulesInCycles.has(mod.name) ? '2' : '1';
                lines.push(`        "${mod.name}" [fillcolor="${color}", shape=${shape}, penwidth=${penwidth}];`);
            }
            areaIdx++;
        }

        lines.push('    }');
        lines.push('');
    }

    // Add edges
    const addedEdges = new Set<string>();
    for (const mod of modules) {
        // Regular imports
        for (const imp of mod.imports) {
            if (modules.find(m => m.name === imp)) {
                const edgeKey = `"${imp}" -> "${mod.name}"`;
                if (!addedEdges.has(edgeKey)) {
                    lines.push(`    ${edgeKey};`);
                    addedEdges.add(edgeKey);
                }
            }
        }
        
        // Forward refs (dashed, red)
        for (const imp of mod.forwardRefs) {
            if (modules.find(m => m.name === imp)) {
                const edgeKey = `"${imp}" -> "${mod.name}"`;
                if (!addedEdges.has(edgeKey)) {
                    lines.push(`    "${imp}" -> "${mod.name}" [style=dashed, color="#d32f2f", penwidth=1.5];`);
                    addedEdges.add(edgeKey);
                }
            }
        }
    }

    // Highlight cycle edges
    for (const cycle of cycles) {
        if (cycle.length <= 10) {
            for (let i = 0; i < cycle.length - 1; i++) {
                const from = cycle[i];
                const to = cycle[i + 1];
                lines.push(`    "${from}" -> "${to}" [color=darkred, penwidth=2.5, constraint=false];`);
            }
        }
    }

    lines.push('}');
    return lines.join('\n');
}

function main() {
    console.log('🔍 Parsing module files...');
    const modules = extractModules();
    
    console.log(`📦 Found ${modules.length} modules`);
    
    const forwardRefCount = modules.reduce((acc, m) => acc + m.forwardRefs.length, 0);
    console.log(`🔗 Found ${forwardRefCount} forwardRef dependencies`);
    
    console.log('\n🔍 Looking for circular dependencies...');
    const cycles = findCircularDependencies(modules);
    console.log(`⚠️  Found ${cycles.length} circular dependency chains`);
    
    // Generate output
    const outputDir = join(process.cwd(), 'dist-graph');
    try {
        mkdirSync(outputDir, { recursive: true });
    } catch (e) {}
    
    console.log('\n🎨 Generating horizontal layout...');
    
    const dot = generateHorizontalDot(modules, cycles);
    writeFileSync(join(outputDir, 'modules-horizontal.dot'), dot);
    
    console.log('\n📊 Output files:');
    console.log('   - dist-graph/modules-horizontal.dot');
    console.log('\n💡 To generate PNG:');
    console.log('   # Note: Horizontal layout works better with dot or neato');
    console.log('   dot -Tpng dist-graph/modules-horizontal.dot -o dist-graph/modules-horizontal.png');
    console.log('   # Or for better spacing:');
    console.log('   neato -Tpng -Goverlap=prism dist-graph/modules-horizontal.dot -o dist-graph/modules-horizontal.png');
}

main();
