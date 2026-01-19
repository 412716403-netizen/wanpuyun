/**
 * 统一日志管理工具
 * 在开发环境显示详细日志，生产环境只显示错误
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * 调试日志 - 仅在开发环境输出
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * 信息日志 - 仅在开发环境输出
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * 警告日志 - 所有环境都输出
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * 错误日志 - 所有环境都输出
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * 性能日志 - 记录操作耗时
   */
  perf: (label: string, startTime: number) => {
    if (isDevelopment) {
      const duration = Date.now() - startTime;
      console.log(`[PERF] ${label}: ${duration}ms`);
    }
  },

  /**
   * 带时间戳的日志
   */
  timestamp: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      console.log(`[${time}]`, message, ...args);
    }
  }
};
