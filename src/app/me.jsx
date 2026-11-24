// Me tab: review local progress and choose what to share from a preview.
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Pressable, Share } from 'react-native';
import { Screen, BodyText, ActionButton, ErrorMessage, Loading } from '../components/AppUI';
import { getShareProgress } from '../services/progress';
import { useSettings } from '../context/SettingsContext';

const parts = [
  ['streak', 'Days used in a row'], ['textsRead', 'Texts read'],
  ['wordsSaved', 'Words saved'], ['quizScores', 'Last quiz scores'],
  ['commonErrors', 'Common spelling error types'],
];

function scoreText(score) {
  if (typeof score === 'number' || typeof score === 'string') return `${score}%`;
  return `${score.score ?? score.correct ?? 0}${score.total ? ` of ${score.total}` : '%'}`;
}

export default function MeScreen() {
  const { colors } = useSettings();
  const [progress, setProgress] = useState(null);
  const [selected, setSelected] = useState(Object.fromEntries(parts.map(([key]) => [key, true])));
  const [error, setError] = useState('');
  useEffect(() => { getShareProgress().then(setProgress).catch(() => setError('I could not read your saved progress on this device.')); }, []);

  const rows = useMemo(() => {
    if (!progress) return [];
    return [
      ['streak', `${progress.streak} ${progress.streak === 1 ? 'day' : 'days'} in a row`],
      ['textsRead', `${progress.textsRead} texts read`],
      ['wordsSaved', `${progress.wordsSaved} words saved`],
      ['quizScores', progress.quizScores.length ? progress.quizScores.map(scoreText).join(', ') : 'No quiz scores saved yet'],
      ['commonErrors', progress.commonErrors.length ? progress.commonErrors.map(([name, count]) => `${name} (${count})`).join(', ') : 'No spelling patterns recorded yet'],
    ];
  }, [progress]);

  const shareText = () => {
    if (!progress) return '';
    const content = rows.filter(([key]) => selected[key]).map(([, value]) => `• ${value}`);
    return content.length ? `My learning progress\n${content.join('\n')}` : '';
  };
  const share = async () => {
    const message = shareText();
    if (!message) return;
    try { await Share.share({ message, title: 'My progress' }, { dialogTitle: 'Share my progress' }); }
    catch { setError('The share sheet could not be opened. Please try again.'); }
  };

  return <Screen title="Me"><ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
    <BodyText style={{ marginBottom: 14 }}>Your progress stays on this device until you choose to share it.</BodyText>
    <BodyText style={{ fontSize: 24, marginBottom: 8 }}>Share my progress</BodyText>
    <BodyText style={{ marginBottom: 12 }}>Choose what you would like to include.</BodyText>
    {!progress && !error ? <Loading /> : null}
    {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    {rows.map(([key, value]) => <Pressable key={key} accessibilityRole="checkbox" accessibilityState={{ checked: selected[key] }} accessibilityLabel={`Include ${parts.find(([name]) => name === key)?.[1]}`} onPress={() => setSelected((old) => ({ ...old, [key]: !old[key] }))} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}><View style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: colors.accent, backgroundColor: selected[key] ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><BodyText style={{ color: colors.background, fontSize: 18 }}>{selected[key] ? '✓' : ''}</BodyText></View><View style={{ flex: 1 }}><BodyText>{parts.find(([name]) => name === key)?.[1]}</BodyText><BodyText style={{ fontSize: 18 }}>{value}</BodyText></View></Pressable>)}
    {progress ? <View style={{ padding: 14, marginTop: 12, backgroundColor: colors.card, borderRadius: 16 }}><BodyText style={{ fontSize: 22, marginBottom: 6 }}>Preview</BodyText><BodyText>{shareText() || 'Choose at least one item to make your progress summary.'}</BodyText></View> : null}
    <ActionButton label="↗ Share my progress" onPress={share} disabled={!progress || !Object.values(selected).some(Boolean)} />
    <BodyText style={{ textAlign: 'center', marginTop: 8 }}>You decide what to share and who sees it.</BodyText>
  </ScrollView></Screen>;
}
