import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Zap, ChevronLeft, Sparkles, Bot, RefreshCw } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MBTI_FACTS } from '@/constants/mbti-facts';
import { generateMbtiInsight } from '@/lib/deepseek-service';

interface TypeCompareViewProps {
  myType: string;
  onBack: () => void;
}

// 计算兼容性分数
const getCompatibilityScore = (type1: string, type2: string): number => {
  const facts1 = MBTI_FACTS[type1];
  const facts2 = MBTI_FACTS[type2];
  
  if (!facts1 || !facts2) return 50;
  
  // 检查是否是灵魂伴侣
  if (facts1.soulmates?.includes(type2) || facts2.soulmates?.includes(type1)) {
    return 95;
  }
  
  // 检查是否是冤家
  if (facts1.nemesis?.includes(type2) || facts2.nemesis?.includes(type1)) {
    return 35;
  }
  
  // 计算维度相似度
  let score = 50;
  for (let i = 0; i < 4; i++) {
    if (type1[i] === type2[i]) score += 10;
  }
  
  return Math.min(score, 90);
};

// 获取兼容性描述
const getCompatibilityDesc = (type1: string, type2: string): { level: string; desc: string; color: string } => {
  const facts1 = MBTI_FACTS[type1];
  const facts2 = MBTI_FACTS[type2];
  
  if (facts1?.soulmates?.includes(type2) || facts2?.soulmates?.includes(type1)) {
    return { level: '灵魂伴侣 💕', desc: '天作之合！你们能互补又相吸', color: '#ff6b6b' };
  }
  
  if (facts1?.nemesis?.includes(type2) || facts2?.nemesis?.includes(type1)) {
    return { level: '欢喜冤家 ⚡', desc: '火花四溅！相处需要更多包容', color: '#ffa502' };
  }
  
  const score = getCompatibilityScore(type1, type2);
  if (score >= 70) {
    return { level: '志同道合 ✨', desc: '相似的灵魂容易产生共鸣', color: '#2ed573' };
  }
  
  return { level: '互相学习 🌱', desc: '不同的视角带来新的可能', color: '#1e90ff' };
};

