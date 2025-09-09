/**
 * ポートフォリオサイトのメインアプリケーション
 * サイト全体の初期化と制御を担当
 */

// アプリケーション設定
const CONFIG = {
    // パフォーマンス設定
    LAZY_LOAD_THRESHOLD: '100px',
    ANIMATION_DELAY: 100,
    
    // UI設定
    SMOOTH_SCROLL_DURATION: 800,
    MOBILE_MENU_BREAKPOINT: 768,
    
    // 画像設定
    PLACEHOLDER_IMAGE: 'images/placeholder.svg',
    DEFAULT_PROJECT_IMAGE: 'images/default-project.jpg',
    
    // メッセージ
    MESSAGES: {
        LOADING: '読み込み中...',
        ERROR: 'エラーが発生しました',
        NO_PROJECTS: 'プロジェクトがありません',
        NO_SKILLS: 'スキル情報がありません'
    }
};

// スキルデータ定義
const skillsData = [
    {
        category: "Frontend",
        skills: [
            {
                name: "HTML5",
                level: "advanced",
                icon: "🌐",
                description: "セマンティックマークアップ、アクセシビリティ対応"
            },
            {
                name: "CSS3",
                level: "advanced",
                icon: "🎨",
                description: "レスポンシブ、Grid、Flexbox、アニメーション"
            },
            {
                name: "JavaScript",
                level: "intermediate",
                icon: "⚡",
                description: "ES6+、DOM操作、非同期処理"
            },
            {
                name: "React",
                level: "intermediate",
                icon: "⚛️",
                description: "コンポーネント設計、フック、状態管理"
            }
        ]
    },
    {
        category: "Backend & Tools",
        skills: [
            {
                name: "Node.js",
                level: "beginner",
                icon: "🟢",
                description: "サーバーサイド開発、Express.js"
            },
            {
                name: "Git",
                level: "intermediate",
                icon: "📱",
                description: "バージョン管理、チーム開発、GitHub"
            },
            {
                name: "VS Code",
                level: "advanced",
                icon: "🔧",
                description: "拡張機能、デバッグ、効率的な開発"
            },
            {
                name: "Web Performance",
                level: "intermediate",
                icon: "🚀",
                description: "最適化、Core Web Vitals、パフォーマンス分析"
            }
        ]
    }
];

// プロジェクトデータ定義
const projectsData = [
    {
        id: "portfolio-website",
        title: "ポートフォリオサイト",
        description: "HTML、CSS、JavaScriptで構築したレスポンシブ対応のポートフォリオサイトです。モダンなデザインとアクセシビリティを重視した設計になっています。",
        technologies: ["HTML5", "CSS3", "JavaScript", "GitHub Pages"],
        image: null,
        demoUrl: null,
        sourceUrl: null,
        status: "completed",
        featured: true
    },
    {
        id: "sample-project-1",
        title: "Webアプリケーション",
        description: "サンプルプロジェクトの説明です。ユーザビリティとパフォーマンスを重視した設計で、レスポンシブデザインに対応しています。",
        technologies: ["HTML", "CSS", "JavaScript", "React"],
        image: null,
        demoUrl: null,
        sourceUrl: null,
        status: "completed",
        featured: false
    },
    {
        id: "sample-project-2",
        title: "モバイル対応サイト",
        description: "モバイルファーストのアプローチで開発したWebサイトです。タッチ操作とレスポンシブデザインに配慮した実装を行いました。",
        technologies: ["HTML5", "CSS3", "JavaScript"],
        image: null,
        demoUrl: null,
        sourceUrl: null,
        status: "in-progress",
        featured: false
    }
];

/**
 * メインアプリケーションクラス
 */
class PortfolioApp {
    constructor() {
        // アプリケーション状態
        this.isInitialized = false;
        this.isMobileMenuOpen = false;
        
        // DOM要素参照
        this.elements = {};
        
        // 初期化実行
        this.init();
    }
    
    /**
     * アプリケーション初期化
     * DOM読み込み完了後に実行される
     * @returns {void}
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    /**
     * 初期化処理の実行
     * @private
     * @returns {void}
     */
    async initialize() {
        try {
            loadingManager.start('app-init');
            
            // DOM要素の取得
            this.cacheElements();
            
            // データの読み込み
            await this.loadData();
            
            // イベントリスナーの設定
            this.setupEventListeners();
            
            // UI要素の初期化
            this.initializeUI();
            
            // アニメーションの設定
            this.setupAnimations();
            
            this.isInitialized = true;
            console.log('PortfolioApp initialized successfully');
            
        } catch (error) {
            ErrorHandler.log(error, 'App initialization');
        } finally {
            loadingManager.stop('app-init');
        }
    }
    
