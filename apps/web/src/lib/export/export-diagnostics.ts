// export-diagnostics.ts - 导出系统诊断工具
// 帮助用户和开发者诊断导出问题

export interface DiagnosticResult {
  category: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  suggestion?: string;
}

export interface ExportDiagnostics {
  overall: 'healthy' | 'warning' | 'error';
  results: DiagnosticResult[];
  summary: string;
}

/**
 * 导出系统诊断工具
 */
export class ExportDiagnosticsService {
  /**
   * 运行完整的导出系统诊断
   */
  async runDiagnostics(): Promise<ExportDiagnostics> {
    const results: DiagnosticResult[] = [];

    // 检查浏览器兼容性
    results.push(...await this.checkBrowserCompatibility());
    
    // 检查系统资源
    results.push(...await this.checkSystemResources());
    
    // 检查网络连接
    results.push(...await this.checkNetworkConnection());
    
    // 检查Python服务
    results.push(...await this.checkPythonService());

    // 分析整体状态
    const failCount = results.filter(r => r.status === 'fail').length;
    const warnCount = results.filter(r => r.status === 'warn').length;
    
    let overall: 'healthy' | 'warning' | 'error';
    let summary: string;
    
    if (failCount > 0) {
      overall = 'error';
      summary = `发现 ${failCount} 个严重问题，${warnCount} 个警告`;
    } else if (warnCount > 0) {
      overall = 'warning';
      summary = `系统正常，但有 ${warnCount} 个警告`;
    } else {
      overall = 'healthy';
      summary = '导出系统运行正常';
    }

    return {
      overall,
      results,
      summary,
    };
  }

  /**
   * 检查浏览器兼容性
   */
  private async checkBrowserCompatibility(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // WebAssembly支持
    if (typeof WebAssembly !== 'undefined') {
      results.push({
        category: '浏览器兼容性',
        name: 'WebAssembly支持',
        status: 'pass',
        message: 'WebAssembly已支持',
      });
    } else {
      results.push({
        category: '浏览器兼容性',
        name: 'WebAssembly支持',
        status: 'fail',
        message: 'WebAssembly不支持',
        suggestion: '请使用现代浏览器（Chrome 57+, Firefox 52+, Safari 11+）',
      });
    }

    // Web Workers支持
    if (typeof Worker !== 'undefined') {
      results.push({
        category: '浏览器兼容性',
        name: 'Web Workers支持',
        status: 'pass',
        message: 'Web Workers已支持',
      });
    } else {
      results.push({
        category: '浏览器兼容性',
        name: 'Web Workers支持',
        status: 'warn',
        message: 'Web Workers不支持',
        suggestion: '导出性能可能受影响',
      });
    }

    return results;
  }

  /**
   * 检查系统资源
   */
  private async checkSystemResources(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // 内存检查
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

      if (usedMB / limitMB > 0.8) {
        results.push({
          category: '系统资源',
          name: '内存使用',
          status: 'warn',
          message: `内存使用率过高: ${Math.round(usedMB)}MB / ${Math.round(limitMB)}MB`,
          suggestion: '请关闭其他标签页或应用程序',
        });
      } else {
        results.push({
          category: '系统资源',
          name: '内存使用',
          status: 'pass',
          message: `内存使用正常: ${Math.round(usedMB)}MB / ${Math.round(limitMB)}MB`,
        });
      }
    }

    // CPU核心数检查
    const cores = navigator.hardwareConcurrency || 1;
    if (cores < 2) {
      results.push({
        category: '系统资源',
        name: 'CPU性能',
        status: 'warn',
        message: `CPU核心数较少: ${cores}核`,
        suggestion: '导出可能较慢，建议使用性能更好的设备',
      });
    } else {
      results.push({
        category: '系统资源',
        name: 'CPU性能',
        status: 'pass',
        message: `CPU核心数: ${cores}核`,
      });
    }

    return results;
  }

  /**
   * 检查网络连接
   */
  private async checkNetworkConnection(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // 在线状态
    if (navigator.onLine) {
      results.push({
        category: '网络连接',
        name: '在线状态',
        status: 'pass',
        message: '网络连接正常',
      });
    } else {
      results.push({
        category: '网络连接',
        name: '在线状态',
        status: 'fail',
        message: '网络连接断开',
        suggestion: '请检查网络连接，某些导出功能可能不可用',
      });
    }

    // 网络类型（如果可用）
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          results.push({
            category: '网络连接',
            name: '网络速度',
            status: 'warn',
            message: `网络速度较慢: ${effectiveType}`,
            suggestion: '建议使用WiFi或更快的网络连接',
          });
        } else {
          results.push({
            category: '网络连接',
            name: '网络速度',
            status: 'pass',
            message: `网络速度: ${effectiveType}`,
          });
        }
      }
    }

    return results;
  }

  /**
   * 检查Python服务
   */
  private async checkPythonService(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      // 动态导入Python客户端
      const { pythonExportClient } = await import('@/lib/python-export-client');
      
      // 检查服务健康状态
      const isHealthy = await pythonExportClient.checkHealth();
      
      if (isHealthy) {
        results.push({
          category: 'Python服务',
          name: '服务状态',
          status: 'pass',
          message: 'Python导出服务运行正常',
        });
      } else {
        results.push({
          category: 'Python服务',
          name: '服务状态',
          status: 'warn',
          message: 'Python导出服务不可用',
          suggestion: '将使用本地导出功能，速度可能较慢',
        });
      }
    } catch (error) {
      results.push({
        category: 'Python服务',
        name: '服务状态',
        status: 'fail',
        message: 'Python导出服务检查失败',
        suggestion: '服务器可能暂时不可用',
      });
    }

    return results;
  }

  /**
   * 获取导出建议
   */
  getExportRecommendations(diagnostics: ExportDiagnostics): string[] {
    const recommendations: string[] = [];

    // 基于诊断结果提供建议
    const failedChecks = diagnostics.results.filter(r => r.status === 'fail');
    const warnChecks = diagnostics.results.filter(r => r.status === 'warn');

    if (failedChecks.some(c => c.name === 'WebAssembly支持')) {
      recommendations.push('请更新到支持WebAssembly的现代浏览器');
    }

    if (warnChecks.some(c => c.name === '内存使用')) {
      recommendations.push('建议关闭其他标签页以释放内存');
      recommendations.push('可以尝试降低导出质量以减少内存使用');
    }

    if (failedChecks.some(c => c.name === '在线状态')) {
      recommendations.push('离线模式下只能使用本地导出功能');
    }

    if (warnChecks.some(c => c.name === 'Python服务')) {
      recommendations.push('服务器导出不可用，将自动使用本地导出');
    }

    // 通用建议
    if (recommendations.length === 0 && diagnostics.overall === 'healthy') {
      recommendations.push('系统状态良好，可以正常导出视频');
    }

    return recommendations;
  }
}

// 导出单例实例
export const exportDiagnostics = new ExportDiagnosticsService();


