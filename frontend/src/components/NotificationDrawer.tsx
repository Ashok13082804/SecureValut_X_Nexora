import React from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: string;
  link?: string;
  timeAgo: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  if (!isOpen) return null;

  const sampleNotifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Weaponized Macro Quarantined',
      message: "File 'Invoice_Macro_Payment_Processor.docm' was isolated. Threat score 88/100.",
      severity: 'CRITICAL',
      link: 'threats',
      timeAgo: '12m ago'
    },
    {
      id: '2',
      title: 'Blockchain Audit Block Appended',
      message: 'Block #4 minted with cryptographic event anchor.',
      severity: 'INFO',
      link: 'blockchain',
      timeAgo: '45m ago'
    },
    {
      id: '3',
      title: 'UEBA Velocity Anomaly',
      message: 'Elevated download velocity detected for user john.doe.',
      severity: 'HIGH',
      link: 'ueba',
      timeAgo: '2h ago'
    },
    {
      id: '4',
      title: 'MFA Defense Verification',
      message: 'Multi-factor authentication blocked unauthorized foreign IP session attempt.',
      severity: 'MEDIUM',
      link: 'incidents',
      timeAgo: '4h ago'
    }
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-[#090d16] border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Security Alerts Feed</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sampleNotifications.map((notif) => {
          const isCrit = notif.severity === 'CRITICAL';
          const isHigh = notif.severity === 'HIGH';
          const isMed = notif.severity === 'MEDIUM';

          return (
            <div
              key={notif.id}
              onClick={() => {
                if (notif.link) onNavigate(notif.link);
                onClose();
              }}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isCrit ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  isHigh ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  isMed ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {notif.severity}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{notif.timeAgo}</span>
              </div>
              <h4 className="text-xs font-semibold text-white">{notif.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{notif.message}</p>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950 text-center">
        <span className="text-[11px] text-slate-500 font-mono">SOC Real-Time Stream Connected</span>
      </div>
    </div>
  );
};
