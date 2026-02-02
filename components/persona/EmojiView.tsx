import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Share, Alert, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, RefreshCw, Share2, Copy, Sparkles, Send } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MBTI_FACTS } from '@/constants/mbti-facts';
import { generateMbtiInsight } from '@/lib/deepseek-service';
import * as Clipboard from 'expo-clipboard';

interface EmojiViewProps {
  myType: string;
  onBack: () => void;
}

// 表情包模板
const EMOJI_TEMPLATES = [
  { id: 'daily', label: '日常翻车', emoji: '😅', bgColor: '#fff3e0', prompt: '日常生活中可能遇到的尴尬或翻车瞬间' },
  { id: 'quote', label: '人格名言', emoji: '💬', bgColor: '#e3f2fd', prompt: '最能代表这个人格的经典语录或口头禅' },
  { id: 'power', label: '超能力', emoji: '✨', bgColor: '#f3e5f5', prompt: '这个人格独有的隐藏超能力' },
  { id: 'weakness', label: '致命弱点', emoji: '💀', bgColor: '#ffebee', prompt: '这个人格最大的软肋或致命弱点' },
  { id: 'mood', label: '今日心情', emoji: '🎭', bgColor: '#e8f5e9', prompt: '今天可能出现的心情状态' },
  { id: 'social', label: '社交模式', emoji: '🗣️', bgColor: '#fff8e1', prompt: '社交场合的典型表现' },
];

