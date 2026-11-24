// Reusable flashcards with a flip action and a missed-card retry list.
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, BodyText } from './AppUI';
import { useSettings } from '../context/SettingsContext';

export default function FlashcardDeck({ cards }) {
  const { colors } = useSettings();
  const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [missed, setMissed] = useState([]); const [onlyMissed, setOnlyMissed] = useState(false); const [done, setDone] = useState(false); const [retryDeck, setRetryDeck] = useState([]);
  const activeCards = useMemo(() => onlyMissed ? retryDeck : cards, [cards, onlyMissed, retryDeck]);
  const card = activeCards[index];
  const markCard = (gotIt) => {
    const cardIndex = cards.indexOf(card);
    if (gotIt) setMissed((old) => old.filter((item) => item !== cardIndex));
    else setMissed((old) => old.includes(cardIndex) ? old : [...old, cardIndex]);
    if (index + 1 >= activeCards.length) setDone(true);
    else { setIndex(index + 1); setFlipped(false); }
  };
  const toggleMissed = () => {
    if (!onlyMissed) {
      setRetryDeck(cards.filter((_, cardIndex) => missed.includes(cardIndex)));
      setIndex(0); setDone(false); setFlipped(false); setOnlyMissed(true);
    } else { setOnlyMissed(false); setIndex(0); setDone(false); setFlipped(false); }
  };
  if (!cards.length) return null;
  return <View style={{ marginTop: 18 }}>
    <BodyText style={{ fontSize: 24 }}>Flashcards</BodyText>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: onlyMissed }} accessibilityLabel="Practise only the ones I missed" disabled={!missed.length} onPress={toggleMissed} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', opacity: missed.length ? 1 : 0.55 }}><View style={{ width: 26, height: 26, borderWidth: 2, borderColor: colors.accent, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>{onlyMissed ? <Ionicons name="checkmark" size={20} color={colors.accent} /> : null}</View><BodyText>Practise only the ones I missed</BodyText></Pressable>
    {done ? <View><BodyText>{onlyMissed ? 'You have practised the missed cards.' : 'You have seen every card.'}</BodyText><ActionButton label="Start cards again" icon="refresh-outline" secondary onPress={() => { setDone(false); setIndex(0); setFlipped(false); }} /></View> : card ? <>
      <BodyText style={{ marginBottom: 8 }}>{index + 1} of {activeCards.length}</BodyText>
      <Pressable accessibilityRole="button" accessibilityLabel={flipped ? 'Show flashcard question' : 'Show flashcard answer'} onPress={() => setFlipped(!flipped)} style={{ minHeight: 150, justifyContent: 'center', padding: 18, borderRadius: 16, backgroundColor: colors.card }}><BodyText style={{ textAlign: 'center' }}>{flipped ? card.back : card.front}</BodyText><BodyText style={{ textAlign: 'center', marginTop: 8 }}>{flipped ? 'Answer' : 'Tap to flip'}</BodyText></Pressable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}><ActionButton label="Got it" icon="checkmark-circle-outline" onPress={() => markCard(true)} /><ActionButton label="Again" icon="refresh-outline" secondary onPress={() => markCard(false)} /></View>
    </> : <BodyText>There are no missed cards yet. Mark a card Again to practise it.</BodyText>}
  </View>;
}
