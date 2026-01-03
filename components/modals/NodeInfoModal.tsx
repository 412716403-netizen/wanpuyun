import React from 'react';
import { X, Plus, FileText, Trash2, Paperclip, Download, ImageIcon, FileArchive } from "lucide-react";
import { StageStatus } from "@/types";

interface NodeInfoModalProps {
  tempStatus: StageStatus;
  setTempStatus: (s: StageStatus) => void;
  tempFields: any[];
  tempAttachments: { id: string, fileName: string, fileUrl: string }[];
  setTempAttachments: (a: any) => void;
  fieldInput: { label: string; value: string };
  setFieldInput: (f: any) => void;
  onAddTempField: () => void;
  onRemoveTempField: (id: string) => void;
  onUpdateTempField: (id: string, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const NodeInfoModal = ({
  tempStatus,
  setTempStatus,
  tempFields,
  tempAttachments,
  setTempAttachments,
  fieldInput,
  setFieldInput,
  onAddTempField,
  onRemoveTempField,
  onUpdateTempField,
  onSave,
  onClose
}: NodeInfoModalProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
      const newAttachment = {
        id: `att-${Date.now()}`,
        fileName: file.name,
          fileUrl: base64String
      };
      setTempAttachments([...tempAttachments, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        <div className="p-12 overflow-y-auto no-scrollbar flex-1">
          <div className="flex justify-between items-center mb-10">
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-2">节点信息登记</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">执行详情</h3>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="space-y-10">
            <div>
              <label className="text-xs font-bold text-slate-900 mb-4 block">执行状态</label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { status: 'pending' as const, label: '待开始', color: 'slate' },
                  { status: 'in_progress' as const, label: '进行中', color: 'blue' },
                  { status: 'completed' as const, label: '已完成', color: 'emerald' },
                  { status: 'error' as const, label: '异常/退回', color: 'red' },
                ].map(item => (
                  <button key={item.status} onClick={() => setTempStatus(item.status)} className={`flex flex-col items-center gap-3 p-6 rounded-[28px] border-2 transition-all ${tempStatus === item.status ? `border-${item.color === 'slate' ? 'slate' : item.color}-600 bg-${item.color === 'slate' ? 'slate' : item.color}-50` : 'border-slate-100 hover:border-slate-200'}`}>
                    <div className={`w-3 h-3 rounded-full bg-${item.color === 'slate' ? 'slate' : item.color}-500 shadow-sm`} />
                    <span className={`text-[11px] font-bold ${tempStatus === item.status ? `text-${item.color === 'slate' ? 'slate' : item.color}-600` : 'text-slate-400'}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 mb-4 block">核心工艺 / 参数登记</label>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {tempFields.map(field => (
                  <div key={field.id} className="bg-white rounded-[20px] flex items-center border border-slate-100 group/field relative shadow-sm h-14 hover:border-indigo-200 transition-all overflow-hidden">
                    <div className="bg-slate-50/50 h-full flex items-center px-4 border-r border-slate-100 min-w-[85px]">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight truncate w-full">{field.label}</span>
                    </div>
                    <input 
                      className="flex-1 px-5 text-sm font-bold text-slate-800 outline-none bg-transparent h-full w-full" 
                      value={field.value} 
                      onChange={(e) => onUpdateTempField(field.id, e.target.value)}
                      placeholder="未填写"
                    />
                    <button 
                      onClick={() => onRemoveTempField(field.id)} 
                      className="absolute right-2 opacity-0 group-hover/field:opacity-100 p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 p-2 bg-slate-50 border border-slate-100 border-dashed rounded-[24px]">
                <input placeholder="参数名称" value={fieldInput.label} onChange={(e) => setFieldInput({...fieldInput, label: e.target.value})} className="flex-1 bg-transparent px-4 py-3 text-sm outline-none" />
                <input placeholder="参数内容" value={fieldInput.value} onChange={(e) => setFieldInput({...fieldInput, value: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && onAddTempField()} className="flex-1 bg-transparent px-4 py-3 text-sm outline-none border-l border-slate-200" />
                <button onClick={onAddTempField} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus className="w-5 h-5" /></button>
              </div>
            </div>

            {/* 附件上传部分 */}
            <div>
              <label className="text-xs font-bold text-slate-900 mb-4 block">附件 / 样品开发记录 (图片或文档)</label>
              <div className="space-y-3 mb-4">
                {tempAttachments.map(file => {
                  const isImage = file.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                  return (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group/file">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                          {isImage ? (
                            <img src={file.fileUrl} className="w-full h-full object-cover" />
                          ) : file.fileName.match(/\.(zip|rar|7z)$/i) ? (
                            <FileArchive className="w-5 h-5 text-amber-500" />
                          ) : (
                        <FileText className="w-5 h-5 text-indigo-500" />
                          )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-700 truncate">{file.fileName}</p>
                          <div className="flex gap-3">
                            <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline">预览</a>
                            <button 
                              onClick={() => handleDownload(file.fileUrl, file.fileName)}
                              className="text-[10px] text-emerald-500 hover:underline"
                            >
                              下载
                            </button>
                          </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setTempAttachments(tempAttachments.filter(a => a.id !== file.id))}
                      className="p-2 opacity-0 group-hover/file:opacity-100 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  );
                })}
              </div>
              
              <div className="relative">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="image/*,.pdf,.doc,.docx,.zip,.rar,.7z"
                />
                <div className="flex items-center justify-center gap-2 p-8 border-2 border-slate-100 border-dashed rounded-[32px] bg-slate-50 hover:bg-slate-100 hover:border-indigo-200 transition-all text-slate-400">
                  <Paperclip className="w-5 h-5" />
                  <span className="text-sm font-bold">点击或拖拽上传文件</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-12 border-t border-slate-100 bg-white">
          <button onClick={onClose} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">放弃修改</button>
          <button onClick={onSave} className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-bold text-sm shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]">确认并保存节点信息</button>
        </div>
      </div>
    </div>
  );
};

