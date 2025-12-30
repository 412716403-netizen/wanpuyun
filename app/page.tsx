"use client";

import React, { useState, useEffect } from "react";
import { GlobalNav } from "@/components/GlobalNav";
import { ProductSidebar } from "@/components/ProductSidebar";
import { MainContent } from "@/components/MainContent";
import { CreateProductModal } from "@/components/modals/CreateProductModal";
import { NodeInfoModal } from "@/components/modals/NodeInfoModal";
import { LogModal } from "@/components/modals/LogModal";
import { 
  getProducts, 
  createProduct, 
  toggleProductStatus, 
  toggleSyncStatus, 
  updateStageInfo,
  updateProduct,
  getStageTemplates,
  deleteStageTemplate,
  createSampleVersion,
  deleteSampleVersion,
  deleteProduct
} from "./actions";
import { 
  Product, 
  Stage, 
  ProductCustomField, 
  StageStatus 
} from "@/types";

export default function Dashboard() {
  // --- States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [activeSampleId, setActiveSampleId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"developing" | "archived">("developing");
  const [searchQuery, setSearchQuery] = useState("");

  // 初始化加载数据
  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, templatesData] = await Promise.all([
          getProducts(),
          getStageTemplates()
        ]);
        setProducts(productsData);
        setTemplates(templatesData);
        if (productsData.length > 0) {
          setSelectedProductId(productsData[0].id);
          setActiveSampleId(productsData[0].samples[0].id);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  // Modals visibility
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit/Register states
  const [editingStage, setEditingStage] = useState<{ productId: string, sampleId: string, stageId: string } | null>(null);
  const [tempFields, setTempFields] = useState<{ id: string, label: string, value: string }[]>([]);
  const [tempAttachments, setTempAttachments] = useState<{ id: string, fileName: string, fileUrl: string }[]>([]);
  const [tempStatus, setTempStatus] = useState<StageStatus>("pending");
  const [fieldInput, setFieldInput] = useState({ label: "", value: "" });
  const [filters, setFilters] = useState({ syncStatus: 'all', stageName: 'all' });

  // Create Product states
  const [newProduct, setNewProduct] = useState({ code: "", name: "", image: "", customFields: [] as ProductCustomField[] });
  const [newProductFieldInput, setNewProductFieldInput] = useState({ label: "", value: "" });
  const [newProductStages, setNewProductStages] = useState<string[]>([]);
  const [stageInput, setStageInput] = useState("");

  // --- Derived Data ---
  const selectedProduct = products.find((p: Product) => p.id === selectedProductId) || products[0] || null;
  const currentSample = selectedProduct?.samples?.find(s => s.id === activeSampleId) || selectedProduct?.samples?.[0] || null;
  const uniqueStageNames = Array.from(new Set(products.flatMap((p: Product) => p.samples?.flatMap(s => s.stages.map(st => st.name)) || [])));

  const filteredProducts = products.filter((p: Product) => {
    // 1. 状态 Tab 过滤
    if (p.status !== activeTab) return false;
    
    // 2. 搜索框过滤 (货号或名称)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = p.code.toLowerCase().includes(q);
      const matchName = p.name.toLowerCase().includes(q);
      if (!matchCode && !matchName) return false;
    }

    // 3. 高级筛选
    if (filters.syncStatus === 'synced' && !p.isSynced) return false;
    if (filters.syncStatus === 'unsynced' && p.isSynced) return false;
    if (filters.stageName !== 'all') {
      const hasStageInProgress = p.samples?.some(s => s.stages.some(st => st.name === filters.stageName && st.status === 'in_progress'));
      if (!hasStageInProgress) return false;
    }
    return true;
  });

  // 刷新数据
  const refreshData = async () => {
    try {
      const [productsData, templatesData] = await Promise.all([
        getProducts(),
        getStageTemplates()
      ]);
      setProducts(productsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  // --- Handlers ---
  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const product = products.find(p => p.id === id);
    if (product) setActiveSampleId(product.samples[0].id);
  };

  const handleCreateProduct = async () => {
    // 自动合并未点加号的自定义字段
    let finalCustomFields = [...newProduct.customFields];
    if (newProductFieldInput.label.trim()) {
      finalCustomFields.push({
        id: `cf-auto-${Date.now()}`,
        label: newProductFieldInput.label.trim(),
        value: newProductFieldInput.value.trim()
      });
    }

    if (isEditMode && selectedProductId) {
      await updateProduct(selectedProductId, {
        code: newProduct.code,
        name: newProduct.name,
        image: newProduct.image,
        customFields: finalCustomFields.map(f => ({ label: f.label, value: f.value }))
      });
      await refreshData();
    } else {
      const newId = await createProduct({
        code: newProduct.code,
        name: newProduct.name,
        image: newProduct.image,
        customFields: finalCustomFields.map(f => ({ label: f.label, value: f.value })),
        stages: newProductStages
      });
      await refreshData();
      handleSelectProduct(newId);
    }
    setIsCreateModalOpen(false);
    setIsEditMode(false);
    setNewProduct({ code: "", name: "", image: "", customFields: [] });
    setNewProductFieldInput({ label: "", value: "" }); // 重置输入框
    setNewProductStages([]);
  };

  const handleEditProduct = (p: Product) => {
    setNewProduct({ code: p.code, name: p.name, image: p.image || "", customFields: [...p.customFields] });
    setIsEditMode(true);
    setIsCreateModalOpen(true);
  };

  const handleSaveNodeInfo = async () => {
    if (!editingStage || !selectedProduct) return;
    const { sampleId, stageId } = editingStage;
    
    // 自动合并未点加号的工艺参数
    let finalFields = [...tempFields];
    if (fieldInput.label.trim()) {
      finalFields.push({
        id: `f-auto-${Date.now()}`,
        label: fieldInput.label.trim(),
        value: fieldInput.value.trim()
      });
    }

    await updateStageInfo({
      stageId,
      sampleId,
      status: tempStatus,
      fields: finalFields.map(f => ({ label: f.label, value: f.value, type: 'text' })),
      attachments: tempAttachments.map(a => ({ fileName: a.fileName, fileUrl: a.fileUrl })),
      userName: "Jun Zheng", // 实际应从 Auth 获取
      logDetail: `更新状态为: ${tempStatus}`
    });

    await refreshData();
    setFieldInput({ label: "", value: "" }); // 重置输入框
    setIsNodeModalOpen(false);
  };

  const handleAddSample = async () => {
    if (!selectedProduct) return;
    
    // 自动计算新轮次名称，如“二样”、“三样”
    const sampleNames = ["头样", "二样", "三样", "四样", "五样", "大货样"];
    const currentCount = selectedProduct.samples.length;
    const nextName = sampleNames[currentCount] || `${currentCount + 1}样`;

    const newSampleId = await createSampleVersion(selectedProduct.id, nextName);
    await refreshData();
    setActiveSampleId(newSampleId);
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (!selectedProduct) return;
    
    await deleteSampleVersion(sampleId);
    
    // 重新获取数据
    const data = await getProducts();
    setProducts(data);
    
    // 重新计算选中状态：如果删掉的是当前激活的，切换到第一个
    const currentProduct = data.find((p: Product) => p.id === selectedProductId);
    if (currentProduct && currentProduct.samples.length > 0) {
      if (activeSampleId === sampleId) {
        setActiveSampleId(currentProduct.samples[0].id);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    const data = await getProducts();
    setProducts(data);
    if (data.length > 0) {
      setSelectedProductId(data[0].id);
      setActiveSampleId(data[0].samples[0].id);
    } else {
      setSelectedProductId("");
      setActiveSampleId("");
    }
  };

  const handleCreateOpen = () => {
    setIsEditMode(false);
    
    // 获取最近一个产品的自定义字段标签
    const lastProduct = products[0]; // products 按 createdAt 倒序排列
    const initialCustomFields = lastProduct 
      ? lastProduct.customFields.map(cf => ({ id: `cf-${Date.now()}-${Math.random()}`, label: cf.label, value: "" }))
      : [];

    setNewProduct({ 
      code: "", 
      name: "", 
      image: "", 
      customFields: initialCustomFields 
    });
    setNewProductStages([]);
    setIsCreateModalOpen(true);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F3F4F6] text-slate-500">加载中...</div>;

  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
      <GlobalNav />
      
      <ProductSidebar 
        products={products}
        filteredProducts={filteredProducts}
        selectedProductId={selectedProductId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectProduct={handleSelectProduct}
        onCreateOpen={handleCreateOpen}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        filters={filters}
        setFilters={setFilters}
        uniqueStageNames={uniqueStageNames}
      />

      {selectedProduct ? (
        <MainContent 
          selectedProduct={selectedProduct}
          currentSample={currentSample}
          activeSampleId={activeSampleId}
          setActiveSampleId={setActiveSampleId}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleArchive={async (id) => {
            const p = products.find((product: Product) => product.id === id);
            if (p) {
              await toggleProductStatus(id, p.status);
              await refreshData();
            }
          }}
          onToggleSync={async (id) => {
            const p = products.find((product: Product) => product.id === id);
            if (p) {
              await toggleSyncStatus(id, p.isSynced);
              await refreshData();
            }
          }}
          onNodeRegister={(stage) => {
            if (!selectedProduct) return;
            setEditingStage({ productId: selectedProduct.id, sampleId: activeSampleId, stageId: stage.id });
            
            // 如果当前节点没有参数，尝试从其他产品的相同名称节点中获取默认参数名
            let initialFields = stage.fields.map((f: any) => ({ id: f.id, label: f.label, value: String(f.value) }));
            
            if (initialFields.length === 0) {
              // 遍历所有产品，寻找相同名称且有参数的节点
              for (const p of products) {
                const sameStageWithFields = p.samples
                  .flatMap(s => s.stages)
                  .find(st => st.name === stage.name && st.fields.length > 0);
                
                if (sameStageWithFields) {
                  initialFields = sameStageWithFields.fields.map(f => ({
                    id: `f-${Date.now()}-${Math.random()}`,
                    label: f.label,
                    value: ""
                  }));
                  break; // 找到最近的一个就停止
                }
              }
            }

            setTempFields(initialFields);
            setTempAttachments(stage.attachments || []);
            setTempStatus(stage.status);
            setIsNodeModalOpen(true);
          }}
          onLogOpen={() => setIsLogModalOpen(true)}
          onAddSample={handleAddSample}
          onDeleteSample={handleDeleteSample}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white m-6 rounded-[48px] shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">正在准备数据</h3>
          <p className="text-slate-400 text-sm">如果长时间没有反应，请检查数据库连接</p>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateProductModal 
          isEditMode={isEditMode}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          newProductFieldInput={newProductFieldInput}
          setNewProductFieldInput={setNewProductFieldInput}
          newProductStages={newProductStages}
          stageInput={stageInput}
          setStageInput={setStageInput}
          onAddCustomField={() => {
            if (newProductFieldInput.label.trim()) {
              setNewProduct({ ...newProduct, customFields: [...newProduct.customFields, { id: `cf-${Date.now()}`, label: newProductFieldInput.label.trim(), value: newProductFieldInput.value.trim() }] });
              setNewProductFieldInput({ label: "", value: "" });
            }
          }}
          onRemoveCustomField={(id) => setNewProduct({ ...newProduct, customFields: newProduct.customFields.filter(f => f.id !== id) })}
          onUpdateCustomField={(id, field, val) => setNewProduct({ ...newProduct, customFields: newProduct.customFields.map(f => f.id === id ? { ...f, [field]: val } : f) })}
          onAddStage={(name) => { 
            const stageName = typeof name === 'string' ? name : stageInput;
            if (stageName.trim()) { 
              setNewProductStages([...newProductStages, stageName.trim()]); 
              if (typeof name !== 'string') setStageInput(""); 
            } 
          }}
          onRemoveStage={(idx) => setNewProductStages(newProductStages.filter((_, i) => i !== idx))}
          onMoveStage={(idx, dir) => {
            const ns = [...newProductStages];
            if (dir === 'up' && idx > 0) [ns[idx], ns[idx-1]] = [ns[idx-1], ns[idx]];
            if (dir === 'down' && idx < ns.length-1) [ns[idx], ns[idx+1]] = [ns[idx+1], ns[idx]];
            setNewProductStages(ns);
          }}
          onSave={handleCreateProduct}
          onClose={() => setIsCreateModalOpen(false)}
          templates={templates}
          onDeleteTemplate={async (id) => {
            await deleteStageTemplate(id);
            const updated = await getStageTemplates();
            setTemplates(updated);
          }}
        />
      )}

      {isNodeModalOpen && (
        <NodeInfoModal 
          tempStatus={tempStatus}
          setTempStatus={setTempStatus}
          tempFields={tempFields}
          tempAttachments={tempAttachments}
          setTempAttachments={setTempAttachments}
          fieldInput={fieldInput}
          setFieldInput={setFieldInput}
          onAddTempField={() => {
            if (fieldInput.label.trim()) {
              setTempFields([...tempFields, { id: `f-${Date.now()}`, label: fieldInput.label.trim(), value: fieldInput.value.trim() }]);
              setFieldInput({ label: "", value: "" });
            }
          }}
          onRemoveTempField={(id) => setTempFields(tempFields.filter(f => f.id !== id))}
          onSave={handleSaveNodeInfo}
          onUpdateTempField={(id, val) => setTempFields(tempFields.map(f => f.id === id ? { ...f, value: val } : f))}
          onClose={() => setIsNodeModalOpen(false)}
        />
      )}

      {isLogModalOpen && (
        <LogModal 
          currentSample={currentSample}
          onClose={() => setIsLogModalOpen(false)}
        />
      )}
    </div>
  );
}
