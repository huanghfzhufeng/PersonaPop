import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Sparkles, Share2, Download, Zap, User, Home, ArrowRight, ChevronLeft, PenTool, Heart } from 'lucide-react-native';
import { useFonts, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { generatePersonaImage, ProgressCallback } from '@/lib/ai-service';
import { generateMbtiInsight } from '@/lib/deepseek-service';
import { shareImage, saveImageToGallery } from '@/lib/share-utils';

import { COLORS, MBTI_TYPES, VIBES, COPY_TEMPLATES, MBTI_IMAGES } from '@/constants/persona';
import { MBTI_FACTS, LOADING_MESSAGES } from '@/constants/mbti-facts';
import { HandButton } from '@/components/persona/HandButton';
import { HandCard } from '@/components/persona/HandCard';
import { StickyNote } from '@/components/persona/StickyNote';
import { AuthView } from '@/components/persona/AuthView';
import { ProfileView } from '@/components/persona/ProfileView';
import { MbtiTest } from '@/components/persona/MbtiTest';
import { MbtiResultView } from '@/components/persona/MbtiResultView';
import { MbtiDetailView } from '@/components/persona/MbtiDetailView';
import { TypeCompareView } from '@/components/persona/TypeCompareView';
import { MbtiResult, Answers, StoredMbtiResult, TestMode } from '@/lib/mbti-types';

// Types
type Tab = 'home' | 'create' | 'profile';
// 主流程阶段: home(欢迎) -> test(测试) -> result(玩法中心) -> detail(AI详情) -> vibe(风格选择) -> generating(生成中) -> card(卡片结果)
// quickSelect: 快速选择类型(跳过测试), compare: 类型对比
type AppPhase = 'home' | 'test' | 'result' | 'detail' | 'vibe' | 'generating' | 'card' | 'quickSelect' | 'compare';

export default function PersonaPopHandDrawn() {
    let [fontsLoaded] = useFonts({
        Kalam_700Bold,
        PatrickHand_400Regular,
    });

    const [activeTab, setActiveTab] = useState<Tab>('home');
    // 新流程状态
    const [phase, setPhase] = useState<AppPhase>('home');
    const [mbtiResult, setMbtiResult] = useState<MbtiResult | null>(null);
    const [mbtiAnswers, setMbtiAnswers] = useState<Answers>({});
    const [testDuration, setTestDuration] = useState(0);
    const [storedResultId, setStoredResultId] = useState<string | null>(null);
    const [storedResultDate, setStoredResultDate] = useState<string | null>(null);
    const [isLoadingResult, setIsLoadingResult] = useState(false);
    
    // 卡片生成相关状态
    const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
    const [cardData, setCardData] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [currentPersonaId, setCurrentPersonaId] = useState<string | null>(null);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStatus, setGenerationStatus] = useState('');
    const [currentFact, setCurrentFact] = useState('');
    const [aiInsight, setAiInsight] = useState('');

    // 探索模块状态
    const [exploreTypeId, setExploreTypeId] = useState<string | null>(null);

    // Auth State
    const [session, setSession] = useState<any>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    // 获取用户的最新 MBTI 结果
    const fetchLatestMbtiResult = useCallback(async (userId: string) => {
        setIsLoadingResult(true);
        try {
            const { data, error } = await supabase
                .from('mbti_results')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (data && !error) {
                // 重建 MbtiResult 对象
                const result: MbtiResult = {
                    type: data.mbti_type,
                    scores: data.scores,
                    quality: data.quality,
                    confidence: data.confidence,
                };
                setMbtiResult(result);
                setMbtiAnswers(data.answers || {});
                setStoredResultId(data.id);
                setStoredResultDate(new Date(data.created_at).toLocaleDateString('zh-CN'));
                setPhase('result'); // 有结果，直接进入玩法中心
            } else {
                // 没有结果，停留在欢迎页
                setPhase('home');
            }
        } catch (err) {
            console.log('No existing MBTI result');
            setPhase('home');
        } finally {
            setIsLoadingResult(false);
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoadingSession(false);
            // 登录后检查是否有已保存的结果
            if (session?.user) {
                fetchLatestMbtiResult(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchLatestMbtiResult(session.user.id);
            } else {
                // 登出后重置
                setMbtiResult(null);
                setPhase('home');
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchLatestMbtiResult]);

    // 重置回首页
    const reset = () => {
        setPhase('home');
        setActiveTab('home');
        setSelectedVibe(null);
        setCardData(null);
        setIsFavorited(false);
        setCurrentPersonaId(null);
    };

    // 测试完成处理
    const handleTestComplete = async (result: MbtiResult, answers: Answers, durationSeconds: number, mode: TestMode) => {
        setMbtiResult(result);
        setMbtiAnswers(answers);
        setTestDuration(durationSeconds);
        
        // 保存到 Supabase
        if (session?.user) {
            try {
                const { data, error } = await supabase.from('mbti_results').insert({
                    user_id: session.user.id,
                    mbti_type: result.type,
                    answers: answers,
                    scores: result.scores,
                    quality: result.quality,
                    confidence: result.confidence,
                    test_mode: mode,
                    duration_seconds: durationSeconds,
                }).select('id, created_at').single();
                
                if (data && !error) {
                    setStoredResultId(data.id);
                    setStoredResultDate(new Date(data.created_at).toLocaleDateString('zh-CN'));
                }
            } catch (err) {
                console.error('Error saving MBTI result:', err);
            }
        }
        
        setPhase('result'); // 进入玩法中心
    };

    // 快速选择类型(跳过测试)
    const handleQuickSelect = (mbtiType: string) => {
        // 创建一个简化的结果（没有详细分数）
        const quickResult: MbtiResult = {
            type: mbtiType as any,
            scores: {
                EI: { first: 'E', second: 'I', scoreFirst: 0, scoreSecond: 0, winner: mbtiType[0] as 'E' | 'I', percentFirst: 50, percentSecond: 50 },
                SN: { first: 'S', second: 'N', scoreFirst: 0, scoreSecond: 0, winner: mbtiType[1] as 'S' | 'N', percentFirst: 50, percentSecond: 50 },
                TF: { first: 'T', second: 'F', scoreFirst: 0, scoreSecond: 0, winner: mbtiType[2] as 'T' | 'F', percentFirst: 50, percentSecond: 50 },
                JP: { first: 'J', second: 'P', scoreFirst: 0, scoreSecond: 0, winner: mbtiType[3] as 'J' | 'P', percentFirst: 50, percentSecond: 50 },
            },
            quality: { straightLining: false, extremeResponse: false, centralTendency: false, randomPattern: false },
            confidence: { overall: 0, factors: { dimensionClarity: 0, answerConsistency: 0, responseQuality: 0 }, qualityFlags: ['未进行测试，结果仅供参考'] },
        };
        setMbtiResult(quickResult);
        setMbtiAnswers({});
        setStoredResultDate(null);
        setStoredResultId(null);
        setPhase('result');
    };

    // 生成人格卡片
    const generatePersonaCard = async () => {
        if (isGenerating || !mbtiResult) return;
        
        const mbtiType = mbtiResult.type;
        setPhase('generating');
        setIsGenerating(true);
        setIsFavorited(false);
        setCurrentPersonaId(null);
        setGenerationProgress(0);
        setGenerationStatus(LOADING_MESSAGES[0]);
        
        // 设置随机趣事
        const facts = MBTI_FACTS[mbtiType]?.facts || [];
        if (facts.length > 0) {
            setCurrentFact(facts[Math.floor(Math.random() * facts.length)]);
        }
        
        // 异步获取 AI 洞察
        setAiInsight('');
        generateMbtiInsight(mbtiType, selectedVibe || 'dream')
            .then(insight => setAiInsight(insight))
            .catch(() => setAiInsight(''));

        try {
            const typeData = MBTI_TYPES.find(t => t.id === mbtiType);
            const vibeData = VIBES.find(v => v.id === selectedVibe);
            const texts = COPY_TEMPLATES[mbtiType] || COPY_TEMPLATES['DEFAULT'];
            const randomText = texts[Math.floor(Math.random() * texts.length)];

            // 进度回调函数
            const handleProgress: ProgressCallback = (progress, status) => {
                setGenerationProgress(progress);
                setGenerationStatus(status);
            };

            // 使用 AI 服务生成图片
            const imageResult = await generatePersonaImage(
                mbtiType,
                selectedVibe || 'dream',
                handleProgress
            );

            const result = {
                type: typeData,
                vibe: vibeData,
                text: randomText,
                imageUrl: imageResult.imageUrl,
                isPlaceholder: imageResult.isPlaceholder,
                isLocalImage: imageResult.isLocalImage
            };

            setCardData(result);

            // Save to Supabase Personas Table
            if (session?.user) {
                const { data, error } = await supabase.from('personas').insert({
                    user_id: session.user.id,
                    mbti_type: mbtiType,
                    vibe: selectedVibe || 'dream',
                    result_text: randomText,
                    image_url: imageResult.imageUrl,
                    is_favorite: false
                }).select('id').single();

                if (error) {
                    console.log('Error saving persona:', error);
                } else if (data) {
                    setCurrentPersonaId(data.id);
                }
            }

            setPhase('card');
        } catch (error) {
            console.error('Generation error:', error);
            Alert.alert('生成失败', '请稍后重试');
            setPhase('vibe');
        } finally {
            setIsGenerating(false);
        }
    };

    // 分享图片
    const handleShare = async () => {
        if (!cardData?.imageUrl) return;
        await shareImage(cardData.imageUrl, `我的 ${cardData.type?.id} 人格卡片`);
    };

    // 保存图片
    const handleSave = async () => {
        if (!cardData?.imageUrl) return;
        await saveImageToGallery(cardData.imageUrl);
    };

    // 切换收藏状态
    const toggleFavorite = async () => {
        if (!currentPersonaId) return;

        const newStatus = !isFavorited;
        const { error } = await supabase
            .from('personas')
            .update({ is_favorite: newStatus })
            .eq('id', currentPersonaId);

        if (!error) {
            setIsFavorited(newStatus);
        }
    };

    // 加载中状态
    if (!fontsLoaded || isLoadingSession || isLoadingResult) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={{ fontFamily: 'PatrickHand_400Regular', marginTop: 12, color: COLORS.fg }}>加载中...</Text>
            </View>
        );
    }

    const Header = ({ title, showBack, onBack }: any) => (
        <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {showBack && (
                    <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
                        <ChevronLeft size={32} color={COLORS.fg} strokeWidth={3} />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>{title}</Text>
            </View>
            {!showBack && (
                <View style={styles.avatar}>
                    <Text style={{ fontFamily: 'Kalam_700Bold', fontSize: 18, color: COLORS.fg }}>
                        {session?.user?.email?.[0].toUpperCase() || 'Z'}
                    </Text>
                </View>
            )}
        </View>
    );

    // AUTH GUARD: If no session, show AuthView
    if (!session) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.bgPattern} pointerEvents="none" />
                <AuthView onLogin={() => { }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Decorative Background Pattern Simulation */}
            <View style={styles.bgPattern} pointerEvents="none" />

            {/* Main Content Area */}
            <View style={styles.mainFrame}>

                {/* Show Main App Flow unless in Profile Tab */}
                {activeTab !== 'profile' && (
                    <>
                        {/* PHASE: HOME - 欢迎页/新用户入口 */}
                        {phase === 'home' && (
                            <ScrollView
                                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={[styles.stepContainer, { justifyContent: 'flex-start', alignItems: 'center', paddingTop: 16 }]}>
                                    {/* 顶部: Logo + 吉祥物 */}
                                    <View style={styles.topSection}>
                                        <View style={styles.logoContainerSmall}>
                                            <View style={styles.logoBoxSmall}>
                                                <PenTool size={24} color={COLORS.fg} strokeWidth={2.5} />
                                            </View>
                                            <Text style={styles.logoTextSmall}>PersonaPop</Text>
                                        </View>
                                        <Image
                                            source={require('@/assets/images/mascot-home.png')}
                                            style={styles.mascotTop}
                                            contentFit="contain"
                                        />
                                    </View>

                                    {/* 根据是否有结果显示不同内容 */}
                                    {mbtiResult ? (
                                        // 已有结果 - 显示当前类型卡片
                                        <TouchableOpacity 
                                            style={styles.currentTypeCard}
                                            onPress={() => {
                                                setActiveTab('create');
                                                setPhase('detail');
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Image
                                                source={MBTI_IMAGES[mbtiResult.type]}
                                                style={styles.currentTypeImage}
                                                contentFit="contain"
                                            />
                                            <View style={styles.currentTypeInfo}>
                                                <Text style={styles.currentTypeLabel}>你的人格</Text>
                                                <Text style={styles.currentTypeText}>{mbtiResult.type}</Text>
                                                <Text style={styles.currentTypeName}>
                                                    {MBTI_TYPES.find(t => t.id === mbtiResult.type)?.name}
                                                </Text>
                                                <Text style={styles.currentTypeHint}>点击查看 AI 解码 →</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        // 新用户 - 显示引导便签
                                        <StickyNote style={{ marginBottom: 32, transform: [{ rotate: '2deg' }] }}>
                                            <Text style={styles.noteText}>
                                                通过 MBTI 测试了解自己，{`\n`}生成专属人格卡片！✏️
                                            </Text>
                                        </StickyNote>
                                    )}

                                    <HandButton onPress={() => setPhase('test')} style={{ width: '100%', marginBottom: 12 }} icon={ArrowRight}>
                                        {mbtiResult ? '重新测试' : '开始测试'}
                                    </HandButton>

                                    {/* 跳过测试入口 - 仅新用户显示 */}
                                    {!mbtiResult && (
                                        <TouchableOpacity 
                                            onPress={() => setPhase('quickSelect')} 
                                            style={styles.skipTestLink}
                                        >
                                            <Text style={styles.skipTestText}>
                                                已知道自己的类型？直接选择
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* 探索 16 种人格 - 所有用户都显示 */}
                                    <View style={styles.exploreSection}>
                                        <View style={styles.exploreDivider}>
                                            <View style={styles.line} />
                                            <Text style={styles.exploreSectionTitle}>探索 16 种人格</Text>
                                            <View style={styles.line} />
                                        </View>
                                        <ScrollView 
                                            horizontal 
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.exploreScroll}
                                            contentOffset={{ x: 40, y: 0 }}
                                        >
                                            {MBTI_TYPES.map((type) => (
                                                <TouchableOpacity
                                                    key={type.id}
                                                    onPress={() => setExploreTypeId(type.id)}
                                                    activeOpacity={0.8}
                                                    style={[
                                                        styles.exploreCard,
                                                        mbtiResult?.type === type.id && styles.exploreCardActive
                                                    ]}
                                                >
                                                    <Image
                                                        source={MBTI_IMAGES[type.id]}
                                                        style={styles.exploreCardImage}
                                                        contentFit="contain"
                                                    />
                                                    <Text style={styles.exploreCardType}>{type.id}</Text>
                                                    <Text style={styles.exploreCardName}>{type.name}</Text>
                                                    {mbtiResult?.type === type.id && (
                                                        <View style={styles.currentBadge}>
                                                            <Text style={styles.currentBadgeText}>当前</Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <View style={styles.socialProof}>
                                        <View style={styles.line} />
                                        <Text style={styles.socialText}>已有 12k+ 人完成测试</Text>
                                        <View style={styles.line} />
                                    </View>
                                </View>
                            </ScrollView>
                        )}

                        {/* PHASE: TEST - MBTI 测试 */}
                        {phase === 'test' && (
                            <MbtiTest
                                onComplete={handleTestComplete}
                                onBack={() => setPhase('home')}
                            />
                        )}

                        {/* PHASE: QUICK SELECT - 快速选择类型 */}
                        {phase === 'quickSelect' && (
                            <View style={{ flex: 1 }}>
                                <Header title="选择你的类型" showBack onBack={() => setPhase('home')} />
                                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                                    <Text style={styles.quickSelectHint}>
                                        选择你已知的 MBTI 类型，或者
                                        <Text 
                                            style={{ color: COLORS.accent, textDecorationLine: 'underline' }}
                                            onPress={() => setPhase('test')}
                                        > 去测试 </Text>
                                        了解真实的自己
                                    </Text>
                                    <View style={styles.grid}>
                                        {MBTI_TYPES.map((type) => (
                                            <HandCard
                                                key={type.id}
                                                onPress={() => handleQuickSelect(type.id)}
                                                style={{ width: '47%', marginBottom: 16, height: 180 }}
                                            >
                                                <View style={{ flex: 1, alignItems: 'center' }}>
                                                    <Image
                                                        source={MBTI_IMAGES[type.id]}
                                                        style={styles.typeCardImage}
                                                        contentFit="contain"
                                                    />
                                                    <View style={{ alignItems: 'center', marginTop: 4 }}>
                                                        <Text style={styles.cardTitle}>{type.id}</Text>
                                                        <Text style={styles.cardSubtitle}>{type.name}</Text>
                                                    </View>
                                                </View>
                                            </HandCard>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        {/* PHASE: RESULT - 玩法中心 */}
                        {phase === 'result' && mbtiResult && (
                            <MbtiResultView
                                result={mbtiResult}
                                testDate={storedResultDate || undefined}
                                onGenerateCard={() => setPhase('vibe')}
                                onViewDetail={() => setPhase('detail')}
                                onCompare={() => setPhase('compare')}
                            />
                        )}

                        {/* PHASE: COMPARE - 类型对比 */}
                        {phase === 'compare' && mbtiResult && (
                            <TypeCompareView
                                myType={mbtiResult.type}
                                onBack={() => setPhase('result')}
                            />
                        )}

                        {/* PHASE: DETAIL - AI 生成的人格详情 */}
                        {phase === 'detail' && mbtiResult && (
                            <MbtiDetailView
                                result={mbtiResult}
                                onBack={() => setPhase('result')}
                            />
                        )}

                        {/* PHASE: VIBE - 风格选择 */}
                        {phase === 'vibe' && mbtiResult && (
                            <View style={{ flex: 1 }}>
                                <Header title="选择卡片风格" showBack onBack={() => setPhase('result')} />
                                <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
                                    {VIBES.map((vibe) => (
                                        <TouchableOpacity
                                            key={vibe.id}
                                            onPress={() => { setSelectedVibe(vibe.id); generatePersonaCard(); }}
                                            activeOpacity={0.9}
                                            style={{ marginBottom: 16 }}
                                        >
                                            <View style={[styles.vibeCardShadow]} />
                                            <View style={styles.vibeCard}>
                                                <Text style={{ fontSize: 32, marginRight: 16 }}>{vibe.icon}</Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.vibeTitle}>{vibe.label}</Text>
                                                    <Text style={styles.vibeDesc}>{vibe.desc}</Text>
                                                </View>
                                                <ArrowRight size={24} color={COLORS.fg} strokeWidth={3} />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* PHASE: GENERATING - 生成中 */}
                        {phase === 'generating' && mbtiResult && (
                            <View style={[styles.stepContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                                {/* 角色图片 */}
                                <View style={styles.loadingImageContainer}>
                                    <Image
                                        source={MBTI_IMAGES[mbtiResult.type]}
                                        style={styles.loadingImage}
                                        contentFit="contain"
                                    />
                                </View>
                                
                                {/* 类型名称 */}
                                <Text style={styles.loadingType}>
                                    {mbtiResult.type} · {MBTI_TYPES.find(t => t.id === mbtiResult.type)?.name}
                                </Text>
                                
                                {/* 特点标签 */}
                                <View style={styles.traitsContainer}>
                                    {MBTI_FACTS[mbtiResult.type]?.traits.map((trait, index) => (
                                        <View key={index} style={styles.traitTag}>
                                            <Text style={styles.traitText}>{trait}</Text>
                                        </View>
                                    ))}
                                </View>
                                
                                {/* 进度条 */}
                                <Text style={styles.loadingTitle}>{generationStatus || '正在素描中...'}</Text>
                                <View style={styles.loadingBar}>
                                    <View style={[styles.loadingProgress, { width: `${generationProgress}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{Math.round(generationProgress)}%</Text>
                                
                                {/* AI 洞察 */}
                                {aiInsight ? (
                                    <View style={styles.aiInsightCard}>
                                        <Text style={styles.aiInsightEmoji}>🤖</Text>
                                        <Text style={styles.aiInsightText}>{aiInsight}</Text>
                                    </View>
                                ) : (
                                    currentFact && (
                                        <View style={styles.factCard}>
                                            <Text style={styles.factEmoji}>💡</Text>
                                            <Text style={styles.factText}>{currentFact}</Text>
                                        </View>
                                    )
                                )}
                                
                                {/* 有趣语录 */}
                                <Text style={styles.funnyQuote}>
                                    "{MBTI_FACTS[mbtiResult.type]?.funnyQuote}"
                                </Text>
                            </View>
                        )}

                        {/* PHASE: CARD - 卡片结果 */}
                        {phase === 'card' && cardData && (
                            <View style={{ flex: 1 }}>
                                <Header title="完成啦！" showBack onBack={() => setPhase('result')} />

                                <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center', paddingBottom: 100 }}>
                                    <View style={styles.resultFrame}>
                                        <View style={styles.tape} />

                                        {/* 收藏按钮 */}
                                        <TouchableOpacity
                                            onPress={toggleFavorite}
                                            style={styles.favoriteBtn}
                                        >
                                            <Heart
                                                size={28}
                                                color={isFavorited ? COLORS.accent : COLORS.fg}
                                                fill={isFavorited ? COLORS.accent : 'transparent'}
                                                strokeWidth={2.5}
                                            />
                                        </TouchableOpacity>

                                        <View style={styles.resultImageContainer}>
                                            <Image
                                                source={cardData.isLocalImage ? cardData.imageUrl : { uri: cardData.imageUrl }}
                                                style={styles.resultImage}
                                                contentFit="cover"
                                                transition={300}
                                            />
                                            <View style={styles.dustOverlay} />
                                        </View>

                                        <View style={{ alignItems: 'center', marginTop: 12 }}>
                                            <Text style={styles.resultType}>{cardData.type?.id}</Text>
                                            <Text style={styles.resultText}>"{cardData.text}"</Text>
                                            {cardData.isPlaceholder && (
                                                <Text style={styles.placeholderHint}>
                                                    (示例图片 - 配置 API Key 可生成 AI 图片)
                                                </Text>
                                            )}
                                            <Sparkles size={32} color={COLORS.accent} style={{ position: 'absolute', bottom: -10, right: 0 }} />
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
                                        <HandButton variant="primary" icon={Share2} style={{ flex: 1 }} onPress={handleShare}>
                                            分享
                                        </HandButton>
                                        <HandButton variant="secondary" icon={Download} style={{ flex: 1 }} onPress={handleSave}>
                                            保存
                                        </HandButton>
                                    </View>

                                    <TouchableOpacity onPress={generatePersonaCard} style={{ marginTop: 24 }} disabled={isGenerating}>
                                        <Text style={[styles.rerollText, isGenerating && { opacity: 0.5 }]}>
                                            {isGenerating ? '生成中...' : '不喜欢？重画一张'}
                                        </Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        )}
                    </>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <ProfileView 
                        onLogout={() => supabase.auth.signOut()} 
                        currentMbtiType={mbtiResult?.type}
                        onViewDetail={() => {
                            setActiveTab('create');
                            setPhase('detail');
                        }}
                    />
                )}

                {/* 探索类型详情 Modal */}
                <Modal
                    visible={!!exploreTypeId}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setExploreTypeId(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {exploreTypeId && (
                                <>
                                    <TouchableOpacity 
                                        style={styles.modalClose} 
                                        onPress={() => setExploreTypeId(null)}
                                    >
                                        <Text style={styles.modalCloseText}>×</Text>
                                    </TouchableOpacity>
                                    
                                    <Image
                                        source={MBTI_IMAGES[exploreTypeId]}
                                        style={styles.modalImage}
                                        contentFit="contain"
                                    />
                                    
                                    <Text style={styles.modalType}>{exploreTypeId}</Text>
                                    <Text style={styles.modalName}>
                                        {MBTI_TYPES.find(t => t.id === exploreTypeId)?.name}
                                    </Text>
                                    
                                    {/* 特点标签 */}
                                    <View style={styles.modalTraits}>
                                        {MBTI_FACTS[exploreTypeId]?.traits.map((trait, i) => (
                                            <View key={i} style={styles.modalTraitTag}>
                                                <Text style={styles.modalTraitText}>{trait}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    
                                    {/* 有趣语录 */}
                                    <Text style={styles.modalQuote}>
                                        "{MBTI_FACTS[exploreTypeId]?.funnyQuote}"
                                    </Text>
                                    
                                    {/* 我是这个按钮 */}
                                    <HandButton 
                                        onPress={() => {
                                            handleQuickSelect(exploreTypeId);
                                            setExploreTypeId(null);
                                        }}
                                        style={{ marginTop: 16, width: '100%' }}
                                    >
                                        我是这个！
                                    </HandButton>
                                    
                                    <TouchableOpacity 
                                        onPress={() => setExploreTypeId(null)}
                                        style={{ marginTop: 12 }}
                                    >
                                        <Text style={styles.modalContinue}>继续浏览</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* BOTTOM NAV */}
                <View style={styles.bottomNav}>
                    {/* 首页: 测试人格入口 */}
                    <TouchableOpacity 
                        onPress={() => { 
                            setActiveTab('home'); 
                            // 首页始终是测试入口
                            setPhase(mbtiResult ? 'home' : 'home'); 
                        }} 
                        style={styles.navItem}
                    >
                        <Home size={28} color={activeTab === 'home' && phase !== 'result' ? COLORS.accent : COLORS.fg} strokeWidth={2.5} style={activeTab !== 'home' && { opacity: 0.5 }} />
                        <Text style={[styles.navText, activeTab === 'home' && phase !== 'result' && { color: COLORS.accent }]}>测试</Text>
                    </TouchableOpacity>

                    {/* 闪电: 玩法中心 */}
                    <View style={{ marginTop: -40 }}>
                        <TouchableOpacity
                            onPress={() => { 
                                setActiveTab('create'); 
                                if (mbtiResult) {
                                    // 有结果，进入玩法中心
                                    setPhase('result');
                                } else {
                                    // 没有结果，提示先测试
                                    Alert.alert(
                                        '请先完成测试',
                                        '了解你的人格类型后，才能解锁更多玩法哦~',
                                        [
                                            { text: '稍后再说', style: 'cancel' },
                                            { text: '去测试', onPress: () => { setActiveTab('home'); setPhase('test'); } },
                                        ]
                                    );
                                }
                            }}
                            activeOpacity={0.9}
                            style={[styles.fab, !mbtiResult && { opacity: 0.6 }]}
                        >
                            <Zap size={32} color="white" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>

                    {/* 我的: 个人主页 */}
                    <TouchableOpacity onPress={() => setActiveTab('profile')} style={styles.navItem}>
                        <User size={28} color={activeTab === 'profile' ? COLORS.accent : COLORS.fg} strokeWidth={2.5} style={activeTab !== 'profile' && { opacity: 0.5 }} />
                        <Text style={[styles.navText, activeTab === 'profile' && { color: COLORS.accent }]}>我的</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    bgPattern: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.bg,
        opacity: 0.5,
    },
    mainFrame: {
        flex: 1,
    },
    stepContainer: {
        flex: 1,
        padding: 24,
        minHeight: 600,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        borderBottomWidth: 2,
        borderColor: COLORS.fg,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(253, 251, 247, 0.9)',
        zIndex: 10,
    },
    headerTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 28,
        color: COLORS.fg,
        transform: [{ rotate: '-1deg' }],
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.fg,
        backgroundColor: COLORS.yellow,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.fg,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 0,
    },
    // 顶部布局
    topSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoContainerSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    logoBoxSmall: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: COLORS.fg,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        transform: [{ rotate: '-3deg' }],
    },
    logoTextSmall: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 28,
        color: COLORS.fg,
    },
    mascotTop: {
        width: 180,
        height: 180,
    },
    // Hero (保留旧样式兼容)
    heroMascotContainer: {
        width: 180,
        height: 180,
        marginBottom: 16,
    },
    heroMascot: {
        width: '100%',
        height: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoBox: {
        width: 96,
        height: 96,
        backgroundColor: 'white',
        borderWidth: 4,
        borderColor: COLORS.fg,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        transform: [{ rotate: '-3deg' }],
        shadowColor: COLORS.fg,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    heroTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 56,
        color: COLORS.fg,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 56,
        transform: [{ rotate: '-2deg' }],
    },
    noteText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 20,
        color: COLORS.fg,
        textAlign: 'center',
    },
    socialProof: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        opacity: 0.6,
        gap: 8,
    },
    line: {
        height: 2,
        width: 40,
        backgroundColor: COLORS.fg,
        borderRadius: 1,
    },
    socialText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: COLORS.fg,
    },
    // 跳过测试链接
    skipTestLink: {
        marginTop: 8,
        paddingVertical: 4,
    },
    skipTestText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#888',
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted',
    },
    // 快速选择提示
    quickSelectHint: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
        lineHeight: 24,
    },
    // Test button
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: COLORS.accent,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 24,
        marginBottom: 16,
        gap: 8,
    },
    testButtonText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: COLORS.accent,
    },
    // Cards
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 24,
    },
    cardTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 22,
        color: COLORS.fg,
        transform: [{ rotate: '-1deg' }],
    },
    cardSubtitle: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#666',
    },
    typeCardImage: {
        width: 100,
        height: 100,
    },
    colorBar: {
        height: 12,
        width: '100%',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.fg,
    },
    // Vibe Cards
    vibeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 12,
        padding: 16,
        height: 90,
    },
    vibeCardShadow: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: '100%',
        height: 90,
        backgroundColor: COLORS.fg,
        borderRadius: 12,
    },
    vibeTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 24,
        color: COLORS.fg,
    },
    vibeDesc: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: '#666',
    },
    // Loading
    loadingImageContainer: {
        width: 160,
        height: 160,
        marginBottom: 16,
    },
    loadingImage: {
        width: '100%',
        height: '100%',
    },
    loadingType: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 28,
        color: COLORS.fg,
        marginBottom: 12,
    },
    traitsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    traitTag: {
        backgroundColor: COLORS.yellow,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.fg,
    },
    traitText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: COLORS.fg,
    },
    loadingTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 20,
        color: COLORS.fg,
        marginTop: 8,
    },
    loadingBar: {
        width: 240,
        height: 16,
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 8,
        marginTop: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    loadingProgress: {
        height: '100%',
        backgroundColor: COLORS.accent,
        borderRadius: 5,
    },
    progressText: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 18,
        color: COLORS.accent,
        marginTop: 6,
    },
    factCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: COLORS.fg,
        borderRadius: 12,
        padding: 12,
        marginTop: 20,
        maxWidth: 300,
        borderStyle: 'dashed',
    },
    factEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    factText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: COLORS.fg,
        flex: 1,
        lineHeight: 20,
    },
    aiInsightCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.accent,
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 12,
        padding: 12,
        marginTop: 20,
        maxWidth: 300,
    },
    aiInsightEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    aiInsightText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 15,
        color: 'white',
        flex: 1,
        lineHeight: 22,
    },
    funnyQuote: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    // Result
    resultFrame: {
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 4,
        borderColor: COLORS.fg,
        padding: 16,
        transform: [{ rotate: '1deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    tape: {
        position: 'absolute',
        top: -16,
        alignSelf: 'center',
        width: 120,
        height: 32,
        backgroundColor: 'rgba(229, 224, 216, 0.8)',
        transform: [{ rotate: '-2deg' }],
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        zIndex: 20,
    },
    resultImageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderWidth: 3,
        borderColor: COLORS.fg,
        backgroundColor: '#eee',
        marginBottom: 16,
        overflow: 'hidden',
    },
    resultImage: {
        width: '100%',
        height: '100%',
    },
    dustOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,249,196, 0.1)',
        zIndex: 5,
    },
    resultType: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 48,
        color: COLORS.fg,
        transform: [{ rotate: '-2deg' }],
        marginBottom: 8,
    },
    resultText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 20,
        color: COLORS.fg,
        textAlign: 'center',
        lineHeight: 26,
    },
    rerollText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: '#666',
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted',
    },
    favoriteBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 30,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.fg,
    },
    placeholderHint: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    // Bottom Nav
    bottomNav: {
        height: 80,
        backgroundColor: COLORS.bg,
        borderTopWidth: 3,
        borderColor: COLORS.fg,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.fg,
        marginTop: 4,
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.fg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.bg,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    // 当前类型卡片
    currentTypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 4,
        borderColor: COLORS.fg,
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        width: '100%',
        shadowColor: COLORS.fg,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    currentTypeImage: {
        width: 100,
        height: 100,
    },
    currentTypeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    currentTypeLabel: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#888',
    },
    currentTypeText: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 42,
        color: COLORS.fg,
        lineHeight: 46,
    },
    currentTypeName: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: COLORS.accent,
    },
    currentTypeHint: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    // 探索模块
    exploreSection: {
        width: '100%',
        marginTop: 16,
        marginBottom: 8,
    },
    exploreDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 12,
    },
    exploreSectionTitle: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: COLORS.fg,
    },
    exploreScroll: {
        paddingHorizontal: 8,
        gap: 12,
    },
    exploreCard: {
        width: 100,
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        shadowColor: COLORS.fg,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
    },
    exploreCardImage: {
        width: 64,
        height: 64,
    },
    exploreCardType: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 16,
        color: COLORS.fg,
        marginTop: 4,
    },
    exploreCardName: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 12,
        color: '#666',
    },
    exploreCardActive: {
        borderColor: COLORS.accent,
        backgroundColor: '#FFF5F5',
    },
    currentBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.accent,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.fg,
    },
    currentBadgeText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 10,
        color: 'white',
    },
    // 探索 Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: COLORS.bg,
        borderWidth: 4,
        borderColor: COLORS.fg,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 8,
        right: 12,
        zIndex: 10,
    },
    modalCloseText: {
        fontSize: 32,
        color: COLORS.fg,
        fontWeight: 'bold',
    },
    modalImage: {
        width: 120,
        height: 120,
        marginBottom: 12,
    },
    modalType: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 36,
        color: COLORS.fg,
        transform: [{ rotate: '-2deg' }],
    },
    modalName: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 20,
        color: '#666',
        marginBottom: 12,
    },
    modalTraits: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    modalTraitTag: {
        backgroundColor: COLORS.yellow,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.fg,
    },
    modalTraitText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 13,
        color: COLORS.fg,
    },
    modalQuote: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    modalContinue: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#888',
        textDecorationLine: 'underline',
    },
});
