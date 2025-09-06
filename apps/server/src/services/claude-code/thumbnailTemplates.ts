import { ThumbnailConcept, ScriptStyle } from './types';

/**
 * ADVANCED THUMBNAIL TEMPLATE SYSTEM
 *
 * This system provides detailed, programmatically-generatable thumbnail specifications
 * that go beyond basic concepts to include exact visual placements, character details,
 * object positioning, and psychological optimization for the 20-40 demographic.
 */

export interface DetailedThumbnailTemplate {
  concept: ThumbnailConcept;
  technicalSpecs: TechnicalSpecifications;
  visualPlacement: VisualPlacementGuide;
  characterSpecs: CharacterSpecifications;
  objectPlacement: ObjectPlacementGuide;
  colorPalette: DetailedColorPalette;
  textSpecifications: TextSpecifications;
  implementationGuide: ImplementationGuide;
}

export interface TechnicalSpecifications {
  dimensions: {
    width: 1280;
    height: 720;
    aspectRatio: '16:9';
  };
  mobileOptimization: {
    minTextSize: 24; // pixels at 320px wide
    contrastRatio: number; // 4.5:1 minimum
    readabilityScore: number; // 1-10 scale
  };
  fileSpecs: {
    format: 'JPG' | 'PNG';
    quality: 90;
    maxFileSize: '2MB';
  };
}

