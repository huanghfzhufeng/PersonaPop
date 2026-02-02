import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Share, Alert } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, RefreshCw, Share2, Download, Sparkles, Zap, ImageIcon } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MBTI_FACTS } from '@/constants/mbti-facts';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

interface EmojiViewProps {
  myType: string;
  onBack: () => void;
}

// 表情包风格模板
const EMOJI_STYLES = [
  { 
    id: 'cute', 
    label: '萌系', 
    emoji: '🥺', 
    bgColor: '#fff0f5',
    prompt: 'cute chibi kawaii style, big sparkly eyes, soft pastel colors, adorable expression'
  },
  { 
    id: 'cool', 
    label: '酷炫', 
    emoji: '😎', 
    bgColor: '#e8f4fd',
    prompt: 'cool confident pose, sunglasses, dynamic lighting, trendy streetwear style'
  },
  { 
    id: 'emotional', 
    label: '情绪', 
    emoji: '😭', 
    bgColor: '#f5f0ff',
    prompt: 'dramatic emotional expression, exaggerated features, meme-style humor'
  },
  { 
    id: 'work', 
    label: '打工', 
    emoji: '💼', 
    bgColor: '#f0f9ff',
    prompt: 'office worker exhausted but determined, coffee cup, laptop, relatable work struggle'
  },
  { 
    id: 'social', 
    label: '社交', 
    emoji: '🗣️', 
    bgColor: '#fff8e1',
    prompt: 'social interaction scene, conversation bubbles, expressive hand gestures'
  },
  { 
    id: 'chill', 
    label: '摆烂', 
    emoji: '🦥', 
    bgColor: '#f1f8e9',
    prompt: 'relaxed lazy pose, cozy blanket, snacks nearby, peaceful contentment'
  },
];

// MBTI 类型的表情包特征
const MBTI_EMOJI_TRAITS: Record<string, string> = {
  INTJ: 'calculating mastermind look, slightly smug expression, planning world domination vibes',
  INTP: 'lost in thought, messy hair, surrounded by books and random ideas floating',
  ENTJ: 'boss energy, commanding presence, power stance, leadership aura',
  ENTP: 'mischievous grin, chaotic energy, debate mode activated',
  INFJ: 'mystical wise aura, deep knowing eyes, gentle but intense',
  INFP: 'dreamy starry eyes, surrounded by butterflies and flowers, soft aesthetic',
  ENFJ: 'warm welcoming smile, supportive hug vibes, golden heart glow',
  ENFP: 'excited puppy energy, sparkles everywhere, maximum enthusiasm',
  ISTJ: 'organized and reliable look, checklist in hand, dependable energy',
  ISFJ: 'caring nurturing vibe, cozy sweater, warm cookies nearby',
  ESTJ: 'efficient manager mode, everything in order, authority presence',
  ESFJ: 'friendly host energy, party planning mode, everyone welcome vibes',
  ISTP: 'cool mechanic vibe, tools ready, quietly competent',
  ISFP: 'artistic soul, paintbrush or guitar, free spirit aesthetic',
  ESTP: 'action hero pose, adrenaline junkie, fearless adventurer',
  ESFP: 'spotlight performer, party starter, life of the celebration',
};

// API 配置
const API_BASE_URL = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.apifree.ai/v1';
const API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY || '';
const API_MODEL = process.env.EXPO_PUBLIC_AI_MODEL || 'bytedance/seedream-4.5';

