import React, { useState, useMemo } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Image as ImageIcon, Search, Check, Trash2, ArrowRight, Settings2, Hash, Layers, Palette, ListFilter, CheckCircle2 } from "lucide-react";
import { ProductCustomField, YarnUsage } from "@/types";

interface CreateProductModalProps {
  isEditMode: boolean;
  newProduct: { 
    code: string; 
    name: string; 
    colors: string[];
    sizes: string[];
    yarnUsage: YarnUsage[];
    customFields: ProductCustomField[]; 
    image?: string 
  };
  setNewProduct: (p: any) => void;
  newProductFieldInput: { label: string; value: string };
  setNewProductFieldInput: (f: any) => void;
  newProductStages: string[];
  stageInput: string;
  setStageInput: (s: string) => void;
  colorDict: { id: string, name: string }[];
  sizeDict: { id: string, name: string }[];
  materialDict: { id: string, name: string, spec?: string, color?: string, unit?: string, type?: string }[];
  onAddDictItem: (type: string, name: string) => Promise<boolean>;
  onAddCustomField: () => void;
  onRemoveCustomField: (id: string) => void;
  onUpdateCustomField: (id: string, field: 'label' | 'value', val: string) => void;
  onAddStage: (name?: string) => void;
  onRemoveStage: (idx: number) => void;
  onMoveStage: (idx: number, dir: 'up' | 'down') => void;
  onSave: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  templates: { id: string, name: string }[];
  onDeleteTemplate: (id: string) => void;
}

const SelectionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  options, 
  selectedIds, 
  onConfirm,
  onAdd,
  placeholder = "搜索内容..."
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  options: {id: string, name: string, sub?: string, color?: string, type?: string}[], 
  selectedIds: string[], 
  onConfirm: (ids: string[]) => void,
  onAdd?: (name: string) => void,
  placeholder?: string
}) => {
  const [search, setSearch] = useState("");
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);
  const [activeType, setActiveType] = useState<string | 'all'>('all');

  React.useEffect(() => { 
    if (isOpen) {
      setTempSelectedIds(selectedIds);
      setSearch("");
      setActiveType('all');
    }
  }, [isOpen, selectedIds]);

  const allTypes = useMemo(() => {
    const types = new Set(options.map(o => o.type).filter(Boolean));
    return Array.from(types) as string[];
  }, [options]);

  const filtered = useMemo(() => {
    return options.filter(opt => {
      const matchSearch = opt.name.toLowerCase().includes(search.toLowerCase()) || 
        (opt.sub || '').toLowerCase().includes(search.toLowerCase()) ||
        (opt.color || '').toLowerCase().includes(search.toLowerCase());
      
      const matchType = activeType === 'all' || opt.type === activeType;
      
      return matchSearch && matchType;
    });
  }, [options, search, activeType]);

  const toggleItem = (id: string) => {
    setTempSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectedItems = useMemo(() => {
    const uniqueIds = Array.from(new Set(tempSelectedIds));
    return uniqueIds.map(id => options.find(o => o.id === id)).filter(Boolean);
  }, [tempSelectedIds, options]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl h-[700px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-baseline gap-3">
            <h4 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已选择 {tempSelectedIds.length} 项</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white rounded-xl transition-colors text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 flex-1 flex flex-col min-h-0 space-y-6">
          {/* 已选预览区 */}
          <div className="h-[60px] overflow-y-auto no-scrollbar p-2.5 bg-slate-50 border border-slate-100 rounded-2xl shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {selectedItems.length > 0 ? selectedItems.map(item => (
                <div key={item!.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold shadow-sm animate-in zoom-in-95">
                  <span className="truncate max-w-[100px]">{item!.name}</span>
                  <button onClick={() => toggleItem(item!.id)} className="hover:bg-indigo-50 rounded-full p-0.5 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[11px] text-slate-500 italic font-bold">暂未勾选任何记录...</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-900"
              />
            </div>
            {onAdd && search.trim() && !options.some(o => o.name === search.trim()) && (
              <button 
                onClick={() => { onAdd(search.trim()); setSearch(""); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" /> 新增 "{search}"
              </button>
            )}
          </div>

          {/* 类型筛选页签 */}
          {allTypes.length > 0 && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setActiveType('all')}
                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${activeType === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                全部
              </button>
              {allTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${activeType === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
            <div className="flex flex-col gap-2"> {/* 改为单列布局 */}
              {filtered.length > 0 ? (
                filtered.map(opt => {
                  const isSel = tempSelectedIds.includes(opt.id);
                  const isMaterial = opt.color !== undefined; // 简单判断是否为原料项
                  
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleItem(opt.id)}
                      className={`flex items-center justify-between px-6 py-4 rounded-xl border transition-all text-left group ${isSel ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-300 text-slate-900 hover:border-indigo-500 hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {isMaterial ? (
                          <>
                            {opt.type && (
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black mr-2 ${isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {opt.type}
                              </span>
                            )}
                            <span className={`shrink-0 font-black text-sm tracking-tight ${isSel ? 'text-indigo-100' : 'text-indigo-700'}`}>
                              【{opt.color || '无色'}】
                            </span>
                            <span className={`text-sm font-black truncate ${isSel ? 'text-white' : 'text-slate-900'}`}>{opt.name}</span>
                            {opt.sub && (
                              <span className={`ml-auto pl-4 text-xs shrink-0 font-black ${isSel ? 'text-white' : 'text-slate-700'}`}>
                                {opt.sub}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={`text-sm font-black truncate ${isSel ? 'text-white' : 'text-slate-900'}`}>{opt.name}</span>
                        )}
                      </div>
                      {isSel && <Check className="w-5 h-5 flex-shrink-0 ml-4 animate-in zoom-in" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400 mb-3 font-medium">未找到结果</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 pt-0 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">取消</button>
          <button 
            onClick={() => { onConfirm(tempSelectedIds); onClose(); }}
            className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            确认选择 ({tempSelectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export const CreateProductModal = ({
  isEditMode,
  newProduct,
  setNewProduct,
  newProductFieldInput,
  setNewProductFieldInput,
  newProductStages,
  stageInput,
  setStageInput,
  colorDict,
  sizeDict,
  materialDict,
  onAddDictItem,
  onAddCustomField,
  onRemoveCustomField,
  onUpdateCustomField,
  onAddStage,
  onRemoveStage,
  onMoveStage,
  onSave,
  onClose,
  isSubmitting,
  templates,
  onDeleteTemplate
}: CreateProductModalProps) => {
  const [activeColorForYarn, setActiveColorForYarn] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<'color' | 'size' | 'yarn' | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmColors = (ids: string[]) => {
    const vals = ids.map(id => colorDict.find(c => c.id === id)?.name || id);
    const nextYarn = newProduct.yarnUsage.filter(y => vals.includes(y.color));
    setNewProduct({ ...newProduct, colors: vals, yarnUsage: nextYarn });
    if (!vals.includes(activeColorForYarn || "")) setActiveColorForYarn(null);
  };

  const confirmSizes = (ids: string[]) => {
    const vals = ids.map(id => sizeDict.find(s => s.id === id)?.name || id);
    setNewProduct({ ...newProduct, sizes: vals });
  };

  const confirmYarnMaterials = (materialIds: string[]) => {
    if (!activeColorForYarn) return;
    
    const otherColorYarn = newProduct.yarnUsage.filter(y => y.color !== activeColorForYarn);
    const currentColorYarn = newProduct.yarnUsage.filter(y => y.color === activeColorForYarn);
    
    const nextCurrentColorYarn = materialIds.map(mId => {
      const mInfo = materialDict.find(m => m.id === mId);
      const mName = mInfo?.name || "未知原料";
      const existing = currentColorYarn.find(y => y.materialName === mName && y.specification === (mInfo?.spec || ""));
      if (existing) return existing;
      
      return {
        id: `yarn-${Date.now()}-${Math.random()}`,
        color: activeColorForYarn,
        materialName: mName,
        specification: mInfo?.spec || "",
        weight: "",
        unit: (mInfo?.unit === '千克' || mInfo?.unit === 'kg') ? '克' : (mInfo?.unit || "克"),
        materialColor: mInfo?.color || "",
        materialType: mInfo?.type || ""
      };
    });

    setNewProduct({ ...newProduct, yarnUsage: [...otherColorYarn, ...nextCurrentColorYarn] });
  };

  const updateYarnUsage = (id: string, field: keyof YarnUsage, value: string) => {
    setNewProduct({
      ...newProduct,
      yarnUsage: newProduct.yarnUsage.map(y => y.id === id ? { ...y, [field]: value } : y)
    });
  };

  const removeYarnUsage = (id: string) => {
    setNewProduct({
      ...newProduct,
      yarnUsage: newProduct.yarnUsage.filter(y => y.id !== id)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-[1300px] h-[95vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* 顶部标题栏 */}
        <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-indigo-600 rounded-full" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">款式规格配置</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左侧边栏：款式图与款号 */}
          <div className="w-[320px] bg-slate-50 border-r border-slate-100 p-10 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
            <div className="aspect-square rounded-[32px] border-4 border-white shadow-xl overflow-hidden relative group bg-slate-200 shrink-0">
              {newProduct.image ? (
                <img src={newProduct.image} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">款式图</p>
                </div>
              )}
              <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all gap-2 backdrop-blur-sm">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                <div className="bg-white px-6 py-3 rounded-2xl font-bold text-xs text-slate-900 shadow-sm">更换主图</div>
                {newProduct.image && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewProduct({ ...newProduct, image: "" }); }} className="bg-red-500 px-4 py-3 rounded-2xl font-bold text-xs text-white"><Trash2 className="w-4 h-4" /></button>
                )}
              </label>
            </div>
            
            <div className="mt-8 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mb-1.5 block">款号 *</label>
                <input value={newProduct.code} onChange={(e) => setNewProduct({...newProduct, code: e.target.value})} placeholder="输入款号" className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mb-1.5 block">品名 *</label>
                <input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="输入品名" className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm transition-all" />
              </div>
              <div className="pt-6 border-t border-slate-200">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">扩展自定义字段</label>
                <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                  {newProduct.customFields.map(field => (
                    <div key={field.id} className="bg-white rounded-xl flex items-center border border-slate-100 group/field relative h-11 shadow-sm overflow-hidden">
                      <input className="w-[80px] bg-slate-50 h-full px-3 text-xs font-bold text-slate-400 rounded-l-xl border-r border-slate-100 outline-none focus:bg-white transition-colors" value={field.label} onChange={(e) => onUpdateCustomField(field.id, 'label', e.target.value)} />
                      <input className="flex-1 px-4 text-sm font-bold text-slate-700 outline-none bg-transparent" value={field.value} onChange={(e) => onUpdateCustomField(field.id, 'value', e.target.value)} />
                      <button onClick={() => onRemoveCustomField(field.id)} className="absolute right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/field:opacity-100 transition-all shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <div className="flex items-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all overflow-hidden h-11 shrink-0">
                    <input 
                      placeholder="字段名" 
                      className="w-20 bg-transparent px-3 text-xs font-bold outline-none text-slate-500 placeholder:text-slate-300 shrink-0" 
                      value={newProductFieldInput.label} 
                      onChange={(e) => setNewProductFieldInput({...newProductFieldInput, label: e.target.value})} 
                    />
                    <div className="w-px h-4 bg-slate-200 shrink-0" />
                    <input 
                      placeholder="输入内容..." 
                      className="flex-1 bg-transparent px-3 text-xs font-medium outline-none text-slate-600 placeholder:text-slate-300 min-w-0" 
                      value={newProductFieldInput.value} 
                      onChange={(e) => setNewProductFieldInput({...newProductFieldInput, value: e.target.value})} 
                    />
                    <button 
                      onClick={onAddCustomField} 
                      className="bg-indigo-600 text-white h-full px-4 flex items-center justify-center hover:bg-indigo-700 active:bg-indigo-800 transition-all shrink-0"
                      title="点击添加"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧主工作区 */}
          <div className="flex-1 p-10 bg-white overflow-y-auto no-scrollbar space-y-10">
            
            {/* 1. 规格配置表 */}
            <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest">
                  <tr>
                    <th className="px-10 py-4 border-r border-slate-100 w-40 text-center">规格名</th>
                    <th className="px-10 py-4">已选规格值</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {/* 颜色行 */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6 bg-slate-50 font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 text-center text-xs">颜色</td>
                    <td className="px-10 py-6">
                      <div className="flex flex-wrap gap-3 items-center">
                        <button onClick={() => setSelectionType('color')} className="w-10 h-10 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center transition-all active:scale-95">
                          <ListFilter className="w-5 h-5" />
                        </button>
                        {newProduct.colors.map(c => (
                          <div key={c} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-bold shadow-sm group/tag">
                            <span className="text-sm">{c}</span>
                            <X className="w-4 h-4 cursor-pointer text-indigo-300 hover:text-red-500 transition-colors" onClick={() => confirmColors(newProduct.colors.filter(i => i !== c).map(name => colorDict.find(d => d.name === name)?.id || name))} />
                          </div>
                        ))}
                        {newProduct.colors.length === 0 && <span className="text-sm text-slate-300 italic font-medium">点击图标开启颜色选择器</span>}
                      </div>
                    </td>
                  </tr>
                  {/* 尺码行 */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6 bg-slate-50 font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 text-center text-xs">尺寸</td>
                    <td className="px-10 py-6">
                      <div className="flex flex-wrap gap-3 items-center">
                        <button onClick={() => setSelectionType('size')} className="w-10 h-10 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center transition-all active:scale-95">
                          <ListFilter className="w-5 h-5" />
                        </button>
                        {newProduct.sizes.map(s => (
                          <div key={s} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-bold shadow-sm group/tag">
                            <span className="text-sm">{s}</span>
                            <X className="w-4 h-4 cursor-pointer text-indigo-300 hover:text-red-500 transition-colors" onClick={() => confirmSizes(newProduct.sizes.filter(i => i !== s).map(name => sizeDict.find(d => d.name === name)?.id || name))} />
                          </div>
                        ))}
                        {newProduct.sizes.length === 0 && <span className="text-sm text-slate-300 italic font-medium">点击图标开启尺码选择器</span>}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. 用料配置表 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">分色纱线用料明细</h4>
              </div>
              
              <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest">
                    <tr>
                      <th className="px-10 py-4 border-r border-slate-100 w-40 text-center">对应颜色</th>
                      <th className="px-10 py-4">纱线配置与单件用量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newProduct.colors.length > 0 ? newProduct.colors.map(c => (
                      <tr key={c} className={`hover:bg-slate-50/20 transition-colors ${activeColorForYarn === c ? 'bg-indigo-50/20' : ''}`}>
                        <td className="px-10 py-6 border-r border-slate-100 font-bold text-slate-900 text-center relative text-sm">
                          {activeColorForYarn === c && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />}
                          {c}
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-wrap gap-4 items-center min-h-[48px]">
                            {newProduct.yarnUsage.filter(y => y.color === c).map((yarn) => (
                              <div key={yarn.id} className="flex items-center bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm pr-3">
                                <div className="flex flex-col px-3 border-r border-slate-100 mr-4 max-w-[180px]">
                                  <div className="flex items-center gap-2">
                                    {yarn.materialColor && (
                                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">
                                        {yarn.materialColor}
                                      </span>
                                    )}
                                    <span className="text-xs font-bold text-slate-900 truncate">{yarn.materialName}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-bold truncate tracking-tighter mt-0.5">
                                    {yarn.materialType && (
                                      <span className={`mr-1.5 px-1 py-0.5 rounded text-[8px] ${yarn.materialType === '辅料' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {yarn.materialType}
                                      </span>
                                    )}
                                    {yarn.specification || '默认规格'}
                                  </span>
                                </div>
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-2.5 h-8 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white transition-all">
                                  <input 
                                    value={yarn.weight}
                                    onChange={(e) => updateYarnUsage(yarn.id, 'weight', e.target.value)}
                                    placeholder="0" 
                                    className="w-10 text-center bg-transparent outline-none font-black text-indigo-600 text-sm" 
                                  />
                                  <span className="text-[10px] font-bold text-slate-400 ml-0.5 whitespace-nowrap">
                                    {yarn.unit === '千克' ? '克' : (yarn.unit || '克')}
                                  </span>
                                </div>
                              </div>
                            ))}
                            
                            <button 
                              onClick={() => { setActiveColorForYarn(c); setSelectionType('yarn'); }} 
                              className="h-12 px-5 flex items-center gap-3 bg-white border border-dashed border-indigo-200 text-indigo-600 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold text-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>添加物料</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={2} className="px-10 py-20 text-center text-slate-400 font-medium italic">请先在上方规格栏选取颜色，再为其配置具体的纱线用料</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. 开发流程节点配置 */}
            {!isEditMode && (
              <div className="pt-10 border-t border-slate-100">
                 <div className="flex items-center gap-3 mb-6 pl-1">
                  <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">开发流程节点配置</h4>
                </div>
                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                  <div className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
                    {templates.map(t => (
                      <div key={t.id} className="group relative">
                        <button 
                          onClick={() => onAddStage(t.name)} 
                          className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 shadow-sm transition-all active:scale-95"
                        >
                          {t.name}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(confirm(`确定要从系统常用节点中删除“${t.name}”吗？`)) onDeleteTemplate(t.id); }}
                          className="absolute -right-1.5 -top-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200/50">
                    {newProductStages.map((step, i) => (
                      <div key={i} className="group flex items-center gap-3 bg-white border border-slate-100 px-5 py-2.5 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black text-slate-300 tracking-tighter">{i + 1}</span>
                        <span className="text-xs font-bold text-slate-700">{step}</span>
                        <button onClick={() => onRemoveStage(i)} className="text-slate-200 hover:text-red-500 transition-colors ml-1"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <div className="flex gap-3 p-1.5 bg-white border border-dashed border-slate-200 rounded-2xl">
                      <input placeholder="新增自定义节点" value={stageInput} onChange={(e) => setStageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAddStage()} className="w-36 bg-transparent px-3 text-xs font-bold outline-none text-slate-600" />
                      <button onClick={() => onAddStage()} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部固定操作栏 */}
        <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <button onClick={onClose} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-colors">取消并退出录入</button>
          <div className="flex items-center gap-6">
            <button 
              onClick={onSave} 
              disabled={isSubmitting}
              className={`bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold text-base shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.96] flex items-center gap-4 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {isEditMode ? "保存款式资产" : "确认录入并开启样衣记录"}
            </button>
          </div>
        </div>

        {/* 弹窗组件保持一致的紧凑字体 */}
        <SelectionModal 
          isOpen={selectionType === 'color'}
          onClose={() => setSelectionType(null)}
          title="选取款式生产颜色"
          options={colorDict}
          selectedIds={Array.from(new Set(newProduct.colors.map(name => colorDict.find(d => d.name === name)?.id || name)))}
          onConfirm={confirmColors}
          onAdd={(name) => onAddDictItem('color', name)}
          placeholder="搜索颜色..."
        />
        <SelectionModal 
          isOpen={selectionType === 'size'}
          onClose={() => setSelectionType(null)}
          title="选取尺码范围"
          options={sizeDict}
          selectedIds={Array.from(new Set(newProduct.sizes.map(name => sizeDict.find(d => d.name === name)?.id || name)))}
          onConfirm={confirmSizes}
          onAdd={(name) => onAddDictItem('size', name)}
          placeholder="搜索尺码..."
        />
        <SelectionModal 
          isOpen={selectionType === 'yarn'}
          onClose={() => setSelectionType(null)}
          title={`为 [${activeColorForYarn}] 勾选纱线`}
          options={materialDict.map(m => ({ 
            id: m.id, 
            name: m.name, 
            sub: `${m.spec || "标准规格"} (${(m.unit === '千克' || m.unit === 'kg') ? '克' : (m.unit || "克")})`,
            color: m.color || "无色",
            type: m.type
          }))}
          selectedIds={Array.from(new Set(newProduct.yarnUsage.filter(y => y.color === activeColorForYarn).map(y => {
            const mInfo = materialDict.find(m => m.name === y.materialName && m.spec === y.specification);
            return mInfo?.id || y.materialName;
          })))}
          onConfirm={confirmYarnMaterials}
          onAdd={(name) => onAddDictItem('material', name)}
          placeholder="搜索原料、规格或色号..."
        />
      </div>
    </div>
  );
};
