import React, { useState, useCallback } from 'react';
import { SearchResult } from '../types';
import * as searchService from '../services/search.service';
import SearchBar from '../components/common/SearchBar';
import SearchResultCard from '../components/vault/SearchResultCard';
import SensitiveDataModal from '../components/vault/SensitiveDataModal';
import { FiSearch, FiXCircle } from 'react-icons/fi';
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
      className="text-center p-8 glass-card rounded-2xl max-w-lg mx-auto mt-12"
    >
      <FiSearch className="mx-auto text-5xl text-primary-400 mb-4" />
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
      className="text-center p-8 glass-card rounded-2xl max-w-lg mx-auto mt-12"
    >
      <FiXCircle className="mx-auto text-5xl text-amber-500 mb-4" />
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
          <div className="flex items-center justify-center space-x-4">
            <FiSearch className="w-8 h-8 text-primary-500" strokeWidth={2.5} />
            <div className="text-center">
              <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Bóveda de Datos
              </h1>
              <p className="text-body-large text-slate-600 dark:text-slate-400">
                Consulta rápida de información sensible de activos asignados.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-surface-elevated p-4 sm:p-6 mb-8 rounded-2xl sticky top-4 z-20 shadow-lg">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por N/S, Empleado, IMEI, Email..." />
        </div>

        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading && (
              <p className="text-center col-span-full">Buscando...</p>
            )}
            {!isLoading && error && (
              <p className="text-center col-span-full text-red-500">{error}</p>
            )}
            {!isLoading && !error && hasSearched && results.length > 0 && results.map((result, index) => (
              <motion.div
                key={`${result.itemId || 'unknown'}-${index}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
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