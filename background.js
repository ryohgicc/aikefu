// 配置项现在通过配置管理器获取

// 监听来自popup.js的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'optimizeAnswer') {
    optimizeAnswer(request.question, request.answer)
      .then(result => {
        try {
          const parsedResult = JSON.parse(result);
          if (parsedResult && typeof parsedResult === 'object' && parsedResult.zh && parsedResult.en) {
            sendResponse({ optimizedAnswer: parsedResult }); // 成功解析
          } else {
            // JSON 结构不符合预期
            console.error('API返回的JSON格式不正确:', result);
            sendResponse({
              error: 'Invalid JSON Structure',
              rawResponse: result // 发送原始响应
            });
          }
        } catch (e) {
          // JSON 解析失败
          console.error('解析API响应时出错:', e, '原始响应:', result);
          sendResponse({
            error: 'JSON Parse Error',
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
    // 获取配置
    const config = await configManager.getConfig();
    
    // 验证配置
    if (!config.apiKey || !config.baseUrl || !config.model) {
      throw new Error('API配置不完整，请先配置API密钥、Base URL和Model');
    }

    const systemPrompt = `你是一个健康app的客服，需要具备以下能力：
沟通能力：能清晰表达和耐心倾听客户需求。
服务意识：有耐心，态度热情，愿意主动帮助客户。
专业知识：熟悉产品和服务，能快速解答客户问题。
应变能力：遇到突发状况能冷静处理。
团队协作：能与同事配合，共同解决客户问题。
我会给你输入用户的问题和我的答案，帮我用修改我的措辞并回复用户。你的回复需要用专业的语气，先安抚用户情绪，然后再给出解决方案。内容尽量通俗易懂，但不要太多语气词和客套。
    以下是用户的问题："${question}"
    以下是我的答案："${answer}"
    请你修改我的回复，并同时提供中文和英文两个版本。请严格按照以下 JSON 格式返回，不要包含任何其他解释或内容：
    {
      "zh": "优化后的中文回复",
      "en": "Optimized English reply"
    };`

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API错误: ${errorData.error?.message || '未知错误'}`);
    }

    const data = await response.json();
    // 直接返回API响应中的content，它应该是我们要求的JSON字符串
    return data.choices[0]?.message?.content || '{"zh": "无法获取优化后的回答", "en": "Unable to get optimized answer"}';
  } catch (error) {
    console.error('API调用错误:', error);
    // 返回一个表示错误的JSON字符串，以便前端可以处理
    return `{"zh": "API调用错误: ${error.message}", "en": "API call error: ${error.message}"}`;
  }
}