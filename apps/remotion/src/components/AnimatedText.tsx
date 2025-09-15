import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { TextAnimationProps, VideoStyle } from '../types';
import { getStyleConfig } from '../utils/StyleConfig';

interface AnimatedTextProps {
  text: string;
  animationProps: TextAnimationProps;
  currentTime: number;
  duration: number;
  style: VideoStyle;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  animationProps,
  currentTime,
  duration,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const styleConfig = getStyleConfig(style);
  const { timing } = animationProps;

  // Calculate animation phases
  const fadeInStart = timing.fadeInStart;
  const fadeInEnd = fadeInStart + timing.fadeInDuration;
  const fadeOutStart = timing.fadeOutStart;
  const fadeOutEnd = fadeOutStart + timing.fadeOutDuration;

  // Opacity animation
  const opacity = interpolate(
    currentTime,
    [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Position and scale animations based on type
  const getAnimationStyle = (): React.CSSProperties => {
    const animationType = animationProps.animation;
    const animationProgress = Math.min(
      1,
      Math.max(0, (currentTime - fadeInStart) / timing.fadeInDuration)
    );

    switch (animationType) {
      case 'slideUp': {
        const translateY = interpolate(animationProgress, [0, 1], [50, 0]);
        return { transform: `translateY(${translateY}px)` };
      }

      case 'slideDown': {
        const translateYDown = interpolate(animationProgress, [0, 1], [-50, 0]);
        return { transform: `translateY(${translateYDown}px)` };
      }

      case 'scale': {
        const scale = interpolate(animationProgress, [0, 1], [0.8, 1]);
        return { transform: `scale(${scale})` };
      }

      case 'bounce': {
        const bounce =
          animationProgress < 1
            ? interpolate(animationProgress, [0, 0.5, 1], [0, -10, 0])
            : 0;
        return { transform: `translateY(${bounce}px)` };
      }

      case 'fadeIn':
      default:
        return {};
    }
  };

  // Typewriter effect
  const getVisibleText = (): string => {
    if (animationProps.animation === 'typewriter') {
      const typewriterProgress = Math.min(
        1,
        Math.max(0, (currentTime - fadeInStart) / timing.fadeInDuration)
      );
      const charactersToShow = Math.floor(text.length * typewriterProgress);
      return text.substring(0, charactersToShow);
    }
    return text;
  };

  // Word highlighting for better readability
  const renderTextWithHighlights = (text: string) => {
    // Split into words and apply subtle animations
    const words = text.split(' ');
    const wordsPerSecond = 3; // Adjust reading speed

    return words.map((word, index) => {
      const wordAppearTime = fadeInStart + index / wordsPerSecond;
      const wordOpacity = interpolate(
        currentTime,
        [wordAppearTime - 0.1, wordAppearTime, fadeOutStart, fadeOutEnd],
        [0.3, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

      return (
        <span
          key={index}
          style={{
            opacity: wordOpacity,
            transition: 'opacity 0.1s ease-in-out',
            marginRight: '0.3em',
          }}
        >
          {word}
        </span>
      );
    });
  };

  const textStyle: React.CSSProperties = {
    ...styleConfig.textStyle,
    ...animationProps.style,
    opacity,
    ...getAnimationStyle(),
    textAlign: 'center',
    wordBreak: 'break-word',
    lineHeight: '1.4',
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: '0 40px',
      }}
    >
      <div style={textStyle}>
        {style === 'urgent'
          ? renderTextWithHighlights(getVisibleText())
          : getVisibleText()}
      </div>
    </div>
  );
};
