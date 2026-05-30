'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

/**
 * Animación de entrada por página.
 * Se eliminó AnimatePresence (exit animation) porque en React 19 el DevTools
 * no puede inspeccionar los cache nodes del árbol saliente → TypeError en dev.
 * La animación de entrada es suficiente para dar fluidez.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}
