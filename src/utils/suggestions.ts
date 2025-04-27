import { db } from '../services/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Types for suggestions
interface SuggestionItem {
  value: string;
  frequency: number;
  lastUsed: Date;
}

interface SuggestionField {
  id: string;
  displayName: string;
  collection: string;
}

// Define suggestion fields
export const SUGGESTION_FIELDS: SuggestionField[] = [
  { id: 'codigospecas', displayName: 'Código da Peça', collection: 'partCodeSuggestions' },
  { id: 'batchNumber', displayName: 'Número do Lote', collection: 'batchSuggestions' },
  { id: 'notes', displayName: 'Observações', collection: 'notesSuggestions' }
];

// Cache suggestions in memory
const suggestionCache: Map<string, SuggestionItem[]> = new Map();

// Load suggestions from Firebase
export async function loadSuggestions(field: string): Promise<SuggestionItem[]> {
  if (suggestionCache.has(field)) {
    return suggestionCache.get(field)!;
  }

  const fieldConfig = SUGGESTION_FIELDS.find(f => f.id === field);
  if (!fieldConfig) return [];

  try {
    const q = query(
      collection(db, fieldConfig.collection),
      orderBy('frequency', 'desc'),
      orderBy('lastUsed', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const suggestions = snapshot.docs.map(doc => ({
      value: doc.id,
      ...doc.data()
    } as SuggestionItem));

    suggestionCache.set(field, suggestions);
    return suggestions;
  } catch (error) {
    console.error(`Error loading suggestions for ${field}:`, error);
    return [];
  }
}

// Update suggestion frequency
export async function updateSuggestion(field: string, value: string) {
  if (!value.trim()) return;

  const fieldConfig = SUGGESTION_FIELDS.find(f => f.id === field);
  if (!fieldConfig) return;

  try {
    const docRef = doc(db, fieldConfig.collection, value);
    const suggestion: SuggestionItem = {
      value,
      frequency: 1,
      lastUsed: new Date()
    };

    await setDoc(docRef, suggestion, { merge: true });

    // Update cache
    const suggestions = suggestionCache.get(field) || [];
    const existingIndex = suggestions.findIndex(s => s.value === value);
    
    if (existingIndex >= 0) {
      suggestions[existingIndex].frequency++;
      suggestions[existingIndex].lastUsed = new Date();
    } else {
      suggestions.push(suggestion);
    }

    suggestions.sort((a, b) => b.frequency - a.frequency);
    suggestionCache.set(field, suggestions);
  } catch (error) {
    console.error(`Error updating suggestion for ${field}:`, error);
  }
}

// Get suggestions based on input
export function getSuggestions(field: string, input: string): SuggestionItem[] {
  const suggestions = suggestionCache.get(field) || [];
  const normalizedInput = input.toLowerCase().trim();
  
  return suggestions
    .filter(s => s.value.toLowerCase().includes(normalizedInput))
    .sort((a, b) => {
      // Prioritize exact matches
      const aStartsWith = a.value.toLowerCase().startsWith(normalizedInput);
      const bStartsWith = b.value.toLowerCase().startsWith(normalizedInput);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Then by frequency
      if (a.frequency !== b.frequency) {
        return b.frequency - a.frequency;
      }
      
      // Finally by last used
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    })
    .slice(0, 10); // Limit to 10 suggestions
}