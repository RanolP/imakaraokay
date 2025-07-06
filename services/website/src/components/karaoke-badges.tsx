import { Component, For } from 'solid-js';
import type { Song } from '../types/song';
import KaraokeBadge from './karaoke-badge';

export type KaraokeMachine = 'tj' | 'ky' | 'ebo' | 'joysound';

interface KaraokeBadgesProps {
  song: Song;
  size?: 'sm' | 'md' | 'lg';
  showCopyFeedback?: boolean;
  layout?: 'horizontal' | 'vertical';
}

const KaraokeBadges: Component<KaraokeBadgesProps> = (props) => {
  const getAvailableMachines = (): Array<{ machine: KaraokeMachine; id: string }> => {
    const machines: Array<{ machine: KaraokeMachine; id: string }> = [];

    if (props.song.karaoke.tj) {
      machines.push({ machine: 'tj', id: props.song.karaoke.tj });
    }
    if (props.song.karaoke.ky) {
      machines.push({ machine: 'ky', id: props.song.karaoke.ky });
    }
    if (props.song.karaoke.ebo) {
      machines.push({ machine: 'ebo', id: props.song.karaoke.ebo });
    }
    if (props.song.karaoke.joysound) {
      machines.push({ machine: 'joysound', id: props.song.karaoke.joysound });
    }

    return machines;
  };

  const layoutClasses = () => {
    if (props.layout === 'vertical') {
      return 'flex flex-col gap-2';
    }
    return 'flex flex-wrap gap-2';
  };

  const availableMachines = getAvailableMachines();

  if (availableMachines.length === 0) {
    return <div class="text-sm text-gray-500 italic">No karaoke machine IDs available</div>;
  }

  return (
    <div class={layoutClasses()}>
      <For each={availableMachines}>
        {({ machine, id }) => (
          <KaraokeBadge
            machine={machine}
            id={id}
            size={props.size}
            showCopyFeedback={props.showCopyFeedback}
          />
        )}
      </For>
    </div>
  );
};

export default KaraokeBadges;
