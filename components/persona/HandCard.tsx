import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/persona';

export const HandCard = ({ children, style, onPress, active }: any) => {
    return (
        <Pressable onPress={onPress} style={[styles.handCardWrapper, style]}>
            {/* Shadow */}
            <View style={[
                styles.handCardShadow,
                active && { top: 2, left: 2 }
            ]} />
            {/* Card Content */}
            <View style={[
                styles.handCard,
                active && styles.handCardActive,
                active && { transform: [{ translateX: 2 }, { translateY: 2 }, { rotate: '-1deg' }] }
            ]}>
                {active && (
                    <View style={styles.activeDot} />
                )}
                {children}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    handCardWrapper: {
        position: 'relative',
    },
    handCardShadow: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: -4,
        bottom: -4,
        backgroundColor: COLORS.fg,
        borderRadius: 12,
    },
    handCard: {
        height: '100%',
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: COLORS.fg,
        padding: 12,
        borderRadius: 12,
    },
    handCardActive: {
        backgroundColor: COLORS.yellow,
        borderColor: COLORS.fg,
    },
    activeDot: {
        position: 'absolute',
        top: -6,
        left: '50%',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.accent,
        borderWidth: 2,
        borderColor: COLORS.fg,
        zIndex: 10,
    },
});
