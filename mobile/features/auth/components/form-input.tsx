import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Control, Controller, FieldError } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface FormInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  name: string;
  control: Control<any>;
  icon: keyof typeof MaterialIcons.glyphMap;
  error?: FieldError;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  control,
  icon,
  error,
  rightIcon,
  onRightIconPress,
  ...textInputProps
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        <MaterialIcons name={icon} size={20} color={error ? "#e53e3e" : "#777"} />
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholderTextColor={error ? "#e53e3e" : "#999"}
              {...textInputProps}
            />
          )}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconContainer}>
            <MaterialIcons name={rightIcon} size={20} color={error ? "#e53e3e" : "#777"} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: '#ddd',
    paddingVertical: 12,
  },
  inputWrapperError: {
    borderColor: '#e53e3e',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    color: '#e53e3e',
  },
  rightIconContainer: {
    padding: 4,
  },
  errorContainer: {
    paddingHorizontal: 4,
    marginTop: 6,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 28,
  },
}); 