import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Zap, ChevronLeft, Bot, RefreshCw, Briefcase, Users, Flame, Shield } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MBTI_FACTS } from '@/constants/mbti-facts';
import { generateMbtiInsight } from '@/lib/deepseek-service';

interface TypeCompareViewProps {
  myType: string;
  onBack: () => void;
}

interface AiAnalysis {
  score: number;
  level: string;
  summary: string;
  chemistry: string;
  workScene: string;
  loveScene: string;
  friendScene: string;
  conflicts: string;
  tips: string[];
}

export const TypeCompareView = ({ myType, onBack }: TypeCompareViewProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  const myTypeInfo = MBTI_TYPES.find(t => t.id === myType);
  const selectedTypeInfo = selectedType ? MBTI_TYPES.find(t => t.id === selectedType) : null;
  const myFacts = MBTI_FACTS[myType];

  // AI 生成完整分析
  const generateFullAnalysis = async (type1: string, type2: string) => {
    setIsLoading(true);
    setAiAnalysis(null);
    
    try {
      setLoadingStep('正在分析兼容性...');
      
      const prompt = `分析 ${type1} 和 ${type2} 两个MBTI类型的关系兼容性。请严格按以下JSON格式返回（不要有其他内容）：
{
  "score": 兼容性分数(0-100的整数),
  "level": "关系等级（如：灵魂伴侣/黄金搭档/互补组合/需要磨合/挑战模式）",
  "summary": "一句话总结（20字以内，有趣接地气）",
  "chemistry": "两人在一起的化学反应描述（30-50字，生动形象）",
  "workScene": "工作场景互动描述（30-40字）",
  "loveScene": "恋爱场景互动描述（30-40字）",
  "friendScene": "友情场景互动描述（30-40字）",
  "conflicts": "可能的冲突点和原因（30-40字）",
  "tips": ["相处建议1（15字内）", "相处建议2（15字内）", "相处建议3（15字内）"]
}`;

      const result = await generateMbtiInsight(type1, prompt);
      
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAiAnalysis({
            score: Math.min(100, Math.max(0, parsed.score || 70)),
            level: parsed.level || '独特组合',
            summary: parsed.summary || '你们是独特的组合！',
            chemistry: parsed.chemistry || '两个有趣的灵魂相遇，总能擦出火花。',
            workScene: parsed.workScene || '工作中能互相补位，各展所长。',
            loveScene: parsed.loveScene || '感情中需要多一些理解和包容。',
            friendScene: parsed.friendScene || '做朋友轻松愉快，话题不断。',
            conflicts: parsed.conflicts || '不同的处事方式可能带来小摩擦。',
            tips: parsed.tips || ['多倾听对方', '尊重差异', '找到共同点'],
          });
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        const isSoulmate = myFacts?.soulmates?.includes(type2);
        const isNemesis = myFacts?.nemesis?.includes(type2);
        setAiAnalysis({
          score: isSoulmate ? 92 : isNemesis ? 45 : 72,
          level: isSoulmate ? '灵魂伴侣 💕' : isNemesis ? '欢喜冤家 ⚡' : '互补搭档 ✨',
          summary: result?.slice(0, 30) || '你们是独特的组合！',
          chemistry: '两个有趣的灵魂相遇，总能擦出意想不到的火花。',
          workScene: '工作中能互相补位，发挥各自优势。',
          loveScene: '感情中需要多一些理解、耐心和包容。',
          friendScene: '做朋友轻松愉快，永远有聊不完的话题。',
          conflicts: '不同的思维方式和生活习惯可能带来小摩擦。',
          tips: ['多站在对方角度思考', '接纳彼此的不同', '创造共同的美好回忆'],
        });
      }
    } catch (e) {
      const isSoulmate = myFacts?.soulmates?.includes(type2);
      const isNemesis = myFacts?.nemesis?.includes(type2);
      setAiAnalysis({
        score: isSoulmate ? 90 : isNemesis ? 40 : 70,
        level: isSoulmate ? '灵魂伴侣 💕' : isNemesis ? '欢喜冤家 ⚡' : '互补组合 🌟',
        summary: '你们是独特的组合！',
        chemistry: '每对组合都有独特的相处模式。',
        workScene: '工作中可以互相学习。',
        loveScene: '感情需要用心经营。',
        friendScene: '友情让生活更丰富。',
        conflicts: '差异也是了解彼此的机会。',
        tips: ['保持开放心态', '尊重对方', '享受相处时光'],
      });
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  useEffect(() => {
    if (selectedType) {
      generateFullAnalysis(myType, selectedType);
    }
  }, [selectedType]);

  const getLevelColor = (level: string) => {
    if (level.includes('灵魂') || level.includes('💕')) return '#ff6b6b';
    if (level.includes('黄金') || level.includes('✨')) return '#FFD700';
    if (level.includes('冤家') || level.includes('⚡')) return '#ffa502';
    if (level.includes('挑战')) return '#9C27B0';
    return '#4CAF50';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.fg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>类型对比</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedType ? (
          <>
            <View style={styles.myTypeRow}>
              <Image source={MBTI_IMAGES[myType]} style={styles.myTypeImageSmall} contentFit="contain" />
              <View>
                <Text style={styles.myTypeLabelSmall}>我是 {myType}</Text>
                <Text style={styles.myTypeNameSmall}>{myTypeInfo?.name}</Text>
              </View>
            </View>

            <Text style={styles.selectTitle}>选择 TA 的类型</Text>
            <Text style={styles.selectSubtitle}>
              <Heart size={12} color="#ff6b6b" fill="#ff6b6b" /> 灵魂伴侣 {'  '}
              <Zap size={12} color="#ffa502" /> 欢喜冤家
            </Text>
            
            <View style={styles.typeGrid}>
              {MBTI_TYPES.filter(t => t.id !== myType).map((type) => {
                const isSoulmate = myFacts?.soulmates?.includes(type.id);
                const isNemesis = myFacts?.nemesis?.includes(type.id);
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeOption, isSoulmate && styles.typeOptionSoulmate, isNemesis && styles.typeOptionNemesis]}
                    onPress={() => setSelectedType(type.id)}
                    activeOpacity={0.8}
                  >
                    <Image source={MBTI_IMAGES[type.id]} style={styles.optionImage} contentFit="contain" />
                    <Text style={styles.optionType}>{type.id}</Text>
                    {isSoulmate && <Text style={styles.tagText}>💕</Text>}
                    {isNemesis && <Text style={styles.tagText}>⚡</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={styles.compareRow}>
              <View style={styles.compareCard}>
                <Image source={MBTI_IMAGES[myType]} style={styles.compareImage} contentFit="contain" />
                <Text style={styles.compareType}>{myType}</Text>
                <Text style={styles.compareName}>{myTypeInfo?.name}</Text>
              </View>
              <View style={styles.vsSmall}><Text style={styles.vsSmallText}>VS</Text></View>
              <TouchableOpacity style={styles.compareCard} onPress={() => setSelectedType(null)} activeOpacity={0.8}>
                <Image source={MBTI_IMAGES[selectedType]} style={styles.compareImage} contentFit="contain" />
                <Text style={styles.compareType}>{selectedType}</Text>
                <Text style={styles.compareName}>{selectedTypeInfo?.name}</Text>
                <Text style={styles.changeHint}>点击换</Text>
              </TouchableOpacity>
            </View>

            {isLoading && (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
                <Text style={styles.loadingText}>{loadingStep}</Text>
                <Text style={styles.loadingSubtext}>AI 正在深度分析你们的兼容性...</Text>
              </View>
            )}

            {aiAnalysis && !isLoading && (
              <>
                <View style={[styles.resultCard, { borderColor: getLevelColor(aiAnalysis.level) }]}>
                  <View style={styles.resultHeader}>
                    <Text style={[styles.resultLevel, { color: getLevelColor(aiAnalysis.level) }]}>{aiAnalysis.level}</Text>
                    <View style={[styles.scoreChip, { backgroundColor: getLevelColor(aiAnalysis.level) }]}>
                      <Text style={styles.scoreChipText}>{aiAnalysis.score}%</Text>
                    </View>
                  </View>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${aiAnalysis.score}%`, backgroundColor: getLevelColor(aiAnalysis.level) }]} />
                  </View>
                  <View style={styles.summarySection}>
                    <Bot size={18} color={COLORS.secondary} />
                    <Text style={styles.summaryText}>"{aiAnalysis.summary}"</Text>
                  </View>
                  <View style={styles.chemistrySection}>
                    <Text style={styles.chemistryTitle}>🧪 化学反应</Text>
                    <Text style={styles.chemistryText}>{aiAnalysis.chemistry}</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>📍 不同场景</Text>
                <View style={styles.scenesGrid}>
                  <View style={styles.sceneCard}>
                    <Briefcase size={20} color="#4A90D9" />
                    <Text style={styles.sceneLabel}>工作搭档</Text>
                    <Text style={styles.sceneText}>{aiAnalysis.workScene}</Text>
                  </View>
                  <View style={styles.sceneCard}>
                    <Heart size={20} color="#FF6B6B" />
                    <Text style={styles.sceneLabel}>恋爱关系</Text>
                    <Text style={styles.sceneText}>{aiAnalysis.loveScene}</Text>
                  </View>
                  <View style={styles.sceneCard}>
                    <Users size={20} color="#4CAF50" />
                    <Text style={styles.sceneLabel}>朋友相处</Text>
                    <Text style={styles.sceneText}>{aiAnalysis.friendScene}</Text>
                  </View>
                </View>

                <View style={styles.conflictCard}>
                  <View style={styles.conflictHeader}>
                    <Flame size={18} color="#FF9800" />
                    <Text style={styles.conflictTitle}>潜在摩擦点</Text>
                  </View>
                  <Text style={styles.conflictText}>{aiAnalysis.conflicts}</Text>
                </View>

                <View style={styles.tipsCard}>
                  <View style={styles.tipsHeader}>
                    <Shield size={18} color="#4CAF50" />
                    <Text style={styles.tipsTitle}>相处秘籍</Text>
                  </View>
                  {aiAnalysis.tips.map((tip, i) => (
                    <Text key={i} style={styles.tipItem}>💡 {tip}</Text>
                  ))}
                </View>

                <TouchableOpacity style={styles.refreshAnalysis} onPress={() => generateFullAnalysis(myType, selectedType)}>
                  <RefreshCw size={16} color={COLORS.secondary} />
                  <Text style={styles.refreshText}>重新分析</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.changeBtn} onPress={() => setSelectedType(null)}>
              <Text style={styles.changeBtnText}>换一个类型对比</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderColor: COLORS.fg, borderStyle: 'dashed' },
  backButton: { padding: 4 },
  headerTitle: { fontFamily: 'Kalam_700Bold', fontSize: 24, color: COLORS.fg },
  content: { padding: 16, paddingBottom: 100 },
  myTypeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 12, marginBottom: 20, gap: 12 },
  myTypeImageSmall: { width: 50, height: 50 },
  myTypeLabelSmall: { fontFamily: 'Kalam_700Bold', fontSize: 20, color: COLORS.fg },
  myTypeNameSmall: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: COLORS.secondary },
  selectTitle: { fontFamily: 'Kalam_700Bold', fontSize: 18, color: COLORS.fg, textAlign: 'center', marginBottom: 6 },
  selectSubtitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  typeOption: { width: '23%', backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 10, padding: 8, alignItems: 'center' },
  typeOptionSoulmate: { borderColor: '#ff6b6b', backgroundColor: '#fff5f5' },
  typeOptionNemesis: { borderColor: '#ffa502', backgroundColor: '#fff9e6' },
  optionImage: { width: 32, height: 32 },
  optionType: { fontFamily: 'Kalam_700Bold', fontSize: 11, color: COLORS.fg, marginTop: 2 },
  tagText: { fontSize: 10 },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  compareCard: { flex: 1, alignItems: 'center', backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 12 },
  compareImage: { width: 50, height: 50 },
  compareType: { fontFamily: 'Kalam_700Bold', fontSize: 16, color: COLORS.fg, marginTop: 4 },
  compareName: { fontFamily: 'PatrickHand_400Regular', fontSize: 11, color: COLORS.secondary },
  changeHint: { fontFamily: 'PatrickHand_400Regular', fontSize: 9, color: '#aaa', marginTop: 2 },
  vsSmall: { backgroundColor: COLORS.fg, borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  vsSmallText: { fontFamily: 'Kalam_700Bold', fontSize: 10, color: 'white' },
  loadingCard: { backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 16, padding: 32, alignItems: 'center' },
  loadingText: { fontFamily: 'Kalam_700Bold', fontSize: 16, color: COLORS.fg, marginTop: 16 },
  loadingSubtext: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: '#888', marginTop: 4 },
  resultCard: { backgroundColor: 'white', borderWidth: 3, borderRadius: 16, padding: 16, marginBottom: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  resultLevel: { fontFamily: 'Kalam_700Bold', fontSize: 20 },
  scoreChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  scoreChipText: { fontFamily: 'Kalam_700Bold', fontSize: 16, color: 'white' },
  scoreBar: { height: 8, backgroundColor: COLORS.muted, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  scoreFill: { height: '100%', borderRadius: 4 },
  summarySection: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  summaryText: { flex: 1, fontFamily: 'PatrickHand_400Regular', fontSize: 16, color: COLORS.fg, fontStyle: 'italic' },
  chemistrySection: { backgroundColor: '#f8f8ff', borderRadius: 12, padding: 12 },
  chemistryTitle: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: COLORS.fg, marginBottom: 6 },
  chemistryText: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: '#555', lineHeight: 20 },
  sectionTitle: { fontFamily: 'Kalam_700Bold', fontSize: 16, color: COLORS.fg, marginBottom: 12 },
  scenesGrid: { gap: 10, marginBottom: 16 },
  sceneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 12, gap: 10 },
  sceneLabel: { fontFamily: 'Kalam_700Bold', fontSize: 13, color: COLORS.fg, width: 70 },
  sceneText: { flex: 1, fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: '#555', lineHeight: 18 },
  conflictCard: { backgroundColor: '#fff8e1', borderWidth: 2, borderColor: '#FF9800', borderRadius: 12, padding: 12, marginBottom: 12 },
  conflictHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  conflictTitle: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: '#FF9800' },
  conflictText: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: '#555', lineHeight: 18 },
  tipsCard: { backgroundColor: '#e8f5e9', borderWidth: 2, borderColor: '#4CAF50', borderRadius: 12, padding: 12, marginBottom: 16 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipsTitle: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: '#4CAF50' },
  tipItem: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: '#555', marginBottom: 4 },
  refreshAnalysis: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginBottom: 8 },
  refreshText: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: COLORS.secondary },
  changeBtn: { backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 20, paddingVertical: 12, alignItems: 'center' },
  changeBtnText: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: COLORS.fg },
});