export interface VisualPlacementGuide {
  layoutGrid: {
    type: 'thirds' | 'golden-ratio' | 'center-weighted' | 'split-screen';
    primaryFocus: {
      x: number; // percentage from left
      y: number; // percentage from top
      width: number; // percentage of total width
      height: number; // percentage of total height
    };
    secondaryElements: Array<{
      element: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  };
  visualFlow: {
    entryPoint: 'top-left' | 'center' | 'character-face';
    eyePath: string[]; // sequence of focus points
    exitPoint: 'call-to-action' | 'text-overlay' | 'emotional-peak';
  };
}

export interface CharacterSpecifications {
  demographics: {
    ageRange: '25-30' | '30-35' | '35-40';
    gender: 'male' | 'female' | 'non-binary' | 'any';
    ethnicity: 'diverse' | 'specific-to-story';
    bodyType: 'average' | 'athletic' | 'professional';
  };
  positioning: {
    facePlacement: {
      x: number; // percentage from left
      y: number; // percentage from top
      size: number; // percentage of frame height
      angle: number; // degrees from center
    };
    bodyLanguage: string[];
    eyeDirection: 'camera' | 'toward-object' | 'upward' | 'away';
    gestureDescription: string;
  };
  emotionalState: {
    primaryEmotion: string;
    secondaryEmotion?: string;
    intensity: 'subtle' | 'moderate' | 'intense';
    authenticity: 'genuine' | 'aspirational' | 'relatable';
  };
  styling: {
    clothing: {
      style: string;
      colors: string[];
      professionalism: 'casual' | 'business-casual' | 'professional';
    };
    grooming: string;
    accessories?: string[];
  };
}

export interface ObjectPlacementGuide {
  symbolic: Array<{
    object: string;
    meaning: string;
    placement: { x: number; y: number; size: number };
    prominence: 'background' | 'supporting' | 'focal';
    visualWeight: number; // 1-10 scale
  }>;
  contextual: Array<{
    object: string;
    storyConnection: string;
    placement: { x: number; y: number; size: number };
    interactionWithCharacter?: string;
  }>;
  emotional: Array<{
    object: string;
    emotionalTrigger: string;
    placement: { x: number; y: number; size: number };
    visualEffect: string; // glow, shadow, highlight, etc.
  }>;
}

export interface DetailedColorPalette {
  primary: {
    hex: string;
    psychology: string;
    usage: string[];
  };
  secondary: {
    hex: string;
    psychology: string;
    usage: string[];
  };
  accent: {
    hex: string;
    psychology: string;
    usage: string[];
  };
  background: {
    type: 'gradient' | 'solid' | 'image-overlay';
    colors: string[];
    direction?: string; // for gradients
    opacity?: number; // for overlays
  };
  contrastColors: {
    text: string;
    highlights: string;
    shadows: string;
  };
}

export interface TextSpecifications {
  primary: {
    content: string;
    font: {
      family: string;
      weight: 'bold' | 'extra-bold' | 'black';
      size: number; // pixels
      letterSpacing: number;
      lineHeight: number;
    };
    placement: {
      x: number; // percentage
      y: number; // percentage
      maxWidth: number; // percentage
      alignment: 'left' | 'center' | 'right';
    };
    styling: {
      color: string;
      stroke?: {
        color: string;
        width: number;
      };
      shadow?: {
        color: string;
        x: number;
        y: number;
        blur: number;
      };
      background?: {
        color: string;
        opacity: number;
        borderRadius: number;
      };
    };
  };
  secondary?: {
    content: string;
    font: TextSpecifications['primary']['font'];
    placement: TextSpecifications['primary']['placement'];
    styling: TextSpecifications['primary']['styling'];
  };
}

export interface ImplementationGuide {
  designTools: string[];
  automationNotes: string[];
  qualityChecklist: string[];
  commonPitfalls: string[];
  optimizationTips: string[];
}

/**
 * THUMBNAIL TEMPLATE FACTORY
 * Generates detailed thumbnail templates based on story type and psychological triggers
 */
export class ThumbnailTemplateFactory {
  /**
   * Generate transformation-focused thumbnail template
   */
  static createTransformationTemplate(
    storyType: ScriptStyle,
    specificTriggers: string[],
    storyContext: string
  ): DetailedThumbnailTemplate {
    const baseTemplate: DetailedThumbnailTemplate = {
      concept: {
        description:
          'Transformation-focused thumbnail featuring clear before/after or problem/solution visual progression, designed to tap into transformation hope and control desire psychological triggers for 20-40 demographic seeking life improvement.',
        visualElements: [
          'Character showing emotional journey progression',
          'Symbolic transformation objects (keys, doors, arrows)',
          'Success indicators and achievement symbols',
          'Professional yet approachable environment',
          'Clear visual hierarchy guiding eye movement',
        ],
        textOverlay: this.generateTransformationText(storyContext),
        colorScheme: this.getColorSchemeForStyle(storyType, 'transformation'),
        composition: {
          layout: 'transformation-triangle',
          visualFlow:
            'Lower left struggle → upper center peak moment → lower right success, creating clear transformation arc',
          focalPoint:
            "Character's face during breakthrough moment, positioned at golden ratio intersection",
        },
        characters: {
          count: 1,
          demographics:
            'Age 28-35, authentic professional appearance showing clear emotional progression from challenge to empowerment',
          expressions: ['determined', 'hopeful', 'empowered', 'relieved'],
          positioning:
            'Three-point transformation: struggle pose → transition moment → success pose across frame',
          clothing:
            'Business casual showing subtle upgrade: initial state slightly rumpled → final state more polished and confident',
        },
        objects: {
          symbolic: [
            'Golden key (opportunity unlocked)',
            'Open door with light streaming through (new possibilities)',
            'Upward trending arrow or graph (progress/growth)',
            'Lightbulb with visible filament (realization moment)',
          ],
          contextual: this.getContextualObjects(storyType, storyContext),
          emotional: [
            'Progress bars showing 90%+ completion',
            'Before/after comparison elements',
            'Achievement badges or checkmarks',
            'Sunrise/dawn lighting (new beginning)',
          ],
        },
        textStrategy: {
          primary: this.generateTransformationText(storyContext),
          font: 'Bold sans-serif font optimized for mobile readability',
          placement:
            'Upper third or lower third, never competing with character transformation arc',
          color:
            'High contrast white with subtle shadow or gold accent matching success theme',
        },
        psychologicalTriggers: [
          'transformation_hope',
          'control_desire',
          'aspiration',
          'self_efficacy',
        ],
        targetEmotion: 'hope',
        ctrOptimization: {
          contrastLevel: 'high',
          emotionalIntensity: 'moderate',
          clarityScore: 9,
        },
      },
      technicalSpecs: this.getStandardTechnicalSpecs(),
      visualPlacement: this.getTransformationVisualPlacement(),
      characterSpecs: this.getTransformationCharacterSpecs(),
      objectPlacement: this.getTransformationObjectPlacement(storyType),
      colorPalette: this.getTransformationColorPalette(storyType),
      textSpecifications: this.getTransformationTextSpecs(),
      implementationGuide: this.getTransformationImplementationGuide(),
    };

    return this.customizeForStoryType(baseTemplate, storyType, storyContext);
  }

