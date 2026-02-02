import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS } from '@/constants/persona';
import { Likert, LIKERT_LABELS } from '@/lib/mbti-types';

interface LikertScaleProps {
  value: Likert | null;
  onChange: (value: Likert) => void;
  disabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
}

// 简化为 5 个选项的配置
const OPTION_CONFIG = [
  { value: 1 as Likert, emoji: '🙅', label: '不同意', color: '#FF6B6B', bg: '#FFE8E8' },
  { value: 3 as Likert, emoji: '🤔', label: '不确定', color: '#FFB84D', bg: '#FFF4E0' },
  { value: 4 as Likert, emoji: '😐', label: '中立', color: '#888888', bg: '#F0F0F0' },
  { value: 5 as Likert, emoji: '🙂', label: '有点同意', color: '#4ECDC4', bg: '#E0FAF8' },
  { value: 7 as Likert, emoji: '🙋', label: '同意', color: '#45B7D1', bg: '#E0F4FA' },
];

/**
 * 简化版 5 级量表选择器
 * 卡片式设计，更直观
 */
export const LikertScale = ({ value, onChange, disabled }: LikertScaleProps) => {
  return (
    <View style={styles.container}>
      {/* 卡片式选项 */}
      <View style={styles.cardsRow}>
        {OPTION_CONFIG.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => !disabled && onChange(option.value)}
              activeOpacity={0.8}
              disabled={disabled}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected ? option.bg : 'white',
                  borderColor: isSelected ? option.color : '#E0E0E0',
                  borderWidth: isSelected ? 3 : 2,
                  transform: isSelected ? [{ scale: 1.05 }] : [],
                },
                disabled && styles.optionDisabled,
              ]}
            >
              <Text style={[styles.cardEmoji, isSelected && { transform: [{ scale: 1.2 }] }]}>
                {option.emoji}
              </Text>
              <Text style={[
                styles.cardLabel,
                { color: isSelected ? option.color : '#666' }
              ]}>
                {option.label}
              </Text>
              {isSelected && (
                <View style={[styles.selectedDot, { backgroundColor: option.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
    position: 'relative',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  cardLabel: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedDot: {
    position: 'absolute',
    bottom: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
