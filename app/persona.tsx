import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { Sparkles, Share2, Download, Zap, User, Home, ArrowRight, ChevronLeft, PenTool } from 'lucide-react-native';
import { useFonts, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

import { COLORS, MBTI_TYPES, VIBES, COPY_TEMPLATES } from '@/constants/persona';
import { HandButton } from '@/components/persona/HandButton';
import { HandCard } from '@/components/persona/HandCard';
import { StickyNote } from '@/components/persona/StickyNote';
import { AuthView } from '@/components/persona/AuthView';
import { ProfileView } from '@/components/persona/ProfileView';

// Types
type Tab = 'home' | 'create' | 'profile';

export default function PersonaPopHandDrawn() {
    let [fontsLoaded] = useFonts({
        Kalam_700Bold,
        PatrickHand_400Regular,
    });

    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [step, setStep] = useState(0);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
    const [resultData, setResultData] = useState<any>(null);

    // Auth State
    const [session, setSession] = useState<any>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoadingSession(false);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    }, []);

    // Reset function that puts user back to Home
    const reset = () => {
        setStep(0);
        setActiveTab('home');
        setSelectedType(null);
        setSelectedVibe(null);
        setResultData(null);
    };

    const generatePersona = async () => {
        setStep(3);

        // Simulate AI Generation + Save to DB
        setTimeout(async () => {
            const typeData = MBTI_TYPES.find(t => t.id === selectedType);
            const texts = COPY_TEMPLATES[selectedType || ''] || COPY_TEMPLATES['DEFAULT'];
            const randomText = texts[Math.floor(Math.random() * texts.length)];
            const unsplashUrl = `https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1000&auto=format&fit=crop`; // Placeholder image

            const result = {
                type: typeData,
                vibe: VIBES.find(v => v.id === selectedVibe),
                text: randomText,
                imageUrl: unsplashUrl
            };

            setResultData(result);

            // Save to Supabase Personas Table
            if (session?.user) {
                const { error } = await supabase.from('personas').insert({
                    user_id: session.user.id,
                    mbti_type: selectedType,
                    vibe: selectedVibe,
                    result_text: randomText,
                    image_url: unsplashUrl
                });

                if (error) {
                    console.log('Error saving persona (table might not exist yet):', error);
                }
            }

            setStep(4);
        }, 2500);
    };

    if (!fontsLoaded || isLoadingSession) {
        return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
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
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        style={{ flex: 1 }}
                    >

                        {/* STEP 0: HERO */}
                        {step === 0 && (
                            <View style={[styles.stepContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                                <View style={styles.logoContainer}>
                                    <View style={styles.logoBox}>
                                        <PenTool size={40} color={COLORS.fg} strokeWidth={2.5} />
                                    </View>
                                    <Zap size={32} color={COLORS.accent} style={{ position: 'absolute', top: -20, right: -20, transform: [{ rotate: '15deg' }] }} />
                                </View>

                                <Text style={styles.heroTitle}>
                                    Persona{'\n'}
                                    <Text style={{ color: COLORS.accent, textDecorationLine: 'underline' }}>Pop</Text>
                                </Text>

                                <StickyNote style={{ marginBottom: 40, transform: [{ rotate: '2deg' }] }}>
                                    <Text style={styles.noteText}>
                                        把你的 MBTI 变成一张手绘涂鸦。{'\n'}拒绝无聊的图表！✏️
                                    </Text>
                                </StickyNote>

                                <HandButton onPress={() => setStep(1)} style={{ width: '100%' }} icon={ArrowRight}>
                                    开始涂鸦
                                </HandButton>

                                <View style={styles.socialProof}>
                                    <View style={styles.line} />
                                    <Text style={styles.socialText}>已有 12k+ 人创作</Text>
                                    <View style={styles.line} />
                                </View>
                            </View>
                        )}

                        {/* STEP 1: TYPE SELECTION */}
                        {step === 1 && (
                            <View style={{ flex: 1 }}>
                                <Header title="你是哪种人格?" showBack onBack={() => { setStep(0); setActiveTab('home'); }} />
                                <View style={styles.grid}>
                                    {MBTI_TYPES.map((type) => (
                                        <HandCard
                                            key={type.id}
                                            onPress={() => { setSelectedType(type.id); setStep(2); }}
                                            style={{ width: '47%', marginBottom: 16, height: 140 }}
                                        >
                                            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                                <View>
                                                    <Text style={styles.cardTitle}>{type.id}</Text>
                                                    <Text style={styles.cardSubtitle}>{type.name}</Text>
                                                </View>
                                                <View style={[styles.colorBar, { backgroundColor: type.color }]} />
                                            </View>
                                        </HandCard>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* STEP 2: VIBE SELECTION */}
                        {step === 2 && (
                            <View style={{ flex: 1 }}>
                                <Header title="当前心情 (Vibe)" showBack onBack={() => setStep(1)} />
                                <View style={{ padding: 24, gap: 16 }}>
                                    {VIBES.map((vibe) => (
                                        <TouchableOpacity
                                            key={vibe.id}
                                            onPress={() => { setSelectedVibe(vibe.id); generatePersona(); }}
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
                                </View>
                            </View>
                        )}

                        {/* STEP 3: LOADING */}
                        {step === 3 && (
                            <View style={[styles.stepContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                                <View style={{ marginBottom: 32 }}>
                                    <PenTool size={64} color={COLORS.fg} />
                                </View>
                                <Text style={styles.loadingTitle}>正在素描中...</Text>
                                <View style={styles.loadingBar}>
                                    <View style={styles.loadingProgress} />
                                </View>
                                <Text style={[styles.noteText, { marginTop: 16, color: '#888' }]}>
                                    正在捕捉 {selectedType} 的灵魂碎片
                                </Text>
                            </View>
                        )}

                        {/* STEP 4: RESULT */}
                        {step === 4 && resultData && (
                            <View style={{ flex: 1 }}>
                                <Header title="完成啦！" showBack onBack={reset} />

                                <View style={{ padding: 24, alignItems: 'center' }}>

                                    <View style={styles.resultFrame}>
                                        <View style={styles.tape} />

                                        <View style={styles.resultImageContainer}>
                                            <Image
                                                source={{ uri: resultData.imageUrl }}
                                                style={styles.resultImage}
                                                contentFit="cover" // Expo Image style
                                            />
                                            <View style={styles.dustOverlay} />
                                        </View>

                                        <View style={{ alignItems: 'center', marginTop: 12 }}>
                                            <Text style={styles.resultType}>{resultData.type.id}</Text>
                                            <Text style={styles.resultText}>"{resultData.text}"</Text>
                                            <Sparkles size={32} color={COLORS.accent} style={{ position: 'absolute', bottom: -10, right: 0 }} />
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
                                        <HandButton variant="primary" icon={Share2} style={{ flex: 1 }}>分享</HandButton>
                                        <HandButton variant="secondary" icon={Download} style={{ flex: 1 }}>保存</HandButton>
                                    </View>

                                    <TouchableOpacity onPress={generatePersona} style={{ marginTop: 24 }}>
                                        <Text style={styles.rerollText}>不喜欢？重画一张</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <ProfileView onLogout={() => supabase.auth.signOut()} />
                )}

                {/* BOTTOM NAV */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity onPress={() => { setActiveTab('home'); if (step > 0) reset(); }} style={styles.navItem}>
                        <Home size={28} color={activeTab === 'home' ? COLORS.accent : COLORS.fg} strokeWidth={2.5} style={activeTab !== 'home' && { opacity: 0.5 }} />
                        <Text style={[styles.navText, activeTab === 'home' && { color: COLORS.accent }]}>首页</Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: -40 }}>
                        <TouchableOpacity
                            onPress={() => { setActiveTab('create'); setStep(1); }}
                            activeOpacity={0.9}
                            style={styles.fab}
                        >
                            <Zap size={32} color="white" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>

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
    // Hero
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
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
    // Cards
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 24,
    },
    cardTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 28,
        color: COLORS.fg,
        transform: [{ rotate: '-1deg' }],
    },
    cardSubtitle: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#666',
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
    loadingTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 32,
        color: COLORS.fg,
        marginTop: 20,
    },
    loadingBar: {
        width: 200,
        height: 18,
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 9,
        marginTop: 16,
        overflow: 'hidden',
    },
    loadingProgress: {
        height: '100%',
        width: '60%',
        backgroundColor: COLORS.accent,
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
    }
});
