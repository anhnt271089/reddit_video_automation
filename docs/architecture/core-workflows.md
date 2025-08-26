# Core Workflows

Key system workflows showing component interactions, external API calls, and error handling paths for the complete Reddit-to-video automation pipeline.

## Content Discovery & Approval Workflow

```mermaid
sequenceDiagram
    participant U as User Dashboard
    participant API as API Gateway
    participant DS as Content Discovery Service
    participant DB as Database Service
    participant Reddit as Reddit API
    participant WS as WebSocket Service

    U->>API: POST /api/posts (trigger scraping)
    API->>DS: scrapeRedditPosts()
    DS->>Reddit: GET /r/getmotivated/top?time=week
    Reddit-->>DS: Reddit posts JSON
    DS->>DS: calculateEngagementScore(posts)
    DS->>DB: INSERT posts with status='idea'
    API->>WS: broadcast('posts_discovered', {count})
    WS-->>U: Real-time update

    U->>API: POST /api/posts/{id}/approve
    API->>DB: UPDATE posts SET status='idea_selected'
    API->>WS: broadcast('post_approved', {postId})
    WS-->>U: Status update
```

## Script Generation & Review Workflow

```mermaid
sequenceDiagram
    participant U as User Dashboard
    participant API as API Gateway
    participant SGS as Script Generation Service
    participant DB as Database Service
    participant Claude as Claude API
    participant WS as WebSocket Service

    U->>API: POST /api/scripts {post_id, duration_target}
    API->>SGS: generateScript(post, duration)
    SGS->>Claude: POST /v1/messages (structured prompt)
    Claude-->>SGS: Generated script JSON
    SGS->>SGS: parseSceneBreakdown(script)
    SGS->>DB: INSERT script with status='script_generated'
    API->>WS: broadcast('script_generated', {scriptId})
    WS-->>U: New script available notification

    alt Script Approved
        U->>API: POST /api/scripts/{scriptId}/approve
        API->>DB: UPDATE post status='script_approved'
        API->>WS: broadcast('script_approved', {scriptId})
    else Script Rejected
        U->>API: POST /api/scripts/{scriptId}/reject
        API->>SGS: regenerateScript(postId, feedback)
    end
```

## Asset & Audio Generation Workflow

```mermaid
sequenceDiagram
    participant U as User Dashboard
    participant API as API Gateway
    participant AMS as Asset Management Service
    participant TTS as TTS Service
    participant DB as Database Service
    participant Pexels as Pexels API
    participant ElevenLabs as ElevenLabs API
    participant WS as WebSocket Service

    par Visual Assets
        API->>AMS: searchAssets(script.scene_breakdown)
        loop For Each Scene
            AMS->>Pexels: GET /search?query={keywords}
            Pexels-->>AMS: Asset results
            AMS->>DB: INSERT video_assets
        end
    and Background Music
        AMS->>AMS: selectBackgroundMusic(emotional_tone)
        Note over AMS: Choose from pre-downloaded royalty-free music library
        AMS->>DB: INSERT music_asset with selected track
    and Audio Narration
        API->>TTS: generateNarration(script.script_content)
        TTS->>ElevenLabs: POST /text-to-speech/{voice_id}
        ElevenLabs-->>TTS: Audio file with timing
        TTS->>DB: UPDATE script SET audio_path, word_timings
    end

    API->>DB: UPDATE post SET status='assets_ready'
    API->>WS: broadcast('assets_ready', {postId})
    WS-->>U: Assets, music, and audio ready for review
```

## Video Rendering & Completion Workflow

```mermaid
sequenceDiagram
    participant U as User Dashboard
    participant API as API Gateway
    participant VRE as Video Rendering Engine
    participant DB as Database Service
    participant WS as WebSocket Service

    U->>API: POST /api/assets/approve-batch {script_id}
    API->>VRE: renderVideo(script, assets, audio, music, template)
    VRE->>DB: INSERT video_output with status='rendering'
    VRE->>VRE: synchronizeAudioVisual(narration, music, assets)
    Note over VRE: Mix narration with background music at appropriate levels

    loop Rendering Progress
        VRE->>WS: broadcast('render_progress', {postId, progress})
        WS-->>U: Real-time progress updates
    end

    alt Success
        VRE->>DB: UPDATE video_output SET status='completed'
        VRE->>WS: broadcast('render_complete', {postId})
        WS-->>U: Video ready notification
    else Failure
        VRE->>DB: UPDATE video_output SET status='failed'
        VRE->>WS: broadcast('render_failed', {postId})
        WS-->>U: Error notification with retry option
    end
```
