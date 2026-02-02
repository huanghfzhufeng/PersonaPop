/**
 * MBTI 测试类型定义
 * 基于 Aurora MBTI 迁移，适配 React Native
 */

// 四个维度
export type Dimension = 'EI' | 'SN' | 'TF' | 'JP';

// 八个字母
export type Letter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

// 7级量表 (1=非常不同意, 4=中立, 7=非常同意)
export type Likert = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// 问题上下文
export type QuestionContext = 'work' | 'social' | 'personal' | 'academic' | 'general';

// 年龄分组
export type AgeGroup = 'young' | 'adult' | 'mature';

// 问题结构
export interface Question {
  id: string;
  text: string;
  dimension: Dimension;
  agree: Letter; // 同意此题时倾向的字母
  contexts?: QuestionContext[];
  ageGroups?: AgeGroup[];
  workRelevant?: boolean;
  socialRelevant?: boolean;
}

// 用户档案
export interface UserProfile {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | '';
  occupation?: string;
  education?: 'junior_high' | 'high_school' | 'college' | 'bachelor' | 'master' | 'phd' | '';
  relationship?: 'single' | 'dating' | 'married' | 'other' | '';
  interests?: string;
  workStyle?: 'individual' | 'team' | 'mixed' | '';
  stressLevel?: 'low' | 'medium' | 'high' | '';
  socialPreference?: 'quiet' | 'social' | 'balanced' | '';
}

// 答案记录 (题目ID -> 分值)
export type Answers = Record<string, Likert>;

// 答题质量评估
export interface AnswerQuality {
  straightLining: boolean;    // 直线作答 (选同一个答案)
  extremeResponse: boolean;   // 极端回答 (都选1或7)
  centralTendency: boolean;   // 中间倾向 (都选4)
  randomPattern: boolean;     // 随机模式 (方差异常低)
  completionRate: number;     // 完成率 0-1
  consistencyScore: number;   // 一致性分数 0-1
}

// 置信度评估
export interface ConfidenceAssessment {
  overall: number;                           // 总体置信度 0-100
  dimensions: Record<Dimension, number>;     // 各维度置信度
  qualityFlags: string[];                    // 质量警告标签
  recommendations: string[];                 // 建议
}

// 单维度分数
export interface DimensionScore {
  dimension: Dimension;
  first: Letter;          // 维度第一个字母 (E/S/T/J)
  second: Letter;         // 维度第二个字母 (I/N/F/P)
  net: number;            // 净分数
  maxAbs: number;         // 最大可能绝对值
  winner: Letter;         // 获胜字母
  percentFirst: number;   // 第一字母百分比 (0-100)
  percentSecond: number;  // 第二字母百分比 (0-100)
  confidence: number;     // 维度置信度 (0-100)
  answered: number;       // 该维度已答题数
}

// MBTI 测试结果
export interface MbtiResult {
  type: string;                              // MBTI 类型 (如 "INFP")
  scores: Record<Dimension, DimensionScore>; // 四维度分数
  quality: AnswerQuality;                    // 答题质量
  confidence: ConfidenceAssessment;          // 置信度评估
}

// 测试模式
export type TestMode = 'quick' | 'standard' | 'full';

// 测试模式配置
export const TEST_MODE_CONFIG: Record<TestMode, { questions: number; estimatedMinutes: number; label: string }> = {
  quick: { questions: 20, estimatedMinutes: 4, label: '快速测试' },
  standard: { questions: 40, estimatedMinutes: 10, label: '标准测试' },
  full: { questions: 60, estimatedMinutes: 18, label: '完整测试' },
};

// 量表标签
export const LIKERT_LABELS: Record<Likert, string> = {
  1: '非常不同意',
  2: '不同意',
  3: '有点不同意',
  4: '中立',
  5: '有点同意',
  6: '同意',
  7: '非常同意',
};

// MBTI 类型信息
export interface MbtiTypeInfo {
  id: string;
  name: string;
  nickname: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  color: string;
}

// 数据库存储的测试结果
export interface StoredMbtiResult {
  id: string;
  user_id: string;
  mbti_type: string;
  answers: Answers;
  scores: Record<Dimension, DimensionScore>;
  quality: AnswerQuality | null;
  confidence: ConfidenceAssessment | null;
  test_mode: TestMode;
  duration_seconds: number | null;
  created_at: string;
}
