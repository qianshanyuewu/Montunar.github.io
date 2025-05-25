// 获取DOM元素
const homePage = document.getElementById('home-page');
const articlesPage = document.getElementById('articles-page');
const talkingPage = document.getElementById('talking-page');
const whatIDidPage = document.getElementById('what-i-did-page');
const thinkingArticlesPage = document.getElementById('thinking-articles-page');
const techArticlesPage = document.getElementById('tech-articles-page');
const artArticlesPage = document.getElementById('art-articles-page');
const lightShadowPage = document.getElementById('light-shadow-page');
const artAppreciationPage = document.getElementById('art-appreciation-page');
const homeTitle = document.getElementById('home-title');
const backButton = document.getElementById('back-button');
const talkingLink = document.getElementById('talking-link');
const whatIDidLink = document.getElementById('what-i-did-link');
const backToArticles = document.getElementById('back-to-articles');
const backToArticlesFromWhatIDid = document.getElementById('back-to-articles-from-what-i-did');
const backToTalking = document.getElementById('back-to-talking');
const backToTalkingFromTech = document.getElementById('back-to-talking-from-tech');
const backToTalkingFromArt = document.getElementById('back-to-talking-from-art');
const backToArtFromLight = document.getElementById('back-to-art-from-light');
const backToArtFromAppreciation = document.getElementById('back-to-art-from-appreciation');
const thinkingArticlesLink = document.getElementById('thinking-articles-link');
const techArticlesLink = document.getElementById('tech-articles-link');
const artArticlesLink = document.getElementById('art-articles-link');
const lightShadowLink = document.getElementById('light-shadow-link');
const artAppreciationLink = document.getElementById('art-appreciation-link');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// 文章折叠/展开功能
// const articleHeader = document.getElementById('article-header'); // 已被移除
// const articleContent = document.getElementById('article-content'); // 已被移除
// const toggleIcon = document.getElementById('toggle-icon'); // 已被移除

// 思考与探索文章折叠/展开功能
const thinkingArticleHeader = document.getElementById('thinking-article-header');
const thinkingArticleContent = document.getElementById('thinking-article-content');
const thinkingToggleIcon = document.getElementById('thinking-toggle-icon');

// 思考与探索文章2（想与写）折叠/展开功能
const thinkingArticleHeader2 = document.getElementById('thinking-article-header-2');
const thinkingArticleContent2 = document.getElementById('thinking-article-content-2');
const thinkingToggleIcon2 = document.getElementById('thinking-toggle-icon-2');

// 科技与未来文章折叠/展开功能
// const techArticleHeader = document.getElementById('tech-article-header'); // 已被移除
// const techArticleContent = document.getElementById('tech-article-content'); // 已被移除
// const techToggleIcon = document.getElementById('tech-toggle-icon'); // 已被移除

// 文章默认折叠
// let isArticleExpanded = false; // 不再需要，由新的toggleArticleContent处理
let isThinkingArticleExpanded = false;
let isThinkingArticle2Expanded = false;
// let isTechArticleExpanded = false; // 不再需要

// 主题设置
let isDarkMode = false;

// 初始化主题
function initTheme() {
    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
}

// 启用暗色模式
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    themeIcon.classList.remove('fa-sun');
    themeIcon.classList.add('fa-moon');
    isDarkMode = true;
    localStorage.setItem('theme', 'dark');
    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
        canvasElement.style.backgroundColor = '#121212';
    }
    if (window.setAnimationTheme) {
        window.setAnimationTheme(true);
    }
}

// 禁用暗色模式
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
    isDarkMode = false;
    localStorage.setItem('theme', 'light');
    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
        canvasElement.style.backgroundColor = '#eee';
    }
    if (window.setAnimationTheme) {
        window.setAnimationTheme(false);
    }
}

// 切换主题
themeToggle.addEventListener('click', () => {
    if (isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
});

// 页面切换函数
function showPage(page) {
    // 隐藏所有页面
    homePage.classList.add('opacity-0', 'pointer-events-none');
    articlesPage.classList.add('opacity-0', 'pointer-events-none');
    talkingPage.classList.add('opacity-0', 'pointer-events-none');
    whatIDidPage.classList.add('opacity-0', 'pointer-events-none');
    thinkingArticlesPage.classList.add('opacity-0', 'pointer-events-none');
    techArticlesPage.classList.add('opacity-0', 'pointer-events-none');
    artArticlesPage.classList.add('opacity-0', 'pointer-events-none');
    lightShadowPage.classList.add('opacity-0', 'pointer-events-none');
    artAppreciationPage.classList.add('opacity-0', 'pointer-events-none');

    // 显示指定页面
    page.classList.remove('opacity-0', 'pointer-events-none');

    // 控制canvas显示/隐藏
    const canvas = document.getElementById('canvas');
    if (page === homePage) {
        canvas.classList.add('hide-canvas');
    } else {
        canvas.classList.remove('hide-canvas');
        if (window.initCanvasAnimation) {
            window.initCanvasAnimation(); // Re-initialize animation
        }
    }

    // 滚动到顶部
    window.scrollTo(0, 0);

    // 激活所有slide-in元素
    setTimeout(() => {
        const slideElements = page.querySelectorAll('.slide-in');
        slideElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('active');
            }, index * 100);
        });
    }, 300);

    // 根据页面类型加载对应的文章
    if (page === thinkingArticlesPage) {
        if (typeof loadArticles === 'function') {
            loadArticles();
        }
    } else if (page === whatIDidPage) {
        if (typeof loadWhatIDidArticles === 'function') {
            loadWhatIDidArticles();
        }
    } else if (page === techArticlesPage) {
        if (typeof loadTechArticles === 'function') {
            loadTechArticles();
        }
    } else if (page === artArticlesPage) {
        if (typeof loadArtCreativityArticles === 'function') {
            loadArtCreativityArticles();
        }
    }
}

