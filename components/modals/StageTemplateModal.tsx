import React, { useState } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Trash2, Settings, Check } from "lucide-react";

interface StageTemplateField {
  id: string;
  label: string;
  required: boolean;
  order: number;
}

interface StageTemplate {
  id: string;
  name: string;
  order: number;
  fields: StageTemplateField[];
}

interface StageTemplateModalProps {
  templates: StageTemplate[];
  onClose: () => void;
  onCreateTemplate: (name: string) => Promise<{ success: boolean; message?: string }>;
  onUpdateTemplateName: (id: string, name: string) => Promise<{ success: boolean; message?: string }>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onMoveTemplate: (id: string, direction: 'up' | 'down') => Promise<void>;
  onAddField: (templateId: string, label: string, required: boolean) => Promise<void>;
  onUpdateField: (fieldId: string, label: string, required: boolean) => Promise<void>;
  onDeleteField: (fieldId: string) => Promise<void>;
  onMoveField: (fieldId: string, direction: 'up' | 'down') => Promise<void>;
}

export const StageTemplateModal = ({
  templates,
  onClose,
  onCreateTemplate,
  onUpdateTemplateName,
  onDeleteTemplate,
  onMoveTemplate,
  onAddField,
  onUpdateField,
  onDeleteField,
  onMoveField
}: StageTemplateModalProps) => {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    templates.length > 0 ? templates[0].id : null
  );
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldLabel, setEditingFieldLabel] = useState('');
  const [editingFieldRequired, setEditingFieldRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const result = await onCreateTemplate(newTemplateName.trim());
    if (result.success) {
      setNewTemplateName('');
    } else {
      alert(result.message || '创建失败');
    }
    setIsSubmitting(false);
  };

  const handleSaveTemplateName = async () => {
    if (!editingTemplateId || !editingTemplateName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const result = await onUpdateTemplateName(editingTemplateId, editingTemplateName.trim());
    if (result.success) {
      setEditingTemplateId(null);
    } else {
      alert(result.message || '更新失败');
    }
    setIsSubmitting(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('确定要删除该节点吗？删除后所有产品中该节点的配置将失效。')) return;
    setIsSubmitting(true);
    await onDeleteTemplate(id);
    if (selectedTemplateId === id) {
      setSelectedTemplateId(templates.filter(t => t.id !== id)[0]?.id || null);
    }
    setIsSubmitting(false);
  };

  const handleAddField = async () => {
    if (!selectedTemplateId || !newFieldLabel.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAddField(selectedTemplateId, newFieldLabel.trim(), newFieldRequired);
    setNewFieldLabel('');
    setNewFieldRequired(false);
    setIsSubmitting(false);
  };

  const handleSaveField = async () => {
    if (!editingFieldId || !editingFieldLabel.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onUpdateField(editingFieldId, editingFieldLabel.trim(), editingFieldRequired);
    setEditingFieldId(null);
    setIsSubmitting(false);
  };

  const startEditField = (field: StageTemplateField) => {
    setEditingFieldId(field.id);
    setEditingFieldLabel(field.label);
    setEditingFieldRequired(field.required);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        <div className="p-12 overflow-y-auto no-scrollbar flex-1">
          <div className="flex justify-between items-center mb-10">
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-2">开发流程配置</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">节点管理</h3>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* 左侧：节点列表 */}
            <div>
              <label className="text-xs font-bold text-slate-900 mb-4 block">节点列表</label>
              <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto no-scrollbar">
                {templates.map((template, index) => (
                  <div
                    key={template.id}
                    className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer group ${
                      selectedTemplateId === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    {/* 上下移动按钮 */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveTemplate(template.id, 'up'); }}
                        disabled={index === 0}
                        className={`p-0.5 rounded transition-colors ${
                          index === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveTemplate(template.id, 'down'); }}
                        disabled={index === templates.length - 1}
                        className={`p-0.5 rounded transition-colors ${
                          index === templates.length - 1 ? 'text-slate-200' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 节点名称 */}
                    <div className="flex-1 min-w-0">
                      {editingTemplateId === template.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editingTemplateName}
                            onChange={(e) => setEditingTemplateName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplateName()}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-2 py-1 text-sm font-bold rounded-lg border border-indigo-300 outline-none"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveTemplateName(); }}
                            className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTemplateId(null); }}
                            className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 truncate">{template.name}</span>
                          <span className="text-[10px] text-slate-400">({template.fields.length}个参数)</span>
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    {editingTemplateId !== template.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplateId(template.id);
                            setEditingTemplateName(template.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 添加新节点 */}
              <div className="flex gap-2 p-2 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
                <input
                  placeholder="输入新节点名称"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTemplate()}
                  className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
                />
                <button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplateName.trim() || isSubmitting}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 右侧：参数配置 */}
            <div>
              <label className="text-xs font-bold text-slate-900 mb-4 block">
                {selectedTemplate ? `"${selectedTemplate.name}" 的参数配置` : '选择节点以配置参数'}
              </label>
              
              {selectedTemplate ? (
                <>
                  <div className="space-y-2 mb-4 max-h-[340px] overflow-y-auto no-scrollbar">
                    {selectedTemplate.fields.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        暂无参数，请在下方添加
                      </div>
                    ) : (
                      selectedTemplate.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 group hover:border-slate-200 transition-all"
                        >
                          {/* 上下移动按钮 */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => onMoveField(field.id, 'up')}
                              disabled={index === 0}
                              className={`p-0.5 rounded transition-colors ${
                                index === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                              }`}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onMoveField(field.id, 'down')}
                              disabled={index === selectedTemplate.fields.length - 1}
                              className={`p-0.5 rounded transition-colors ${
                                index === selectedTemplate.fields.length - 1 ? 'text-slate-200' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                              }`}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* 参数内容 */}
                          <div className="flex-1 min-w-0">
                            {editingFieldId === field.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  value={editingFieldLabel}
                                  onChange={(e) => setEditingFieldLabel(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveField()}
                                  className="flex-1 px-2 py-1 text-sm rounded-lg border border-indigo-300 outline-none"
                                />
                                <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={editingFieldRequired}
                                    onChange={(e) => setEditingFieldRequired(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded"
                                  />
                                  必填
                                </label>
                                <button
                                  onClick={handleSaveField}
                                  className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingFieldId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                {field.required && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded-md font-bold">必填</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          {editingFieldId !== field.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditField(field)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteField(field.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* 添加新参数 */}
                  <div className="flex gap-2 p-2 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
                    <input
                      placeholder="参数名称"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                      className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
                    />
                    <label className="flex items-center gap-1.5 px-3 text-[11px] text-slate-500 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="w-3.5 h-3.5 rounded"
                      />
                      必填
                    </label>
                    <button
                      onClick={handleAddField}
                      disabled={!newFieldLabel.trim() || isSubmitting}
                      className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-slate-50 rounded-3xl text-slate-400 text-sm">
                  请先在左侧选择或创建节点
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-12 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-bold text-sm shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            完成配置
          </button>
        </div>
      </div>
    </div>
  );
};
