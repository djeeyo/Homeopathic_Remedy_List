
import React, { useState, useMemo, useRef } from 'react';
import type { Remedy, Potency, ClientSelections } from '../types';
import { POTENCIES } from '../types';
import { getAiSuggestions, getRemedyInfo } from './AISuggestionEngine';

// Define types for sorting
type SortKey = 'name' | 'abbreviation';
interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

interface RemedySelectionFormProps {
  remedies: Remedy[];
  patientName: string;
  setPatientName: (name: string) => void;
  selections: ClientSelections;
  setSelections: React.Dispatch<React.SetStateAction<ClientSelections>>;
  onGenerate: () => void;
}

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const InformationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

const SortIndicator: React.FC<{ active: boolean; direction: 'asc' | 'desc' }> = ({ active, direction }) => {
  if (!active) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 ml-1 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
    );
  }
  const d = direction === 'asc'
    ? "m19 9-7 7-7-7" // Down arrow (A-Z)
    : "m5 15 7-7 7 7";  // Up arrow (Z-A)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-3 w-3 ml-1 text-cyan-400">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
};

const MagicWandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118A2.25 2.25 0 0 1 .75 18.75a2.25 2.25 0 0 1 2.25-2.25c1.152 0 2.163.832 2.395 1.944a2.25 2.25 0 0 1 .11-3.864.075.075 0 0 1 .096.023c.041.061.054.13.042.195a.043.043 0 0 1-.033.028l-.048.016c-.34.111-.63.328-.84.609a.75.75 0 0 0 .28 1.064l2.063 1.691a.75.75 0 0 0 1.157-.484c.058-.244.116-.49.18-.732a.75.75 0 0 0-.28-1.064l-2.062-1.69a.75.75 0 0 0-1.158.484c-.06.244-.118.49-.18.732a.75.75 0 0 0 .28 1.064l2.063 1.691a.75.75 0 0 0 1.157-.484c.058-.244.116-.49.18-.732Zm8.84-6.612a.75.75 0 0 0-1.064-.28l-2.063 1.69a.75.75 0 0 0 .484 1.158c.244.06.49.118.732.18a.75.75 0 0 0 1.064-.28l2.063-1.691a.75.75 0 0 0-.484-1.157c-.244-.06-.49-.118-.732-.18Zm-3.002.016a.75.75 0 0 0-1.064-.28l-2.063 1.69a.75.75 0 0 0 .484 1.158c.244.06.49.118.732.18a.75.75 0 0 0 1.064-.28l2.063-1.691a.75.75 0 0 0-.484-1.157c-.244-.06-.49-.118-.732-.18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.53 18.25a.75.75 0 0 1-.727-.562l-.24-1.121a.75.75 0 0 0-.45-1.121l-1.121-.24a.75.75 0 0 1 .562-.727l1.121-.24a.75.75 0 0 0 .45-1.121l.24-1.121a.75.75 0 0 1 .727.562l.24 1.121a.75.75 0 0 0 .45 1.121l1.121.24a.75.75 0 0 1-.562.727l-1.121.24a.75.75 0 0 0-.45 1.121l-.24 1.121a.75.75 0 0 1-.727.562Z" />
  </svg>
);


