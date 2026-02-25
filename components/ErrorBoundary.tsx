"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[万濮云] 渲染错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen bg-[#F3F4F6] items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[48px] p-12 shadow-2xl flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-amber-100 rounded-[32px] flex items-center justify-center mb-8">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">页面加载异常</h2>
            <p className="text-slate-500 text-sm mb-8">
              请尝试刷新页面，或使用 Chrome、Edge 等现代浏览器访问。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
