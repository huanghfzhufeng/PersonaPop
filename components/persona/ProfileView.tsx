import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { LogOut, Heart, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../constants/persona';
import { supabase } from '@/lib/supabase';

interface ProfileViewProps {
    onLogout: () => void;
}

export const ProfileView = ({ onLogout }: ProfileViewProps) => {
    const [user, setUser] = useState<any>(null);
    const [personas, setPersonas] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>我的档案</Text>
                <TouchableOpacity onPress={onLogout}>
                    <LogOut size={24} color={COLORS.fg} />
                </TouchableOpacity>
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
                        <View key={item.id} style={styles.collectionItem}>
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
                                    onPress={() => toggleFavorite(item.id, item.is_favorite)}
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
                                    onPress={() => deletePersona(item.id)}
                                    style={styles.actionBtn}
                                >
                                    <Trash2 size={18} color="#999" strokeWidth={2} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
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
        marginBottom: 32,
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
});
