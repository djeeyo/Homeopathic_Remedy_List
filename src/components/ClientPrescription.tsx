import React from 'react';
import type { SelectedRemedy } from '../types';

interface ClientPrescriptionProps {
  patientName: string;
  selectedRemedies: SelectedRemedy[];
  onBack: () => void;
}

const PrintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Z" />
    </svg>
);

const BackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

const ExportIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);


export const ClientPrescription: React.FC<ClientPrescriptionProps> = ({
  patientName,
  selectedRemedies,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Remedy Name', 'Abbreviation', 'Potencies'];
    const rows = selectedRemedies.map(remedy => [
      `"${remedy.name.replace(/"/g, '""')}"`, // Handle quotes in names
      `"${remedy.abbreviation.replace(/"/g, '""')}"`,
      `"${remedy.potencies.join(' | ')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if(link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        const safePatientName = patientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute('href', url);
        link.setAttribute('download', `${safePatientName || 'prescription'}_remedies.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6 print:hidden">
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900"
            >
                <BackIcon className="h-5 w-5"/>
                New Client Form
            </button>
            <div className="flex items-center gap-4">
                 <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900"
                >
                    <ExportIcon className="h-5 w-5"/>
                    Export CSV
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900"
                >
                    <PrintIcon className="h-5 w-5"/>
                    Print
                </button>
            </div>
        </div>
      
        <div className="bg-white text-slate-800 p-8 md:p-12 rounded-lg shadow-2xl printable-area">
            <div className="border-b border-slate-200 pb-4 mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Remedy Prescription</h1>
                <p className="text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>
        
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-700">Patient Name</h2>
                <p className="text-2xl text-cyan-700 font-light">{patientName}</p>
            </div>
        
            <div>
                <h2 className="text-lg font-semibold text-slate-700 mb-4">Selected Remedies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1" role="list">
                    {selectedRemedies.map((remedy) => (
                        <div key={remedy.srNo} className="flex items-center justify-between py-3 border-b border-slate-200" role="listitem">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="text-md font-medium text-slate-900 truncate" title={remedy.name}>
                                    {remedy.name}
                                </p>
                                <p className="text-sm text-slate-500 truncate" title={remedy.abbreviation}>
                                    {remedy.abbreviation}
                                </p>
                            </div>
                            <div className="text-base font-semibold text-slate-900 text-right">
                                {remedy.potencies.join(', ')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-12 text-center text-xs text-slate-400 print:block hidden">
                <p>This prescription was generated by the Homeopathic Remedy Manager.</p>
            </div>
        </div>
        <style>
          {`
            @media print {
                body {
                    background-color: white !important;
                }
                .printable-area {
                    box-shadow: none !important;
                    margin: 0;
                    max-width: 100%;
                    border-radius: 0;
                }
                .grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
            }
          `}
        </style>
    </div>
  );
};