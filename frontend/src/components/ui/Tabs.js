import React, { createContext, useContext, useState } from "react";

const TabsContext = createContext(null);

export const Tabs = ({ defaultValue, className, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className, children }) => {
  return (
    <div className={`flex border-b ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, className, children }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      className={`px-4 py-2 font-medium text-sm ${
        isActive 
          ? "border-b-2 border-blue-500 text-blue-600" 
          : "text-gray-500 hover:text-gray-700"
      } ${className}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, className, children }) => {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;
  
  return <div className={className}>{children}</div>;
};