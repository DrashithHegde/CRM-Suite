import React, { useState, useEffect } from 'react';
import { Bug, X, Copy, Check, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [backendInfo, setBackendInfo] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const addLog = (type, message, data = null) => {
    setLogs((prev) =>
      [{ id: Date.now(), type, message, data, timestamp: new Date().toISOString() }, ...prev].slice(
        0,
        50
      )
    );
  };

  const checkConnection = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:5000/health');
      const latency = Date.now() - startTime;
      const data = await response.json();
      setConnectionStatus(`connected (${latency}ms)`);
      setBackendInfo(data);
      addLog('success', 'Backend connection successful', { latency, ...data });
    } catch (error) {
      setConnectionStatus('disconnected');
      addLog('error', 'Failed to connect to backend', { message: error.message });
    }
  };

  const copyLogs = () => {
    const logText = logs
      .map((l) => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Logs copied');
  };

  const testAPI = async (endpoint) => {
    try {
      const response = await api.get(endpoint);
      addLog('success', `API ${endpoint}`, { status: response.status, data: response.data });
      toast.success(`API ${endpoint} OK`);
    } catch (error) {
      addLog('error', `API ${endpoint} failed`, { message: error.message });
      toast.error(`API ${endpoint} failed`);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all"
      >
        <Bug className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="card w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Debug Panel</h2>
                <div
                  className={`h-2 w-2 rounded-full ${connectionStatus.includes('connected') ? 'bg-green-500' : connectionStatus === 'unhealthy' ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}
                ></div>
                <span className="text-xs text-gray-500">{connectionStatus}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex h-[calc(80vh-120px)]">
              <div className="w-64 border-r p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={checkConnection}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg btn-ghost"
                    >
                      Test Connection
                    </button>
                    <button
                      onClick={() => testAPI('/leads?page=1&limit=5')}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg btn-ghost"
                    >
                      Test Leads API
                    </button>
                    <button
                      onClick={() => testAPI('/leads/analytics')}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg btn-ghost"
                    >
                      Test Analytics API
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">System Info</h3>
                  <div className="text-xs space-y-1 text-slate-700">
                    <p>API: {process.env.REACT_APP_API_URL}</p>
                    <p>Token: {localStorage.getItem('token') ? '✅' : '❌'}</p>
                    {backendInfo && <p>Backend: v{backendInfo.version}</p>}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex justify-between mb-4">
                  <h3 className="text-sm font-medium">Logs ({logs.length})</h3>
                  <button onClick={copyLogs} className="text-xs px-2 py-1 rounded bg-gray-100">
                    {copied ? (
                      <Check className="h-3 w-3 inline" />
                    ) : (
                      <Copy className="h-3 w-3 inline" />
                    )}{' '}
                    Copy
                  </button>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded-lg border ${log.type === 'error' ? 'bg-red-50 border-red-200' : log.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="font-medium">{log.type.toUpperCase()}</span>
                      </div>
                      <p className="mt-1">{log.message}</p>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No logs yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
