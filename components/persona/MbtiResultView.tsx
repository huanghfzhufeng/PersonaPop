import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Sparkles, RefreshCw, History, MessageCircle, Palette, Users, Smile, Calendar, Heart } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MbtiResult, Dimension } from '@/lib/mbti-types';
import { getLetterMeaning } from '@/lib/mbti-calculation';

interface MbtiResultViewProps {
  result: MbtiResult;
  testDate?: string;
  onGenerateCard: () => void;
  onRetakeTest: () => void;
  onViewHistory?: () => void;
  onAiChat?: () => void;
  onViewDetail?: () => void;
}

/**
 * MBTI 测试结果展示组件
 * 作为玩法中心的入口页面
 */
export const MbtiResultView = ({
  result,
  testDate,
  onGenerateCard,
  onRetakeTest,
  onViewHistory,
  onAiChat,
  onViewDetail,
}: MbtiResultViewProps) => {
  const typeInfo = MBTI_TYPES.find((t) => t.id === result.type);
  const mbtiImage = MBTI_IMAGES[result.type];

  // 渲染维度进度条
  const renderDimensionBar = (dimension: Dimension) => {
    const score = result.scores[dimension];
    const leftPercent = score.percentFirst;
    const rightPercent = score.percentSecond;
    const isLeftWinner = score.winner === score.first;

    return (
      <View key={dimension} style={styles.dimensionContainer}>
        <View style={styles.dimensionHeader}>
          <Text style={[styles.dimensionLetter, isLeftWinner && styles.winnerLetter]}>
            {score.first} ({getLetterMeaning(score.first)})
          </Text>
          <Text style={styles.dimensionLabel}>{dimension}</Text>
          <Text style={[styles.dimensionLetter, !isLeftWinner && styles.winnerLetter]}>
            {score.second} ({getLetterMeaning(score.second)})
          </Text>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.barLeft, { flex: leftPercent }]}>
            <View
              style={[
                styles.barFill,
                styles.barFillLeft,
                { backgroundColor: isLeftWinner ? COLORS.accent : COLORS.muted },
              ]}
            />
          </View>
          <View style={[styles.barRight, { flex: rightPercent }]}>
            <View
              style={[
                styles.barFill,
                styles.barFillRight,
                { backgroundColor: !isLeftWinner ? COLORS.secondary : COLORS.muted },
              ]}
            />
          </View>
        </View>
        <View style={styles.percentRow}>
          <Text style={styles.percentText}>{leftPercent}%</Text>
          <Text style={styles.percentText}>{rightPercent}%</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 合并的类型卡片 + 四维度分析 */}
      <TouchableOpacity 
        style={styles.combinedCard} 
        onPress={onViewDetail}
        activeOpacity={onViewDetail ? 0.8 : 1}
      >
        <View style={styles.tape} />
        
        {/* 顶部：头像 + 类型信息 */}
        <View style={styles.typeRow}>
          <Image
            source={mbtiImage}
            style={styles.characterImageSmall}
            contentFit="contain"
          />
          <View style={styles.typeInfo}>
            <View style={styles.typeHeader}>
              <Text style={styles.mbtiTypeSmall}>{result.type}</Text>
              <View style={styles.confidenceBadgeSmall}>
                <Sparkles size={12} color={COLORS.accent} />
                <Text style={styles.confidenceTextSmall}>{result.confidence.overall}%</Text>
              </View>
            </View>
            <Text style={styles.mbtiNameSmall}>{typeInfo?.name || '探索者'}</Text>
            {testDate && (
              <Text style={styles.testDateSmall}>{testDate}</Text>
            )}
          </View>
        </View>

        {/* 分隔线 */}
        <View style={styles.divider} />

        {/* 四维度分析 - 紧凑版 */}
        <View style={styles.dimensionsCompact}>
          {(['EI', 'SN', 'TF', 'JP'] as Dimension[]).map(renderDimensionBar)}
        </View>

        {/* 点击查看详情提示 */}
        {onViewDetail && (
          <Text style={styles.viewDetailHint}>点击查看 AI 人格解码 →</Text>
        )}
      </TouchableOpacity>

      {/* 质量警告 (如果有) */}
      {result.confidence.qualityFlags.length > 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ 注意</Text>
          {result.confidence.qualityFlags.map((flag, index) => (
            <Text key={index} style={styles.warningText}>• {flag}</Text>
          ))}
        </View>
      )}

      {/* 玩法入口 - 横向滑动 */}
      <Text style={styles.sectionTitle}>选择你想玩的</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuresScroll}
        style={styles.featuresScrollContainer}
      >
        {/* 生成卡片 */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={onGenerateCard}
          activeOpacity={0.8}
        >
          <View style={[styles.featureIcon, { backgroundColor: COLORS.accent }]}>
            <Palette size={24} color="white" />
          </View>
          <Text style={styles.featureTitle}>人格卡片</Text>
          <Text style={styles.featureDesc}>专属艺术卡片</Text>
        </TouchableOpacity>

        {/* 类型对比 */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => {}}
          activeOpacity={0.8}
        >
          <View style={[styles.featureIcon, { backgroundColor: COLORS.secondary }]}>
            <Users size={24} color="white" />
          </View>
          <Text style={styles.featureTitle}>类型对比</Text>
          <Text style={styles.featureDesc}>和朋友比一比</Text>
          <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
        </TouchableOpacity>

        {/* 表情包 */}
        <TouchableOpacity
          style={[styles.featureCard, styles.featureCardDisabled]}
          activeOpacity={1}
        >
          <View style={[styles.featureIcon, { backgroundColor: COLORS.yellow }]}>
            <Smile size={24} color={COLORS.fg} />
          </View>
          <Text style={styles.featureTitle}>人格表情</Text>
          <Text style={styles.featureDesc}>专属表情包</Text>
          <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>即将</Text></View>
        </TouchableOpacity>

        {/* 每日运势 */}
        <TouchableOpacity
          style={[styles.featureCard, styles.featureCardDisabled]}
          activeOpacity={1}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#a8d5ba' }]}>
            <Calendar size={24} color={COLORS.fg} />
          </View>
          <Text style={styles.featureTitle}>每日运势</Text>
          <Text style={styles.featureDesc}>人格日报</Text>
          <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>即将</Text></View>
        </TouchableOpacity>

        {/* AI 助手 */}
        <TouchableOpacity
          style={[styles.featureCard, !onAiChat && styles.featureCardDisabled]}
          onPress={onAiChat}
          activeOpacity={onAiChat ? 0.8 : 1}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#b8a9c9' }]}>
            <MessageCircle size={24} color="white" />
          </View>
          <Text style={styles.featureTitle}>AI 助手</Text>
          <Text style={styles.featureDesc}>智能对话</Text>
          {!onAiChat && <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>即将</Text></View>}
        </TouchableOpacity>

        {/* 匹配测试 */}
        <TouchableOpacity
          style={[styles.featureCard, styles.featureCardDisabled]}
          activeOpacity={1}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#f8b4b4' }]}>
            <Heart size={24} color="white" />
          </View>
          <Text style={styles.featureTitle}>缘分匹配</Text>
          <Text style={styles.featureDesc}>测测契合度</Text>
          <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>即将</Text></View>
        </TouchableOpacity>
      </ScrollView>

      {/* 底部操作 */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onRetakeTest}>
          <RefreshCw size={20} color={COLORS.fg} />
          <Text style={styles.actionText}>重新测试</Text>
        </TouchableOpacity>

        {onViewHistory && (
          <TouchableOpacity style={styles.actionButton} onPress={onViewHistory}>
            <History size={20} color={COLORS.fg} />
            <Text style={styles.actionText}>历史记录</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  combinedCard: {
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: COLORS.fg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  tape: {
    position: 'absolute',
    top: -16,
    left: '50%',
    marginLeft: -50,
    width: 100,
    height: 28,
    backgroundColor: 'rgba(229, 224, 216, 0.9)',
    transform: [{ rotate: '-2deg' }],
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  characterImageSmall: {
    width: 80,
    height: 80,
  },
  typeInfo: {
    flex: 1,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mbtiTypeSmall: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 32,
    color: COLORS.fg,
    transform: [{ rotate: '-2deg' }],
  },
  confidenceBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.fg,
    gap: 4,
  },
  confidenceTextSmall: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 13,
    color: COLORS.fg,
  },
  mbtiNameSmall: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 18,
    color: COLORS.accent,
    marginTop: 2,
  },
  testDateSmall: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.muted,
    marginVertical: 12,
    borderRadius: 1,
  },
  dimensionsCompact: {
    gap: 8,
  },
  viewDetailHint: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 20,
    color: COLORS.fg,
    marginBottom: 12,
  },
  dimensionContainer: {
    marginBottom: 8,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dimensionLetter: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 12,
    color: '#888',
  },
  winnerLetter: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 14,
    color: COLORS.fg,
  },
  dimensionLabel: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 12,
    color: COLORS.fg,
  },
  barContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.fg,
  },
  barLeft: {
    alignItems: 'flex-end',
  },
  barRight: {
    alignItems: 'flex-start',
  },
  barFill: {
    height: '100%',
    width: '100%',
  },
  barFillLeft: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  barFillRight: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  percentText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 11,
    color: '#666',
  },
  warningCard: {
    backgroundColor: '#fff3cd',
    borderWidth: 2,
    borderColor: '#ffc107',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 16,
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  featuresScrollContainer: {
    marginHorizontal: -16,
    marginBottom: 20,
  },
  featuresScroll: {
    paddingLeft: 16,
    paddingRight: 40,
    gap: 12,
  },
  featureCard: {
    width: 90,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: COLORS.fg,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  featureCardDisabled: {
    opacity: 0.5,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.fg,
  },
  featureTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 14,
    color: COLORS.fg,
    textAlign: 'center',
  },
  featureDesc: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
  },
  newBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.fg,
  },
  newBadgeText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 9,
    color: 'white',
  },
  comingSoonBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: COLORS.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 9,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 16,
    color: COLORS.fg,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});
