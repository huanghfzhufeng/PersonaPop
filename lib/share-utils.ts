/**
 * 分享和下载工具函数
 */
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

export interface ShareResult {
    success: boolean;
    error?: string;
}

/**
 * 下载图片到本地缓存
 * @param imageUrl 图片 URL
 * @param filename 文件名
 * @returns 本地文件路径
 */
async function downloadImageToCache(imageUrl: string, filename: string): Promise<string> {
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
    
    if (downloadResult.status !== 200) {
        throw new Error('Failed to download image');
    }
    
    return downloadResult.uri;
}

/**
 * 分享图片到社交平台
 * @param imageUrl 图片 URL
 * @param title 分享标题
 */
export async function shareImage(imageUrl: string, title?: string): Promise<ShareResult> {
    try {
        // 检查是否支持分享
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert('提示', '当前设备不支持分享功能');
            return { success: false, error: 'Sharing not available' };
        }

        // 下载图片到缓存
        const filename = `persona_${Date.now()}.jpg`;
        const localUri = await downloadImageToCache(imageUrl, filename);

        // 分享
        await Sharing.shareAsync(localUri, {
            mimeType: 'image/jpeg',
            dialogTitle: title || '分享我的 PersonaPop',
            UTI: 'public.jpeg',
        });

        return { success: true };
    } catch (error: any) {
        console.error('Share failed:', error);
        Alert.alert('分享失败', error.message || '请稍后重试');
        return { success: false, error: error.message };
    }
}

/**
 * 保存图片到相册
 * @param imageUrl 图片 URL
 */
export async function saveImageToGallery(imageUrl: string): Promise<ShareResult> {
    try {
        // 请求权限
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('权限不足', '需要相册访问权限才能保存图片');
            return { success: false, error: 'Permission denied' };
        }

        // 下载图片到缓存
        const filename = `persona_${Date.now()}.jpg`;
        const localUri = await downloadImageToCache(imageUrl, filename);

        // 保存到相册
        const asset = await MediaLibrary.createAssetAsync(localUri);
        
        // 可选：创建专属相册
        const albumName = 'PersonaPop';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (album === null) {
            await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert('保存成功', '图片已保存到相册 📸');
        return { success: true };
    } catch (error: any) {
        console.error('Save failed:', error);
        Alert.alert('保存失败', error.message || '请稍后重试');
        return { success: false, error: error.message };
    }
}

/**
 * 分享文本内容（用于分享人格描述）
 * @param text 文本内容
 * @param mbtiType MBTI 类型
 */
export async function shareText(text: string, mbtiType: string): Promise<ShareResult> {
    try {
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (!isAvailable) {
            // Web 平台或不支持分享的平台，尝试使用 clipboard
            Alert.alert('提示', '当前设备不支持分享功能');
            return { success: false, error: 'Sharing not available' };
        }

        // 创建文本文件来分享
        const filename = `persona_${mbtiType}_${Date.now()}.txt`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        
        const content = `🎨 我的 PersonaPop 人格卡片\n\n` +
            `类型：${mbtiType}\n\n` +
            `"${text}"\n\n` +
            `--- 由 PersonaPop 生成 ---`;
        
        await FileSystem.writeAsStringAsync(fileUri, content);
        
        await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: '分享我的人格描述',
        });

        return { success: true };
    } catch (error: any) {
        console.error('Share text failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 复制文本到剪贴板（备用方案）
 * 注意：需要额外安装 expo-clipboard
 */
export function getShareableText(mbtiType: string, vibe: string, text: string): string {
    return `🎨 我的 PersonaPop 人格卡片\n\n` +
        `类型：${mbtiType}\n` +
        `心情：${vibe}\n\n` +
        `"${text}"\n\n` +
        `--- 由 PersonaPop 生成 ---`;
}
