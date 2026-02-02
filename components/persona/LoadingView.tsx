import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants/persona';
import { LOADING_MESSAGES } from '@/constants/mbti-facts';

// 手绘风格的涂鸦 SVG paths（用 View 模拟）
const Doodle = ({ type, style }: { type: 'star' | 'heart' | 'sparkle' | 'circle' | 'swirl'; style?: any }) => {
    const doodleStyles: Record<string, any> = {
        star: {
            width: 20,
            height: 20,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderWidth: 2,
            borderColor: COLORS.accent,
            transform: [{ rotate: '15deg' }],
            borderRadius: 2,
        },
        heart: {
            width: 16,
            height: 16,
            backgroundColor: '#FFB6C1',
            borderRadius: 8,
            transform: [{ rotate: '-45deg' }],
        },
        sparkle: {
            width: 8,
            height: 8,
            backgroundColor: COLORS.yellow,
            borderRadius: 4,
        },
        circle: {
            width: 12,
            height: 12,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: COLORS.secondary,
            borderRadius: 6,
            borderStyle: 'dashed',
        },
        swirl: {
            width: 18,
            height: 18,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: '#98D8AA',
            borderRadius: 9,
            borderTopColor: 'transparent',
        },
    };

    return <View style={[doodleStyles[type], style]} />;
};

// 浮动涂鸦组件
const FloatingDoodle = ({ type, initialX, initialY, delay }: { 
    type: 'star' | 'heart' | 'sparkle' | 'circle' | 'swirl'; 
    initialX: number; 
    initialY: number;
    delay: number;
}) => {
    const floatAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 延迟开始动画
        const timeout = setTimeout(() => {
            // 淡入
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();

            // 上下浮动
            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, {
                        toValue: 1,
                        duration: 2000 + Math.random() * 1000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim, {
                        toValue: 0,
                        duration: 2000 + Math.random() * 1000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // 轻微旋转
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 3000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 3000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, delay);

        return () => clearTimeout(timeout);
    }, []);

    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -15],
    });

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-10deg', '10deg'],
    });

    return (
        <Animated.View
            style={[
                styles.floatingDoodle,
                {
                    left: initialX,
                    top: initialY,
                    opacity: fadeAnim,
                    transform: [{ translateY }, { rotate }],
                },
            ]}
        >
            <Doodle type={type} />
        </Animated.View>
    );
};

// 手绘风格的加载圆环
const HandDrawnSpinner = () => {
    const spinAnim = useRef(new Animated.Value(0)).current;
    const wobbleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 旋转动画
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 晃动动画
        Animated.loop(
            Animated.sequence([
                Animated.timing(wobbleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(wobbleAnim, {
                    toValue: -1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(wobbleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const wobble = wobbleAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-3deg', '0deg', '3deg'],
    });

    return (
        <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: wobble }] }]}>
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
                <View style={styles.spinnerArc} />
                <View style={styles.spinnerDot} />
            </Animated.View>
        </Animated.View>
    );
};

export const LoadingView = () => {
    const [messageIndex, setMessageIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // 文案轮播
    useEffect(() => {
        const interval = setInterval(() => {
            // 淡出
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // 切换文案
                setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
                // 淡入
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    // 涂鸦配置
    const doodles: Array<{ type: 'star' | 'heart' | 'sparkle' | 'circle' | 'swirl'; x: number; y: number; delay: number }> = [
        { type: 'star', x: 50, y: 150, delay: 0 },
        { type: 'heart', x: 300, y: 200, delay: 200 },
        { type: 'sparkle', x: 80, y: 450, delay: 400 },
        { type: 'circle', x: 280, y: 500, delay: 600 },
        { type: 'swirl', x: 320, y: 300, delay: 300 },
        { type: 'sparkle', x: 40, y: 350, delay: 500 },
        { type: 'heart', x: 250, y: 120, delay: 100 },
        { type: 'star', x: 330, y: 420, delay: 700 },
    ];

    return (
        <View style={styles.container}>
            {/* 浮动涂鸦 */}
            {doodles.map((doodle, index) => (
                <FloatingDoodle
                    key={index}
                    type={doodle.type}
                    initialX={doodle.x}
                    initialY={doodle.y}
                    delay={doodle.delay}
                />
            ))}

            {/* 中心内容 */}
            <View style={styles.centerContent}>
                {/* Logo */}
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logo}
                    contentFit="contain"
                />
                <Text style={styles.appName}>人格泡泡</Text>
                
                <HandDrawnSpinner />
                
                <Animated.Text style={[styles.loadingText, { opacity: fadeAnim }]}>
                    {LOADING_MESSAGES[messageIndex]}
                </Animated.Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 8,
    },
    appName: {
        fontFamily: 'Kalam_700Bold',
        fontSize: 24,
        color: COLORS.fg,
        marginBottom: 24,
    },
    floatingDoodle: {
        position: 'absolute',
    },
    spinnerContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerArc: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        borderColor: COLORS.accent + '30',
        borderTopColor: COLORS.accent,
        borderRightColor: COLORS.accent,
        // 手绘效果：不规则边框
        borderTopWidth: 5,
        borderRightWidth: 3,
        borderBottomWidth: 4,
        borderLeftWidth: 3,
    },
    spinnerDot: {
        position: 'absolute',
        top: 0,
        width: 10,
        height: 10,
        backgroundColor: COLORS.accent,
        borderRadius: 5,
    },
    loadingText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: COLORS.fg,
        marginTop: 20,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