  /**
   * Generate urgency/curiosity-driven thumbnail template
   */
  static createUrgencyTemplate(
    storyType: ScriptStyle,
    specificTriggers: string[],
    storyContext: string
  ): DetailedThumbnailTemplate {
    const baseTemplate: DetailedThumbnailTemplate = {
      concept: {
        description:
          'Urgency/curiosity-driven thumbnail featuring central character with intense expression and immediate attention-grabbing elements, designed to trigger time urgency and status anxiety for maximum click-through rates.',
        visualElements: [
          'Character with shocking/concerned/determined expression',
          'Urgency indicators creating time pressure',
          'High-contrast attention-grabbing focal point',
          'Countdown or warning visual elements',
          'Dramatic lighting emphasizing immediacy',
        ],
        textOverlay: this.generateUrgencyText(storyContext),
        colorScheme: this.getColorSchemeForStyle(storyType, 'urgency'),
        composition: {
          layout: 'central-focus',
          visualFlow:
            'Immediate center focus creating tunnel vision → radiating urgency elements → text revelation',
          focalPoint:
            'Character face with intense expression, dead center with dramatic lighting',
        },
        characters: {
          count: 1,
          demographics:
            'Age 28-35, highly relatable appearance with authentic surprise/concern, avoiding over-polish in favor of genuine reaction',
          expressions: [
            'shocked',
            'concerned',
            'intensely focused',
            'realizing',
            'alarmed',
          ],
          positioning:
            'Close-up center positioning with direct eye contact, slight forward lean suggesting urgency',
          clothing:
            'Casual professional that emphasizes relatability - slightly imperfect to suggest authentic reaction',
        },
        objects: {
          symbolic: [
            'Clock faces showing different times (time pressure)',
            'Warning triangles or exclamation marks',
            'Spotlight or dramatic lighting effects',
            'Question mark symbols or reveal elements',
          ],
          contextual: this.getContextualObjects(storyType, storyContext),
          emotional: [
            'Countdown timer elements',
            'Urgency indicators (running out graphics)',
            'Shock wave or impact visual effects',
            "Before it's too late visual metaphors",
          ],
        },
        textStrategy: {
          primary: this.generateUrgencyText(storyContext),
          font: 'Bold, urgent font creating immediacy and commanding attention',
          placement:
            'Strategic placement creating visual tension without blocking character face',
          color:
            'High contrast yellow or white with shadow/outline for maximum readability against any background',
        },
        psychologicalTriggers: [
          'time_urgency',
          'status_anxiety',
          'fear_of_missing_out',
          'curiosity_gap',
        ],
        targetEmotion: 'curiosity',
        ctrOptimization: {
          contrastLevel: 'high',
          emotionalIntensity: 'intense',
          clarityScore: 10,
        },
      },
      technicalSpecs: this.getStandardTechnicalSpecs(),
      visualPlacement: this.getUrgencyVisualPlacement(),
      characterSpecs: this.getUrgencyCharacterSpecs(),
      objectPlacement: this.getUrgencyObjectPlacement(storyType),
      colorPalette: this.getUrgencyColorPalette(storyType),
      textSpecifications: this.getUrgencyTextSpecs(),
      implementationGuide: this.getUrgencyImplementationGuide(),
    };

    return this.customizeForStoryType(baseTemplate, storyType, storyContext);
  }

