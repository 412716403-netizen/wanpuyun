import React from 'react';
import { CheckCircle2, Clock, X } from 'lucide-react';
import { Stage } from '@/types';

export const StatusIndicator = ({ status }: { status: Stage["status"] }) => {
  const configs = {
    completed: { color: "bg-emerald-500", text: "已完成", icon: <CheckCircle2 className="w-4 h-4" /> },
    in_progress: { color: "bg-blue-600", text: "进行中", icon: <Clock className="w-4 h-4" /> },
    pending: { color: "bg-slate-300", text: "待开始", icon: null },
    error: { color: "bg-red-500", text: "异常/退回", icon: <X className="w-4 h-4" /> },
  };
  const config = configs[status];
  return (
    <div className="flex items-center gap-2">
      <div className={`${config.color} text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5`}>
        {config.text}
      </div>
    </div>
  );
};

