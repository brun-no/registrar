import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { collection, getDocs, deleteDoc, doc, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { savePDF, saveXLSX, saveCSV } from '../utils/exportFunctions';
import { AlertTriangle, FileSpreadsheet, File as FilePdf, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const ActionButtons: React.FC = () => {
  const { darkMode } = useTheme();
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [exportType, setExportType] = useState<'pdf' | 'xlsx' | 'csv' | null>(null);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    // Load admin password from Firestore
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('modal-overlay')) {
        closeAllModals();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeAllModals = () => {
    setIsActionsModalOpen(false);
    setIsDeleteAllModalOpen(false);
    setIsWarningModalOpen(false);
    setIsPasswordModalOpen(false);
    setIsDateRangeModalOpen(false);
    setPassword('');
    setError('');
    setStartDate(null);
    setEndDate(null);
    setExportType(null);
  };

  const handleExport = async (type: 'pdf' | 'xlsx' | 'csv', dateRange = false) => {
    try {
      let recordsQuery = collection(db, 'records');

      if (dateRange && startDate && endDate) {
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setHours(23, 59, 59, 999);

        recordsQuery = query(
          recordsQuery,
          where('dateCreated', '>=', startDate.toLocaleDateString('pt-BR')),
          where('dateCreated', '<=', adjustedEndDate.toLocaleDateString('pt-BR')),
          orderBy('dateCreated', 'desc')
        );
      } else {
        recordsQuery = query(recordsQuery, orderBy('id', 'desc'), limit(100));
      }

      const recordsSnapshot = await getDocs(recordsQuery);
      const records = recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      switch (type) {
        case 'pdf':
          savePDF(records);
          break;
        case 'xlsx':
          saveXLSX(records);
          break;
        case 'csv':
          saveCSV(records);
          break;
      }

      closeAllModals();
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const handleExportClick = (type: 'pdf' | 'xlsx' | 'csv') => {
    setExportType(type);
    setIsDateRangeModalOpen(true);
  };

  const handleDeleteAllConfirm = () => {
    setIsDeleteAllModalOpen(false);
    setIsWarningModalOpen(true);
  };

  const handleWarningConfirm = () => {
    setIsWarningModalOpen(false);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteAll = async () => {
    if (password !== adminPassword) {
      setError('Senha incorreta');
      return;
    }

    try {
      const recordsSnapshot = await getDocs(collection(db, 'records'));
      
      const deletePromises = recordsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      closeAllModals();
    } catch (error) {
      console.error('Erro ao excluir registros:', error);
      setError('Erro ao excluir registros. Tente novamente.');
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-4 justify-between">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleExportClick('pdf')}
            className="px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-blue-500/30"
          >
            <FilePdf size={16} />
            PDF
          </button>
          
          <button
            onClick={() => handleExportClick('xlsx')}
            className="px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white hover:shadow-blue-400/30"
          >
            <FileSpreadsheet size={16} />
            XLSX
          </button>

          <button
            onClick={() => handleExportClick('csv')}
            className="px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-blue-300 to-blue-400 hover:from-blue-400 hover:to-blue-500 text-white hover:shadow-blue-300/30"
          >
            <FileText size={16} />
            CSV
          </button>
        </div>
        
        <button
          onClick={() => setIsActionsModalOpen(true)}
          className="px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-red-500/30"
        >
          Ações
        </button>
      </div>

      {/* Date Range Modal */}
      {isDateRangeModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">Selecione o Período</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2">Data Inicial:</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className={`w-full p-2 rounded-md border ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div>
                <label className="block mb-2">Data Final:</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className={`w-full p-2 rounded-md border ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (exportType) handleExport(exportType, false);
                  }}
                  className={`px-4 py-2 rounded-md ${
                    darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Exportar Página Atual
                </button>
                <button
                  onClick={() => {
                    if (exportType) handleExport(exportType, true);
                  }}
                  className={`px-4 py-2 rounded-md ${
                    darkMode 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                  disabled={!startDate || !endDate}
                >
                  Exportar Período
                </button>
              </div>
              <button
                onClick={closeAllModals}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ações */}
      {isActionsModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">Ações</h3>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Apagar Todos os Registros
              </button>
              
              <button
                onClick={closeAllModals}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Inicial */}
      {isDeleteAllModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">Confirmar Exclusão</h3>
            <p className="mb-6">Você está prestes a iniciar o processo de exclusão de TODOS os registros. Esta é uma ação irreversível. Deseja continuar?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAllConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aviso */}
      {isWarningModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-yellow-500 mr-2" size={24} />
              <h3 className="text-xl font-bold">ATENÇÃO!</h3>
            </div>
            <div className="mb-6">
              <p className="text-red-500 font-bold mb-4">AVISO IMPORTANTE:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Esta ação irá excluir PERMANENTEMENTE todos os registros</li>
                <li>Não será possível recuperar os dados após a exclusão</li>
                <li>Recomendamos exportar os dados antes de prosseguir</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleWarningConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Entendi os riscos, continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Senha */}
      {isPasswordModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">Senha de Administrador Necessária</h3>
            <p className="mb-4">Por favor, digite a senha de administrador para confirmar a exclusão de todos os registros:</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-3 rounded-lg mb-4 ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
              } border ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Digite a senha"
            />
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;