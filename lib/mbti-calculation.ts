/**
 * MBTI 计算服务
 * 包含答题质量检测、置信度评估、结果计算
 */

import {
  type Answers,
  type AnswerQuality,
  type ConfidenceAssessment,
  type Dimension,
  type DimensionScore,
  type Letter,
  type MbtiResult,
  type Question,
  type UserProfile,
  type Likert,
} from './mbti-types';
import { MBTI_QUESTIONS } from '@/constants/mbti-questions';

// 维度第一字母映射
const FIRST_LETTER: Record<Dimension, Letter> = {
  EI: 'E',
  SN: 'S',
  TF: 'T',
  JP: 'J',
};

// 维度第二字母映射
const SECOND_LETTER: Record<Dimension, Letter> = {
  EI: 'I',
  SN: 'N',
  TF: 'F',
  JP: 'P',
};

/**
 * 检测答题质量
 */
export function detectAnswerQuality(
  answers: Answers,
  questionsToUse?: Question[]
): AnswerQuality {
  const questionsArray = questionsToUse || MBTI_QUESTIONS;
  const totalQuestions = questionsArray.length;
  const answeredValues = Object.values(answers).filter((v) => v !== undefined) as Likert[];
  const answeredCount = answeredValues.length;

  // 完成率
  const completionRate = answeredCount / totalQuestions;

  // 极端回答检测 (都选1或7)
  const extremeCount = answeredValues.filter((v) => v === 1 || v === 7).length;
  const extremeResponse = extremeCount / answeredCount > 0.8 && answeredCount > 10;

  // 中间倾向检测 (都选4)
  const neutralCount = answeredValues.filter((v) => v === 4).length;
  const centralTendency = neutralCount / answeredCount > 0.6 && answeredCount > 10;

  // 直线作答检测 (选同一个答案)
  const valueCounts = [1, 2, 3, 4, 5, 6, 7].map(
    (v) => answeredValues.filter((a) => a === v).length
  );
  const maxCount = Math.max(...valueCounts);
  const straightLining = maxCount / answeredCount > 0.7 && answeredCount > 15;

  // 随机模式检测 (方差异常低)
  const mean =
    answeredValues.reduce((sum, v) => sum + v, 0) / answeredValues.length;
  const variance =
    answeredValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    answeredValues.length;
  const randomPattern = variance < 0.8 && answeredCount > 20;

  // 一致性评分
  let consistencyScore = 1.0;
  if (answeredCount > 15) {
    const dimensionConsistency = calculateDimensionConsistency(
      answers,
      questionsArray
    );
    consistencyScore = Math.max(0.3, Math.min(1.0, dimensionConsistency));
  }

  return {
    straightLining,
    extremeResponse,
    centralTendency,
    randomPattern,
    completionRate,
    consistencyScore,
  };
}

/**
 * 计算维度一致性
 */
function calculateDimensionConsistency(
  answers: Answers,
  questions: Question[]
): number {
  const dimensionScores: Record<Dimension, number[]> = {
    EI: [],
    SN: [],
    TF: [],
    JP: [],
  };

  // 收集每个维度的标准化分数
  questions.forEach((q) => {
    const answer = answers[q.id];
    if (answer) {
      const first = FIRST_LETTER[q.dimension];
      const normalizedScore = q.agree === first ? answer : 8 - answer;
      dimensionScores[q.dimension].push(normalizedScore);
    }
  });

  // 计算每个维度的一致性
  let totalConsistency = 0;
  let validDimensions = 0;

  Object.values(dimensionScores).forEach((scores) => {
    if (scores.length >= 3) {
      const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const variance =
        scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
        scores.length;
      const consistency = 1 - Math.min(variance / 9, 1);
      totalConsistency += consistency;
      validDimensions++;
    }
  });

  return validDimensions > 0 ? totalConsistency / validDimensions : 0.5;
}

/**
 * 评估置信度
 */