  /**
   * DETAILED SPECIFICATION GENERATORS
   */

  private static getStandardTechnicalSpecs(): TechnicalSpecifications {
    return {
      dimensions: {
        width: 1280,
        height: 720,
        aspectRatio: '16:9',
      },
      mobileOptimization: {
        minTextSize: 24,
        contrastRatio: 4.5,
        readabilityScore: 9,
      },
      fileSpecs: {
        format: 'JPG',
        quality: 90,
        maxFileSize: '2MB',
      },
    };
  }

  private static getTransformationVisualPlacement(): VisualPlacementGuide {
    return {
      layoutGrid: {
        type: 'golden-ratio',
        primaryFocus: {
          x: 38.2, // golden ratio point
          y: 38.2,
          width: 30,
          height: 40,
        },
        secondaryElements: [
          {
            element: 'transformation objects',
            x: 65,
            y: 20,
            width: 25,
            height: 25,
          },
          {
            element: 'progress indicators',
            x: 10,
            y: 75,
            width: 40,
            height: 15,
          },
        ],
      },
      visualFlow: {
        entryPoint: 'character-face',
        eyePath: [
          'character-transformation',
          'symbolic-objects',
          'text-overlay',
          'success-indicators',
        ],
        exitPoint: 'call-to-action',
      },
    };
  }

  private static getUrgencyVisualPlacement(): VisualPlacementGuide {
    return {
      layoutGrid: {
        type: 'center-weighted',
        primaryFocus: {
          x: 50, // dead center
          y: 45, // slightly above center for dynamic feel
          width: 35,
          height: 50,
        },
        secondaryElements: [
          {
            element: 'urgency indicators',
            x: 15,
            y: 15,
            width: 20,
            height: 20,
          },
          {
            element: 'warning elements',
            x: 70,
            y: 70,
            width: 25,
            height: 25,
          },
        ],
      },
      visualFlow: {
        entryPoint: 'center',
        eyePath: [
          'character-expression',
          'urgency-elements',
          'text-reveal',
          'warning-indicators',
        ],
        exitPoint: 'emotional-peak',
      },
    };
  }

  private static getTransformationCharacterSpecs(): CharacterSpecifications {
    return {
      demographics: {
        ageRange: '30-35',
        gender: 'any',
        ethnicity: 'diverse',
        bodyType: 'professional',
      },
      positioning: {
        facePlacement: {
          x: 38.2, // golden ratio
          y: 35,
          size: 25, // percentage of frame height
          angle: 5, // slight dynamic angle
        },
        bodyLanguage: [
          'Confident posture showing progression',
          'Open gestures indicating receptiveness to change',
          'Upward movement suggesting growth and aspiration',
        ],
        eyeDirection: 'camera',
        gestureDescription:
          'Progressive gesture sequence: closed → opening → raised/empowered',
      },
      emotionalState: {
        primaryEmotion: 'hopeful determination',
        secondaryEmotion: 'quiet confidence',
        intensity: 'moderate',
        authenticity: 'genuine',
      },
      styling: {
        clothing: {
          style: 'Business casual with subtle upgrade indicators',
          colors: ['navy blue', 'crisp white', 'confidence-building colors'],
          professionalism: 'business-casual',
        },
        grooming: 'Polished but approachable, showing positive transformation',
        accessories: ['Minimal professional accessories that suggest success'],
      },
    };
  }

