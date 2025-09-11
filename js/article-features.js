// 文章功能增强 - 阅读进度指示器和字体大小调整
document.addEventListener('DOMContentLoaded', function() {
    // 初始化阅读进度指示器
    initReadingProgressIndicator();
    
    // 初始化字体大小调整功能
    initFontSizeAdjustment();
    
    // 初始隐藏字体调整按钮
    updateFontControlsVisibility();
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
            // 更新字体控制按钮可见性
            setTimeout(updateFontControlsVisibility, 300);
        }
    });
}

// 更新阅读进度
function updateReadingProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    const progressIndicator = document.querySelector('.reading-progress-indicator');
    if (progressIndicator) {
        progressIndicator.style.width = scrolled + '%';
    }
}

// 存储当前活动文章的ID
let currentActiveArticle = null;

// 字体大小调整功能
function initFontSizeAdjustment() {
    // 创建字体大小调整按钮容器
    const fontControls = document.createElement('div');
    fontControls.className = 'font-size-controls';
    fontControls.innerHTML = `
        <div class="font-size-toggle">
            <i class="fa fa-text-height"></i>
        </div>
        <div class="font-size-options">
            <button id="font-decrease" class="font-size-btn" title="减小字体">
                <i class="fa fa-minus"></i>
            </button>
            <button id="font-reset" class="font-size-btn" title="重置字体">
                <i class="fa fa-font"></i>
            </button>
            <button id="font-increase" class="font-size-btn" title="增大字体">
                <i class="fa fa-plus"></i>
            </button>
        </div>
    `;
    
    // 将按钮添加到页面
    document.body.appendChild(fontControls);
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .font-size-controls {
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 999;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .font-size-controls.visible {
            opacity: 1;
            visibility: visible;
        }
        
        .font-size-toggle {
            width: 40px;
            height: 40px;
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
        }
        
        .font-size-toggle:hover {
            background-color: #f3f4f6;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .font-size-options {
            position: absolute;
            bottom: 50px;
            right: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
        }
        
        .font-size-controls:hover .font-size-options {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .font-size-btn {
            width: 40px;
            height: 40px;
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
        }
        
        .font-size-btn:hover {
            background-color: #f3f4f6;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .dark-mode .font-size-toggle,
        .dark-mode .font-size-btn {
            background-color: rgba(30, 30, 30, 0.9);
            border-color: #374151;
            color: #e5e7eb;
        }
        
        .dark-mode .font-size-toggle:hover,
        .dark-mode .font-size-btn:hover {
            background-color: #374151;
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
        }
        
        /* 文章内容字体大小类 */
        .content-collapsed, .content-expanded {
            transition: font-size 0.2s ease;
        }
    `;
    document.head.appendChild(style);
    
    // 获取按钮元素
    const decreaseBtn = document.getElementById('font-decrease');
    const resetBtn = document.getElementById('font-reset');
    const increaseBtn = document.getElementById('font-increase');
    
    // 初始化字体大小
    let currentFontSize = parseInt(localStorage.getItem('articleFontSize')) || 100;
    
    // 减小字体
    decreaseBtn.addEventListener('click', function() {
        if (currentFontSize > 80) {
            currentFontSize -= 10;
            applyFontSizeToCurrentArticle(currentFontSize);
            localStorage.setItem('articleFontSize', currentFontSize);
        }
    });
    
    // 重置字体
    resetBtn.addEventListener('click', function() {
        currentFontSize = 100;
        applyFontSizeToCurrentArticle(currentFontSize);
        localStorage.setItem('articleFontSize', currentFontSize);
    });
    
    // 增大字体
    increaseBtn.addEventListener('click', function() {
        if (currentFontSize < 150) {
            currentFontSize += 10;
            applyFontSizeToCurrentArticle(currentFontSize);
            localStorage.setItem('articleFontSize', currentFontSize);
        }
    });
}

// 应用字体大小到当前活动文章
function applyFontSizeToCurrentArticle(size) {
    if (!currentActiveArticle) return;
    
    // 确保size是数字
    size = parseInt(size);
    
    // 获取当前活动文章的内容元素
    const articleContent = currentActiveArticle.querySelector('.content-expanded');
    if (!articleContent) return;
    
    // 如果当前没有设置字体大小，先设置为100%
    if (!articleContent.style.fontSize || articleContent.style.fontSize === '') {
        articleContent.style.fontSize = '100%';
    }
    
    // 应用新的字体大小
    articleContent.style.fontSize = size + '%';
}

// 应用字体大小到所有文章（保留用于初始化）
function applyFontSize(size) {
    const articleContents = document.querySelectorAll('.content-collapsed, .content-expanded');
    
    // 确保size是数字
    size = parseInt(size);
    
    articleContents.forEach(content => {
        // 如果当前没有设置字体大小，先设置为100%
        if (!content.style.fontSize || content.style.fontSize === '') {
            content.style.fontSize = '100%';
        }
        
        // 应用新的字体大小
        content.style.fontSize = size + '%';
    });
}

// 更新字体控制按钮可见性
function updateFontControlsVisibility() {
    const fontControls = document.querySelector('.font-size-controls');
    if (!fontControls) return;
    
    // 检查是否有展开的文章内容
    const expandedContents = document.querySelectorAll('.content-expanded');
    
    if (expandedContents.length > 0) {
        fontControls.classList.add('visible');
        // 确保展开的文章内容应用了保存的字体大小
        const currentFontSize = localStorage.getItem('articleFontSize') || 100;
        applyFontSize(currentFontSize);
    } else {
        fontControls.classList.remove('visible');
    }
}

// 监听文章内容加载完成事件
document.addEventListener('click', function(e) {
    if (e.target.closest('.article-card') || e.target.closest('.read-more-btn')) {
        // 延迟应用字体大小，确保文章内容已加载
        setTimeout(() => {
            const currentFontSize = localStorage.getItem('articleFontSize') || 100;
            
            // 找到被点击的文章卡片
            const articleCard = e.target.closest('.article-card');
            if (articleCard) {
                // 设置为当前活动文章
                currentActiveArticle = articleCard;
                
                // 只对当前文章应用字体大小
                applyFontSizeToCurrentArticle(currentFontSize);
            } else {
                // 如果找不到文章卡片，则应用到所有文章
                applyFontSize(currentFontSize);
            }
            
            updateFontControlsVisibility();
        }, 500);
    }
});

// 监听滚动事件，检测当前阅读的文章
window.addEventListener('scroll', function() {
    const expandedArticles = document.querySelectorAll('.content-expanded');
    if (expandedArticles.length === 0) return;
    
    // 获取视口中心点
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight / 2;
    
    let closestArticle = null;
    let closestDistance = Infinity;
    
    // 检查每个展开的文章，找到最接近视口中心的文章
    expandedArticles.forEach(content => {
        const rect = content.getBoundingClientRect();
        const contentCenter = rect.top + rect.height / 2;
        const distance = Math.abs(contentCenter - viewportCenter);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestArticle = content.closest('.article-card');
        }
    });
    
    // 如果找到了最接近的文章且与之前的活动文章不同，则更新当前活动文章
    if (closestArticle && closestArticle !== currentActiveArticle) {
        currentActiveArticle = closestArticle;
    }
});

// 监听DOM变化，确保新加载的文章内容应用字体大小
const observer = new MutationObserver(function(mutations) {
    const currentFontSize = localStorage.getItem('articleFontSize') || 100;
    applyFontSize(currentFontSize);
});

// 配置观察选项
const config = { childList: true, subtree: true };

// 开始观察整个文档
observer.observe(document.body, config);