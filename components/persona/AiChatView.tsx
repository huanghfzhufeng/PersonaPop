import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, Send, Bot, Sparkles, Trash2, RefreshCw, Lightbulb, Heart, Zap } from 'lucide-react-native';
import { COLORS, MBTI_TYPES, MBTI_IMAGES } from '@/constants/persona';
import { MBTI_FACTS } from '@/constants/mbti-facts';
import { chatWithHistory } from '@/lib/deepseek-service';

interface AiChatViewProps {
  myType: string;
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  suggestions?: string[];
}

// AI 助手的人格设定
const AI_PERSONALITY = {
  name: '小 P',
  traits: ['热情', '有趣', '懂心理学', '善于倾听'],
  style: '像一个懂你的好朋友，会用emoji表达情感，偶尔会调皮，但总是真诚地帮助你',
};

// 根据 MBTI 类型动态生成问题
const getQuickQuestions = (mbtiType: string) => {
  const baseQuestions = [
    `作为${mbtiType}，我最大的魅力是什么？`,
    '帮我分析一下最近的困扰',
    '怎样才能更好地发挥我的优势？',
  ];
  
  const typeSpecific: Record<string, string[]> = {
    'INTJ': ['如何让别人理解我的想法？', '我的完美主义是优点还是缺点？'],
    'INTP': ['怎样把想法变成行动？', '如何应对社交压力？'],
    'ENTJ': ['如何更好地倾听他人？', '领导力的边界在哪里？'],
    'ENTP': ['怎么专注做完一件事？', '我的辩论欲太强怎么办？'],
    'INFJ': ['如何保护自己的能量？', '怎样处理过度共情？'],
    'INFP': ['如何面对理想与现实的差距？', '敏感是我的超能力吗？'],
    'ENFJ': ['如何在帮助别人时照顾自己？', '我是不是太在意别人的感受了？'],
    'ENFP': ['怎么让热情持续更久？', '选择困难症有救吗？'],
    'ISTJ': ['如何应对突发变化？', '怎样让自己更灵活一些？'],
    'ISFJ': ['如何学会说「不」？', '怎样表达自己的需求？'],
    'ESTJ': ['如何更好地理解感性的人？', '效率和人情怎么平衡？'],
    'ESFJ': ['如何处理被忽视的感觉？', '怎样减少对认可的依赖？'],
    'ISTP': ['如何更好地表达情感？', '独处和社交怎么平衡？'],
    'ISFP': ['如何面对冲突？', '怎样让创意变成现实？'],
    'ESTP': ['如何培养耐心？', '怎样做更长远的规划？'],
    'ESFP': ['如何应对独处时的焦虑？', '怎样在娱乐和责任间平衡？'],
  };
  
  return [...baseQuestions, ...(typeSpecific[mbtiType] || ['给我一些成长建议', '今天有什么想对我说的？'])];
};

// 思考状态文案
const THINKING_TEXTS = [
  '让我想想...',
  '正在分析你的问题...',
  '组织一下思路...',
  '嗯，这是个好问题...',
  '翻阅我的知识库...',
];

// 打字效果组件
const TypingText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 15); // 打字速度
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text]);
  
  return <Text style={styles.messageText}>{displayedText}</Text>;
};

