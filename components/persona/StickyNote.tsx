import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/persona';

export const StickyNote = ({ children, style, color = COLORS.yellow }: any) => (
    <View style={[styles.stickyNote, { backgroundColor: color }, style]}>
        <View style={styles.stickyTape} />
        {children}
    </View>
);

const styles = StyleSheet.create({
    stickyNote: {
        backgroundColor: COLORS.yellow,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.muted,
        transform: [{ rotate: '1deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    stickyTape: {
        position: 'absolute',
        top: -10,
        left: '40%',
        width: 40,
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        transform: [{ rotate: '2deg' }],
    },
});
