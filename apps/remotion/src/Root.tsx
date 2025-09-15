import { Composition } from 'remotion';
import { RedditVideoComposition } from './compositions/RedditVideoComposition';
import { VideoComposition } from './types';

// Default composition for development/preview
const defaultComposition: VideoComposition = {
  id: 'default',
  title: 'Default Reddit Video',
  description: 'A sample Reddit video composition',
  scenes: [],
  style: 'motivational',
  dimensions: { width: 1080, height: 1920 },
  fps: 30,
  duration: 60,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RedditVideo"
        component={RedditVideoComposition}
        durationInFrames={defaultComposition.duration * defaultComposition.fps}
        fps={defaultComposition.fps}
        width={defaultComposition.dimensions.width}
        height={defaultComposition.dimensions.height}
        defaultProps={{
          composition: defaultComposition,
        }}
      />
    </>
  );
};