export const AiChatView = ({ myType, onBack }: AiChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const typeInfo = MBTI_TYPES.find(t => t.id === myType);
  const facts = MBTI_FACTS[myType];
  const quickQuestions = getQuickQuestions(myType);

  // 脉冲动画
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading]);

  // 初始化欢迎消息
  useEffect(() => {
    const greetings = [
      `嗨！我是${AI_PERSONALITY.name}，你的专属人格顾问 ✨`,
      `很高兴认识你，${typeInfo?.name}！`,
      `我知道你是 ${myType}，${facts?.traits?.slice(0, 2).join('、')}是你闪光的地方～`,
      `无论是职业困惑、人际关系，还是自我成长，都可以和我聊聊！`,
      `我会根据你的性格特点，给你最贴心的建议 💫`,
    ];
    
    const welcomeMessage: Message = {
      id: '0',
      role: 'assistant',
      content: greetings.join('\n\n'),
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setCurrentSuggestions(quickQuestions.slice(0, 3));
  }, [myType]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // 发送消息
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setCurrentSuggestions([]);
    
    // 随机选择思考文案
    setThinkingText(THINKING_TEXTS[Math.floor(Math.random() * THINKING_TEXTS.length)]);
    scrollToBottom();

    try {
      // 构建对话历史
      const history = messages
        .filter(m => m.role !== 'system')
        .slice(-8)
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      
      // 系统提示词
      const systemPrompt = `你是「${AI_PERSONALITY.name}」，一个${AI_PERSONALITY.traits.join('、')}的 MBTI 人格顾问。
你的风格：${AI_PERSONALITY.style}

【用户档案】
- MBTI 类型：${myType}（${typeInfo?.name}）
- 性格特点：${facts?.traits?.join('、')}
- 超能力：${facts?.superPowers?.join('、')}
- 成长空间：${facts?.weaknesses?.join('、')}

【回复要求】
1. 用温暖、有趣的语气，像朋友一样交流
2. 适当使用 emoji 增加表达力（但不要过多）
3. 回答要针对 ${myType} 的特点给出个性化、有洞察力的建议
4. 可以引用用户之前说的话，体现你在认真倾听
5. 回答后抛出 1 个引导性问题
6. 回答控制在 100-200 字之间
7. 严格按 JSON 格式返回：{"reply": "回复", "followUp": ["问题1", "问题2"]}`;

      const response = await chatWithHistory(systemPrompt, history, text, 800);
      
      // 解析 JSON 响应
      let reply = response || '';
      let suggestions: string[] = [];
      
      try {
        const jsonMatch = response?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          reply = parsed.reply || response;
          suggestions = parsed.followUp || [];
        }
      } catch {
        // 如果解析失败，使用原始响应
        reply = response?.replace(/```json/g, '').replace(/```/g, '').trim() || '抱歉，让我重新组织一下思路...';
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        isTyping: true,
        suggestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setTypingMessageId(assistantMessage.id);
      
      // 动态生成建议问题
      if (suggestions.length > 0) {
        setCurrentSuggestions(suggestions.slice(0, 2));
      } else {
        // 根据对话内容动态推荐
        const dynamicSuggestions = [
          '还有什么想聊的吗？',
          `作为${myType}，你觉得呢？`,
        ];
        setCurrentSuggestions(dynamicSuggestions);
      }
    } catch (e) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '哎呀，网络好像打了个盹儿 😴 稍等一下再试试？',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setCurrentSuggestions(['重新问一下', '换个问题试试']);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  // 打字完成回调
  const onTypingComplete = useCallback((messageId: string) => {
    setTypingMessageId(null);
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isTyping: false } : m
    ));
  }, []);

  // 清空对话
  const clearChat = () => {
    const clearMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `好的，我们重新开始！🌟\n\n作为${typeInfo?.name}，今天想聊点什么？`,
      timestamp: new Date(),
    };
    setMessages([clearMessage]);
    setCurrentSuggestions(quickQuestions.slice(0, 3));
    setTypingMessageId(null);
  };

  // 渲染消息内容（支持打字效果）
  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return (
        <Text style={[styles.messageText, styles.messageTextUser]}>
          {message.content}
        </Text>
      );
    }
    
    // AI 消息使用打字效果
    if (message.isTyping && typingMessageId === message.id) {
      return (
        <TypingText 
          text={message.content} 
          onComplete={() => onTypingComplete(message.id)} 
        />
      );
    }
    
    return <Text style={styles.messageText}>{message.content}</Text>;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.fg} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Sparkles size={22} color={isLoading ? COLORS.accent : COLORS.secondary} />
          </Animated.View>
          <Text style={styles.headerTitle}>{AI_PERSONALITY.name}</Text>
          {isLoading && <Text style={styles.headerStatus}>思考中</Text>}
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Trash2 size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* 消息列表 */}
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageRow,
              message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.avatarBot}>
                <Sparkles size={18} color="white" />
              </View>
            )}
            <View style={[
              styles.messageBubble,
              message.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant
            ]}>
              {renderMessageContent(message)}
            </View>
            {message.role === 'user' && (
              <View style={styles.avatarUser}>
                <Image source={MBTI_IMAGES[myType]} style={styles.avatarImage} contentFit="contain" />
              </View>
            )}
          </View>
        ))}

        {/* 思考状态指示器 - 更有动态感 */}
        {isLoading && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <Animated.View style={[styles.avatarBot, { transform: [{ scale: pulseAnim }] }]}>
              <Sparkles size={18} color="white" />
            </Animated.View>
            <View style={[styles.messageBubble, styles.bubbleAssistant, styles.thinkingBubble]}>
              <View style={styles.thinkingContent}>
                <View style={styles.dotsContainer}>
                  <ThinkingDots />
                </View>
                <Text style={styles.thinkingText}>{thinkingText}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 动态建议区域 */}
      {currentSuggestions.length > 0 && !isLoading && (
        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsHeader}>
            <Lightbulb size={14} color={COLORS.secondary} />
            <Text style={styles.suggestionsTitle}>
              {messages.length <= 1 ? '试试问我' : '继续聊聊'}
            </Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {currentSuggestions.map((suggestion, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.suggestionChip}
                onPress={() => sendMessage(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
                <Zap size={12} color={COLORS.secondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 输入区 */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="和我聊聊你的想法..."
            placeholderTextColor="#aaa"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ccc" />
            ) : (
              <Send size={20} color={inputText.trim() ? 'white' : '#ccc'} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.disclaimerRow}>
          <Bot size={12} color="#aaa" />
          <Text style={styles.disclaimer}>{AI_PERSONALITY.name} 会根据你的 {myType} 特质给出个性化建议</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// 思考中的动态点点
const ThinkingDots = () => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '•');
    }, 400);
    return () => clearInterval(timer);
  }, []);
  
  return <Text style={styles.dots}>{dots || '•'}</Text>;
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 24,
    color: COLORS.fg,
  },
  clearButton: {
    padding: 4,
  },
  // 消息列表
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarBot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarUser: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleAssistant: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.fg,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.secondary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 16,
    color: COLORS.fg,
    lineHeight: 22,
  },
  messageTextUser: {
    color: 'white',
  },
  // 思考状态
  thinkingBubble: {
    backgroundColor: '#f8f9fa',
  },
  thinkingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotsContainer: {
    width: 24,
    alignItems: 'center',
  },
  dots: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 18,
    color: COLORS.secondary,
    letterSpacing: 2,
  },
  thinkingText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // Header 状态
  headerStatus: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 12,
    color: COLORS.accent,
    marginLeft: 4,
  },
  // 动态建议区
  suggestionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: COLORS.muted,
    backgroundColor: '#fafafa',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  suggestionsTitle: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 13,
    color: '#666',
  },
  suggestionsList: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 14,
    color: COLORS.fg,
  },
  // 输入区
  inputContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderColor: COLORS.fg,
    backgroundColor: COLORS.bg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.fg,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 16,
    color: COLORS.fg,
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  disclaimer: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 11,
    color: '#aaa',
  },
});
