# API Specification

Based on REST API + WebSocket architecture, this OpenAPI specification covers all endpoints supporting the Reddit-to-video pipeline workflow.

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Reddit Video Automation API
  version: 1.0.0
  description: Local-first Reddit-to-video automation system API
servers:
  - url: http://localhost:3001
    description: Local development server
  - url: https://video-automation.vercel.app
    description: Production deployment

paths:
  # Content Discovery Endpoints
  /api/posts:
    get:
      summary: Get Reddit posts with filtering
      parameters:
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/ProcessingStatus'
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of Reddit posts
          content:
            application/json:
              schema:
                type: object
                properties:
                  posts:
                    type: array
                    items:
                      $ref: '#/components/schemas/RedditPost'
                  total:
                    type: integer
    post:
      summary: Trigger Reddit scraping
      responses:
        '202':
          description: Scraping job initiated

  /api/posts/{postId}/approve:
    post:
      summary: Approve Reddit post for script generation
      parameters:
        - name: postId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Post approved successfully

  /api/scripts:
    post:
      summary: Generate script from approved Reddit post
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                post_id:
                  type: string
                duration_target:
                  type: number
                  default: 60
      responses:
        '201':
          description: Script generation initiated

  /api/scripts/{scriptId}/approve:
    post:
      summary: Approve script for asset generation
      responses:
        '200':
          description: Script approved, asset generation initiated

  /api/scripts/{scriptId}/reject:
    post:
      summary: Reject script and request regeneration
      responses:
        '200':
          description: Script rejected, regeneration queued

  /api/assets/approve-batch:
    post:
      summary: Approve all assets for video generation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                script_id:
                  type: string
      responses:
        '200':
          description: Assets approved, video rendering initiated

  /api/videos:
    get:
      summary: Get video outputs
      responses:
        '200':
          description: List of video outputs
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/VideoOutput'

  /api/videos/{videoId}/download:
    get:
      summary: Download completed video
      parameters:
        - name: videoId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Video file download
          content:
            video/mp4:
              schema:
                type: string
                format: binary

components:
  schemas:
    ProcessingStatus:
      type: string
      enum:
        - idea
        - idea_selected
        - script_generated
        - script_approved
        - script_rejected
        - assets_ready
        - rendering
        - completed
        - failed

    RedditPost:
      type: object
      properties:
        id:
          type: string
        reddit_id:
          type: string
        title:
          type: string
        content:
          type: string
        status:
          $ref: '#/components/schemas/ProcessingStatus'
        score:
          type: number
        upvotes:
          type: integer
        comments:
          type: integer

    VideoScript:
      type: object
      properties:
        id:
          type: string
        post_id:
          type: string
        script_content:
          type: string
        scene_breakdown:
          type: array
          items:
            $ref: '#/components/schemas/SceneData'
        titles:
          type: array
          items:
            type: string
        approved:
          type: boolean

    SceneData:
      type: object
      properties:
        scene_number:
          type: integer
        content:
          type: string
        keywords:
          type: array
          items:
            type: string
        emotional_tone:
          type: string
          enum: [motivational, contemplative, urgent]

    VideoAsset:
      type: object
      properties:
        id:
          type: string
        script_id:
          type: string
        scene_number:
          type: integer
        asset_type:
          type: string
          enum: [video, image]
        url:
          type: string
        approved:
          type: boolean

    VideoOutput:
      type: object
      properties:
        id:
          type: string
        post_id:
          type: string
        file_path:
          type: string
        status:
          type: string
          enum: [rendering, completed, failed]
        duration:
          type: number
```

**WebSocket Events:** Real-time updates via `/ws`

- `post_status_update` - Reddit post processing status changes
- `script_generated` - New script available for review
- `render_progress` - Video rendering progress updates
- `render_complete` - Final video ready for download
