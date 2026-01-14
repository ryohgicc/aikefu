document.addEventListener('DOMContentLoaded', function() {
  const inputForm = document.getElementById('input-form');
  const loadingSection = document.getElementById('loading');
  const resultSection = document.getElementById('result');
  const questionInput = document.getElementById('question');
  const answerInput = document.getElementById('answer');
  const configBtn = document.getElementById('configBtn');
  // 获取新的结果显示区域和按钮
  const optimizedAnswerZhDiv = document.getElementById('optimized-answer-zh');
  const optimizedAnswerEnDiv = document.getElementById('optimized-answer-en');
  const submitBtn = document.getElementById('submit-btn');
  const continueBtn = document.getElementById('continue-btn');
  const copyBtnZh = document.getElementById('copy-btn-zh');
  const copyBtnEn = document.getElementById('copy-btn-en');
  // 新增：获取原始响应区域元素
  const rawResponseSection = document.getElementById('raw-response-section');
  const rawResponseContentDiv = document.getElementById('raw-response-content');

  // 配置按钮点击事件
  configBtn.addEventListener('click', function() {
    window.location.href = 'config.html';
  });

  // 页面加载时恢复缓存的数据
  restoreFromCache();

  // 监听输入框内容变化
  questionInput.addEventListener('input', debounce(function() {
    saveInputToCache();
  }, 500));

  answerInput.addEventListener('input', debounce(function() {
    saveInputToCache();
  }, 500));

  // 保存输入框内容到缓存
  function saveInputToCache() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    
    saveToCache({
      question: question,
      answer: answer,
      state: 'input'
    });
  }

  // 提交按钮点击事件
  submitBtn.addEventListener('click', async function() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    
    if (!question || !answer) {
      alert('请填写用户问题和您的回答！');
      return;
    }
    
    // 保存输入到缓存
    saveToCache({
      question: question,
      answer: answer,
      state: 'input'
    });
    
    // 显示加载状态
    inputForm.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    
    try {
      // 发送消息到background.js处理API请求
      const response = await chrome.runtime.sendMessage({
        action: 'optimizeAnswer',
        question: question,
        answer: answer
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // 检查返回的数据结构
      if (response.optimizedAnswer && response.optimizedAnswer.zh && response.optimizedAnswer.en) {
        // 显示结果
        optimizedAnswerZhDiv.textContent = response.optimizedAnswer.zh;
        optimizedAnswerEnDiv.textContent = response.optimizedAnswer.en;
        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        // 保存输出结果到缓存
        saveToCache({
          question: question,
          answer: answer,
          optimizedAnswerZh: response.optimizedAnswer.zh, // 保存中文结果
          optimizedAnswerEn: response.optimizedAnswer.en, // 保存英文结果
          state: 'result'
        });
      } else {
         // 如果返回的数据结构不符合预期，显示错误信息
         optimizedAnswerZhDiv.textContent = '无法解析中文回答。';
         optimizedAnswerEnDiv.textContent = 'Could not parse English answer.';
         console.error('从 background.js 收到的响应格式不正确:', response);
         loadingSection.classList.add('hidden');
         resultSection.classList.remove('hidden');
         // 也可以选择显示原始的 response.optimizedAnswer（如果它是字符串）
         // optimizedAnswerZhDiv.textContent = response.optimizedAnswer || '未知错误';
         // optimizedAnswerEnDiv.textContent = '';
      }

    } catch (error) {
      alert('发生错误: ' + error.message);
      loadingSection.classList.add('hidden');
      inputForm.classList.remove('hidden'); // 出错时返回输入界面
      resultSection.classList.add('hidden'); // 隐藏结果区域
    }
  });

  // 继续按钮点击事件
  continueBtn.addEventListener('click', function() {
    // 重置表单
    questionInput.value = '';
    answerInput.value = '';
    optimizedAnswerZhDiv.textContent = ''; // 清空结果区域
    optimizedAnswerEnDiv.textContent = ''; // 清空结果区域
    resultSection.classList.add('hidden');
    inputForm.classList.remove('hidden');

    // 更新缓存状态
    saveToCache({
      question: '',
      answer: '',
      state: 'input'
    });
  });

  // 复制中文按钮点击事件
  copyBtnZh.addEventListener('click', function() {
    copyTextToClipboard(optimizedAnswerZhDiv.textContent, copyBtnZh, '复制成功!');
  });

  // 复制英文按钮点击事件
  copyBtnEn.addEventListener('click', function() {
    copyTextToClipboard(optimizedAnswerEnDiv.textContent, copyBtnEn, 'Copied!');
  });

  // 统一的复制到剪贴板函数
  function copyTextToClipboard(text, buttonElement, successMessage) {
    if (!text) return; // 如果没有文本则不执行

    navigator.clipboard.writeText(text).then(function() {
      // 显示复制成功提示
      const originalText = buttonElement.textContent;
      buttonElement.textContent = successMessage;
      buttonElement.style.backgroundColor = '#4CAF50'; // 绿色背景表示成功

      // 2秒后恢复按钮原始状态
      setTimeout(function() {
        buttonElement.textContent = originalText;
        buttonElement.style.backgroundColor = ''; // 恢复默认背景色
      }, 2000);
    }).catch(function(err) {
      console.error('无法复制文本: ', err);
      // 可以选择在这里给用户一个失败提示
      const originalText = buttonElement.textContent;
      buttonElement.textContent = '复制失败';
      buttonElement.style.backgroundColor = '#f44336'; // 红色背景表示失败
      setTimeout(function() {
        buttonElement.textContent = originalText;
        buttonElement.style.backgroundColor = '';
      }, 2000);
    });
  }


  // 防抖函数，避免频繁保存
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // 保存数据到缓存
  function saveToCache(data) {
    chrome.storage.local.set({ 'customerServiceHelper': data }, function() {
      // console.log('数据已保存到缓存'); // 可以取消注释来调试
    });
  }

  // 从缓存恢复数据
  function restoreFromCache() {
    chrome.storage.local.get('customerServiceHelper', function(result) {
      const cachedData = result.customerServiceHelper;
      if (cachedData) {
        // 恢复输入框内容
        questionInput.value = cachedData.question || '';
        answerInput.value = cachedData.answer || '';

        // 根据状态显示相应界面
        if (cachedData.state === 'result' && cachedData.optimizedAnswerZh && cachedData.optimizedAnswerEn) {
          optimizedAnswerZhDiv.textContent = cachedData.optimizedAnswerZh;
          optimizedAnswerEnDiv.textContent = cachedData.optimizedAnswerEn;
          inputForm.classList.add('hidden');
          resultSection.classList.remove('hidden');
          rawResponseSection.classList.add('hidden'); // 确保隐藏
        } else if (cachedData.state === 'error') {
           // 如果缓存的是错误状态
           optimizedAnswerZhDiv.textContent = `处理出错: ${cachedData.error || '未知错误'}`;
           optimizedAnswerEnDiv.textContent = `Error: ${cachedData.error || 'Unknown error'}`;
           if (cachedData.rawResponse) {
             rawResponseContentDiv.textContent = cachedData.rawResponse;
             rawResponseSection.classList.remove('hidden'); // 显示原始响应
           }
           inputForm.classList.add('hidden'); // 仍然显示结果区域（包含错误和原始响应）
           resultSection.classList.remove('hidden');
        }
         else {
          inputForm.classList.remove('hidden');
          resultSection.classList.add('hidden');
          rawResponseSection.classList.add('hidden'); // 确保隐藏
        }
      }
    });
  }

  // 页面加载时恢复状态
  restoreFromCache();

});