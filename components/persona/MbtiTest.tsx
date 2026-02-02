import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Alert, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Clock, Zap, Target, CheckCircle, RotateCcw } from 'lucide-react-native';
import { COLORS } from '@/constants/persona';
import { getQuestionsForMode } from '@/constants/mbti-questions';
import { TestMode, MbtiResult, Answers, MbtiQuestion, LikertValue } from '@/lib/mbti-types';
import { computeMbti } from '@/lib/mbti-calculation';
import { LikertScale } from './LikertScale';
import { HandButton } from './HandButton';

const STORAGE_KEY = 'mbti_test_progress';

interface MbtiTestProps {
  onComplete: (result: MbtiResult, answers: Answers, durationSeconds: number, mode: TestMode) => void;
  onBack: () => void;
  initialMode?: TestMode;
}

const MODE_CONFIG: Record<TestMode, { name: string; desc: string; icon: React.ReactNode; time: string }> = {
  quick: {
    name: '极速模式',
    desc: '20题 · 约4分钟',
    icon: <Zap size={24} color={COLORS.accent} />,
    time: '4分钟',
  },
  standard: {
    name: '标准模式',
    desc: '40题 · 约10分钟',
    icon: <Target size={24} color={COLORS.secondary} />,
    time: '10分钟',
  },
  full: {
    name: '完整模式',
    desc: '60题 · 约18分钟',
    icon: <CheckCircle size={24} color="#4CAF50" />,
    time: '18分钟',
  },
};

const PROGRESS_MESSAGES = [
  '相信你的直觉 ✨',
  'INTJ 正在分析你的答案...',
  'ENFP 觉得你很有趣！',
  '已经过半啦，加油 💪',
  'INFJ 在您您点头...',
  '最后几题了，坚持住！',
  '马上揭晓你的人格密码 🔮',
];

// 维度颜色和说明
const DIMENSION_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  EI: { color: '#E91E63', bgColor: '#FCE4EC', label: '精力来源' },
  SN: { color: '#9C27B0', bgColor: '#F3E5F5', label: '信息获取' },
  TF: { color: '#2196F3', bgColor: '#E3F2FD', label: '决策方式' },
  JP: { color: '#4CAF50', bgColor: '#E8F5E9', label: '生活态度' },
};

