import React, { useState, useCallback } from 'react';
import { SearchResult } from '../types';
import * as searchService from '../services/search.service';
import SearchBar from '../components/common/SearchBar';
import SearchResultCard from '../components/vault/SearchResultCard';
import SensitiveDataModal from '../components/vault/SensitiveDataModal';
import { Search, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedOrbsBackground from '../components/layout/AnimatedOrbsBackground';

const Vault: React.FC = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    const trimmedTerm = term.trim();
    if (trimmedTerm.length > 0 && trimmedTerm.length < 3) {
      setResults([]);
      setError('El término de búsqueda debe tener al menos 3 caracteres.');
      setHasSearched(true);
      return;
    }

    if (trimmedTerm.length < 3) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const response = await searchService.globalSearch(trimmedTerm);
      setResults(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al realizar la búsqueda.';
      setError(errorMessage);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResultClick = (asset: SearchResult) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const renderInitialState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center p-8 glass-card rounded-2xl max-w-lg mx-auto mt-12 flex flex-col items-center"
    >
      <div className="p-4 rounded-full bg-primary-500/10 mb-6">
        <Search className="text-5xl text-primary-400 w-12 h-12" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Bóveda de Búsqueda</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-2">
        Encuentra activos, empleados e información sensible al instante.
        <br />
        Busca por N/S, IMEI, email, nombre y más.
      </p>
    </motion.div>
  );

  const renderNoResults = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center p-8 glass-card rounded-2xl max-w-lg mx-auto mt-12 flex flex-col items-center"
    >
      <div className="p-4 rounded-full bg-amber-500/10 mb-6">
        <XCircle className="text-5xl text-amber-500 w-12 h-12" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">No se encontraron resultados</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-2">
        Prueba con un término de búsqueda diferente o verifica la ortografía.
      </p>
    </motion.div>
  );

  return (
    <AnimatedOrbsBackground>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-white/10 backdrop-blur-sm shadow-lg">
              <Search className="w-8 h-8 text-primary-400" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent drop-shadow-sm mb-3">
            Bóveda de Datos
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Consulta rápida y segura de información sensible de activos asignados.
          </p>
        </div>

        <div className="glass-surface-elevated p-4 sm:p-6 mb-8 rounded-2xl sticky top-4 z-20 shadow-xl border border-white/10">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por N/S, Empleado, IMEI, Email..." />
        </div>

        <AnimatePresence mode='wait'>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading && (
              <div className="col-span-full py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
                <p className="text-slate-400">Buscando en la bóveda...</p>
              </div>
            )}
            {!isLoading && error && (
              <div className="col-span-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            {!isLoading && !error && hasSearched && results.length > 0 && results.map((result, index) => (
              <motion.div
                key={`${result.itemId || 'unknown'}-${index}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <SearchResultCard result={result} onClick={() => handleResultClick(result)} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {!isLoading && !error && !hasSearched && renderInitialState()}
        {!isLoading && !error && hasSearched && results.length === 0 && renderNoResults()}
      </div>

      <AnimatePresence>
        {isModalOpen && selectedAsset && (
          <SensitiveDataModal
            initialAsset={selectedAsset}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </AnimatedOrbsBackground>
  );
};

export default Vault;