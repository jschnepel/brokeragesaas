"use client";

import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { UploadCloud, X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps extends Omit<DropzoneOptions, "onDrop"> {
  value?: File[];
  onChange?: (files: File[]) => void;
  className?: string;
  maxFiles?: number;
}

export function FileUpload({
  value = [],
  onChange,
  className,
  maxFiles = 5,
  accept,
  ...dropzoneProps
}: FileUploadProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...value, ...acceptedFiles].slice(0, maxFiles);
      onChange?.(newFiles);
    },
    [value, onChange, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept,
    ...dropzoneProps,
  });

  function removeFile(index: number) {
    const newFiles = value.filter((_, i) => i !== index);
    onChange?.(newFiles);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop files, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Up to {maxFiles} files
        </p>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)}KB
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