  private static getUrgencyCharacterSpecs(): CharacterSpecifications {
    return {
      demographics: {
        ageRange: '28-35',
        gender: 'any',
        ethnicity: 'diverse',
        bodyType: 'average',
      },
      positioning: {
        facePlacement: {
          x: 50, // center
          y: 40,
          size: 30, // larger for impact
          angle: 0, // straight on for maximum connection
        },
        bodyLanguage: [
          'Slight forward lean indicating urgency',
          'Alert posture showing immediate attention',
          'Authentic reaction pose avoiding artificial positioning',
        ],
        eyeDirection: 'camera',
        gestureDescription:
          'Authentic surprise/concern reaction - hand to face, leaning forward, or revelation gesture',
      },
      emotionalState: {
        primaryEmotion: 'urgent concern',
        secondaryEmotion: 'determined focus',
        intensity: 'intense',
        authenticity: 'genuine',
      },
      styling: {
        clothing: {
          style: 'Casual professional emphasizing relatability',
          colors: [
            "muted background colors that don't compete with urgency elements",
          ],
          professionalism: 'casual',
        },
        grooming:
          'Natural, authentic - slightly imperfect to emphasize genuine reaction',
        accessories: ['Minimal - focus should be on facial expression'],
      },
    };
  }

  private static getTransformationColorPalette(
    storyType: ScriptStyle
  ): DetailedColorPalette {
    const basePalette = {
      primary: {
        hex: '#FF6B35', // energetic orange
        psychology: 'Energy, enthusiasm, transformation power',
        usage: [
          'character highlighting',
          'transformation objects',
          'success indicators',
        ],
      },
      secondary: {
        hex: '#1B365D', // trust blue
        psychology: 'Trust, stability, professional credibility',
        usage: ['background elements', 'text shadows', 'supporting objects'],
      },
      accent: {
        hex: '#FFD700', // success gold
        psychology: 'Achievement, value, premium success',
        usage: ['key objects', 'text highlights', 'achievement symbols'],
      },
      background: {
        type: 'gradient' as const,
        colors: ['#1B365D', '#2A4A6B', '#FF6B35'],
        direction: 'diagonal-upward', // suggesting growth
        opacity: 0.8,
      },
      contrastColors: {
        text: '#FFFFFF',
        highlights: '#FFD700',
        shadows: '#1A1A1A',
      },
    };

    // Customize based on story type
    switch (storyType) {
      case 'motivational':
        basePalette.primary.hex = '#FF6B35'; // energetic orange
        break;
      case 'educational':
        basePalette.primary.hex = '#6A5ACD'; // knowledge purple
        break;
      case 'storytelling':
        basePalette.primary.hex = '#DC143C'; // dramatic red
        break;
      case 'entertainment':
        basePalette.primary.hex = '#FF1493'; // vibrant pink
        break;
    }

    return basePalette;
  }

  private static getUrgencyColorPalette(
    storyType: ScriptStyle
  ): DetailedColorPalette {
    return {
      primary: {
        hex: '#DC143C', // urgent red
        psychology: 'Urgency, importance, immediate attention required',
        usage: [
          'warning elements',
          'character highlighting',
          'urgency indicators',
        ],
      },
      secondary: {
        hex: '#FFD700', // attention yellow
        psychology: 'Attention, warning, cannot be ignored',
        usage: ['text backgrounds', 'highlight elements', 'countdown timers'],
      },
      accent: {
        hex: '#1A1A1A', // dramatic black
        psychology: 'Seriousness, depth, dramatic contrast',
        usage: ['shadows', 'text outlines', 'contrast backgrounds'],
      },
      background: {
        type: 'gradient' as const,
        colors: ['#1A1A1A', '#DC143C'],
        direction: 'radial-center', // spotlight effect
        opacity: 0.9,
      },
      contrastColors: {
        text: '#FFFFFF',
        highlights: '#FFD700',
        shadows: '#000000',
      },
    };
  }

  private static getColorSchemeForStyle(
    style: ScriptStyle,
    type: 'transformation' | 'urgency'
  ): string {
    const schemes = {
      transformation: {
        motivational:
          'Warm success gradient: Energy orange (#FF6B35) to gold (#FFD700) with trust blue (#1B365D) stability',
        educational:
          'Professional growth: Knowledge purple (#6A5ACD) to success gold with clean white highlights',
        storytelling:
          'Cinematic progression: Deep blues to warm oranges showing journey from challenge to triumph',
        entertainment:
          'Vibrant transformation: Bright oranges and energetic yellows with high-contrast elements',
      },
      urgency: {
        motivational:
          'High-urgency warning: Dramatic reds (#DC143C) with attention yellows and stark contrast',
        educational:
          'Critical insight alert: Urgent oranges with professional blues creating immediate importance',
        storytelling:
          'Dramatic revelation: High-contrast reds and blacks with spotlight yellow highlights',
        entertainment:
          'Shocking attention-grabber: Vibrant reds, electric yellows, dramatic black contrasts',
      },
    };
    return schemes[type][style];
  }

  private static generateTransformationText(storyContext: string): string {
    const transformationTemplates = [
      'HOW I CHANGED MY LIFE',
      'FROM LOST TO EMPOWERED',
      'THE TRANSFORMATION SECRET',
      'MY BREAKTHROUGH MOMENT',
      'HOW EVERYTHING CHANGED',
      'THE TRUTH ABOUT CHANGE',
      'FROM STRUGGLE TO SUCCESS',
      'MY LIFE-CHANGING REALIZATION',
    ];

    // In a real implementation, use AI to generate context-specific text
    return transformationTemplates[0]; // Placeholder
  }

  private static generateUrgencyText(storyContext: string): string {
    const urgencyTemplates = [
      "WHAT THEY DON'T TELL YOU",
      'THE SHOCKING TRUTH',
      "DON'T MAKE THIS MISTAKE",
      "BEFORE IT'S TOO LATE",
      'THE HIDDEN REALITY',
      'EVERYONE GETS THIS WRONG',
      'THE URGENT WARNING',
      'STOP DOING THIS NOW',
    ];

    return urgencyTemplates[0]; // Placeholder
  }

  private static getContextualObjects(
    storyType: ScriptStyle,
    storyContext: string
  ): string[] {
    // This would be dynamically generated based on story content
    const baseObjects = {
      motivational: [
        'success ladder',
        'mountain peak',
        'finish line',
        'trophy',
      ],
      educational: ['books', 'lightbulb', 'graph', 'diploma', 'brain'],
      storytelling: ['journey path', 'crossroads', 'mirror', 'door'],
      entertainment: [
        'surprise element',
        'twist indicator',
        'reaction objects',
      ],
    };

    return baseObjects[storyType] || baseObjects.motivational;
  }

  private static getTransformationObjectPlacement(
    storyType: ScriptStyle
  ): ObjectPlacementGuide {
    return {
      symbolic: [
        {
          object: 'golden key',
          meaning: 'Opportunity unlocked, access to new possibilities',
          placement: { x: 70, y: 25, size: 8 },
          prominence: 'supporting',
          visualWeight: 7,
        },
        {
          object: 'open door with light',
          meaning: 'New chapter beginning, positive future ahead',
          placement: { x: 75, y: 15, size: 15 },
          prominence: 'supporting',
          visualWeight: 8,
        },
      ],
      contextual: [
        {
          object: 'progress arrow',
          storyConnection:
            'Visual representation of forward movement and growth',
          placement: { x: 15, y: 80, size: 20 },
          interactionWithCharacter:
            "Arrow points toward character's transformed state",
        },
      ],
      emotional: [
        {
          object: 'sunrise/dawn lighting',
          emotionalTrigger: 'New beginning, hope, fresh start',
          placement: { x: 60, y: 10, size: 30 },
          visualEffect: 'soft glow emanating outward',
        },
      ],
    };
  }

  private static getUrgencyObjectPlacement(
    storyType: ScriptStyle
  ): ObjectPlacementGuide {
    return {
      symbolic: [
        {
          object: 'warning triangle',
          meaning: 'Important information, pay attention immediately',
          placement: { x: 15, y: 15, size: 10 },
          prominence: 'supporting',
          visualWeight: 8,
        },
        {
          object: 'clock face',
          meaning: 'Time pressure, urgency, deadline approaching',
          placement: { x: 75, y: 70, size: 12 },
          prominence: 'supporting',
          visualWeight: 7,
        },
      ],
      contextual: [
        {
          object: 'exclamation mark',
          storyConnection: 'Shocking revelation or important realization',
          placement: { x: 85, y: 20, size: 8 },
        },
      ],
      emotional: [
        {
          object: 'spotlight effect',
          emotionalTrigger:
            'Focus attention, create drama, emphasize importance',
          placement: { x: 50, y: 40, size: 60 },
          visualEffect: 'radial light emanating from character',
        },
      ],
    };
  }

  private static getTransformationTextSpecs(): TextSpecifications {
    return {
      primary: {
        content: 'HOW I CHANGED MY LIFE',
        font: {
          family: 'Montserrat, Arial Black, sans-serif',
          weight: 'extra-bold',
          size: 64,
          letterSpacing: 1.5,
          lineHeight: 1.2,
        },
        placement: {
          x: 50, // centered
          y: 85, // bottom area
          maxWidth: 80,
          alignment: 'center',
        },
        styling: {
          color: '#FFFFFF',
          stroke: {
            color: '#1B365D',
            width: 3,
          },
          shadow: {
            color: '#000000',
            x: 2,
            y: 2,
            blur: 4,
          },
        },
      },
    };
  }

  private static getUrgencyTextSpecs(): TextSpecifications {
    return {
      primary: {
        content: "WHAT THEY DON'T TELL YOU",
        font: {
          family: 'Impact, Arial Black, sans-serif',
          weight: 'black',
          size: 58,
          letterSpacing: 1,
          lineHeight: 1.1,
        },
        placement: {
          x: 50,
          y: 15, // top area for urgency
          maxWidth: 85,
          alignment: 'center',
        },
        styling: {
          color: '#FFD700',
          stroke: {
            color: '#DC143C',
            width: 4,
          },
          shadow: {
            color: '#000000',
            x: 3,
            y: 3,
            blur: 6,
          },
          background: {
            color: '#1A1A1A',
            opacity: 0.7,
            borderRadius: 8,
          },
        },
      },
    };
  }

  private static getTransformationImplementationGuide(): ImplementationGuide {
    return {
      designTools: [
        'Canva Pro (templates and automation)',
        'Figma (precise positioning and collaboration)',
        'Adobe Photoshop (advanced editing)',
        'Sketch (UI-focused design)',
      ],
      automationNotes: [
        'Character expressions can be swapped using face replacement APIs',
        'Text overlays should use dynamic font sizing based on content length',
        'Color gradients can be programmatically adjusted for different story types',
        'Object placement should scale proportionally on different screen sizes',
      ],
      qualityChecklist: [
        'Text readable at 320px width (mobile thumbnail size)',
        'Character face clearly visible and emotionally engaging',
        'Color contrast ratio meets 4.5:1 minimum for accessibility',
        'Visual hierarchy guides eye movement in under 2 seconds',
        'Transformation progression is immediately clear',
        'All symbolic objects support the transformation narrative',
      ],
      commonPitfalls: [
        'Over-complicating the transformation visual - keep it simple and clear',
        'Using too many colors that create visual chaos instead of harmony',
        'Placing text over character faces, reducing emotional connection',
        'Making symbolic objects too prominent, competing with character',
        'Using generic stock photography that lacks authenticity',
      ],
      optimizationTips: [
        'A/B test different character expressions to find highest CTR',
        'Test transformation layouts (horizontal vs diagonal vs triangular)',
        'Monitor mobile performance - most views happen on mobile devices',
        'Use eye-tracking heat map patterns to optimize element placement',
        'Consider cultural differences in color psychology for global audiences',
      ],
    };
  }

