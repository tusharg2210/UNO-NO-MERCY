import React, { useState } from 'react';

const ConnectionStatus = ({ isConnected, error }) => {
  const [dismissed, setDismissed] = useState(false);
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5100';

  // Don't show if connected and no error
  if (isConnected && !error) {
    return null;
  }

  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      {/* Connecting... */}
      {!isConnected && !error && (
        <div className="bg-yellow-600/90 backdrop-blur-sm text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connecting to game server...</span>
          <span className="text-yellow-200 text-xs">({serverUrl})</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-600/95 backdrop-blur-sm text-white py-3 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">❌</span>
                <div>
                  <p className="font-bold text-sm">Cannot connect to game server</p>
                  <p className="text-red-200 text-xs mt-0.5">
                    Server: {serverUrl}
                  </p>
                  <p className="text-red-200 text-xs">
                    Error: {error}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all"
                >
                  🔄 Retry
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="px-2 py-1 hover:bg-white/20 rounded-lg text-xs transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Troubleshooting tips */}
            <div className="mt-2 p-2 bg-black/20 rounded-lg text-xs text-red-100">
              <p className="font-semibold mb-1">💡 Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Backend might be sleeping (free tier). Wait 30-60 seconds and retry.</li>
                <li>Check if VITE_SERVER_URL is correct in environment variables.</li>
                <li>Make sure backend is deployed and running.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;