export const RemedySelectionForm: React.FC<RemedySelectionFormProps> = ({
  remedies,
  patientName,
  setPatientName,
  selections,
  setSelections,
  onGenerate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  
  // AI State
  const [symptoms, setSymptoms] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Set<string>>(new Set());
  const [aiError, setAiError] = useState<string | null>(null);

  // Tooltip State
  const [tooltipContent, setTooltipContent] = useState<Record<string, { data?: string; error?: string }>>({});
  const [activeTooltip, setActiveTooltip] = useState<{ srNo: string; position: { top: number; left: number } } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const isFetchingRef = useRef<Set<string>>(new Set());

  const handleGetAiSuggestions = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiSuggestions(new Set()); // Clear previous suggestions

    try {
      const suggestedAbbrs = await getAiSuggestions(symptoms, remedies);
      
      const abbrToSrNoMap = new Map(remedies.map(r => [r.abbreviation, r.srNo]));
      
      const suggestedSrNos = new Set<string>();
      suggestedAbbrs.forEach(abbr => {
        // FIX: Add a type guard to ensure `abbr` is a string. This resolves a TypeScript error where
        // `abbr` was inferred as `unknown`, making it incompatible with `abbrToSrNoMap.has()`.
        // The logic is also made safer by checking the result of `.get()` before adding.
        if (typeof abbr === 'string' && abbrToSrNoMap.has(abbr)) {
          const srNo = abbrToSrNoMap.get(abbr);
          if (srNo) {
            suggestedSrNos.add(srNo);
          }
        }
      });
      setAiSuggestions(suggestedSrNos);

    } catch (error) {
      setAiError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectionChange = (srNo: string, potency: Potency) => {
    setSelections(prev => {
      const newSelections = { ...prev };
      const currentPotencies = new Set(newSelections[srNo]);

      if (currentPotencies.has(potency)) {
        currentPotencies.delete(potency);
      } else {
        currentPotencies.add(potency);
      }

      if (currentPotencies.size === 0) {
        delete newSelections[srNo];
      } else {
        newSelections[srNo] = currentPotencies;
      }
      return newSelections;
    });
  };
  
  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const handleRowMouseEnter = (remedy: Remedy, event: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
        const rect = event.currentTarget.getBoundingClientRect();
        const top = rect.top + rect.height / 2; // Vertically center on the row
        const left = rect.right + 10;
        
        const tooltipWidth = 320; // Corresponds to w-80
        const adjustedLeft = (left + tooltipWidth > window.innerWidth) ? (rect.left - tooltipWidth - 10) : left;

        setActiveTooltip({ srNo: remedy.srNo, position: { top, left: adjustedLeft } });

        if (!tooltipContent[remedy.srNo] && !isFetchingRef.current.has(remedy.srNo)) {
            isFetchingRef.current.add(remedy.srNo);
            getRemedyInfo(remedy.name)
                .then(info => {
                    setTooltipContent(prev => ({ ...prev, [remedy.srNo]: { data: info } }));
                })
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : "Could not load info.";
                    setTooltipContent(prev => ({ ...prev, [remedy.srNo]: { error: errorMessage } }));
                })
                .finally(() => {
                    isFetchingRef.current.delete(remedy.srNo);
                });
        }
    }, 300); // 300ms delay before showing
  };

  const handleRowMouseLeave = (event: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
    }
    
    // Check if the mouse is moving to a child element. This prevents the tooltip from hiding when moving between cells.
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
        return;
    }

    setActiveTooltip(null);
  };

  const sortedAndFilteredRemedies = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = searchTerm
        ? remedies.filter(remedy =>
            remedy.name.toLowerCase().includes(lowercasedFilter) ||
            remedy.abbreviation.toLowerCase().includes(lowercasedFilter)
        )
        : [...remedies];

    return filtered.sort((a, b) => {
        const key = sortConfig.key;
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        // Using localeCompare for robust string sorting
        return a[key].localeCompare(b[key]) * direction;
    });
}, [remedies, searchTerm, sortConfig]);
  
  const selectionCount = Object.keys(selections).length;
  const isFormValid = patientName.trim() !== '' && selectionCount > 0;

  return (
    <div className="space-y-6">
       {activeTooltip && (
        <div
            className="fixed z-50 w-80 p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl text-slate-300 animate-fade-in-fast"
            style={{
                top: `${activeTooltip.position.top}px`,
                left: `${activeTooltip.position.left}px`,
                transform: `translateY(-50%)`,
            }}
            role="tooltip"
        >
            {tooltipContent[activeTooltip.srNo]?.data ? (
                <div className="remedy-tooltip-content" dangerouslySetInnerHTML={{ __html: tooltipContent[activeTooltip.srNo].data! }} />
            ) : tooltipContent[activeTooltip.srNo]?.error ? (
                <p className="text-red-400">{tooltipContent[activeTooltip.srNo].error}</p>
            ) : (
                <div className="flex items-center justify-center p-2">
                    <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-3 text-sm">Loading info...</span>
                </div>
            )}
        </div>
      )}
      <div className="p-6 bg-slate-800/50 rounded-lg shadow-xl animate-fade-in">
        <h2 className="text-xl font-semibold text-cyan-300 mb-4">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-slate-300 mb-1">
              Patient Name
            </label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient's full name"
              className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>
          <div className="relative">
            <label htmlFor="searchRemedy" className="block text-sm font-medium text-slate-300 mb-1">
              Search Remedies
            </label>
             <div className="relative">
                <input
                  id="searchRemedy"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by name or abbreviation..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 pl-10 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/>
             </div>
          </div>
        </div>
      </div>

       {/* AI Suggestion Section */}
      <div className="p-6 bg-slate-800/50 rounded-lg shadow-xl animate-fade-in">
        <h2 className="text-xl font-semibold text-cyan-300 mb-4">AI Symptom Analysis</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="symptoms" className="block text-sm font-medium text-slate-300 mb-1">
              Enter Patient Symptoms
            </label>
            <textarea
              id="symptoms"
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., 'Restless, anxious, with a dry cough that is worse at night. Thirsty for small sips of cold water.'"
              className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              disabled={isAiLoading}
              aria-describedby="ai-help-text"
            />
             <p id="ai-help-text" className="mt-2 text-xs text-slate-400">Describe the symptoms in detail for the best suggestions.</p>
          </div>
          {aiError && <p role="alert" className="text-sm text-red-400">{aiError}</p>}
          <div className="flex justify-end">
            <button
              onClick={handleGetAiSuggestions}
              disabled={!symptoms.trim() || isAiLoading}
              className="px-5 py-2 flex items-center justify-center gap-2 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isAiLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <MagicWandIcon className="h-5 w-5"/>
                  Get AI Suggestions
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg shadow-xl overflow-hidden animate-fade-in-delay">
         {aiSuggestions.size > 0 && !isAiLoading && (
          <div className="p-4 bg-cyan-900/40 text-center text-cyan-200 text-sm" role="status">
            AI suggested {aiSuggestions.size} {aiSuggestions.size === 1 ? 'remedy' : 'remedies'}, highlighted below.
          </div>
        )}
        <div className="overflow-x-auto">
            <div className="h-[50vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">
                                <button onClick={() => requestSort('name')} className="flex items-center group focus:outline-none">
                                    Name
                                    <SortIndicator active={sortConfig.key === 'name'} direction={sortConfig.direction} />
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">
                                <button onClick={() => requestSort('abbreviation')} className="flex items-center group focus:outline-none">
                                    Abbreviation
                                    <SortIndicator active={sortConfig.key === 'abbreviation'} direction={sortConfig.direction} />
                                </button>
                            </th>
                            <th scope="col" colSpan={3} className="px-6 py-3 text-center text-xs font-medium text-cyan-300 uppercase tracking-wider">Potency</th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {sortedAndFilteredRemedies.map((remedy) => {
                          const isSelected = !!selections[remedy.srNo];
                          const isAiSuggested = aiSuggestions.has(remedy.srNo);
                          const rowClasses = [
                            'transition-all group',
                            isSelected ? 'bg-cyan-900/30' : 'hover:bg-slate-700/50',
                            isAiSuggested ? 'ring-2 ring-inset ring-cyan-500/80' : ''
                          ].filter(Boolean).join(' ');

                          return (
                            <tr key={remedy.srNo} className={rowClasses} onMouseEnter={(e) => handleRowMouseEnter(remedy, e)} onMouseLeave={handleRowMouseLeave}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-200">{remedy.name}</span>
                                        {isAiSuggested && (
                                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-cyan-900 bg-cyan-400 rounded-full" title="Suggested by AI">AI</span>
                                        )}
                                        <InformationCircleIcon className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-400">{remedy.abbreviation}</div>
                                </td>
                                {POTENCIES.map(potency => (
                                    <td key={potency} className="px-6 py-4 whitespace-nowrap text-center">
                                        <label className="flex items-center justify-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selections[remedy.srNo]?.has(potency) || false}
                                                onChange={() => handleSelectionChange(remedy.srNo, potency)}
                                                className="h-5 w-5 rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-cyan-600 cursor-pointer"
                                            />
                                            <span className="text-sm text-slate-300">{potency}</span>
                                        </label>
                                    </td>
                                ))}
                            </tr>
                          );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 flex items-center justify-center md:justify-end">
         <div className="flex items-center gap-4">
            <span className="text-slate-300">
                {selectionCount} {selectionCount === 1 ? 'remedy' : 'remedies'} selected
            </span>
            <button
              onClick={onGenerate}
              disabled={!isFormValid}
              className="px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-cyan-500/30"
            >
              Generate Prescription
            </button>
         </div>
      </div>
    </div>
  );
};
