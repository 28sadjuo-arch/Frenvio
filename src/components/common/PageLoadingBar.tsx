import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const PageLoadingBar: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [location])

  return (
    <>
      {isLoading && (
        <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 z-50 animate-pulse" style={{
          animation: 'loading 1s ease-in-out forwards'
        }} />
      )}
      <style>{`
        @keyframes loading {
          0% {
            width: 0%;
            left: 0%;
          }
          50% {
            width: 100%;
            left: 0%;
          }
          100% {
            width: 100%;
            left: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

export default PageLoadingBar
