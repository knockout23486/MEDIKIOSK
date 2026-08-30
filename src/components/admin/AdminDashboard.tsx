import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  Settings, Users, ShieldCheck, Activity, Database,
  Cpu, Server, RefreshCw, CheckCircle2, AlertCircle, FileText, Clock
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'audit' | 'health' | 'integrations'>('queue');
  const [tokens, setTokens] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any[]>([]);
  const [integrationEvents, setIntegrationEvents] = useState<any[]>([]);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);

  const loadData = () => {
    api.getQueueTokens().then(setTokens);
    api.getAuditLogs().then(setAuditLogs);
    api.getSystemHealth().then(setHealthStatus);
    api.getIntegrationEvents().then(setIntegrationEvents);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceQueue = async (practitionerId: string = 'PRAC-01') => {
    setIsAdvancing(true);
    try {
      await api.advanceQueue(practitionerId);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Settings className="w-4 h-4 text-ayush-400" />
            Hospital Administration & DevOps Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            MediKiosk Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            All India Institute of Ayurveda • OPD Management, Audit Trail & Interoperability Gateway
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh State
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'queue' ? 'border-ayush-600 text-ayush-700 bg-ayush-50/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Live OPD Queue Manager ({tokens.length})
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'health' ? 'border-ayush-600 text-ayush-700 bg-ayush-50/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" /> System Health & Services
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'integrations' ? 'border-ayush-600 text-ayush-700 bg-ayush-50/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-4 h-4" /> ABDM & HIS Gateway Events
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'audit' ? 'border-ayush-600 text-ayush-700 bg-ayush-50/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> DPDP Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: QUEUE MANAGER */}
      {activeTab === 'queue' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Kayachikitsa OPD 104 Queue (Prof. Dr. Ananya Sharma)
              </h3>
              <p className="text-xs text-slate-500">
                Click 'Advance Queue' to call the next waiting patient into the doctor consultation room.
              </p>
            </div>

            <button
              onClick={() => handleAdvanceQueue('PRAC-01')}
              disabled={isAdvancing}
              className="px-5 py-2.5 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isAdvancing ? 'animate-spin' : ''}`} />
              <span>Advance Queue & Call Next</span>
            </button>
          </div>

          <div className="space-y-3">
            {tokens.map(t => (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between text-xs transition ${
                  t.status === 'WITH_DOCTOR'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-4 ring-emerald-400/20'
                    : t.priority === 'EMERGENCY'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 animate-pulse'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-extrabold bg-slate-900 text-white px-3 py-1 rounded-xl">
                    {t.tokenNumber}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      Patient ID: {t.patientId}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Check-in: {new Date(t.checkInTime).toLocaleTimeString()} • Est. Wait: {t.estimatedWaitMins}m
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    t.status === 'WITH_DOCTOR'
                      ? 'bg-emerald-600 text-white'
                      : t.status === 'TRIAGE_URGENT'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM HEALTH */}
      {activeTab === 'health' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Microservice Operational & Latency Status
          </h3>
          <div className="space-y-3">
            {healthStatus.map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {s.service}
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">{s.notes}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    s.status === 'OPERATIONAL'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {s.status}
                  </span>
                  <span className="font-mono text-slate-400 block text-[11px] mt-1">
                    Latency: {s.latencyMs} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            ABDM & HIS Interoperability Telemetry
          </h3>
          <div className="space-y-3">
            {integrationEvents.map(evt => (
              <div key={evt.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {evt.integrationType}
                    </span>
                    <span className="font-mono text-slate-500">{evt.endpoint}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {evt.status} ({evt.latencyMs}ms)
                  </span>
                </div>
                <div className="p-2 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(evt.payload, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Immutable DPDP Audit Trail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Actor Role</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Resource</th>
                  <th className="pb-2">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{log.actorRole}</td>
                    <td className="py-2.5 text-ayush-700 dark:text-ayush-400 font-semibold">{log.action}</td>
                    <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300">{log.resourceType}:{log.resourceId}</td>
                    <td className="py-2.5 font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
