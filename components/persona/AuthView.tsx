import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { User, Mail, Lock, Sparkles } from 'lucide-react-native';
import { COLORS } from '../../constants/persona';
import { HandInput } from './HandInput';
import { HandButton } from './HandButton';
import { supabase } from '../../lib/supabase';

// Type definition for props
interface AuthViewProps {
    onLogin: () => void;
}

export const AuthView = ({ onLogin }: AuthViewProps) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('提示', '请输入邮箱和密码');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });
                if (error) throw error;
                // session listener will handle the rest
            } else {
                const { error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            name: name || email.split('@')[0],
                        }
                    }
                });
                if (error) throw error;
                Alert.alert('注册成功', '请检查邮箱验证或直接登录');
                setIsLogin(true); // Switch to login after signup
            }
        } catch (error: any) {
            Alert.alert('错误', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Decorative Tape */}
                <View style={styles.tape} />

                {/* Main Form Card */}
                <View style={styles.card}>
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <View style={styles.iconCircle}>
                            <User size={32} color={COLORS.fg} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.title}>
                            {isLogin ? '欢迎回来!' : '加入我们!'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? '准备好今天的灵感了吗?' : '开始你的手绘人格之旅'}
                        </Text>
                    </View>

                    <View style={{ gap: 8 }}>
                        {!isLogin && (
                            <HandInput
                                icon={User}
                                placeholder="你的名字"
                                value={name}
                                onChangeText={setName}
                            />
                        )}
                        <HandInput
                            icon={Mail}
                            placeholder="电子邮箱"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <HandInput
                            icon={Lock}
                            placeholder="密码"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <HandButton
                            fullWidth
                            variant="primary"
                            style={{ marginTop: 16 }}
                            onPress={handleAuth}
                        >
                            {loading ? '处理中...' : (isLogin ? '登录' : '立即注册')}
                        </HandButton>
                    </View>

                    <View style={{ marginTop: 24, alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.switchText}>
                                {isLogin ? '还没有账号？去注册 →' : '已有账号？去登录 →'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Decorative elements underneath */}
                <Sparkles size={40} color={COLORS.accent} style={styles.sparkle} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    content: {
        position: 'relative',
        maxWidth: 400, // Limit width on tablets
        width: '100%',
        alignSelf: 'center',
    },
    tape: {
        position: 'absolute',
        top: -16,
        left: '30%',
        width: 120,
        height: 32,
        backgroundColor: 'rgba(229, 224, 216, 0.8)',
        transform: [{ rotate: '-2deg' }],
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        zIndex: 20,
    },
    card: {
        backgroundColor: 'white',
        borderWidth: 4,
        borderColor: COLORS.fg,
        padding: 24,
        borderRadius: 15, // Wobbly simulation
        transform: [{ rotate: '1deg' }],
        shadowColor: COLORS.fg,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        zIndex: 10,
    },
    iconCircle: {
        padding: 12,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.fg,
        backgroundColor: COLORS.yellow,
        marginBottom: 16,
    },
    title: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 32,
        color: COLORS.fg,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: '#666',
    },
    switchText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 16,
        color: '#666',
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted',
    },
    sparkle: {
        position: 'absolute',
        bottom: -30,
        right: -20,
        transform: [{ rotate: '15deg' }],
        opacity: 0.8,
    },
});
