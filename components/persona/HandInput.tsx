import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/persona';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';

export const HandInput = ({ placeholder, icon: Icon, value, onChangeText, secureTextEntry }: any) => {
    return (
        <View style={styles.container}>
            {/* Shadow */}
            <View style={styles.shadow} />

            {/* Input Frame */}
            <View style={styles.inputFrame}>
                {Icon && <Icon size={20} color="#666" strokeWidth={2.5} style={{ marginRight: 12 }} />}
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    style={styles.input}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    shadow: {
        position: 'absolute',
        top: 3,
        left: 3,
        width: '100%',
        height: 50,
        backgroundColor: COLORS.fg,
        borderRadius: 8,
        opacity: 0.2,
    },
    inputFrame: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white', // Should be dynamic for dark mode later
        borderWidth: 3,
        borderColor: COLORS.fg,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
    },
    input: {
        flex: 1,
        fontFamily: 'PatrickHand_400Regular',
        fontSize: 18,
        color: COLORS.fg,
    },
});
