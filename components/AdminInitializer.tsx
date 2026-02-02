'use client'

import { useEffect } from 'react'

export default function AdminInitializer() {
  useEffect(() => {
    // Initialize admin user on app load
    const initAdmin = async () => {
      try {
        await fetch('/api/init-admin', { method: 'POST' })
      } catch (error) {
        console.error('Failed to initialize admin:', error)
      }
    }

    initAdmin()
  }, [])

  return null // This component doesn't render anything
}