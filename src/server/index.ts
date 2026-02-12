import { Devvit, RedisClient } from '@devvit/public-api';

// Curated artifact pool from r/MuseumOfReddit
const ARTIFACT_POOL: Artifact[] = [
  {
    id: '7szmue',
    name: 'Poop Knife',
    originalSubreddit: 'MuseumOfReddit',
    description: 'A legendary artifact known as the fecal cleaver.',
    riddle: 'I am a blade forged in the fires of internet legend, wielded by a king of memes. My edge cuts through the mundane, leaving behind a trail of... well, you know.',
    hint: 'Think of a famous Reddit post involving a knife and some unfortunate circumstances.',
    imageUrl: 'https://i.imgur.com/placeholder1.jpg', // Placeholder, replace with actual
    lore: 'The Poop Knife is one of the most infamous artifacts in Reddit history, originating from a post that went viral for its sheer absurdity and the ensuing drama.',
    year: '2013',
    redditUrl: 'https://www.reddit.com/r/MuseumOfReddit/comments/7szmue/the_poop_knife/'
  },
  {
    id: '7c5293',
    name: 'Pride and Accomplishment',
    originalSubreddit: 'MuseumOfReddit',
    description: 'EA\'s infamous "Pride and Accomplishment" email.',
    riddle: 'I am a message from the corporate overlords, boasting of achievements while the masses suffer. My words drip with irony, celebrating victory in defeat.',
    hint: 'Remember the EA layoffs and the email that mocked the fired employees.',
    imageUrl: 'https://i.imgur.com/placeholder2.jpg',
    lore: 'This email from EA executives became a symbol of corporate arrogance, highlighting the disconnect between management and employees.',
    year: '2004',
    redditUrl: 'https://www.reddit.com/r/MuseumOfReddit/comments/7c5293/pride_and_accomplishment/'
  },
  {
    id: 'cbat',
    name: 'CBAT Story',
    originalSubreddit: 'MuseumOfReddit',
    description: 'The Complete Bullshit Artist Toolkit story.',
    riddle: 'I am a tale of deception and artistry, where one man\'s lies built an empire of fools. My chapters unfold like a masterclass in manipulation.',
    hint: 'A long-form story about a con artist who scammed people with fake credentials.',
    imageUrl: 'https://i.imgur.com/placeholder3.jpg',
    lore: 'The CBAT story is a gripping narrative of fraud and redemption, showcasing the depths of human ingenuity and deceit.',
    year: '2014',
    redditUrl: 'https://www.reddit.com/r/MuseumOfReddit/comments/cbat/the_complete_bullshit_artist_toolkit/'
  }
  // Add more artifacts as needed
];

interface Artifact {
  id: string;
  name: string;
  originalSubreddit: string;
  description: string;
  riddle: string;
  hint: string;
  imageUrl?: string;
  lore: string;
  year: string;
  redditUrl: string;
}

async function getDailyArtifact(redis: RedisClient): Promise<Artifact> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lastUpdateKey = 'daily_artifact_last_update';
  const currentArtifactKey = 'daily_artifact_id';

  const lastUpdate = await redis.get(lastUpdateKey);
  let currentId: string;

  if (lastUpdate !== today) {
    // Rotate to new artifact
    const currentIndex = await redis.get(currentArtifactKey);
    let nextIndex = 0;
    if (currentIndex) {
      nextIndex = (parseInt(currentIndex) + 1) % ARTIFACT_POOL.length;
    }
    currentId = ARTIFACT_POOL[nextIndex].id;
    await redis.set(currentArtifactKey, nextIndex.toString());
    await redis.set(lastUpdateKey, today);
  } else {
    // Get current
    const index = await redis.get(currentArtifactKey);
    currentId = ARTIFACT_POOL[parseInt(index || '0')].id;
  }

  const artifact = ARTIFACT_POOL.find(a => a.id === currentId);
  if (!artifact) {
    throw new Error('Artifact not found');
  }
  return artifact;
}

export default Devvit.addCustomPostType({
  name: 'MuseumMystery',
  render: (context) => {
    // This would render the GameMaker game in the webview
    return context.ui.renderWebView({
      url: 'index.html', // The GameMaker HTML
      height: 'tall'
    });
  },
  onCreate: async (event, context) => {
    // Initialize Redis if needed
  }
});

Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (_, context) => {
    // Initialize daily artifact
    await context.redis.set('daily_artifact_id', '0');
    await context.redis.set('daily_artifact_last_update', new Date().toISOString().split('T')[0]);
  }
});

Devvit.addMenuItem({
  label: 'Create Museum Mystery Post',
  location: 'subreddit',
  onPress: async (event, context) => {
    await context.reddit.submitPost({
      subredditName: event.subredditName,
      title: 'Museum Mystery: The Daily Artifact',
      preview: Devvit.customPostType.get('MuseumMystery')
    });
  }
});

// Server endpoint
Devvit.addWebViewHandler({
  route: '/api/get-daily-artifact',
  handler: async (request, context) => {
    try {
      const artifact = await getDailyArtifact(context.redis);
      return {
        success: true,
        data: {
          id: artifact.id,
          name: artifact.name,
          riddle: artifact.riddle,
          hint: artifact.hint,
          imageUrl: artifact.imageUrl,
          lore: artifact.lore,
          year: artifact.year,
          redditUrl: artifact.redditUrl,
          originalSubreddit: artifact.originalSubreddit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

// Endpoint for submitting high score
Devvit.addWebViewHandler({
  route: '/api/submit-score',
  handler: async (request, context) => {
    const { username, score } = request.body;
    // Store in Redis sorted set
    await context.redis.zadd('high_scores', { member: username, score });
    return { success: true };
  }
});

// Endpoint for getting high scores
Devvit.addWebViewHandler({
  route: '/api/get-high-scores',
  handler: async (request, context) => {
    const scores = await context.redis.zrange('high_scores', 0, 9, { reverse: true, withScores: true });
    return {
      success: true,
      data: scores.map(([member, score]) => ({ username: member, score: parseInt(score) }))
    };
  }
});
