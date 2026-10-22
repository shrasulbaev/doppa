import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { Story } from '@/lib/types';
import { storyArtBg, storyArtXml } from './sceneArt';

export function StoryArt({ art, height }: { art: Story['art']; height: number }) {
  return (
    <View style={{ height, backgroundColor: storyArtBg[art] }}>
      <SvgXml xml={storyArtXml(art)} width="100%" height={height} />
    </View>
  );
}
