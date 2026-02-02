import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/persona';
import { Likert, LIKERT_LABELS } from '@/lib/mbti-types';

interface LikertScaleProps {
  value: Likert | null;
  onChange: (value: Likert) => void;
  disabled?: boolean;
}

/**
 * 7 级量表选择器组件
 * 手绘风格，从 1 (非常不同意) 到 7 (非常同意)
 */
export const LikertScale = ({ value, onChange, disabled }: LikertScaleProps) => {
  const options: Likert[] = [1, 2, 3, 4, 5, 6, 7];

  // 根据选中值获取颜色
  const getOptionColor = (option: Likert, isSelected: boolean) => {
    if (!isSelected) return 'white';
    
    // 1-3: 红色调 (不同意)
    // 4: 灰色 (中立)
    // 5-7: 绿色调 (同意)
    if (option <= 3) {
      const intensity = 1 - (option - 1) / 3;
      return `rgba(255, 77, 77, ${0.3 + intensity * 0.5})`;
    } else if (option === 4) {
      return COLORS.muted;
    } else {
      const intensity = (option - 4) / 3;
      return `rgba(76, 175, 80, ${0.3 + intensity * 0.5})`;
    }
  };

  return (
    <View style={styles.container}>
      {/* 顶部标签 */}
      <View style={styles.labelsRow}>
        <Text style={styles.labelLeft}>非常不同意</Text>
        <Text style={styles.labelRight}>非常同意</Text>
      </View>

      {/* 选项按钮 */}
      <View style={styles.optionsRow}>
        {options.map((option) => {
          const isSelected = value === option;
          const backgroundColor = getOptionColor(option, isSelected);
          
          return (
            <TouchableOpacity
              key={option}
              onPress={() => !disabled && onChange(option)}
              activeOpacity={0.7}
              disabled={disabled}
              style={[
                styles.optionButton,
                {
                  backgroundColor,
                  borderColor: isSelected ? COLORS.fg : COLORS.muted,
                  borderWidth: isSelected ? 3 : 2,
                  transform: isSelected ? [{ scale: 1.1 }] : [],
                },
                disabled && styles.optionDisabled,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 底部详细标签 */}
      {value && (
        <View style={styles.selectedLabel}>
          <Text style={styles.selectedLabelText}>
            {LIKERT_LABELS[value]}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  labelLeft: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 13,
    color: '#e57373',
  },
  labelRight: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 13,
    color: '#81c784',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  optionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.fg,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 16,
    color: COLORS.fg,
  },
  optionTextSelected: {
    color: COLORS.fg,
  },
  selectedLabel: {
    marginTop: 12,
    alignItems: 'center',
  },
  selectedLabelText: {
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 16,
    color: COLORS.fg,
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.fg,
    overflow: 'hidden',
  },
});
