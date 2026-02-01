/**
 * AI 图片生成服务
 * 支持 apifree.ai 图片生成 API，带降级方案
 */

// MBTI 类型对应的艺术风格提示词（中文优化）
const MBTI_STYLE_PROMPTS: Record<string, string> = {
    INTJ: '神秘的建筑师，几何图案环绕，深紫色和藏青色调，沉思的表情，智慧之眼',
    INTP: '好奇的科学家，漂浮的方程式和抽象概念环绕，冷蓝色和银色调，思考中',
    ENTJ: '自信的领袖站在山巅，大胆的红色和金色点缀，王者气势',
    ENTP: '充满创意的发明家，灵感火花四溅，电光色彩，调皮的笑容',
    INFJ: '温柔的神秘者，流动的空灵能量，柔和的绿色和紫色，睿智而慈悲',
    INFP: '梦幻的艺术家在魔法森林中，粉彩色调，蝴蝶和花朵环绕，奇幻',
    ENFJ: '有魅力的导师散发温暖，金色光芒，周围有人群，鼓舞人心',
    ENFP: '热情的探索者，彩虹色彩，星星和闪光，无穷的能量',
    ISTJ: '可靠的守护者，结构化的几何背景，大地色调，值得信赖',
    ISFJ: '温暖的保护者在舒适的环境中，暖棕色和奶油色，温柔体贴',
    ESTJ: '有条理的管理者在结构化环境中，大胆的海军蓝和白色，专业',
    ESFJ: '社交达人在聚会中，温暖的桃色和珊瑚色调，热情的笑容',
    ISTP: '技艺精湛的工匠与工具和机械，金属灰和蓝色，专注',
    ISFP: '自由的艺术家与泼墨，鲜艳的自然色彩，平和',
    ESTP: '冒险的挑战者在行动中，动感的橙色和红色，肾上腺素',
    ESFP: '舞台上的表演者，聚光灯下，闪光和彩带，纯粹的快乐',
};

// Vibe 对应的风格修饰词（中文优化）
const VIBE_MODIFIERS: Record<string, string> = {
    cyberpunk: '赛博朋克风格，霓虹灯光，未来都市，全息效果，数字故障艺术，科技感，深蓝紫色调',
    emo: '暗黑情绪风格，黑白配红色点缀，雨天，忧郁，艺术阴影，孤独感',
    party: '派对氛围，迪斯科灯光，彩带纷飞，庆祝，充满活力，动态模糊',
    nature: '自然治愈风，阳光穿过树叶，胶片质感，有机纹理，宁静的草地',
    dream: '梦核美学，柔软的粉色云朵，怀旧，超现实，粉彩渐变，空灵光晕',
};

// MBTI 本地人格图片映射（透明底）
import { MBTI_IMAGES } from '../constants/persona';
const MBTI_LOCAL_IMAGES = MBTI_IMAGES;

// 占位图 URL 列表（按 Vibe 分类，作为后备）
const PLACEHOLDER_IMAGES: Record<string, string[]> = {
    cyberpunk: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
        'https://images.unsplash.com/photo-1515630278258-407f66498911?w=800',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    ],
    emo: [
        'https://images.unsplash.com/photo-1516410529446-2c777cb7366d?w=800',
        'https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=800',
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800',
    ],
    party: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    ],
    nature: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
        'https://images.unsplash.com/photo-1518173946687-a4c036bc3c95?w=800',
    ],
    dream: [
        'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800',
        'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
    ],
};

export interface GenerateImageResult {
    success: boolean;
    imageUrl: string | number;  // number for local require()
    isPlaceholder: boolean;
    isLocalImage?: boolean;
    error?: string;
}

// 进度回调类型
export type ProgressCallback = (progress: number, status: string) => void;

// API 配置
const API_BASE_URL = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.apifree.ai/v1';
const API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY || '';
const API_MODEL = process.env.EXPO_PUBLIC_AI_MODEL || 'bytedance/seedream-4.5';

/**
 * 生成 AI 图片
 * @param mbtiType MBTI 类型
 * @param vibe 心情/风格
 * @param onProgress 进度回调函数
 * @returns 图片 URL
 */
