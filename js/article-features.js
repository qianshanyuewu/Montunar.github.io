// 文章功能增强 - 阅读进度指示器和沉浸阅读
document.addEventListener('DOMContentLoaded', function() {
    // 初始化阅读进度指示器
    initReadingProgressIndicator();
    
    // 初始化沉浸阅读功能
    initImmersiveReading();
});

// 阅读进度指示器功能
function initReadingProgressIndicator() {
    // 创建进度指示器元素
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'reading-progress-indicator';
    document.body.appendChild(progressIndicator);
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .reading-progress-indicator {
            position: fixed;
            top: 0;
            left: 0;
            height: 2px;
            background: linear-gradient(90deg, #000000, #666666);
            width: 0;
            z-index: 9999;
            transition: width 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .dark-mode .reading-progress-indicator {
            background: linear-gradient(90deg, #ffffff, #cccccc);
            box-shadow: 0 1px 3px rgba(255, 255, 255, 0.3);
        }
    `;
    document.head.appendChild(style);
    
    // 监听滚动事件
    window.addEventListener('scroll', updateReadingProgress);
    
    // 监听文章展开/折叠事件
    document.addEventListener('click', function(e) {
        if (e.target.closest('.article-card') || e.target.closest('.read-more-btn')) {
            // 延迟更新进度，确保文章内容已展开
            setTimeout(updateReadingProgress, 300);
        }
    });
}

// 更新阅读进度
function updateReadingProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    
    // 获取实际内容高度，考虑当前展开的文章
    let actualContentHeight = document.documentElement.scrollHeight;
    const expandedArticles = document.querySelectorAll('.content-expanded');
    
    // 如果有展开的文章，计算实际内容高度
    if (expandedArticles.length > 0) {
        // 获取最后一个展开的文章的底部位置
        let lastArticleBottom = 0;
        expandedArticles.forEach(article => {
            const articleBottom = article.offsetTop + article.offsetHeight;
            if (articleBottom > lastArticleBottom) {
                lastArticleBottom = articleBottom;
            }
        });
        
        // 使用实际内容底部位置或视口高度中较大的值
        actualContentHeight = Math.max(lastArticleBottom, document.documentElement.clientHeight);
    }
    
    const height = actualContentHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    
    // 限制最大进度为100%
    const finalScrolled = Math.min(scrolled, 100);
    
    const progressIndicator = document.querySelector('.reading-progress-indicator');
    if (progressIndicator) {
        progressIndicator.style.width = finalScrolled + '%';
    }
}

// 存储当前活动文章的ID
let currentActiveArticle = null;

// 沉浸阅读功能
function initImmersiveReading() {
    // 添加沉浸阅读按钮样式
    const style = document.createElement('style');
    style.textContent = `
        /* 沉浸阅读按钮样式 */
        .immersive-toggle {
            position: absolute;
            bottom: 10px;
            right: 10px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.9);
            border: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            transition: all 0.2s ease;
            color: #333333;
            z-index: 10;
            opacity: 1;
            transform: scale(1);
        }
        
        .content-expanded .immersive-toggle {
            opacity: 1;
            transform: scale(1);
        }
        
        .dark-mode .immersive-toggle {
            background-color: rgba(30, 30, 30, 0.9);
            border: 1px solid #4b5563;
            color: #f3f4f6;
        }
        
        .immersive-toggle:hover {
            background-color: #f3f4f6;
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .dark-mode .immersive-toggle:hover {
            background-color: #374151;
        }
        
        /* 沉浸模式样式 */
        .immersive-mode {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            opacity: 0;
            transition: opacity 0.3s ease;
            overflow: hidden;
        }
        
        .immersive-mode.active {
            opacity: 1;
        }
        
        .immersive-close {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.2);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            color: white;
            font-size: 18px;
        }
        
        .immersive-close:hover {
            background-color: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        
        .immersive-content {
            max-width: 800px;
            width: 100%;
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            color: #333;
            line-height: 1.6;
            overflow-y: auto;
            max-height: calc(100vh - 120px);
        }
        
        .dark-mode .immersive-content {
            background-color: #1f2937;
            color: #f3f4f6;
        }
        
        .immersive-content h2 {
            margin-top: 0;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .dark-mode .immersive-content h2 {
            border-bottom-color: #4b5563;
        }
        
        .immersive-content .article-content {
            font-size: 100%;
        }
        
        /* 沉浸模式字体调整控件样式 */
        .immersive-font-controls {
            position: absolute;
            bottom: 0;
            right: 0;
            display: flex;
            gap: 8px;
        }
        
        .immersive-font-btn {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.9);
            border: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
            color: #333333;
            font-size: 12px;
        }
        
        .immersive-font-btn:hover {
            background-color: #f3f4f6;
            transform: scale(1.05);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        
        .dark-mode .immersive-font-btn {
            background-color: rgba(30, 30, 30, 0.9);
            border-color: #374151;
            color: #e5e7eb;
        }
        
        .dark-mode .immersive-font-btn:hover {
            background-color: #374151;
            box-shadow: 0 3px 8px rgba(255, 255, 255, 0.1);
        }
    `;
    document.head.appendChild(style);
    
    // 监听文章展开/折叠事件，添加沉浸按钮
    document.addEventListener('click', function(e) {
        if (e.target.closest('.article-card') || e.target.closest('.read-more-btn')) {
            // 延迟添加沉浸按钮，确保文章内容已展开
            setTimeout(addImmersiveButtons, 500);
        }
    });
    
    // 监听DOM变化，为新加载的文章添加沉浸按钮
    const observer = new MutationObserver(function(mutations) {
        addImmersiveButtons();
    });
    
    // 配置观察选项
    const config = { childList: true, subtree: true };
    
    // 开始观察整个文档
    observer.observe(document.body, config);
}

// 添加沉浸按钮到所有展开的文章
function addImmersiveButtons() {
    // 获取所有展开的文章内容
    const expandedContents = document.querySelectorAll('.content-expanded');
    
    expandedContents.forEach(content => {
        // 检查是否已经添加了沉浸按钮
        const existingButton = content.parentNode.querySelector('.immersive-toggle');
        if (existingButton) return;
        
        // 创建沉浸按钮
        const immersiveButton = document.createElement('button');
        immersiveButton.className = 'immersive-toggle';
        immersiveButton.innerHTML = '<i class="fa fa-expand"></i>';
        immersiveButton.title = '沉浸阅读';
        
        // 将按钮添加到文章卡片的右上角
        content.parentNode.appendChild(immersiveButton);
        
        // 添加点击事件
        immersiveButton.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡，防止触发文章折叠
            enterImmersiveMode(content);
        });
    });
}

// 进入沉浸阅读模式
function enterImmersiveMode(content) {
    // 创建沉浸模式容器
    const immersiveMode = document.createElement('div');
    immersiveMode.className = 'immersive-mode';
    
    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'immersive-close';
    closeButton.innerHTML = '<i class="fa fa-times"></i>';
    
    // 创建内容容器
    const contentContainer = document.createElement('div');
    contentContainer.className = 'immersive-content';
    
    // 获取文章标题
    const articleCard = content.closest('.article-card');
    let articleTitle = '文章';
    if (articleCard) {
        const titleElement = articleCard.querySelector('h3, h4, h5');
        if (titleElement) {
            articleTitle = titleElement.textContent;
        }
    }
    
    // 创建字体调整按钮容器
    const fontControlsContainer = document.createElement('div');
    fontControlsContainer.className = 'immersive-font-controls';
    
    // 创建字体调整按钮
    const fontDecreaseBtn = document.createElement('button');
    fontDecreaseBtn.className = 'immersive-font-btn';
    fontDecreaseBtn.innerHTML = '<i class="fa fa-minus"></i>';
    fontDecreaseBtn.title = '减小字体';
    fontDecreaseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        adjustImmersiveFontSize(-10);
    });
    
    const fontResetBtn = document.createElement('button');
    fontResetBtn.className = 'immersive-font-btn';
    fontResetBtn.innerHTML = '<i class="fa fa-font"></i>';
    fontResetBtn.title = '重置字体';
    fontResetBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        adjustImmersiveFontSize(0);
    });
    
    const fontIncreaseBtn = document.createElement('button');
    fontIncreaseBtn.className = 'immersive-font-btn';
    fontIncreaseBtn.innerHTML = '<i class="fa fa-plus"></i>';
    fontIncreaseBtn.title = '增大字体';
    fontIncreaseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        adjustImmersiveFontSize(10);
    });
    
    // 将字体调整按钮添加到容器
    fontControlsContainer.appendChild(fontDecreaseBtn);
    fontControlsContainer.appendChild(fontResetBtn);
    fontControlsContainer.appendChild(fontIncreaseBtn);
    
    // 设置内容
    contentContainer.innerHTML = `
        <div style="position: relative; margin-bottom: 20px;">
            <h2 class="text-2xl font-bold mb-6" style="margin-bottom: 0;">${articleTitle}</h2>
        </div>
    `;
    
    // 将字体调整按钮添加到标题右下角
    const titleContainer = contentContainer.querySelector('div');
    titleContainer.appendChild(fontControlsContainer);
    
    // 创建文章内容容器
    const articleContentDiv = document.createElement('div');
    articleContentDiv.className = 'article-content';
    articleContentDiv.innerHTML = content.innerHTML;
    
    // 将文章内容添加到内容容器
    contentContainer.appendChild(articleContentDiv);
    
    // 添加到页面
    immersiveMode.appendChild(closeButton);
    immersiveMode.appendChild(contentContainer);
    document.body.appendChild(immersiveMode);
    
    // 添加关闭事件
    closeButton.addEventListener('click', function() {
        exitImmersiveMode(immersiveMode);
    });
    
    // 点击背景关闭
    immersiveMode.addEventListener('click', function(e) {
        if (e.target === immersiveMode) {
            exitImmersiveMode(immersiveMode);
        }
    });
    
    // 按ESC键关闭
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            exitImmersiveMode(immersiveMode);
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    // 应用当前字体大小
    const currentFontSize = localStorage.getItem('articleFontSize') || 100;
    articleContentDiv.style.fontSize = currentFontSize + '%';
    
    // 显示沉浸模式
    setTimeout(() => {
        immersiveMode.classList.add('active');
    }, 10);
}

// 退出沉浸阅读模式
function exitImmersiveMode(immersiveMode) {
    immersiveMode.classList.remove('active');
    
    // 等待动画完成后移除元素
    setTimeout(() => {
        if (immersiveMode.parentNode) {
            immersiveMode.parentNode.removeChild(immersiveMode);
        }
    }, 300);
}

// 调整沉浸模式下的字体大小
function adjustImmersiveFontSize(change) {
    // 获取当前字体大小或默认值
    let currentFontSize = parseInt(localStorage.getItem('articleFontSize')) || 100;
    
    // 如果是重置，直接设置为100%
    if (change === 0) {
        currentFontSize = 100;
    } else {
        // 否则根据变化量调整
        currentFontSize += change;
        // 限制字体大小范围
        currentFontSize = Math.max(80, Math.min(150, currentFontSize));
    }
    
    // 保存到本地存储
    localStorage.setItem('articleFontSize', currentFontSize);
    
    // 应用字体大小到沉浸模式的文章内容
    const immersiveContent = document.querySelector('.immersive-mode .article-content');
    if (immersiveContent) {
        immersiveContent.style.fontSize = currentFontSize + '%';
    }
}