export const MbtiTest = ({ onComplete, onBack, initialMode }: MbtiTestProps) => {
  // 阶段状态
  const [phase, setPhase] = useState<'select' | 'test'>(initialMode ? 'test' : 'select');
  const [testMode, setTestMode] = useState<TestMode>(initialMode || 'standard');

  // 测试状态
  const [questions, setQuestions] = useState<MbtiQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [startTime, setStartTime] = useState<number>(0);
  
  // 进度恢复状态
  const [savedProgress, setSavedProgress] = useState<{
    mode: TestMode;
    currentIndex: number;
    answers: Answers;
    startTime: number;
  } | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // 动画
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 加载保存的进度
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          setSavedProgress(data);
        }
      } catch (e) {
        console.log('Failed to load progress');
      } finally {
        setIsLoadingProgress(false);
      }
    };
    loadProgress();
  }, []);

  // 处理返回键
  useEffect(() => {
    const backAction = () => {
      if (phase === 'test') {
        // 测试中按返回键，弹出确认
        Alert.alert(
          '确定要退出吗？',
          '别担心，你的进度已自动保存，下次可以继续~',
          [
            { text: '继续答题', style: 'cancel' },
            { text: '退出', style: 'destructive', onPress: onBack },
          ]
        );
        return true; // 阻止默认行为
      }
      // 选择模式页面，正常返回
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [phase, onBack]);

  // 保存进度
  const saveProgress = useCallback(async (mode: TestMode, idx: number, ans: Answers, start: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode,
        currentIndex: idx,
        answers: ans,
        startTime: start,
      }));
    } catch (e) {
      console.log('Failed to save progress');
    }
  }, []);

  // 清除进度
  const clearProgress = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSavedProgress(null);
    } catch (e) {
      console.log('Failed to clear progress');
    }
  }, []);

  // 初始化测试
  useEffect(() => {
    if (phase === 'test') {
      const q = getQuestionsForMode(testMode);
      setQuestions(q);
      // 如果没有恢复进度，重置状态
      if (currentIndex === 0 && Object.keys(answers).length === 0) {
        setStartTime(Date.now());
      }
    }
  }, [phase, testMode]);

  // 开始新测试
  const startTest = async (mode: TestMode) => {
    await clearProgress();
    setTestMode(mode);
    setCurrentIndex(0);
    setAnswers({});
    setStartTime(Date.now());
    setPhase('test');
  };

  // 继续之前的测试
  const resumeTest = () => {
    if (!savedProgress) return;
    setTestMode(savedProgress.mode);
    setCurrentIndex(savedProgress.currentIndex);
    setAnswers(savedProgress.answers);
    setStartTime(savedProgress.startTime);
    setPhase('test');
  };

  // 处理答案
  const handleAnswer = (value: LikertValue) => {
    if (questions.length === 0) return;

    const questionId = questions[currentIndex].id;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // 动画切换到下一题
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setTimeout(async () => {
      if (currentIndex < questions.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        // 保存进度
        await saveProgress(testMode, nextIndex, newAnswers, startTime);
      } else {
        // 计算结果并清除进度
        await clearProgress();
        const duration = Math.round((Date.now() - startTime) / 1000);
        const result = computeMbti(newAnswers, questions);
        onComplete(result, newAnswers, duration, testMode);
      }
    }, 200);
  };

  // 返回上一题
  const goToPrevious = () => {
    if (currentIndex > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setCurrentIndex(currentIndex - 1), 100);
    }
  };

  // 获取进度消息
  const getProgressMessage = () => {
    const progressRatio = currentIndex / questions.length;
    const messageIndex = Math.min(
      Math.floor(progressRatio * PROGRESS_MESSAGES.length),
      PROGRESS_MESSAGES.length - 1
    );
    return PROGRESS_MESSAGES[messageIndex];
  };

  // 模式选择页面
  if (phase === 'select') {
    // 加载中
    if (isLoadingProgress) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.selectContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ChevronLeft size={28} color={COLORS.fg} strokeWidth={3} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>选择测试模式</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 继续上次测试 */}
        {savedProgress && (
          <TouchableOpacity
            style={styles.resumeCard}
            onPress={resumeTest}
            activeOpacity={0.8}
          >
            <View style={styles.resumeIcon}>
              <RotateCcw size={24} color="white" />
            </View>
            <View style={styles.resumeInfo}>
              <Text style={styles.resumeTitle}>继续上次测试</Text>
              <Text style={styles.resumeDesc}>
                {MODE_CONFIG[savedProgress.mode].name} · 已完成 {savedProgress.currentIndex} 题
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.selectSubtitle}>
          {savedProgress ? '或开始新测试' : '题目越多，结果越准确'}
        </Text>

        {(['quick', 'standard', 'full'] as TestMode[]).map((mode) => {
          const config = MODE_CONFIG[mode];
          const isRecommended = mode === 'standard' && !savedProgress;

          return (
            <TouchableOpacity
              key={mode}
              style={[styles.modeCard, isRecommended && styles.modeCardRecommended]}
              onPress={() => {
                if (savedProgress) {
                  Alert.alert(
                    '开始新测试',
                    '这将清除之前的进度，确定吗？',
                    [
                      { text: '取消', style: 'cancel' },
                      { text: '确定', onPress: () => startTest(mode) },
                    ]
                  );
                } else {
                  startTest(mode);
                }
              }}
              activeOpacity={0.8}
            >
              {isRecommended && (
                <View style={styles.recommendBadge}>
                  <Text style={styles.recommendText}>推荐</Text>
                </View>
              )}
              <View style={styles.modeIcon}>{config.icon}</View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeName}>{config.name}</Text>
                <Text style={styles.modeDesc}>{config.desc}</Text>
              </View>
              <View style={styles.modeTime}>
                <Clock size={16} color="#888" />
                <Text style={styles.modeTimeText}>{config.time}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 小提示</Text>
          <Text style={styles.tipText}>• 选择最符合你真实想法的选项</Text>
          <Text style={styles.tipText}>• 不要过度思考，相信第一直觉</Text>
          <Text style={styles.tipText}>• 没有对错之分，放松作答即可</Text>
        </View>
      </ScrollView>
    );
  }

  // 测试进行中
  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQuestion.id];

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={28} color={COLORS.fg} strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {MODE_CONFIG[testMode].name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      {/* 进度提示 */}
      <Text style={styles.progressMessage}>{getProgressMessage()}</Text>

      {/* 问题卡片 */}
      <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Q{currentIndex + 1}</Text>
          <View style={[
            styles.dimensionTag,
            { backgroundColor: DIMENSION_CONFIG[currentQuestion.dimension].bgColor }
          ]}>
            <Text style={[
              styles.dimensionTagText,
              { color: DIMENSION_CONFIG[currentQuestion.dimension].color }
            ]}>
              {currentQuestion.dimension} · {DIMENSION_CONFIG[currentQuestion.dimension].label}
            </Text>
          </View>
        </View>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>

        {/* 7级量表 */}
        <LikertScale
          value={currentAnswer}
          onChange={handleAnswer}
          leftLabel="非常不同意"
          rightLabel="非常同意"
        />
      </Animated.View>

      {/* 导航按钮 */}
      <View style={styles.navButtons}>
        {currentIndex > 0 && (
          <TouchableOpacity onPress={goToPrevious} style={styles.navBtn}>
            <ChevronLeft size={24} color={COLORS.fg} />
            <Text style={styles.navBtnText}>上一题</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 跳过提示 */}
      {currentAnswer !== undefined && (
        <Text style={styles.skipHint}>已选择，自动跳转下一题...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  selectContainer: {
    padding: 24,
    paddingBottom: 80,
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
  selectSubtitle: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: COLORS.fg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  modeCardRecommended: {
    borderColor: COLORS.accent,
    borderWidth: 4,
  },
  recommendBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 12,
    color: 'white',
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 20,
    color: COLORS.fg,
  },
  modeDesc: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  modeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeTimeText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: '#888',
  },
  tipCard: {
    backgroundColor: COLORS.yellow,
    borderWidth: 2,
    borderColor: COLORS.fg,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 16,
    color: COLORS.fg,
    marginBottom: 8,
  },
  tipText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: COLORS.fg,
    marginBottom: 4,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderWidth: 3,
    borderColor: COLORS.fg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 20,
    color: 'white',
  },
  resumeDesc: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  loadingText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 100,
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
    backgroundColor: COLORS.secondary,
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
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 18,
    color: COLORS.accent,
  },
  dimensionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dimensionTagText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 22,
    color: COLORS.fg,
    marginBottom: 24,
    lineHeight: 32,
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
  skipHint: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 16,
  },
});
