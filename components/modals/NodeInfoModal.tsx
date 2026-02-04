import React, { useState } from 'react';
import { X, FileText, Trash2, Paperclip, FileArchive } from "lucide-react";
import { StageStatus } from "@/types";

interface TemplateField {
  id: string;
  label: string;
  required: boolean;
  order: number;
}

interface NodeInfoModalProps {
  stageName: string;  // 当前节点名称
  tempStatus: StageStatus;
  setTempStatus: (s: StageStatus) => void;
  tempFields: any[];
  tempAttachments: { id: string, fileName: string, fileUrl: string }[];
  setTempAttachments: (a: any) => void;
  templateFields: TemplateField[];  // 节点模板配置的参数
  onUpdateTempField: (id: string, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const NodeInfoModal = ({
  stageName,
  tempStatus,
  setTempStatus,
  tempFields,
  tempAttachments,
  setTempAttachments,
  templateFields,
  onUpdateTempField,
  onSave,
  onClose
}: NodeInfoModalProps) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 保存前校验必填项
  const handleSave = () => {
    const errors: string[] = [];
    templateFields.forEach(tf => {
      if (tf.required) {
        const field = tempFields.find(f => f.label === tf.label);
        if (!field || !field.value || field.value.trim() === '') {
          errors.push(tf.label);
        }
      }
    });
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      alert(`请填写必填项：${errors.join('、')}`);
      return;
    }
    
    setValidationErrors([]);
    onSave();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // 如果是图片，进行前端压缩
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 1200; // 节点附件图最大 1200px
            
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // 质量设为 0.7，平衡清晰度与体积
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            const newAttachment = {
              id: `att-${Date.now()}`,
              fileName: file.name.replace(/\.[^/.]+$/, "") + ".jpg", // 统一转为 jpg
              fileUrl: compressedBase64
            };
            setTempAttachments([...tempAttachments, newAttachment]);
          };
          img.src = base64String;
        } else {
          // 非图片文件原样保存
          const newAttachment = {
            id: `att-${Date.now()}`,
            fileName: file.name,
            fileUrl: base64String
          };
          setTempAttachments([...tempAttachments, newAttachment]);
        }
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
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stageName}</h3>
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
              {templateFields.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-3xl text-slate-400 text-sm">
                  该节点暂未配置参数，请在"节点管理"中添加
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {templateFields.map(tf => {
                    const field = tempFields.find(f => f.label === tf.label);
                    const hasError = validationErrors.includes(tf.label);
                    return (
                      <div 
                        key={tf.id} 
                        className={`bg-white rounded-[20px] flex items-center border shadow-sm h-14 transition-all overflow-hidden ${
                          hasError ? 'border-red-300 bg-red-50/30' : 'border-slate-100 hover:border-indigo-200'
                        }`}
                      >
                        <div className={`h-full flex items-center px-4 border-r min-w-[100px] ${
                          hasError ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/50 border-slate-100'
                        }`}>
                          <span className={`text-[11px] font-bold uppercase tracking-tight truncate w-full ${
                            hasError ? 'text-red-500' : 'text-slate-400'
                          }`}>
                            {tf.label}
                            {tf.required && <span className="text-red-500 ml-0.5">*</span>}
                          </span>
                        </div>
                        <input 
                          className="flex-1 px-5 text-sm font-bold text-slate-800 outline-none bg-transparent h-full w-full" 
                          value={field?.value || ''} 
                          onChange={(e) => onUpdateTempField(field?.id || tf.id, e.target.value)}
                          placeholder={tf.required ? '必填' : '未填写'}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
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
          <button onClick={handleSave} className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-bold text-sm shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]">确认并保存节点信息</button>
        </div>
      </div>
    </div>
  );
};

