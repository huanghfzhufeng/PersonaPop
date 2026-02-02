import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, RefreshCw, Star, Briefcase, Heart, Coins, Zap, Sparkles, CheckCircle, XCircle } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MBTI_FACTS } from '@/constants/mbti-facts';
import { generateMbtiInsight } from '@/lib/deepseek-service';

interface FortuneViewProps {
  myType: string;
  onBack: () => void;
}

interface AiFortune {
  overallScore: number;
  overallDesc: string;
  work: { score: number; desc: string };
  love: { score: number; desc: string };
  wealth: { score: number; desc: string };
  energy: { score: number; desc: string };
  luckyItem: string;
  luckyColor: string;
  luckyNumber: string;
  doList: string[];
  dontList: string[];
  dailyAdvice: string;
}

export const FortuneView = ({ myType, onBack }: FortuneViewProps) => {
  const [fortune, setFortune] = useState<AiFortune | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const typeInfo = MBTI_TYPES.find(t => t.id === myType);
  const facts = MBTI_FACTS[myType];
  
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekdayStr = `星期${weekdays[today.getDay()]}`;

  // AI 生成完整运势
  const generateFortune = async () => {
    setIsLoading(true);
    try {
      const prompt = `为 ${myType}（${typeInfo?.name}）类型的人生成今日（${dateStr} ${weekdayStr}）运势。
性格特点：${facts?.traits?.join('、')}

请严格按以下JSON格式返回（不要有其他内容）：
{
  "overallScore": 整体运势分数(60-98的整数),
  "overallDesc": "整体运势描述（15-25字）",
  "work": { "score": 工作运势分数(60-98), "desc": "工作建议（15-20字）" },
  "love": { "score": 爱情运势分数(60-98), "desc": "爱情建议（15-20字）" },
  "wealth": { "score": 财运分数(60-98), "desc": "理财建议（15-20字）" },
  "energy": { "score": 能量分数(60-98), "desc": "状态建议（15-20字）" },
  "luckyItem": "幸运物品（2-4字）",
  "luckyColor": "幸运颜色（2-3字）",
  "luckyNumber": "幸运数字（1-2位）",
  "doList": ["今日宜做的事1（8字内）", "今日宜做的事2（8字内）"],
  "dontList": ["今日忌做的事1（8字内）", "今日忌做的事2（8字内）"],
  "dailyAdvice": "今日寄语（20-30字，温暖有趣）"
}`;

      const result = await generateMbtiInsight(myType, prompt);
      
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setFortune({
            overallScore: Math.min(98, Math.max(60, parsed.overallScore || 78)),
            overallDesc: parsed.overallDesc || '今天适合做自己喜欢的事',
            work: { score: parsed.work?.score || 75, desc: parsed.work?.desc || '专注当下，效率翻倍' },
            love: { score: parsed.love?.score || 72, desc: parsed.love?.desc || '真诚沟通是关键' },
            wealth: { score: parsed.wealth?.score || 70, desc: parsed.wealth?.desc || '理性消费，量入为出' },
            energy: { score: parsed.energy?.score || 76, desc: parsed.energy?.desc || '适当休息，保持活力' },
            luckyItem: parsed.luckyItem || '咖啡',
            luckyColor: parsed.luckyColor || '蓝色',
            luckyNumber: parsed.luckyNumber || '7',
            doList: parsed.doList || ['专注工作', '运动健身'],
            dontList: parsed.dontList || ['熬夜', '冲动消费'],
            dailyAdvice: parsed.dailyAdvice || '保持你独特的节奏，今天会有小惊喜！',
          });
        } else {
          throw new Error('No JSON');
        }
      } catch (e) {
        // 解析失败使用默认值
        setFortune({
          overallScore: 78,
          overallDesc: '今天适合做自己喜欢的事',
          work: { score: 75, desc: '专注当下，效率翻倍' },
          love: { score: 72, desc: '真诚沟通是关键' },
          wealth: { score: 70, desc: '理性消费，量入为出' },
          energy: { score: 76, desc: '适当休息，保持活力' },
          luckyItem: '咖啡',
          luckyColor: '蓝色',
          luckyNumber: '7',
          doList: ['专注工作', '运动健身'],
          dontList: ['熬夜', '冲动消费'],
          dailyAdvice: '保持你独特的节奏，今天会有小惊喜！',
        });
      }
    } catch (e) {
      setFortune({
        overallScore: 75,
        overallDesc: '平稳的一天，适合充电',
        work: { score: 73, desc: '按部就班完成任务' },
        love: { score: 70, desc: '多关心身边的人' },
        wealth: { score: 68, desc: '守住钱包' },
        energy: { score: 74, desc: '早睡早起' },
        luckyItem: '绿植',
        luckyColor: '绿色',
        luckyNumber: '3',
        doList: ['读书', '散步'],
        dontList: ['争吵', '加班'],
        dailyAdvice: '有时候慢下来也是一种智慧～',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateFortune();
  }, [myType]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#FF6B6B';
    if (score >= 75) return '#FFD700';
    if (score >= 65) return '#4CAF50';
    return '#2196F3';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return '大吉';
    if (score >= 80) return '上吉';
    if (score >= 70) return '中吉';
    return '小吉';
  };

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score / 20);
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} size={14} color="#FFD700" fill={i < fullStars ? '#FFD700' : 'transparent'} />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.fg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>每日运势</Text>
        <TouchableOpacity onPress={generateFortune} style={styles.refreshButton} disabled={isLoading}>
          <RefreshCw size={20} color={isLoading ? '#ccc' : COLORS.fg} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 日期卡片 */}
        <View style={styles.dateCard}>
          <View>
            <Text style={styles.dateMain}>{dateStr}</Text>
            <Text style={styles.dateWeek}>{weekdayStr}</Text>
          </View>
          <View style={styles.dateRight}>
            <Image source={MBTI_IMAGES[myType]} style={styles.typeImageSmall} contentFit="contain" />
            <Text style={styles.typeText}>{myType}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>AI 正在解读今日运势...</Text>
          </View>
        ) : fortune && (
          <>
            {/* 整体运势 */}
            <View style={[styles.overallCard, { borderColor: getScoreColor(fortune.overallScore) }]}>
              <View style={styles.overallHeader}>
                <Sparkles size={22} color={getScoreColor(fortune.overallScore)} />
                <Text style={styles.overallTitle}>今日整体运势</Text>
              </View>
              <View style={styles.overallScore}>
                <Text style={[styles.scoreNumber, { color: getScoreColor(fortune.overallScore) }]}>{fortune.overallScore}</Text>
                <Text style={styles.scoreLevel}>{getScoreLevel(fortune.overallScore)}</Text>
              </View>
              <View style={styles.starsRow}>{renderStars(fortune.overallScore)}</View>
              <Text style={styles.overallDesc}>{fortune.overallDesc}</Text>
            </View>

            {/* 详细运势 */}
            <Text style={styles.sectionTitle}>详细运势</Text>
            <View style={styles.aspectsGrid}>
              <View style={styles.aspectCard}>
                <Briefcase size={22} color="#4A90D9" />
                <Text style={styles.aspectLabel}>工作事业</Text>
                <Text style={[styles.aspectScore, { color: getScoreColor(fortune.work.score) }]}>{fortune.work.score}</Text>
                <View style={styles.aspectBar}><View style={[styles.aspectFill, { width: `${fortune.work.score}%`, backgroundColor: '#4A90D9' }]} /></View>
                <Text style={styles.aspectDesc}>{fortune.work.desc}</Text>
              </View>
              <View style={styles.aspectCard}>
                <Heart size={22} color="#FF6B6B" />
                <Text style={styles.aspectLabel}>爱情桃花</Text>
                <Text style={[styles.aspectScore, { color: getScoreColor(fortune.love.score) }]}>{fortune.love.score}</Text>
                <View style={styles.aspectBar}><View style={[styles.aspectFill, { width: `${fortune.love.score}%`, backgroundColor: '#FF6B6B' }]} /></View>
                <Text style={styles.aspectDesc}>{fortune.love.desc}</Text>
              </View>
              <View style={styles.aspectCard}>
                <Coins size={22} color="#4CAF50" />
                <Text style={styles.aspectLabel}>财运金钱</Text>
                <Text style={[styles.aspectScore, { color: getScoreColor(fortune.wealth.score) }]}>{fortune.wealth.score}</Text>
                <View style={styles.aspectBar}><View style={[styles.aspectFill, { width: `${fortune.wealth.score}%`, backgroundColor: '#4CAF50' }]} /></View>
                <Text style={styles.aspectDesc}>{fortune.wealth.desc}</Text>
              </View>
              <View style={styles.aspectCard}>
                <Zap size={22} color="#FF9800" />
                <Text style={styles.aspectLabel}>能量状态</Text>
                <Text style={[styles.aspectScore, { color: getScoreColor(fortune.energy.score) }]}>{fortune.energy.score}</Text>
                <View style={styles.aspectBar}><View style={[styles.aspectFill, { width: `${fortune.energy.score}%`, backgroundColor: '#FF9800' }]} /></View>
                <Text style={styles.aspectDesc}>{fortune.energy.desc}</Text>
              </View>
            </View>

            {/* 幸运元素 */}
            <Text style={styles.sectionTitle}>今日幸运</Text>
            <View style={styles.luckyRow}>
              <View style={styles.luckyItem}><Text style={styles.luckyEmoji}>🍀</Text><Text style={styles.luckyLabel}>幸运物</Text><Text style={styles.luckyValue}>{fortune.luckyItem}</Text></View>
              <View style={styles.luckyItem}><Text style={styles.luckyEmoji}>🎨</Text><Text style={styles.luckyLabel}>幸运色</Text><Text style={styles.luckyValue}>{fortune.luckyColor}</Text></View>
              <View style={styles.luckyItem}><Text style={styles.luckyEmoji}>🔢</Text><Text style={styles.luckyLabel}>幸运数</Text><Text style={styles.luckyValue}>{fortune.luckyNumber}</Text></View>
            </View>

            {/* 今日宜忌 */}
            <View style={styles.doAndDontRow}>
              <View style={[styles.doCard, { backgroundColor: '#e8f5e9', borderColor: '#4CAF50' }]}>
                <View style={styles.doHeader}><CheckCircle size={16} color="#4CAF50" /><Text style={[styles.doTitle, { color: '#4CAF50' }]}>今日宜</Text></View>
                {fortune.doList.map((item, i) => <Text key={i} style={styles.doItem}>✓ {item}</Text>)}
              </View>
              <View style={[styles.doCard, { backgroundColor: '#ffebee', borderColor: '#FF6B6B' }]}>
                <View style={styles.doHeader}><XCircle size={16} color="#FF6B6B" /><Text style={[styles.doTitle, { color: '#FF6B6B' }]}>今日忌</Text></View>
                {fortune.dontList.map((item, i) => <Text key={i} style={styles.doItem}>✗ {item}</Text>)}
              </View>
            </View>

            {/* 今日寄语 */}
            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>💫 AI 今日寄语</Text>
              <Text style={styles.adviceText}>{fortune.dailyAdvice}</Text>
            </View>

            <Text style={styles.disclaimer}>✨ 运势由 AI 生成，仅供娱乐参考</Text>
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
  refreshButton: { padding: 4 },
  content: { padding: 16, paddingBottom: 100 },
  dateCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 16, marginBottom: 16 },
  dateMain: { fontFamily: 'Kalam_700Bold', fontSize: 24, color: COLORS.fg },
  dateWeek: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: '#888' },
  dateRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeImageSmall: { width: 40, height: 40 },
  typeText: { fontFamily: 'Kalam_700Bold', fontSize: 18, color: COLORS.secondary },
  loadingCard: { backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 16, padding: 48, alignItems: 'center' },
  loadingText: { fontFamily: 'PatrickHand_400Regular', fontSize: 16, color: '#888', marginTop: 16 },
  overallCard: { backgroundColor: 'white', borderWidth: 3, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  overallHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  overallTitle: { fontFamily: 'Kalam_700Bold', fontSize: 18, color: COLORS.fg },
  overallScore: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreNumber: { fontFamily: 'Kalam_700Bold', fontSize: 56 },
  scoreLevel: { fontFamily: 'Kalam_700Bold', fontSize: 20, color: COLORS.fg },
  starsRow: { flexDirection: 'row', gap: 4, marginVertical: 8 },
  overallDesc: { fontFamily: 'PatrickHand_400Regular', fontSize: 15, color: '#666', textAlign: 'center' },
  sectionTitle: { fontFamily: 'Kalam_700Bold', fontSize: 16, color: COLORS.fg, marginBottom: 12 },
  aspectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  aspectCard: { width: '48%', backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 12, alignItems: 'center' },
  aspectLabel: { fontFamily: 'PatrickHand_400Regular', fontSize: 12, color: '#666', marginTop: 4 },
  aspectScore: { fontFamily: 'Kalam_700Bold', fontSize: 28 },
  aspectBar: { width: '100%', height: 6, backgroundColor: COLORS.muted, borderRadius: 3, overflow: 'hidden', marginVertical: 6 },
  aspectFill: { height: '100%', borderRadius: 3 },
  aspectDesc: { fontFamily: 'PatrickHand_400Regular', fontSize: 11, color: '#888', textAlign: 'center' },
  luckyRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  luckyItem: { flex: 1, backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 12, alignItems: 'center' },
  luckyEmoji: { fontSize: 24, marginBottom: 4 },
  luckyLabel: { fontFamily: 'PatrickHand_400Regular', fontSize: 11, color: '#888' },
  luckyValue: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: COLORS.fg, marginTop: 2 },
  doAndDontRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  doCard: { flex: 1, borderWidth: 2, borderRadius: 12, padding: 12 },
  doHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  doTitle: { fontFamily: 'Kalam_700Bold', fontSize: 14 },
  doItem: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: '#555', marginBottom: 4 },
  adviceCard: { backgroundColor: COLORS.yellow, borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, padding: 16, marginBottom: 16 },
  adviceTitle: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: COLORS.fg, marginBottom: 6 },
  adviceText: { fontFamily: 'PatrickHand_400Regular', fontSize: 15, color: COLORS.fg, lineHeight: 22 },
  disclaimer: { fontFamily: 'PatrickHand_400Regular', fontSize: 12, color: '#aaa', textAlign: 'center' },
});
