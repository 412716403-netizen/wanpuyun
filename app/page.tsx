"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ProductSidebar } from "@/components/ProductSidebar";
import { MainContent } from "@/components/MainContent";
import { CreateProductModal } from "@/components/modals/CreateProductModal";
import { NodeInfoModal } from "@/components/modals/NodeInfoModal";
import { LogModal } from "@/components/modals/LogModal";
import { ConnectModal } from "@/components/modals/ConnectModal";
import { DailyReportModal } from "@/components/modals/DailyReportModal";
import { 
  getProducts, 
  getProductDetail,
  getInitialData,
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
  addMaterial,
  getDailyReport,
  getStageTrendReport,
  type SessionInfo
} from "./actions";
import { Plus, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { 
  Product, 
  Stage, 
  ProductCustomField, 
  StageStatus,
  YarnUsage
} from "@/types";
import { logger } from "@/lib/logger";

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
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | undefined>(undefined);

  // 初始化加载数据
  useEffect(() => {
    async function loadData() {
      logger.info("[Dashboard] 开始合并加载基础数据...");
      const startTime = Date.now();
      
      try {
        // 方案 B：优先从 localStorage 读取会话信息，绕过 iframe Cookie 限制
        const savedSession = localStorage.getItem('wanpuyun_session');
        let currentSession: SessionInfo | undefined = undefined;
        if (savedSession) {
          try {
            currentSession = JSON.parse(savedSession);
            setSessionInfo(currentSession);
          } catch (e) {
            logger.error("解析本地会话失败", e);
          }
        }

        const data = await getInitialData(currentSession);
        
        if (!data) {
          setLoading(false);
          return;
        }
        
        logger.perf("[Dashboard] 数据合并加载完成", startTime);
        
        const { products: productsData, templates: templatesData, connectedInfo: connInfo } = data;
        
        setProducts(productsData);
        setTemplates(templatesData);
        setConnectedInfo(connInfo);
        
        if (productsData.length > 0) {
          // 优先选择第一个处于“进行中”的产品，如果没有，则选列表第一个
          const firstDeveloping = productsData.find(p => p.status === 'developing') || productsData[0];
          
          setSelectedProductId(firstDeveloping.id);
          if (firstDeveloping.samples && firstDeveloping.samples.length > 0) {
            setActiveSampleId(firstDeveloping.samples[0].id);
          }
          
          // 首页渲染后，立即异步请求该款式的详情
          setDetailLoading(true);
          getProductDetail(firstDeveloping.id, currentSession).then(fullProduct => {
            if (fullProduct) {
              setProducts(prev => prev.map(p => p.id === firstDeveloping.id ? fullProduct : p));
            }
          }).finally(() => {
            setDetailLoading(false);
          });
        }

        // 核心数据加载完就关闭全屏加载状态
        setLoading(false);

      } catch (error) {
        logger.error("[Dashboard] 数据加载发生严重错误:", error);
        setLoading(false); 
      }
    }
    loadData();
  }, []);

  const loadColors = async () => {
    // 严格判断：只有在未连接、已有数据、或正在加载时，才拦截请求
    if (!connectedInfo.isConnected || colorDict.length > 0 || dictLoading.colors) return;
    setDictLoading(prev => ({ ...prev, colors: true }));
    try {
      const data = await getExternalColors(sessionInfo);
      setColorDict(data);
    } finally {
      setDictLoading(prev => ({ ...prev, colors: false }));
    }
  };

  const loadSizes = async () => {
    if (!connectedInfo.isConnected || sizeDict.length > 0 || dictLoading.sizes) return;
    setDictLoading(prev => ({ ...prev, sizes: true }));
    try {
      const data = await getExternalSizes(sessionInfo);
      setSizeDict(data);
    } finally {
      setDictLoading(prev => ({ ...prev, sizes: false }));
    }
  };

  const loadMaterials = async () => {
    if (!connectedInfo.isConnected || materialDict.length > 0 || dictLoading.materials) return;
    setDictLoading(prev => ({ ...prev, materials: true }));
    try {
      const data = await getExternalMaterials(sessionInfo);
      setMaterialDict(data);
    } finally {
      setDictLoading(prev => ({ ...prev, materials: false }));
    }
  };

  const loadUnits = async () => {
    if (!connectedInfo.isConnected || unitDict.length > 0 || dictLoading.units) return;
    setDictLoading(prev => ({ ...prev, units: true }));
    try {
      const data = await getExternalUnits(sessionInfo);
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
        getExternalColors(sessionInfo), 
        getExternalSizes(sessionInfo), 
        getExternalMaterials(sessionInfo),
        getExternalUnits(sessionInfo)
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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
  
  // 使用 useMemo 缓存计算结果，避免每次渲染都重新计算
  const uniqueStageNames = useMemo(() => {
    return Array.from(new Set(products.flatMap((p: Product) => p.samples?.flatMap(s => s.stages.map(st => st.name)) || [])));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
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
  }, [products, activeTab, searchQuery, filters]);

  // 刷新数据
  const refreshData = async () => {
    try {
      const [productsData, templatesData, connInfo] = await Promise.all([
        getProducts(sessionInfo),
        getStageTemplates(sessionInfo),
        getConnectedInfo(sessionInfo)
      ]);
      
      // 如果连接状态发生变化，更新状态
      if (connInfo.isConnected !== connectedInfo.isConnected) {
        setConnectedInfo(connInfo);
      }

      setProducts(productsData);
      setTemplates(templatesData);
      
      // 如果当前有选中的产品，刷新它的详情
      if (selectedProductId) {
        const fullProduct = await getProductDetail(selectedProductId, sessionInfo);
        if (fullProduct) {
          setProducts(prev => prev.map(p => p.id === selectedProductId ? fullProduct : p));
        }
      }

      if (connInfo.isConnected) {
        refreshDicts();
      }
    } catch (error) {
      logger.error("Refresh failed:", error);
    }
  };

  // 监听窗口聚焦或休眠唤醒
  useEffect(() => {
    const handleCheckConnection = async () => {
      if (connectedInfo.isConnected) {
        logger.debug("[App] 页面聚焦，检查外部系统连接状态...");
        const info = await getConnectedInfo(sessionInfo);
        if (!info.isConnected) {
          logger.info("[App] 连接已失效，切换至登录视图");
          setConnectedInfo(info);
          // 可以选择是否强制刷新页面以清理所有缓存状态
          // window.location.reload(); 
        }
      }
    };

    window.addEventListener('focus', handleCheckConnection);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleCheckConnection();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleCheckConnection);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectedInfo.isConnected]);

  // --- Handlers ---
  const handleSelectProduct = async (id: string) => {
    setSelectedProductId(id);
    const product = products.find(p => p.id === id);
    if (product) {
      if (product.samples && product.samples.length > 0) {
        setActiveSampleId(product.samples[0].id);
      }
      
      // 检查是否已经加载了完整详情（简单通过标记或判断是否有附件数据）
      const hasFullData = product.samples.some(s => s.stages.some(st => st.attachments.some(a => a.fileUrl)));
      if (!hasFullData) {
        setDetailLoading(true);
        try {
          const fullProduct = await getProductDetail(id, sessionInfo);
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
    if (result.success && result.session) {
      // 方案 B：存储会话到 localStorage
      localStorage.setItem('wanpuyun_session', JSON.stringify(result.session));
      setSessionInfo(result.session);
      window.location.reload();
    }
    return result;
  };

  const handleDisconnect = async () => {
    if (confirm("确定要断开与生产系统的连接吗？")) {
      await disconnectExternal();
      localStorage.removeItem('wanpuyun_session');
      setSessionInfo(undefined);
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
        }, sessionInfo);
        
        if (res && res.success && res.product) {
          const updatedProduct = res.product as Product;
          // 直接更新本地状态，避免全局刷新
          setProducts(prev => prev.map(p => p.id === selectedProductId ? updatedProduct : p));
        } else if (res && !res.success) {
          alert(res.message);
          setIsSubmitting(false);
          return;
        }
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
        }, sessionInfo);

        if (!res.success) {
          alert(res.message);
          setIsSubmitting(false);
          return;
        }

        // 直接合并新产品到列表，并选中它
        if (res.product) {
          const newProd = res.product as Product;
          setProducts(prev => [newProd, ...prev]);
          setSelectedProductId(newProd.id);
          if (newProd.samples && newProd.samples.length > 0) {
            setActiveSampleId(newProd.samples[0].id);
          }
        }
      }
      setIsCreateModalOpen(false);
      setIsEditMode(false);
      setNewProduct({ code: "", name: "", image: "", thumbnail: "", colors: [], sizes: [], yarnUsage: [], customFields: [] });
      setNewProductFieldInput({ label: "", value: "" }); 
      setNewProductStages([]);
    } catch (error: any) {
      logger.error("Save failed:", error);
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

      // 极致优化：立即关闭弹窗并清空输入，实现“瞬时”体感
      setIsNodeModalOpen(false);
      setFieldInput({ label: "", value: "" });

      const res = await updateStageInfo({
        stageId,
        sampleId,
        status: tempStatus,
        fields: finalFields.map(f => ({ label: f.label, value: f.value, type: 'text' })),
        // 优化点：发送 id 以便后端精准删除，只发送新增附件的 Base64 数据
        attachments: tempAttachments.map(a => ({ 
          id: a.id,
          fileName: a.fileName, 
          fileUrl: a.fileUrl.startsWith('data:') ? a.fileUrl : "" 
        })),
        userName: "Jun Zheng",
        logDetail: logDetail.trim()
      }, sessionInfo);

      if (res && res.success && res.stage) {
        const updatedStage = res.stage;
        setProducts(prev => prev.map(p => {
          if (p.id === selectedProductId) {
            return {
              ...p,
              samples: p.samples.map(s => {
                if (s.id === sampleId) {
                  // 找到当前操作的节点索引
                  const currentStageIdx = s.stages.findIndex(st => st.id === stageId);
                  
                  return {
                    ...s,
                    // 将新日志插到最前面
                    logs: res.newLog ? [res.newLog, ...s.logs] : s.logs,
                    stages: s.stages.map((st, idx) => {
                      // 更新当前编辑的节点
                      if (st.id === stageId) {
                        return {
                          ...st,
                          status: updatedStage!.status as StageStatus,
                          updatedAt: new Date(updatedStage!.updatedAt).toLocaleDateString(),
                          fields: (updatedStage!.fields || []).map((f: any) => ({
                            id: f.id,
                            label: f.label,
                            type: f.type,
                            value: f.value
                          })),
                          attachments: (updatedStage!.attachments || []).map((a: any) => {
                            // 优先通过 id 匹配，如果匹配不到（如后端新创建的），再尝试通过文件名匹配
                            const localMatch = tempAttachments.find(la => la.id === a.id) || 
                                             tempAttachments.find(la => la.fileName === a.fileName && la.id.startsWith('att-'));
                            return {
                              id: a.id,
                              fileName: a.fileName,
                              fileUrl: localMatch ? localMatch.fileUrl : ""
                            };
                          })
                        };
                      }
                      
                      // 自动流转逻辑：如果当前保存为“已完成”，则将下一个“待开始”的节点设为“进行中”
                      if (tempStatus === 'completed' && idx === currentStageIdx + 1 && st.status === 'pending') {
                        return { ...st, status: 'in_progress' as StageStatus };
                      }

                      return st;
                    })
                  };
                }
                return s;
              })
            };
          }
          return p;
        }));
      } else if (res && !res.success) {
        alert("保存失败：" + (res.message || "未知错误"));
      }
    } catch (error) {
      logger.error("Save node info failed:", error);
      alert("网络异常，保存可能未成功，请刷新检查。");
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
      const newSampleId = await createSampleVersion(selectedProduct.id, nextName, sessionInfo);
      await refreshData();
      setActiveSampleId(newSampleId);
    } catch (error) {
      logger.error("Add sample failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (!selectedProduct || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteSampleVersion(sampleId, sessionInfo);
      const data = await getProducts(sessionInfo);
      setProducts(data);
      const currentProduct = data.find((p: Product) => p.id === selectedProductId);
      if (currentProduct && currentProduct.samples.length > 0) {
        if (activeSampleId === sampleId) {
          setActiveSampleId(currentProduct.samples[0].id);
        }
      }
    } catch (error) {
      logger.error("Delete sample failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(id, sessionInfo);
      const data = await getProducts(sessionInfo);
      setProducts(data);
      if (data.length > 0) {
        setSelectedProductId(data[0].id);
        if (data[0].samples && data[0].samples.length > 0) {
          setActiveSampleId(data[0].samples[0].id);
        }
      } else {
        setSelectedProductId("");
        setActiveSampleId("");
      }
    } catch (error) {
      logger.error("Delete product failed:", error);
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
        onReportOpen={() => setIsReportModalOpen(true)}
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
              const res = await syncProductToExternal(id, sessionInfo);
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
                await toggleProductStatus(id, p.status, sessionInfo);
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
            const res = await addMaterial(m, sessionInfo);
            if (res.success) {
              refreshDicts();
            }
            return res;
          }}
          onAddDictItem={async (type, name) => {
            const ok = await addDictItem(type, name, sessionInfo);
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
            if (!confirm("确定要删除此模板吗？")) return;
            // 乐观更新：先从 UI 中移除
            const oldTemplates = [...templates];
            setTemplates(templates.filter(t => t.id !== id));
            try {
              await deleteStageTemplate(id, sessionInfo);
            } catch (err) {
              setTemplates(oldTemplates);
              alert("删除失败");
            }
          }}
          onUpdateTemplateOrder={async (newItems) => {
            // 乐观更新：立即反映顺序变化
            // 将 newItems (id, order) 映射回完整的 templates 对象数组
            const orderedTemplates = [...newItems]
              .sort((a, b) => a.order - b.order)
              .map(item => templates.find(t => t.id === item.id))
              .filter(Boolean) as { id: string, name: string }[];
            
            setTemplates(orderedTemplates);
            
            try {
              // 后台静默同步，不阻塞 UI
              updateStageTemplateOrder(newItems, sessionInfo);
            } catch (err) {
              logger.error("排序同步失败:", err);
            }
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

      {isReportModalOpen && (
        <DailyReportModal 
          onClose={() => setIsReportModalOpen(false)}
          onFetchReport={(date) => getDailyReport(date, sessionInfo)}
          onFetchStageTrend={(stage, days) => getStageTrendReport(stage, days, sessionInfo)}
          availableStages={uniqueStageNames}
        />
      )}
    </div>
  );
}
