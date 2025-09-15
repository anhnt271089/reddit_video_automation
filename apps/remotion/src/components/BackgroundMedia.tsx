import React from 'react';
import { Img, Video, staticFile } from 'remotion';
import { AssetData, VideoStyle } from '../types';

interface BackgroundMediaProps {
  asset: AssetData;
  duration: number;
  currentTime: number;
  style: VideoStyle;
}

export const BackgroundMedia: React.FC<BackgroundMediaProps> = ({
  asset,
  duration,
  currentTime,
  style,
}) => {
  const getMediaSrc = (asset: AssetData) => {
    if (asset.localPath) {
      // Use local file if available
      return staticFile(asset.localPath);
    }
    // Fallback to URL (may not work in production due to CORS)
    return asset.url;
  };

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  };

  if (asset.type === 'video') {
    return (
      <Video
        src={getMediaSrc(asset)}
        style={mediaStyle}
        muted
        loop
        // Start from beginning and play for scene duration
        startFrom={0}
        endAt={Math.floor(duration * 30)} // Assuming 30fps for background video
      />
    );
  }

  if (asset.type === 'image') {
    // For images, we can apply subtle animations based on style
    const getImageTransform = () => {
      const progress = Math.min(1, currentTime / duration);

      switch (style) {
        case 'motivational': {
          // Subtle zoom in effect
          const scale = 1 + progress * 0.1;
          return `scale(${scale})`;
        }

        case 'contemplative': {
          // Slow pan effect
          const translateX = progress * -20;
          return `translateX(${translateX}px)`;
        }

        case 'urgent': {
          // Slight shake/vibration effect
          const intensity = Math.sin(currentTime * 10) * 2;
          return `translateX(${intensity}px)`;
        }

        default:
          return 'none';
      }
    };

    return (
      <Img
        src={getMediaSrc(asset)}
        style={{
          ...mediaStyle,
          transform: getImageTransform(),
          transition: 'transform 0.1s ease-out',
        }}
      />
    );
  }

  return null;
};
