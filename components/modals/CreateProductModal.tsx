import React, { useState, useMemo } from 'react';
import { X, Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Image as ImageIcon, Search, Check, Trash2, ArrowRight, Settings2, Hash, Layers, Palette, ListFilter, CheckCircle2, Users } from "lucide-react";
import { ProductCustomField, YarnUsage } from "@/types";
import { SafeImage } from "@/components/SafeImage";

interface CreateProductModalProps {
  isEditMode: boolean;
  newProduct: { 
    code: string; 
    name: string; 
    customerName?: string;
    colors: string[];
    sizes: string[];
    yarnUsage: YarnUsage[];
    customFields: ProductCustomField[]; 
    image?: string;
    thumbnail?: string;
  };
  setNewProduct: (p: any) => void;
  newProductStages: string[];
  stageInput: string;
  setStageInput: (s: string) => void;
  colorDict: { id: string, name: string }[];
  sizeDict: { id: string, name: string }[];
  materialDict: { id: string, name: string, spec?: string, color?: string, unit?: string, type?: string }[];
  unitDict?: { id: string, name: string }[];
  customerDict?: { id: string, name: string, sn?: string, address?: string }[];
  dictLoading?: { colors: boolean, sizes: boolean, materials: boolean, units: boolean, customers: boolean };
  onFetchColors?: () => void;
  onFetchSizes?: () => void;
  onFetchMaterials?: () => void;
  onFetchUnits?: () => void;
  onFetchCustomers?: () => void;
  onAddMaterial?: (m: { type: '1'|'2', name: string, color: string, spec: string, unit_id?: string }) => Promise<{ success: boolean, message: string }>;
  onAddDictItem: (type: string, name: string) => Promise<boolean>;
  onApplyCustomFieldLabels: (labels: string[]) => void;
  onUpdateCustomFieldValue: (id: string, value: string) => void;
  onAddStage: (name?: string) => void;
  onRemoveStage: (idx: number) => void;
  onMoveStage: (idx: number, dir: 'up' | 'down') => void;
  onSave: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  templates: { id: string, name: string }[];
  onDeleteTemplate: (id: string) => void;
  onUpdateTemplateOrder?: (items: { id: string, order: number }[]) => Promise<void>;
}

const SelectionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  options, 
  selectedIds, 
  onConfirm,
  onAdd,
  onAddMaterial,
  unitDict,
  onFetchUnits,
  placeholder = "搜索内容...",
  isLoading = false,
  showPermissionWarning = false
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  options: {id: string, name: string, sub?: string, color?: string, type?: string}[], 
  selectedIds: string[], 
  onConfirm: (ids: string[]) => void,
  onAdd?: (name: string) => void,
  onAddMaterial?: (m: { type: '1'|'2', name: string, color: string, spec: string, unit_id?: string }) => Promise<{ success: boolean, message: string }>,
  unitDict?: { id: string, name: string }[],
  onFetchUnits?: () => void,
  placeholder?: string,
  isLoading?: boolean,
  showPermissionWarning?: boolean
}) => {
  const [search, setSearch] = useState("");
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);
  const [activeType, setActiveType] = useState<string | 'all'>('all');
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ 
    type: '1' as '1'|'2', 
    name: '', 
    color: '', 
    spec: '', 
    unit_id: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => { 
    if (isOpen) {
      setTempSelectedIds(selectedIds);
      setSearch("");
      setActiveType('all');
      setIsAddingMaterial(false);
    }
  }, [isOpen, selectedIds]);

  React.useEffect(() => {
    if (isAddingMaterial && onFetchUnits) {
      onFetchUnits();
    }
  }, [isAddingMaterial, onFetchUnits]);

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

  const handleAddMaterialSubmit = async () => {
    if (!newMaterial.name) {
      alert("请输入原料名称");
      return;
    }

    if (onAddMaterial) {
      setIsSubmitting(true);
      const res = await onAddMaterial(newMaterial);
      setIsSubmitting(false);
      if (res.success) {
        setIsAddingMaterial(false);
        setNewMaterial({ type: '1', name: '', color: '', spec: '', unit_id: '' });
      } else {
        alert(res.message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl h-[700px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* 新增物料表单层 (覆盖层) */}
        {isAddingMaterial && (
          <div className="absolute inset-0 z-[210] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h4 className="text-xl font-black text-slate-900">新增生产原料</h4>
              <button onClick={() => setIsAddingMaterial(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto space-y-8 no-scrollbar">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">原料类型 *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setNewMaterial({...newMaterial, type: '1'})}
                    className={`py-4 rounded-2xl font-black text-sm border-2 transition-all ${newMaterial.type === '1' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                  >
                    毛料 (Yarn)
                  </button>
                  <button 
                    onClick={() => setNewMaterial({...newMaterial, type: '2'})}
                    className={`py-4 rounded-2xl font-black text-sm border-2 transition-all ${newMaterial.type === '2' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                  >
                    辅料 (Accessory)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{newMaterial.type === '1' ? '原料名称' : '辅料名称'} *</label>
                  <input 
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                    placeholder="输入名称"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{newMaterial.type === '1' ? '原料颜色' : '辅料颜色'}</label>
                  <input 
                    value={newMaterial.color}
                    onChange={(e) => setNewMaterial({...newMaterial, color: e.target.value})}
                    placeholder="输入色号/颜色 (可选)"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{newMaterial.type === '1' ? '原料支数' : '辅料规格'}</label>
                  <input 
                    value={newMaterial.spec}
                    onChange={(e) => setNewMaterial({...newMaterial, spec: e.target.value})}
                    placeholder={newMaterial.type === '1' ? '例: 2/48 (可选)' : '例: 20cm (可选)'}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                {newMaterial.type === '2' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">计量单位</label>
                    <select 
                      value={newMaterial.unit_id}
                      onChange={(e) => setNewMaterial({...newMaterial, unit_id: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                    >
                      <option value="">请选择单位 (可选)</option>
                      {unitDict?.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 flex gap-4 shrink-0">
              <button onClick={() => setIsAddingMaterial(false)} className="flex-1 py-4 text-sm font-bold text-slate-400">返回列表</button>
              <button 
                onClick={handleAddMaterialSubmit}
                disabled={isSubmitting}
                className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                提交到生产系统
              </button>
            </div>
          </div>
        )}

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
                  <span className="truncate max-w-[160px]">
                    {item!.color && <span className="opacity-70">【{item!.color}】</span>}
                    {item!.name}
                  </span>
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
            {onAddMaterial ? (
              <button 
                onClick={() => setIsAddingMaterial(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" /> 新增物料
              </button>
            ) : onAdd && search.trim() && !options.some(o => o.name === search.trim()) && (
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
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 animate-pulse">正在从生产系统同步实时数据...</p>
              </div>
            ) : (
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
                ) : showPermissionWarning && options.length === 0 ? (
                  <div className="py-12 px-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-2">暂无数据</p>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      您的万濮云账号可能没有开放字典管理权限，请登录万濮云后台，在权限设置中开启商品管理和字典管理等相关权限后重试。
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm text-slate-400 mb-3 font-medium">未找到结果</p>
                  </div>
                )}
              </div>
            )}
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

const CustomerSearchSelect = ({ 
  value, 
  onChange, 
  customerDict, 
  onFetch, 
  isLoading 
}: { 
  value: string, 
  onChange: (name: string) => void, 
  customerDict: { id: string, name: string, sn?: string, address?: string }[], 
  onFetch?: () => void, 
  isLoading: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && onFetch) onFetch();
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customerDict;
    const q = search.toLowerCase();
    return customerDict.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.sn || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }, [customerDict, search]);

  return (
    <div className="relative">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mb-1.5 flex items-center gap-1.5">
        <Users className="w-3 h-3" /> 客户
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold cursor-pointer shadow-sm transition-all flex items-center justify-between ${isOpen ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200'}`}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || '选择客户（可选）'}</span>
        <div className="flex items-center gap-1.5">
          {value && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(""); }} 
              className="p-0.5 hover:bg-slate-100 rounded-md transition-colors text-slate-300 hover:text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[50] top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索客户名称..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-300 transition-all"
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-2" />
                <p className="text-[10px] font-bold text-slate-400 animate-pulse">正在从万濮云同步客户...</p>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onChange(c.name); setIsOpen(false); setSearch(""); }}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-indigo-50 transition-colors ${value === c.name ? 'bg-indigo-50' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-black text-slate-300 shrink-0">{c.sn}</span>
                    <span className="text-xs font-bold text-slate-900 truncate">{c.name}</span>
                    {c.address && <span className="text-[10px] text-slate-400 truncate">{c.address}</span>}
                  </div>
                  {value === c.name && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              ))
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-400 font-medium">{customerDict.length === 0 ? '暂无客户数据' : '未找到匹配的客户'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-[40]" onClick={() => { setIsOpen(false); setSearch(""); }} />}
    </div>
  );
};

const CustomFieldsSettingsModal = ({
  isOpen,
  onClose,
  fieldLabels,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  fieldLabels: string[];
  onConfirm: (labels: string[]) => void;
}) => {
  const [rows, setRows] = useState<string[]>([]);
  const seedKey = fieldLabels.join("\u0001");

  React.useEffect(() => {
    if (!isOpen) return;
    setRows(fieldLabels.length > 0 ? [...fieldLabels] : [""]);
  }, [isOpen, seedKey]);

  const handleConfirm = () => {
    const labels: string[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const t = row.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      labels.push(t);
    }
    onConfirm(labels);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <Settings2 className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight truncate">设置扩展字段</h4>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-6 pt-4 text-xs text-slate-500 font-medium leading-relaxed">
          在此添加或删除字段名称；主界面仅填写各字段的内容。已保存的款式会同步更新本地字段模板，下次新建时自动带出。
        </p>
        <div className="p-6 space-y-3 max-h-[min(52vh,280px)] overflow-y-auto no-scrollbar">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={row}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = e.target.value;
                  setRows(next);
                }}
                placeholder="字段名称，如：针型"
                className="flex-1 min-w-0 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                aria-label="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 pt-0 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setRows([...rows, ""])}
            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加字段
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CreateProductModal = ({
  isEditMode,
  newProduct,
  setNewProduct,
  newProductStages,
  stageInput,
  setStageInput,
  colorDict,
  sizeDict,
  materialDict,
  unitDict,
  customerDict,
  dictLoading,
  onFetchColors,
  onFetchSizes,
  onFetchMaterials,
  onFetchUnits,
  onFetchCustomers,
  onAddMaterial,
  onAddDictItem,
  onApplyCustomFieldLabels,
  onUpdateCustomFieldValue,
  onAddStage,
  onRemoveStage,
  onMoveStage,
  onSave,
  onClose,
  isSubmitting,
  templates,
  onDeleteTemplate,
  onUpdateTemplateOrder
}: CreateProductModalProps) => {
  const [activeColorForYarn, setActiveColorForYarn] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<'color' | 'size' | 'yarn' | null>(null);
  const [draggedTemplateId, setDraggedTemplateId] = useState<string | null>(null);
  const [customFieldsSettingsOpen, setCustomFieldsSettingsOpen] = useState(false);

  // 当选择器打开时，按需加载对应的字典数据
  React.useEffect(() => {
    if (selectionType === 'color' && onFetchColors) onFetchColors();
    if (selectionType === 'size' && onFetchSizes) onFetchSizes();
    if (selectionType === 'yarn' && onFetchMaterials) onFetchMaterials();
  }, [selectionType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // 1. 生成高清压缩图 (用于详情显示，最大 1000px，质量 0.6)
          const canvasLarge = document.createElement('canvas');
          let wL = img.width;
          let hL = img.height;
          const MAX_L = 1000;
          if (wL > hL) { if (wL > MAX_L) { hL *= MAX_L / wL; wL = MAX_L; } }
          else { if (hL > MAX_L) { wL *= MAX_L / hL; hL = MAX_L; } }
          canvasLarge.width = wL;
          canvasLarge.height = hL;
          canvasLarge.getContext('2d')?.drawImage(img, 0, 0, wL, hL);
          const compressedLarge = canvasLarge.toDataURL('image/jpeg', 0.6);

          // 2. 生成缩略图 (用于侧边栏，最大 160px，质量 0.5)
          const canvasThumb = document.createElement('canvas');
          let wT = img.width;
          let hT = img.height;
          const MAX_T = 160;
          if (wT > hT) { if (wT > MAX_T) { hT *= MAX_T / wT; wT = MAX_T; } }
          else { if (hT > MAX_T) { wT *= MAX_T / hT; hT = MAX_T; } }
          canvasThumb.width = wT;
          canvasThumb.height = hT;
          canvasThumb.getContext('2d')?.drawImage(img, 0, 0, wT, hT);
          const compressedThumb = canvasThumb.toDataURL('image/jpeg', 0.5);

          setNewProduct({ 
            ...newProduct, 
            image: compressedLarge, 
            thumbnail: compressedThumb 
          });
        };
        img.src = reader.result as string;
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
      // 匹配时需要同时考虑名称、规格和原料颜色，以区分同名但不同色的物料
      const existing = currentColorYarn.find(y => 
        y.materialName === mName && 
        y.specification === (mInfo?.spec || "") && 
        y.materialColor === (mInfo?.color || "")
      );
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
                <SafeImage src={newProduct.image} className="w-full h-full object-cover" fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">款式图</p>
                  </div>
                } />
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
              <CustomerSearchSelect
                value={newProduct.customerName || ""}
                onChange={(name) => setNewProduct({...newProduct, customerName: name})}
                customerDict={customerDict || []}
                onFetch={onFetchCustomers}
                isLoading={dictLoading?.customers || false}
              />
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">扩展自定义字段</label>
                  <button
                    type="button"
                    onClick={() => setCustomFieldsSettingsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors shrink-0"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    设置
                  </button>
                </div>
                {newProduct.customFields.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium leading-relaxed py-2">
                    暂无扩展字段。点击「设置」添加字段名称，再在下方填写内容。
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto no-scrollbar">
                    {newProduct.customFields.map((field) => (
                      <div
                        key={field.id}
                        className="bg-white rounded-xl flex items-stretch border border-slate-100 shadow-sm overflow-hidden min-h-11"
                      >
                        <span
                          className="w-[88px] shrink-0 bg-slate-50 px-3 py-2.5 text-[11px] font-black text-slate-500 border-r border-slate-100 flex items-center leading-tight"
                          title={field.label}
                        >
                          {field.label}
                        </span>
                        <input
                          className="flex-1 min-w-0 px-3 py-2.5 text-sm font-bold text-slate-700 outline-none bg-transparent placeholder:text-slate-300"
                          value={field.value}
                          onChange={(e) => onUpdateCustomFieldValue(field.id, e.target.value)}
                          placeholder="填写内容"
                        />
                      </div>
                    ))}
                  </div>
                )}
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
                      <th className="px-10 py-4">纱线配置</th>
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
                              <div key={yarn.id} className="flex items-center bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm">
                                <div className="flex flex-col max-w-[220px]">
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
                    {templates.map((t) => (
                      <button 
                        key={t.id}
                        onClick={() => onAddStage(t.name)} 
                        className="px-3 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 shadow-sm transition-all active:scale-95"
                      >
                        {t.name}
                      </button>
                    ))}
                    {templates.length === 0 && (
                      <div className="col-span-full text-xs text-slate-400 py-4 text-center">
                        暂无节点配置，请先在"节点管理"中添加
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200/50">
                    {newProductStages.map((step, i) => (
                      <div key={i} className="group/tag relative flex items-center gap-3 bg-white border border-slate-100 px-5 py-2.5 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black text-slate-300 tracking-tighter">{i + 1}</span>
                        <span className="text-xs font-bold text-slate-700">{step}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onRemoveStage(i); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/tag:opacity-100 shadow-md hover:bg-red-600 transition-opacity"
                          title="删除节点"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {newProductStages.length === 0 && (
                      <div className="text-xs text-slate-400 py-2">
                        请点击上方节点选择开发流程
                      </div>
                    )}
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
          isLoading={dictLoading?.colors}
          showPermissionWarning
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
          isLoading={dictLoading?.sizes}
          showPermissionWarning
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
            // 匹配时需要同时考虑名称、规格和原料颜色，以区分同名但不同色的物料
            const mInfo = materialDict.find(m => 
              m.name === y.materialName && 
              m.spec === (y.specification || "") && 
              m.color === (y.materialColor || "")
            );
            return mInfo?.id || y.materialName;
          })))}
          onConfirm={confirmYarnMaterials}
          onAddMaterial={onAddMaterial}
          unitDict={unitDict}
          onFetchUnits={onFetchUnits}
          placeholder="搜索原料、规格 or 色号..."
          isLoading={dictLoading?.materials}
        />
        <CustomFieldsSettingsModal
          isOpen={customFieldsSettingsOpen}
          onClose={() => setCustomFieldsSettingsOpen(false)}
          fieldLabels={newProduct.customFields.map((f) => f.label)}
          onConfirm={onApplyCustomFieldLabels}
        />
      </div>
    </div>
  );
};