export const TypeCompareView = ({ myType, onBack }: TypeCompareViewProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  
  const myTypeInfo = MBTI_TYPES.find(t => t.id === myType);
  const selectedTypeInfo = selectedType ? MBTI_TYPES.find(t => t.id === selectedType) : null;
  const myFacts = MBTI_FACTS[myType];
  const selectedFacts = selectedType ? MBTI_FACTS[selectedType] : null;
  
  const compatibility = selectedType ? getCompatibilityDesc(myType, selectedType) : null;
  const score = selectedType ? getCompatibilityScore(myType, selectedType) : 0;

  // 生成 AI 分析
  const generateAiAnalysis = async (type1: string, type2: string) => {
    setIsLoadingAi(true);
    setAiInsight('');
    try {
      const prompt = `用一句话（20-30字）评价 ${type1} 和 ${type2} 这两个 MBTI 类型在一起会怎样，要有趣、接地气、带点调侃。只输出这句话，不要其他内容。`;
      const insight = await generateMbtiInsight(type1, prompt);
      setAiInsight(insight || '你们在一起会擦出有趣的火花！');
    } catch (e) {
      setAiInsight('你们的组合很有意思！');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 选择类型时触发 AI 分析
  useEffect(() => {
    if (selectedType) {
      generateAiAnalysis(myType, selectedType);
    }
  }, [selectedType]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.fg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>类型对比</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!selectedType ? (
          // === 选择界面 ===
          <>
            {/* 我的类型 - 紧凑版 */}
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
                    style={[
                      styles.typeOption,
                      isSoulmate && styles.typeOptionSoulmate,
                      isNemesis && styles.typeOptionNemesis,
                    ]}
                    onPress={() => setSelectedType(type.id)}
                    activeOpacity={0.8}
                  >
                    <Image source={MBTI_IMAGES[type.id]} style={styles.optionImage} contentFit="contain" />
                    <Text style={styles.optionType}>{type.id}</Text>
                    <Text style={styles.optionName}>{type.name}</Text>
                    {isSoulmate && (
                      <View style={styles.soulmateTag}>
                        <Heart size={8} color="white" fill="white" />
                      </View>
                    )}
                    {isNemesis && (
                      <View style={styles.nemesisTag}>
                        <Zap size={8} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          // === 结果界面 ===
          <>
            {/* 并排对比卡片 */}
            <View style={styles.compareRow}>
              <View style={styles.compareCard}>
                <Image source={MBTI_IMAGES[myType]} style={styles.compareImage} contentFit="contain" />
                <Text style={styles.compareType}>{myType}</Text>
                <Text style={styles.compareName}>{myTypeInfo?.name}</Text>
              </View>
              
              <View style={styles.vsSmall}>
                <Text style={styles.vsSmallText}>VS</Text>
              </View>
              
              <TouchableOpacity style={styles.compareCard} onPress={() => setSelectedType(null)} activeOpacity={0.8}>
                <Image source={MBTI_IMAGES[selectedType]} style={styles.compareImage} contentFit="contain" />
                <Text style={styles.compareType}>{selectedType}</Text>
                <Text style={styles.compareName}>{selectedTypeInfo?.name}</Text>
                <Text style={styles.changeHint}>点击换</Text>
              </TouchableOpacity>
            </View>

            {/* 兼容性结果卡片 */}
            {compatibility && (
              <View style={[styles.resultCard, { borderColor: compatibility.color }]}>
                {/* 结果标题 */}
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultLevel, { color: compatibility.color }]}>
                    {compatibility.level}
                  </Text>
                  <View style={styles.scoreChip}>
                    <Text style={styles.scoreChipText}>{score}%</Text>
                  </View>
                </View>
                
                {/* 进度条 */}
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreFill, { width: `${score}%`, backgroundColor: compatibility.color }]} />
                </View>

                {/* AI 分析 */}
                <View style={styles.aiSection}>
                  <View style={styles.aiHeader}>
                    <Bot size={18} color={COLORS.secondary} />
                    <Text style={styles.aiTitle}>AI 说</Text>
                    {!isLoadingAi && (
                      <TouchableOpacity onPress={() => generateAiAnalysis(myType, selectedType)} style={styles.refreshBtn}>
                        <RefreshCw size={14} color="#888" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {isLoadingAi ? (
                    <View style={styles.aiLoading}>
                      <ActivityIndicator size="small" color={COLORS.secondary} />
                      <Text style={styles.aiLoadingText}>正在分析...</Text>
                    </View>
                  ) : (
                    <Text style={styles.aiText}>"{aiInsight}"</Text>
                  )}
                </View>

                {/* 特点对比 */}
                <View style={styles.traitsCompare}>
                  <View style={styles.traitsColumn}>
                    <Text style={styles.traitsTitle}>{myType}</Text>
                    {myFacts?.superPowers?.slice(0, 2).map((p, i) => (
                      <Text key={i} style={styles.traitItem}>✨ {p}</Text>
                    ))}
                  </View>
                  <View style={styles.traitsDivider} />
                  <View style={styles.traitsColumn}>
                    <Text style={styles.traitsTitle}>{selectedType}</Text>
                    {selectedFacts?.superPowers?.slice(0, 2).map((p, i) => (
                      <Text key={i} style={styles.traitItem}>✨ {p}</Text>
                    ))}
                  </View>
                </View>

                {/* 相处指南 */}
                <View style={styles.tipsSection}>
                  <Text style={styles.tipsTitle}>💡 相处指南</Text>
                  <View style={styles.tipsList}>
                    <Text style={styles.tipItem}>• {myFacts?.userManual?.[0]}</Text>
                    <Text style={styles.tipItem}>• {selectedFacts?.userManual?.[0]}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 换一个按钮 */}
            <TouchableOpacity style={styles.changeBtn} onPress={() => setSelectedType(null)}>
              <RefreshCw size={16} color={COLORS.fg} />
              <Text style={styles.changeBtnText}>换一个类型</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: COLORS.fg,
    borderStyle: 'dashed',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 24,
    color: COLORS.fg,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  // 选择界面 - 紧凑的我的类型
  myTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.fg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  myTypeImageSmall: {
    width: 50,
    height: 50,
  },
  myTypeLabelSmall: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 20,
    color: COLORS.fg,
  },
  myTypeNameSmall: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: COLORS.secondary,
  },
  selectTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 18,
    color: COLORS.fg,
    textAlign: 'center',
    marginBottom: 6,
  },
  selectSubtitle: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeOption: {
    width: '23%',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.fg,
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    position: 'relative',
  },
  typeOptionSoulmate: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  typeOptionNemesis: {
    borderColor: '#ffa502',
    backgroundColor: '#fff9e6',
  },
  optionImage: {
    width: 32,
    height: 32,
  },
  optionType: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 11,
    color: COLORS.fg,
    marginTop: 2,
  },
  optionName: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 8,
    color: '#888',
  },
  soulmateTag: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    padding: 2,
  },
  nemesisTag: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ffa502',
    borderRadius: 8,
    padding: 2,
  },
  // 结果界面 - 并排对比
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  compareCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.fg,
    borderRadius: 12,
    padding: 12,
  },
  compareImage: {
    width: 60,
    height: 60,
  },
  compareType: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 18,
    color: COLORS.fg,
    marginTop: 4,
  },
  compareName: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 12,
    color: COLORS.secondary,
  },
  changeHint: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
  },
  vsSmall: {
    backgroundColor: COLORS.fg,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  vsSmallText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 12,
    color: 'white',
  },
  // 结果卡片
  resultCard: {
    backgroundColor: 'white',
    borderWidth: 3,
    borderRadius: 16,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultLevel: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 22,
  },
  scoreChip: {
    backgroundColor: COLORS.fg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreChipText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 14,
    color: 'white',
  },
  scoreBar: {
    height: 8,
    backgroundColor: COLORS.muted,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  // AI 分析区
  aiSection: {
    backgroundColor: '#f8f8ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8f8',
    borderStyle: 'dashed',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 14,
    color: COLORS.secondary,
    flex: 1,
  },
  refreshBtn: {
    padding: 4,
  },
  aiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiLoadingText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: '#888',
  },
  aiText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 15,
    color: COLORS.fg,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  // 特点对比
  traitsCompare: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  traitsColumn: {
    flex: 1,
  },
  traitsDivider: {
    width: 1,
    backgroundColor: COLORS.muted,
    marginHorizontal: 10,
  },
  traitsTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 13,
    color: COLORS.fg,
    marginBottom: 6,
  },
  traitItem: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  // 相处指南
  tipsSection: {
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    padding: 12,
  },
  tipsTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 13,
    color: COLORS.fg,
    marginBottom: 6,
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 12,
    color: COLORS.fg,
    lineHeight: 18,
  },
  // 换一个按钮
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.fg,
    borderRadius: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  changeBtnText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 14,
    color: COLORS.fg,
  },
});
