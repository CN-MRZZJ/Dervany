"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

export function FileDropzone({
  accept = ".csv",
  onFile,
  className,
}: {
  accept?: string;
  onFile: (file: File) => void;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = React.useState(false);

  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-slate-300 bg-white p-6",
        "flex items-center justify-between gap-4",
        isOver && "border-slate-500 bg-slate-50",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900">
            拖拽 CSV 到这里，或点击选择文件
          </div>
          <div className="text-xs text-slate-500">支持格式：{accept}</div>
        </div>
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <button
          type="button"
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          onClick={() => inputRef.current?.click()}
        >
          选择文件
        </button>
      </div>
    </div>
  );
}

