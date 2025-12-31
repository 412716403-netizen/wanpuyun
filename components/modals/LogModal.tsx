import React from 'react';
import { X, History } from "lucide-react";
import { SampleVersion } from "@/types";

interface LogModalProps {
  currentSample: SampleVersion;
  onClose: () => void;
}

export const LogModal = ({ currentSample, onClose }: LogModalProps) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
    <div className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
      <div className="p-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-2">{currentSample.name}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">开发版本日志</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
          {currentSample.logs?.length > 0 ? (
            currentSample.logs.map((log, idx) => (
              <div key={log.id} className="relative pl-8 pb-8 last:pb-0">
                {idx !== currentSample.logs.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100"></div>}
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white bg-indigo-500 shadow-sm z-10"></div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{log.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium mb-3 whitespace-pre-wrap leading-relaxed">{log.detail}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">JD</div>
                    <span className="text-[10px] text-slate-400 font-bold">操作人: {log.user}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <History className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-bold">暂无该版本的开发日志</p>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="bg-slate-900 text-white px-10 py-4 rounded-[24px] font-bold text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]">关闭日志</button>
        </div>
      </div>
    </div>
  </div>
);

