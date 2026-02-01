export const COLORS = {
    bg: '#fdfbf7',
    fg: '#2d2d2d',
    accent: '#ff4d4d',
    secondary: '#2d5da1',
    muted: '#e5e0d8',
    yellow: '#fff9c4',
};

// MBTI 人格角色图片映射（透明底）
export const MBTI_IMAGES: Record<string, any> = {
    INTJ: require('../MMM/0-removebg-preview.png'),
    INTP: require('../MMM/1-Photoroom.png'),
    ENTJ: require('../MMM/2-Photoroom.png'),
    ENTP: require('../MMM/3-Photoroom.png'),
    INFJ: require('../MMM/4-Photoroom.png'),
    INFP: require('../MMM/5-Photoroom.png'),
    ENFJ: require('../MMM/6-Photoroom.png'),
    ENFP: require('../MMM/7-Photoroom.png'),
    ISTJ: require('../MMM/8-Photoroom.png'),
    ISFJ: require('../MMM/01-Photoroom.png'),
    ESTJ: require('../MMM/11-Photoroom.png'),
    ESFJ: require('../MMM/w2-Photoroom.png'),
    ISTP: require('../MMM/33-Photoroom.png'),
    ISFP: require('../MMM/55-Photoroom.png'),
    ESTP: require('../MMM/43-Photoroom.png'),
    ESFP: require('../MMM/65-Photoroom.png'),
};

export const MBTI_TYPES = [
    { id: 'INTJ', label: 'INTJ', name: '建筑师', color: '#f3e8ff' },
    { id: 'INTP', label: 'INTP', name: '逻辑学家', color: '#f3e8ff' },
    { id: 'ENTJ', label: 'ENTJ', name: '指挥官', color: '#e0e7ff' },
    { id: 'ENTP', label: 'ENTP', name: '辩论家', color: '#fce7f3' },
    { id: 'INFJ', label: 'INFJ', name: '提倡者', color: '#dcfce7' },
    { id: 'INFP', label: 'INFP', name: '调停者', color: '#dcfce7' },
    { id: 'ENFJ', label: 'ENFJ', name: '主人公', color: '#ccfbf1' },
    { id: 'ENFP', label: 'ENFP', name: '竞选者', color: '#cffafe' },
    { id: 'ISTJ', label: 'ISTJ', name: '物流师', color: '#dbeafe' },
    { id: 'ISFJ', label: 'ISFJ', name: '守卫者', color: '#dbeafe' },
    { id: 'ESTJ', label: 'ESTJ', name: '总经理', color: '#bfdbfe' },
    { id: 'ESFJ', label: 'ESFJ', name: '执政官', color: '#e0f2fe' },
    { id: 'ISTP', label: 'ISTP', name: '鉴赏家', color: '#fef9c3' },
    { id: 'ISFP', label: 'ISFP', name: '探险家', color: '#fef9c3' },
    { id: 'ESTP', label: 'ESTP', name: '企业家', color: '#ffedd5' },
    { id: 'ESFP', label: 'ESFP', name: '表演者', color: '#ffedd5' },
];

export const VIBES = [
    { id: 'cyberpunk', label: '赛博朋克', icon: '🤖', desc: '霓虹 未来' },
    { id: 'emo', label: 'Emo时刻', icon: '🌧️', desc: '黑白 孤独' },
    { id: 'party', label: '火力全开', icon: '🔥', desc: '亮片 模糊' },
    { id: 'nature', label: '森系治愈', icon: '🌿', desc: '阳光 胶片' },
    { id: 'dream', label: '梦核', icon: '☁️', desc: '粉色 怀旧' },
];

export const COPY_TEMPLATES: Record<string, string[]> = {
    ESFP: [
        "生活是我的舞台，你们只是不想买票的观众。",
        "计划？我的计划就是没有计划。",
        "我不是在喧哗，我是在给这个世界调高音量。",
    ],
    INTJ: [
        "虽然我没说话，但我已经在脑子里纠正了你的语法三次。",
        "请不要把你的情绪洒在我的逻辑上。",
        "我有一个完美的计划，前提是这世界别有人。",
    ],
    DEFAULT: [
        "你的能量是独一无二的艺术品。",
        "在这个充满副本的世界，做唯一的原创。",
        "Don't just exist, vibrate.",
    ]
};
