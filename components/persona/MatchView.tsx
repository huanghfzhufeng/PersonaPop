import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, Sparkles, Users, RefreshCw, Flame, Shield, MessageCircle } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MBTI_FACTS } from '@/constants/mbti-facts';
import { generateMbtiInsight } from '@/lib/deepseek-service';

interface MatchViewProps {
  myType: string;
  onBack: () => void;
}

interface AiMatch {
  score: number;
  level: string;
  emoji: string;
  chemistry: string;
  strengths: string[];
  challenges: string[];
  loveAdvice: string;
  friendAdvice: string;
  secretTip: string;
}

export const MatchView = ({ myType, onBack }: MatchViewProps) => {
  const [partnerType, setPartnerType] = useState<string | null>(null);
  const [aiMatch, setAiMatch] = useState<AiMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const myTypeInfo = MBTI_TYPES.find(t => t.id === myType);
  const partnerTypeInfo = partnerType ? MBTI_TYPES.find(t => t.id === partnerType) : null;
  const myFacts = MBTI_FACTS[myType];

  // AI 生成匹配分析
  const generateMatch = async (type1: string, type2: string) => {
    setIsLoading(true);
    setAiMatch(null);
    try {
      const prompt = `分析 ${type1} 和 ${type2} 两个MBTI类型的缘分匹配度。

请严格按以下JSON格式返回（不要有其他内容）：
{
  "score": 匹配分数(35-98的整数，灵魂伴侣90+，冤家40-50，普通60-80),
  "level": "匹配等级（如：天作之合/心有灵犀/互补CP/需要磨合/欢喜冤家）",
  "emoji": "代表这对组合的emoji（1个）",
  "chemistry": "两人在一起的化学反应（40-60字，生动有画面感）",
  "strengths": ["这对组合的优势1（15字内）", "优势2（15字内）", "优势3（15字内）"],
  "challenges": ["可能的挑战1（15字内）", "挑战2（15字内）"],
  "loveAdvice": "恋爱相处建议（25-35字）",
  "friendAdvice": "友情相处建议（25-35字）",
  "secretTip": "只有这两个类型才懂的小秘密或相处诀窍（20-30字，有趣）"
}`;

      const result = await generateMbtiInsight(type1, prompt);
      
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAiMatch({
            score: Math.min(98, Math.max(35, parsed.score || 70)),
            level: parsed.level || '独特组合',
            emoji: parsed.emoji || '✨',
            chemistry: parsed.chemistry || '两个有趣的灵魂相遇，总能碰撞出意想不到的火花。',
            strengths: parsed.strengths || ['互相理解', '共同成长', '默契十足'],
            challenges: parsed.challenges || ['需要耐心', '观点可能不同'],
            loveAdvice: parsed.loveAdvice || '多一些包容和理解，感情会越来越好。',
            friendAdvice: parsed.friendAdvice || '保持真诚，友谊会更加深厚。',
            secretTip: parsed.secretTip || '你们都懂的那种默契，外人学不来！',
          });
        } else {
          throw new Error('No JSON');
        }
      } catch (e) {
        const isSoulmate = myFacts?.soulmates?.includes(type2);
        const isNemesis = myFacts?.nemesis?.includes(type2);
        setAiMatch({
          score: isSoulmate ? 92 : isNemesis ? 45 : 72,
          level: isSoulmate ? '天作之合' : isNemesis ? '欢喜冤家' : '互补组合',
          emoji: isSoulmate ? '💕' : isNemesis ? '⚡' : '✨',
          chemistry: '两个有趣的灵魂相遇，总能碰撞出意想不到的火花。',
          strengths: ['互相理解', '共同成长', '默契十足'],
          challenges: ['需要耐心', '观点可能不同'],
          loveAdvice: '多一些包容和理解，感情会越来越好。',
          friendAdvice: '保持真诚，友谊会更加深厚。',
          secretTip: '你们都懂的那种默契，外人学不来！',
        });
      }
    } catch (e) {
      setAiMatch({
        score: 70,
        level: '独特组合',
        emoji: '🌟',
        chemistry: '每对组合都有独特的相处之道。',
        strengths: ['可以互相学习', '视角互补'],
        challenges: ['需要多沟通'],
        loveAdvice: '用心经营，爱情会开花。',
        friendAdvice: '真诚是友谊的基础。',
        secretTip: '相信缘分的安排！',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (partnerType) {
      generateMatch(myType, partnerType);
    }
  }, [partnerType]);

  const getLevelColor = (score: number) => {
    if (score >= 85) return '#FF6B6B';
    if (score >= 70) return '#FFD700';
    if (score >= 55) return '#4CAF50';
    return '#FF9800';
  };

  const resetSelection = () => {
    setPartnerType(null);
    setAiMatch(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.fg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>缘分匹配</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!partnerType ? (
          <>
            <View style={styles.myTypeCard}>
              <Image source={MBTI_IMAGES[myType]} style={styles.myTypeImage} contentFit="contain" />
              <View>
                <Text style={styles.myTypeLabel}>我是</Text>
                <Text style={styles.myTypeText}>{myType}</Text>
                <Text style={styles.myTypeName}>{myTypeInfo?.name}</Text>
              </View>
            </View>

            <View style={styles.heartDivider}>
              <Heart size={32} color={COLORS.accent} fill={COLORS.accent} />
            </View>

            <Text style={styles.selectTitle}>选择 TA 的类型</Text>
            <Text style={styles.selectSubtitle}>💕 灵魂伴侣  ⚡ 欢喜冤家</Text>

            <View style={styles.typeGrid}>
              {MBTI_TYPES.filter(t => t.id !== myType).map((type) => {
                const isSoulmate = myFacts?.soulmates?.includes(type.id);
                const isNemesis = myFacts?.nemesis?.includes(type.id);
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeOption, isSoulmate && styles.typeOptionSoulmate, isNemesis && styles.typeOptionNemesis]}
                    onPress={() => setPartnerType(type.id)}
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
            {/* 匹配卡片 */}
            <View style={styles.matchCard}>
              <View style={styles.matchPair}>
                <View style={styles.matchPerson}>
                  <Image source={MBTI_IMAGES[myType]} style={styles.matchImage} contentFit="contain" />
                  <Text style={styles.matchType}>{myType}</Text>
                </View>
                <Text style={styles.matchEmoji}>{aiMatch?.emoji || '💫'}</Text>
                <TouchableOpacity style={styles.matchPerson} onPress={resetSelection}>
                  <Image source={MBTI_IMAGES[partnerType]} style={styles.matchImage} contentFit="contain" />
                  <Text style={styles.matchType}>{partnerType}</Text>
                  <Text style={styles.changeHint}>点击换</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
                <Text style={styles.loadingText}>AI 正在计算你们的缘分...</Text>
              </View>
            ) : aiMatch && (
              <>
                {/* 分数卡片 */}
                <View style={[styles.scoreCard, { borderColor: getLevelColor(aiMatch.score) }]}>
                  <Text style={[styles.scoreLevel, { color: getLevelColor(aiMatch.score) }]}>{aiMatch.level}</Text>
                  <Text style={[styles.scoreNumber, { color: getLevelColor(aiMatch.score) }]}>{aiMatch.score}%</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreFill, { width: `${aiMatch.score}%`, backgroundColor: getLevelColor(aiMatch.score) }]} />
                  </View>
                </View>

                {/* 化学反应 */}
                <View style={styles.chemistryCard}>
                  <View style={styles.chemistryHeader}>
                    <Sparkles size={18} color={COLORS.secondary} />
                    <Text style={styles.chemistryTitle}>化学反应</Text>
                  </View>
                  <Text style={styles.chemistryText}>{aiMatch.chemistry}</Text>
                </View>

                {/* 优势与挑战 */}
                <View style={styles.proConRow}>
                  <View style={[styles.proConCard, { backgroundColor: '#e8f5e9', borderColor: '#4CAF50' }]}>
                    <Text style={[styles.proConTitle, { color: '#4CAF50' }]}>💪 优势</Text>
                    {aiMatch.strengths.map((s, i) => <Text key={i} style={styles.proConItem}>✓ {s}</Text>)}
                  </View>
                  <View style={[styles.proConCard, { backgroundColor: '#fff8e1', borderColor: '#FF9800' }]}>
                    <Text style={[styles.proConTitle, { color: '#FF9800' }]}>⚠️ 挑战</Text>
                    {aiMatch.challenges.map((c, i) => <Text key={i} style={styles.proConItem}>• {c}</Text>)}
                  </View>
                </View>

                {/* 相处建议 */}
                <Text style={styles.sectionTitle}>💝 相处攻略</Text>
                <View style={styles.adviceCard}>
                  <View style={styles.adviceRow}>
                    <Heart size={16} color="#FF6B6B" />
                    <View style={styles.adviceContent}>
                      <Text style={styles.adviceLabel}>恋爱模式</Text>
                      <Text style={styles.adviceText}>{aiMatch.loveAdvice}</Text>
                    </View>
                  </View>
                  <View style={styles.adviceDivider} />
                  <View style={styles.adviceRow}>
                    <Users size={16} color="#4A90D9" />
                    <View style={styles.adviceContent}>
                      <Text style={styles.adviceLabel}>友情模式</Text>
                      <Text style={styles.adviceText}>{aiMatch.friendAdvice}</Text>
                    </View>
                  </View>
                </View>

                {/* 小秘密 */}
                <View style={styles.secretCard}>
                  <Text style={styles.secretTitle}>🤫 只有你们懂的小秘密</Text>
                  <Text style={styles.secretText}>{aiMatch.secretTip}</Text>
                </View>

                {/* 重新分析 */}
                <TouchableOpacity style={styles.refreshBtn} onPress={() => generateMatch(myType, partnerType)}>
                  <RefreshCw size={16} color={COLORS.secondary} />
                  <Text style={styles.refreshText}>重新分析</Text>
                </TouchableOpacity>

                {/* 换一个 */}
                <TouchableOpacity style={styles.changeBtn} onPress={resetSelection}>
                  <Text style={styles.changeBtnText}>换一个人匹配</Text>
                </TouchableOpacity>
              </>
            )}
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
  myTypeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 3, borderColor: COLORS.accent, borderRadius: 16, padding: 16, gap: 16 },
  myTypeImage: { width: 70, height: 70 },
  myTypeLabel: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: '#888' },
  myTypeText: { fontFamily: 'Kalam_700Bold', fontSize: 28, color: COLORS.fg },
  myTypeName: { fontFamily: 'PatrickHand_400Regular', fontSize: 16, color: COLORS.secondary },
  heartDivider: { alignItems: 'center', marginVertical: 16 },
  selectTitle: { fontFamily: 'Kalam_700Bold', fontSize: 18, color: COLORS.fg, textAlign: 'center', marginBottom: 4 },
  selectSubtitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  typeOption: { width: '23%', backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 8, alignItems: 'center' },
  typeOptionSoulmate: { borderColor: '#FF6B6B', backgroundColor: '#fff5f5' },
  typeOptionNemesis: { borderColor: '#ffa502', backgroundColor: '#fff9e6' },
  optionImage: { width: 36, height: 36 },
  optionType: { fontFamily: 'Kalam_700Bold', fontSize: 12, color: COLORS.fg, marginTop: 4 },
  tagText: { fontSize: 10 },
  matchCard: { backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 16, padding: 20, marginBottom: 16 },
  matchPair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  matchPerson: { alignItems: 'center' },
  matchImage: { width: 60, height: 60 },
  matchType: { fontFamily: 'Kalam_700Bold', fontSize: 18, color: COLORS.fg, marginTop: 4 },
  matchEmoji: { fontSize: 36 },
  changeHint: { fontFamily: 'PatrickHand_400Regular', fontSize: 10, color: '#aaa' },
  loadingCard: { backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 16, padding: 40, alignItems: 'center' },
  loadingText: { fontFamily: 'PatrickHand_400Regular', fontSize: 16, color: '#888', marginTop: 16 },
  scoreCard: { backgroundColor: 'white', borderWidth: 3, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  scoreLevel: { fontFamily: 'Kalam_700Bold', fontSize: 22 },
  scoreNumber: { fontFamily: 'Kalam_700Bold', fontSize: 52, marginVertical: 4 },
  scoreBar: { width: '100%', height: 10, backgroundColor: COLORS.muted, borderRadius: 5, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 5 },
  chemistryCard: { backgroundColor: '#f8f8ff', borderWidth: 2, borderColor: '#e8e8f8', borderRadius: 12, padding: 14, marginBottom: 16 },
  chemistryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  chemistryTitle: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: COLORS.secondary },
  chemistryText: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: '#555', lineHeight: 20 },
  proConRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  proConCard: { flex: 1, borderWidth: 2, borderRadius: 12, padding: 12 },
  proConTitle: { fontFamily: 'Kalam_700Bold', fontSize: 13, marginBottom: 8 },
  proConItem: { fontFamily: 'PatrickHand_400Regular', fontSize: 12, color: '#555', marginBottom: 4 },
  sectionTitle: { fontFamily: 'Kalam_700Bold', fontSize: 16, color: COLORS.fg, marginBottom: 10 },
  adviceCard: { backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 14, marginBottom: 16 },
  adviceRow: { flexDirection: 'row', gap: 10 },
  adviceContent: { flex: 1 },
  adviceLabel: { fontFamily: 'Kalam_700Bold', fontSize: 12, color: COLORS.fg, marginBottom: 2 },
  adviceText: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: '#555', lineHeight: 18 },
  adviceDivider: { height: 1, backgroundColor: COLORS.muted, marginVertical: 10 },
  secretCard: { backgroundColor: COLORS.yellow, borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 14, marginBottom: 16 },
  secretTitle: { fontFamily: 'Kalam_700Bold', fontSize: 13, color: COLORS.fg, marginBottom: 6 },
  secretText: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: COLORS.fg, lineHeight: 20 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 8 },
  refreshText: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: COLORS.secondary },
  changeBtn: { backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 20, paddingVertical: 12, alignItems: 'center' },
  changeBtnText: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: COLORS.fg },
});
