import path from 'path/posix'

export function getPrismaClientModule(
  prismaClientOutput: string,
  outputDir: string
): string {
  // Normalize to forward slashes for consistent detection and import path
  const normalizedPrismaClientOutput = prismaClientOutput.replace(/\\/g, '/')
  let prismaClientModule: string
  if (normalizedPrismaClientOutput.endsWith('node_modules/@prisma/client')) {
    prismaClientModule = '@prisma/client'
  } else {
    // Always use forward slashes in import paths
    prismaClientModule = path
      .relative(outputDir, prismaClientOutput)
      .replace(/\\/g, '/')
  }
  return prismaClientModule
}
