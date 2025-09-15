import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { VideoComposition } from '../types';
import { VideoScene } from '../components/VideoScene';
import { AssetLoader } from '../utils/AssetLoader';

interface RedditVideoCompositionProps {
  composition: VideoComposition;
}

export const RedditVideoComposition: React.FC<RedditVideoCompositionProps> = ({
  composition,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTime = frame / fps;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        position: 'relative',
      }}
    >
      {composition.scenes.map((scene, index) => {
        const startFrame = Math.floor(scene.startTime * fps);
        const durationFrames = Math.floor(scene.duration * fps);

        return (
          <Sequence
            key={scene.id}
            name={`Scene-${scene.id}`}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <VideoScene
              scene={scene}
              style={composition.style}
              currentTime={currentTime - scene.startTime}
            />
          </Sequence>
        );
      })}

      {/* Global overlays can go here */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Progress indicator, watermarks, etc. */}
      </div>
    </div>
  );
};
