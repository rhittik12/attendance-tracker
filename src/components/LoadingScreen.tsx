import React from 'react'

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
      </div>
    </div>
  )
}

export default LoadingScreen