import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Edit, Trash2, Plus } from 'lucide-react';

interface Part {
  code: string;
  piecesPerPackage: number;
  packagesPerPallet: number;
  lastUsed: Timestamp;
}

const PartsManager: React.FC = () => {
  const { darkMode } = useTheme();
  const [parts, setParts] = useState<Part[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    piecesPerPackage: '',
    packagesPerPallet: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'codigospecas'), orderBy('lastUsed', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const partsData = snapshot.docs.map(doc => ({
        code: doc.id,
        ...doc.data()
      })) as Part[];
      setParts(partsData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const partData = {
        code: formData.code,
        piecesPerPackage: Number(formData.piecesPerPackage),
        packagesPerPallet: Number(formData.packagesPerPallet),
        lastUsed: Timestamp.now()
      };

      await setDoc(doc(db, 'codigospecas', formData.code), partData);
      setIsModalOpen(false);
      setFormData({ code: '', piecesPerPackage: '', packagesPerPallet: '' });
      setEditingPart(null);
    } catch (error) {
      console.error('Error saving part:', error);
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      code: part.code,
      piecesPerPackage: part.piecesPerPackage.toString(),
      packagesPerPallet: part.packagesPerPallet.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!partToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'codigospecas', partToDelete));
      setIsDeleteModalOpen(false);
      setPartToDelete(null);
    } catch (error) {
      console.error('Error deleting part:', error);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Data inválida';
    return timestamp.toDate().toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Gerenciamento de Peças
        </h2>
        <button
          onClick={() => {
            setEditingPart(null);
            setFormData({ code: '', piecesPerPackage: '', packagesPerPallet: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
        >
          <Plus size={18} className="mr-2" />
          Nova Peça
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          <thead>
            <tr className={`
              ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}
              border-b-2
            `}>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Peças por Embalagem</th>
              <th className="px-4 py-3 text-left">Embalagens por Palete</th>
              <th className="px-4 py-3 text-left">Última Atualização</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr
                key={part.code}
                className={`border-b ${
                  darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-3">{part.code}</td>
                <td className="px-4 py-3">{part.piecesPerPackage}</td>
                <td className="px-4 py-3">{part.packagesPerPallet}</td>
                <td className="px-4 py-3">
                  {formatDate(part.lastUsed)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(part)}
                      className={`p-2 rounded-lg ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setPartToDelete(part.code);
                        setIsDeleteModalOpen(true);
                      }}
                      className={`p-2 rounded-lg ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Confirmar Exclusão
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPartToDelete(null);
                }}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                } text-gray-800 dark:text-white`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {editingPart ? 'Editar Peça' : 'Nova Peça'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Código da Peça
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className={`w-full p-2 rounded-md ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                  } border border-gray-300`}
                  required
                  readOnly={!!editingPart}
                />
              </div>
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Peças por Embalagem
                </label>
                <input
                  type="number"
                  value={formData.piecesPerPackage}
                  onChange={(e) => setFormData({ ...formData, piecesPerPackage: e.target.value })}
                  className={`w-full p-2 rounded-md ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                  } border border-gray-300`}
                  required
                />
              </div>
              <div>
                <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Embalagens por Palete
                </label>
                <input
                  type="number"
                  value={formData.packagesPerPallet}
                  onChange={(e) => setFormData({ ...formData, packagesPerPallet: e.target.value })}
                  className={`w-full p-2 rounded-md ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                  } border border-gray-300`}
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-md ${
                    darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {editingPart ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsManager;