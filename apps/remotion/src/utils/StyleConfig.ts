import { VideoStyle, TextStyle } from '../types';

interface StyleConfig {
  backgroundColor: string;
  overlay: string;
  textStyle: TextStyle;
  primaryColor: string;
  secondaryColor: string;
}

export const getStyleConfig = (style: VideoStyle): StyleConfig => {
  switch (style) {
    case 'motivational':
      return {
        backgroundColor: '#1a1a1a',
        overlay:
          'linear-gradient(45deg, rgba(255,215,0,0.1) 0%, rgba(255,69,0,0.1) 100%)',
        textStyle: {
          fontSize: 48,
          fontFamily: 'Inter, Arial, sans-serif',
          fontWeight: 'bold',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: 24,
          borderRadius: 12,
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.3,
          textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
        },
        primaryColor: '#FFD700',
        secondaryColor: '#FF4500',
      };

    case 'contemplative':
      return {
        backgroundColor: '#2c3e50',
        overlay:
          'linear-gradient(135deg, rgba(52,152,219,0.1) 0%, rgba(155,89,182,0.1) 100%)',
        textStyle: {
          fontSize: 42,
          fontFamily: 'Georgia, serif',
          fontWeight: '400',
          color: '#ecf0f1',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: 32,
          borderRadius: 8,
          textAlign: 'center',
          maxWidth: 700,
          lineHeight: 1.5,
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
        },
        primaryColor: '#3498db',
        secondaryColor: '#9b59b6',
      };

    case 'urgent':
      return {
        backgroundColor: '#000000',
        overlay:
          'linear-gradient(90deg, rgba(255,0,0,0.1) 0%, rgba(255,255,0,0.1) 100%)',
        textStyle: {
          fontSize: 52,
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontWeight: '900',
          color: '#ffffff',
          backgroundColor: 'rgba(255,0,0,0.7)',
          padding: 20,
          borderRadius: 4,
          textAlign: 'center',
          maxWidth: 900,
          lineHeight: 1.2,
          textShadow: '4px 4px 8px rgba(0,0,0,1)',
        },
        primaryColor: '#ff0000',
        secondaryColor: '#ffff00',
      };

    default:
      return getStyleConfig('motivational');
  }
};

export const getTextAnimationConfig = (style: VideoStyle) => {
  switch (style) {
    case 'motivational':
      return {
        animation: 'slideUp' as const,
        timing: {
          fadeInStart: 0.2,
          fadeInDuration: 0.8,
          holdDuration: 2.0,
          fadeOutStart: 3.0,
          fadeOutDuration: 0.5,
        },
      };

    case 'contemplative':
      return {
        animation: 'fadeIn' as const,
        timing: {
          fadeInStart: 0.5,
          fadeInDuration: 1.2,
          holdDuration: 2.5,
          fadeOutStart: 4.2,
          fadeOutDuration: 0.8,
        },
      };

    case 'urgent':
      return {
        animation: 'scale' as const,
        timing: {
          fadeInStart: 0.1,
          fadeInDuration: 0.4,
          holdDuration: 1.5,
          fadeOutStart: 2.0,
          fadeOutDuration: 0.3,
        },
      };

    default:
      return getTextAnimationConfig('motivational');
  }
};
