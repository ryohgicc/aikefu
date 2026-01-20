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
}

// 创建配置管理器实例
const configManager = new ConfigManager();

// 监听来自popup.js的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'optimizeAnswer') {
    optimizeAnswer(request.question, request.answer)
      .then(result => {
        try {
          const parsedResult = JSON.parse(result);
          console.log('解析API响应成功:', parsedResult);
          
          // 检查新的JSON结构（适配自动语言识别格式）
          if (parsedResult && typeof parsedResult === 'object' && 
              parsedResult.zh && parsedResult.optimized_reply && parsedResult.detected_language) {
            sendResponse({ 
              optimizedAnswer: parsedResult
              // rawApiResponse: result // 发送原始API响应便于调试（已注释）
            }); // 成功解析
          } else {
            // JSON 结构不符合预期
            console.error('API返回的JSON格式不正确:', {
              result: result,
              parsedResult: parsedResult,
              missingFields: {
                hasZh: !!parsedResult.zh,
                hasOptimizedReply: !!parsedResult.optimized_reply,
                hasDetectedLanguage: !!parsedResult.detected_language
              }
            });
            sendResponse({
              error: 'Invalid JSON Structure',
              details: '响应缺少必要字段，需要: zh, optimized_reply, detected_language',
              rawResponse: result // 发送原始响应
              // rawApiResponse: result // 发送原始API响应便于调试（已注释）
            });
          }
        } catch (e) {
          // JSON 解析失败
          console.error('解析API响应时出错:', e, '原始响应:', result);
          sendResponse({
            error: 'JSON Parse Error',
            details: e.message,
            rawResponse: result // 发送原始响应
          });
        }
      })
      .catch(error => {
          // API 调用或其他错误
          console.error('optimizeAnswer 内部错误:', error);
          sendResponse({ error: error.message, rawResponse: `API 调用失败: ${error.message}` });
       });

    return true; // 异步响应
  }
});

// 调用API优化回答
async function optimizeAnswer(question, answer) {
  try {
    console.log('开始优化回答，问题:', question.substring(0, 50) + '...');
    
    // 获取配置
    let config;
    try {
      config = await configManager.getConfig();
      console.log('获取配置成功:', {
        hasApiKey: !!config.apiKey,
        hasBaseUrl: !!config.baseUrl,
        hasModel: !!config.model,
        baseUrl: config.baseUrl
      });
    } catch (configError) {
      console.error('获取配置失败:', configError);
      throw new Error(`配置获取失败: ${configError.message}`);
    }
    
    // 验证配置
    if (!config.apiKey || !config.baseUrl || !config.model) {
      const missingFields = [];
      if (!config.apiKey) missingFields.push('API密钥');
      if (!config.baseUrl) missingFields.push('Base URL');
      if (!config.model) missingFields.push('模型名称');
      
      throw new Error(`API配置不完整，缺少: ${missingFields.join(', ')}。请先完善配置后再使用。`);
    }

    console.log('准备发送API请求，配置信息:', {
      baseUrl: config.baseUrl,
      model: config.model,
      hasApiKey: !!config.apiKey,
      apiKeyPreview: config.apiKey ? config.apiKey.substring(0, 8) + '...' : '无'
    });

    const systemPrompt = `你是一个健康app的客服，需要具备以下能力：
沟通能力：能清晰表达和耐心倾听客户需求。
服务意识：有耐心，态度热情，愿意主动帮助客户。
专业知识：熟悉产品和服务，能快速解答客户问题。
应变能力：遇到突发状况能冷静处理。
团队协作：能与同事配合，共同解决客户问题。
我会给你输入用户的问题和我的答案，帮我用修改我的措辞并回复用户。你的回复需要用专业的语气，先安抚用户情绪，然后再给出解决方案。内容尽量通俗易懂，但不要太多语气词和客套。
    
    首先，请分析用户问题的语言，然后按照以下要求处理：
    1. 识别用户问题使用的语言
    2. 优化我的回答，使其更专业、更有同理心
    3. 同时提供中文版本和与用户问题相同语言的版本
    
    以下是用户的问题："${question}"
    以下是我的答案："${answer}"
    
    请严格按照以下 JSON 格式返回，不要包含任何其他解释或内容：
    {
      "zh": "优化后的中文回复",
      "detected_language": "检测到的语言代码",
      "optimized_reply": "用检测到的语言优化后的回复"
    };`

    const requestBody = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt }
      ]
    };
    
    console.log('发送API请求:', {
      url: `${config.baseUrl}/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey.substring(0, 8)}...`
      },
      body: requestBody
    });

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('API错误详情:', errorData);
      } catch (jsonError) {
        const errorText = await response.text();
        errorMessage = `API错误: ${response.status} ${response.statusText}. 响应: ${errorText}`;
        console.error('API非JSON错误响应:', errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('API响应数据:', data);
    
    // 检查响应结构
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('API响应结构不符合预期:', data);
      throw new Error(`API响应结构错误: 缺少预期的消息内容。响应结构: ${JSON.stringify(data, null, 2)}`);
    }
    
    const content = data.choices[0].message.content;
    console.log('提取到的回复内容:', content);
    
    // 清洗内容：去除可能的 Markdown 代码块标记
    let cleanContent = content.trim();
    // 移除开头的 ```json 或 ```
    if (cleanContent.startsWith('```')) {
        const firstNewline = cleanContent.indexOf('\n');
        if (firstNewline !== -1) {
            cleanContent = cleanContent.substring(firstNewline + 1);
        }
    }
    // 移除结尾的 ```
    if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.substring(0, cleanContent.length - 3);
    }
    cleanContent = cleanContent.trim();
    
    // 尝试解析返回的内容确保它是有效的JSON（调试用，日志已简化）
    try {
        const parsedContent = JSON.parse(cleanContent);
        // console.log('内容解析成功:', parsedContent); // 调试用，已注释
        // 重新序列化以确保返回标准 JSON 字符串
        return JSON.stringify(parsedContent);
    } catch (e) {
        console.error('返回的内容不是有效的JSON:', content);
        // 尝试修复常见的 JSON 错误（如未转义的引号），或者直接抛出
        throw new Error(`API返回的内容不是有效的JSON格式: ${content}`);
    }
  } catch (error) {
    console.error('API调用错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // 返回更详细的错误信息给前端
    const errorResponse = {
      zh: `API调用错误: ${error.message}`,
      en: `API call error: ${error.message}`,
      detected_language: 'en',
      optimized_reply: `Error: ${error.message}`
    };
    return JSON.stringify(errorResponse);
  }
}