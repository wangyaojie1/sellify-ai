/**
 * Sellify AI - API Library
 * Handles all AI communication via DeepSeek API (Anthropic-compatible endpoint)
 */

const SellifyAI = {
  // Default settings
  defaults: {
    apiKey: '',
    model: 'deepseek-v4-pro',
    maxTokens: 4096,
    temperature: 0.7,
    queriesUsed: 0,
    queriesLimit: 5,    // free tier: 5 queries/day
    plan: 'free',       // free | pro
    lastResetDate: new Date().toDateString()
  },

  // Get settings from storage
  async getSettings() {
    const result = await chrome.storage.sync.get(Object.keys(this.defaults));
    const settings = { ...this.defaults, ...result };

    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (settings.lastResetDate !== today) {
      settings.queriesUsed = 0;
      settings.lastResetDate = today;
      await chrome.storage.sync.set({ queriesUsed: 0, lastResetDate: today });
    }

    return settings;
  },

  // Check if user has remaining queries
  async canQuery() {
    const settings = await this.getSettings();
    if (settings.plan === 'pro') return true;
    return settings.queriesUsed < settings.queriesLimit;
  },

  // Increment query counter
  async incrementQuery() {
    const settings = await this.getSettings();
    settings.queriesUsed++;
    await chrome.storage.sync.set({ queriesUsed: settings.queriesUsed });
  },

  // Main AI call
  async callAI(prompt, systemPrompt = '', options = {}) {
    const settings = await this.getSettings();

    if (!settings.apiKey) {
      throw new Error('Please set your API key in the extension options.');
    }

    if (!(await this.canQuery())) {
      throw new Error('Daily free queries exhausted. Upgrade to Pro for unlimited access.');
    }

    const body = {
      model: settings.model,
      max_tokens: options.maxTokens || settings.maxTokens,
      temperature: options.temperature || settings.temperature,
      messages: []
    };

    if (systemPrompt) {
      body.messages.push({ role: 'system', content: systemPrompt });
    }

    body.messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    await this.incrementQuery();

    return data.choices[0].message.content;
  },

  // --- Specialized AI Functions ---

  // Analyze and optimize a product listing
  async optimizeListing(productData) {
    const systemPrompt = `You are an expert e-commerce listing optimizer. You help sellers improve their product titles, descriptions, bullet points, and backend keywords to increase conversion rates and search visibility. Always provide actionable, specific suggestions. Format your response with clear sections using markdown.`;

    const prompt = `Analyze this product listing and provide optimization suggestions:

**Current Listing:**
- Title: ${productData.title || 'N/A'}
- Price: ${productData.price || 'N/A'}
- Category: ${productData.category || 'N/A'}
- Description: ${productData.description || 'N/A'}
- Bullet Points: ${productData.bullets?.join('\n  • ') || 'N/A'}

Please provide:
1. **Title Optimization** - Suggest 3 improved titles with better keywords (keep under 200 chars each)
2. **Bullet Points** - Rewrite bullet points to be more benefit-focused and keyword-rich (5 bullets)
3. **Description** - Write a compelling product description that converts (2-3 paragraphs)
4. **Backend Search Terms** - List 15-20 high-value search terms for backend
5. **Quick Wins** - 3 immediate fixes that will boost conversion rate`;

    return await this.callAI(prompt, systemPrompt);
  },

  // Analyze competitor reviews to find gaps and opportunities
  async analyzeReviews(reviews, context = '') {
    const systemPrompt = `You are an expert at analyzing e-commerce product reviews to identify market opportunities. Extract common complaints, unmet needs, and feature requests that sellers can use to improve their own products or create better listings.`;

    const prompt = `Analyze these competitor product reviews and extract actionable insights:

**Product Context:** ${context || 'General e-commerce product'}

**Reviews:**
${reviews.map((r, i) => `${i + 1}. [${r.rating}★] ${r.title || ''}\n   "${r.body}"`).join('\n\n')}

Please provide:
1. **Top Complaints** - Most frequent issues customers mention (ranked by frequency)
2. **Unmet Needs** - What customers wish the product had
3. **Praise Points** - What customers love (use these in your own listing)
4. **Keyword Goldmine** - Extract exact phrases customers use to describe the product
5. **Listing Improvement Strategy** - How to position YOUR product against these reviews`;

    return await this.callAI(prompt, systemPrompt);
  },

  // Generate high-performing keywords
  async generateKeywords(productInfo, platform = 'amazon') {
    const systemPrompt = `You are an SEO expert specializing in ${platform} search optimization. You know exactly what keywords drive traffic and conversions on ${platform}. Focus on high-intent, buyer keywords.`;

    const prompt = `Generate a comprehensive keyword strategy for this product:

**Product:** ${productInfo.title || 'N/A'}
**Category:** ${productInfo.category || 'N/A'}
**Target Audience:** ${productInfo.audience || 'General consumers'}
**Key Features:** ${productInfo.features || 'N/A'}
**Price Point:** ${productInfo.price || 'N/A'}

Provide:
1. **Primary Keywords** (5-8 high-volume, high-intent keywords)
2. **Long-Tail Keywords** (15-20 specific, buyer-intent phrases)
3. **Competitor Keywords** (terms competitors are likely ranking for)
4. **Seasonal/Trending Keywords** (if applicable)
5. **Keyword Grouping Strategy** - How to organize these in your listing
6. **Avoid These Keywords** - High-volume but low-conversion terms to skip`;

    return await this.callAI(prompt, systemPrompt);
  },

  // Generate ad copy / social media content for the product
  async generateMarketingCopy(productInfo, platform = 'facebook') {
    const systemPrompt = `You are a direct-response copywriter who specializes in ${platform} ads for e-commerce products. You write copy that converts browsers into buyers. Use proven copywriting formulas (PAS, AIDA, etc.).`;

    const prompt = `Write high-converting marketing copy for this product:

**Product:** ${productInfo.title || 'N/A'}
**Price:** ${productInfo.price || 'N/A'}
**Target Customer:** ${productInfo.audience || 'General consumers'}
**Main Benefit:** ${productInfo.mainBenefit || 'N/A'}
**Pain Point Solved:** ${productInfo.painPoint || 'N/A'}
**Key Features:**
${productInfo.features || '• N/A'}

Generate:
1. **${platform} Ad Copy** (3 variations: primary text + headline + description)
2. **Instagram/TikTok Caption** (2 variations with hashtags)
3. **Email Subject Lines** (5 options for a promotional email)
4. **A+ Content / Enhanced Brand Content** (brief section ideas)
5. **Customer Avatar** - Quick description of the ideal buyer`;

    return await this.callAI(prompt, systemPrompt);
  },

  // Scrape product data from the current page
  async scrapeProductFromPage(platform) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (platform) => {
        const data = { platform, url: window.location.href };

        switch (platform) {
          case 'amazon':
            data.title = document.querySelector('#productTitle')?.textContent?.trim() || '';
            data.price = document.querySelector('.a-price .a-offscreen')?.textContent?.trim() ||
                         document.querySelector('#price_inside_buybox')?.textContent?.trim() || '';
            data.rating = document.querySelector('#acrPopover .a-icon-alt')?.textContent?.trim() || '';
            data.reviewCount = document.querySelector('#acrCustomerReviewText')?.textContent?.trim() || '';
            data.category = Array.from(document.querySelectorAll('#wayfinding-breadcrumbs_feature_div a'))
              .map(a => a.textContent.trim()).join(' > ') || '';
            data.bullets = Array.from(document.querySelectorAll('#feature-bullets li'))
              .map(li => li.textContent.trim()).filter(Boolean);
            data.description = document.querySelector('#productDescription p')?.textContent?.trim() || '';
            data.images = Array.from(document.querySelectorAll('#altImages img'))
              .map(img => img.src).filter(Boolean).slice(0, 5);
            break;

          case 'ebay':
            data.title = document.querySelector('.it-ttl')?.textContent?.trim() ||
                         document.querySelector('h1[itemprop="name"]')?.textContent?.trim() || '';
            data.price = document.querySelector('[itemprop="price"]')?.getAttribute('content') ||
                         document.querySelector('.vi-price')?.textContent?.trim() || '';
            data.description = document.querySelector('[data-testid="item-description"]')?.textContent?.trim() || '';
            break;

          case 'etsy':
            data.title = document.querySelector('[data-buy-box-region="title"]')?.textContent?.trim() || '';
            data.price = document.querySelector('[data-buy-box-region="price"]')?.textContent?.trim() || '';
            data.description = document.querySelector('[data-id="description-text"]')?.textContent?.trim() || '';
            break;

          case 'aliexpress':
            data.title = document.querySelector('.product-title-text')?.textContent?.trim() || '';
            data.price = document.querySelector('.product-price-value')?.textContent?.trim() || '';
            data.description = document.querySelector('.detail-desc')?.textContent?.trim() || '';
            break;
        }

        return data;
      },
      args: [platform]
    });

    return results[0]?.result || {};
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined') module.exports = SellifyAI;
