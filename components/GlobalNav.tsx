import React from 'react';
import { ShieldCheck, Package, History, Settings } from "lucide-react";

export const GlobalNav = () => (
  <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 flex-shrink-0">
    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
      <ShieldCheck className="w-6 h-6 text-white" />
    </div>
    <div className="flex flex-col gap-4">
      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl cursor-pointer">
        <Package className="w-6 h-6" />
      </div>
      <div className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
        <History className="w-6 h-6" />
      </div>
    </div>
    <div className="mt-auto p-3 text-slate-400 hover:bg-slate-50 rounded-xl cursor-pointer">
      <Settings className="w-6 h-6" />
    </div>
  </aside>
);

