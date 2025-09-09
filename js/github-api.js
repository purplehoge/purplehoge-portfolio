/**
 * GitHub API連携モジュール
 * GitHubリポジトリ情報の取得と管理を担当
 */

// GitHub API設定
const GITHUB_CONFIG = {
    USERNAME: 'purplehoge',
    API_BASE_URL: 'https://api.github.com',
    CACHE_DURATION: 3600000, // 1時間（ミリ秒）
    RATE_LIMIT_DELAY: 1000,  // 1秒間隔
    MAX_REPOS: 10,
    EXCLUDED_REPOS: [
        'purplehoge', // プロフィールリポジトリは除外
        'README'      // README専用リポジトリは除外
    ]
};

/**
 * GitHub API クライアントクラス
 */
class GitHubApiClient {
    constructor() {
        // APIレスポンスキャッシュ
        this.cache = new Map();
        // レート制限管理
        this.lastRequestTime = 0;
        // リクエスト中フラグ
        this.isLoading = false;
    }

    /**
     * リポジトリ一覧を取得
     * @returns {Promise<Array>} リポジトリデータの配列
     */
    async getRepositories() {
        const cacheKey = 'user-repositories';
        
        try {
            console.log('GitHub API: リポジトリ取得開始');
            
            // キャッシュ確認
            const cachedData = this.getCachedData(cacheKey);
            if (cachedData) {
                console.log('GitHub API: キャッシュからデータを取得');
                return cachedData;
            }

            // API呼び出し
            this.isLoading = true;
            loadingManager.start('github-repos');
            
            console.log('GitHub API: API呼び出し実行中...');
            const repos = await this.fetchUserRepositories();
            console.log('GitHub API: 生データ取得完了', repos);
            
            const processedRepos = this.processRepositories(repos);
            console.log('GitHub API: データ加工完了', processedRepos);

            // キャッシュに保存
            this.setCachedData(cacheKey, processedRepos);
            
            console.log(`GitHub API: ${processedRepos.length}件のリポジトリを取得`);
            return processedRepos;

        } catch (error) {
            console.error('GitHub API エラー:', error);
            ErrorHandler.log(error, 'GitHub API リポジトリ取得');
            return this.getFallbackRepositories();
        } finally {
            this.isLoading = false;
            loadingManager.stop('github-repos');
        }
    }

