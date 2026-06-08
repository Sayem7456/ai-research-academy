"use client";
import React from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export default function SearchInput({ value, onChange, onKeyDown }: Props) {
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Search lessons, algorithms, papers..."
      className="w-full p-3 rounded border bg-white text-black"
    />
  );
}
