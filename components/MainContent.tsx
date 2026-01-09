import React from 'react';
import { Edit3, CheckCircle2, Clock, RefreshCw, History, Plus, Layers, FileText, X, Download, FileArchive, Image as ImageIcon, Trash2, Tag, Ruler } from "lucide-react";
import { Product, SampleVersion } from "@/types";

interface MainContentProps {
  selectedProduct: Product;
  currentSample: SampleVersion;
  activeSampleId: string;
  setActiveSampleId: (id: string) => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onSync: (id: string) => Promise<void>;
  onNodeRegister: (stage: any) => void;
  onLogOpen: () => void;
  onAddSample: () => void;
  onDeleteSample: (sampleId: string) => void;
  isDetailLoading?: boolean;
}

export const MainContent = ({
  selectedProduct,
  currentSample,
  activeSampleId,
    setActiveSampleId,
    onEditProduct,
    onDeleteProduct,
    onToggleArchive,
    onSync,
    onNodeRegister,
    onLogOpen,
  onAddSample,
  onDeleteSample,
  isDetailLoading = false
}: MainContentProps) => {
  const [showFullImage, setShowFullImage] = React.useState(false);
  const canDelete = selectedProduct.samples.every(s => 
    s.stages.every((st, idx) => {
      if (idx === 0) return st.status === 'pending' || st.status === 'in_progress';
      return st.status === 'pending';
    })
  );

  return (
    <main className="flex-1 flex flex-col bg-white overflow-y-auto no-scrollbar relative">
      {/* 全屏原图查看器 */}
      {showFullImage && selectedProduct.image && (
        <div 
          className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-200"
          onClick={() => setShowFullImage(false)}
        >
          <button 
            className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            onClick={() => setShowFullImage(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedProduct.image} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isDetailLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-xs font-bold text-slate-400 animate-pulse tracking-widest uppercase">正在获取高清附件与详情...</p>
        </div>
      )}
      {/* Header Section */}
      <div className="p-10 flex gap-10 border-b border-slate-100">
        <div 
          onClick={() => selectedProduct.image && setShowFullImage(true)}
          className={`w-64 h-64 bg-slate-50 rounded-[32px] overflow-hidden relative shadow-xl shadow-slate-200/50 flex-shrink-0 flex items-center justify-center transition-all ${selectedProduct.image ? 'cursor-zoom-in hover:scale-[1.02] active:scale-[0.98]' : ''}`}
        >
          {selectedProduct.image && selectedProduct.image.startsWith('data:') ? (
            <img src={selectedProduct.image} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-slate-300">
              <ImageIcon className="w-16 h-16 mb-2 opacity-20" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Image</span>
            </div>
          )}
          <div className="absolute top-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEditProduct(selectedProduct)} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-slate-600 hover:text-indigo-600" title="编辑款式"><Edit3 className="w-4 h-4" /></button>
            {canDelete && (
              <button 
                onClick={() => { if (confirm(`确定要彻底删除款式“${selectedProduct.code}”吗？`)) onDeleteProduct(selectedProduct.id); }} 
                className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-red-400 hover:text-red-600 hover:bg-red-50"
              ><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        </div>

        <div className="flex-1 pt-2 min-w-0">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter truncate">{selectedProduct.code}</h2>
            {selectedProduct.isSynced ? (
              <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-bold border border-emerald-100 flex items-center gap-2 group">
                <CheckCircle2 className="w-3.5 h-3.5" /> <span>商品信息已同步</span>
              </div>
            ) : (
              <button onClick={() => onSync(selectedProduct.id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> 生成大货商品信息
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-indigo-500 font-bold mb-8">
            <span className="text-sm">{selectedProduct.name}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>
            <span className="text-xs text-slate-400 font-medium tracking-tight">创建于 {selectedProduct.createdAt}</span>
            <button onClick={() => onToggleArchive(selectedProduct.id)} className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${selectedProduct.status === 'developing' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
              {selectedProduct.status === 'developing' ? <><FileArchive className="w-3.5 h-3.5" />归档此货号</> : <><RefreshCw className="w-3.5 h-3.5" />还原至开发中</>}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Tag className="w-3 h-3" /> 颜色
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedProduct.colors?.length > 0 ? selectedProduct.colors.map(c => (
                  <span key={c} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 shadow-sm">{c}</span>
                )) : <span className="text-[10px] text-slate-300 italic">未设置</span>}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Ruler className="w-3 h-3" /> 尺码
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedProduct.sizes?.length > 0 ? selectedProduct.sizes.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 shadow-sm">{s}</span>
                )) : <span className="text-[10px] text-slate-300 italic">未设置</span>}
              </div>
            </div>
            {selectedProduct.customFields.filter(cf => cf.value && cf.value.trim() !== "").map(cf => (
              <div key={cf.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{cf.label}</div>
                <div className="text-sm font-bold text-slate-900 truncate">{cf.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Development Record */}
      <div className="p-10 bg-slate-50/30 flex-1">
        {/* ... 原有的样衣轮次逻辑保持不变 ... */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">样品开发记录</h3>
          <button onClick={onLogOpen} className="flex items-center gap-2 text-[10px] text-slate-400 font-medium hover:text-indigo-600"><History className="w-3.5 h-3.5" />版本日志</button>
        </div>

        <div className="flex gap-3 mb-10 overflow-x-auto no-scrollbar pb-2 pt-2 px-2 -mx-2">
          {selectedProduct.samples.map(sample => (
            <div key={sample.id} className="group/sample relative flex-shrink-0">
              <button 
                onClick={() => setActiveSampleId(sample.id)} 
                className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${activeSampleId === sample.id ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'}`}
              >
                <Layers className="w-4 h-4" />{sample.name}
              </button>
              {selectedProduct.samples.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`确定要删除轮次“${sample.name}”吗？`)) onDeleteSample(sample.id); }} className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/sample:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20 border-2 border-white">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
          <button onClick={onAddSample} className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"><Plus className="w-5 h-5" /></button>
        </div>

        <div className="space-y-6 max-w-4xl relative">
          <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-slate-100"></div>
          {currentSample?.stages?.map((stage, idx) => (
            <div key={stage.id} className="relative pl-16">
              <div className={`absolute left-0 top-6 w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center text-sm font-bold z-10 ${stage.status === 'completed' ? 'bg-emerald-500 text-white' : stage.status === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-white'}`}>
                {stage.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">{stage.name}</h4>
                    <span className="text-[10px] text-slate-300 font-medium italic">更新于 {stage.updatedAt}</span>
                  </div>
                  <div className={`text-[10px] font-bold px-3 py-1 rounded-full ${stage.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : stage.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                    {stage.status === 'completed' ? '已完成' : stage.status === 'in_progress' ? '进行中' : '待开始'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                  {stage.fields.filter(field => field.value && String(field.value).trim() !== "").map(field => (
                    <div key={field.id} className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 min-w-[140px]">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{field.label}</div>
                      <div className="text-sm font-bold text-slate-900">{field.value}</div>
                    </div>
                  ))}
                </div>

                {stage.attachments && stage.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-8">
                    {stage.attachments.map((file: any) => (
                      <div key={file.id} className="group/file relative flex items-center gap-3 px-4 py-2.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-2xl transition-all pr-12">
                        <a href={file.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                            {file.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <img src={file.fileUrl} className="w-full h-full object-cover" /> : file.fileName.match(/\.(zip|rar|7z)$/i) ? <FileArchive className="w-5 h-5 text-amber-500" /> : <FileText className="w-5 h-5 text-indigo-500" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-indigo-600 truncate max-w-[120px]">{file.fileName}</span>
                            <span className="text-[9px] text-indigo-400 font-medium">{file.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? '图片文件' : file.fileName.match(/\.(zip|rar|7z)$/i) ? '压缩包文件' : '文档文件'}</span>
                          </div>
                        </a>
                        <button onClick={() => { const link = document.createElement('a'); link.href = file.fileUrl; link.download = file.fileName; link.click(); }} className="absolute right-3 p-2 bg-white text-indigo-500 hover:text-indigo-700 rounded-lg shadow-sm opacity-0 group-hover/file:opacity-100 transition-all"><Download className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => onNodeRegister(stage)} className="w-full py-3 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 hover:bg-indigo-50 hover:text-indigo-600">
                  <Edit3 className="w-3.5 h-3.5" />录入节点开发资料
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