  private static getUrgencyImplementationGuide(): ImplementationGuide {
    return {
      designTools: [
        'Canva Pro (quick urgency templates)',
        'Adobe After Effects (dynamic urgency elements)',
        'Figma (precise character positioning)',
        'Photoshop (dramatic lighting effects)',
      ],
      automationNotes: [
        'Urgency indicators can be animated for even greater impact',
        'Character expressions should be automatically filtered for authenticity',
        'Warning elements should scale with story intensity level',
        'Background gradients can be algorithmically adjusted for maximum contrast',
      ],
      qualityChecklist: [
        'Character expression authentically conveys urgency without being overdramatic',
        'Warning/urgency elements support rather than overwhelm the main message',
        'Text is immediately readable with maximum contrast',
        'Visual elements create genuine curiosity rather than clickbait feeling',
        'Mobile optimization ensures all elements are visible at smallest size',
        'Color psychology appropriately triggers urgency without inducing anxiety',
      ],
      commonPitfalls: [
        'Over-dramatizing character expressions leading to fake/clickbait appearance',
        'Using too many urgency indicators creating visual clutter',
        'Making text too large, overwhelming other elements',
        'Using generic "shocking" imagery that doesn\'t connect to story content',
        'Creating anxiety rather than productive urgency in viewers',
      ],
      optimizationTips: [
        'Test different levels of urgency intensity for different story types',
        'Monitor click-through vs retention rates to ensure expectation alignment',
        'Use authentic rather than stock expressions for higher trust',
        'Consider the story context when choosing urgency level',
        'A/B test warning element placement for optimal attention without distraction',
      ],
    };
  }

  private static customizeForStoryType(
    template: DetailedThumbnailTemplate,
    storyType: ScriptStyle,
    storyContext: string
  ): DetailedThumbnailTemplate {
    // Customize template based on specific story type and context
    // This would include AI-driven adjustments based on story content
    return template;
  }
}

/**
 * EXAMPLE GENERATOR FUNCTIONS
 * These demonstrate how to use the template system for specific story scenarios
 */

export class ThumbnailExampleGenerator {
  /**
   * Generate example thumbnails for common Reddit story scenarios
   */
  static generateCareerChangeExample(): DetailedThumbnailTemplate[] {
    const transformationTemplate =
      ThumbnailTemplateFactory.createTransformationTemplate(
        'motivational',
        ['transformation_hope', 'control_desire'],
        'Reddit user quits corporate job to start successful business'
      );

    const urgencyTemplate = ThumbnailTemplateFactory.createUrgencyTemplate(
      'motivational',
      ['time_urgency', 'status_anxiety'],
      'Reddit user quits corporate job to start successful business'
    );

    return [transformationTemplate, urgencyTemplate];
  }

  static generateRelationshipAdviceExample(): DetailedThumbnailTemplate[] {
    const transformationTemplate =
      ThumbnailTemplateFactory.createTransformationTemplate(
        'educational',
        ['transformation_hope', 'authenticity_craving'],
        'How Reddit user saved their marriage with one simple change'
      );

    const urgencyTemplate = ThumbnailTemplateFactory.createUrgencyTemplate(
      'educational',
      ['fear_of_missing_out', 'status_anxiety'],
      'How Reddit user saved their marriage with one simple change'
    );

    return [transformationTemplate, urgencyTemplate];
  }

  static generatePersonalGrowthExample(): DetailedThumbnailTemplate[] {
    const transformationTemplate =
      ThumbnailTemplateFactory.createTransformationTemplate(
        'storytelling',
        ['transformation_hope', 'self_efficacy'],
        'Reddit user overcomes social anxiety and transforms their life'
      );

    const urgencyTemplate = ThumbnailTemplateFactory.createUrgencyTemplate(
      'storytelling',
      ['authenticity_craving', 'fear_of_missing_out'],
      'Reddit user overcomes social anxiety and transforms their life'
    );

    return [transformationTemplate, urgencyTemplate];
  }
}
