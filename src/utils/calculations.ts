interface CalculationResult {
  totalLabels: number;
  completeLabels: number;
  extraLabels: number;
  extraPieces: number;
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

  // Generate detailed calculation explanation for Calculator page
  const detailedCalculation = packagesPerPallet === 1 
    ? `Total de Peças: ${totalPieces}
Peças por Embalagem: ${piecesPerPackage}

Matemática detalhada:
${totalPieces} / ${piecesPerPackage} = ${completeLabels} embalagens${extraPieces > 0 ? ` (sobram ${extraPieces} peças)` : ''}

${totalPieces} peças distribuídas em ${totalLabels} embalagens`
    : `Total de Peças: ${totalPieces}
Peças por Embalagem: ${piecesPerPackage}
Embalagens por Palete: ${packagesPerPallet}

Matemática detalhada:
${totalPieces} / ${piecesPerPackage} = ${completeLabels} embalagens${extraPieces > 0 ? ` (sobram ${extraPieces} peças)` : ''}

${completeLabels} / ${packagesPerPallet} = ${Math.floor(completeLabels / packagesPerPallet)} paletes completos${completeLabels % packagesPerPallet > 0 ? ` (sobram ${completeLabels % packagesPerPallet} embalagens)` : ''}

${packagesPerPallet} * ${Math.floor(completeLabels / packagesPerPallet)} = ${packagesPerPallet * Math.floor(completeLabels / packagesPerPallet)} embalagens em paletes completos

${completeLabels} - ${packagesPerPallet * Math.floor(completeLabels / packagesPerPallet)} = ${completeLabels % packagesPerPallet} embalagens restantes

Total de Paletes: ${Math.floor(completeLabels / packagesPerPallet)} completos${completeLabels % packagesPerPallet > 0 ? ` e 1 palete incompleto com ${completeLabels % packagesPerPallet} embalagens` : ''}

${totalPieces} peças distribuídas em ${totalLabels} embalagens`;
  
  return {
    totalLabels,
    completeLabels,
    extraLabels,
    extraPieces,
    detailedCalculation
  };
}