    /**
     * DOM要素のキャッシュ
     * @private
     * @returns {void}
     */
    cacheElements() {
        this.elements = {
            // ヘッダー関連
            header: safeQuerySelector('.header'),
            menuToggle: safeQuerySelector('#menuToggle'),
            navList: safeQuerySelector('#navList'),
            navLinks: safeQuerySelectorAll('.header__nav-link'),
            
            // コンテンツ関連
            skillsContent: safeQuerySelector('#skillsContent'),
            projectsContent: safeQuerySelector('#projectsContent'),
            
            // その他
            body: document.body
        };
    }
    
    /**
     * データの読み込み
     * @private
     * @returns {Promise<void>}
     */
    async loadData() {
        await Promise.all([
            this.renderSkills(),
            this.renderProjects()
        ]);
    }
    
    /**
     * イベントリスナーの設定
     * @private
     * @returns {void}
     */
    setupEventListeners() {
        // モバイルメニューの制御
        if (this.elements.menuToggle) {
            this.elements.menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });
        }
        
        // ナビゲーションリンクのスムーズスクロール
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleNavClick(e);
            });
        });
        
        // スクロールイベントの処理
        const handleScroll = throttle(() => {
            this.handleScroll();
        }, 16); // 約60fps
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // リサイズイベントの処理
        const handleResize = debounce(() => {
            this.handleResize();
        }, 250);
        
        window.addEventListener('resize', handleResize);
        
        // キーボードイベント（アクセシビリティ対応）
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }
    
    /**
     * UI要素の初期化
     * @private
     * @returns {void}
     */
    initializeUI() {
        // ヘッダーの透明度制御
        this.updateHeaderTransparency();
        
        // モバイルメニューの初期状態
        this.closeMobileMenu();
    }
    
    /**
     * スキルセクションのレンダリング
     * カテゴリ別にグループ化してHTMLを生成
     * @private
     * @returns {Promise<void>}
     */
    async renderSkills() {
        const container = this.elements.skillsContent;
        if (!container) {
            console.warn('Skills container not found');
            return;
        }
        
        if (isEmpty(skillsData)) {
            container.innerHTML = `<p class="text-center">${CONFIG.MESSAGES.NO_SKILLS}</p>`;
            return;
        }
        
        try {
            let html = '';
            
            skillsData.forEach(category => {
                html += `
                    <div class="skills__category" data-category="${escapeHtml(category.category)}">
                        <h3 class="skills__category-title">${escapeHtml(category.category)}</h3>
                        <div class="skills__list">
                            ${category.skills.map(skill => `
                                <div class="skill-card skill-card--${escapeHtml(skill.level)}" data-skill="${escapeHtml(skill.name)}">
                                    <div class="skill-card__icon">
                                        ${skill.icon}
                                    </div>
                                    <div class="skill-card__content">
                                        <h4 class="skill-card__name">${escapeHtml(skill.name)}</h4>
                                        <p class="skill-card__description">${escapeHtml(skill.description)}</p>
                                        <span class="skill-card__level skill-card__level--${escapeHtml(skill.level)}">
                                            ${this.getLevelText(skill.level)}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
        } catch (error) {
            ErrorHandler.log(error, 'Skills rendering');
            container.innerHTML = `<p class="text-center">${CONFIG.MESSAGES.ERROR}</p>`;
        }
    }
    
    /**
     * プロジェクトセクションのレンダリング
     * プロジェクトカード群のHTMLを生成
     * @private
     * @returns {Promise<void>}
     */
    async renderProjects() {
        const container = this.elements.projectsContent;
        if (!container) {
            console.warn('Projects container not found');
            return;
        }
        
        if (isEmpty(projectsData)) {
            container.innerHTML = `<p class="text-center">${CONFIG.MESSAGES.NO_PROJECTS}</p>`;
            return;
        }
        
        try {
            // 注目プロジェクトを最初に表示
            const sortedProjects = [...projectsData].sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return 0;
            });
            
            const html = sortedProjects.map(project => `
                <article class="project-card" data-project-id="${escapeHtml(project.id)}">
                    <div class="project-card__image">
                        ${project.image ? 
                            `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy">` :
                            `<div class="project-card__placeholder">📁</div>`
                        }
                        ${project.featured ? '<div class="project-card__badge">Featured</div>' : ''}
                    </div>
                    <div class="project-card__content">
                        <h3 class="project-card__title">${escapeHtml(project.title)}</h3>
                        <p class="project-card__description">${escapeHtml(project.description)}</p>
                        <div class="project-card__technologies">
                            ${project.technologies.map(tech => 
                                `<span class="project-card__tech">${escapeHtml(tech)}</span>`
                            ).join('')}
                        </div>
                        <div class="project-card__actions">
                            ${project.demoUrl ? 
                                `<a href="${escapeHtml(project.demoUrl)}" class="project-card__link project-card__link--primary" target="_blank" rel="noopener noreferrer">Demo</a>` : 
                                '<span class="project-card__link project-card__link--disabled">Demo準備中</span>'
                            }
                            ${project.sourceUrl ? 
                                `<a href="${escapeHtml(project.sourceUrl)}" class="project-card__link project-card__link--secondary" target="_blank" rel="noopener noreferrer">Code</a>` : 
                                '<span class="project-card__link project-card__link--disabled">Code準備中</span>'
                            }
                        </div>
                    </div>
                </article>
            `).join('');
            
            container.innerHTML = html;
            
        } catch (error) {
            ErrorHandler.log(error, 'Projects rendering');
            container.innerHTML = `<p class="text-center">${CONFIG.MESSAGES.ERROR}</p>`;
        }
    }
    
    /**
     * スキルレベルのテキスト取得
     * @private
     * @param {string} level - スキルレベル
     * @returns {string} レベルテキスト
     */
    getLevelText(level) {
        const levelMap = {
            'beginner': '基礎',
            'intermediate': '中級',
            'advanced': '上級'
        };
        return levelMap[level] || level;
    }
    
    /**
     * モバイルメニューの開閉制御
     * @private
     * @returns {void}
     */
    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        
        if (this.isMobileMenuOpen) {
            this.openMobileMenu();
        } else {
            this.closeMobileMenu();
        }
    }
    
    /**
     * モバイルメニューを開く
     * @private
     * @returns {void}
     */
    openMobileMenu() {
        safeAddClass(this.elements.menuToggle, 'is-open');
        safeAddClass(this.elements.navList, 'is-open');
        safeAddClass(this.elements.body, 'menu-open');
        
        // アクセシビリティ属性の更新
        if (this.elements.menuToggle) {
            this.elements.menuToggle.setAttribute('aria-expanded', 'true');
        }
    }
    
    /**
     * モバイルメニューを閉じる
     * @private
     * @returns {void}
     */
    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        safeRemoveClass(this.elements.menuToggle, 'is-open');
        safeRemoveClass(this.elements.navList, 'is-open');
        safeRemoveClass(this.elements.body, 'menu-open');
        
        // アクセシビリティ属性の更新
        if (this.elements.menuToggle) {
            this.elements.menuToggle.setAttribute('aria-expanded', 'false');
        }
    }
    
    /**
     * ナビゲーションクリックの処理
     * @private
     * @param {Event} e - クリックイベント
     * @returns {void}
     */
    handleNavClick(e) {
        e.preventDefault();
        
        const href = e.currentTarget.getAttribute('href');
        if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            smoothScrollTo(targetId);
            
            // モバイルメニューを閉じる
            this.closeMobileMenu();
        }
    }
    
    /**
     * スクロールイベントの処理
     * @private
     * @returns {void}
     */
    handleScroll() {
        // ヘッダーの透明度制御
        this.updateHeaderTransparency();
        
        // アクティブなナビゲーションリンクの更新
        this.updateActiveNavLink();
    }
    
    /**
     * リサイズイベントの処理
     * @private
     * @returns {void}
     */
    handleResize() {
        // ウィンドウサイズが変更された時の処理
        if (window.innerWidth > CONFIG.MOBILE_MENU_BREAKPOINT) {
            this.closeMobileMenu();
        }
    }
    
    /**
     * キーボードイベントの処理
     * @private
     * @param {KeyboardEvent} e - キーボードイベント
     * @returns {void}
     */
    handleKeyDown(e) {
        // Escapeキーでモバイルメニューを閉じる
        if (e.key === 'Escape' && this.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
    }
    
    /**
     * ヘッダーの透明度制御
     * @private
     * @returns {void}
     */
    updateHeaderTransparency() {
        if (!this.elements.header) return;
        
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            safeAddClass(this.elements.header, 'header--scrolled');
        } else {
            safeRemoveClass(this.elements.header, 'header--scrolled');
        }
    }
    
    /**
     * アクティブなナビゲーションリンクの更新
     * @private
     * @returns {void}
     */
    updateActiveNavLink() {
        const sections = safeQuerySelectorAll('section[id]');
        const scrollY = window.scrollY + 100; // オフセット
        
        let activeSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                activeSection = section.id;
            }
        });
        
        // ナビゲーションリンクのアクティブ状態を更新
        this.elements.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            safeRemoveClass(link, 'active');
            
            if (href === `#${activeSection}`) {
                safeAddClass(link, 'active');
            }
        });
    }
    
    /**
     * アニメーションの設定
     * @private
     * @returns {void}
     */
    setupAnimations() {
        // Intersection Observer を使用した要素の表示アニメーション
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px -100px 0px',
                threshold: 0.1
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        safeAddClass(entry.target, 'animate-in');
                    }
                });
            }, observerOptions);
            
            // アニメーション対象要素の監視開始
            const animationTargets = safeQuerySelectorAll('.skill-card, .project-card, .about__content');
            animationTargets.forEach(target => {
                observer.observe(target);
            });
        }
    }
}

// アプリケーション開始
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new PortfolioApp();
    });
} else {
    app = new PortfolioApp();
}

// グローバルオブジェクトとしてエクスポート（デバッグ用）
window.PortfolioApp = app;