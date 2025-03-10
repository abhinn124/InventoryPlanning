import React from "react";

export const Badge = ({ variant = "default", className, children }) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  
  const variantStyles = {
    default: "bg-blue-100 text-blue-800",
    outline: "bg-white text-gray-600 border border-gray-200",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800"
  };
  
  const styles = `${baseStyles} ${variantStyles[variant] || variantStyles.default} ${className || ""}`;
  
  return <span className={styles}>{children}</span>;
};