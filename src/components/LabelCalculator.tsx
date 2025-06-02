import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, query, where, onSnapshot, getDoc } from 'firebase/firestore';
import { AutocompleteInput } from './AutocompleteInput';
import Switch from './ui/Switch';
import { calculateLabels } from '../utils/calculations';
import { FloatingInput } from './ui/FloatingInput';

interface PartCodeData {
  piecesPerPackage: number;
  packagesPerPallet: number;
  totalPallets: number;
}

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

const LabelCalculator: React.FC = () => {
  const { darkMode } = useTheme();
  const [partCode, setPartCode] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [piecesPerPackage, setPiecesPerPackage] = useState(0);
  const [packagesPerPallet, setPackagesPerPallet] = useState(0);
  const [totalPieces, setTotalPieces] = useState(0);
  const [notes, setNotes] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [existingPartCode, setExistingPartCode] = useState<PartCodeData | null>(null);
  const [showDetailedCalc, setShowDetailedCalc] = useState(false);
  const [calculations, setCalculations] = useState<CalculationResult | null>(null);
  const [isBatchNumberDuplicate, setIsBatchNumberDuplicate] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    const loadAdminPassword = async () => {
      try {
        const passwordDoc = await getDoc(doc(db, 'SenhaAdmin', 'SenhaAdmin'));
        if (passwordDoc.exists()) {
          setAdminPassword(passwordDoc.data().SenhaAdmin || '');
        }
      } catch (error) {
        console.error('Error loading admin password:', error);
      }
    };
    loadAdminPassword();
  }, []);

  const formatDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const time = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return `${date}\n${time}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, nextFieldId: string | null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextFieldId) {
        const nextField = document.getElementById(nextFieldId);
        if (nextField) {
          nextField.focus();
        }
      } else {
        const registerButton = document.querySelector('button[type="submit"]');
        if (registerButton) {
          registerButton.click();
        } else {
          handleRegister();
        }
      }
    }
  };

  useEffect(() => {
    if (!batchNumber) {
      setIsBatchNumberDuplicate(false);
      return;
    }

    const q = query(collection(db, 'records'), where('batchNumber', '==', batchNumber));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsBatchNumberDuplicate(snapshot.size > 0);
    });

    return () => unsubscribe();
  }, [batchNumber]);

  useEffect(() => {
    const loadPartCodeDetails = async () => {
      if (!partCode) return;
      
      try {
        const partCodeQuery = query(collection(db, 'codigospecas'), where('code', '==', partCode));
        const snapshot = await getDocs(partCodeQuery);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as PartCodeData;
          setExistingPartCode(data);
          
          if (!piecesPerPackage) setPiecesPerPackage(data.piecesPerPackage);
          if (!packagesPerPallet) setPackagesPerPallet(data.packagesPerPallet);
        }
      } catch (error) {
        console.error('Error loading part code details:', error);
      }
    };

    loadPartCodeDetails();
  }, [partCode]);

  useEffect(() => {
    if (totalPieces && piecesPerPackage && packagesPerPallet) {
      const result = calculateLabels(totalPieces, piecesPerPackage, packagesPerPallet);
      setCalculations(result);
    } else {
      setCalculations(null);
    }
  }, [totalPieces, piecesPerPackage, packagesPerPallet]);

  const handleRegister = async () => {
    if (!partCode || !batchNumber || !piecesPerPackage || !packagesPerPallet || !totalPieces) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    if (existingPartCode && (
      existingPartCode.piecesPerPackage !== piecesPerPackage ||
      existingPartCode.packagesPerPallet !== packagesPerPallet
    )) {
      setShowUpdateModal(true);
      return;
    }

    await saveRecord();
  };

  const saveRecord = async () => {
    try {
      if (!calculations) return;
      
      await setDoc(doc(db, 'codigospecas', partCode), {
        code: partCode,
        piecesPerPackage,
        packagesPerPallet,
        lastUsed: new Date()
      });

      const recordsRef = collection(db, 'records');
      const recordsSnapshot = await getDocs(recordsRef);
      const nextId = recordsSnapshot.size + 1;

      await setDoc(doc(db, 'records', String(nextId)), {
        id: nextId,
        dateCreated: formatDateTime(),
        partCode,
        batchNumber,
        totalPieces,
        piecesPerPackage,
        packagesPerPallet,
        extraPieces: calculations.extraPieces,
        totalLabels: calculations.totalLabels,
        usedLabels: 0,
        notes,
        detailedCalculation: calculations.detailedCalculation
      });

      setPartCode('');
      setBatchNumber('');
      setPiecesPerPackage(0);
      setPackagesPerPallet(0);
      setTotalPieces(0);
      setNotes('');
      setExistingPartCode(null);
      setCalculations(null);

    } catch (error) {
      console.error('Error saving record:', error);
      alert('Error saving record');
    }
  };

  return (
    <>
      <div className={`rounded-lg p-6 mb-8 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleRegister();
        }}>
          <div className="grid grid-cols-6 gap-4 mb-6">
            <div className="col-span-1">
              <AutocompleteInput
                id="partCode"
                label="Código da Peça"
                value={partCode}
                onChange={setPartCode}
                required
                onKeyPress={(e) => handleKeyPress(e, 'batchNumber')}
              />
            </div>
            
            <div className="col-span-1 relative">
              <FloatingInput
                id="batchNumber"
                label="Número do Lote"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value.slice(0, 8))}
                required
                type="text"
                className={isBatchNumberDuplicate ? 'border-2 border-red-500' : ''}
                onKeyPress={(e) => handleKeyPress(e, 'totalPieces')}
                maxLength={8}
              />
              {isBatchNumberDuplicate && (
                <p className="text-red-500 text-sm mt-1">🔺 Lote já registrado</p>
              )}
            </div>

            <div className="col-span-1">
              <FloatingInput
                id="totalPieces"
                label="Total de Peças"
                value={totalPieces || ''}
                onChange={(e) => {
                  const value = Math.max(0, Number(e.target.value.slice(0, 6)));
                  setTotalPieces(value);
                }}
                type="number"
                required
                min="0"
                onKeyPress={(e) => handleKeyPress(e, 'piecesPerPackage')}
                maxLength={6}
              />
            </div>

            <div className="col-span-1">
              <FloatingInput
                id="piecesPerPackage"
                label="Peças por Embalagem"
                value={piecesPerPackage || ''}
                onChange={(e) => {
                  const value = Math.max(0, Number(e.target.value.slice(0, 3)));
                  setPiecesPerPackage(value);
                }}
                type="number"
                required
                min="0"
                onKeyPress={(e) => handleKeyPress(e, 'packagesPerPallet')}
                maxLength={3}
              />
            </div>

            <div className="col-span-1">
              <FloatingInput
                id="packagesPerPallet"
                label="Embalagens por Palete"
                value={packagesPerPallet || ''}
                onChange={(e) => {
                  const value = Math.max(0, Number(e.target.value.slice(0, 2)));
                  setPackagesPerPallet(value);
                }}
                type="number"
                required
                min="0"
                onKeyPress={(e) => handleKeyPress(e, 'notes')}
                maxLength={2}
              />
            </div>

            <div className="col-span-1">
              <FloatingInput
                id="notes"
                label="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 12))}
                onKeyPress={(e) => handleKeyPress(e, null)}
                maxLength={12}
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-green-500/30 transform hover:scale-105"
            >
              Registrar
            </button>
            <Switch
              id="showDetailedCalc"
              label="Cálculos Detalhados"
              checked={showDetailedCalc}
              onChange={() => setShowDetailedCalc(!showDetailedCalc)}
            />
          </div>
        </form>

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
                  <span>|</span>
                  <span>Total de Paletes: {calculations.totalPallets}</span>
                  <span>|</span>
                  <span>Paletes Completos: {calculations.completePallets}</span>
                  <span>|</span>
                  <span>Embalagens Extras: {calculations.extraPackages}</span>
                  <span>|</span>
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

      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">Confirmar Atualização</h3>
            <p>Você está prestes a modificar as informações do código {partCode}. Deseja continuar?</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  saveRecord();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LabelCalculator;