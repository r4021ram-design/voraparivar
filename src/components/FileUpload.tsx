import { useRef } from 'react';
import { Upload } from 'lucide-react';
import type { Person } from '../types';
import { validatePerson } from '../utils/validateTree';

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
                let dataToLoad: any = null;
                if (json.tree) {
                    dataToLoad = json.tree;
                } else if (json.id && json.name) {
                    dataToLoad = json;
                }

                if (dataToLoad) {
                    const validation = validatePerson(dataToLoad);
                    if (validation.valid) {
                        onDataLoaded(dataToLoad as Person);
                    } else {
                        alert(`JSON validation failed:\n${validation.errors.slice(0, 5).join('\n')}${validation.errors.length > 5 ? '\n...' : ''}`);
                    }
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
                aria-label="Upload Family Tree JSON"
                title="Upload JSON"
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
