const Journal = require('../models/Journal');

// Hardcoded motivational quotes array
const motivationalQuotes = [
  "This too shall pass.",
  "One step at a time.",
  "Storms don't last forever.",
  "You've survived 100% of your bad days.",
  "Breathe. You're stronger than you think.",
  "Healing is not linear.",
  "Progress, not perfection.",
  "Keep going, you're growing.",
  "Small steps still move forward.",
  "Rest if you must, but don't quit.",
  "Brighter days are ahead.",
  "You're allowed to start again.",
  "It's okay to not be okay.",
  "Hard times create strong people.",
  "The sun will rise tomorrow.",
  "Believe in your bounce-back.",
  "You are not your mistakes.",
  "Every setback is a setup for a comeback.",
  "Your feelings are valid.",
  "You matter, always.",
  "Even broken crayons still color.",
  "Tiny victories are victories too.",
  "Your pace is perfect.",
  "Don't let today define you.",
  "Keep moving through the fog.",
  "You're doing better than you think.",
  "Struggles are proof of effort.",
  "The best view comes after the climb.",
  "Growth hurts before it heals.",
  "Small progress is still progress.",
  "You are stronger than yesterday.",
  "Courage is trying again tomorrow.",
  "Flowers grow through dirt.",
  "It's okay to pause.",
  "Resilience is your superpower.",
  "You are not alone.",
  "Good things take time.",
  "Your story isn't over.",
  "Light follows the darkest nights.",
  "Hope is stronger than fear.",
  "Choose faith over fear.",
  "One bad day ≠ a bad life.",
  "Keep your head up.",
  "Healing takes patience.",
  "You've got this.",
  "Be kind to yourself.",
  "Strength grows in silence.",
  "Tomorrow is a fresh start.",
  "Your heart is resilient.",
  "Better days are coming."
];

// @desc    Get a random motivational quote
// @route   GET /api/quotes
// @access  Private
exports.getRandomQuote = async (req, res) => {
  try {
    // Get a random quote from the array
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const quote = motivationalQuotes[randomIndex];

    res.json({
      success: true,
      quote: quote
    });
  } catch (error) {
    console.error('Get random quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quote',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Check if user needs motivational quote based on average mood
// @route   GET /api/quotes/check
// @access  Private
exports.checkForMotivationalQuote = async (req, res) => {
  try {
    // Calculate average mood from recent journal entries (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentJournals = await Journal.find({
      user: req.user.id,
      moodRating: { $exists: true, $ne: null },
      isEncrypted: { $ne: true }, // Exclude encrypted entries
      createdAt: { $gte: sevenDaysAgo }
    });

    let needsQuote = false;
    let quote = null;
    let averageMood = null;

    if (recentJournals.length > 0) {
      // Calculate average mood from recent entries
      const moodSum = recentJournals.reduce((sum, journal) => sum + journal.moodRating, 0);
      averageMood = moodSum / recentJournals.length;

      // Show quote if average mood is <= 4 (below neutral)
      if (averageMood <= 4) {
        needsQuote = true;
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        quote = motivationalQuotes[randomIndex];
      }
    }

    res.json({
      success: true,
      needsQuote,
      quote,
      averageMood: averageMood ? Math.round(averageMood * 10) / 10 : null,
      entriesAnalyzed: recentJournals.length
    });
  } catch (error) {
    console.error('Check motivational quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking for motivational quote',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