function animateHomeTitle() {
    const titleText = "一个小小的思考地方...";
    homeTitle.innerHTML = '';

    titleText.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char;
        span.style.animationDelay = `${index * 0.1}s`;
        homeTitle.appendChild(span);
    });
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 初始化主题
    initTheme();

    // 初始化首页标题动画
    animateHomeTitle();

    // 初始化所有slide-in元素
    const slideElements = document.querySelectorAll('.slide-in');
    slideElements.forEach(el => {
        el.classList.remove('active');
    });

    // 主页标题点击事件
    homeTitle.addEventListener('click', () => {
        showPage(articlesPage);
    });

    // 返回按钮点击事件
    backButton.addEventListener('click', () => {
        showPage(homePage);
    });

    // 慢慢谈说链接点击事件
    talkingLink.addEventListener('click', () => {
        showPage(talkingPage);
    });

    // 干了啥链接点击事件
    whatIDidLink.addEventListener('click', () => {
        showPage(whatIDidPage);
    });

    // 返回文章页面按钮点击事件
    backToArticles.addEventListener('click', () => {
        showPage(articlesPage);
    });

    // 从干了啥返回文章页面按钮点击事件
    backToArticlesFromWhatIDid.addEventListener('click', () => {
        showPage(articlesPage);
    });

    // 思考与探索文章链接点击事件
    thinkingArticlesLink.addEventListener('click', () => {
        showPage(thinkingArticlesPage);
    });

    // 从思考与探索返回慢慢谈说按钮点击事件
    backToTalking.addEventListener('click', () => {
        showPage(talkingPage);
    });

    // 科技与未来文章链接点击事件
    techArticlesLink.addEventListener('click', () => {
        showPage(techArticlesPage);
    });

    // 从科技与未来返回慢慢谈说按钮点击事件
    backToTalkingFromTech.addEventListener('click', () => {
        showPage(talkingPage);
    });

    // 艺术与创意文章链接点击事件
    artArticlesLink.addEventListener('click', () => {
        showPage(artArticlesPage);
    });

    // 从艺术与创意返回慢慢谈说按钮点击事件
    backToTalkingFromArt.addEventListener('click', () => {
        showPage(talkingPage);
    });

    // 光影一刻链接点击事件
    lightShadowLink.addEventListener('click', () => {
        showPage(lightShadowPage);
    });

    // 从光影一刻返回艺术与创意按钮点击事件
    backToArtFromLight.addEventListener('click', () => {
        showPage(artArticlesPage);
    });

    // 美术鉴赏链接点击事件
    artAppreciationLink.addEventListener('click', () => {
        showPage(artAppreciationPage);
    });

    // 从美术鉴赏返回艺术与创意按钮点击事件
    backToArtFromAppreciation.addEventListener('click', () => {
        showPage(artArticlesPage);
    });

    // 思考与探索文章折叠/展开功能
    if (thinkingArticleHeader && thinkingArticleContent && thinkingToggleIcon) {
        thinkingArticleHeader.addEventListener('click', () => {
            isThinkingArticleExpanded = !isThinkingArticleExpanded;
            if (isThinkingArticleExpanded) {
                thinkingArticleContent.classList.remove('content-collapsed');
                thinkingArticleContent.classList.add('content-expanded');
                thinkingToggleIcon.classList.add('expanded');
            } else {
                thinkingArticleContent.classList.remove('content-expanded');
                thinkingArticleContent.classList.add('content-collapsed');
                thinkingToggleIcon.classList.remove('expanded');
            }
        });
    }
    
    // 思考与探索文章2（想与写）折叠/展开功能
    if (thinkingArticleHeader2 && thinkingArticleContent2 && thinkingToggleIcon2) {
        thinkingArticleHeader2.addEventListener('click', () => {
            isThinkingArticle2Expanded = !isThinkingArticle2Expanded;
            if (isThinkingArticle2Expanded) {
                thinkingArticleContent2.classList.remove('content-collapsed');
                thinkingArticleContent2.classList.add('content-expanded');
                thinkingToggleIcon2.classList.add('expanded');
            } else {
                thinkingArticleContent2.classList.remove('content-expanded');
                thinkingArticleContent2.classList.add('content-collapsed');
                thinkingToggleIcon2.classList.remove('expanded');
            }
        });
    }

    // 科技与未来文章折叠/展开功能 (旧的，将被移除或注释)
    /* if (techArticleHeader && techArticleContent && techToggleIcon) {
        techArticleHeader.addEventListener('click', () => {
            isTechArticleExpanded = !isTechArticleExpanded;
            if (isTechArticleExpanded) {
                techArticleContent.classList.remove('content-collapsed');
                techArticleContent.classList.add('content-expanded');
                techToggleIcon.classList.add('expanded');
            } else {
                techArticleContent.classList.remove('content-expanded');
                techArticleContent.classList.add('content-collapsed');
                techToggleIcon.classList.remove('expanded');
            }
        });
    } */
}); 
