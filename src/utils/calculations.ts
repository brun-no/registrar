interface CalculationResult {
  totalLabels: number;
  completeLabels: number;
  extraLabels: number;
  extraPieces: number;
  totalPallets: number;
  completePallets: number;
  extraPackages: number;
  detailedCalculation: string;
}

export function calculateLabels(
  totalPieces: number,
  piecesPerPackage: number,
  packagesPerPallet: number
): CalculationResult {
  // Calculate total packages needed
  const completeLabels = Math.floor(totalPieces / piecesPerPackage);
  const extraPieces = totalPieces % piecesPerPackage;
  
  // If there are extra pieces, we need one more label
  const extraLabels = extraPieces > 0 ? 1 : 0;
  const totalLabels = completeLabels + extraLabels;
  
  // Calculate pallets
  const completePallets = Math.floor(totalLabels / packagesPerPallet);
  const extraPackages = totalLabels % packagesPerPallet;
  const totalPallets = extraPackages > 0 ? completePallets + 1 : completePallets;

  // Generate detailed calculation explanation
  const detailedCalculation = `
Total de Peças: ${totalPieces}
Peças por Embalagem: ${piecesPerPackage}
Embalagens por Palete: ${packagesPerPallet}

Matemática detalhada:
${totalPieces} / ${piecesPerPackage} = ${completeLabels} embalagens${extraPieces > 0 ? ` (sobram ${extraPieces} peças)` : ''}

${completeLabels} / ${packagesPerPallet} = ${completePallets} paletes completos${extraPackages > 0 ? ` (sobram ${extraPackages} embalagens)` : ''}

${packagesPerPallet} * ${completePallets} = ${packagesPerPallet * completePallets} embalagens em paletes completos

${completeLabels} - ${packagesPerPallet * completePallets} = ${extraPackages} embalagens restantes

Total de Paletes: ${completePallets} completos${extraPackages > 0 ? ` e 1 palete incompleto com ${extraPackages} embalagens` : ''}

${totalPieces} peças distribuídas em ${totalLabels} embalagens`;
  
  return {
    totalLabels,
    completeLabels,
    extraLabels,
    extraPieces,
    totalPallets,
    completePallets,
    extraPackages,
    detailedCalculation
  };
}