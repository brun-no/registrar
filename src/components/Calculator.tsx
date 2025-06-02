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
    <div className={`rounded-lg p-8 mb-8 shadow-md max-w-4xl mx-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className="text-3xl font-bold mb-8 text-center">Calculadora de Etiquetas</h2>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
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
          size="large"
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
          size="large"
        />
      </div>

      <div className="mb-8">
        <Switch
          id="showDetailedCalc"
          label="Cálculos Detalhados"
          checked={showDetailedCalc}
          onChange={() => setShowDetailedCalc(!showDetailedCalc)}
        />
      </div>

      {calculations && (
        <div className={`mt-8 p-8 rounded-lg ${darkMode ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50'}`}>
          <div className={`p-6 rounded-lg ${
            darkMode ? 'bg-blue-800/50 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'
          } shadow-xl`}>
            <h3 className="text-3xl font-bold mb-4">
              Total de Etiquetas Necessárias: {calculations.totalLabels}
              {calculations.extraPieces > 0 && (
                <span className="block text-2xl mt-2 opacity-90">
                  ({calculations.completeLabels} completas + 1 extra com {calculations.extraPieces} peças)
                </span>
              )}
            </h3>
          </div>

          {showDetailedCalc && (
            <div className="mt-8 p-6 rounded-lg bg-black/10">
              <div className="whitespace-pre-wrap font-mono text-lg">
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