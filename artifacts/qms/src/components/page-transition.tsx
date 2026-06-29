import { motion } from "framer-motion";
import React from "react";

export function PageTransition({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function ListTransition({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, staggerChildren: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
