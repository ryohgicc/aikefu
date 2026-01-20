// AIkeFu Assistant - SPA支持内容脚本
// 支持单页应用导航变化检测

(function() {
    'use strict';
    
    console.log('AIkeFu Assistant: SPA内容脚本启动');
    
    let sidebarElement = null;
    let currentUrl = window.location.href;
    let isInjected = false;
    
    // 检测是否应该显示侧边栏
    function shouldShowSidebar() {
        const url = window.location.href;
        // 匹配 /任意内容/feedback/reply/任意内容 的URL模式
        const pattern = /\/feedback\/reply\/[^\/]+$/;
        return pattern.test(url);
    }
    
    // 创建侧边栏
    function createSidebar() {
        if (sidebarElement) {
            console.log('侧边栏已存在');
            return;
        }
        
        console.log('AIkeFu Assistant: 创建侧边栏');
        
        const container = document.createElement('div');
        container.id = 'aikifu-assistant';
        container.innerHTML = `
            <div class="aikifu-header">
                <span class="aikifu-title">🤖 AI客服助手</span>
                <button class="aikifu-minimize" title="最小化">−</button>
            </div>
            <div class="aikifu-content">
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
                <div class="aikifu-loading" id="aikifu-loading" style="display:none;">
                    <div class="aikifu-spinner"></div>
                    <span>AI优化中...</span>
                </div>
                <div class="aikifu-results" id="aikifu-results" style="display:none;">
                    <div class="aikifu-result">
                        <div class="aikifu-result-title">中文优化：</div>
                        <div class="aikifu-result-content" id="aikifu-result-zh"></div>
                        <button class="aikifu-copy-btn" data-target="aikifu-result-zh">📋 复制</button>
                    </div>
                    <div class="aikifu-result">
                        <div class="aikifu-result-title">原语言优化：</div>
                        <div class="aikifu-result-content" id="aikifu-result-en"></div>
                        <button class="aikifu-copy-btn" data-target="aikifu-result-en">📋 复制</button>
                    </div>
                </div>
                <div class="aikifu-error" id="aikifu-error" style="display:none;"></div>
            </div>
        `;
        
        // 注入样式
        injectStyles();
        
        document.body.appendChild(container);
        sidebarElement = container;
        
        setupEventListeners();
        
        // 尝试提取页面内容
        setTimeout(extractPageContent, 1000);
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
        if (document.getElementById('aikifu-styles')) {
            return; // 样式已存在
        }
        
        const style = document.createElement('style');
        style.id = 'aikifu-styles';
        style.textContent = `
            #aikifu-assistant {
                position: fixed !important;
                left: 0 !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                width: 320px !important;
                background: #ffffff !important;
                border: 1px solid #e1e5e9 !important;
                border-radius: 0 8px 8px 0 !important;
                box-shadow: 0 2px 12px rgba(0,0,0,0.15) !important;
                z-index: 2147483647 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                font-size: 14px !important;
                line-height: 1.4 !important;
                color: #333 !important;
            }
            
            .aikifu-header {
                background: linear-gradient(135deg, #2196F3, #21CBF3) !important;
                color: white !important;
                padding: 12px 16px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                border-radius: 0 8px 0 0 !important;
            }
            
            .aikifu-title {
                font-weight: 600 !important;
                font-size: 15px !important;
            }
            
            .aikifu-minimize {
                background: rgba(255,255,255,0.2) !important;
                border: none !important;
                color: white !important;
                width: 24px !important;
                height: 24px !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 16px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            .aikifu-minimize:hover {
                background: rgba(255,255,255,0.3) !important;
            }
            
            .aikifu-content {
                padding: 16px !important;
                max-height: 500px !important;
                overflow-y: auto !important;
            }
            
            .aikifu-content.collapsed {
                display: none !important;
            }
            
            .aikifu-input-group {
                margin-bottom: 12px !important;
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
                min-height: 60px !important;
                padding: 8px 12px !important;
                border: 1px solid #d1d5db !important;
                border-radius: 6px !important;
                font-family: inherit !important;
                font-size: 13px !important;
                resize: vertical !important;
                background: #fafbfc !important;
                transition: border-color 0.2s, box-shadow 0.2s !important;
            }
            
            .aikifu-input:focus {
                outline: none !important;
                border-color: #2196F3 !important;
                box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1) !important;
                background: white !important;
            }
            
            .aikifu-buttons {
                display: flex !important;
                gap: 8px !important;
                margin-bottom: 12px !important;
            }
            
            .aikifu-optimize-btn {
                flex: 1 !important;
                padding: 10px 16px !important;
                background: linear-gradient(135deg, #2196F3, #21CBF3) !important;
                color: white !important;
                border: none !important;
                border-radius: 6px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s !important;
                font-size: 14px !important;
            }
            
            .aikifu-optimize-btn:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
            }
            
            .aikifu-optimize-btn:active {
                transform: translateY(0) !important;
            }
            
            .aikifu-clear-btn {
                padding: 10px 16px !important;
                background: #f3f4f6 !important;
                color: #6b7280 !important;
                border: 1px solid #d1d5db !important;
                border-radius: 6px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s !important;
                font-size: 14px !important;
            }
            
            .aikifu-clear-btn:hover {
                background: #e5e7eb !important;
                color: #374151 !important;
            }
            
            .aikifu-loading {
                text-align: center !important;
                padding: 16px !important;
                background: #f8fafc !important;
                border-radius: 6px !important;
                margin: 8px 0 !important;
            }
            
            .aikifu-spinner {
                width: 24px !important;
                height: 24px !important;
                border: 3px solid #e5e7eb !important;
                border-top: 3px solid #2196F3 !important;
                border-radius: 50% !important;
                animation: aikifu-spin 1s linear infinite !important;
                margin: 0 auto 8px !important;
            }
            
            @keyframes aikifu-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .aikifu-loading span {
                color: #6b7280 !important;
                font-size: 13px !important;
            }
            
            .aikifu-results {
                margin-top: 12px !important;
            }
            
            .aikifu-result {
                background: #f8fafc !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 6px !important;
                padding: 12px !important;
                margin-bottom: 8px !important;
            }
            
            .aikifu-result-title {
                font-weight: 600 !important;
                color: #374151 !important;
                margin-bottom: 6px !important;
                font-size: 13px !important;
            }
            
            .aikifu-result-content {
                background: white !important;
                padding: 8px 12px !important;
                border: 1px solid #d1d5db !important;
                border-radius: 4px !important;
                margin-bottom: 6px !important;
                font-size: 13px !important;
                line-height: 1.5 !important;
                min-height: 32px !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
            }
            
            .aikifu-copy-btn {
                padding: 4px 10px !important;
                background: white !important;
                border: 1px solid #d1d5db !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 12px !important;
                color: #6b7280 !important;
                transition: all 0.2s !important;
            }
            
            .aikifu-copy-btn:hover {
                background: #f3f4f6 !important;
                color: #374151 !important;
                border-color: #9ca3af !important;
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
        `;
        
        document.head.appendChild(style);
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 优化按钮
        document.getElementById('aikifu-optimize').addEventListener('click', optimizeAnswer);
        
        // 清空按钮
        document.getElementById('aikifu-clear').addEventListener('click', clearForm);
        
        // 最小化按钮
        document.querySelector('.aikifu-minimize').addEventListener('click', toggleMinimize);
        
        // 复制按钮
        document.querySelectorAll('.aikifu-copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                copyToClipboard(this.dataset.target);
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
    
    // 优化回答
    async function optimizeAnswer() {
        const question = document.getElementById('aikifu-question').value.trim();
        const answer = document.getElementById('aikifu-answer').value.trim();
        
        if (!question || !answer) {
            showError('请输入用户问题和您的回答');
            return;
        }
        
        showLoading(true);
        hideError();
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'optimizeAnswer',
                question: question,
                answer: answer
            });
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            showResults(response.optimizedAnswer);
            
        } catch (error) {
            console.error('AI优化失败:', error);
            showError(`优化失败: ${error.message}`);
        } finally {
            showLoading(false);
        }
    }
    
    // 显示结果
    function showResults(optimizedAnswer) {
        document.getElementById('aikifu-result-zh').textContent = optimizedAnswer.zh;
        document.getElementById('aikifu-result-en').textContent = optimizedAnswer.optimized_reply;
        document.getElementById('aikifu-results').style.display = 'block';
    }
    
    // 清空表单
    function clearForm() {
        document.getElementById('aikifu-question').value = '';
        document.getElementById('aikifu-answer').value = '';
        document.getElementById('aikifu-results').style.display = 'none';
        document.getElementById('aikifu-error').style.display = 'none';
    }
    
    // 最小化/展开
    function toggleMinimize() {
        const content = document.querySelector('.aikifu-content');
        const btn = document.querySelector('.aikifu-minimize');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            btn.textContent = '−';
            btn.title = '最小化';
        } else {
            content.style.display = 'none';
            btn.textContent = '+';
            btn.title = '展开';
        }
    }
    
    // 显示/隐藏加载状态
    function showLoading(show) {
        const loading = document.getElementById('aikifu-loading');
        const results = document.getElementById('aikifu-results');
        
        if (show) {
            loading.style.display = 'block';
            results.style.display = 'none';
        } else {
            loading.style.display = 'none';
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
    async function copyToClipboard(elementId) {
        const content = document.getElementById(elementId).textContent;
        
        try {
            await navigator.clipboard.writeText(content);
            
            // 显示成功反馈
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制';
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);
            
        } catch (err) {
            console.error('复制失败:', err);
            showError('复制失败，请手动复制');
        }
    }
    
    // 智能提取页面内容
    function extractPageContent() {
        try {
            // 尝试提取页面中的用户反馈内容
            const feedbackElements = document.querySelectorAll('[class*="feedback"], [class*="content"], [class*="message"]');
            
            for (let element of feedbackElements) {
                const text = element.textContent.trim();
                if (text.length > 10 && text.length < 500) {
                    // 自动填充到问题输入框
                    const questionInput = document.getElementById('aikifu-question');
                    if (questionInput && !questionInput.value) {
                        questionInput.value = text;
                        break;
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
            }
        }, 1000);
        
        console.log('AIkeFu Assistant: SPA支持初始化完成');
    }
    
    // 启动
    init();
    
})();