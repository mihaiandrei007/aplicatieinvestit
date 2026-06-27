import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, initials } from '../theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** Etichetă mică, uppercase, tracked. */
export function Label({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function Mono({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.mono, style]}>{children}</Text>;
}

/** Linie subțire de separare. */
export function Hairline({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.hair, { marginHorizontal: inset }]} />;
}

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary
          ? { backgroundColor: theme.colors.lime }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: variant === 'danger' ? theme.colors.red : theme.colors.borderHi },
        { opacity: pressed || disabled ? 0.65 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.limeInk : theme.colors.text} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            { color: isPrimary ? theme.colors.limeInk : variant === 'danger' ? theme.colors.red : theme.colors.text },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <TextInput placeholderTextColor={theme.colors.muted} style={styles.input} autoCapitalize="none" {...rest} />
    </View>
  );
}

/** Pătrat cu simbolul instrumentului (bordură subțire). */
export function SymbolTile({ symbol, accent, size = 36 }: { symbol: string; accent?: boolean; size?: number }) {
  return (
    <View style={[styles.symbol, { width: size, height: size }]}>
      <Text style={{ color: accent ? theme.colors.lime : theme.colors.text, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 }}>
        {symbol}
      </Text>
    </View>
  );
}

/** Monogramă pătrată cu inițiale. */
export function Monogram({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <View style={[styles.symbol, { width: size, height: size }]}>
      <Text style={{ color: theme.colors.lime, fontSize: size * 0.32, fontWeight: '700' }}>{initials(name)}</Text>
    </View>
  );
}

/** Control segmentat (ex. Clasament / Feed, Bullish / Bearish). */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.segItem, on && { backgroundColor: theme.colors.lime }]}>
            <Text style={{ color: on ? theme.colors.limeInk : theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.lime} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { paddingBottom: theme.spacing(2) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  label: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.muted, fontWeight: '700' },
  h1: { color: theme.colors.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  mono: { color: theme.colors.text, fontVariant: ['tabular-nums'] },
  hair: { height: 1, backgroundColor: theme.colors.hair },
  button: { borderRadius: theme.radius, height: 48, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    height: 48,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  symbol: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius, overflow: 'hidden' },
  segItem: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  error: { color: theme.colors.red, fontSize: 14 },
});
