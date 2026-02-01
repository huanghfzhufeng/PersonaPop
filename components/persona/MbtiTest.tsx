import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '../../constants/persona';
import { MBTI_FACTS } from '../../constants/mbti-facts';
import { MBTI_TEST_QUESTIONS, calculateMbtiResult, TEST_PROGRESS_MESSAGES } from '../../constants/mbti-test';
import { HandButton } from './HandButton';
import { analyzeTestResult } from '../../lib/deepseek-service';

interface MbtiTestProps {
    onComplete: (mbtiType: string) => void;
    onBack: () => void;
}

export const MbtiTest = ({ onComplete, onBack }: MbtiTestProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState('');

    const currentQuestion = MBTI_TEST_QUESTIONS[currentIndex];
    const progress = ((currentIndex + 1) / MBTI_TEST_QUESTIONS.length) * 100;
    const progressMessage = TEST_PROGRESS_MESSAGES[Math.floor(currentIndex / 3)] || TEST_PROGRESS_MESSAGES[0];

    const handleAnswer = (value: string) => {
        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        // 自动进入下一题或显示结果
        if (currentIndex < MBTI_TEST_QUESTIONS.length - 1) {
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
            }, 300);
        } else {
            // 计算结果
            const mbtiResult = calculateMbtiResult(newAnswers);
            setResult(mbtiResult);
            
            // 异步获取 AI 分析
            analyzeTestResult(mbtiResult, newAnswers)
                .then(analysis => setAiAnalysis(analysis))
                .catch(() => setAiAnalysis(''));
            
            setTimeout(() => {
                setShowResult(true);
            }, 500);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // 显示结果页面
    if (showResult && result) {
        const typeInfo = MBTI_TYPES.find(t => t.id === result);
        const facts = MBTI_FACTS[result];

        return (
            <ScrollView contentContainerStyle={styles.resultContainer}>
                <View style={styles.resultCard}>
                    <View style={styles.tape} />
                    
                    {/* 角色图片 */}
                    <Image
                        source={MBTI_IMAGES[result]}
                        style={styles.resultImage}
                        contentFit="contain"
                    />

                    {/* 结果标题 */}
                    <Text style={styles.resultTitle}>你是</Text>
                    <Text style={styles.resultType}>{result}</Text>
                    <Text style={styles.resultName}>{typeInfo?.name}</Text>

                    {/* 特点标签 */}
                    <View style={styles.traitsRow}>
                        {facts?.traits.map((trait, index) => (
                            <View key={index} style={styles.traitBadge}>
                                <Text style={styles.traitBadgeText}>{trait}</Text>
                            </View>
                        ))}
                    </View>

                    {/* AI 分析 或 有趣语录 */}
                    <View style={styles.quoteBox}>
                        <Sparkles size={20} color={COLORS.accent} />
                        <Text style={styles.quoteText}>
                            {aiAnalysis || `"${facts?.funnyQuote}"`}
                        </Text>
                    </View>
                </View>

                {/* 操作按钮 */}
                <View style={styles.resultActions}>
                    <HandButton 
                        variant="primary" 
                        onPress={() => onComplete(result)}
                        style={{ flex: 1 }}
                    >
                        继续生成人格卡片
                    </HandButton>
                </View>

                <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
                    <Text style={styles.backLink}>重新测试</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    // 测试问题页面
    return (
        <View style={styles.container}>
            {/* 头部 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ChevronLeft size={28} color={COLORS.fg} strokeWidth={3} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>MBTI 快速测试</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* 进度条 */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {currentIndex + 1} / {MBTI_TEST_QUESTIONS.length}
                </Text>
            </View>

            {/* 进度提示 */}
            <Text style={styles.progressMessage}>{progressMessage}</Text>

            {/* 问题卡片 */}
            <View style={styles.questionCard}>
                <Text style={styles.questionNumber}>Q{currentQuestion.id}</Text>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>

                {/* 选项 */}
                <TouchableOpacity
                    style={[
                        styles.optionBtn,
                        answers[currentQuestion.id] === currentQuestion.optionA.value && styles.optionSelected
                    ]}
                    onPress={() => handleAnswer(currentQuestion.optionA.value)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.optionLabel}>A</Text>
                    <Text style={styles.optionText}>{currentQuestion.optionA.text}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.optionBtn,
                        answers[currentQuestion.id] === currentQuestion.optionB.value && styles.optionSelected
                    ]}
                    onPress={() => handleAnswer(currentQuestion.optionB.value)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.optionLabel}>B</Text>
                    <Text style={styles.optionText}>{currentQuestion.optionB.text}</Text>
                </TouchableOpacity>
            </View>

            {/* 导航按钮 */}
            <View style={styles.navButtons}>
                {currentIndex > 0 && (
                    <TouchableOpacity onPress={goToPrevious} style={styles.navBtn}>
                        <ChevronLeft size={24} color={COLORS.fg} />
                        <Text style={styles.navBtnText}>上一题</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 24,
        color: COLORS.fg,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    progressBar: {
        flex: 1,
        height: 12,
        backgroundColor: 'white',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.fg,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.accent,
        borderRadius: 4,
    },
    progressText: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 16,
        color: COLORS.fg,
    },
    progressMessage: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#888',
        marginBottom: 24,
    },
    questionCard: {
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 16,
        padding: 24,
        shadowColor: COLORS.fg,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    questionNumber: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 18,
        color: COLORS.accent,
        marginBottom: 8,
    },
    questionText: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 24,
        color: COLORS.fg,
        marginBottom: 24,
        lineHeight: 32,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        borderWidth: 2,
        borderColor: COLORS.fg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    optionSelected: {
        backgroundColor: COLORS.yellow,
        borderColor: COLORS.accent,
        borderWidth: 3,
    },
    optionLabel: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 20,
        color: COLORS.accent,
        marginRight: 12,
        width: 28,
    },
    optionText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: COLORS.fg,
        flex: 1,
    },
    navButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 24,
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    navBtnText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: COLORS.fg,
    },
    // Result styles
    resultContainer: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultCard: {
        backgroundColor: 'white',
        borderWidth: 4,
        borderColor: COLORS.fg,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        position: 'relative',
    },
    tape: {
        position: 'absolute',
        top: -16,
        width: 100,
        height: 28,
        backgroundColor: 'rgba(229, 224, 216, 0.9)',
        transform: [{ rotate: '-2deg' }],
    },
    resultImage: {
        width: 180,
        height: 180,
        marginBottom: 16,
    },
    resultTitle: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 20,
        color: '#888',
    },
    resultType: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 56,
        color: COLORS.fg,
        transform: [{ rotate: '-2deg' }],
    },
    resultName: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 28,
        color: COLORS.accent,
        marginBottom: 16,
    },
    traitsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    traitBadge: {
        backgroundColor: COLORS.yellow,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.fg,
    },
    traitBadgeText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: COLORS.fg,
    },
    quoteBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.bg,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    quoteText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: COLORS.fg,
        fontStyle: 'italic',
        flex: 1,
    },
    resultActions: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 24,
    },
    backLink: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#888',
        textDecorationLine: 'underline',
    },
});
