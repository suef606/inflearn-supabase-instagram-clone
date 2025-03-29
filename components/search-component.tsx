"use client";
import { Input as MaterialInput } from "@material-tailwind/react";
import { useState, ChangeEvent } from "react";
// SearchComponent에 대한 Props 타입 정의
interface SearchComponentProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
}
export default function SearchComponent({ searchInput, setSearchInput }: SearchComponentProps) {
  // TypeScript가 이해할 수 있도록 any 타입을 사용하여 props를 전달
  const inputProps: any = {
    value: searchInput,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value),
    label: "Search Images",
    icon: <i className="fa-solid fa-magnifying-glass" />
  };
  return <MaterialInput {...inputProps} />;
}