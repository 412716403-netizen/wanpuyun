import React, { useState } from 'react';
import { X, Link, ShieldCheck, AlertCircle } from "lucide-react";

interface ConnectModalProps {
  onClose: () => void;
  onConnect: (company: string, user: string, pass: string) => Promise<{ success: boolean, message: string }>;
}

export const ConnectModal = ({ onClose, onConnect }: ConnectModalProps) => {
  const [formData, setFormData] = useState({ company: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.username || !formData.password) {
      setError("请填写完整的登录信息");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await onConnect(formData.company, formData.username, formData.password);
      if (!result.success) {
        setError(result.message || "登录失败，请检查信息是否正确");
      } else {
        onClose();
      }
    } catch (err) {
      setError("网络连接异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Link className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">连接生产管理系统</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">公司名称</label>
              <input 
                type="text" 
                value={formData.company} 
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="请输入公司全称" 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">用户名</label>
              <input 
                type="text" 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="请输入账号" 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">密码</label>
              <input 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="请输入密码" 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" 
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs font-medium text-red-500 bg-red-50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {loading ? "正在验证..." : "立即登录并连接"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-[10px] text-center text-slate-400 leading-relaxed">
            连接后，系统将自动同步外部生产系统的字典数据及款式信息。<br/>
            您的登录凭证将加密存储在当前浏览器中。
          </p>
        </div>
      </div>
    </div>
  );
};

