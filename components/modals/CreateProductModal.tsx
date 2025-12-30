import React from 'react';
import { X, Plus, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import { ProductCustomField } from "@/types";

interface CreateProductModalProps {
  isEditMode: boolean;
  newProduct: { code: string; name: string; customFields: ProductCustomField[]; image?: string };
  setNewProduct: (p: any) => void;
  newProductFieldInput: { label: string; value: string };
  setNewProductFieldInput: (f: any) => void;
  newProductStages: string[];
  stageInput: string;
  setStageInput: (s: string) => void;
  onAddCustomField: () => void;
  onRemoveCustomField: (id: string) => void;
  onUpdateCustomField: (id: string, field: 'label' | 'value', val: string) => void;
  onAddStage: (name?: string) => void;
  onRemoveStage: (idx: number) => void;
  onMoveStage: (idx: number, dir: 'up' | 'down') => void;
  onSave: () => void;
  onClose: () => void;
  templates: { id: string, name: string }[];
  onDeleteTemplate: (id: string) => void;
}

export const CreateProductModal = ({
  isEditMode,
  newProduct,
  setNewProduct,
  newProductFieldInput,
  setNewProductFieldInput,
  newProductStages,
  stageInput,
  setStageInput,
  onAddCustomField,
  onRemoveCustomField,
  onUpdateCustomField,
  onAddStage,
  onRemoveStage,
  onMoveStage,
  onSave,
  onClose,
  templates,
  onDeleteTemplate
}: CreateProductModalProps) => {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProduct({ ...newProduct, image: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[48px] shadow-2xl flex overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        <div className="w-[450px] bg-slate-50 p-12 flex flex-col flex-shrink-0">
          <div className="flex-1 rounded-[40px] border-4 border-white shadow-2xl overflow-hidden relative group bg-slate-200/50">
            {newProduct.image ? (
              <img src={newProduct.image} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-xs font-medium opacity-50">暂无封面图片</p>
              </div>
            )}
            <label className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl font-bold text-sm text-slate-900">
                {newProduct.image ? "更换封面" : "上传封面"}
              </div>
            </label>
          </div>
          <div className="mt-10 space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">款号 *</label>
              <input value={newProduct.code} onChange={(e) => setNewProduct({...newProduct, code: e.target.value})} placeholder="例: SW2405-01" className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">品名 *</label>
              <input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="输入描述性名称" className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10" />
            </div>
          </div>
        </div>

        <div className="flex-1 p-12 overflow-y-auto no-scrollbar relative">
          <button onClick={onClose} className="absolute right-12 top-12 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-10">{isEditMode ? "编辑款式信息" : "新产品录入"}</h3>

          <div className="space-y-10">
            <div>
              <label className="text-xs font-bold text-slate-900 mb-4 block">扩展信息字段 (自定义)</label>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                {newProduct.customFields.map(field => (
                  <div key={field.id} className="bg-white rounded-[20px] flex items-center border border-slate-100 group/field relative shadow-sm h-14 hover:border-indigo-200 transition-all">
                    <div className="bg-slate-50/50 h-full flex items-center px-4 rounded-l-[19px] border-r border-slate-100 min-w-[85px]">
                      <input 
                        className="bg-transparent text-[11px] font-bold text-slate-400 uppercase tracking-tight w-full outline-none" 
                        value={field.label} 
                        onChange={(e) => onUpdateCustomField(field.id, 'label', e.target.value)} 
                      />
                    </div>
                    <input 
                      className="flex-1 px-5 text-sm font-bold text-slate-800 outline-none bg-transparent" 
                      value={field.value} 
                      onChange={(e) => onUpdateCustomField(field.id, 'value', e.target.value)} 
                    />
                    <button 
                      onClick={() => onRemoveCustomField(field.id)} 
                      className="absolute -right-2 -top-2 opacity-0 group-hover/field:opacity-100 bg-white text-red-500 rounded-full p-1.5 border border-red-100 shadow-md hover:bg-red-50 transition-all z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 p-2 border border-slate-100 border-dashed rounded-[24px]">
                <input placeholder="新字段名" className="flex-1 bg-transparent px-4 py-2 text-xs outline-none" value={newProductFieldInput.label} onChange={(e) => setNewProductFieldInput({...newProductFieldInput, label: e.target.value})} />
                <input placeholder="数值" className="flex-1 bg-transparent px-4 py-2 text-xs outline-none border-l border-slate-100" value={newProductFieldInput.value} onChange={(e) => setNewProductFieldInput({...newProductFieldInput, value: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && onAddCustomField()} />
                <button onClick={onAddCustomField} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-100"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {!isEditMode && (
              <div>
                <label className="text-xs font-bold text-slate-900 mb-4 block">开发流程排序</label>
                
                {/* 节点名称模板库 */}
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">点击快速添加节点</p>
                <div className="flex flex-wrap gap-2">
                  {templates.map(t => (
                    <div key={t.id} className="group/tag relative">
                      <button 
                        onClick={() => onAddStage(t.name)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 rounded-full text-[11px] font-medium text-slate-500 transition-all pr-6"
                      >
                        + {t.name}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTemplate(t.id); }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/tag:opacity-100 p-0.5 hover:text-red-500 text-slate-300 transition-all"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
                </div>

                <div className="space-y-3">
                  {newProductStages.map((step, i) => (
                    <div key={i} className="group flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl hover:border-indigo-200 transition-all shadow-sm">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <span className="flex-1 font-bold text-sm text-slate-700">{step}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onMoveStage(i, 'up')} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 disabled:opacity-30" disabled={i === 0}><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => onMoveStage(i, 'down')} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 disabled:opacity-30" disabled={i === newProductStages.length - 1}><ChevronDown className="w-4 h-4" /></button>
                        <button onClick={() => onRemoveStage(i)} className="p-1.5 hover:bg-slate-50 rounded-lg text-red-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 p-2 border border-slate-100 border-dashed rounded-[24px] mt-4">
                    <input placeholder="新增流程节点名称..." value={stageInput} onChange={(e) => setStageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAddStage()} className="flex-1 bg-transparent px-4 py-2 text-xs outline-none" />
                    <button onClick={() => onAddStage()} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-100"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between">
            <button onClick={onClose} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">放弃更改</button>
            <button onClick={onSave} className="bg-indigo-600 text-white px-12 py-5 rounded-[28px] font-bold text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.95]">
              {isEditMode ? "保存修改" : "保存款式信息并应用流程"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
