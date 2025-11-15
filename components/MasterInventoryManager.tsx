
import React, { useRef } from 'react';

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75m-9.75 9.75h15" />
    </svg>
);

const ResetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l4.663-4.663m-4.663 0l-3.181 3.183" />
    </svg>
);


interface MasterInventoryManagerProps {
    onUpdateInventory: (csvData: string) => void;
    onResetInventory: () => void;
    isDefaultList: boolean;
}

export const MasterInventoryManager: React.FC<MasterInventoryManagerProps> = ({ onUpdateInventory, onResetInventory, isDefaultList }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                onUpdateInventory(text);
            }
        };
        reader.readAsText(file);
        
        // Reset file input value to allow re-uploading the same file
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,text/csv"
                className="hidden"
                id="inventory-upload"
            />
            <label
                htmlFor="inventory-upload"
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 cursor-pointer"
                title="Upload a new remedy list in CSV format"
            >
                <UploadIcon className="h-4 w-4" />
                Update List
            </label>
            <button
                onClick={onResetInventory}
                disabled={isDefaultList}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Reset to default inventory list"
                title="Reset to the original remedy list"
            >
                <ResetIcon className="h-4 w-4" />
                Reset
            </button>
        </div>
    );
};
