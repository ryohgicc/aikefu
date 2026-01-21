// AIkeFu Assistant - SPA支持内容脚本
// 支持单页应用导航变化检测

(function() {
    'use strict';
    
    console.log('AIkeFu Assistant: SPA内容脚本启动');
    
    let sidebarElement = null;
    let currentUrl = window.location.href;
    let isInjected = false;
    let isPinned = false;
    
    // 快速回复模板
    const quickTemplates = {
        greeting: {
            zh: '您好！感谢您的反馈，我们非常重视您的意见。',
            en: 'Hello! Thank you for your feedback, we really value your opinion.'
        },
        thanks: {
            zh: '非常感谢您的耐心和支持，我们会继续努力提供更好的服务。',
            en: 'Thank you very much for your patience and support. We will continue to strive to provide better service.'
        },
        apology: {
            zh: '对于给您带来的不便，我们深表歉意。我们会立即处理这个问题。',
            en: 'We sincerely apologize for the inconvenience caused. We will address this issue immediately.'
        },
        help: {
            zh: '我很乐意帮助您解决这个问题。让我为您提供详细的解决方案。',
            en: 'I\'m happy to help you resolve this issue. Let me provide you with a detailed solution.'
        }
    };
    
    // 检测是否应该显示侧边栏
    function shouldShowSidebar() {
        const url = window.location.href;
        // 匹配 /任意内容/feedback/reply/任意内容 的URL模式
        const pattern = /\/feedback\/reply\/[^\/]+$/;
        return pattern.test(url);
    }
    
    // 创建侧边栏
    function createSidebar() {
        // 检查并清理旧的 DOM 元素（如果有）
        const oldSidebar = document.getElementById('aikifu-assistant');
        if (oldSidebar) {
            console.log('AIkeFu Assistant: 清理旧的侧边栏元素');
            oldSidebar.remove();
        }

        if (sidebarElement) {
            console.log('侧边栏已存在');
            return;
        }
        
        console.log('AIkeFu Assistant: 创建侧边栏');
        
        const container = document.createElement('div');
        container.id = 'aikifu-assistant';
        container.innerHTML = `
            <div class="aikifu-header">
                <div class="aikifu-header-left">
                    <span class="aikifu-title">🤖 AI客服助手</span>
                    <span class="aikifu-subtitle">智能回答优化</span>
                </div>
                <div class="aikifu-header-right">
                    <button class="aikifu-settings-btn" id="aikifu-settings" title="配置设置">⚙️</button>
                    <button class="aikifu-pin-btn" id="aikifu-pin" title="固定窗口">📌</button>
                    <button class="aikifu-minimize" title="最小化">−</button>
                </div>
            </div>
            
            <!-- 设置弹窗 -->
            <div id="aikifu-settings-modal" class="aikifu-modal" style="display: none !important;">
                <div class="aikifu-modal-content">
                    <h2 class="aikifu-modal-title">配置设置</h2>
                    
                    <div class="aikifu-form-group">
                        <label>API Key:</label>
                        <input type="password" class="aikifu-input aikifu-settings-input" id="aikifu-config-apikey" placeholder="请输入 API Key">
                    </div>
                    
                    <div class="aikifu-form-group">
                        <label>Base URL:</label>
                        <input type="text" class="aikifu-input aikifu-settings-input" id="aikifu-config-baseurl" placeholder="https://ark.cn-beijing.volces.com/api/v3">
                    </div>
                    
                    <div class="aikifu-form-group">
                        <label>Model:</label>
                        <input type="text" class="aikifu-input aikifu-settings-input" id="aikifu-config-model" placeholder="ep-20250509112109-tqptk">
                    </div>
                    
                    <div class="aikifu-modal-actions">
                        <button id="aikifu-config-save" class="aikifu-btn-primary">保存配置</button>
                        <button id="aikifu-config-reset" class="aikifu-btn-danger">重置默认</button>
                    </div>
                    <div style="text-align: center; margin-top: 10px;">
                        <a href="#" id="aikifu-config-close" style="color: #666; text-decoration: none; font-size: 12px;">关闭</a>
                    </div>
                </div>
            </div>

            <div class="aikifu-content">
                <div class="aikifu-split-layout">
                    <!-- 左侧操作区 -->
                    <div class="aikifu-left-panel">
                        <div class="aikifu-quick-actions">
                            <button class="aikifu-quick-btn" data-template="greeting">👋 问候语</button>
                            <button class="aikifu-quick-btn" data-template="thanks">🙏 感谢语</button>
                            <button class="aikifu-quick-btn" data-template="apology">😔 道歉语</button>
                            <button class="aikifu-quick-btn" data-template="help">❓ 帮助语</button>
                        </div>
                        <div class="aikifu-input-group">
                            <label>用户问题：</label>
                            <textarea class="aikifu-input" id="aikifu-question" placeholder="输入用户问题..."></textarea>
                        </div>
                        <div class="aikifu-input-group">
                            <label>您的回答：</label>
                            <textarea class="aikifu-input" id="aikifu-answer" placeholder="输入您的回答..."></textarea>
                        </div>
                        <div class="aikifu-buttons">
                            <button class="aikifu-optimize-btn" id="aikifu-optimize">✨ 优化回答</button>
                            <button class="aikifu-clear-btn" id="aikifu-clear">清空</button>
                        </div>
                        <div class="aikifu-error" id="aikifu-error" style="display:none;"></div>
                    </div>

                    <!-- 右侧结果区 -->
                    <div class="aikifu-right-panel">
                        <div id="aikifu-translation-box" style="display:none; margin-bottom: 20px;">
                            <div class="aikifu-result-title">用户问题翻译</div>
                            <div class="aikifu-result-content" id="aikifu-translation-content" style="min-height: 100px; color: #555;"></div>
                        </div>

                        <div id="aikifu-empty-state" class="aikifu-empty-state">
                            <div class="aikifu-empty-icon">🤖</div>
                            <div>点击"优化回答"生成AI建议</div>
                        </div>
                        
                        <div class="aikifu-results" id="aikifu-results" style="display:none !important;">
                            <div class="aikifu-result">
                                <div class="aikifu-result-header">
                                    <div class="aikifu-result-title">中文优化版本</div>
                                    <div class="aikifu-result-lang">🇨🇳</div>
                                </div>
                                <div class="aikifu-result-content" id="aikifu-result-zh"></div>
                                <button class="aikifu-copy-btn" data-target="aikifu-result-zh">📋 复制并粘贴中文版本</button>
                            </div>
                            <div class="aikifu-result">
                                <div class="aikifu-result-header">
                                    <div class="aikifu-result-title">原语言优化版本</div>
                                    <div class="aikifu-result-lang">🌍</div>
                                </div>
                                <div class="aikifu-result-content" id="aikifu-result-en"></div>
                                <button class="aikifu-copy-btn" data-target="aikifu-result-en">📋 复制并粘贴原语言版本</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 注入样式
        injectStyles();
        
        document.body.appendChild(container);
        sidebarElement = container;
        
        setupEventListeners();
        
        // 尝试提取页面内容
        setTimeout(extractPageContent, 1000);

        // 检查配置
        checkConfig();
    }
    
    // Expose for testing/debugging
    window.createSidebar = createSidebar;
    
    // 检查配置，如果没有配置则显示设置弹窗
    async function checkConfig() {
        const config = await loadConfig();
        if (!config.apiKey) {
            console.log('AIkeFu Assistant: 未检测到API Key，显示设置弹窗');
            showSettings();
        }
    }

    // 加载配置
    function loadConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['aikefu_config'], (result) => {
                const config = result.aikefu_config || {
                    apiKey: '',
                    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
                    model: 'ep-20250509112109-tqptk'
                };
                resolve(config);
            });
        });
    }

    // 显示设置弹窗
    async function showSettings() {
        console.log('AIkeFu: showSettings called');
        const modal = document.getElementById('aikifu-settings-modal');
        if (modal) {
            // 先显示弹窗，避免 loadConfig 卡住导致无反应
            modal.style.setProperty('display', 'flex', 'important');
            console.log('AIkeFu: modal display set to flex');
            
            try {
                const config = await loadConfig();
                console.log('AIkeFu: config loaded', config);
                document.getElementById('aikifu-config-apikey').value = config.apiKey || '';
                document.getElementById('aikifu-config-baseurl').value = config.baseUrl || 'https://ark.cn-beijing.volces.com/api/v3';
                document.getElementById('aikifu-config-model').value = config.model || 'ep-20250509112109-tqptk';
            } catch (err) {
                console.error('AIkeFu: loadConfig failed', err);
                // 即使加载失败，也保持弹窗显示，让用户可以重新输入
            }
        } else {
            console.error('AIkeFu: settings modal not found');
        }
    }

    // 隐藏设置弹窗
    function hideSettings() {
        const modal = document.getElementById('aikifu-settings-modal');
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
        }
    }

    // 保存配置
    function saveConfig() {
        const apiKey = document.getElementById('aikifu-config-apikey').value.trim();
        const baseUrl = document.getElementById('aikifu-config-baseurl').value.trim();
        const model = document.getElementById('aikifu-config-model').value.trim();

        if (!apiKey) {
            alert('请输入 API Key');
            return;
        }

        const config = {
            apiKey: apiKey,
            baseUrl: baseUrl || 'https://ark.cn-beijing.volces.com/api/v3',
            model: model || 'ep-20250509112109-tqptk'
        };

        chrome.storage.local.set({ 'aikefu_config': config }, () => {
            console.log('AIkeFu Assistant: 配置已保存');
            hideSettings();
            showNotification('配置已保存', 'success');
        });
    }

    // 重置配置
    function resetConfig() {
        if (confirm('确定要重置为默认配置吗？')) {
            document.getElementById('aikifu-config-apikey').value = '';
            document.getElementById('aikifu-config-baseurl').value = 'https://ark.cn-beijing.volces.com/api/v3';
            document.getElementById('aikifu-config-model').value = 'ep-20250509112109-tqptk';
        }
    }

    // 显示通知 (复用现有的或新建)
    function showNotification(message, type = 'info') {
        // 如果有现成的 showError，也可以改造成通用的 notification
        // 这里简单实现一个
        const errorDiv = document.getElementById('aikifu-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
            errorDiv.style.color = type === 'success' ? '#166534' : '#991b1b';
            errorDiv.style.border = type === 'success' ? '1px solid #86efac' : '1px solid #fecaca';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        } else {
            alert(message);
        }
    }
    
    // 移除侧边栏
    function removeSidebar() {
        if (sidebarElement) {
            console.log('AIkeFu Assistant: 移除侧边栏');
            sidebarElement.remove();
            sidebarElement = null;
        }
    }
    
    // 注入样式
    function injectStyles() {
        // 总是移除旧样式以确保更新
        const oldStyle = document.getElementById('aikifu-styles');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = 'aikifu-styles';
        style.textContent = `
            #aikifu-assistant {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 800px !important;
                height: 100vh !important;
                background: #ffffff !important;
                border-right: 1px solid #e1e5e9 !important;
                box-shadow: 2px 0 12px rgba(0,0,0,0.1) !important;
                z-index: 2147483647 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                font-size: 14px !important;
                line-height: 1.4 !important;
                color: #333 !important;
                display: flex !important;
                flex-direction: column !important;
                transition: width 0.3s ease !important;
            }

            /* 最小化时的样式覆盖 */
            #aikifu-assistant.minimized {
                width: 60px !important;
                height: 60px !important;
                overflow: hidden !important;
                border-radius: 0 0 12px 0 !important;
            }

            #aikifu-assistant.minimized .aikifu-header {
                padding: 0 !important;
                justify-content: center !important;
                height: 100% !important;
            }

            #aikifu-assistant.minimized .aikifu-header-left,
            #aikifu-assistant.minimized .aikifu-settings-btn,
            #aikifu-assistant.minimized .aikifu-pin-btn {
                display: none !important;
            }
            
            #aikifu-assistant.minimized .aikifu-header-right {
                width: 100% !important;
                height: 100% !important;
                justify-content: center !important;
                padding: 0 !important;
                gap: 0 !important;
            }

            #aikifu-assistant.minimized .aikifu-minimize {
                width: 100% !important;
                height: 100% !important;
                border-radius: 0 !important;
                background: transparent !important;
                font-size: 24px !important;
            }
            
            #aikifu-assistant.minimized .aikifu-minimize:hover {
                background: rgba(255,255,255,0.1) !important;
            }
            
            .aikifu-header {
                background: linear-gradient(135deg, #2196F3, #21CBF3) !important;
                color: white !important;
                padding: 16px 24px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                border-bottom: 1px solid rgba(255,255,255,0.2) !important;
                flex-shrink: 0 !important;
            }
            
            .aikifu-split-layout {
                display: flex !important;
                flex: 1 !important;
                overflow: hidden !important;
            }

            .aikifu-left-panel {
                flex: 1 !important;
                padding: 20px !important;
                overflow-y: auto !important;
                border-right: 1px solid #e1e5e9 !important;
                display: flex !important;
                flex-direction: column !important;
                min-width: 350px !important;
            }

            .aikifu-right-panel {
                flex: 1 !important;
                padding: 20px !important;
                overflow-y: auto !important;
                background: #f8fafc !important;
                display: flex !important;
                flex-direction: column !important;
            }
            
            .aikifu-header-left {
                display: flex !important;
                flex-direction: column !important;
            }
            
            .aikifu-header-right {
                display: flex !important;
                gap: 8px !important;
                align-items: center !important;
            }
            
            .aikifu-subtitle {
                font-size: 12px !important;
                opacity: 0.8 !important;
                margin-top: 2px !important;
            }
            
            .aikifu-title {
                font-weight: 700 !important;
                font-size: 18px !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
            }
            
            .aikifu-minimize {
                background: rgba(255,255,255,0.2) !important;
                border: none !important;
                color: white !important;
                width: 32px !important;
                height: 32px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 20px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-weight: 300 !important;
                transition: all 0.2s !important;
            }
            
            .aikifu-minimize:hover {
                background: rgba(255,255,255,0.3) !important;
            }
            
            .aikifu-pin-btn {
                background: rgba(255,255,255,0.2) !important;
                border: none !important;
                color: white !important;
                width: 32px !important;
                height: 32px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 16px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 0.2s !important;
            }
            
            .aikifu-pin-btn:hover {
                background: rgba(255,255,255,0.3) !important;
            }
            
            .aikifu-pin-btn.pinned {
                background: rgba(255,255,255,0.4) !important;
                transform: rotate(45deg) !important;
            }

            .aikifu-settings-btn {
                background: rgba(255,255,255,0.2) !important;
                border: none !important;
                color: white !important;
                width: 32px !important;
                height: 32px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 16px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 0.2s !important;
            }
            
            .aikifu-settings-btn:hover {
                background: rgba(255,255,255,0.3) !important;
            }

            .aikifu-modal {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0,0,0,0.5) !important;
                z-index: 2147483648 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                backdrop-filter: blur(2px) !important;
            }

            .aikifu-modal-content {
                background: white !important;
                width: 90% !important;
                max-width: 500px !important;
                padding: 30px !important;
                border-radius: 12px !important;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
                animation: aikifu-modal-in 0.3s ease-out !important;
            }

            @keyframes aikifu-modal-in {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .aikifu-modal-title {
                text-align: center !important;
                margin-top: 0 !important;
                margin-bottom: 25px !important;
                color: #333 !important;
                font-size: 20px !important;
                font-weight: 700 !important;
            }

            .aikifu-settings-input {
                min-height: 40px !important;
                padding: 8px 12px !important;
                margin-bottom: 5px !important;
            }

            .aikifu-modal-actions {
                display: flex !important;
                gap: 15px !important;
                margin-top: 25px !important;
            }

            .aikifu-btn-primary {
                flex: 1 !important;
                padding: 12px !important;
                background: #4caf50 !important;
                color: white !important;
                border: none !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
                font-size: 14px !important;
                transition: background 0.2s !important;
            }

            .aikifu-btn-primary:hover {
                background: #43a047 !important;
            }

            .aikifu-btn-danger {
                flex: 1 !important;
                padding: 12px !important;
                background: #f44336 !important;
                color: white !important;
                border: none !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
                font-size: 14px !important;
                transition: background 0.2s !important;
            }

            .aikifu-btn-danger:hover {
                background: #e53935 !important;
            }
            
            /* 旧的 content 类名保留但样式调整 */
            .aikifu-content {
                padding: 0 !important;
                flex: 1 !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
            }
            
            .aikifu-content.collapsed {
                display: none !important;
            }
            
            .aikifu-input-group {
                margin-bottom: 20px !important;
            }
            
            .aikifu-quick-actions {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 8px !important;
                margin-bottom: 20px !important;
                padding: 16px !important;
                background: linear-gradient(135deg, #f8fafc, #e2e8f0) !important;
                border-radius: 12px !important;
                border: 1px solid #e2e8f0 !important;
            }
            
            .aikifu-quick-btn {
                padding: 10px 12px !important;
                background: white !important;
                border: 1px solid #d1d5db !important;
                border-radius: 8px !important;
                cursor: pointer !important;
                font-size: 12px !important;
                color: #374151 !important;
                transition: all 0.2s !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 4px !important;
            }
            
            .aikifu-quick-btn:hover {
                background: #f3f4f6 !important;
                border-color: #9ca3af !important;
                transform: translateY(-1px) !important;
            }
            
            .aikifu-quick-btn:active {
                transform: translateY(0) !important;
            }
            
            .aikifu-input-group label {
                display: block !important;
                margin-bottom: 4px !important;
                font-weight: 500 !important;
                font-size: 13px !important;
                color: #555 !important;
            }
            
            .aikifu-input {
                width: 100% !important;
                min-height: 120px !important;
                padding: 12px 16px !important;
                border: 1px solid #d1d5db !important;
                border-radius: 8px !important;
                font-family: inherit !important;
                font-size: 14px !important;
                resize: vertical !important;
                background: #fafbfc !important;
                transition: border-color 0.2s, box-shadow 0.2s !important;
                box-sizing: border-box !important;
            }
            
            .aikifu-input:focus {
                outline: none !important;
                border-color: #2196F3 !important;
                box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1) !important;
                background: white !important;
            }
            
            .aikifu-buttons {
                display: flex !important;
                gap: 12px !important;
                margin-top: auto !important;
                margin-bottom: 0 !important;
            }
            
            .aikifu-optimize-btn {
                flex: 1 !important;
                padding: 14px 20px !important;
                background: linear-gradient(135deg, #2196F3, #21CBF3) !important;
                color: white !important;
                border: none !important;
                border-radius: 8px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.2s !important;
                font-size: 15px !important;
                box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3) !important;
            }
            
            .aikifu-optimize-btn:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
            }
            
            .aikifu-optimize-btn:active {
                transform: translateY(0) !important;
            }
            
            .aikifu-clear-btn {
                padding: 14px 20px !important;
                background: #f3f4f6 !important;
                color: #6b7280 !important;
                border: 1px solid #d1d5db !important;
                border-radius: 8px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s !important;
                font-size: 15px !important;
            }
            
            .aikifu-clear-btn:hover {
                background: #e5e7eb !important;
                color: #374151 !important;
            }
            
            .aikifu-loading {
                text-align: center !important;
                padding: 40px 20px !important;
                background: transparent !important;
                border-radius: 6px !important;
                margin: auto !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                height: 100% !important;
            }
            
            .aikifu-spinner {
                width: 32px !important;
                height: 32px !important;
                border: 3px solid #e5e7eb !important;
                border-top: 3px solid #2196F3 !important;
                border-radius: 50% !important;
                animation: aikifu-spin 1s linear infinite !important;
                margin: 0 auto 12px !important;
            }
            
            @keyframes aikifu-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .aikifu-loading span {
                color: #6b7280 !important;
                font-size: 14px !important;
            }
            
            .aikifu-results {
                margin-top: 0 !important;
                flex: 1 !important;
                overflow-y: auto !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 16px !important;
            }
            
            .aikifu-result {
                background: white !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 12px !important;
                padding: 16px !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
            }
            
            .aikifu-result-title {
                font-weight: 700 !important;
                color: #1e40af !important;
                margin-bottom: 10px !important;
                font-size: 14px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
            }
            
            .aikifu-result-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 12px !important;
            }
            
            .aikifu-result-lang {
                font-size: 16px !important;
            }
            
            .aikifu-result-content {
                background: #f8fafc !important;
                padding: 16px !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 8px !important;
                margin-bottom: 12px !important;
                font-size: 14px !important;
                line-height: 1.6 !important;
                min-height: 60px !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                color: #333 !important;
            }
            
            .aikifu-copy-btn {
                padding: 8px 16px !important;
                background: white !important;
                border: 1px solid #d1d5db !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 13px !important;
                color: #4b5563 !important;
                font-weight: 500 !important;
                transition: all 0.2s !important;
                width: 100% !important;
            }
            
            .aikifu-copy-btn:hover {
                background: #f3f4f6 !important;
                border-color: #9ca3af !important;
                color: #111 !important;
            }
            
            .aikifu-copy-btn.copied {
                background: #10b981 !important;
                color: white !important;
                border-color: #10b981 !important;
            }
            
            .aikifu-error {
                background: #fef2f2 !important;
                border: 1px solid #fca5a5 !important;
                border-radius: 6px !important;
                padding: 12px !important;
                color: #dc2626 !important;
                font-size: 13px !important;
                margin-top: 8px !important;
            }

            .aikifu-empty-state {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                height: 100% !important;
                color: #94a3b8 !important;
                text-align: center !important;
                padding: 20px !important;
            }

            .aikifu-empty-icon {
                font-size: 48px !important;
                margin-bottom: 16px !important;
                opacity: 0.5 !important;
            }
            
            /* 自定义滚动条 */
            .aikifu-left-panel::-webkit-scrollbar,
            .aikifu-right-panel::-webkit-scrollbar {
                width: 6px !important;
            }
            
            .aikifu-left-panel::-webkit-scrollbar-track,
            .aikifu-right-panel::-webkit-scrollbar-track {
                background: transparent !important;
            }
            
            .aikifu-left-panel::-webkit-scrollbar-thumb,
            .aikifu-right-panel::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 3px !important;
            }
            
            .aikifu-left-panel::-webkit-scrollbar-thumb:hover,
            .aikifu-right-panel::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // 翻译相关变量
    let translationTimeout = null;

    // 翻译用户问题
    async function translateQuestion(text) {
        if (!text) {
            hideTranslationBox();
            return;
        }

        const box = document.getElementById('aikifu-translation-box');
        const content = document.getElementById('aikifu-translation-content');
        const emptyState = document.getElementById('aikifu-empty-state');
        const results = document.getElementById('aikifu-results');

        // 如果结果区域已经显示，就不显示翻译框了，避免界面混乱
        if (results && results.style.display !== 'none' && results.style.display !== '') {
            return;
        }

        if (box && content) {
            box.style.display = 'block';
            content.textContent = '正在翻译...';
            content.style.opacity = '0.7';
            
            // 只有当智能建议也不显示时，才去控制 emptyState
            // 但其实 emptyState 应该是由内容决定的
            if (emptyState) emptyState.style.display = 'none';

            try {
                console.log('AIkeFu: 开始翻译文本', text.substring(0, 20) + '...');
                const response = await chrome.runtime.sendMessage({
                    action: 'translateText',
                    text: text
                });

                if (response.error) {
                    throw new Error(response.error);
                }

                content.textContent = response.translation;
                content.style.opacity = '1';
                console.log('AIkeFu: 翻译成功');
            } catch (error) {
                console.error('AIkeFu: 翻译失败', error);
                content.textContent = '翻译失败: ' + error.message;
                content.style.color = '#dc2626';
            }
        }
    }

    function hideTranslationBox() {
        const box = document.getElementById('aikifu-translation-box');
        const emptyState = document.getElementById('aikifu-empty-state');
        
        if (box) box.style.display = 'none';
        
        // 显示 empty state
        if (emptyState) {
            emptyState.style.removeProperty('display');
        }
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 监听用户问题输入，自动翻译
        const questionInput = document.getElementById('aikifu-question');
        if (questionInput) {
            questionInput.addEventListener('input', (e) => {
                const text = e.target.value.trim();
                
                if (translationTimeout) clearTimeout(translationTimeout);
                
                if (text) {
                    translationTimeout = setTimeout(() => {
                        translateQuestion(text);
                    }, 1000); // 1秒防抖
                } else {
                    hideTranslationBox();
                }
            });
        }

        // 优化按钮
        const optimizeBtn = document.getElementById('aikifu-optimize');
        if (optimizeBtn) optimizeBtn.addEventListener('click', optimizeAnswer);
        
        // 清空按钮
        const clearBtn = document.getElementById('aikifu-clear');
        if (clearBtn) clearBtn.addEventListener('click', clearForm);
        
        // 最小化按钮
        const minimizeBtn = document.querySelector('.aikifu-minimize');
        if (minimizeBtn) minimizeBtn.addEventListener('click', toggleMinimize);
        
        // 固定按钮
        const pinBtn = document.getElementById('aikifu-pin');
        if (pinBtn) pinBtn.addEventListener('click', togglePin);

        // 设置按钮
        const settingsBtn = document.getElementById('aikifu-settings');
        if (settingsBtn) settingsBtn.addEventListener('click', showSettings);

        // 设置弹窗按钮
        const saveConfigBtn = document.getElementById('aikifu-config-save');
        if (saveConfigBtn) saveConfigBtn.addEventListener('click', saveConfig);

        const resetConfigBtn = document.getElementById('aikifu-config-reset');
        if (resetConfigBtn) resetConfigBtn.addEventListener('click', resetConfig);

        const closeConfigBtn = document.getElementById('aikifu-config-close');
        if (closeConfigBtn) closeConfigBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideSettings();
        });
        
        // 快速操作按钮
        document.querySelectorAll('.aikifu-quick-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                insertTemplate(this.dataset.template, this);
            });
        });
        
        // 复制按钮
        document.querySelectorAll('.aikifu-copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                copyToClipboard(this.dataset.target, this);
            });
        });
        
        // 快捷键支持
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                optimizeAnswer();
            }
        });
    }
    
    // 插入模板
    function insertTemplate(templateType, btn) {
        const template = quickTemplates[templateType];
        if (template) {
            const answerInput = document.getElementById('aikifu-answer');
            if (answerInput) {
                answerInput.value = template.zh; // 默认使用中文模板
                // 添加视觉反馈
                const targetBtn = btn || event.target;
                if (targetBtn) {
                    targetBtn.style.background = '#10b981';
                    targetBtn.style.color = 'white';
                    targetBtn.style.borderColor = '#10b981';
                    
                    setTimeout(() => {
                        targetBtn.style.background = '';
                        targetBtn.style.color = '';
                        targetBtn.style.borderColor = '';
                    }, 1000);
                }
            }
        }
    }
    
    // 固定/取消固定窗口
    function togglePin() {
        isPinned = !isPinned;
        const pinBtn = document.getElementById('aikifu-pin');
        
        if (isPinned) {
            pinBtn.classList.add('pinned');
            pinBtn.title = '取消固定';
            // 保存固定状态
            localStorage.setItem('aikifu-pinned', 'true');
        } else {
            pinBtn.classList.remove('pinned');
            pinBtn.title = '固定窗口';
            localStorage.setItem('aikifu-pinned', 'false');
        }
    }
    
    // 优化回答
    async function optimizeAnswer() {
        const question = document.getElementById('aikifu-question').value.trim();
        const answer = document.getElementById('aikifu-answer').value.trim();
        
        console.log('AIkeFu: 准备优化回答', { question: question.substring(0, 50), answer: answer.substring(0, 50) });

        if (!question || !answer) {
            console.log('AIkeFu: 输入为空');
            showError('请输入用户问题和您的回答');
            return;
        }
        
        showLoading(true);
        hideError();
        
        try {
            console.log('AIkeFu: 发送消息给后台...');
            const response = await chrome.runtime.sendMessage({
                action: 'optimizeAnswer',
                question: question,
                answer: answer
            });
            console.log('AIkeFu: 收到后台响应', response);
            
            if (response.error) {
                console.error('AIkeFu: 后台返回错误', response.error);
                throw new Error(response.error);
            }
            
            if (!response.optimizedAnswer) {
                console.error('AIkeFu: 响应缺少 optimizedAnswer', response);
                throw new Error('未收到有效回复');
            }

            console.log('AIkeFu: 优化成功，显示结果', response.optimizedAnswer);
            showResults(response.optimizedAnswer);
            
        } catch (error) {
            console.error('AIkeFu: 优化流程异常', error);
            showError(`优化失败: ${error.message}`);
        } finally {
            console.log('AIkeFu: 流程结束，隐藏Loading');
            showLoading(false);
        }
    }
    
    // 显示结果
    function showResults(optimizedAnswer) {
        console.log('AIkeFu: showResults 被调用', optimizedAnswer);
        const zhElem = document.getElementById('aikifu-result-zh');
        const enElem = document.getElementById('aikifu-result-en');
        
        if (zhElem) zhElem.textContent = optimizedAnswer.zh;
        if (enElem) enElem.textContent = optimizedAnswer.optimized_reply;
        
        const emptyState = document.getElementById('aikifu-empty-state');
        if (emptyState) {
            emptyState.style.setProperty('display', 'none', 'important');
        }
        
        const resultsContainer = document.getElementById('aikifu-results');
        if (resultsContainer) {
             resultsContainer.style.setProperty('display', 'flex', 'important');
             console.log('AIkeFu: 结果区域已设置为 visible');
        } else {
             console.error('AIkeFu: 找不到结果区域元素 #aikifu-results');
        }
    }
    
    // 清空表单
    function clearForm() {
        document.getElementById('aikifu-question').value = '';
        document.getElementById('aikifu-answer').value = '';
        
        const results = document.getElementById('aikifu-results');
        if (results) {
            results.style.setProperty('display', 'none', 'important');
        }
        
        document.getElementById('aikifu-error').style.display = 'none';
        
        const emptyState = document.getElementById('aikifu-empty-state');
        if (emptyState) {
            emptyState.style.setProperty('display', 'flex', 'important');
        }
        
        hideError();
    }
    
    // 最小化/展开
    function toggleMinimize() {
        const container = document.getElementById('aikifu-assistant');
        const content = document.querySelector('.aikifu-content');
        const btn = document.querySelector('.aikifu-minimize');
        
        // 切换 minimized 类
        container.classList.toggle('minimized');
        
        if (container.classList.contains('minimized')) {
            content.style.display = 'none';
            btn.textContent = '+';
            btn.title = '展开';
        } else {
            content.style.display = 'flex';
            btn.textContent = '−';
            btn.title = '最小化';
        }
    }
    
    // 显示/隐藏加载状态
    function showLoading(show) {
        const results = document.getElementById('aikifu-results');
        const emptyState = document.getElementById('aikifu-empty-state');
        const optimizeBtn = document.getElementById('aikifu-optimize');
        
        if (show) {
            // 优化中状态
            if (optimizeBtn) {
                optimizeBtn.innerHTML = `
                    <div class="aikifu-spinner" style="width: 16px !important; height: 16px !important; margin: 0 !important; border-width: 2px !important; display: inline-block !important; vertical-align: middle !important;"></div>
                    <span>优化中...</span>
                `;
                optimizeBtn.disabled = true;
                optimizeBtn.style.opacity = '0.7';
                optimizeBtn.style.cursor = 'not-allowed';
            }
            
            if (results) results.style.setProperty('display', 'none', 'important');
            if (emptyState) emptyState.style.setProperty('display', 'none', 'important');
            
            // 显示加载动画
            const rightPanel = document.querySelector('.aikifu-right-panel');
            if (rightPanel) {
                let loading = document.getElementById('aikifu-loading-state');
                if (!loading) {
                    loading = document.createElement('div');
                    loading.id = 'aikifu-loading-state';
                    loading.className = 'aikifu-loading';
                    loading.innerHTML = `
                        <div class="aikifu-spinner"></div>
                        <span>AI正在思考优化方案...</span>
                    `;
                    rightPanel.appendChild(loading);
                }
                loading.style.setProperty('display', 'flex', 'important');
            }
        } else {
            // 恢复正常状态
            if (optimizeBtn) {
                optimizeBtn.textContent = '✨ 优化回答';
                optimizeBtn.disabled = false;
                optimizeBtn.style.opacity = '1';
                optimizeBtn.style.cursor = 'pointer';
            }
            
            // 移除加载动画
            const loading = document.getElementById('aikifu-loading-state');
            if (loading) loading.remove();
        }
    }
    
    // 显示错误
    function showError(message) {
        const error = document.getElementById('aikifu-error');
        error.textContent = message;
        error.style.display = 'block';
    }
    
    // 隐藏错误
    function hideError() {
        document.getElementById('aikifu-error').style.display = 'none';
    }
    
    // 复制到剪贴板
    async function copyToClipboard(elementId, btn) {
        const content = document.getElementById(elementId).textContent;
        
        try {
            await navigator.clipboard.writeText(content);
            
            // 尝试自动填充到页面输入框
            let filled = false;
            // 优先使用 data-testid 查找，这是最准确的
            let targetInput = document.querySelector('textarea[data-testid="text-area"]');
            
            // 如果没找到，尝试使用 class
            if (!targetInput) {
                targetInput = document.querySelector('textarea.mde-text');
            }
            
            if (targetInput) {
                console.log('AIkeFu Assistant: 找到目标输入框', targetInput);
                
                // 1. 设置值
                // 对于 React，需要获取原生 setter 以触发状态更新
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(targetInput, content);
                } else {
                    targetInput.value = content;
                }
                
                // 2. 触发事件
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                // 聚焦输入框
                targetInput.focus();
                
                console.log('AIkeFu Assistant: 已自动填充到页面输入框');
                filled = true;
            } else {
                console.log('AIkeFu Assistant: 未找到目标输入框 (textarea[data-testid="text-area"] 或 textarea.mde-text)');
            }
            
            // 显示成功反馈
            // 如果没有传入 btn (兼容旧调用)，尝试使用 event.target，但在 async 中可能不可靠
            const targetBtn = btn || event.target;
            
            if (targetBtn) {
                const originalText = targetBtn.textContent;
                // 根据是否填充成功显示不同的提示
                targetBtn.textContent = filled ? '✅ 已复制并填充' : '✅ 已复制';
                targetBtn.classList.add('copied');
                
                setTimeout(() => {
                    targetBtn.textContent = originalText;
                    targetBtn.classList.remove('copied');
                }, 2000);
            }
            
        } catch (err) {
            console.error('复制失败:', err);
            showError('复制失败，请手动复制');
        }
    }
    
    // 智能提取页面内容
    function extractPageContent() {
        try {
            let extractedContent = null;
            let contentSource = '';
            
            // 严格模式：只查找用户指定的特定回复内容元素
            // 优先匹配 div.text___1gPRS
            const replyElements = document.querySelectorAll('div.text___1gPRS');
            
            if (replyElements.length > 0) {
                // 如果有多个，优先选择最后一个（通常是最近渲染的）
                let targetElement = replyElements[replyElements.length - 1];
                
                const text = targetElement.textContent.trim();
                if (text.length > 0) {
                    extractedContent = text;
                    contentSource = '特定回复元素(text___1gPRS)';
                }
            } else {
                // 备用方案：尝试匹配包含该类名的元素，防止样式哈希变化（虽然用户指定了固定类名）
                // 仅作为调试或备用，如果用户确定类名固定，此步可作为补充
                const fuzzyElements = document.querySelectorAll('div[class*="text___"]');
                if (fuzzyElements.length > 0) {
                    let targetElement = fuzzyElements[fuzzyElements.length - 1];
                    const text = targetElement.textContent.trim();
                    if (text.length > 0) {
                        extractedContent = text;
                        contentSource = '模糊匹配元素(text___)';
                        console.log('AIkeFu Assistant: 使用模糊匹配找到内容', targetElement.className);
                    }
                }
            }
            
            // 如果提取到内容，进行处理
            if (extractedContent) {
                const questionInput = document.getElementById('aikifu-question');
                
                // 仅当内容不同时才更新，避免光标跳动
                // 如果输入框为空，或者内容与提取的不一致（且不是用户手动修改的），则更新
                // 为了简单起见，如果内容不一致就更新，但为了不打断用户输入，可以加一个检查
                if (questionInput && questionInput.value !== extractedContent) {
                    // 如果输入框有焦点，且已经有内容，可能是用户正在修改，暂时不覆盖
                    if (document.activeElement === questionInput && questionInput.value.trim() !== '') {
                        console.log('AIkeFu Assistant: 用户正在输入，暂不覆盖内容');
                    } else {
                        console.log(`AIkeFu Assistant: 从${contentSource}提取内容并更新:`, extractedContent.substring(0, 50) + '...');
                        questionInput.value = extractedContent;
                        
                        // 触发翻译
                        translateQuestion(extractedContent);
                        
                        showNotification(`已提取用户问题`, 'success');
                    }
                }
            }
            
        } catch (e) {
            console.log('自动提取内容失败:', e);
        }
    }
    
    // 处理URL变化
    function handleUrlChange() {
        const newUrl = window.location.href;
        
        if (newUrl !== currentUrl) {
            console.log('AIkeFu Assistant: URL变化检测', {
                oldUrl: currentUrl,
                newUrl: newUrl
            });
            
            currentUrl = newUrl;
            
            // 如果窗口被固定，不自动隐藏
            if (isPinned) {
                console.log('窗口已固定，不自动隐藏');
                return;
            }
            
            // 检查是否应该显示侧边栏
            if (shouldShowSidebar()) {
                console.log('AIkeFu Assistant: 显示侧边栏');
                createSidebar();
            } else {
                console.log('AIkeFu Assistant: 隐藏侧边栏');
                removeSidebar();
            }
        }
    }
    
    // 初始化
    function init() {
        console.log('AIkeFu Assistant: 初始化SPA支持');
        
        // 恢复固定状态
        const savedPinState = localStorage.getItem('aikifu-pinned');
        if (savedPinState === 'true') {
            isPinned = true;
        }
        
        // 监听URL变化（适用于SPA应用）
        // 方法1: 监听popstate事件
        window.addEventListener('popstate', handleUrlChange);
        
        // 方法2: 监听hashchange事件（适用于hash路由）
        window.addEventListener('hashchange', handleUrlChange);
        
        // 方法3: 监听pushState和replaceState（适用于history API）
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            originalPushState.apply(this, args);
            setTimeout(handleUrlChange, 100); // 延迟执行，确保路由完成
        };
        
        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            setTimeout(handleUrlChange, 100);
        };
        
        // 方法4: 监听URL变化的轮询（备用方案）
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                handleUrlChange();
            }
        }, 1000);
        
        // 初始检查
        setTimeout(() => {
            if (shouldShowSidebar()) {
                createSidebar();
                // 如果是固定状态，设置按钮状态
                if (isPinned) {
                    const pinBtn = document.getElementById('aikifu-pin');
                    if (pinBtn) {
                        pinBtn.classList.add('pinned');
                        pinBtn.title = '取消固定';
                    }
                }
            }
        }, 500);
        
        console.log('AIkeFu Assistant: SPA支持初始化完成');
    }
    
    // 启动
    init();
    
    // ===== 新功能函数 =====
    
    // 智能模板推荐
    function recommendTemplate(userInput) {
        const keywords = {
            greeting: ['你好', '您好', 'hello', 'hi', '联系'],
            thanks: ['谢谢', '感谢', 'thank', 'appreciate'],
            apology: ['抱歉', '对不起', '抱歉', 'sorry', 'apologize'],
            help: ['帮助', '协助', 'help', 'assist', '支持', '问题']
        };
        
        const lowerInput = userInput.toLowerCase();
        let bestMatch = null;
        let maxScore = 0;
        
        for (const [template, words] of Object.entries(keywords)) {
            const score = words.reduce((acc, word) => 
                acc + (lowerInput.includes(word) ? 1 : 0), 0);
            if (score > maxScore) {
                maxScore = score;
                bestMatch = template;
            }
        }
        
        return bestMatch;
    }
    
    // 自动保存草稿
    function saveDraft() {
        const input = document.getElementById('aikifu-user-input');
        if (input && input.value.trim()) {
            localStorage.setItem('aikifu-draft', input.value);
            localStorage.setItem('aikifu-draft-time', new Date().toISOString());
            console.log('草稿已保存');
        }
    }
    
    // 恢复草稿
    function restoreDraft() {
        const draft = localStorage.getItem('aikifu-draft');
        const draftTime = localStorage.getItem('aikifu-draft-time');
        
        if (draft && draftTime) {
            const input = document.getElementById('aikifu-user-input');
            if (input && !input.value.trim()) {
                const timeDiff = Date.now() - new Date(draftTime).getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                if (hoursDiff < 24) { // 24小时内有效
                    input.value = draft;
                    console.log('草稿已恢复');
                    return true;
                }
            }
        }
        return false;
    }
    
    // 清除草稿
    function clearDraft() {
        localStorage.removeItem('aikifu-draft');
        localStorage.removeItem('aikifu-draft-time');
        console.log('草稿已清除');
    }
    
    // 快捷键支持
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Enter 发送
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const sendBtn = document.getElementById('aikifu-send-btn');
                if (sendBtn && !sendBtn.disabled) {
                    sendBtn.click();
                }
            }
            
            // Ctrl/Cmd + S 保存草稿
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveDraft();
                showNotification('草稿已保存');
            }
            
            // Esc 关闭侧边栏（如果未固定）
            if (e.key === 'Escape' && !isPinned) {
                removeSidebar();
            }
        });
    }
    
    // 显示通知
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `aikifu-notification aikifu-notification-${type}`;
        notification.textContent = message;
        
        // 样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 智能输入提示
    function setupInputSuggestions() {
        const input = document.getElementById('aikifu-user-input');
        if (!input) return;
        
        let suggestionTimeout;
        
        input.addEventListener('input', function() {
            clearTimeout(suggestionTimeout);
            
            if (this.value.length > 2) {
                suggestionTimeout = setTimeout(() => {
                    const recommended = recommendTemplate(this.value);
                    if (recommended && quickTemplates[recommended]) {
                        showTemplateSuggestion(recommended);
                    }
                }, 500);
            }
        });
    }
    
    // 显示模板建议
    function showTemplateSuggestion(templateType) {
        const template = quickTemplates[templateType];
        const text = template[getCurrentLang()] || template.zh;
        
        const suggestion = document.createElement('div');
        suggestion.className = 'aikifu-suggestion';
        suggestion.innerHTML = `
            <span>💡 建议使用模板：</span>
            <span class="suggestion-text">${text}</span>
            <button class="suggestion-apply">使用</button>
            <button class="suggestion-close">×</button>
        `;
        
        suggestion.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            background: #e3f2fd;
            border: 1px solid #2196F3;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 1000;
        `;
        
        const inputContainer = document.querySelector('.aikifu-input-container');
        if (inputContainer) {
            inputContainer.style.position = 'relative';
            inputContainer.appendChild(suggestion);
            
            suggestion.querySelector('.suggestion-apply').onclick = () => {
                const input = document.getElementById('aikifu-user-input');
                if (input) {
                    input.value = text;
                    suggestion.remove();
                }
            };
            
            suggestion.querySelector('.suggestion-close').onclick = () => {
                suggestion.remove();
            };
            
            // 5秒后自动消失
            setTimeout(() => {
                if (suggestion.parentNode) {
                    suggestion.remove();
                }
            }, 5000);
        }
    }
    
    // 获取当前语言
    function getCurrentLang() {
        return navigator.language.startsWith('zh') ? 'zh' : 'en';
    }
    

    

    
    // 增强的侧边栏创建函数
    const originalCreateSidebar = createSidebar;
    createSidebar = function() {
        originalCreateSidebar();
        
        // 添加新功能
        setTimeout(() => {
            setupKeyboardShortcuts();
            setupInputSuggestions();
            restoreDraft();
            
            // 自动保存草稿（每30秒）
            setInterval(saveDraft, 30000);
            
            console.log('AIkeFu Assistant: 新功能已加载');
        }, 1000);
    };
    
})();