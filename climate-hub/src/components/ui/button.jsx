import React from "react";

export function Button({ children, variant = "default", ...props }) {
  const variants = {
    default: "bg-blue-500 text-white px-4 py-2 rounded",
    outline: "border border-gray-500 text-gray-700 px-4 py-2 rounded",
    secondary: "bg-gray-300 text-black px-4 py-2 rounded",
    primary: "bg-green-500 text-white px-4 py-2 rounded",
  };

  return (
    <button className={variants[variant]} {...props}>
      {children}
    </button>
  );
}
