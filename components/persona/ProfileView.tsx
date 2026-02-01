import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { LogOut, Heart, Trash2, X, Download, Share2, Copy, ChevronLeft, ChevronRight, Settings as SettingsIcon } from 'lucide-react-native';
import { Image } from 'expo-image';

// Mascot images
const mascotSettings = require('../../assets/images/mascot-settings.png');
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../../constants/persona';
import { supabase } from '@/lib/supabase';
import { shareImage, saveImageToGallery, getShareableText } from '@/lib/share-utils';
import { SettingsView } from './SettingsView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfileViewProps {
    onLogout: () => void;
}

export const ProfileView = ({ onLogout }: ProfileViewProps) => {
    const [user, setUser] = useState<any>(null);
    const [personas, setPersonas] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState<any>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            const { data, error } = await supabase
                .from('personas')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setPersonas(data);
            }
        }
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // 切换收藏状态
    const toggleFavorite = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('personas')
            .update({ is_favorite: !currentStatus })
            .eq('id', id);

        if (!error) {
            setPersonas(prev =>
                prev.map(p => p.id === id ? { ...p, is_favorite: !currentStatus } : p)
            );
        }
    };

    // 删除记录
    const deletePersona = async (id: string) => {
        Alert.alert(
            '确认删除',
            '确定要删除这条记录吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('personas')
                            .delete()
                            .eq('id', id);

                        if (!error) {
                            setPersonas(prev => prev.filter(p => p.id !== id));
                        }
                    }
                }
            ]
        );
    };

    // 计算收藏数量
    const favoriteCount = personas.filter(p => p.is_favorite).length;

    const latestPersona = personas.length > 0 ? personas[0] : null;

    // 打开详情弹窗
    const openDetail = (persona: any, index: number) => {
        setSelectedPersona(persona);
        setSelectedIndex(index);
        setModalVisible(true);
    };

    // 上一张/下一张
    const goToPrev = () => {
        if (selectedIndex > 0) {
            const newIndex = selectedIndex - 1;
            setSelectedIndex(newIndex);
            setSelectedPersona(personas[newIndex]);
        }
    };

    const goToNext = () => {
        if (selectedIndex < personas.length - 1) {
            const newIndex = selectedIndex + 1;
            setSelectedIndex(newIndex);
            setSelectedPersona(personas[newIndex]);
        }
    };

    // 保存图片
    const handleSave = async () => {
        if (selectedPersona?.image_url && !isSaving) {
            setIsSaving(true);
            try {
                await saveImageToGallery(selectedPersona.image_url);
            } finally {
                setIsSaving(false);
            }
        }
    };

    // 分享图片
    const handleShare = async () => {
        if (selectedPersona?.image_url && !isSharing) {
            setIsSharing(true);
            try {
                await shareImage(selectedPersona.image_url, `我的 ${selectedPersona.mbti_type} 人格卡片`);
            } finally {
                setIsSharing(false);
            }
        }
    };

    // 复制文案
    const handleCopyText = async () => {
        if (selectedPersona) {
            const text = getShareableText(
                selectedPersona.mbti_type,
                selectedPersona.vibe,
                selectedPersona.result_text || ''
            );
            await Clipboard.setStringAsync(text);
            Alert.alert('已复制', '文案已复制到剪贴板 📋');
        }
    };

    // 在弹窗中切换收藏
    const toggleFavoriteInModal = async () => {
        if (selectedPersona) {
            await toggleFavorite(selectedPersona.id, selectedPersona.is_favorite);
            setSelectedPersona({ ...selectedPersona, is_favorite: !selectedPersona.is_favorite });
        }
    };

    // 如果显示设置页面
    if (showSettings) {
        return <SettingsView onBack={() => setShowSettings(false)} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>我的档案</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={{ marginRight: 16 }}>
                        <SettingsIcon size={24} color={COLORS.fg} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onLogout}>
                        <LogOut size={24} color={COLORS.fg} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Mascot Character */}
            <View style={styles.mascotContainer}>
                <Image
                    source={mascotSettings}
                    style={styles.mascot}
                    contentFit="contain"
                />
            </View>

            {/* User Card */}
            <View style={styles.userCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.email?.[0].toUpperCase() || 'U'}</Text>
                </View>
                <View>
                    <Text style={styles.userName}>{user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</Text>
                    {latestPersona && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{latestPersona.mbti_type}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{personas.length}</Text>
                    <Text style={styles.statLabel}>已生成</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{favoriteCount}</Text>
                    <Text style={styles.statLabel}>收藏夹</Text>
                </View>
            </View>

            {/* Saved Collection */}
            <Text style={styles.sectionTitle}>历史记录</Text>
            <ScrollView
                style={{ marginTop: 12 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {personas.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#888', marginTop: 20, fontFamily: 'PatrickHand_400Regular' }}>
                        还没有作品哦，快去创作吧！
                    </Text>
                ) : (
                    personas.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.collectionItem}
                            onPress={() => openDetail(item, personas.indexOf(item))}
                            activeOpacity={0.7}
                        >
                            {/* 显示实际图片 */}
                            {item.image_url ? (
                                <Image
                                    source={{ uri: item.image_url }}
                                    style={styles.collectionThumbnail}
                                    contentFit="cover"
                                    transition={200}
                                />
                            ) : (
                                <View style={[styles.collectionThumbnail, { backgroundColor: '#ddd' }]} />
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.collectionTitle}>{item.mbti_type} · {item.vibe}</Text>
                                <Text style={styles.collectionTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                {item.result_text && (
                                    <Text style={styles.collectionText} numberOfLines={1}>
                                        "{item.result_text}"
                                    </Text>
                                )}
                            </View>
                            {/* 操作按钮 */}
                            <View style={styles.itemActions}>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(item.id, item.is_favorite);
                                    }}
                                    style={styles.actionBtn}
                                >
                                    <Heart
                                        size={20}
                                        color={item.is_favorite ? COLORS.accent : '#999'}
                                        fill={item.is_favorite ? COLORS.accent : 'transparent'}
                                        strokeWidth={2}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        deletePersona(item.id);
                                    }}
                                    style={styles.actionBtn}
                                >
                                    <Trash2 size={18} color="#999" strokeWidth={2} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* 详情弹窗 */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* 顶部操作栏 */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                style={styles.modalHeaderBtn}
                                onPress={() => setModalVisible(false)}
                            >
                                <X size={24} color={COLORS.fg} strokeWidth={3} />
                            </TouchableOpacity>
                            <Text style={styles.modalHeaderTitle}>
                                {selectedIndex + 1} / {personas.length}
                            </Text>
                            <TouchableOpacity
                                style={styles.modalHeaderBtn}
                                onPress={toggleFavoriteInModal}
                            >
                                <Heart
                                    size={24}
                                    color={selectedPersona?.is_favorite ? COLORS.accent : COLORS.fg}
                                    fill={selectedPersona?.is_favorite ? COLORS.accent : 'transparent'}
                                    strokeWidth={2.5}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* 图片和导航 */}
                        <View style={styles.imageContainer}>
                            {/* 上一张按钮 */}
                            {selectedIndex > 0 && (
                                <TouchableOpacity style={styles.navBtnLeft} onPress={goToPrev}>
                                    <ChevronLeft size={32} color="white" strokeWidth={3} />
                                </TouchableOpacity>
                            )}
                            
                            {/* 图片 */}
                            {selectedPersona?.image_url && (
                                <Image
                                    source={{ uri: selectedPersona.image_url }}
                                    style={styles.modalImage}
                                    contentFit="contain"
                                    transition={200}
                                />
                            )}
                            
                            {/* 下一张按钮 */}
                            {selectedIndex < personas.length - 1 && (
                                <TouchableOpacity style={styles.navBtnRight} onPress={goToNext}>
                                    <ChevronRight size={32} color="white" strokeWidth={3} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 信息 */}
                        <View style={styles.modalInfo}>
                            <Text style={styles.modalTitle}>
                                {selectedPersona?.mbti_type} · {selectedPersona?.vibe}
                            </Text>
                            {selectedPersona?.result_text && (
                                <TouchableOpacity onPress={handleCopyText} activeOpacity={0.7}>
                                    <Text style={styles.modalText}>
                                        "{selectedPersona.result_text}"
                                    </Text>
                                    <Text style={styles.copyHint}>点击复制文案</Text>
                                </TouchableOpacity>
                            )}
                            <Text style={styles.modalDate}>
                                {selectedPersona && new Date(selectedPersona.created_at).toLocaleDateString()}
                            </Text>
                        </View>

                        {/* 操作按钮 */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, isSharing && styles.modalBtnDisabled]} 
                                onPress={handleShare}
                                disabled={isSharing}
                            >
                                {isSharing ? (
                                    <ActivityIndicator size="small" color={COLORS.fg} />
                                ) : (
                                    <Share2 size={20} color={COLORS.fg} strokeWidth={2.5} />
                                )}
                                <Text style={styles.modalBtnText}>分享</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnPrimary, isSaving && styles.modalBtnDisabled]} 
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Download size={20} color="white" strokeWidth={2.5} />
                                )}
                                <Text style={[styles.modalBtnText, { color: 'white' }]}>保存</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mascotContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    mascot: {
        width: SCREEN_WIDTH * 0.4,
        height: SCREEN_WIDTH * 0.4,
    },
    headerTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 32,
        color: COLORS.fg,
        transform: [{ rotate: '-1deg' }],
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: COLORS.fg,
        padding: 24,
        borderRadius: 15,
        marginBottom: 32,
        shadowColor: COLORS.fg,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.yellow,
        borderWidth: 3,
        borderColor: COLORS.fg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 28,
        color: COLORS.fg,
    },
    userName: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 28,
        color: COLORS.fg,
        marginBottom: 4,
    },
    badge: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: COLORS.fg,
        transform: [{ rotate: '-2deg' }],
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontFamily: 'PatrickHand_400Regular',
        color: 'white',
        fontSize: 14,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderWidth: 2,
        borderColor: COLORS.fg,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 32,
        color: COLORS.fg,
    },
    statLabel: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#666',
    },
    sectionTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 24,
        color: COLORS.fg,
    },
    collectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 2,
        borderColor: COLORS.fg,
        borderStyle: 'dashed',
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: 'white',
    },
    collectionThumbnail: {
        width: 56,
        height: 56,
        borderWidth: 2,
        borderColor: COLORS.fg,
        borderRadius: 8,
        marginRight: 12,
    },
    collectionTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 18,
        color: COLORS.fg,
    },
    collectionTime: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#666',
    },
    collectionText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.fg,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalHeaderBtn: {
        padding: 4,
    },
    modalHeaderTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 18,
        color: COLORS.fg,
    },
    imageContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navBtnLeft: {
        position: 'absolute',
        left: 4,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 4,
    },
    navBtnRight: {
        position: 'absolute',
        right: 4,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 4,
    },
    modalImage: {
        width: '100%',
        height: SCREEN_WIDTH * 0.75,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.fg,
    },
    modalInfo: {
        marginTop: 16,
        alignItems: 'center',
    },
    modalTitle: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 24,
        color: COLORS.fg,
    },
    modalText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    modalDate: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.fg,
        backgroundColor: 'white',
    },
    modalBtnPrimary: {
        backgroundColor: COLORS.fg,
    },
    modalBtnDisabled: {
        opacity: 0.6,
    },
    modalBtnText: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 16,
        color: COLORS.fg,
    },
    copyHint: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 12,
        color: COLORS.accent,
        textAlign: 'center',
        marginTop: 4,
    },
});
