import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { Edit, Trash2 } from 'lucide-react';

interface Record {
  id: number;
  dateCreated: string;
  partCode: string;
  batchNumber: string;
  totalPieces: number;
  piecesPerPackage: number;
  packagesPerPallet: number;
  extraPieces: number;
  totalLabels: number;
  usedLabels: number;
  notes: string;
}

const RecordsTable: React.FC = () => {
  const { darkMode } = useTheme();
  const [records, setRecords] = useState<Record[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [editingTotalLabels, setEditingTotalLabels] = useState(0);
  const [editingExtraPieces, setEditingExtraPieces] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const recordsPerPage = 10;
  const isTypingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDocRef = useRef<any>(null);

  useEffect(() => {
    // Carregar apenas os 100 registros mais recentes inicialmente
    const q = query(
      collection(db, 'records'),
      orderBy('id', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => {
        const data = doc.data() as Record;
        return {
          ...data,
          id: Number(doc.id)
        };
      });
      setRecords(recordsData);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
    });

    return () => unsubscribe();
  }, []);

  const loadMoreRecords = async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'records'),
        orderBy('id', 'desc'),
        startAfter(lastDocRef.current),
        limit(100)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const newRecords = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: Number(doc.id)
      })) as Record[];

      setRecords(prev => [...prev, ...newRecords]);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
    } catch (error) {
      console.error('Error loading more records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(record => 
        Object.values(record).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredRecords(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, records]);

  const handleUpdateUsedLabels = async (id: number, value: number) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const recordRef = doc(db, 'records', String(id));
        await updateDoc(recordRef, { usedLabels: value });
      } catch (error) {
        console.error('Error updating used labels:', error);
      }
    }, 3000);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'records', String(recordToDelete)));
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleEditRecord = (record: Record) => {
    setEditingRecord({ ...record });
    setEditingTotalLabels(record.totalLabels);
    setEditingExtraPieces(record.extraPieces);
    setIsEditModalOpen(true);
  };

  const calculateEditingResults = () => {
    if (!editingRecord) return null;

    const totalPieces = editingTotalLabels * editingRecord.piecesPerPackage + editingExtraPieces;
    const displayLabels = editingExtraPieces > 0 
      ? `${editingTotalLabels} (${editingTotalLabels - 1} completas + 1 extra)`
      : editingTotalLabels.toString();

    return {
      totalPieces,
      displayLabels
    };
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    
    const results = calculateEditingResults();
    if (!results) return;

    try {
      const recordRef = doc(db, 'records', String(editingRecord.id));
      const newUsedLabels = editingTotalLabels <= editingRecord.usedLabels ? editingTotalLabels : editingRecord.usedLabels;
      
      await updateDoc(recordRef, {
        partCode: editingRecord.partCode,
        batchNumber: editingRecord.batchNumber,
        totalLabels: editingTotalLabels,
        extraPieces: editingExtraPieces,
        totalPieces: results.totalPieces,
        usedLabels: newUsedLabels,
        notes: editingRecord.notes
      });
      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingRecord(null);
    setRecordToDelete(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('modal-overlay')) {
        closeModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    if (pageNumber === totalPages && hasMore) {
      loadMoreRecords();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar registros..."
          className={`w-full p-3 rounded-lg shadow-sm ${
            darkMode 
              ? 'bg-gray-700 text-white placeholder-gray-400' 
              : 'bg-white text-gray-800 placeholder-gray-400'
          }`}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => paginate(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md mx-1 ${
              darkMode 
                ? 'bg-gray-700 text-white disabled:bg-gray-800 disabled:text-gray-500' 
                : 'bg-gray-200 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400'
            }`}
          >
            Anterior
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            if (
              pageNum <= 3 || 
              pageNum > totalPages - 3 || 
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={i}
                  onClick={() => paginate(pageNum)}
                  className={`px-3 py-1 rounded-md mx-1 ${
                    pageNum === currentPage
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                      : (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800')
                  }`}
                >
                  {pageNum}
                </button>
              );
            } else if (
              (pageNum === 4 && currentPage > 4) || 
              (pageNum === totalPages - 3 && currentPage < totalPages - 3)
            ) {
              return <span key={i} className="px-3 py-1">...</span>;
            }
            return null;
          })}
          
          <button
            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages && !hasMore}
            className={`px-3 py-1 rounded-md mx-1 ${
              darkMode 
                ? 'bg-gray-700 text-white disabled:bg-gray-800 disabled:text-gray-500' 
                : 'bg-gray-200 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400'
            }`}
          >
            Próximo
          </button>
        </div>
      )}

      <div className="overflow-x-auto mb-4">
        <table className={`w-full border-collapse ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          <thead>
            <tr className={`
              ${darkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-blue-50 border-gray-200'
              }
              border-b-2 shadow-sm
            `}>
              <th className="w-12 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">ID</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Data<br/>Hora</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Código</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Lote</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Total<br/>Peças</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Peças por<br/>Embalagem</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Embalagem<br/> por Palete</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Peças<br/>Extras</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Etiquetas<br/>Necessárias</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Etiquetas<br/>Usadas</th>
              <th className="w-32 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-gray-200/20">Observações</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/20">
            {currentRecords.map((record, index) => (
              <tr 
                key={record.id}
                className={`
                  ${record.usedLabels === record.totalLabels 
                    ? (darkMode ? 'bg-green-900/40 hover:bg-green-900/40' : 'bg-green-50 hover:bg-green-50') 
                    : (index % 2 === 0 
                      ? (darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50')
                      : (darkMode ? 'bg-gray-800/50 hover:bg-gray-700' : 'bg-gray-50/50 hover:bg-gray-100/50')
                    )
                  }
                  transition-colors duration-150
                `}
              >
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">{record.id}</td>
                <td className="px-2 py-2 text-sm whitespace-pre-line border-r border-gray-200/10">{record.dateCreated}</td>
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">{record.partCode}</td>
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">{record.batchNumber}</td>
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">{record.totalPieces}</td>
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">{record.piecesPerPackage}</td>
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">{record.packagesPerPallet}</td>
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">{record.extraPieces}</td>
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">
                  {record.totalLabels}
                  {record.extraPieces > 0 && (
                    <span className="text-xs block">
                      ({record.totalLabels - 1} + 1)
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-sm border-r border-gray-200/10">
                  <input
                    type="number"
                    value={record.usedLabels}
                    min="0"
                    max={record.totalLabels}
                    className={`w-16 p-1 rounded-md ${
                      darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                    }`}
                    onFocus={() => { isTypingRef.current = true; }}
                    onBlur={(e) => {
                      isTypingRef.current = false;
                      let value = Number(e.target.value);
                      if (value > record.totalLabels) {
                        value = record.totalLabels;
                      }
                      handleUpdateUsedLabels(record.id, value);
                    }}
                    onChange={(e) => {
                      let value = Number(e.target.value);
                      if (value > record.totalLabels) {
                        value = record.totalLabels;
                      }
                      const newRecords = [...records];
                      const recordIndex = newRecords.findIndex(r => r.id === record.id);
                      if (recordIndex !== -1) {
                        newRecords[recordIndex].usedLabels = value;
                        setRecords(newRecords);
                      }
                    }}
                  />
                </td>
                <td className="px-2 py-2 text-sm truncate border-r border-gray-200/10">{record.notes}</td>
                <td className="px-2 py-2 text-sm">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditRecord(record)}
                      className={`p-1 rounded-md ${
                        darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setRecordToDelete(record.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className={`p-1 rounded-md ${
                        darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <p>Carregando mais registros...</p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-4xl w-full mx-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-6">Editar Registro</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Código da Peça</label>
                  <input
                    type="text"
                    value={editingRecord.partCode}
                    readOnly
                    className={`w-full p-2 rounded-md ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Peças por Embalagem</label>
                  <input
                    type="text"
                    value={editingRecord.piecesPerPackage}
                    readOnly
                    className={`w-full p-2 rounded-md ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Embalagens por Palete</label>
                  <input
                    type="text"
                    value={editingRecord.packagesPerPallet}
                    readOnly
                    className={`w-full p-2 rounded-md ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Número do Lote</label>
                  <input
                    type="text"
                    value={editingRecord.batchNumber}
                    onChange={(e) => setEditingRecord({...editingRecord, batchNumber: e.target.value})}
                    className={`w-full p-2 rounded-md ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Etiquetas Necessárias</label>
                  <input
                    type="number"
                    value={editingTotalLabels}
                    onChange={(e) => setEditingTotalLabels(Number(e.target.value))}
                    className={`w-full p-2 rounded-md ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Peças Extras</label>
                  <input
                    type="number"
                    value={editingExtraPieces}
                    onChange={(e) => setEditingExtraPieces(Number(e.target.value))}
                    min="0"
                    max={editingRecord.piecesPerPackage - 1}
                    className={`w-full p-2 rounded-md ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Observações</label>
                <textarea
                  value={editingRecord.notes}
                  onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                  className={`w-full p-2 rounded-md ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                  }`}
                  rows={3}
                />
              </div>
              
              {calculateEditingResults() && (
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <p className="text-lg font-medium">
                    Etiquetas Necessárias: {calculateEditingResults()?.displayLabels}
                  </p>
                  <p className="text-lg font-medium">
                    Total de Peças: {calculateEditingResults()?.totalPieces}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">Confirmar Exclusão</h3>
            <p className="mb-6">Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRecord}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsTable;