import React from "react";

export function Select({ children, ...props }) {
  return (
    <select className="border px-2 py-1 rounded w-full" {...props}>
      {children}
    </select>
  );
}
