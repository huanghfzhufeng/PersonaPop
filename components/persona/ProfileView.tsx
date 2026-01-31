import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LogOut } from 'lucide-react-native';
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
                    <Text style={styles.statNumber}>0</Text>
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
                            <View style={styles.collectionThumbnail} />
                            {/* In real app, would display image from item.image_url */}
                            <View>
                                <Text style={styles.collectionTitle}>{item.mbti_type} {item.vibe}</Text>
                                <Text style={styles.collectionTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
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
    },
    collectionThumbnail: {
        width: 48,
        height: 64,
        backgroundColor: '#ddd',
        borderWidth: 1,
        borderColor: COLORS.fg,
        borderRadius: 4,
        marginRight: 16,
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
});
