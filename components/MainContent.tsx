import React from 'react';
import { Edit3, CheckCircle2, Clock, RefreshCw, History, Plus, Layers, FileText, X, Download, FileArchive, ImageIcon, Trash2 } from "lucide-react";
import { Product, SampleVersion } from "@/types";

interface MainContentProps {
  selectedProduct: Product;
  currentSample: SampleVersion;
  activeSampleId: string;
  setActiveSampleId: (id: string) => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onToggleSync: (id: string) => void;
  onNodeRegister: (stage: any) => void;
  onLogOpen: () => void;
  onAddSample: () => void;
  onDeleteSample: (sampleId: string) => void;
}

export const MainContent = ({
  selectedProduct,
  currentSample,
  activeSampleId,
  setActiveSampleId,
  onEditProduct,
  onDeleteProduct,
  onToggleArchive,
  onToggleSync,
  onNodeRegister,
  onLogOpen,
  onAddSample,
  onDeleteSample
}: MainContentProps) => {
  // 判断商品是否可以删除：所有样衣的所有节点都处于 "pending" 状态
  const canDelete = selectedProduct.samples.every(s => 
    s.stages.every(st => st.status === 'pending')
  );

  return (
    <main className="flex-1 flex flex-col bg-white overflow-y-auto no-scrollbar">
    {/* Header Section */}
    <div className="p-10 flex gap-10 border-b border-slate-100">
      <div className="w-64 h-64 bg-slate-50 rounded-[32px] overflow-hidden relative shadow-xl shadow-slate-200/50 flex-shrink-0 flex items-center justify-center">
        {selectedProduct.image && selectedProduct.image.startsWith('data:') ? (
          <img 
            src={selectedProduct.image} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              // 如果 Base64 损坏，显示占位图
              (e.target as HTMLImageElement).src = "";
              (e.target as HTMLImageElement).className = "hidden";
            }}
          />
        ) : (
          <div className="flex flex-col items-center text-slate-300">
            <ImageIcon className="w-16 h-16 mb-2 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Image</span>
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => onEditProduct(selectedProduct)} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-slate-600 hover:text-indigo-600" title="编辑款式"><Edit3 className="w-4 h-4" /></button>
          {canDelete && (
            <button 
              onClick={() => {
                if (confirm(`确定要彻底删除款式“${selectedProduct.code}”吗？此操作不可撤销。`)) {
                  onDeleteProduct(selectedProduct.id);
                }
              }} 
              className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-red-400 hover:text-red-600 hover:bg-red-50"
              title="删除款式"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 pt-2 min-w-0">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter truncate">{selectedProduct.code}</h2>
          {selectedProduct.isSynced ? (
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 商品信息已同步
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-100 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 未同步
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-indigo-500 font-bold mb-8">
          <span className="text-sm">{selectedProduct.code}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>
          <span className="text-xs text-slate-400 font-medium tracking-tight">创建于 {selectedProduct.createdAt}</span>
          <button onClick={() => onToggleArchive(selectedProduct.id)} className={`ml-4 text-[10px] px-3 py-1 rounded-lg font-bold border ${selectedProduct.status === 'developing' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
            {selectedProduct.status === 'developing' ? '归档此货号' : '还原至开发中'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {selectedProduct.customFields.map(cf => (
            <div key={cf.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{cf.label}</div>
              <div className="text-sm font-bold text-slate-900 truncate">{cf.value}</div>
            </div>
          ))}
        </div>

        {selectedProduct.isSynced ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white"><RefreshCw className="w-6 h-6" /></div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">SYNC SUCCESS</h4>
                <p className="text-xs text-emerald-700 font-medium">开发数据已转化为大货商品信息</p>
              </div>
            </div>
            <button onClick={() => onToggleSync(selectedProduct.id)} className="bg-white text-emerald-600 border border-emerald-200 px-6 py-2.5 rounded-xl font-bold text-xs">撤回同步状态</button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400"><RefreshCw className="w-6 h-6" /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-600">READY TO SYNC</h4>
                <p className="text-xs text-slate-500 font-medium">开发已完成？点击按钮同步至生产系统</p>
              </div>
            </div>
            <button onClick={() => onToggleSync(selectedProduct.id)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-100">生成大货生产商品信息</button>
          </div>
        )}
      </div>
    </div>

    {/* Development Record */}
    <div className="p-10 bg-slate-50/30 flex-1">
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
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`确定要删除轮次“${sample.name}”吗？此操作不可撤销。`)) {
                    onDeleteSample(sample.id);
                  }
                }}
                className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/sample:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20 border-2 border-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={onAddSample}
          className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
          title="新增开发轮次 (二样/三样)"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 max-w-4xl relative">
        <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-slate-100"></div>
        {currentSample.stages.map((stage, idx) => (
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
                {stage.fields.map(field => (
                  <div key={field.id} className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 min-w-[140px]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{field.label}</div>
                    <div className="text-sm font-bold text-slate-900">{field.value}</div>
                  </div>
                ))}
              </div>

              {/* 附件外显部分 */}
              {stage.attachments && stage.attachments.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-8">
                  {stage.attachments.map((file: any) => {
                    const isImage = file.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const handleDownload = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = file.fileUrl;
                      link.download = file.fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    };

                    return (
                      <div 
                        key={file.id} 
                        className="group/file relative flex items-center gap-3 px-4 py-2.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-2xl transition-all pr-12"
                      >
                        <a 
                          href={file.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                            {isImage ? (
                              <img src={file.fileUrl} className="w-full h-full object-cover" />
                            ) : file.fileName.match(/\.(zip|rar|7z)$/i) ? (
                              <FileArchive className="w-5 h-5 text-amber-500" />
                            ) : (
                              <FileText className="w-5 h-5 text-indigo-500" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-indigo-600 truncate max-w-[120px]">{file.fileName}</span>
                            <span className="text-[9px] text-indigo-400 font-medium">
                              {isImage ? '图片图片' : file.fileName.match(/\.(zip|rar|7z)$/i) ? '压缩包文件' : '文档文件'}
                            </span>
                          </div>
                        </a>
                        <button 
                          onClick={handleDownload}
                          className="absolute right-3 p-2 bg-white text-indigo-500 hover:text-indigo-700 rounded-lg shadow-sm opacity-0 group-hover/file:opacity-100 transition-all hover:scale-110"
                          title="下载文件"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
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

