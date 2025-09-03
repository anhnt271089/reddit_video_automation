#!/usr/bin/env tsx

/**
 * Test script to verify Claude API integration is working correctly
 * This script tests the ScriptGenerator with the actual Claude API
 */

import dotenv from 'dotenv';
import { ClaudeCodeScriptGenerator } from './services/claude-code/scriptGenerator.js';
import type {
  ScriptGenerationRequest,
  RedditPost,
} from './services/claude-code/types.js';

// Load environment variables
dotenv.config();

async function testClaudeIntegration() {
  console.log('🧪 Testing Claude API Integration...\n');

  try {
    // Check if API key is configured
    if (
      !process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY === 'dev_claude_key'
    ) {
      console.warn(
        '⚠️  ANTHROPIC_API_KEY not configured. Using mock data for test.'
      );
      return;
    }

    const generator = new ClaudeCodeScriptGenerator();

    // Create a test Reddit post
    const testPost: RedditPost = {
      id: 'test123',
      title: 'Life-changing advice from a 90-year-old',
      content:
        'A wise 90-year-old man told me: "The biggest regret people have on their deathbed is not the things they did, but the things they never tried. Don\'t wait for tomorrow to chase your dreams because tomorrow isn\'t guaranteed." This completely changed my perspective on taking risks and pursuing what truly matters.',
      author: 'testuser',
      subreddit: 'motivation',
      score: 5500,
      upvotes: 5500,
      comments: 234,
      created_at: new Date(),
      url: 'https://reddit.com/test',
      awards: [],
    };

    const request: ScriptGenerationRequest = {
      redditPost: testPost,
      targetDuration: 60,
      style: 'motivational',
      sceneCount: 4,
    };

    console.log('📝 Test Post:');
    console.log(`Title: ${testPost.title}`);
    console.log(`Content: ${testPost.content.substring(0, 100)}...`);
    console.log(`Style: ${request.style}`);
    console.log(`Duration: ${request.targetDuration}s`);
    console.log(`Scenes: ${request.sceneCount}\n`);

    console.log('🔄 Generating script with Claude API...');
    const startTime = Date.now();

    const generatedScript = await generator.generateScript(request);

    const endTime = Date.now();
    console.log(
      `✅ Script generated successfully in ${endTime - startTime}ms\n`
    );

    // Display results
    console.log('📜 Generated Script:');
    console.log('─'.repeat(50));
    console.log(generatedScript.scriptContent);
    console.log('─'.repeat(50));

    console.log('\n🎬 Scene Breakdown:');
    generatedScript.sceneBreakdown.forEach((scene, index) => {
      console.log(
        `Scene ${index + 1} (${scene.duration}s) [${scene.emotion}]:`
      );
      console.log(`  📝 ${scene.narration.substring(0, 80)}...`);
      console.log(`  🏷️  Keywords: ${scene.visualKeywords.join(', ')}`);
    });

    console.log('\n📊 Metadata:');
    console.log(`⏱️  Duration: ${generatedScript.durationEstimate}s`);
    console.log(`🏷️  Keywords: ${generatedScript.keywords.join(', ')}`);
    console.log(
      `📝 Description: ${generatedScript.description.substring(0, 100)}...`
    );

    console.log('\n📺 Titles:');
    generatedScript.titles.forEach((title, index) => {
      console.log(`  ${index + 1}. ${title}`);
    });

    console.log('\n🖼️  Thumbnail Concepts:');
    generatedScript.thumbnailConcepts.forEach((concept, index) => {
      console.log(`  ${index + 1}. ${concept.description}`);
      console.log(`     Elements: ${concept.visualElements.join(', ')}`);
      console.log(`     Color: ${concept.colorScheme}`);
      if (concept.textOverlay) {
        console.log(`     Text: "${concept.textOverlay}"`);
      }
    });

    console.log('\n✅ Claude API integration test completed successfully!');
  } catch (error) {
    console.error('❌ Claude integration test failed:', error);

    if (error instanceof Error && error.message.includes('api_key')) {
      console.log(
        '\n💡 Tip: Make sure to set a valid ANTHROPIC_API_KEY in your .env file'
      );
    }

    process.exit(1);
  }
}

// Run the test
testClaudeIntegration().catch(console.error);
