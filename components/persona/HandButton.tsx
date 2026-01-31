import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/persona';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';

export const HandButton = ({ children, onPress, variant = 'primary', style, icon: Icon, fullWidth = false }: any) => {
    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.handButton,
                isPrimary && styles.handButtonPrimary,
                isSecondary && styles.handButtonSecondary,
                fullWidth && styles.fullWidth,
                style
            ]}
        >
            {Icon && <Icon size={24} color={isPrimary ? COLORS.fg : isSecondary ? COLORS.fg : COLORS.fg} strokeWidth={2.5} style={{ marginRight: 8 }} />}
            <Text style={[
                styles.handButtonText,
                isPrimary && { color: COLORS.fg },
                isSecondary && { color: COLORS.fg }
            ]}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    handButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 12,
        backgroundColor: 'white',
        shadowColor: COLORS.fg,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    handButtonPrimary: {
        backgroundColor: 'white',
    },
    handButtonSecondary: {
        backgroundColor: COLORS.muted,
    },
    handButtonText: {
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.fg,
    },
    fullWidth: {
        width: '100%',
    }
});
