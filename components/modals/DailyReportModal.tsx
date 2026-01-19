import React, { useState, useEffect } from 'react';
import { X, Calendar, Package, User, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, BarChart3 } from "lucide-react";

interface DailyReportItem {
  stageName: string;
  count: number;
  products: {
    productId: string;
    sampleId: string;
    productCode: string;
    productName: string;
    sampleName: string;
    completedAt: string;
    operator: string;
  }[];
}

interface StageTrendItem {
  date: string;
  count: number;
  products: {
    code: string;
    name: string;
    sampleName: string;
    time: string;
  }[];
}

interface DailyReportModalProps {
  onClose: () => void;
  onFetchReport: (date: string) => Promise<DailyReportItem[]>;
  onFetchStageTrend: (stageName: string, days: number) => Promise<StageTrendItem[]>;
  availableStages: string[];
}

export const DailyReportModal = ({ 
  onClose, 
  onFetchReport, 
  onFetchStageTrend,
  availableStages 
}: DailyReportModalProps) => {
  // 视图模式：daily 每日汇总 | stageTrend 节点趋势
  const [viewMode, setViewMode] = useState<'daily' | 'stageTrend'>('daily');
  
  // 每日汇总相关状态
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dailyReport, setDailyReport] = useState<DailyReportItem[]>([]);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // 节点趋势相关状态
  const [selectedStage, setSelectedStage] = useState<string>(availableStages[0] || '');
  const [trendDays, setTrendDays] = useState<number>(30);
  const [trendData, setTrendData] = useState<StageTrendItem[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);

  // 加载每日报表
  const loadDailyReport = async () => {
    setLoading(true);
    try {
      const data = await onFetchReport(selectedDate);
      setDailyReport(data);
      setExpandedStages(new Set(data.map(item => item.stageName)));
    } finally {
      setLoading(false);
    }
  };

  // 加载节点趋势
  const loadStageTrend = async () => {
    if (!selectedStage) return;
    setLoading(true);
    try {
      const data = await onFetchStageTrend(selectedStage, trendDays);
      setTrendData(data);
      setExpandedDates(new Set());
    } finally {
      setLoading(false);
    }
  };

  // 根据视图模式加载数据
  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyReport();
    } else {
      loadStageTrend();
    }
  }, [viewMode, selectedDate, selectedStage, trendDays]);

  const toggleStage = (stageName: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageName)) {
      newExpanded.delete(stageName);
    } else {
      newExpanded.add(stageName);
    }
    setExpandedStages(newExpanded);
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const totalCount = viewMode === 'daily' 
    ? dailyReport.reduce((sum, item) => sum + item.count, 0)
    : trendData.reduce((sum, item) => sum + item.count, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return '今天';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '昨天';
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-lg shadow-indigo-200">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">进度报表</h2>
              <p className="text-sm text-slate-400 mt-1 font-medium">数据分析与统计</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="px-8 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                viewMode === 'daily'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              每日汇总
            </button>
            <button
              onClick={() => setViewMode('stageTrend')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                viewMode === 'stageTrend'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              节点趋势
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          {viewMode === 'daily' ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-600">选择日期：</label>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-5 py-2.5 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-sm hover:border-slate-300 cursor-pointer"
                  style={{
                    colorScheme: 'light'
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <label className="text-sm font-bold text-slate-600">节点：</label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="flex-1 max-w-xs px-5 py-2.5 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-sm hover:border-slate-300 cursor-pointer"
                >
                  {availableStages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                <label className="text-sm font-bold text-slate-600 ml-4">天数：</label>
                <select
                  value={trendDays}
                  onChange={(e) => setTrendDays(Number(e.target.value))}
                  className="px-5 py-2.5 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-sm hover:border-slate-300 cursor-pointer"
                >
                  <option value={7}>最近7天</option>
                  <option value={30}>最近30天</option>
                  <option value={90}>最近90天</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-bold text-slate-600">总计</span>
                <span className="text-2xl font-black text-indigo-600">{totalCount}</span>
                <span className="text-sm font-bold text-slate-600">件</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-400">加载中...</p>
            </div>
          ) : viewMode === 'daily' ? (
            // 每日汇总视图
            dailyReport.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Package className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">暂无数据</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  {selectedDate} 当天没有节点完成记录，请选择其他日期查看。
                </p>
              </div>
            ) : (
              dailyReport.map((item) => (
                <div 
                  key={item.stageName}
                  className="bg-white border-2 border-slate-100 rounded-[28px] overflow-hidden hover:border-slate-200 transition-all"
                >
                  <button
                    onClick={() => toggleStage(item.stageName)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black text-slate-900">{item.stageName}</h3>
                        <p className="text-xs text-slate-400 font-bold">完成 {item.count} 件</p>
                      </div>
                    </div>
                    {expandedStages.has(item.stageName) ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedStages.has(item.stageName) && (
                    <div className="px-6 pb-4 space-y-2">
                      {item.products.map((product, idx) => (
                        <div 
                          key={`${product.productId}-${product.sampleId}-${idx}`}
                          className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-100 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-black text-slate-900">{product.productCode}</span>
                                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold">
                                  {product.sampleName}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-1">{product.productName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                              <User className="w-3 h-3" />
                              <span className="font-bold">{product.operator}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">{product.completedAt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            // 节点趋势视图
            trendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">暂无数据</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  {selectedStage} 节点在最近 {trendDays} 天内没有完成记录。
                </p>
              </div>
            ) : (
              trendData.map((dayData) => (
                <div 
                  key={dayData.date}
                  className="bg-white border-2 border-slate-100 rounded-[28px] overflow-hidden hover:border-slate-200 transition-all"
                >
                  <button
                    onClick={() => toggleDate(dayData.date)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black text-slate-900">{formatDate(dayData.date)}</h3>
                        <p className="text-xs text-slate-400 font-bold">{dayData.date} · 完成 {dayData.count} 件</p>
                      </div>
                    </div>
                    {expandedDates.has(dayData.date) ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedDates.has(dayData.date) && (
                    <div className="px-6 pb-4 space-y-2">
                      {dayData.products.map((product, idx) => (
                        <div 
                          key={`${product.code}-${idx}`}
                          className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-100 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-black text-slate-900">{product.code}</span>
                                <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-lg font-bold">
                                  {product.sampleName}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-1">{product.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold">{product.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all active:scale-95"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