export function assessConfidence(
  quality: AnswerQuality,
  scores: Record<Dimension, DimensionScore>
): ConfidenceAssessment {
  const qualityFlags: string[] = [];
  const recommendations: string[] = [];

  let baseConfidence = 100;

  // 完成率影响
  if (quality.completionRate < 0.5) {
    baseConfidence -= 40;
    qualityFlags.push('答题数量不足');
    recommendations.push('建议完成更多题目以获得准确结果');
  } else if (quality.completionRate < 0.8) {
    baseConfidence -= 15;
  }

  // 直线作答影响
  if (quality.straightLining) {
    baseConfidence -= 30;
    qualityFlags.push('可能存在直线作答');
    recommendations.push('建议认真考虑每道题目');
  }

  // 极端回答影响
  if (quality.extremeResponse) {
    baseConfidence -= 20;
    qualityFlags.push('回答过于极端');
    recommendations.push('大多数人在不同题目上会有不同程度的同意');
  }

  // 中间倾向影响
  if (quality.centralTendency) {
    baseConfidence -= 25;
    qualityFlags.push('回答过于中立');
    recommendations.push('建议更明确地表达自己的倾向');
  }

  // 随机模式影响
  if (quality.randomPattern) {
    baseConfidence -= 35;
    qualityFlags.push('回答模式异常');
    recommendations.push('请确保认真作答');
  }

  // 一致性影响
  if (quality.consistencyScore < 0.6) {
    baseConfidence -= 20;
    qualityFlags.push('回答一致性较低');
    recommendations.push('同一维度的题目回答差异较大');
  }

  const overall = Math.max(20, Math.min(100, baseConfidence));

  // 各维度置信度
  const dimensions: Record<Dimension, number> = {} as Record<Dimension, number>;
  (['EI', 'SN', 'TF', 'JP'] as Dimension[]).forEach((d) => {
    const score = scores[d];
    let dimConfidence = overall;

    // 题目数量影响
    if (score.answered < 5) {
      dimConfidence -= 25;
    } else if (score.answered < 10) {
      dimConfidence -= 10;
    }

    // 倾向强度影响 (越接近50%越不确定)
    const strength = Math.abs(score.percentFirst - 50);
    if (strength < 10) {
      dimConfidence -= 15;
    } else if (strength < 20) {
      dimConfidence -= 8;
    }

    dimensions[d] = Math.max(20, Math.min(100, dimConfidence));
  });

  // 添加建议
  if (overall >= 80) {
    recommendations.push('测试结果可信度较高');
  } else if (overall >= 60) {
    recommendations.push('测试结果仅供参考，建议重新测试');
  }

  return {
    overall,
    dimensions,
    qualityFlags,
    recommendations,
  };
}

/**
 * 计算个性化权重 (根据用户档案)
 */
export function calculatePersonalizedWeight(
  question: Question,
  profile?: UserProfile | null
): number {
  if (!profile) return 1.0;

  let weight = 1.0;

  // 年龄相关权重
  const age = profile.age;
  if (age && question.ageGroups) {
    let ageGroup: 'young' | 'adult' | 'mature';
    if (age <= 25) ageGroup = 'young';
    else if (age <= 40) ageGroup = 'adult';
    else ageGroup = 'mature';

    if (question.ageGroups.includes(ageGroup)) {
      weight *= 1.2;
    } else {
      weight *= 0.8;
    }
  }

  // 工作相关权重
  if (profile.occupation && question.workRelevant) {
    weight *= 1.15;
  }

  // 社交偏好相关权重
  if (profile.socialPreference && question.socialRelevant) {
    if (
      profile.socialPreference === 'quiet' &&
      question.dimension === 'EI'
    ) {
      weight *= question.agree === 'I' ? 1.2 : 0.9;
    } else if (
      profile.socialPreference === 'social' &&
      question.dimension === 'EI'
    ) {
      weight *= question.agree === 'E' ? 1.2 : 0.9;
    }
  }

  // 工作风格相关权重
  if (profile.workStyle && question.workRelevant) {
    if (profile.workStyle === 'individual' && question.dimension === 'EI') {
      weight *= question.agree === 'I' ? 1.15 : 0.95;
    } else if (profile.workStyle === 'team' && question.dimension === 'EI') {
      weight *= question.agree === 'E' ? 1.15 : 0.95;
    }
  }

  return Math.max(0.3, Math.min(2.0, weight));
}

/**
 * 计算 MBTI 结果 (核心函数)
 */
