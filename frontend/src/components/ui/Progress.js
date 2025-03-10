import React from "react";

export const Progress = ({ value, className, variant = "default", ...props }) => {
  // Define color classes for different variants
  const variantStyles = {
    default: "bg-blue-600",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500"
  };

  // Get the appropriate color based on variant
  const barColor = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`bg-gray-200 rounded-full overflow-hidden h-2 ${className || ""}`} {...props}>
      <div
        className={`${barColor} h-full transition-all duration-300`}
        style={{ width: `${value}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  );
};