/**
 * ユーティリティ関数集
 * 汎用的な処理を提供
 */

/**
 * DOM要素を安全に選択
 * @param {string} selector - CSSセレクター
 * @returns {Element|null} 見つかった要素またはnull
 */
const safeQuerySelector = (selector) => {
    try {
        return document.querySelector(selector);
    } catch (error) {
        console.warn(`無効なセレクター: ${selector}`, error);
        return null;
    }
};

/**
 * 複数のDOM要素を安全に選択
 * @param {string} selector - CSSセレクター
 * @returns {NodeList} 見つかった要素のリスト
 */
const safeQuerySelectorAll = (selector) => {
    try {
        return document.querySelectorAll(selector);
    } catch (error) {
        console.warn(`無効なセレクター: ${selector}`, error);
        return document.querySelectorAll(''); // 空のNodeListを返す
    }
};

/**
 * 要素にクラスを安全に追加
 * @param {Element} element - 対象要素
 * @param {string} className - 追加するクラス名
 * @returns {void}
 */
const safeAddClass = (element, className) => {
    if (element && typeof className === 'string') {
        element.classList.add(className);
    }
};

/**
 * 要素からクラスを安全に削除
 * @param {Element} element - 対象要素
 * @param {string} className - 削除するクラス名
 * @returns {void}
 */
const safeRemoveClass = (element, className) => {
    if (element && typeof className === 'string') {
        element.classList.remove(className);
    }
};

/**
 * 要素のクラスを安全にトグル
 * @param {Element} element - 対象要素
 * @param {string} className - トグルするクラス名
 * @returns {boolean} クラスが追加されたかどうか
 */
const safeToggleClass = (element, className) => {
    if (element && typeof className === 'string') {
        return element.classList.toggle(className);
    }
    return false;
};

/**
 * スムーズスクロール
 * @param {string} targetId - スクロール先のID（#なし）
 * @param {number} offset - オフセット値（ピクセル）
 * @returns {void}
 */
const smoothScrollTo = (targetId, offset = 80) => {
    const target = safeQuerySelector(`#${targetId}`);
    if (target) {
        const targetPosition = target.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
};

/**
 * 画像の遅延読み込み
 * @param {string} imageSrc - 画像のソースURL
 * @param {Element} targetElement - 対象のDOM要素
 * @param {string} fallbackSrc - フォールバック画像のURL
 * @returns {Promise<void>}
 */
const lazyLoadImage = async (imageSrc, targetElement, fallbackSrc = 'images/placeholder.svg') => {
    if (!targetElement) {
        console.warn('画像読み込み対象の要素が見つかりません');
        return;
    }

    try {
        const img = new Image();
        
        // 読み込み成功時
        img.onload = () => {
            targetElement.src = imageSrc;
            safeAddClass(targetElement, 'loaded');
            safeRemoveClass(targetElement, 'loading');
        };
        
        // 読み込み失敗時
        img.onerror = () => {
            targetElement.src = fallbackSrc;
            safeAddClass(targetElement, 'error');
            safeRemoveClass(targetElement, 'loading');
            console.warn(`画像の読み込みに失敗: ${imageSrc}`);
        };
        
        // 読み込み開始
        safeAddClass(targetElement, 'loading');
        img.src = imageSrc;
        
    } catch (error) {
        console.error('画像読み込みエラー:', error);
        targetElement.src = fallbackSrc;
        safeAddClass(targetElement, 'error');
    }
};

/**
 * デバウンス関数
 * 連続した関数呼び出しを制限する
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * スロットル関数
 * 関数の実行頻度を制限する
 * @param {Function} func - 実行する関数
 * @param {number} limit - 制限時間（ミリ秒）
 * @returns {Function} スロットルされた関数
 */
const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * 要素が画面内に表示されているかチェック
 * @param {Element} element - チェック対象の要素
 * @param {number} threshold - 閾値（0-1の範囲）
 * @returns {boolean} 表示されているかどうか
 */
const isInViewport = (element, threshold = 0.1) => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    const verticalThreshold = windowHeight * threshold;
    const horizontalThreshold = windowWidth * threshold;
    
    return (
        rect.top >= -verticalThreshold &&
        rect.left >= -horizontalThreshold &&
        rect.bottom <= windowHeight + verticalThreshold &&
        rect.right <= windowWidth + horizontalThreshold
    );
};

/**
 * 文字列を安全にHTMLエスケープ
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
const escapeHtml = (str) => {
    if (typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

/**
 * オブジェクトが空かどうかチェック
 * @param {Object} obj - チェック対象のオブジェクト
 * @returns {boolean} 空かどうか
 */
const isEmpty = (obj) => {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
};

/**
 * 配列をシャッフルする（Fisher-Yates shuffle）
 * @param {Array} array - シャッフルする配列
 * @returns {Array} シャッフルされた新しい配列
 */
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * 日付を指定フォーマットで文字列に変換
 * @param {Date} date - 変換する日付
 * @param {string} format - フォーマット（例: 'YYYY/MM/DD'）
 * @returns {string} フォーマットされた日付文字列
 */
const formatDate = (date, format = 'YYYY/MM/DD') => {
    if (!(date instanceof Date) || isNaN(date)) {
        return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};

/**
 * ローディング状態を管理するクラス
 */
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
    }
    
    /**
     * ローディングを開始
     * @param {string} id - ローダーのID
     * @returns {void}
     */
    start(id = 'default') {
        this.activeLoaders.add(id);
        this.updateUI();
    }
    
    /**
     * ローディングを終了
     * @param {string} id - ローダーのID
     * @returns {void}
     */
    stop(id = 'default') {
        this.activeLoaders.delete(id);
        this.updateUI();
    }
    
    /**
     * すべてのローディングを終了
     * @returns {void}
     */
    stopAll() {
        this.activeLoaders.clear();
        this.updateUI();
    }
    
    /**
     * ローディング中かどうか
     * @returns {boolean}
     */
    isLoading() {
        return this.activeLoaders.size > 0;
    }
    
    /**
     * UI状態を更新
     * @private
     * @returns {void}
     */
    updateUI() {
        const body = document.body;
        if (this.isLoading()) {
            safeAddClass(body, 'loading');
        } else {
            safeRemoveClass(body, 'loading');
        }
    }
}

// ローディングマネージャーのグローバルインスタンス
const loadingManager = new LoadingManager();

/**
 * エラーハンドリングユーティリティ
 */
const ErrorHandler = {
    /**
     * エラーを安全にログ出力
     * @param {Error} error - エラーオブジェクト
     * @param {string} context - エラーの文脈
     * @returns {void}
     */
    log(error, context = '') {
        const message = context ? `[${context}] ${error.message}` : error.message;
        console.error(message, error);
    },
    
    /**
     * 非同期関数を安全に実行
     * @param {Function} asyncFunc - 非同期関数
     * @param {string} context - エラーの文脈
     * @returns {Promise<any>} 実行結果またはnull
     */
    async safeExecute(asyncFunc, context = '') {
        try {
            return await asyncFunc();
        } catch (error) {
            this.log(error, context);
            return null;
        }
    }
};

// モジュールエクスポート（ES6モジュール使用時）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        safeQuerySelector,
        safeQuerySelectorAll,
        safeAddClass,
        safeRemoveClass,
        safeToggleClass,
        smoothScrollTo,
        lazyLoadImage,
        debounce,
        throttle,
        isInViewport,
        escapeHtml,
        isEmpty,
        shuffleArray,
        formatDate,
        LoadingManager,
        loadingManager,
        ErrorHandler
    };
}