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
                demoUrl: this.getDemoUrl(repo),
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
     * デモURLを取得（Vercel優先、なければGitHub Pages）
     * @private
     * @param {Object} repo - リポジトリデータ
     * @returns {string|null} デモURL
     */
    getDemoUrl(repo) {
        // 1. repo.homepage がある場合、まずそれを確認
        if (repo.homepage) {
            const homepage = repo.homepage.trim();
            
            // Vercelドメインの場合は最優先
            if (this.isVercelUrl(homepage)) {
                return homepage;
            }
            
            // 他のデプロイサービスも有効とみなす
            if (this.isValidDeployUrl(homepage)) {
                return homepage;
            }
        }
        
        // 2. GitHub Pagesの確認
        const githubPagesUrl = this.getGitHubPagesUrl(repo);
        if (githubPagesUrl) {
            return githubPagesUrl;
        }
        
        // 3. homepageがあったが無効だった場合
        if (repo.homepage && repo.homepage.trim()) {
            return repo.homepage.trim();
        }
        
        return null;
    }

    /**
     * VercelのURLかどうか判定
     * @private
     * @param {string} url - チェックするURL
     * @returns {boolean} VercelのURLかどうか
     */
    isVercelUrl(url) {
        const vercelDomains = [
            'vercel.app',
            'vercel.com',
            'now.sh'
        ];
        
        try {
            const urlObj = new URL(url);
            return vercelDomains.some(domain => 
                urlObj.hostname.endsWith(domain)
            );
        } catch {
            return false;
        }
    }

    /**
     * 有効なデプロイURLかどうか判定
     * @private
     * @param {string} url - チェックするURL
     * @returns {boolean} 有効なデプロイURLかどうか
     */
    isValidDeployUrl(url) {
        const deployDomains = [
            'netlify.app',
            'netlify.com',
            'herokuapp.com',
            'github.io',
            'pages.dev', // Cloudflare Pages
            'railway.app',
            'surge.sh'
        ];
        
        try {
            const urlObj = new URL(url);
            // HTTPまたはHTTPS
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }
            
            // デプロイサービスのドメインチェック
            return deployDomains.some(domain => 
                urlObj.hostname.endsWith(domain)
            );
        } catch {
            return false;
        }
    }

    /**
     * GitHub PagesのURLを生成
     * @private
     * @param {Object} repo - リポジトリデータ
     * @returns {string|null} GitHub PagesのURL
     */
    getGitHubPagesUrl(repo) {
        const username = GITHUB_CONFIG.USERNAME;
        const repoName = repo.name;
        
        // ユーザーサイト（username.github.io）の場合
        if (repoName === `${username}.github.io`) {
            return `https://${username}.github.io/`;
        }
        
        // プロジェクトサイトの場合
        // GitHub Pagesが有効かどうかの確認は難しいため、
        // 一般的なパターンでURLを生成
        const githubPagesUrl = `https://${username}.github.io/${repoName}/`;
        
        // リポジトリに index.html または README.md が存在する可能性が高い場合のみ返す
        // ここでは簡易的に、特定の条件を満たす場合のみGitHub Pages URLを返す
        if (this.likelyHasGitHubPages(repo)) {
            return githubPagesUrl;
        }
        
        return null;
    }

    /**
     * GitHub Pagesが有効である可能性が高いかどうか判定
     * @private
     * @param {Object} repo - リポジトリデータ
     * @returns {boolean} GitHub Pagesが有効である可能性
     */
    likelyHasGitHubPages(repo) {
        const repoName = repo.name.toLowerCase();
        const description = (repo.description || '').toLowerCase();
        const topics = repo.topics || [];
        
        // 1. 明確にWebサイト関連のリポジトリ
        const webKeywords = [
            'website', 'site', 'page', 'portfolio', 'blog', 'docs',
            'documentation', 'demo', 'landing', 'web'
        ];
        
        const hasWebKeyword = 
            webKeywords.some(keyword => repoName.includes(keyword)) ||
            webKeywords.some(keyword => description.includes(keyword)) ||
            topics.some(topic => webKeywords.includes(topic.toLowerCase()));
        
        // 2. フロントエンド技術を使用
        const frontendTech = ['html', 'css', 'javascript', 'react', 'vue'];
        const hasFrontendTech = 
            frontendTech.includes(repo.language?.toLowerCase()) ||
            topics.some(topic => frontendTech.includes(topic.toLowerCase()));
        
        // 3. GitHub Pagesトピックが明示的に設定されている
        const hasGitHubPagesTopic = topics.includes('github-pages');
        
        return hasWebKeyword || hasFrontendTech || hasGitHubPagesTopic;
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
        
        // GitHub API障害時も不要なプロジェクトは表示しない
        return [];
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