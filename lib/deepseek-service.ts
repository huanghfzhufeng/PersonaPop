/**
 * DeepSeek AI 服务
 * 用于生成个性化的 MBTI 洞察和内容
 */

const DEEPSEEK_API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface DeepSeekResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

/**
 * 调用 DeepSeek Chat API
 */
async function callDeepSeek(messages: ChatMessage[]): Promise<string> {
    try {
        const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                temperature: 0.8,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data: DeepSeekResponse = await response.json();
        return data.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('DeepSeek API error:', error);
        throw error;
    }
}

/**
 * 生成个性化的 MBTI 洞察
 */
export async function generateMbtiInsight(mbtiType: string, vibe: string): Promise<string> {
    const vibeMap: Record<string, string> = {
        cyberpunk: '赛博朋克、未来科技',
        emo: '情绪化、深沉',
        party: '派对、狂欢',
        nature: '自然、治愈',
        dream: '梦幻、浪漫',
    };

    const messages: ChatMessage[] = [
        {
            role: 'system',
            content: `你是一个有趣、风趣的 MBTI 人格分析师。请用轻松幽默的语气，生成简短的人格洞察。
要求：
- 使用中文
- 不超过50个字
- 要有趣、有创意
- 结合当前的心情风格
- 不要太正式，要像朋友聊天一样`,
        },
        {
            role: 'user',
            content: `我是 ${mbtiType}，现在的心情是「${vibeMap[vibe] || '梦幻'}」风格。给我一句有趣的人格洞察吧！`,
        },
    ];

    return callDeepSeek(messages);
}

/**
 * 生成个性化的人格语录
 */
export async function generatePersonalQuote(mbtiType: string): Promise<string> {
    const messages: ChatMessage[] = [
        {
            role: 'system',
            content: `你是一个 MBTI 人格专家，擅长用幽默风趣的方式描述不同人格类型。
请生成一句该人格类型会说的有趣语录或内心独白。
要求：
- 使用中文
- 不超过30个字
- 要有趣、有自嘲精神
- 能引起该类型人的共鸣
- 不要用引号包裹`,
        },
        {
            role: 'user',
            content: `给 ${mbtiType} 生成一句有趣的语录`,
        },
    ];

    return callDeepSeek(messages);
}

/**
 * 生成加载时的趣味提示
 */
export async function generateLoadingTip(mbtiType: string): Promise<string> {
    const messages: ChatMessage[] = [
        {
            role: 'system',
            content: `生成一个关于 MBTI 人格的有趣小知识或冷知识。
要求：
- 使用中文
- 不超过40个字
- 要有趣、有教育意义
- 以"你知道吗？"开头`,
        },
        {
            role: 'user',
            content: `给我一个关于 ${mbtiType} 的有趣小知识`,
        },
    ];

    return callDeepSeek(messages);
}

/**
 * 分析测试结果，生成个性化解读
 */
export async function analyzeTestResult(mbtiType: string, answers: Record<number, string>): Promise<string> {
    // 统计各维度倾向
    const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    Object.values(answers).forEach(answer => {
        counts[answer as keyof typeof counts]++;
    });

    const messages: ChatMessage[] = [
        {
            role: 'system',
            content: `你是一个专业的 MBTI 人格分析师。根据用户的测试结果，给出简短有趣的个性化分析。
要求：
- 使用中文
- 不超过80个字
- 要有洞察力
- 语气轻松友好`,
        },
        {
            role: 'user',
            content: `我的测试结果是 ${mbtiType}。
维度倾向：
- 外向(E):${counts.E} vs 内向(I):${counts.I}
- 感觉(S):${counts.S} vs 直觉(N):${counts.N}  
- 思考(T):${counts.T} vs 情感(F):${counts.F}
- 判断(J):${counts.J} vs 知觉(P):${counts.P}

请给我一个简短的个性化分析。`,
        },
    ];

    return callDeepSeek(messages);
}
