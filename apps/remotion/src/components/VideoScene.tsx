import React from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { SceneWithAssets, VideoStyle } from '../types';
import { BackgroundMedia } from './BackgroundMedia';
import { AnimatedText } from './AnimatedText';
import { getStyleConfig } from '../utils/StyleConfig';

interface VideoSceneProps {
  scene: SceneWithAssets;
  style: VideoStyle;
  currentTime: number;
}

export const VideoScene: React.FC<VideoSceneProps> = ({
  scene,
  style,
  currentTime,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const styleConfig = getStyleConfig(style);
  const sceneProgress = Math.max(0, Math.min(1, currentTime / scene.duration));

  // Select primary background asset
  const backgroundAsset = scene.assets.find(
    asset => asset.type === 'video' || asset.type === 'image'
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: styleConfig.backgroundColor,
      }}
    >
      {/* Background Media */}
      {backgroundAsset && (
        <BackgroundMedia
          asset={backgroundAsset}
          duration={scene.duration}
          currentTime={currentTime}
          style={style}
        />
      )}

      {/* Overlay gradient for text readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: styleConfig.overlay,
          zIndex: 1,
        }}
      />

      {/* Animated Text */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          padding: '40px 60px',
        }}
      >
        <AnimatedText
          text={scene.narration}
          animationProps={scene.textAnimation}
          currentTime={currentTime}
          duration={scene.duration}
          style={style}
        />
      </div>

      {/* Scene indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: '#333',
            zIndex: 10,
          }}
        >
          Scene {scene.id} | Progress: {Math.round(sceneProgress * 100)}%
        </div>
      )}
    </div>
  );
};
