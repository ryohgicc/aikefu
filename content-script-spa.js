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
                    <button class="aikifu-pin-btn" id="aikifu-pin" title="固定窗口">📌</button>
                    <button class="aikifu-minimize" title="最小化">−</button>
                </div>
            </div>
            <div class="aikifu-content">
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
                <div class="aikifu-loading" id="aikifu-loading" style="display:none;">
                    <div class="aikifu-spinner"></div>
                    <span>AI优化中...</span>
                </div>
                <div class="aikifu-results" id="aikifu-results" style="display:none;">
                    <div class="aikifu-result">
                        <div class="aikifu-result-header">
                            <div class="aikifu-result-title">中文优化版本</div>
                            <div class="aikifu-result-lang">🇨🇳</div>
                        </div>
                        <div class="aikifu-result-content" id="aikifu-result-zh"></div>
                        <button class="aikifu-copy-btn" data-target="aikifu-result-zh">📋 复制中文版本</button>
                    </div>
                    <div class="aikifu-result">
                        <div class="aikifu-result-header">
                            <div class="aikifu-result-title">原语言优化版本</div>
                            <div class="aikifu-result-lang">🌍</div>
                        </div>
                        <div class="aikifu-result-content" id="aikifu-result-en"></div>
                        <button class="aikifu-copy-btn" data-target="aikifu-result-en">📋 复制原语言版本</button>
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
                top: 0 !important;
                width: 400px !important;
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
            }
            
            .aikifu-header {
                background: linear-gradient(135deg, #2196F3, #21CBF3) !important;
                color: white !important;
                padding: 20px 24px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                border-bottom: 1px solid rgba(255,255,255,0.2) !important;
                flex-shrink: 0 !important;
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
            
            .aikifu-content {
                padding: 20px !important;
                flex: 1 !important;
                overflow-y: auto !important;
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
                min-height: 80px !important;
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
                margin-bottom: 24px !important;
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
                margin-top: 24px !important;
                flex: 1 !important;
                overflow-y: auto !important;
            }
            
            .aikifu-result {
                background: linear-gradient(135deg, #f0f9ff, #e0f2fe) !important;
                border: 1px solid #bae6fd !important;
                border-radius: 12px !important;
                padding: 16px !important;
                margin-bottom: 12px !important;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1) !important;
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
                background: white !important;
                padding: 16px !important;
                border: 2px solid #dbeafe !important;
                border-radius: 8px !important;
                margin-bottom: 12px !important;
                font-size: 14px !important;
                line-height: 1.6 !important;
                min-height: 60px !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.05) !important;
            }
            
            .aikifu-copy-btn {
                padding: 8px 16px !important;
                background: linear-gradient(135deg, #3b82f6, #60a5fa) !important;
                border: none !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 13px !important;
                color: white !important;
                font-weight: 500 !important;
                transition: all 0.2s !important;
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
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
            
            /* 自定义滚动条 */
            .aikifu-content::-webkit-scrollbar {
                width: 8px !important;
            }
            
            .aikifu-content::-webkit-scrollbar-track {
                background: #f1f5f9 !important;
                border-radius: 4px !important;
            }
            
            .aikifu-content::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 4px !important;
            }
            
            .aikifu-content::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
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
        
        // 固定按钮
        document.getElementById('aikifu-pin').addEventListener('click', togglePin);
        
        // 快速操作按钮
        document.querySelectorAll('.aikifu-quick-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                insertTemplate(this.dataset.template);
            });
        });
        
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
    
    // 插入模板
    function insertTemplate(templateType) {
        const template = quickTemplates[templateType];
        if (template) {
            const answerInput = document.getElementById('aikifu-answer');
            if (answerInput) {
                answerInput.value = template.zh; // 默认使用中文模板
                // 添加视觉反馈
                const btn = event.target;
                btn.style.background = '#10b981';
                btn.style.color = 'white';
                btn.style.borderColor = '#10b981';
                
                setTimeout(() => {
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.style.borderColor = '';
                }, 1000);
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
            let extractedContent = null;
            let contentSource = '';
            
            // 优先查找特定的回复内容元素
            const replyContent = document.querySelector('div.text___1gPRS');
            if (replyContent) {
                const text = replyContent.textContent.trim();
                if (text.length > 0) {
                    extractedContent = text;
                    contentSource = '特定回复元素';
                }
            }
            
            // 备用方案：尝试提取页面中的用户反馈内容
            if (!extractedContent) {
                const feedbackElements = document.querySelectorAll('[class*="feedback"], [class*="content"], [class*="message"]');
                
                for (let element of feedbackElements) {
                    const text = element.textContent.trim();
                    if (text.length > 10 && text.length < 500) {
                        extractedContent = text;
                        contentSource = '反馈内容元素';
                        break;
                    }
                }
            }
            
            // 如果提取到内容，进行智能处理
            if (extractedContent) {
                console.log(`AIkeFu Assistant: 从${contentSource}提取内容:`, extractedContent.substring(0, 50) + '...');
                
                // 分析内容并生成智能回复
                const smartReply = generateSmartReply(extractedContent);
                console.log('AIkeFu Assistant: 内容分析结果:', smartReply.analysis);
                
                // 填充到问题输入框
                const questionInput = document.getElementById('aikifu-question');
                if (questionInput && !questionInput.value) {
                    questionInput.value = extractedContent;
                }
                
                // 填充到答案输入框（提供智能回复建议）
                const answerInput = document.getElementById('aikifu-answer');
                if (answerInput && !answerInput.value) {
                    answerInput.value = smartReply.primaryReply;
                    answerInput.placeholder = `智能回复建议: ${smartReply.primaryReply}`;
                    
                    // 如果有多个建议，显示在结果区域
                    if (smartReply.suggestions.length > 1) {
                        const resultsDiv = document.getElementById('aikifu-results');
                        if (resultsDiv) {
                            resultsDiv.innerHTML = `
                                <div style="margin-bottom: 10px; padding: 10px; background: #e3f2fd; border-radius: 4px; border-left: 3px solid #2196F3;">
                                    <strong>💡 智能回复建议:</strong><br>
                                    ${smartReply.suggestions.map((suggestion, index) => 
                                        `<div style="margin: 5px 0; cursor: pointer; padding: 5px; border-radius: 3px;" 
                                              onclick="document.getElementById('aikifu-answer').value='${suggestion.replace(/'/g, "\\'")}'"
                                              onmouseover="this.style.background='#bbdefb'"
                                              onmouseout="this.style.background='none'">
                                            ${index + 1}. ${suggestion}
                                        </div>`
                                    ).join('')}
                                </div>
                            `;
                            resultsDiv.style.display = 'block';
                        }
                    }
                }
                
                // 显示通知
                showNotification(`已提取${contentSource}内容并生成智能回复建议`, 'success');
            }
            
        } catch (e) {
            console.log('自动提取内容失败:', e);
            showNotification('自动提取内容失败', 'error');
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
    
    // 智能内容分析
    function analyzeContent(content) {
        const analysis = {
            type: 'unknown',
            sentiment: 'neutral',
            category: 'general',
            keyPoints: []
        };
        
        // 情感分析
        const positiveWords = ['好', '棒', '优秀', '满意', '感谢', '谢谢', 'good', 'great', 'excellent', 'satisfied', 'thank'];
        const negativeWords = ['差', '坏', '糟糕', '失望', '问题', '错误', 'bad', 'terrible', 'disappointed', 'problem', 'error'];
        
        const lowerContent = content.toLowerCase();
        const hasPositive = positiveWords.some(word => lowerContent.includes(word));
        const hasNegative = negativeWords.some(word => lowerContent.includes(word));
        
        if (hasPositive && !hasNegative) {
            analysis.sentiment = 'positive';
        } else if (hasNegative && !hasPositive) {
            analysis.sentiment = 'negative';
        }
        
        // 类型识别
        if (lowerContent.includes('问题') || lowerContent.includes('错误') || lowerContent.includes('problem') || lowerContent.includes('error')) {
            analysis.type = 'issue';
            analysis.category = 'technical';
        } else if (lowerContent.includes('建议') || lowerContent.includes('反馈') || lowerContent.includes('suggestion') || lowerContent.includes('feedback')) {
            analysis.type = 'suggestion';
            analysis.category = 'improvement';
        } else if (lowerContent.includes('感谢') || lowerContent.includes('谢谢') || lowerContent.includes('thank')) {
            analysis.type = 'appreciation';
            analysis.category = 'positive';
        }
        
        // 提取关键点
        const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 5);
        analysis.keyPoints = sentences.slice(0, 3).map(s => s.trim());
        
        return analysis;
    }
    
    // 生成智能回复建议
    function generateSmartReply(content) {
        const analysis = analyzeContent(content);
        const lang = getCurrentLang();
        
        let suggestions = [];
        
        if (analysis.sentiment === 'positive') {
            suggestions.push(lang === 'zh' ? 
                '感谢您的好评和支持！我们会继续努力提供更好的服务。' : 
                'Thank you for your positive feedback! We will continue to strive to provide better service.');
        } else if (analysis.sentiment === 'negative') {
            suggestions.push(lang === 'zh' ? 
                '非常抱歉给您带来了不好的体验。我们会认真对待您的反馈并立即改进。' : 
                'We sincerely apologize for the negative experience. We take your feedback seriously and will improve immediately.');
        }
        
        if (analysis.type === 'issue') {
            suggestions.push(lang === 'zh' ? 
                '我们已收到您报告的问题，技术团队会尽快调查并解决。' : 
                'We have received the issue you reported, and our technical team will investigate and resolve it as soon as possible.');
        } else if (analysis.type === 'suggestion') {
            suggestions.push(lang === 'zh' ? 
                '感谢您的宝贵建议！我们会认真考虑并在后续版本中优化。' : 
                'Thank you for your valuable suggestion! We will consider it carefully and optimize it in future versions.');
        }
        
        // 通用回复
        if (suggestions.length === 0) {
            suggestions.push(lang === 'zh' ? 
                '感谢您的反馈！我们会认真处理您的意见。' : 
                'Thank you for your feedback! We will handle your comments carefully.');
        }
        
        return {
            analysis: analysis,
            suggestions: suggestions,
            primaryReply: suggestions[0]
        };
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