export async function generatePersonaImage(
    mbtiType: string,
    vibe: string,
    onProgress?: ProgressCallback
): Promise<GenerateImageResult> {
    // 如果明确禁用 AI，使用本地 MBTI 图片
    if (process.env.EXPO_PUBLIC_DISABLE_AI === 'true') {
        console.log('AI disabled, using local MBTI image');
        return getLocalMbtiImage(mbtiType);
    }

    // 检查 API Key 是否配置
    if (!API_KEY) {
        console.warn('API key not configured, using local MBTI image');
        return {
            ...getLocalMbtiImage(mbtiType),
            error: 'API key not configured',
        };
    }

    try {
        const prompt = buildPrompt(mbtiType, vibe);
        
        // 报告初始进度
        onProgress?.(5, '正在准备提示词...');
        
        // 1. 提交图片生成请求
        onProgress?.(10, '正在提交生成请求...');
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
            const errorMsg = submitData.error || submitData.code_msg || submitData.message || `HTTP ${submitResponse.status}`;
            console.error('Submit error:', errorMsg);
            throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }

        const requestId = submitData.resp_data?.request_id;
        if (!requestId) {
            throw new Error('No request_id in response');
        }

        onProgress?.(20, '已提交，正在排队...');

        // 2. 轮询获取结果
        const imageUrl = await pollForResult(requestId, 30, onProgress);
        
        if (!imageUrl) {
            throw new Error('No image URL found in response');
        }

        return {
            success: true,
            imageUrl,
            isPlaceholder: false,
        };
    } catch (error: any) {
        const errorMsg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        console.error('AI image generation failed:', errorMsg);
        // 降级到占位图
        const placeholder = getPlaceholderImage(vibe);
        return {
            ...placeholder,
            error: errorMsg,
        };
    }
}

// 状态对应的中文描述
const STATUS_MESSAGES: Record<string, string> = {
    'queuing': '正在排队中...',
    'pending': '等待处理...',
    'processing': '正在绘制中...',
    'running': '正在生成...',
};

/**
 * 轮询获取图片生成结果
 */
async function pollForResult(
    requestId: string, 
    maxAttempts: number = 30,
    onProgress?: ProgressCallback
): Promise<string | null> {
    const pollInterval = 2000; // 2秒轮询一次
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        try {
            const response = await fetch(`${API_BASE_URL}/image/${requestId}/result`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                },
            });

            if (!response.ok) {
                console.log(`Poll attempt ${attempt + 1}: HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();
            
            if (data.code !== 200) {
                console.log(`Poll attempt ${attempt + 1}: ${data.code_msg}`);
                continue;
            }

            const status = data.resp_data?.status;
            
            // 计算进度: 20% 开始，95% 结束，留 5% 给最后处理
            const progress = Math.min(20 + (attempt / maxAttempts) * 75, 95);
            const statusMessage = STATUS_MESSAGES[status] || `处理中 (${status})...`;
            onProgress?.(progress, statusMessage);
            
            if (status === 'success') {
                onProgress?.(100, '生成完成!');
                const imageList = data.resp_data?.image_list;
                if (imageList && imageList.length > 0) {
                    return imageList[0];
                }
                throw new Error('No images in response');
            } else if (status === 'error' || status === 'failed') {
                throw new Error(data.resp_data?.error || 'Generation failed');
            }
            
            console.log(`Poll attempt ${attempt + 1}: status = ${status}`);
        } catch (error) {
            console.error(`Poll attempt ${attempt + 1} error:`, error);
            throw error;
        }
    }
    
    throw new Error('Timeout waiting for image generation');
}

/**
 * 构建 AI 提示词
 */
function buildPrompt(mbtiType: string, vibe: string): string {
    const mbtiStyle = MBTI_STYLE_PROMPTS[mbtiType] || MBTI_STYLE_PROMPTS['INFP'];
    const vibeModifier = VIBE_MODIFIERS[vibe] || VIBE_MODIFIERS['dream'];

    return `Draw a hand-drawn sketch style artistic portrait: ${mbtiStyle}.
Style: ${vibeModifier}.
The image should look like a creative doodle with visible sketch lines, artistic imperfections, and a whimsical hand-drawn aesthetic.
Include decorative elements like stars, swirls, or small icons around the figure.
Make it feel personal and unique, like something from an artist's sketchbook.`;
}

/**
 * 获取本地 MBTI 人格图片
 */
export function getLocalMbtiImage(mbtiType: string): GenerateImageResult {
    const localImage = MBTI_LOCAL_IMAGES[mbtiType];
    if (localImage) {
        return {
            success: true,
            imageUrl: localImage,
            isPlaceholder: true,
            isLocalImage: true,
        };
    }
    // 后备：使用默认图片
    return {
        success: true,
        imageUrl: MBTI_LOCAL_IMAGES['INFP'],
        isPlaceholder: true,
        isLocalImage: true,
    };
}

/**
 * 获取占位图（优先使用本地 MBTI 图片）
 */
function getPlaceholderImage(vibe: string, mbtiType?: string): GenerateImageResult {
    // 如果有 MBTI 类型，优先使用本地图片
    if (mbtiType && MBTI_LOCAL_IMAGES[mbtiType]) {
        return getLocalMbtiImage(mbtiType);
    }
    
    // 后备：使用 Unsplash 图片
    const images = PLACEHOLDER_IMAGES[vibe] || PLACEHOLDER_IMAGES['dream'];
    const randomIndex = Math.floor(Math.random() * images.length);
    
    return {
        success: true,
        imageUrl: images[randomIndex],
        isPlaceholder: true,
    };
}

/**
 * 根据 MBTI 和 Vibe 获取随机占位图 URL（快速版本，不调用 AI）
 */
export function getQuickPlaceholderUrl(vibe: string): string {
    const images = PLACEHOLDER_IMAGES[vibe] || PLACEHOLDER_IMAGES['dream'];
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
}