    /**
     * ユーザーリポジトリをAPIから取得
     * @private
     * @returns {Promise<Array>} 生のAPIレスポンス
     */
    async fetchUserRepositories() {
        await this.respectRateLimit();

        const url = `${GITHUB_CONFIG.API_BASE_URL}/users/${GITHUB_CONFIG.USERNAME}/repos`;
        const params = new URLSearchParams({
            sort: 'updated',
            direction: 'desc',
            per_page: GITHUB_CONFIG.MAX_REPOS,
            type: 'public'
        });

        const fullUrl = `${url}?${params}`;
        console.log('GitHub API: リクエストURL', fullUrl);

        const response = await fetch(fullUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Portfolio-Site/1.0'
            }
        });

        console.log('GitHub API: レスポンス', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            throw new Error(`GitHub API エラー: ${response.status} ${response.statusText}`);
        }

        // レート制限ヘッダーをログ出力
        this.logRateLimit(response);

        const data = await response.json();
        console.log('GitHub API: JSON解析完了', `${data.length}件のリポジトリ`);
        
        return data;
    }

    /**
     * リポジトリデータの加工処理
     * @private
     * @param {Array} repos - 生のリポジトリデータ
     * @returns {Array} 加工済みリポジトリデータ
     */
    processRepositories(repos) {
        return repos
            .filter(repo => !GITHUB_CONFIG.EXCLUDED_REPOS.includes(repo.name))
            .filter(repo => !repo.fork) // フォークリポジトリを除外
            .map(repo => ({
                id: `github-${repo.name}`,
                title: repo.name,
                description: repo.description || '説明がありません',
                technologies: this.extractTechnologies(repo),
                image: null, // 将来的にOGP画像など追加検討
                demoUrl: repo.homepage || null,
                sourceUrl: repo.html_url,
                status: 'completed',
                featured: this.isFeaturedRepo(repo),
                githubData: {
                    stars: repo.stargazers_count,
                    language: repo.language,
                    updatedAt: new Date(repo.updated_at),
                    createdAt: new Date(repo.created_at),
                    topics: repo.topics || []
                }
            }))
            .sort((a, b) => {
                // 注目リポジトリを優先
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                // 次にスター数で並び替え
                return (b.githubData.stars || 0) - (a.githubData.stars || 0);
            });
    }

    /**
     * リポジトリから技術スタックを抽出
     * @private
     * @param {Object} repo - リポジトリデータ
     * @returns {Array} 技術スタック配列
     */
    extractTechnologies(repo) {
        const technologies = [];

        // 主要言語を追加
        if (repo.language) {
            technologies.push(repo.language);
        }

        // トピック（タグ）から技術を抽出
        if (repo.topics && repo.topics.length > 0) {
            const techTopics = repo.topics.filter(topic => 
                this.isTechnologyTopic(topic)
            );
            technologies.push(...techTopics);
        }

        // 重複削除と大文字小文字統一
        return [...new Set(technologies)]
            .map(tech => this.normalizeTechnologyName(tech))
            .slice(0, 6); // 最大6個まで表示
    }

    /**
     * 技術関連のトピックかどうか判定
     * @private
     * @param {string} topic - トピック名
     * @returns {boolean} 技術関連かどうか
     */
    isTechnologyTopic(topic) {
        const techKeywords = [
            'javascript', 'typescript', 'python', 'java', 'html', 'css',
            'react', 'vue', 'angular', 'node', 'express', 'flask', 'django',
            'git', 'docker', 'mongodb', 'mysql', 'postgresql',
            'frontend', 'backend', 'api', 'rest'
        ];
        
        return techKeywords.some(keyword => 
            topic.toLowerCase().includes(keyword)
        );
    }

    /**
     * 技術名の正規化
     * @private
     * @param {string} tech - 技術名
     * @returns {string} 正規化された技術名
     */
    normalizeTechnologyName(tech) {
        const nameMap = {
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'python': 'Python',
            'html': 'HTML',
            'css': 'CSS',
            'react': 'React',
            'vue': 'Vue.js',
            'node': 'Node.js'
        };
        
        const normalized = nameMap[tech.toLowerCase()];
        return normalized || tech.charAt(0).toUpperCase() + tech.slice(1);
    }

    /**
     * 注目リポジトリかどうか判定
     * @private
     * @param {Object} repo - リポジトリデータ
     * @returns {boolean} 注目リポジトリかどうか
     */
    isFeaturedRepo(repo) {
        // スター数が1以上、または特定のトピックを含む
        const hasStars = (repo.stargazers_count || 0) > 0;
        const hasFeaturedTopic = (repo.topics || []).includes('featured');
        const isPortfolio = repo.name.toLowerCase().includes('portfolio');
        
        return hasStars || hasFeaturedTopic || isPortfolio;
    }

    /**
     * レート制限の遵守
     * @private
     * @returns {Promise<void>}
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < GITHUB_CONFIG.RATE_LIMIT_DELAY) {
            const waitTime = GITHUB_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * レート制限情報をログ出力
     * @private
     * @param {Response} response - APIレスポンス
     * @returns {void}
     */
    logRateLimit(response) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        if (remaining && reset) {
            const resetTime = new Date(parseInt(reset) * 1000);
            console.log(`GitHub API Rate Limit: 残り${remaining}回 (リセット: ${resetTime.toLocaleTimeString()})`);
            
            if (parseInt(remaining) < 10) {
                console.warn('GitHub API レート制限に近づいています');
            }
        }
    }

    /**
     * キャッシュからデータを取得
     * @private
     * @param {string} key - キャッシュキー
     * @returns {any|null} キャッシュされたデータまたはnull
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > GITHUB_CONFIG.CACHE_DURATION;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * データをキャッシュに保存
     * @private
     * @param {string} key - キャッシュキー
     * @param {any} data - 保存するデータ
     * @returns {void}
     */
    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * フォールバック用の静的リポジトリデータ
     * @private
     * @returns {Array} 静的プロジェクトデータ
     */
    getFallbackRepositories() {
        console.warn('GitHub API: フォールバックデータを使用');
        
        return [
            {
                id: 'fallback-portfolio',
                title: 'Portfolio Website',
                description: 'HTML、CSS、JavaScriptで構築したレスポンシブ対応のポートフォリオサイト',
                technologies: ['HTML5', 'CSS3', 'JavaScript', 'GitHub Pages'],
                image: null,
                demoUrl: 'https://purplehoge.github.io/purplehoge-portfolio/',
                sourceUrl: 'https://github.com/purplehoge/purplehoge-portfolio',
                status: 'completed',
                featured: true,
                githubData: {
                    stars: 0,
                    language: 'HTML',
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    topics: ['portfolio', 'javascript', 'html', 'css']
                }
            }
        ];
    }

    /**
     * ローディング状態の取得
     * @returns {boolean} ローディング中かどうか
     */
    isLoadingData() {
        return this.isLoading;
    }

    /**
     * キャッシュをクリア
     * @returns {void}
     */
    clearCache() {
        this.cache.clear();
        console.log('GitHub API: キャッシュをクリアしました');
    }
}

// グローバルインスタンス
const githubApi = new GitHubApiClient();

// モジュールエクスポート（ES6モジュール使用時）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GitHubApiClient,
        githubApi,
        GITHUB_CONFIG
    };
}