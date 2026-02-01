// MBTI 测试问题
// 每个维度 3 道题，共 12 道题
// E/I: 外向/内向
// S/N: 感觉/直觉
// T/F: 思考/情感
// J/P: 判断/知觉

export interface TestQuestion {
    id: number;
    question: string;
    dimension: 'EI' | 'SN' | 'TF' | 'JP';
    optionA: {
        text: string;
        value: 'E' | 'S' | 'T' | 'J';
    };
    optionB: {
        text: string;
        value: 'I' | 'N' | 'F' | 'P';
    };
}

export const MBTI_TEST_QUESTIONS: TestQuestion[] = [
    // E/I 维度 - 外向/内向
    {
        id: 1,
        question: '周末你更想怎么度过？',
        dimension: 'EI',
        optionA: {
            text: '约朋友出去嗨，人越多越开心',
            value: 'E',
        },
        optionB: {
            text: '宅在家里，享受独处时光',
            value: 'I',
        },
    },
    {
        id: 2,
        question: '在聚会上，你通常会？',
        dimension: 'EI',
        optionA: {
            text: '主动和不认识的人聊天',
            value: 'E',
        },
        optionB: {
            text: '待在熟悉的朋友身边',
            value: 'I',
        },
    },
    {
        id: 3,
        question: '社交活动结束后，你感觉？',
        dimension: 'EI',
        optionA: {
            text: '精力充沛，还想继续',
            value: 'E',
        },
        optionB: {
            text: '需要独处来恢复能量',
            value: 'I',
        },
    },

    // S/N 维度 - 感觉/直觉
    {
        id: 4,
        question: '你更关注什么？',
        dimension: 'SN',
        optionA: {
            text: '当下发生的具体事情',
            value: 'S',
        },
        optionB: {
            text: '事物背后的含义和可能性',
            value: 'N',
        },
    },
    {
        id: 5,
        question: '描述一件事时，你倾向于？',
        dimension: 'SN',
        optionA: {
            text: '描述具体的细节和事实',
            value: 'S',
        },
        optionB: {
            text: '使用比喻和抽象概念',
            value: 'N',
        },
    },
    {
        id: 6,
        question: '面对新事物，你更在意？',
        dimension: 'SN',
        optionA: {
            text: '它实际上能用来做什么',
            value: 'S',
        },
        optionB: {
            text: '它代表的创新和未来可能',
            value: 'N',
        },
    },

    // T/F 维度 - 思考/情感
    {
        id: 7,
        question: '做决定时，你更依赖？',
        dimension: 'TF',
        optionA: {
            text: '逻辑分析和客观事实',
            value: 'T',
        },
        optionB: {
            text: '个人价值观和他人感受',
            value: 'F',
        },
    },
    {
        id: 8,
        question: '朋友遇到困难向你倾诉，你会？',
        dimension: 'TF',
        optionA: {
            text: '帮ta分析问题，提供解决方案',
            value: 'T',
        },
        optionB: {
            text: '先安慰ta，让ta感受到支持',
            value: 'F',
        },
    },
    {
        id: 9,
        question: '别人说你"太理性"或"太感性"，你觉得？',
        dimension: 'TF',
        optionA: {
            text: '可能确实比较理性，这是优点',
            value: 'T',
        },
        optionB: {
            text: '可能确实比较感性，这很正常',
            value: 'F',
        },
    },

    // J/P 维度 - 判断/知觉
    {
        id: 10,
        question: '你对计划的态度是？',
        dimension: 'JP',
        optionA: {
            text: '喜欢提前规划，按计划执行',
            value: 'J',
        },
        optionB: {
            text: '随机应变，保持灵活',
            value: 'P',
        },
    },
    {
        id: 11,
        question: '面对deadline，你通常会？',
        dimension: 'JP',
        optionA: {
            text: '提前完成，不喜欢拖延',
            value: 'J',
        },
        optionB: {
            text: '截止日期前才最有效率',
            value: 'P',
        },
    },
    {
        id: 12,
        question: '你的桌面/房间状态？',
        dimension: 'JP',
        optionA: {
            text: '整齐有序，物品各归其位',
            value: 'J',
        },
        optionB: {
            text: '看起来乱但我知道东西在哪',
            value: 'P',
        },
    },
];

// 计算 MBTI 结果
export function calculateMbtiResult(answers: Record<number, string>): string {
    const counts = {
        E: 0, I: 0,
        S: 0, N: 0,
        T: 0, F: 0,
        J: 0, P: 0,
    };

    // 统计每个维度的选择
    Object.entries(answers).forEach(([questionId, answer]) => {
        counts[answer as keyof typeof counts]++;
    });

    // 确定每个维度的类型
    const result = [
        counts.E >= counts.I ? 'E' : 'I',
        counts.S >= counts.N ? 'S' : 'N',
        counts.T >= counts.F ? 'T' : 'F',
        counts.J >= counts.P ? 'J' : 'P',
    ].join('');

    return result;
}

// 测试进度文案
export const TEST_PROGRESS_MESSAGES = [
    '让我们开始探索你的内心世界...',
    '有趣的选择！继续...',
    '正在分析你的思维模式...',
    '你的人格正在浮现...',
    '快要揭晓答案了！',
];
