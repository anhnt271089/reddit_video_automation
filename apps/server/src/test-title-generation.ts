#!/usr/bin/env node

/**
 * YOUTUBE TITLE GENERATION SYSTEM TEST
 * Demonstrates the advanced title generation capabilities
 */

import { YouTubeTitleGenerator } from './services/claude-code/titleGenerator';

async function testTitleGeneration() {
  console.log('🎬 TESTING YOUTUBE TITLE GENERATION SYSTEM\n');
  console.log('='.repeat(80));

  // Run the demonstration
  YouTubeTitleGenerator.demonstrateTitleGeneration();

  console.log('\n' + '='.repeat(80));
  console.log('🧪 ADDITIONAL TEST SCENARIOS:\n');

  // Test different content types
  const testScenarios = [
    {
      name: 'Weight Loss Story',
      analysis: {
        coreTransformation: 'Lost 100 pounds by changing one habit at a time',
        universalThemes: ['weight loss', 'habit formation', 'self-discipline'],
        hookElements: [
          'dramatic transformation',
          'simple method',
          'sustainable approach',
        ],
        emotionalJourney: ['shame', 'determination', 'hope', 'pride'],
        audiencePainPoints: [
          'weight struggles',
          'failed diets',
          'low self-esteem',
        ],
        psychologicalTriggers: [
          'transformation desire',
          'health fears',
          'social acceptance',
        ],
        successOutcomes: [
          'dramatic weight loss',
          'improved health',
          'confidence boost',
        ],
        mainProblems: [
          'emotional eating',
          'lack of motivation',
          'all-or-nothing mindset',
        ],
        solutionsProvided: [
          'one habit at a time',
          'small consistent changes',
          'identity shift',
        ],
        actionableInsights: [
          'Focus on systems not goals',
          'Identity drives behavior',
          'Consistency beats perfection',
        ],
      },
    },
    {
      name: 'Career Change Story',
      analysis: {
        coreTransformation:
          'From corporate burnout to successful entrepreneur in 6 months',
        universalThemes: [
          'career change',
          'entrepreneurship',
          'work-life balance',
        ],
        hookElements: [
          'quick transformation',
          'financial freedom',
          'following passion',
        ],
        emotionalJourney: ['burnout', 'fear', 'excitement', 'fulfillment'],
        audiencePainPoints: [
          'job dissatisfaction',
          'financial stress',
          'fear of change',
        ],
        psychologicalTriggers: [
          'escape desire',
          'financial security',
          'autonomy',
        ],
        successOutcomes: [
          'business success',
          'time freedom',
          'purpose alignment',
        ],
        mainProblems: [
          'golden handcuffs',
          'fear of failure',
          'financial insecurity',
        ],
        solutionsProvided: [
          'side hustle validation',
          'gradual transition',
          'skills leverage',
        ],
        actionableInsights: [
          'Test before you leap',
          'Build while employed',
          'Skills transfer across industries',
        ],
      },
    },
    {
      name: 'Social Anxiety Story',
      analysis: {
        coreTransformation:
          'From social anxiety to confident public speaker through exposure therapy',
        universalThemes: [
          'social confidence',
          'public speaking',
          'overcoming fears',
        ],
        hookElements: [
          'relatable struggle',
          'proven method',
          'dramatic improvement',
        ],
        emotionalJourney: ['anxiety', 'fear', 'nervousness', 'confidence'],
        audiencePainPoints: [
          'social anxiety',
          'public speaking fear',
          'low confidence',
        ],
        psychologicalTriggers: [
          'fear of judgment',
          'desire for acceptance',
          'competence need',
        ],
        successOutcomes: [
          'social confidence',
          'speaking success',
          'career advancement',
        ],
        mainProblems: [
          'avoidance behavior',
          'negative self-talk',
          'comfort zone addiction',
        ],
        solutionsProvided: [
          'gradual exposure',
          'cognitive reframing',
          'practice structure',
        ],
        actionableInsights: [
          'Exposure reduces anxiety',
          'Practice builds confidence',
          'Thoughts shape reality',
        ],
      },
    },
  ];

  testScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name.toUpperCase()}\n`);

    const titles = YouTubeTitleGenerator.generateOptimizedTitles(
      scenario.analysis
    );
    const topTitle = titles[0];
    const performance = YouTubeTitleGenerator.predictPerformance(topTitle);

    console.log(`🏆 TOP TITLE: "${topTitle.title}"`);
    console.log(`📊 Expected CTR: ${performance.estimatedCTR}`);
    console.log(
      `🎯 Psychological Trigger: ${topTitle.template.psychologicalTrigger}`
    );
    console.log(
      `🚀 Viral Potential: ${performance.viralPotential.toUpperCase()}`
    );
    console.log(
      `📈 Performance Score: ${Math.round(topTitle.viralScore * 0.4 + topTitle.psychologicalScore * 0.4 + topTitle.seoScore * 0.2)}/100`
    );

    console.log('\n📝 All Generated Titles:');
    titles.forEach((title, idx) => {
      console.log(
        `   ${idx + 1}. "${title.title}" (${title.characterCount} chars)`
      );
    });
    console.log();
  });

  console.log('='.repeat(80));
  console.log('💡 TITLE OPTIMIZATION INSIGHTS:\n');

  console.log('🎯 CHARACTER LENGTH OPTIMIZATION:');
  console.log('• Ideal: 50-60 characters for maximum CTR');
  console.log('• Acceptable: 45-65 characters');
  console.log('• Mobile Display: ~50 characters visible\n');

  console.log('🧠 PSYCHOLOGICAL TRIGGERS (Ranked by Effectiveness):');
  console.log(
    '1. Exclusivity (40% trigger strength) - "secret", "nobody talks about"'
  );
  console.log(
    '2. Scarcity (35% trigger strength) - "limited time", "before it\'s too late"'
  );
  console.log(
    '3. Authority (30% trigger strength) - "experts", "research shows"'
  );
  console.log(
    '4. Curiosity (30% trigger strength) - "you won\'t believe", "what happened"'
  );
  console.log(
    '5. Fear/Urgency (25% trigger strength) - "avoid these mistakes", "don\'t miss"\n'
  );

  console.log('📈 SEO OPTIMIZATION FACTORS:');
  console.log('• Power words presence (+5-25 points)');
  console.log('• Target keywords integration (+10 points each)');
  console.log('• Optimal character length (+25 points)');
  console.log('• Emotional intensity indicators (+10 points)\n');

  console.log('🚀 VIRAL POTENTIAL INDICATORS:');
  console.log(
    '• High: Templates with exclusivity + transformation (40+ base points)'
  );
  console.log(
    '• Medium: Social proof + authority combinations (25+ base points)'
  );
  console.log(
    '• Low: Generic motivational without specific hooks (10+ base points)\n'
  );

  console.log('✅ Title Generation System Analysis Complete!');
  console.log('🎬 Ready for production use with Reddit story content.');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTitleGeneration().catch(console.error);
}

export { testTitleGeneration };
