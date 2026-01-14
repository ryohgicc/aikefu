// 配置管理模块
class ConfigManager {
  constructor() {
    this.configKey = 'aikefu_config';
    this.defaultConfig = {
      apiKey: '',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      model: 'ep-20250509112109-tqptk'
    };
  }

  // 获取配置
  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.configKey], (result) => {
        const config = result[this.configKey] || {};
        resolve({ ...this.defaultConfig, ...config });
      });
    });
  }

  // 保存配置
  async saveConfig(config) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.configKey]: config }, () => {
        resolve();
      });
    });
  }

  // 更新配置
  async updateConfig(updates) {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...updates };
    await this.saveConfig(newConfig);
    return newConfig;
  }

  // 重置为默认配置
  async resetToDefault() {
    await this.saveConfig(this.defaultConfig);
    return this.defaultConfig;
  }

  // 验证配置是否完整
  async isConfigValid() {
    const config = await this.getConfig();
    return config.apiKey && config.baseUrl && config.model;
  }

  // 获取配置项
  async getApiKey() {
    const config = await this.getConfig();
    return config.apiKey;
  }

  async getBaseUrl() {
    const config = await this.getConfig();
    return config.baseUrl;
  }

  async getModel() {
    const config = await this.getConfig();
    return config.model;
  }
}

// 创建全局配置管理器实例
window.configManager = new ConfigManager();