export const EmojiView = ({ myType, onBack }: EmojiViewProps) => {
  const [selectedStyle, setSelectedStyle] = useState('cute');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const typeInfo = MBTI_TYPES.find(t => t.id === myType);
  const facts = MBTI_FACTS[myType];

  // 生成表情包图片
  const generateEmoji = async (styleId: string) => {
    if (!API_KEY) {
      Alert.alert('提示', 'AI 图片生成服务未配置');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);
    setGeneratedImage(null);

    try {
      const style = EMOJI_STYLES.find(s => s.id === styleId);
      const mbtiTraits = MBTI_EMOJI_TRAITS[myType] || MBTI_EMOJI_TRAITS['INFP'];
      
      // 构建 prompt
      const prompt = `Create a cute sticker-style emoji illustration of a ${myType} personality type character.
Character traits: ${mbtiTraits}
Style: ${style?.prompt || 'cute and expressive'}
The character should be: ${facts?.traits?.slice(0, 2).join(', ')}

Requirements:
- Sticker/emoji art style with bold outlines
- Expressive cartoon character, NOT realistic
- White or transparent background
- Single character, centered composition
- Cute, shareable, meme-worthy
- Hand-drawn sketch doodle aesthetic
- Include small decorative elements (stars, hearts, sparkles)`;

      setProgress(5);
      setStatusText('正在准备生成...');

      // 提交生成请求
      setProgress(10);
      setStatusText('正在提交请求...');
      
      const submitResponse = await fetch(`${API_BASE_URL}/image/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: API_MODEL,
          prompt: prompt,
          size: '2K',
        }),
      });

      const submitData = await submitResponse.json();
      console.log('Submit response:', JSON.stringify(submitData));
      
      if (!submitResponse.ok || submitData.code !== 200) {
        const errMsg = submitData.error || submitData.code_msg || submitData.message;
        throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) || '提交失败');
      }

      const requestId = submitData.resp_data?.request_id;
      if (!requestId) {
        throw new Error('未获取到请求ID');
      }

      setProgress(20);
      setStatusText('已提交，排队中...');

      // 轮询获取结果
      const imageUrl = await pollForResult(requestId);
      
      setGeneratedImage(imageUrl);
      setProgress(100);
      setStatusText('生成完成！');
    } catch (e: any) {
      const errorMsg = e?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e)) || '生成失败，请重试';
      console.error('Generate emoji error:', errorMsg);
      // 显示简短的用户友好错误
      if (errorMsg.includes('balance') || errorMsg.includes('quota')) {
        setError('AI 服务额度不足，请稍后再试');
      } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
        setError('生成超时，请重试');
      } else if (errorMsg.includes('key') || errorMsg.includes('auth')) {
        setError('API 配置错误，请检查设置');
      } else {
        setError('生成失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 轮询获取结果
  const pollForResult = async (requestId: string): Promise<string> => {
    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const response = await fetch(`${API_BASE_URL}/image/${requestId}/result`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.code !== 200) continue;

      const status = data.resp_data?.status;
      const progressValue = Math.min(20 + (attempt / maxAttempts) * 75, 95);
      setProgress(progressValue);

      const statusMessages: Record<string, string> = {
        'queuing': '排队中...',
        'pending': '等待处理...',
        'processing': '正在绘制...',
        'running': '正在生成...',
      };
      setStatusText(statusMessages[status] || `处理中...`);

      if (status === 'success') {
        const imageList = data.resp_data?.image_list;
        if (imageList && imageList.length > 0) {
          return imageList[0];
        }
        throw new Error('未获取到图片');
      } else if (status === 'error' || status === 'failed') {
        const errDetail = data.resp_data?.error;
        throw new Error(typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail) || '生成失败');
      }
    }

    throw new Error('生成超时，请重试');
  };

  // 切换风格时生成
  useEffect(() => {
    // 检查 API 配置
    if (!API_KEY) {
      setError('AI 图片服务未配置，请检查 .env 文件');
      return;
    }
    generateEmoji(selectedStyle);
  }, [selectedStyle, myType]);

  // 保存到相册
  const saveToGallery = async () => {
    if (!generatedImage) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能保存图片');
        return;
      }

      const filename = `${myType}_emoji_${Date.now()}.png`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.downloadAsync(generatedImage, fileUri);
      await MediaLibrary.saveToLibraryAsync(fileUri);
      
      Alert.alert('成功', '表情包已保存到相册！');
    } catch (e) {
      Alert.alert('失败', '保存失败，请重试');
    }
  };

  // 分享
  const shareEmoji = async () => {
    if (!generatedImage) return;

    try {
      await Share.share({
        message: `我的 ${myType} 人格表情包！\n— PersonaPop`,
        url: generatedImage,
      });
    } catch (e) {}
  };

  const currentStyle = EMOJI_STYLES.find(s => s.id === selectedStyle);

  return (
    <View style={styles.container}>
      {/* Header */}
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
            <Text style={styles.aiBadgeText}>AI 生图</Text>
          </View>
        </View>

        {/* 表情包展示区 */}
        <View style={[styles.emojiCard, { backgroundColor: currentStyle?.bgColor }]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.secondary} />
              <Text style={styles.loadingText}>{statusText}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <ImageIcon size={48} color="#ccc" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => generateEmoji(selectedStyle)}
              >
                <RefreshCw size={16} color="white" />
                <Text style={styles.retryText}>重试</Text>
              </TouchableOpacity>
            </View>
          ) : generatedImage ? (
            <Image 
              source={{ uri: generatedImage }} 
              style={styles.generatedImage}
              contentFit="contain"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Sparkles size={48} color={COLORS.secondary} />
              <Text style={styles.placeholderText}>点击风格开始生成</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.typeTag}>#{myType}</Text>
            <Text style={styles.styleTag}>#{currentStyle?.label}</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => generateEmoji(selectedStyle)} 
            disabled={isLoading}
          >
            <RefreshCw size={20} color={isLoading ? '#ccc' : COLORS.fg} />
            <Text style={[styles.actionText, isLoading && { color: '#ccc' }]}>换一个</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={saveToGallery}
            disabled={!generatedImage || isLoading}
          >
            <Download size={20} color={generatedImage && !isLoading ? COLORS.fg : '#ccc'} />
            <Text style={[styles.actionText, (!generatedImage || isLoading) && { color: '#ccc' }]}>保存</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={shareEmoji}
            disabled={!generatedImage || isLoading}
          >
            <Share2 size={20} color={generatedImage && !isLoading ? COLORS.fg : '#ccc'} />
            <Text style={[styles.actionText, (!generatedImage || isLoading) && { color: '#ccc' }]}>分享</Text>
          </TouchableOpacity>
        </View>

        {/* 风格选择 */}
        <Text style={styles.sectionTitle}>选择表情风格</Text>
        <View style={styles.styleGrid}>
          {EMOJI_STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                selectedStyle === style.id && styles.styleCardActive,
                { backgroundColor: style.bgColor }
              ]}
              onPress={() => setSelectedStyle(style.id)}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={styles.styleEmoji}>{style.emoji}</Text>
              <Text style={styles.styleLabel}>{style.label}</Text>
              {selectedStyle === style.id && (
                <View style={styles.selectedBadge}>
                  <Zap size={10} color="white" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 提示 */}
        <View style={styles.aiHint}>
          <Sparkles size={14} color="#888" />
          <Text style={styles.aiHintText}>AI 会根据你的 {myType} 特质生成专属表情包</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 2, 
    borderColor: COLORS.fg, 
    borderStyle: 'dashed' 
  },
  backButton: { padding: 4 },
  headerTitle: { fontFamily: 'Kalam_700Bold', fontSize: 24, color: COLORS.fg },
  content: { padding: 16, paddingBottom: 100 },
  
  // 类型显示
  myTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  typeImage: { width: 50, height: 50 },
  typeLabel: { fontFamily: 'Kalam_700Bold', fontSize: 20, color: COLORS.fg },
  typeName: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, color: COLORS.secondary },
  aiBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: COLORS.accent, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12, 
    marginLeft: 'auto' 
  },
  aiBadgeText: { fontFamily: 'PatrickHand_400Regular', fontSize: 12, color: 'white' },
  
  // 表情卡片
  emojiCard: { 
    borderWidth: 3, 
    borderColor: COLORS.fg, 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center', 
    minHeight: 320,
    justifyContent: 'center',
  },
  generatedImage: {
    width: 280,
    height: 280,
    borderRadius: 12,
  },
  loadingContainer: { 
    alignItems: 'center', 
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: { 
    fontFamily: 'PatrickHand_400Regular', 
    fontSize: 16, 
    color: COLORS.secondary 
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 14,
    color: COLORS.secondary,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  errorText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: 'white',
  },
  placeholderContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  placeholderText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 16,
    color: '#888',
  },
  cardFooter: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 16 
  },
  typeTag: { 
    fontFamily: 'Kalam_700Bold', 
    fontSize: 12, 
    color: COLORS.secondary, 
    backgroundColor: 'white', 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    borderRadius: 10 
  },
  styleTag: { 
    fontFamily: 'Kalam_700Bold', 
    fontSize: 12, 
    color: COLORS.accent, 
    backgroundColor: 'white', 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    borderRadius: 10 
  },
  
  // 操作按钮
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 40, 
    marginTop: 20, 
    marginBottom: 24 
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { fontFamily: 'PatrickHand_400Regular', fontSize: 12, color: COLORS.fg },
  
  // 风格选择
  sectionTitle: { 
    fontFamily: 'Kalam_700Bold', 
    fontSize: 16, 
    color: COLORS.fg, 
    marginBottom: 12 
  },
  styleGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginBottom: 20 
  },
  styleCard: { 
    width: '31%', 
    aspectRatio: 1, 
    borderWidth: 2, 
    borderColor: COLORS.fg, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
  },
  styleCardActive: { 
    borderWidth: 3, 
    borderColor: COLORS.accent, 
    transform: [{ scale: 1.02 }] 
  },
  styleEmoji: { fontSize: 32, marginBottom: 4 },
  styleLabel: { fontFamily: 'PatrickHand_400Regular', fontSize: 13, color: COLORS.fg },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 提示
  aiHint: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6 
  },
  aiHintText: { 
    fontFamily: 'PatrickHand_400Regular', 
    fontSize: 12, 
    color: '#888' 
  },
});
