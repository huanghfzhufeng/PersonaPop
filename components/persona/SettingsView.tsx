import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Volume2, VolumeX, Moon, Sun, Globe, Trash2, Info } from 'lucide-react-native';
import { COLORS } from '../../constants/persona';
import { 
    getSettings, 
    setSoundEnabled, 
    setDarkMode, 
    setLanguage, 
    clearAllData, 
    getCacheSize,
    AppSettings,
    DEFAULT_SETTINGS 
} from '../../lib/settings';

// 设置页角色图片
const mascotSettings = require('../../assets/images/mascot-settings.png');

interface SettingsViewProps {
    onBack: () => void;
}

export const SettingsView = ({ onBack }: SettingsViewProps) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [cacheSize, setCacheSize] = useState('计算中...');
    const [isLoading, setIsLoading] = useState(true);

    // 加载设置
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const loadedSettings = await getSettings();
            setSettings(loadedSettings);
            const size = await getCacheSize();
            setCacheSize(size);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 切换声音
    const handleSoundToggle = async (value: boolean) => {
        setSettings(prev => ({ ...prev, soundEnabled: value }));
        await setSoundEnabled(value);
    };

    // 切换深色模式
    const handleDarkModeToggle = async (value: boolean) => {
        setSettings(prev => ({ ...prev, darkMode: value }));
        await setDarkMode(value);
        // 注意：实际的深色模式需要在全局状态中实现
        Alert.alert('提示', '深色模式将在下次启动时生效');
    };

    // 切换语言
    const handleLanguageChange = async () => {
        const newLang = settings.language === 'zh' ? 'en' : 'zh';
        setSettings(prev => ({ ...prev, language: newLang }));
        await setLanguage(newLang);
        Alert.alert('提示', '语言设置将在下次启动时生效');
    };

    // 清除缓存
    const handleClearCache = () => {
        Alert.alert(
            '清除缓存',
            '确定要清除所有缓存数据吗？这不会影响您的账号信息。',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '确定',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearAllData();
                            setCacheSize('0 B');
                            Alert.alert('成功', '缓存已清除');
                        } catch (error) {
                            Alert.alert('错误', '清除缓存失败，请重试');
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* 头部 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ChevronLeft size={28} color={COLORS.fg} strokeWidth={3} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>设置</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* 角色图片 */}
            <View style={styles.mascotContainer}>
                <Image
                    source={mascotSettings}
                    style={styles.mascot}
                    contentFit="contain"
                />
            </View>

            {/* 设置列表 */}
            <View style={styles.settingsCard}>
                {/* 声音设置 */}
                <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        {settings.soundEnabled ? (
                            <Volume2 size={24} color={COLORS.fg} />
                        ) : (
                            <VolumeX size={24} color="#999" />
                        )}
                        <Text style={styles.settingLabel}>声音效果</Text>
                    </View>
                    <Switch
                        value={settings.soundEnabled}
                        onValueChange={handleSoundToggle}
                        trackColor={{ false: '#ddd', true: COLORS.accent }}
                        thumbColor="white"
                    />
                </View>

                <View style={styles.divider} />

                {/* 深色模式 */}
                <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        {settings.darkMode ? (
                            <Moon size={24} color={COLORS.fg} />
                        ) : (
                            <Sun size={24} color={COLORS.fg} />
                        )}
                        <Text style={styles.settingLabel}>深色模式</Text>
                    </View>
                    <Switch
                        value={settings.darkMode}
                        onValueChange={handleDarkModeToggle}
                        trackColor={{ false: '#ddd', true: COLORS.accent }}
                        thumbColor="white"
                    />
                </View>

                <View style={styles.divider} />

                {/* 语言设置 */}
                <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
                    <View style={styles.settingLeft}>
                        <Globe size={24} color={COLORS.fg} />
                        <Text style={styles.settingLabel}>语言</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.settingValue}>
                            {settings.language === 'zh' ? '中文' : 'English'}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* 清除缓存 */}
                <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
                    <View style={styles.settingLeft}>
                        <Trash2 size={24} color={COLORS.accent} />
                        <Text style={[styles.settingLabel, { color: COLORS.accent }]}>清除缓存</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.cacheSize}>{cacheSize}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* 关于信息 */}
            <View style={styles.aboutCard}>
                <View style={styles.aboutRow}>
                    <Info size={20} color="#888" />
                    <Text style={styles.aboutLabel}>版本</Text>
                    <Text style={styles.aboutValue}>1.0.0</Text>
                </View>
                <View style={styles.aboutRow}>
                    <Text style={styles.aboutText}>Persona Pop - 让你的 MBTI 变得有趣</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 28,
        color: COLORS.fg,
    },
    mascotContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    mascot: {
        width: 160,
        height: 160,
    },
    settingsCard: {
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 16,
        padding: 8,
        marginBottom: 24,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingLabel: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: COLORS.fg,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#888',
    },
    cacheSize: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#888',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginHorizontal: 16,
    },
    aboutCard: {
        backgroundColor: COLORS.bg,
        borderWidth: 2,
        borderColor: COLORS.fg,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 16,
    },
    aboutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    aboutLabel: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#888',
        flex: 1,
    },
    aboutValue: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: COLORS.fg,
    },
    aboutText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        flex: 1,
    },
});
