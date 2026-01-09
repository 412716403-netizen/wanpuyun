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
  getProductDetail,
  createProduct, 
  toggleProductStatus, 
  toggleSyncStatus, 
  updateStageInfo,
  updateProduct,
  getStageTemplates,
  deleteStageTemplate,
  updateStageTemplateOrder,
  createSampleVersion,
  deleteSampleVersion,
  deleteProduct,
  getExternalColors,
  getExternalSizes,
  getExternalMaterials,
  syncProductToExternal,
  addDictItem,
  getConnectedInfo,
  externalLogin,
  disconnectExternal,
  getExternalUnits,
  addMaterial
} from "./actions";
import { Plus, Link as LinkIcon, ShieldCheck } from "lucide-react";
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
  const [materialDict, setMaterialDict] = useState<{ id: string, name: string, spec?: string, color?: string, unit?: string, type?: string }[]>([]);
  const [unitDict, setUnitDict] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dictLoading, setDictLoading] = useState({ colors: false, sizes: false, materials: false, units: false });
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [activeSampleId, setActiveSampleId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"developing" | "archived">("developing");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedInfo, setConnectedInfo] = useState({ isConnected: false, company: "", userName: "" });

  // 初始化加载数据
  useEffect(() => {
    async function loadData() {
      console.log("[Dashboard] 开始并行加载基础数据...");
      const startTime = Date.now();
      
      try {
        // 1. 优先加载产品列表和基础配置
        const [productsData, templatesData, connInfo] = await Promise.all([
          getProducts(),
          getStageTemplates(),
          getConnectedInfo()
        ]);
        
        console.log(`[Dashboard] 基础数据加载完成, 耗时=${Date.now() - startTime}ms`);
        
        setProducts(productsData);
        setTemplates(templatesData);
        setConnectedInfo(connInfo);
        
        if (productsData.length > 0) {
          const firstProduct = productsData[0];
          setSelectedProductId(firstProduct.id);
          if (firstProduct.samples && firstProduct.samples.length > 0) {
            setActiveSampleId(firstProduct.samples[0].id);
          }
          
          // 首页加载后，静默拉取第一个产品的详情（包含附件）
          getProductDetail(firstProduct.id).then(fullProduct => {
            if (fullProduct) {
              setProducts(prev => prev.map(p => p.id === firstProduct.id ? fullProduct : p));
            }
          });
        }

        // 核心数据加载完就关闭全屏加载状态
        setLoading(false);

      } catch (error) {
        console.error("[Dashboard] 数据加载发生严重错误:", error);
        setLoading(false); // 即使报错也要关闭加载状态，避免死锁
      }
    }
    loadData();
  }, []);

  const loadColors = async () => {
    if (!connectedInfo.isConnected || colorDict.length > 0 || dictLoading.colors) return;
    setDictLoading(prev => ({ ...prev, colors: true }));
    try {
      const data = await getExternalColors();
      setColorDict(data);
    } finally {
      setDictLoading(prev => ({ ...prev, colors: false }));
    }
  };

  const loadSizes = async () => {
    if (!connectedInfo.isConnected || sizeDict.length > 0 || dictLoading.sizes) return;
    setDictLoading(prev => ({ ...prev, sizes: true }));
    try {
      const data = await getExternalSizes();
      setSizeDict(data);
    } finally {
      setDictLoading(prev => ({ ...prev, sizes: false }));
    }
  };

  const loadMaterials = async () => {
    if (!connectedInfo.isConnected || materialDict.length > 0 || dictLoading.materials) return;
    setDictLoading(prev => ({ ...prev, materials: true }));
    try {
      const data = await getExternalMaterials();
      setMaterialDict(data);
    } finally {
      setDictLoading(prev => ({ ...prev, materials: false }));
    }
  };

  const loadUnits = async () => {
    if (!connectedInfo.isConnected || unitDict.length > 0 || dictLoading.units) return;
    setDictLoading(prev => ({ ...prev, units: true }));
    try {
      const data = await getExternalUnits();
      setUnitDict(data);
    } finally {
      setDictLoading(prev => ({ ...prev, units: false }));
    }
  };

  const refreshDicts = async () => {
    // 强制刷新所有字典
    setDictLoading({ colors: true, sizes: true, materials: true, units: true });
    try {
      const [c, s, m, u] = await Promise.all([
        getExternalColors(), 
        getExternalSizes(), 
        getExternalMaterials(),
        getExternalUnits()
      ]);
      setColorDict(c);
      setSizeDict(s);
      setMaterialDict(m);
      setUnitDict(u);
    } finally {
      setDictLoading({ colors: false, sizes: false, materials: false, units: false });
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
    thumbnail: "",
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
      
      // 如果当前有选中的产品，刷新它的详情
      if (selectedProductId) {
        const fullProduct = await getProductDetail(selectedProductId);
        if (fullProduct) {
          setProducts(prev => prev.map(p => p.id === selectedProductId ? fullProduct : p));
        }
      }

      if (connectedInfo.isConnected) {
        refreshDicts();
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  // --- Handlers ---
  const handleSelectProduct = async (id: string) => {
    setSelectedProductId(id);
    const product = products.find(p => p.id === id);
    if (product) {
      setActiveSampleId(product.samples[0].id);
      
      // 检查是否已经加载了完整详情（简单通过标记或判断是否有附件数据）
      const hasFullData = product.samples.some(s => s.stages.some(st => st.attachments.some(a => a.fileUrl)));
      if (!hasFullData) {
        setDetailLoading(true);
        try {
          const fullProduct = await getProductDetail(id);
          if (fullProduct) {
            setProducts(prev => prev.map(p => p.id === id ? fullProduct : p));
          }
        } finally {
          setDetailLoading(false);
        }
      }
    }
  };

  const handleConnect = async (company: string, user: string, pass: string) => {
    const result = await externalLogin(company, user, pass);
    if (result.success) {
      window.location.reload();
    }
    return result;
  };

  const handleDisconnect = async () => {
    if (confirm("确定要断开与生产系统的连接吗？")) {
      await disconnectExternal();
      setConnectedInfo({ isConnected: false, company: "", userName: "" });
      setColorDict([]);
      setSizeDict([]);
      setMaterialDict([]);
      setUnitDict([]);
    }
  };

  const handleCreateProduct = async () => {
    if (isSubmitting) return;

    // 基础校验
    if (!newProduct.code.trim()) return alert("请输入款号");
    if (!newProduct.name.trim()) return alert("请输入品名");
    if (newProduct.colors.length === 0) return alert("请至少选择一个颜色");
    if (newProduct.sizes.length === 0) return alert("请至少选择一个尺码");

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
        const res = await updateProduct(selectedProductId, {
          code: newProduct.code,
          name: newProduct.name,
          colors: newProduct.colors,
          sizes: newProduct.sizes,
          yarnUsage: newProduct.yarnUsage,
          image: newProduct.image,
          thumbnail: newProduct.thumbnail,
          customFields: finalCustomFields.map(f => ({ label: f.label, value: f.value }))
        });
        
        if (res && 'success' in res && !res.success) {
          alert(res.message);
          setIsSubmitting(false);
          return;
        }
        await refreshData();
      } else {
        const res = await createProduct({
          code: newProduct.code,
          name: newProduct.name,
          colors: newProduct.colors,
          sizes: newProduct.sizes,
          yarnUsage: newProduct.yarnUsage,
          image: newProduct.image,
          thumbnail: newProduct.thumbnail,
          customFields: finalCustomFields.map(f => ({ label: f.label, value: f.value })),
          stages: newProductStages
        });

        if (!res.success) {
          alert(res.message);
          setIsSubmitting(false);
          return;
        }

        await refreshData();
        if (res.id) handleSelectProduct(res.id);
      }
      setIsCreateModalOpen(false);
      setIsEditMode(false);
      setNewProduct({ code: "", name: "", image: "", thumbnail: "", colors: [], sizes: [], yarnUsage: [], customFields: [] });
      setNewProductFieldInput({ label: "", value: "" }); 
      setNewProductStages([]);
    } catch (error: any) {
      console.error("Save failed:", error);
      alert("保存失败，原因可能是：\n1. 图片文件太大，超出了服务器限制\n2. 网络连接超时\n\n请尝试换一张较小的图片测试，或检查服务器日志。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (p: Product) => {
    setNewProduct({ 
      code: p.code, 
      name: p.name, 
      image: p.image || "", 
      thumbnail: p.thumbnail || "",
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
      thumbnail: "",
      colors: [],
      sizes: [],
      yarnUsage: [],
      customFields: initialCustomFields 
    });
    setNewProductStages([]);
    setIsCreateModalOpen(true);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F3F4F6] text-slate-500">加载中...</div>;

  // 未连接状态显示
  if (!connectedInfo.isConnected) {
    return (
      <div className="flex h-screen bg-[#F3F4F6] items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[48px] p-12 shadow-2xl shadow-indigo-100 flex flex-col items-center text-center border border-white">
          <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8 rotate-3">
            <ShieldCheck className="w-12 h-12 text-white -rotate-3" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight italic">万濮云</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed text-sm">
            欢迎使用万濮云毛衣开发管理系统。<br />
            请先连接生产管理系统以管理您的款式数据。
          </p>
          <button 
            onClick={() => setIsConnectModalOpen(true)}
            className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <LinkIcon className="w-5 h-5" />
            立即连接生产系统
          </button>
        </div>

        {isConnectModalOpen && (
          <ConnectModal 
            onClose={() => setIsConnectModalOpen(false)}
            onConnect={handleConnect}
          />
        )}
      </div>
    );
  }

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
          isDetailLoading={detailLoading}
          onSync={async (id) => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
              const res = await syncProductToExternal(id);
              if (res.success) {
                alert("🎉 同步成功！商品已在生产管理系统中创建。");
                await refreshData();
              } else {
                alert(`❌ 同步失败：${res.message}`);
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
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
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8">
            <div className="w-16 h-16 text-slate-200">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">暂无款式数据</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-xs text-center font-medium">您还没有创建任何款式，或者当前筛选条件下没有匹配的内容。</p>
          <button 
            onClick={handleCreateOpen}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus className="w-5 h-5" />
            立即录入首个款式
          </button>
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
          unitDict={unitDict}
          dictLoading={dictLoading}
          onFetchColors={loadColors}
          onFetchSizes={loadSizes}
          onFetchMaterials={loadMaterials}
          onFetchUnits={loadUnits}
          onAddMaterial={async (m) => {
            const res = await addMaterial(m);
            if (res.success) {
              refreshDicts();
            }
            return res;
          }}
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
          onUpdateTemplateOrder={async (newItems) => {
            await updateStageTemplateOrder(newItems);
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
