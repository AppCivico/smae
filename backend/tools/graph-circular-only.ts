/**
 * Script to generate a simplified graph showing only circular dependencies
 * Usage: npx ts-node tools/graph-circular-only.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { globSync } from 'glob';

interface ModuleNode {
    name: string;
    path: string;
    imports: string[];
    forwardRefs: string[];
}

function extractModules(): ModuleNode[] {
    const moduleFiles = globSync('src/**/*.module.ts', { absolute: true });
    const modules: ModuleNode[] = [];
    
    for (const filePath of moduleFiles) {
        const content = readFileSync(filePath, 'utf-8');
        
        const nameMatch = content.match(/export class (\w+Module)/);
        if (!nameMatch) continue;
        
        const moduleName = nameMatch[1];
        
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
            path: filePath.replace(process.cwd(), '.'),
            imports,
            forwardRefs
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
                // Normalize cycle (start from alphabetically smallest)
                const minIndex = cycle.slice(0, -1).indexOf(cycle.slice(0, -1).sort()[0]);
                const normalized = [...cycle.slice(minIndex, -1), ...cycle.slice(0, minIndex), cycle[cycle.length - 1]];
                const cycleKey = normalized.join(',');
                
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

function generateFocusedGraph(modules: ModuleNode[], cycles: string[][]): string {
    // Focus on the Vinculo-related cycle chain
    const importantModules = new Set<string>();
    
    // Add all modules involved in any cycle
    for (const cycle of cycles) {
        for (const mod of cycle) {
            importantModules.add(mod);
        }
    }
    
    // Find the full dependency chain from VinculoModule
    const vinculoChain = new Set<string>();
    const visited = new Set<string>();
    
    function traverse(modName: string, depth = 0) {
        if (depth > 10 || visited.has(modName)) return; // Limit depth
        visited.add(modName);
        vinculoChain.add(modName);
        
        const mod = modules.find(m => m.name === modName);
        if (mod) {
            for (const dep of [...mod.imports, ...mod.forwardRefs]) {
                traverse(dep, depth + 1);
            }
        }
    }
    
    // Start from VinculoModule
    traverse('VinculoModule');
    
    // Also find what leads to VinculoModule
    const leadsToVinculo = new Set<string>();
    for (const mod of modules) {
        if ([...mod.imports, ...mod.forwardRefs].includes('VinculoModule')) {
            leadsToVinculo.add(mod.name);
        }
    }
    
    // Combine important modules
    const allModules = new Set([...importantModules, ...vinculoChain, ...leadsToVinculo]);
    
    const lines = [
        'digraph CircularDependencies {',
        '    rankdir=TB;',
        '    node [shape=box, style=filled, fontname="Arial", fontsize=10];',
        '    edge [fontname="Arial", fontsize=9];',
        '',
        '    // Legend',
        '    subgraph cluster_legend {',
        '        label="Legend";',
        '        color=gray;',
        '        style=dashed;',
        '        node [shape=plaintext, fillcolor=white];',
        '        legend1 [label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">',
        '            <TR><TD BGCOLOR="lightcoral">In Cycle</TD></TR>',
        '            <TR><TD BGCOLOR="lightyellow">In Vinculo Chain</TD></TR>',
        '            <TR><TD BGCOLOR="lightgray">Other</TD></TR>',
        '            <TR><TD>--- forwardRef</TD></TR>',
        '        </TABLE>>];',
        '    }',
        ''
    ];
    
    // Group by area
    const areaGroups = new Map<string, string[]>();
    for (const modName of allModules) {
        const mod = modules.find(m => m.name === modName);
        if (mod) {
            const area = mod.path.split('/')[2] || 'root';
            if (!areaGroups.has(area)) areaGroups.set(area, []);
            areaGroups.get(area)!.push(modName);
        }
    }
    
    // Add clusters
    let clusterIdx = 0;
    for (const [area, mods] of areaGroups) {
        lines.push(`    subgraph cluster_${clusterIdx} {`);
        lines.push(`        label="${area}";`);
        lines.push('        style=filled;');
        lines.push('        fillcolor=lightyellow1;');
        lines.push('        color=gray;');
        
        for (const modName of mods) {
            let color = 'lightgray';
            if (importantModules.has(modName)) {
                color = 'lightcoral'; // In cycle
            } else if (vinculoChain.has(modName)) {
                color = 'lightyellow'; // In chain
            }
            
            if (modName === 'VinculoModule') {
                color = 'gold';
                lines.push(`        "${modName}" [fillcolor=${color}, shape=box, peripheries=2, penwidth=2];`);
            } else if (modName === 'GeoLocModule' || modName === 'DemandaModule') {
                lines.push(`        "${modName}" [fillcolor=${color}, shape=box, penwidth=1.5];`);
            } else {
                lines.push(`        "${modName}" [fillcolor=${color}];`);
            }
        }
        lines.push('    }');
        lines.push('');
        clusterIdx++;
    }
    
    // Add edges
    const addedEdges = new Set<string>();
    for (const modName of allModules) {
        const mod = modules.find(m => m.name === modName);
        if (!mod) continue;
        
        // Regular imports
        for (const imp of mod.imports) {
            if (allModules.has(imp)) {
                const edge = `    "${imp}" -> "${modName}"`;
                if (!addedEdges.has(edge)) {
                    lines.push(edge + ';');
                    addedEdges.add(edge);
                }
            }
        }
        
        // Forward refs
        for (const imp of mod.forwardRefs) {
            if (allModules.has(imp)) {
                const edge = `    "${imp}" -> "${modName}"`;
                if (!addedEdges.has(edge)) {
                    lines.push(`    "${imp}" -> "${modName}" [style=dashed, color=red, penwidth=1.5];`);
                    addedEdges.add(edge);
                }
            }
        }
    }
    
    // Highlight cycles
    for (const cycle of cycles) {
        if (cycle.length <= 8) { // Only highlight smaller cycles
            for (let i = 0; i < cycle.length - 1; i++) {
                const from = cycle[i];
                const to = cycle[i + 1];
                if (allModules.has(from) && allModules.has(to)) {
                    lines.push(`    "${from}" -> "${to}" [color=darkred, penwidth=2, constraint=false];`);
                }
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
    
    console.log(`\n⚠️  Found ${cycles.length} circular dependency chains:`);
    for (const cycle of cycles) {
        console.log('   → ' + cycle.join(' → '));
    }
    
    // Generate focused graph
    const outputDir = join(process.cwd(), 'dist-graph');
    try {
        mkdirSync(outputDir, { recursive: true });
    } catch (e) {}
    
    console.log('\n🎨 Generating focused circular dependency graph...');
    
    const focusedDot = generateFocusedGraph(modules, cycles);
    writeFileSync(join(outputDir, 'circular-focused.dot'), focusedDot);
    
    console.log('\n📊 Output files:');
    console.log('   - dist-graph/circular-focused.dot');
    console.log('\n💡 To generate PNG:');
    console.log('   # For large graphs, use sfdp (recommended):');
    console.log('   sfdp -Tpng dist-graph/circular-focused.dot -o dist-graph/circular-focused.png');
    console.log('   # Alternative engines:');
    console.log('   dot -Tpng dist-graph/circular-focused.dot -o dist-graph/circular-focused.png');
    console.log('   neato -Tpng -Goverlap=prism dist-graph/circular-focused.dot -o dist-graph/circular-focused.png');
}

main();
