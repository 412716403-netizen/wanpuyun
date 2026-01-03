import React from 'react';
import { Plus, Search, Filter, ImageIcon, X, Link, Link2Off } from "lucide-react";
import { Product } from "@/types";

interface ProductSidebarProps {
  products: Product[];
  filteredProducts: Product[];
  selectedProductId: string;
  activeTab: "developing" | "archived";
  setActiveTab: (tab: "developing" | "archived") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectProduct: (id: string) => void;
  onCreateOpen: () => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  filters: any;
  setFilters: (f: any) => void;
  uniqueStageNames: string[];
  connectedInfo: { isConnected: boolean, company: string };
  onConnectOpen: () => void;
  onDisconnect: () => void;
}

export const ProductSidebar = ({
  products,
  filteredProducts,
  selectedProductId,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onSelectProduct,
  onCreateOpen,
  isFilterOpen,
  setIsFilterOpen,
  filters,
  setFilters,
  uniqueStageNames,
  connectedInfo,
  onConnectOpen,
  onDisconnect
}: ProductSidebarProps) => (
  <aside className="w-[340px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
    <div className="p-6 border-b border-slate-50 space-y-3">
      {/* 生产系统连接状态 */}
      <div className="flex items-center gap-2 mb-2">
        {connectedInfo.isConnected ? (
          <div className="flex-1 flex items-center justify-between bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 group">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[120px]">{connectedInfo.company}</span>
            </div>
            <button onClick={onDisconnect} className="p-1.5 hover:bg-white rounded-lg text-emerald-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" title="断开连接">
              <Link2Off className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={onConnectOpen}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-all"
          >
            <Link className="w-3 h-3" />
            连接生产管理系统
          </button>
        )}
      </div>

      <button 
        onClick={onCreateOpen}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4" />
        录入新款式
      </button>
    </div>

    <div className="px-6 py-4 flex gap-2">
      {(['developing', 'archived'] as const).map(tab => (
        <button 
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          {tab === 'developing' ? '开发中' : '已归档'}
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {products.filter(p => p.status === tab).length}
          </span>
        </button>
      ))}
    </div>

    <div className="px-6 pb-4">
      <div className="relative group flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
          <input 
            type="text" 
            placeholder="搜索款号、品名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
          />
        </div>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`p-2.5 rounded-xl border transition-all ${isFilterOpen || filters.syncStatus !== 'all' || filters.stageName !== 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-50'}`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>
    </div>

    {isFilterOpen && (
      <div className="mx-6 mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50">
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">高级筛选方案</span>
          <button onClick={() => setFilters({ syncStatus: 'all', stageName: 'all' })} className="text-[10px] text-indigo-600 font-bold hover:underline">重置</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">同步状态</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['all', 'synced', 'unsynced'].map(s => (
                <button key={s} onClick={() => setFilters({...filters, syncStatus: s})} className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all ${filters.syncStatus === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}>
                  {s === 'all' ? '全部' : s === 'synced' ? '已同步' : '未同步'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">当前进度节点</label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFilters({...filters, stageName: 'all'})} className={`py-1 px-2 rounded-lg text-[9px] font-bold border transition-all ${filters.stageName === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}>全部节点</button>
              {uniqueStageNames.map(name => (
                <button key={name} onClick={() => setFilters({...filters, stageName: name})} className={`py-1 px-2 rounded-lg text-[9px] font-bold border transition-all ${filters.stageName === name ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}>{name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 no-scrollbar">
      {filteredProducts.map(product => {
        const hasError = product.samples.some(s => s.stages.some(st => st.status === 'error'));
        
        return (
          <div 
            key={product.id}
            onClick={() => onSelectProduct(product.id)}
            className={`p-4 rounded-2xl cursor-pointer border transition-all relative ${selectedProductId === product.id ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
          >
            {/* 异常红点提醒 */}
            {hasError && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full shadow-sm shadow-red-200 animate-pulse z-10" />
            )}

            <div className="flex gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {product.image && product.image.startsWith('data:') ? (
                  <img src={product.image} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900 truncate">{product.code}</span>
                  {product.isSynced && <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded">● 已生成</span>}
                </div>
                <h4 className="text-xs text-slate-600 font-medium truncate mb-2">{product.name}</h4>
                <div className="flex flex-col gap-1.5">
                  {product.samples.map(sample => {
                    const inProgressStage = sample.stages.find(st => st.status === 'in_progress');
                    const errorStage = sample.stages.find(st => st.status === 'error');
                    
                    return (
                      <div key={sample.id} className="flex items-center gap-2 text-[10px] text-slate-400">
                        <div className={`w-1 h-1 rounded-full ${errorStage ? 'bg-red-500' : inProgressStage ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                        <span className={`truncate ${errorStage ? 'text-red-500 font-bold' : ''}`}>
                          {sample.name}: {errorStage ? `异常 (${errorStage.name})` : inProgressStage ? inProgressStage.name : '待开始'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-[10px] text-slate-400 font-medium overflow-hidden">
              {product.customFields.slice(0, 3).map(cf => <span key={cf.id} className="truncate max-w-[80px]">{cf.value}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  </aside>
);