function computeMbtiInternal(
  answers: Answers,
  questionsArray: Question[],
  profile?: UserProfile | null
): MbtiResult {
  const dims: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const perDimCounts: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };

  for (const q of questionsArray) {
    const v = answers[q.id];
    if (!v) continue;
    
    perDimCounts[q.dimension] += 1;
    const delta = v - 4; // 与中立值的偏差
    const first = FIRST_LETTER[q.dimension];
    const direction = q.agree === first ? 1 : -1;
    const weight = profile ? calculatePersonalizedWeight(q, profile) : 1;
    dims[q.dimension] += delta * direction * weight;
  }

  const quality = detectAnswerQuality(answers, questionsArray);

  const scores = {} as Record<Dimension, DimensionScore>;
  (['EI', 'SN', 'TF', 'JP'] as Dimension[]).forEach((d) => {
    const net = dims[d];
    const maxAbs = (perDimCounts[d] || 1) * 3;
    const winner = net >= 0 ? FIRST_LETTER[d] : SECOND_LETTER[d];
    const percentFirst = Math.round(50 + (net / maxAbs) * 50);
    const percentSecond = 100 - percentFirst;

    const answeredCount = perDimCounts[d];
    const strength = Math.abs(percentFirst - 50);
    let dimConfidence = 85;

    if (answeredCount < 5) dimConfidence -= 25;
    else if (answeredCount < 10) dimConfidence -= 10;

    if (strength < 10) dimConfidence -= 15;
    else if (strength < 20) dimConfidence -= 8;

    dimConfidence *= quality.consistencyScore;
    if (profile) dimConfidence *= 1.1;

    scores[d] = {
      dimension: d,
      first: FIRST_LETTER[d],
      second: SECOND_LETTER[d],
      net,
      maxAbs,
      winner,
      percentFirst: Math.max(0, Math.min(100, percentFirst)),
      percentSecond: Math.max(0, Math.min(100, percentSecond)),
      confidence: Math.round(Math.max(20, Math.min(100, dimConfidence))),
      answered: answeredCount,
    };
  });

  const confidence = assessConfidence(quality, scores);
  if (profile) {
    confidence.overall = Math.min(100, confidence.overall * 1.05);
    confidence.recommendations.push('已根据个人档案优化结果');
  }

  const type =
    (scores.EI.winner as string) +
    (scores.SN.winner as string) +
    (scores.TF.winner as string) +
    (scores.JP.winner as string);

  return { type, scores, quality, confidence };
}

/**
 * 计算 MBTI 结果 (带用户档案)
 */
export function computeMbtiWithProfile(
  answers: Answers,
  profile?: UserProfile | null,
  questionsToUse?: Question[]
): MbtiResult {
  const questionsArray = questionsToUse || MBTI_QUESTIONS;
  return computeMbtiInternal(answers, questionsArray, profile);
}

/**
 * 计算 MBTI 结果 (不带用户档案)
 */
export function computeMbti(
  answers: Answers,
  questionsToUse?: Question[]
): MbtiResult {
  const questionsArray = questionsToUse || MBTI_QUESTIONS;
  return computeMbtiInternal(answers, questionsArray);
}

/**
 * 格式化分数用于分享
 */
export function formatScoresForShare(result: MbtiResult): string {
  const d = result.scores;
  const line = (dim: Dimension) => {
    const s = d[dim];
    const left = `${s.first} ${s.percentFirst}%`;
    const right = `${s.second} ${s.percentSecond}%`;
    return `${dim}: ${left} | ${right}`;
  };
  return [line('EI'), line('SN'), line('TF'), line('JP')].join('\n');
}

/**
 * 获取维度中文名称
 */
export function getDimensionLabel(dimension: Dimension): string {
  const labels: Record<Dimension, string> = {
    EI: '外向 (E) vs 内向 (I)',
    SN: '感觉 (S) vs 直觉 (N)',
    TF: '思考 (T) vs 情感 (F)',
    JP: '判断 (J) vs 感知 (P)',
  };
  return labels[dimension];
}

/**
 * 获取字母中文含义
 */
export function getLetterMeaning(letter: Letter): string {
  const meanings: Record<Letter, string> = {
    E: '外向',
    I: '内向',
    S: '感觉',
    N: '直觉',
    T: '思考',
    F: '情感',
    J: '判断',
    P: '感知',
  };
  return meanings[letter];
}
