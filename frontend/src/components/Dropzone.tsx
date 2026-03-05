"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileArchive, X } from "lucide-react";

interface DropzoneProps {
    onFileSelect: (file: File | null) => void;
}

export default function Dropzone({ onFileSelect }: DropzoneProps) {
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            setFile(selectedFile);
            onFileSelect(selectedFile);
        }
    }, [onFileSelect]);

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        onFileSelect(null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/zip": [".zip"] },
        multiple: false,
    });

    return (
        <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${isDragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : file
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
                }`}
        >
            <input {...getInputProps()} />

            {file ? (
                <div className="flex flex-col items-center space-y-2">
                    <FileArchive className="w-12 h-12 text-emerald-500" />
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                        onClick={removeFile}
                        className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <>
                    <div className="p-4 bg-slate-800 rounded-2xl">
                        <Upload className={`w-8 h-8 ${isDragActive ? "text-blue-500" : "text-slate-400"}`} />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-medium">
                            {isDragActive ? "Drop the ZIP here" : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-slate-500 text-sm mt-1">Only .zip files are allowed (max 5MB)</p>
                    </div>
                </>
            )}
        </div>
    );
}
