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
   * Select minimal relevant knowledge based on context
   * Optimized to reduce token usage
   */
  selectRelevantKnowledge(query, role, page) {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(w => w.length > 2);

    // 1. Check for explicit feature mentions
    const featureNames = Object.keys(this.knowledge);
    const mentionedFeature = featureNames.find(name => 
      queryLower.includes(name) || keywords.some(kw => name.includes(kw))
    );

    if (mentionedFeature) {
      return this.formatKnowledgeCompact(this.knowledge[mentionedFeature], role);
    }

    // 2. Check page context (only if no direct match)
    const pageContext = this.getPageContext(page, role);
    if (pageContext.length > 0) {
      // Return first relevant feature from page context
      const firstFeature = Object.values(this.knowledge).find(f => f.title === pageContext[0].title);
      return this.formatKnowledgeCompact(firstFeature, role);
    }

    // 3. No specific knowledge needed - AI will use general knowledge
    return '';
  }

  /**
   * Build compressed knowledge context for prompts
   * Returns minimal, formatted text instead of raw JSON
   */
  buildKnowledgeContext(query, role, page) {
    const compactKnowledge = this.selectRelevantKnowledge(query, role, page);

    if (!compactKnowledge) {
      return ''; // No knowledge injection needed
    }

    return `\n**Relevant Feature:**\n${compactKnowledge}`;
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
