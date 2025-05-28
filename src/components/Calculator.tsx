import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FloatingInput } from './ui/FloatingInput';
import Switch from './ui/Switch';
import { calculateLabels } from '../utils/calculations';

const Calculator: React.FC = () => {
  const { darkMode } = useTheme();
  const [totalPieces, setTotalPieces] = useState(0);
  const [piecesPerPackage, setPiecesPerPackage] = useState(0);
  const [showDetailedCalc, setShowDetailedCalc] = useState(false);
  const [calculations, setCalculations] = useState<any>(null);
  const piecesPerPackageRef = useRef<HTMLInputElement>(null);
  const totalPiecesRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, currentField: 'piecesPerPackage' | 'totalPieces') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentField === 'piecesPerPackage' && totalPiecesRef.current) {
        totalPiecesRef.current.focus();
      } else if (currentField === 'totalPieces' && piecesPerPackageRef.current) {
        piecesPerPackageRef.current.focus();
      }
    }
  };

  useEffect(() => {
    // Focus the first input field on component mount
    if (piecesPerPackageRef.current) {
      piecesPerPackageRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (totalPieces && piecesPerPackage) {
      const result = calculateLabels(totalPieces, piecesPerPackage, 1);
      setCalculations(result);
    } else {
      setCalculations(null);
    }
  }, [totalPieces, piecesPerPackage]);

  return (
    <div className={`rounded-lg p-6 mb-8 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className="text-2xl font-bold mb-6">Calculadora de Etiquetas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <FloatingInput
          id="totalPieces"
          label="Total de Peças"
          value={totalPieces || ''}
          onChange={(e) => {
            const value = Math.max(0, Number(e.target.value));
            setTotalPieces(value);
          }}
          type="number"
          required
          min="0"
          onKeyPress={(e) => handleKeyPress(e, 'totalPieces')}
          ref={totalPiecesRef}
        />

      <FloatingInput
          id="piecesPerPackage"
          label="Peças por Embalagem"
          value={piecesPerPackage || ''}
          onChange={(e) => {
            const value = Math.max(0, Number(e.target.value));
            setPiecesPerPackage(value);
          }}
          type="number"
          required
          min="0"
          onKeyPress={(e) => handleKeyPress(e, 'piecesPerPackage')}
          ref={piecesPerPackageRef}
        />

         </div>

      <div className="mb-6">
        <Switch
          id="showDetailedCalc"
          label="Cálculos Detalhados"
          checked={showDetailedCalc}
          onChange={() => setShowDetailedCalc(!showDetailedCalc)}
        />
      </div>

      {calculations && (
        <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-semibold mb-4">Resultados do Cálculo:</h3>
          
          {!showDetailedCalc && (
            <div className="space-y-2">
              <p className="text-xl font-bold">
                Total de Etiquetas: {calculations.totalLabels}
                {calculations.extraPieces > 0 && ` (${calculations.completeLabels} completas + 1 extra com ${calculations.extraPieces} peças)`}
              </p>
              <p className="flex items-center space-x-2">
                <span>Peças Extras: {calculations.extraPieces}</span>
              </p>
            </div>
          )}

          {showDetailedCalc && (
            <div className="space-y-4">
              <p className="text-xl font-bold">
                Total de Etiquetas Necessárias: {calculations.totalLabels}
                {calculations.extraPieces > 0 && ` (${calculations.completeLabels} completas + 1 extra com ${calculations.extraPieces} peças)`}
              </p>
              <div className="whitespace-pre-wrap font-mono text-sm">
                {calculations.detailedCalculation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calculator;