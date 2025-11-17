
import React, { useState, useMemo, useEffect } from 'react';
import { RemedySelectionForm } from './components/RemedySelectionForm';
import { ClientPrescription } from './components/ClientPrescription';
import { MasterInventoryManager } from './components/MasterInventoryManager';
import { masterRemedyList, parseRemedies } from './constants/remedyData';
import type { ClientSelections, SelectedRemedy, Remedy } from './types';

enum AppView {
  Selection,
  Prescription,
}

const LOCAL_STORAGE_KEY = 'homeopathic_remedy_inventory';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.Selection);
  const [patientName, setPatientName] = useState<string>('');
  const [selections, setSelections] = useState<ClientSelections>({});
  const [remedies, setRemedies] = useState<Remedy[]>(() => {
    try {
      const storedRemedies = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedRemedies) {
        return JSON.parse(storedRemedies);
      }
    } catch (error) {
      console.error("Failed to load remedies from local storage", error);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return masterRemedyList;
  });
  const [isDefaultList, setIsDefaultList] = useState(true);

  useEffect(() => {
    // A simple check to see if the current list is the default one
    const isDefault = remedies.length === masterRemedyList.length && remedies[0]?.srNo === masterRemedyList[0]?.srNo;
    setIsDefaultList(isDefault);

    if (!isDefault) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remedies));
      } catch (error) {
        console.error("Failed to save remedies to local storage", error);
        alert("Could not save the new inventory list. Your browser's storage might be full.");
      }
    }
  }, [remedies]);

  const handleUpdateInventory = (csvData: string) => {
    try {
      const newRemedies = parseRemedies(csvData);
      setRemedies(newRemedies);
      setSelections({}); 
      alert(`Successfully updated inventory with ${newRemedies.length} remedies.`);
    } catch (error) {
      console.error("Failed to parse CSV file:", error);
      alert(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleResetInventory = () => {
    if (window.confirm("Are you sure you want to reset to the default inventory list? This will remove your custom list.")) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      setRemedies(masterRemedyList);
      setSelections({});
    }
  };

  const handleGeneratePrescription = () => {
    if (patientName.trim() && Object.keys(selections).length > 0) {
      setView(AppView.Prescription);
    }
  };

  const handleNewClient = () => {
    setPatientName('');
    setSelections({});
    setView(AppView.Selection);
  };

  const selectedRemedies: SelectedRemedy[] = useMemo(() => {
    const allRemediesMap = new Map<string, Remedy>(remedies.map(r => [r.srNo, r]));
    return Object.keys(selections)
      .map((srNo) => {
        const remedyDetails = allRemediesMap.get(srNo);
        if (remedyDetails) {
          const potencies = selections[srNo];
          return {
            ...remedyDetails,
            potencies: Array.from(potencies),
          };
        }
        return null;
      })
      .filter((r): r is SelectedRemedy => r !== null)
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [selections, remedies]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDelay {
          0% { opacity: 0; transform: translateY(-10px); }
          50% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInFast {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-fade-in-delay { animation: fadeInDelay 0.7s ease-out forwards; }
        .animate-fade-in-fast { animation: fadeInFast 0.2s ease-in-out; }
        
        .remedy-tooltip-content h3 {
            font-size: 1.125rem; /* text-lg */
            font-weight: 600; /* font-semibold */
            color: #93c5fd; /* text-blue-300 */
            margin-bottom: 0.5rem; /* mb-2 */
        }
        .remedy-tooltip-content ul {
            list-style-type: disc;
            padding-left: 1.25rem; /* pl-5 */
            margin: 0;
            font-size: 0.875rem; /* text-sm */
        }
        .remedy-tooltip-content li {
            margin-bottom: 0.25rem; /* mb-1 */
        }
         .remedy-tooltip-content strong {
            color: #67e8f9; /* text-cyan-300 */
        }
      `}</style>
      <header className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 shadow-lg text-center">
         <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white text-left flex-1">
              Homeopathic Remedy Manager
            </h1>
            <MasterInventoryManager
                onUpdateInventory={handleUpdateInventory}
                onResetInventory={handleResetInventory}
                isDefaultList={isDefaultList}
            />
        </div>
      </header>
      <main className="p-4 md:p-8">
        {view === AppView.Selection ? (
          <RemedySelectionForm
            remedies={remedies}
            patientName={patientName}
            setPatientName={setPatientName}
            selections={selections}
            setSelections={setSelections}
            onGenerate={handleGeneratePrescription}
          />
        ) : (
          <ClientPrescription
            patientName={patientName}
            selectedRemedies={selectedRemedies}
            onBack={handleNewClient}
          />
        )}
      </main>
       <footer className="text-center p-4 text-slate-500 text-sm">
        <p>Built for practitioners with care. © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
