"use client";

import React, { useState, useEffect } from "react";
import { ProductSidebar } from "@/components/ProductSidebar";
import { MainContent } from "@/components/MainContent";
import { CreateProductModal } from "@/components/modals/CreateProductModal";
import { NodeInfoModal } from "@/components/modals/NodeInfoModal";
import { LogModal } from "@/components/modals/LogModal";
import { ConnectModal } from "@/components/modals/ConnectModal";
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
  deleteProduct,
  getGoodsInitData,
  addDictItem,
  getConnectedInfo,
  externalLogin,
  disconnectExternal
} from "./actions";
import { 
  Product, 
  Stage, 
  ProductCustomField, 
  StageStatus,
  YarnUsage
} from "@/types";

export default function Dashboard() {
  // --- States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<{ id: string, name: string }[]>([]);
  const [colorDict, setColorDict] = useState<{ id: string, name: string }[]>([]);
  const [sizeDict, setSizeDict] = useState<{ id: string, name: string }[]>([]);
  const [materialDict, setMaterialDict] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [activeSampleId, setActiveSampleId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"developing" | "archived">("developing");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedInfo, setConnectedInfo] = useState({ isConnected: false, company: "" });

  // 初始化加载数据
  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, templatesData, connInfo] = await Promise.all([
          getProducts(),
          getStageTemplates(),
          getConnectedInfo()
        ]);
        setProducts(productsData);
        setTemplates(templatesData);
        setConnectedInfo(connInfo);
        
        if (productsData.length > 0) {
          setSelectedProductId(productsData[0].id);
          setActiveSampleId(productsData[0].samples[0].id);
        }

        setLoading(false);

        // 如果已连接，则加载初始化数据
        if (connInfo.isConnected) {
          const initData = await getGoodsInitData();
          if (initData) {
            setColorDict(initData.colors);
            setSizeDict(initData.sizes);
            setMaterialDict(initData.materials);
          }
        }

      } catch (error) {
        console.error("Failed to load data:", error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const refreshDicts = async () => {
    try {
      const data = await getGoodsInitData();
      if (data) {
        setColorDict(data.colors);
        setSizeDict(data.sizes);
        setMaterialDict(data.materials);
      }
    } catch (err) {
      console.error("Failed to load init data:", err);
    }
  };
  
  // Modals visibility
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
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
  const [newProduct, setNewProduct] = useState({ 
    code: "", 
    name: "", 
    image: "", 
    colors: [] as string[],
    sizes: [] as string[],
    yarnUsage: [] as YarnUsage[],
    customFields: [] as ProductCustomField[] 
  });
  const [newProductFieldInput, setNewProductFieldInput] = useState({ label: "", value: "" });
  const [newProductStages, setNewProductStages] = useState<string[]>([]);
  const [stageInput, setStageInput] = useState("");

  // --- Derived Data ---
  const selectedProduct = products.find((p: Product) => p.id === selectedProductId) || products[0] || null;
  const currentSample = selectedProduct?.samples?.find(s => s.id === activeSampleId) || selectedProduct?.samples?.[0] || null;
  const uniqueStageNames = Array.from(new Set(products.flatMap((p: Product) => p.samples?.flatMap(s => s.stages.map(st => st.name)) || [])));

  const filteredProducts = products.filter((p: Product) => {
    if (p.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = p.code.toLowerCase().includes(q);
      const matchName = p.name.toLowerCase().includes(q);
      if (!matchCode && !matchName) return false;
    }
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
      if (connectedInfo.isConnected) {
        refreshDicts();
      }
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

  const handleConnect = async (company: string, user: string, pass: string) => {
    const result = await externalLogin(company, user, pass);
    if (result.success) {
      const info = await getConnectedInfo();
      setConnectedInfo(info);
      refreshDicts();
    }
    return result;
  };

  const handleDisconnect = async () => {
    if (confirm("确定要断开与生产系统的连接吗？")) {
      await disconnectExternal();
      setConnectedInfo({ isConnected: false, company: "" });
      setColorDict([]);
      setSizeDict([]);
      setMaterialDict([]);
    }
  };

  const handleCreateProduct = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
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
          colors: newProduct.colors,
          sizes: newProduct.sizes,
          yarnUsage: newProduct.yarnUsage,
          image: newProduct.image,
          customFields: finalCustomFields.map(f => ({ label: f.label, value: f.value }))
        });
        await refreshData();
      } else {
        const newId = await createProduct({
          code: newProduct.code,
          name: newProduct.name,
          colors: newProduct.colors,
          sizes: newProduct.sizes,
          yarnUsage: newProduct.yarnUsage,
          image: newProduct.image,
          customFields: finalCustomFields.map(f => ({ label: f.label, value: f.value })),
          stages: newProductStages
        });
        await refreshData();
        handleSelectProduct(newId);
      }
      setIsCreateModalOpen(false);
      setIsEditMode(false);
      setNewProduct({ code: "", name: "", image: "", colors: [], sizes: [], yarnUsage: [], customFields: [] });
      setNewProductFieldInput({ label: "", value: "" }); 
      setNewProductStages([]);
    } catch (error) {
      console.error("Save failed:", error);
      alert("保存失败，原因可能是：\n1. 图片文件太大，超出了服务器限制\n2. 网络连接超时\n\n请尝试换一张较小的图片测试，或检查 Zeabur 日志。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (p: Product) => {
    setNewProduct({ 
      code: p.code, 
      name: p.name, 
      image: p.image || "", 
      colors: p.colors || [],
      sizes: p.sizes || [],
      yarnUsage: p.yarnUsage || [],
      customFields: [...p.customFields] 
    });
    setIsEditMode(true);
    setIsCreateModalOpen(true);
  };

  const handleSaveNodeInfo = async () => {
    if (!editingStage || !selectedProduct || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const { sampleId, stageId } = editingStage;
      const stage = currentSample?.stages.find(st => st.id === stageId);
      
      let finalFields = [...tempFields];
      if (fieldInput.label.trim()) {
        finalFields.push({
          id: `f-auto-${Date.now()}`,
          label: fieldInput.label.trim(),
          value: fieldInput.value.trim()
        });
      }

      const statusMap: Record<StageStatus, string> = {
        pending: "待开始",
        in_progress: "进行中",
        completed: "已完成",
        error: "异常/退回"
      };

      let logDetail = `节点: ${stage?.name || '未知'}\n`;
      if (stage?.status !== tempStatus) {
        logDetail += `[状态变更] ${statusMap[stage?.status as StageStatus || 'pending']} -> ${statusMap[tempStatus]}\n`;
      }

      const addedFields = finalFields.filter(tf => !stage?.fields.some(f => f.id === tf.id && f.value === tf.value));
      if (addedFields.length > 0) {
        logDetail += `[参数更新] 更新了 ${addedFields.length} 项工艺参数: ${addedFields.map(f => f.label).join(', ')}\n`;
      }

      const addedAtts = tempAttachments.filter(ta => !stage?.attachments?.some(a => a.id === ta.id));
      if (addedAtts.length > 0) {
        logDetail += `[附件上传] 新增了 ${addedAtts.length} 个附件: ${addedAtts.map(a => a.fileName).join(', ')}`;
      }

      if (logDetail === `节点: ${stage?.name || '未知'}\n`) {
        logDetail += "未做任何修改，仅保存。";
      }

      await updateStageInfo({
        stageId,
        sampleId,
        status: tempStatus,
        fields: finalFields.map(f => ({ label: f.label, value: f.value, type: 'text' })),
        attachments: tempAttachments.map(a => ({ fileName: a.fileName, fileUrl: a.fileUrl })),
        userName: "Jun Zheng",
        logDetail: logDetail.trim()
      });

      await refreshData();
      setFieldInput({ label: "", value: "" });
      setIsNodeModalOpen(false);
    } catch (error) {
      console.error("Save node info failed:", error);
      alert("保存失败，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSample = async () => {
    if (!selectedProduct || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const sampleNames = ["头样", "二样", "三样", "四样", "五样", "大货样"];
      const currentCount = selectedProduct.samples.length;
      const nextName = sampleNames[currentCount] || `${currentCount + 1}样`;
      const newSampleId = await createSampleVersion(selectedProduct.id, nextName);
      await refreshData();
      setActiveSampleId(newSampleId);
    } catch (error) {
      console.error("Add sample failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (!selectedProduct || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteSampleVersion(sampleId);
      const data = await getProducts();
      setProducts(data);
      const currentProduct = data.find((p: Product) => p.id === selectedProductId);
      if (currentProduct && currentProduct.samples.length > 0) {
        if (activeSampleId === sampleId) {
          setActiveSampleId(currentProduct.samples[0].id);
        }
      }
    } catch (error) {
      console.error("Delete sample failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
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
    } catch (error) {
      console.error("Delete product failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOpen = () => {
    setIsEditMode(false);
    const lastProduct = products[0];
    const initialCustomFields = lastProduct 
      ? lastProduct.customFields.map(cf => ({ id: `cf-${Date.now()}-${Math.random()}`, label: cf.label, value: "" }))
      : [];
    setNewProduct({ 
      code: "", 
      name: "", 
      image: "", 
      colors: [],
      sizes: [],
      yarnUsage: [],
      customFields: initialCustomFields 
    });
    setNewProductStages([]);
    setIsCreateModalOpen(true);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F3F4F6] text-slate-500">加载中...</div>;

  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
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
        connectedInfo={connectedInfo}
        onConnectOpen={() => setIsConnectModalOpen(true)}
        onDisconnect={handleDisconnect}
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
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
              const p = products.find((product: Product) => product.id === id);
              if (p) {
                await toggleProductStatus(id, p.status);
                await refreshData();
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
          onToggleSync={async (id) => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
              const p = products.find((product: Product) => product.id === id);
              if (p) {
                await toggleSyncStatus(id, p.isSynced);
                await refreshData();
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
          onNodeRegister={(stage) => {
            if (!selectedProduct) return;
            setEditingStage({ productId: selectedProduct.id, sampleId: activeSampleId, stageId: stage.id });
            let initialFields = stage.fields.map((f: any) => ({ id: f.id, label: f.label, value: String(f.value) }));
            if (initialFields.length === 0) {
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
                  break;
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
          colorDict={colorDict}
          sizeDict={sizeDict}
          materialDict={materialDict}
          onAddDictItem={async (type, name) => {
            const ok = await addDictItem(type, name);
            if (ok) {
              refreshDicts();
            }
            return ok;
          }}
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
          isSubmitting={isSubmitting}
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

      {isConnectModalOpen && (
        <ConnectModal 
          onClose={() => setIsConnectModalOpen(false)}
          onConnect={handleConnect}
        />
      )}
    </div>
  );
}
