import { useRef } from 'react';
import { Upload } from 'lucide-react';
import type { Person } from '../types';

interface FileUploadProps {
    onDataLoaded: (data: Person) => void;
}

const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                // Check if it matches the structure "tree: { ... }"
                if (json.tree) {
                    onDataLoaded(json.tree);
                } else if (json.id && json.name) {
                    // Maybe they uploaded just the person object
                    onDataLoaded(json as Person);
                } else {
                    alert("Invalid JSON format. Expected root object 'tree' or a Person node.");
                }
            } catch (error) {
                console.error("Error parsing JSON:", error);
                alert("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm"
            >
                <Upload size={18} />
                <span>Load Vanshavali JSON</span>
            </button>
        </>
    );
};

export default FileUpload;