export const EmojiView = ({ myType, onBack }: EmojiViewProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState('daily');
  const [currentText, setCurrentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customScene, setCustomScene] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const typeInfo = MBTI_TYPES.find(t => t.id === myType);
  const facts = MBTI_FACTS[myType];

  // AI 生成表情文案
  const generateEmojiText = async (templateId: string, customPrompt?: string) => {
    setIsLoading(true);
    try {
      const template = EMOJI_TEMPLATES.find(t => t.id === templateId);
      const scene = customPrompt || template?.prompt || '日常生活';
      
      const prompt = `你是一个 ${myType}（${typeInfo?.name}）类型的人。
性格特点：${facts?.traits?.join('、')}
超能力：${facts?.superPowers?.join('、')}
弱点：${facts?.weaknesses?.join('、')}

请用一句话（15-25字）描述：${scene}
要求：有趣、接地气、年轻人风格、带点自嘲或调侃。
只输出这句话，不要其他内容。`;

      const result = await generateMbtiInsight(myType, prompt);
      setCurrentText(result || '今天也是努力活着的一天！');
    } catch (e) {
      setCurrentText('AI 暂时开小差了，请重试～');
    } finally {
      setIsLoading(false);
    }
  };

  // 切换模板时生成新内容
  useEffect(() => {
    generateEmojiText(selectedTemplate);
  }, [selectedTemplate, myType]);

  // 自定义场景生成
  const handleCustomGenerate = () => {
    if (customScene.trim()) {
      generateEmojiText('custom', customScene.trim());
      setShowCustomInput(false);
      setCustomScene('');
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async () => {
    const fullText = `【${myType} ${typeInfo?.name}】${currentText}`;
    await Clipboard.setStringAsync(fullText);
    Alert.alert('已复制', '表情文案已复制到剪贴板！');
  };

  // 分享
  const shareEmoji = async () => {
    try {
      await Share.share({
        message: `【${myType} ${typeInfo?.name}】${currentText}\n\n— PersonaPop 人格表情`,
      });
    } catch (e) {}
  };

  const currentTemplate = EMOJI_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.fg} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>人格表情</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 我的类型 */}
        <View style={styles.myTypeRow}>
          <Image source={MBTI_IMAGES[myType]} style={styles.typeImage} contentFit="contain" />
          <View>
            <Text style={styles.typeLabel}>{myType}</Text>
            <Text style={styles.typeName}>{typeInfo?.name}</Text>
          </View>
          <View style={styles.aiBadge}>
            <Sparkles size={12} color="white" />
            <Text style={styles.aiBadgeText}>AI 生成</Text>
          </View>
        </View>

        {/* 表情卡片 */}
        <View style={[styles.emojiCard, { backgroundColor: currentTemplate?.bgColor }]}>
          <Text style={styles.emojiIcon}>{currentTemplate?.emoji}</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.secondary} />
              <Text style={styles.loadingText}>AI 正在创作...</Text>
            </View>
          ) : (
            <Text style={styles.emojiText}>{currentText}</Text>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.typeTag}>#{myType}</Text>
            <Text style={styles.templateTag}>#{currentTemplate?.label}</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => generateEmojiText(selectedTemplate)} disabled={isLoading}>
            <RefreshCw size={20} color={isLoading ? '#ccc' : COLORS.fg} />
            <Text style={[styles.actionText, isLoading && { color: '#ccc' }]}>换一个</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={copyToClipboard}>
            <Copy size={20} color={COLORS.fg} />
            <Text style={styles.actionText}>复制</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={shareEmoji}>
            <Share2 size={20} color={COLORS.fg} />
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>
        </View>

        {/* 自定义场景 */}
        <TouchableOpacity 
          style={styles.customToggle}
          onPress={() => setShowCustomInput(!showCustomInput)}
        >
          <Sparkles size={16} color={COLORS.secondary} />
          <Text style={styles.customToggleText}>自定义场景</Text>
        </TouchableOpacity>

        {showCustomInput && (
          <View style={styles.customInputSection}>
            <TextInput
              style={styles.customInput}
              placeholder="描述你想要的场景，如：开会迟到..."
              placeholderTextColor="#aaa"
              value={customScene}
              onChangeText={setCustomScene}
              maxLength={50}
            />
            <TouchableOpacity 
              style={[styles.customSendBtn, !customScene.trim() && { backgroundColor: '#ccc' }]}
              onPress={handleCustomGenerate}
              disabled={!customScene.trim() || isLoading}
            >
              <Send size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* 模板选择 */}
        <Text style={styles.sectionTitle}>选择表情类型</Text>
        <View style={styles.templateGrid}>
          {EMOJI_TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplate === template.id && styles.templateCardActive,
                { backgroundColor: template.bgColor }
              ]}
              onPress={() => setSelectedTemplate(template.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.templateEmoji}>{template.emoji}</Text>
              <Text style={styles.templateLabel}>{template.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI 提示 */}
        <View style={styles.aiHint}>
          <Sparkles size={14} color="#888" />
          <Text style={styles.aiHintText}>每次点击都会生成全新的 AI 原创内容</Text>
        </View>
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
  myTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  typeImage: { width: 50, height: 50 },
  typeLabel: { fontFamily: 'Kalam_700Bold', fontSize: 20, color: COLORS.fg },
  typeName: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: COLORS.secondary },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 'auto' },
  aiBadgeText: { fontFamily: 'PatrickHand_400Regular', fontSize: 11, color: 'white' },
  emojiCard: { borderWidth: 3, borderColor: COLORS.fg, borderRadius: 20, padding: 24, alignItems: 'center', minHeight: 180, justifyContent: 'center' },
  emojiIcon: { fontSize: 48, marginBottom: 12 },
  emojiText: { fontFamily: 'PatrickHand_400Regular', fontSize: 20, color: COLORS.fg, textAlign: 'center', lineHeight: 28 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontFamily: 'PatrickHand_400Regular', fontSize: 16, color: '#888' },
  cardFooter: { flexDirection: 'row', gap: 8, marginTop: 16 },
  typeTag: { fontFamily: 'Kalam_700Bold', fontSize: 12, color: COLORS.secondary, backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  templateTag: { fontFamily: 'Kalam_700Bold', fontSize: 12, color: COLORS.accent, backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginTop: 16, marginBottom: 16 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { fontFamily: 'PatrickHand_400Regular', fontSize: 12, color: COLORS.fg },
  customToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 12 },
  customToggleText: { fontFamily: 'Kalam_700Bold', fontSize: 14, color: COLORS.secondary },
  customInputSection: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  customInput: { flex: 1, backgroundColor: 'white', borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'PatrickHand_400Regular', fontSize: 14 },
  customSendBtn: { backgroundColor: COLORS.secondary, width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: 'Kalam_700Bold', fontSize: 16, color: COLORS.fg, marginBottom: 12 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  templateCard: { width: '31%', aspectRatio: 1, borderWidth: 2, borderColor: COLORS.fg, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  templateCardActive: { borderWidth: 3, borderColor: COLORS.accent, transform: [{ scale: 1.02 }] },
  templateEmoji: { fontSize: 28, marginBottom: 4 },
  templateLabel: { fontFamily: 'PatrickHand_400Regular', fontSize: 12, color: COLORS.fg },
  aiHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  aiHintText: { fontFamily: 'PatrickHand_400Regular', fontSize: 12, color: '#888' },
});
