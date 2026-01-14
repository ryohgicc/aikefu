document.addEventListener('DOMContentLoaded', async function() {
  const apiKeyInput = document.getElementById('apiKey');
  const baseUrlInput = document.getElementById('baseUrl');
  const modelInput = document.getElementById('model');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const backBtn = document.getElementById('backBtn');
  const statusMessage = document.getElementById('statusMessage');

  // 显示状态消息
  function showStatus(message, isSuccess = true) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${isSuccess ? 'status-success' : 'status-error'}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  // 加载配置
  async function loadConfig() {
    try {
      const config = await configManager.getConfig();
      apiKeyInput.value = config.apiKey;
      baseUrlInput.value = config.baseUrl;
      modelInput.value = config.model;
    } catch (error) {
      console.error('加载配置失败:', error);
      showStatus('加载配置失败: ' + error.message, false);
    }
  }

  // 保存配置
  async function saveConfig() {
    try {
      const config = {
        apiKey: apiKeyInput.value.trim(),
        baseUrl: baseUrlInput.value.trim(),
        model: modelInput.value.trim()
      };

      if (!config.apiKey) {
        showStatus('API Key不能为空', false);
        return;
      }

      if (!config.baseUrl) {
        showStatus('Base URL不能为空', false);
        return;
      }

      if (!config.model) {
        showStatus('Model不能为空', false);
        return;
      }

      await configManager.saveConfig(config);
      showStatus('配置保存成功！', true);
    } catch (error) {
      console.error('保存配置失败:', error);
      showStatus('保存配置失败: ' + error.message, false);
    }
  }

  // 重置为默认配置
  async function resetConfig() {
    if (confirm('确定要重置为默认配置吗？')) {
      try {
        await configManager.resetToDefault();
        await loadConfig();
        showStatus('配置已重置为默认值', true);
      } catch (error) {
        console.error('重置配置失败:', error);
        showStatus('重置配置失败: ' + error.message, false);
      }
    }
  }

  // 返回主界面
  function goBack() {
    window.location.href = 'popup.html';
  }

  // 绑定事件
  saveBtn.addEventListener('click', saveConfig);
  resetBtn.addEventListener('click', resetConfig);
  backBtn.addEventListener('click', goBack);

  // 回车键保存
  [apiKeyInput, baseUrlInput, modelInput].forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        saveConfig();
      }
    });
  });

  // 页面加载时加载配置
  await loadConfig();
});