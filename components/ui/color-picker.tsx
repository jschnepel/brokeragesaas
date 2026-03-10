"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  showAlpha?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  className,
  showAlpha: _showAlpha,
}: ColorPickerProps) {
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  function handleInputChange(newValue: string) {
    setInputValue(newValue);
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(newValue)) {
      onChange(newValue);
    }
  }

  const presets = [
    "#0F2B4F", "#0a1f38", "#C9A96E", "#FAF7F2", "#F0EDE6",
    "#1a1a2e", "#0C1C2E", "#ffffff", "#000000", "#ef4444",
    "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6",
  ];

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("h-9 w-full justify-start gap-2 px-3", className)}
          />
        }
      >
        <div
          className="h-4 w-4 shrink-0 rounded-sm border"
          style={{ backgroundColor: value }}
        />
        <span className="font-mono text-xs">{value}</span>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="flex gap-2">
          <div
            className="h-10 w-10 shrink-0 rounded-md border"
            style={{ backgroundColor: value }}
          />
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="font-mono text-xs"
            placeholder="#000000"
          />
        </div>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full cursor-pointer rounded border-0 p-0"
        />
        <div className="grid grid-cols-5 gap-1.5">
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "h-6 w-full rounded-sm border transition-transform hover:scale-110",
                value === color && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
