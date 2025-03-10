import React, { createContext, useContext, useState, useRef, useEffect } from "react";

const SelectContext = createContext(null);

export const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  
  const handleSelect = (value) => {
    setSelectedValue(value);
    onValueChange?.(value);
    setIsOpen(false);
  };
  
  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, selectedValue, handleSelect }}>
      {children}
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ className, children }) => {
  const { isOpen, setIsOpen } = useContext(SelectContext);
  
  return (
    <button
      className={`flex items-center justify-between px-3 py-2 border rounded-md bg-white ${className}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`ml-2 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
      >
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
  );
};

export const SelectValue = ({ placeholder }) => {
  const { selectedValue } = useContext(SelectContext);
  
  return <span>{selectedValue || placeholder}</span>;
};

export const SelectContent = ({ children }) => {
  const { isOpen, setIsOpen } = useContext(SelectContext);
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={ref}
      className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg"
    >
      {children}
    </div>
  );
};

export const SelectItem = ({ value, children }) => {
  const { selectedValue, handleSelect } = useContext(SelectContext);
  const isSelected = selectedValue === value;
  
  return (
    <div
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${isSelected ? "bg-blue-50 text-blue-600" : ""}`}
      onClick={() => handleSelect(value)}
    >
      {children}
    </div>
  );
};