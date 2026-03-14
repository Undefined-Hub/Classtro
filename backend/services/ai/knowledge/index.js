const fs = require('fs');
const path = require('path');

class KnowledgeBase {
  constructor() {
    this.knowledge = {};
    this.loadAllKnowledge();
  }

  loadAllKnowledge() {
    try {
      const featuresPath = path.join(__dirname, 'features');
      
      if (!fs.existsSync(featuresPath)) {
        console.warn('Knowledge base features directory not found');
        return;
      }

      const files = fs.readdirSync(featuresPath).filter(f => f.endsWith('.json'));
      
      files.forEach(file => {
        try {
          const filePath = path.join(featuresPath, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const key = file.replace('.json', '');
          this.knowledge[key] = content;
        } catch (error) {
          console.error(`Error loading knowledge file ${file}:`, error.message);
        }
      });

      console.log(`✓ Loaded ${Object.keys(this.knowledge).length} knowledge base files`);
    } catch (error) {
      console.error('Error loading knowledge base:', error.message);
    }
  }

  getFeatureKnowledge(featureName, role) {
    const feature = this.knowledge[featureName];
    if (!feature) return null;
    
    const roleContent = feature[role];
    if (!roleContent) return null;

    return {
      title: feature.title,
      description: feature.description,
      overview: roleContent.overview,
      howTo: roleContent.howTo || null,
      tips: roleContent.tips || null,
      canDo: roleContent.canDo || null,
      cannotDo: roleContent.cannotDo || null,
      relatedFeatures: feature.relatedFeatures || []
    };
  }

  searchKnowledge(query, role) {
    if (!query || typeof query !== 'string') return [];

    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(w => w.length > 2);
    
    // Quick feature name matching first
    const featureNames = Object.keys(this.knowledge);
    const matchedFeature = featureNames.find(name => 
      queryLower.includes(name) || keywords.some(kw => name.includes(kw))
    );

    if (matchedFeature) {
      const item = this.knowledge[matchedFeature];
      const roleContent = item[role];
      if (roleContent) {
        return [{
          feature: matchedFeature,
          title: item.title,
          overview: roleContent.overview,
          tips: roleContent.tips?.slice(0, 3) || null
        }];
      }
    }

    // Fallback: simple title/description match
    const results = [];
    Object.keys(this.knowledge).forEach(key => {
      const item = this.knowledge[key];
      const roleContent = item[role];
      if (!roleContent) return;

      let score = 0;
      if (item.title.toLowerCase().includes(queryLower)) score += 50;
      if (item.description.toLowerCase().includes(queryLower)) score += 30;
      
      keywords.forEach(kw => {
        if (item.title.toLowerCase().includes(kw)) score += 10;
      });

      if (score > 0) {
        results.push({
          feature: key,
          title: item.title,
          overview: roleContent.overview,
          tips: roleContent.tips?.slice(0, 2) || null
        });
      }
    });

    return results.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 2);
  }

  getPageContext(page, role) {
    const pageMapping = {
      'dashboard': ['rooms', 'sessions'],
      'session': ['sessions', 'polls', 'qna', 'feedback'],
      'room': ['rooms', 'sessions'],
      'analytics': ['sessions', 'polls', 'feedback'],
      'host': ['rooms', 'sessions', 'polls', 'qna'],
      'participant': ['sessions', 'polls', 'qna', 'feedback']
    };

    const relevantFeatures = pageMapping[page?.toLowerCase()] || ['rooms', 'sessions'];
    
    return relevantFeatures
      .map(feature => this.getFeatureKnowledge(feature, role))
      .filter(Boolean)
      .slice(0, 2);
  }

  /**
   * Format JSON knowledge into compressed bullet text for efficient token usage
   */
  formatKnowledgeCompact(featureData, role) {
    if (!featureData) return '';

    const roleContent = featureData[role];
    if (!roleContent) return '';

    let formatted = `• ${featureData.title}: ${roleContent.overview}\n`;

    // Add concise tips (max 3)
    if (roleContent.tips && roleContent.tips.length > 0) {
      const topTips = roleContent.tips.slice(0, 3);
      formatted += `  Tips: ${topTips.join(' | ')}\n`;
    }

    // Add key capabilities (max 4)
    if (roleContent.canDo && roleContent.canDo.length > 0) {
      const capabilities = roleContent.canDo.slice(0, 4).join(', ');
      formatted += `  Can: ${capabilities}\n`;
    }

    return formatted;
  }

