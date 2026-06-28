import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { IconPortfolio, IconMarket, IconNews, IconGroups, IconTrophy, Caret } from '../src/components/icons';
import { useAuth } from '../src/auth/AuthContext';
import { theme } from '../src/theme';

const c = theme.colors;

type Slide = { icon: (color: string) => React.ReactNode; title: string; body: string };

const SLIDES: Slide[] = [
  {
    icon: (col) => <IconTrophy color={col} size={46} />,
    title: 'Welcome to Tickr',
    body: 'Play the market with fake money and see who is actually any good. No real cash, no real risk.',
  },
  {
    icon: (col) => <IconPortfolio color={col} size={46} />,
    title: 'Your money',
    body: 'You get 10,000 to start. Grow it however you want. The Portfolio tab shows what you are worth and how you are doing.',
  },
  {
    icon: (col) => <IconMarket color={col} size={46} />,
    title: 'Buy and sell',
    body: 'Tap a stock in Market to buy or sell. Everyone trades the same live market, so when people pile into a stock, it climbs.',
  },
  {
    icon: (col) => <IconNews color={col} size={46} />,
    title: 'Watch the news',
    body: 'Headlines drop in the News tab. They never tell you up or down, so you have to read them and make the call.',
  },
  {
    icon: (col) => <Caret up color={col} size={40} />,
    title: 'Call it',
    body: 'Think a stock is about to pop or drop? Bet UP or DOWN. Get it right and your stake multiplies.',
  },
  {
    icon: (col) => <IconGroups color={col} size={46} />,
    title: 'Bring your friends',
    body: 'Start a group, share the code, and fight for the top of the leaderboard. Check in daily to keep your streak.',
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const review = useLocalSearchParams().review === '1';
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  }

  async function finish() {
    await completeOnboarding();
    if (review) router.back();
    else router.replace(user ? '/(tabs)/portfolio' : '/(auth)/login');
  }

  function next() {
    if (last) finish();
    else scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* top bar: wordmark + skip */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, backgroundColor: c.lime, borderRadius: 1 }} />
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.5 }}>Tickr</Text>
        </View>
        <Pressable onPress={finish} hitSlop={10}>
          <Text style={{ color: c.muted2, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
            {review ? 'CLOSE' : 'SKIP'}
          </Text>
        </Pressable>
      </View>

      {/* slides */}
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={{ width, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 100, height: 100, borderRadius: 16, borderWidth: 1, borderColor: c.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
              {s.icon(c.lime)}
            </View>
            <Text style={{ color: c.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', marginBottom: 14 }}>
              {s.title}
            </Text>
            <Text style={{ color: c.muted2, fontSize: 15, lineHeight: 23, textAlign: 'center' }}>
              {s.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, paddingBottom: 20 }}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 22 : 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: i === index ? c.lime : c.border,
            }}
          />
        ))}
      </View>

      {/* action */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Button title={last ? (review ? 'DONE' : 'GET STARTED') : 'NEXT'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}
