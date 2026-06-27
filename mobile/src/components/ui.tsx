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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.scrollContent}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Card({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <View style={[styles.card, accent && styles.cardAccent]}>{children}</View>;
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
  const bg =
    variant === 'primary' ? theme.colors.primary : variant === 'danger' ? theme.colors.red : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.7 : 1, borderWidth: variant === 'ghost' ? 1 : 0 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? theme.colors.primary : '#0B1020'} />
      ) : (
        <Text style={[styles.buttonText, { color: variant === 'ghost' ? theme.colors.text : '#0B1020' }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={theme.colors.muted} style={styles.input} autoCapitalize="none" {...rest} />
    </View>
  );
}

/** Avatar circular cu inițiale, colorat pe baza numelui. */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const palette = [theme.colors.primary, theme.colors.primaryAlt, theme.colors.green, theme.colors.gold];
  const color = palette[name.length % palette.length]!;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + '33',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: color,
      }}
    >
      <Text style={{ color, fontWeight: '800', fontSize: size * 0.4 }}>{initials(name)}</Text>
    </View>
  );
}

/** Mic „chip" colorat pentru etichete. */
export function Chip({ label, color = theme.colors.primary }: { label: string; color?: string }) {
  return (
    <View style={{ backgroundColor: color + '22', borderColor: color + '55', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

/** Bară de progres orizontală (0–100). */
export function ProgressBar({ pct, color = theme.colors.primary }: { pct: number; color?: string }) {
  return (
    <View style={{ height: 10, borderRadius: 999, backgroundColor: theme.colors.cardAlt, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: 10, backgroundColor: color, borderRadius: 999 }} />
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
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { padding: theme.spacing(2), gap: theme.spacing(1.5) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { color: theme.colors.muted, fontSize: 15 },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing(1),
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardAccent: { borderColor: theme.colors.primary + '66' },
  button: {
    borderRadius: theme.radius,
    paddingVertical: 15,
    alignItems: 'center',
    borderColor: theme.colors.border,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  label: { color: theme.colors.muted, fontSize: 13 },
  input: {
    backgroundColor: theme.colors.cardAlt,
    borderRadius: theme.radiusSm,
    padding: 14,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  error: { color: theme.colors.red, fontSize: 14 },
});