  /**
   * Detect topic from user message and return matched feature names
   * Supports both explicit mentions and semantic matching
   */
  detectTopics(query) {
    const queryLower = query.toLowerCase();
    const topics = [];

    // Topic detection patterns
    const patterns = {
      rooms: ['room', 'classroom', 'create room', 'join room', 'room code'],
      sessions: ['session', 'class', 'live session', 'join session', 'start session', 'session code'],
      polls: ['poll', 'quiz', 'survey', 'vote', 'multiple choice', 'question'],
      qna: ['q&a', 'question', 'ask', 'answer', 'upvote'],
      feedback: ['feedback', 'rating', 'review', 'comment', 'emoji']
    };

    // Check each pattern
    Object.keys(patterns).forEach(topic => {
      if (patterns[topic].some(pattern => queryLower.includes(pattern))) {
        topics.push(topic);
      }
    });

    // Fallback: check for direct feature name mention
    if (topics.length === 0) {
      const featureNames = Object.keys(this.knowledge);
      featureNames.forEach(name => {
        if (queryLower.includes(name)) {
          topics.push(name);
        }
      });
    }

    return topics.slice(0, 2); // Max 2 topics to keep context small
  }

  /**
   * Get relevant knowledge dynamically based on user intent
   * Converts JSON knowledge into compressed readable text
   * Max context length: 1000-1500 characters
   */
  getRelevantKnowledge(userMessage, role = 'guest', page = 'general') {
    const topics = this.detectTopics(userMessage);
    
    // If no specific topic detected, check page context
    if (topics.length === 0 && page !== 'general') {
      const pageContext = this.getPageContext(page, role);
      if (pageContext.length > 0) {
        topics.push(pageContext[0].feature);
      }
    }

    // Still no topics? Return empty (generic AI response)
    if (topics.length === 0) {
      return '';
    }

    // Build compressed knowledge text
    let knowledgeText = '';
    let charCount = 0;
    const MAX_CHARS = 1500;

    topics.forEach(topic => {
      const featureData = this.knowledge[topic];
      if (!featureData || charCount >= MAX_CHARS) return;

      const roleContent = featureData[role] || featureData['guest'];
      if (!roleContent) return;

      // Build structured knowledge block
      let block = `## ${featureData.title}\n`;
      block += `${roleContent.overview}\n\n`;

      // Add how-to steps if available (compressed)
      if (roleContent.howTo) {
        const howToKeys = Object.keys(roleContent.howTo);
        if (howToKeys.length > 0) {
          block += `**How to:**\n`;
          const firstAction = howToKeys[0];
          const steps = roleContent.howTo[firstAction];
          if (Array.isArray(steps)) {
            steps.slice(0, 4).forEach((step, i) => {
              block += `${i + 1}. ${step}\n`;
            });
          }
          block += `\n`;
        }
      }

      // Add key capabilities (max 5)
      if (roleContent.canDo && roleContent.canDo.length > 0) {
        block += `**Key features:**\n`;
        roleContent.canDo.slice(0, 5).forEach(item => {
          block += `• ${item}\n`;
        });
        block += `\n`;
      }

      // Add tips (max 3)
      if (roleContent.tips && roleContent.tips.length > 0) {
        block += `**Tips:**\n`;
        roleContent.tips.slice(0, 3).forEach(tip => {
          block += `• ${tip}\n`;
        });
        block += `\n`;
      }

      // Check length and add block
      if (charCount + block.length <= MAX_CHARS) {
        knowledgeText += block;
        charCount += block.length;
      }
    });

    return knowledgeText.trim();
  }

  /**
   * Build knowledge context for prompts (new structured format)
   * Returns filtered knowledge in CONTEXT section format
   */
  buildKnowledgeContext(query, role, page) {
    const knowledge = this.getRelevantKnowledge(query, role, page);
    
    if (!knowledge) {
      return ''; // No knowledge injection
    }

    return knowledge;
  }

  getAllFeatures() {
    return Object.keys(this.knowledge);
  }

  reloadKnowledge() {
    this.knowledge = {};
    this.loadAllKnowledge();
    return Object.keys(this.knowledge).length;
  }
}

const knowledgeBase = new KnowledgeBase();

module.exports = {
  getFeatureKnowledge: (feature, role) => knowledgeBase.getFeatureKnowledge(feature, role),
  searchKnowledge: (query, role) => knowledgeBase.searchKnowledge(query, role),
  getPageContext: (page, role) => knowledgeBase.getPageContext(page, role),
  buildKnowledgeContext: (query, role, page) => knowledgeBase.buildKnowledgeContext(query, role, page),
  getAllFeatures: () => knowledgeBase.getAllFeatures(),
  reloadKnowledge: () => knowledgeBase.reloadKnowledge()
};
