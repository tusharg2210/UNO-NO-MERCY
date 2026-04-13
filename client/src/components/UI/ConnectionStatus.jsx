import React, { useState } from 'react';

const ConnectionStatus = ({ isConnected, error }) => {
  const [dismissed, setDismissed] = useState(false);

  if (isConnected && !error) {
    return null;
  }

  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      {!isConnected && !error && (
        <div
          className="flex items-center justify-center gap-2 bg-yellow-600/90 px-4 py-2 text-center text-sm text-white backdrop-blur-sm"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
        >
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connecting to game server...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-600/95 backdrop-blur-sm px-3 py-3 text-white sm:px-4" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <div className="mx-auto max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xl shrink-0" aria-hidden>
                  !
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-sm">Cannot connect to game server</p>
                  <p className="text-red-200 text-xs mt-0.5 break-words">{error}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="px-2 py-1 hover:bg-white/20 rounded-lg text-xs transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="mt-2 p-2 bg-black/20 rounded-lg text-xs text-red-100">
              <p className="font-semibold mb-1">Troubleshooting</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>The game server may be waking up—wait 30–60 seconds and retry.</li>
                <li>Check your network connection, then try again.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
