import AsyncStorage from '@react-native-async-storage/async-storage';

// 设置项的键名
const SETTINGS_KEYS = {
    SOUND_ENABLED: '@settings/sound_enabled',
    DARK_MODE: '@settings/dark_mode',
    LANGUAGE: '@settings/language',
};

// 设置项类型
export interface AppSettings {
    soundEnabled: boolean;
    darkMode: boolean;
    language: 'zh' | 'en';
}

// 默认设置
export const DEFAULT_SETTINGS: AppSettings = {
    soundEnabled: true,
    darkMode: false,
    language: 'zh',
};

/**
 * 获取所有设置
 */
export async function getSettings(): Promise<AppSettings> {
    try {
        const [soundEnabled, darkMode, language] = await Promise.all([
            AsyncStorage.getItem(SETTINGS_KEYS.SOUND_ENABLED),
            AsyncStorage.getItem(SETTINGS_KEYS.DARK_MODE),
            AsyncStorage.getItem(SETTINGS_KEYS.LANGUAGE),
        ]);

        return {
            soundEnabled: soundEnabled !== null ? JSON.parse(soundEnabled) : DEFAULT_SETTINGS.soundEnabled,
            darkMode: darkMode !== null ? JSON.parse(darkMode) : DEFAULT_SETTINGS.darkMode,
            language: (language as 'zh' | 'en') || DEFAULT_SETTINGS.language,
        };
    } catch (error) {
        console.error('Error loading settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * 保存声音设置
 */
export async function setSoundEnabled(enabled: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(SETTINGS_KEYS.SOUND_ENABLED, JSON.stringify(enabled));
    } catch (error) {
        console.error('Error saving sound setting:', error);
    }
}

/**
 * 保存深色模式设置
 */
export async function setDarkMode(enabled: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(SETTINGS_KEYS.DARK_MODE, JSON.stringify(enabled));
    } catch (error) {
        console.error('Error saving dark mode setting:', error);
    }
}

/**
 * 保存语言设置
 */
export async function setLanguage(language: 'zh' | 'en'): Promise<void> {
    try {
        await AsyncStorage.setItem(SETTINGS_KEYS.LANGUAGE, language);
    } catch (error) {
        console.error('Error saving language setting:', error);
    }
}

/**
 * 清除所有缓存和设置
 */
export async function clearAllData(): Promise<void> {
    try {
        // 获取所有键
        const allKeys = await AsyncStorage.getAllKeys();
        // 过滤出应用相关的键（排除认证相关）
        const appKeys = allKeys.filter(key => 
            key.startsWith('@settings/') || 
            key.startsWith('@cache/')
        );
        // 删除这些键
        if (appKeys.length > 0) {
            await AsyncStorage.multiRemove(appKeys);
        }
    } catch (error) {
        console.error('Error clearing data:', error);
        throw error;
    }
}

/**
 * 获取缓存大小估算（简化版）
 */
export async function getCacheSize(): Promise<string> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        let totalSize = 0;
        
        for (const key of allKeys) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
                totalSize += value.length * 2; // UTF-16 编码，每个字符2字节
            }
        }
        
        if (totalSize < 1024) {
            return `${totalSize} B`;
        } else if (totalSize < 1024 * 1024) {
            return `${(totalSize / 1024).toFixed(1)} KB`;
        } else {
            return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
        }
    } catch (error) {
        console.error('Error getting cache size:', error);
        return '未知';
    }
}
