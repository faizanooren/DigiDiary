const Journal = require('../models/Journal');
const TodoList = require('../models/TodoList');
const BucketList = require('../models/BucketList');

// @desc    Global search across all content types
// @route   GET /api/search
// @access  Private
exports.globalSearch = async (req, res) => {
  try {
    const { query, type, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchQuery = query.trim();
    const skip = (page - 1) * limit;
    const results = {
      journals: [],
      todos: [],
      bucketList: [],
      totalResults: 0
    };

    // Create search regex for text search
    const textSearchRegex = new RegExp(searchQuery, 'i');
    
    // Try to parse as date for date-based searches
    let dateSearch = null;
    try {
      const parsedDate = new Date(searchQuery);
      if (!isNaN(parsedDate.getTime())) {
        dateSearch = {
          $gte: new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()),
          $lt: new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate() + 1)
        };
      }
    } catch (e) {
      // Not a valid date, continue with text search only
    }

    // Build search conditions
    const buildSearchConditions = (fields) => {
      const conditions = [
        ...fields.map(field => ({ [field]: textSearchRegex }))
      ];
      
      if (dateSearch) {
        conditions.push({ createdAt: dateSearch });
        conditions.push({ updatedAt: dateSearch });
      }
      
      return { $or: conditions };
    };

    // Search journals (if not filtered by type or type is 'journal')
    if (!type || type === 'journal') {
      const journalSearchConditions = {
        user: userId,
        ...buildSearchConditions(['title', 'content', 'tags'])
      };

      const journals = await Journal.find(journalSearchConditions)
        .select('title content tags date createdAt isEncrypted moodScore')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      results.journals = journals.map(journal => {
        const journalObj = journal.toObject();
        
        // Hide content for encrypted journals in search results
        if (journalObj.isEncrypted) {
          return {
            ...journalObj,
            type: 'journal',
            title: '[Protected Journal]',
            content: '[Content is password protected]',
            excerpt: '[Content is password protected]',
            tags: [], // Hide tags for encrypted journals
            matchType: 'protected'
          };
        }
        
        return {
          ...journalObj,
          type: 'journal',
          excerpt: journalObj.content ? journalObj.content.substring(0, 150) + '...' : '',
          matchType: getMatchType(journalObj, searchQuery, dateSearch)
        };
      });
    }

    // Search todos (if not filtered by type or type is 'todo')
    if (!type || type === 'todo') {
      const todoSearchConditions = {
        userId: userId, // TodoList uses userId, not user
        ...buildSearchConditions(['task']) // TodoList uses task, not title
      };

      const todos = await TodoList.find(todoSearchConditions)
        .select('task priority dueDate isCompleted createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      results.todos = todos.map(todo => {
        const todoObj = todo.toObject();
        return {
          ...todoObj,
          type: 'todo',
          title: todoObj.task, // Map task to title for consistency
          excerpt: todoObj.task ? todoObj.task.substring(0, 150) + '...' : '',
          matchType: getMatchType(todoObj, searchQuery, dateSearch)
        };
      });
    }

    // Search bucket list (if not filtered by type or type is 'bucketlist')
    if (!type || type === 'bucketlist') {
      const bucketSearchConditions = {
        userId: userId, // BucketList uses userId, not user
        ...buildSearchConditions(['title', 'description'])
      };

      const bucketItems = await BucketList.find(bucketSearchConditions)
        .select('title description isCompleted targetDate createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      results.bucketList = bucketItems.map(item => ({
        ...item.toObject(),
        type: 'bucketlist',
        excerpt: item.description ? item.description.substring(0, 150) + '...' : '',
        matchType: getMatchType(item, searchQuery, dateSearch)
      }));
    }

    // Calculate total results
    results.totalResults = results.journals.length + results.todos.length + results.bucketList.length;

    // Combine and sort all results by relevance and date
    const allResults = [
      ...results.journals,
      ...results.todos,
      ...results.bucketList
    ].sort((a, b) => {
      // Prioritize exact title matches
      if (a.matchType === 'title' && b.matchType !== 'title') return -1;
      if (b.matchType === 'title' && a.matchType !== 'title') return 1;
      
      // Then sort by date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      query: searchQuery,
      results: {
        ...results,
        combined: allResults.slice(0, limit)
      },
      pagination: {
        currentPage: parseInt(page),
        totalResults: results.totalResults,
        hasMore: results.totalResults > (page * limit)
      }
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to determine what type of match was found
const getMatchType = (item, searchQuery, dateSearch) => {
  const query = searchQuery.toLowerCase();
  
  if (item.title && item.title.toLowerCase().includes(query)) {
    return 'title';
  }
  if (item.task && item.task.toLowerCase().includes(query)) {
    return 'task';
  }
  if (item.content && item.content.toLowerCase().includes(query)) {
    return 'content';
  }
  if (item.description && item.description.toLowerCase().includes(query)) {
    return 'description';
  }
  if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))) {
    return 'tag';
  }
  if (item.category && item.category.toLowerCase().includes(query)) {
    return 'category';
  }
  if (dateSearch) {
    return 'date';
  }
  
  return 'other';
};
