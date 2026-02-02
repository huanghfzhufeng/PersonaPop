import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Sparkles, Skull, Heart, Swords, Star, BookOpen, Zap, RefreshCw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MbtiResult } from '@/lib/mbti-types';
import { generatePersonalityDetail, PersonalityDetail } from '@/lib/deepseek-service';

// 缓存 key
const DETAIL_CACHE_KEY = 'mbti_detail_cache';

interface MbtiDetailViewProps {
    result: MbtiResult;
    onBack: () => void;
}

/**
 * AI 生成的人格详情页
 * 有趣版本：超能力、弱点、灵魂伴侣、冤家、名人、使用说明、翻车现场
 */
export const MbtiDetailView = ({ result, onBack }: MbtiDetailViewProps) => {
    const [detail, setDetail] = useState<PersonalityDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const typeInfo = MBTI_TYPES.find((t) => t.id === result.type);
    const mbtiImage = MBTI_IMAGES[result.type];

    useEffect(() => {
        loadCachedOrGenerate();
    }, [result.type]);

    // 加载缓存或生成新的
    const loadCachedOrGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 尝试从缓存加载
            const cached = await AsyncStorage.getItem(DETAIL_CACHE_KEY);
            if (cached) {
                const cacheData = JSON.parse(cached);
                // 检查缓存是否匹配当前类型
                if (cacheData.type === result.type) {
                    setDetail(cacheData.detail);
                    setIsLoading(false);
                    return;
                }
            }
            // 没有缓存，生成新的
            await generateAndCache();
        } catch (err) {
            await generateAndCache();
        }
    };

    // 生成并缓存
    const generateAndCache = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await generatePersonalityDetail(result.type, result.scores);
            setDetail(data);
            // 保存到缓存
            await AsyncStorage.setItem(DETAIL_CACHE_KEY, JSON.stringify({
                type: result.type,
                detail: data,
                timestamp: Date.now(),
            }));
        } catch (err) {
            setError('生成失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 强制重新生成（忽略缓存）
    const regenerate = async () => {
        await generateAndCache();
    };

    return (
        <View style={styles.container}>
            {/* 头部 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ChevronLeft size={28} color={COLORS.fg} strokeWidth={3} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>人格解码</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 顶部类型卡片 */}
                <View style={styles.typeCard}>
                    <Image source={mbtiImage} style={styles.typeImage} contentFit="contain" />
                    <View style={styles.typeInfo}>
                        <Text style={styles.typeText}>{result.type}</Text>
                        <Text style={styles.typeName}>{typeInfo?.name}</Text>
                    </View>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.accent} />
                        <Text style={styles.loadingText}>AI 正在解码你的人格...</Text>
                        <Text style={styles.loadingSubText}>预计需要 3-5 秒</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={generateAndCache} style={styles.retryBtn}>
                            <Text style={styles.retryText}>重新生成</Text>
                        </TouchableOpacity>
                    </View>
                ) : detail && (
                    <>
                        {/* 个性化洞察 */}
                        <View style={styles.insightCard}>
                            <Sparkles size={20} color={COLORS.accent} />
                            <Text style={styles.insightText}>{detail.personalInsight}</Text>
                        </View>

                        {/* 超能力 */}
                        <Section
                            icon={<Zap size={20} color="#FFD700" />}
                            title="🦸 你的超能力"
                            items={detail.superPowers}
                            color="#FFF9E6"
                        />

                        {/* 致命弱点 */}
                        <Section
                            icon={<Skull size={20} color="#8B0000" />}
                            title="💀 致命弱点"
                            items={detail.weaknesses}
                            color="#FFE4E4"
                        />

                        {/* 灵魂伴侣 vs 冤家 */}
                        <View style={styles.matchRow}>
                            <View style={[styles.matchCard, { backgroundColor: '#E8F5E9' }]}>
                                <Heart size={18} color="#4CAF50" />
                                <Text style={styles.matchTitle}>灵魂伴侣</Text>
                                <View style={styles.matchTypes}>
                                    {detail.soulmates.map((type, i) => (
                                        <Text key={i} style={[styles.matchType, { color: '#4CAF50' }]}>{type}</Text>
                                    ))}
                                </View>
                            </View>
                            <View style={[styles.matchCard, { backgroundColor: '#FFEBEE' }]}>
                                <Swords size={18} color="#F44336" />
                                <Text style={styles.matchTitle}>天生冤家</Text>
                                <View style={styles.matchTypes}>
                                    {detail.nemesis.map((type, i) => (
                                        <Text key={i} style={[styles.matchType, { color: '#F44336' }]}>{type}</Text>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* 名人同款 */}
                        <Section
                            icon={<Star size={20} color="#FF9800" />}
                            title="🎬 名人同款"
                            items={detail.celebrities}
                            color="#FFF3E0"
                        />

                        {/* 使用说明书 */}
                        <Section
                            icon={<BookOpen size={20} color="#2196F3" />}
                            title="📖 使用说明书"
                            items={detail.userManual}
                            color="#E3F2FD"
                            subtitle="如何与这个类型相处"
                        />

                        {/* 日常翻车现场 */}
                        <Section
                            icon={<Sparkles size={20} color="#9C27B0" />}
                            title="😅 日常翻车现场"
                            items={detail.dailyFails}
                            color="#F3E5F5"
                        />

                        {/* 重新生成按钮 */}
                        <TouchableOpacity onPress={regenerate} style={styles.regenerateBtn}>
                            <RefreshCw size={16} color="#888" />
                            <Text style={styles.regenerateText}>换一批分析</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

// 通用模块组件
const Section = ({
    icon,
    title,
    items,
    color,
    subtitle,
}: {
    icon: React.ReactNode;
    title: string;
    items: string[];
    color: string;
    subtitle?: string;
}) => (
    <View style={[styles.section, { backgroundColor: color }]}>
        <View style={styles.sectionHeader}>
            {icon}
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        <View style={styles.sectionItems}>
            {items.map((item, index) => (
                <View key={index} style={styles.itemTag}>
                    <Text style={styles.itemText}>{item}</Text>
                </View>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderColor: COLORS.fg,
        borderStyle: 'dashed',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 24,
        color: COLORS.fg,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    typeImage: {
        width: 80,
        height: 80,
    },
    typeInfo: {
        marginLeft: 16,
    },
    typeText: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 36,
        color: COLORS.fg,
    },
    typeName: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: COLORS.accent,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 18,
        color: COLORS.fg,
        marginTop: 16,
    },
    loadingSubText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#888',
        marginTop: 8,
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    errorText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#e74c3c',
    },
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: COLORS.accent,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.fg,
    },
    retryText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: 'white',
    },
    insightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accent,
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        gap: 12,
    },
    insightText: {
        flex: 1,
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: 'white',
        lineHeight: 22,
    },
    section: {
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 18,
        color: COLORS.fg,
    },
    sectionSubtitle: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 13,
        color: '#666',
        marginTop: -8,
        marginBottom: 12,
    },
    sectionItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    itemTag: {
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.fg,
    },
    itemText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: COLORS.fg,
    },
    matchRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    matchCard: {
        flex: 1,
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    matchTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 14,
        color: COLORS.fg,
        marginTop: 8,
        marginBottom: 8,
    },
    matchTypes: {
        flexDirection: 'row',
        gap: 8,
    },
    matchType: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 16,
    },
    regenerateBtn: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingVertical: 12,
    },
    regenerateText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#888',
    },
});
