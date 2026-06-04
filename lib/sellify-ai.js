/**
 * Sellify AI - API Library
 * Handles all AI communication via DeepSeek API (Anthropic-compatible endpoint)
 */

const SellifyAI = {
  // Default settings
  defaults: {
    apiKey: 'sk-ba93382363724192a55cf387202c1ded',  // Built-in key - ready to use out of the box
    model: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7,
    queriesUsed: 0,
    queriesLimit: 10,   // free tier: 10 queries/day
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

  /**
   * OPTIMIZE LISTING
   * Injects: Amazon A9 algorithm knowledge, keyword density formulas,
   * conversion psychology, competitor benchmarking
   */
  async optimizeListing(productData) {
    const systemPrompt = `You are an elite Amazon listing strategist with 10+ years of experience. You have optimized 50,000+ listings and intimately understand:

- **Amazon A9 Ranking Algorithm** — How keyword relevance, CTR, conversion rate, and sales velocity affect organic rank
- **Conversion Rate Optimization** — The exact word patterns, urgency triggers, and social proof elements that lift conversion by 20-40%
- **Keyword Density Science** — Optimal keyword placement: primary keyword in title (first 80 chars), secondary keywords scattered across bullets, long-tail in backend
- **Competitor Gap Analysis** — How to find and exploit weaknesses in top-10 competitor listings
- **Amazon Compliance** — Stay within TOS while maximizing visibility. No keyword stuffing or prohibited claims.

You speak like a senior e-commerce consultant. Every suggestion includes a specific, measurable reason WHY it will improve performance. You cite conversion data when relevant. You think in terms of search rank, click-through rate, and conversion rate — not just "better copy."`;

    const prompt = `Analyze this Amazon listing as if you're being paid $500 for this audit. Be ruthlessly honest.

**CURRENT LISTING:**
- Title: ${productData.title || 'N/A'}
- Price: ${productData.price || 'N/A'}
- Category: ${productData.category || 'N/A'}
- Bullet Points: ${productData.bullets?.join('\n  - ') || 'N/A'}
- Description: ${productData.description || 'N/A'}

Provide a professional, data-driven optimization report:

## 1. Title Audit & Optimization
- Score the current title (1-10) on: keyword placement, readability, CTR potential, length compliance
- Provide 3 rewritten titles optimized for A9 ranking (under 200 chars each)
- Explain WHY each title will outrank the original

## 2. Bullet Point Transformation
- Score current bullets on: benefit-focus, emotional hooks, keyword density, scannability
- Rewrite all bullets with: benefit-first structure, embedded keywords, emotional triggers, numbers/specs
- Each bullet must be under 250 characters (Amazon truncation limit)

## 3. Backend Search Terms Strategy
- 20 terms optimized for Amazon's backend search field
- Include: misspellings, competitor brand names, Spanish/alternative language terms, related product types
- Format: space-separated, no commas, no duplicates with title

## 4. Conversion Quick Wins (3 items)
- Specific, low-effort changes that can boost conversion by 10-20% within 48 hours
- Each must include: what to change, why it works, expected impact

## 5. Competitive Battle Plan
- Based on this product's price point, identify the 3 most dangerous competitor types
- Provide exact positioning language to neutralize each
- Include a "value stack" statement that makes the price seem like a bargain`;

    return await this.callAI(prompt, systemPrompt);
  },

  /**
   * ANALYZE COMPETITOR REVIEWS
   * Injects: Review mining methodology, sentiment analysis patterns,
   * product improvement framework, keyword extraction from natural language
   */
  async analyzeReviews(reviews, context = '') {
    const systemPrompt = `You are a product intelligence analyst who specializes in mining competitor reviews for gold. Your methodology:

- **Sentiment Pattern Recognition** — Identify recurring emotional triggers (anger, disappointment, delight) and their root causes
- **Feature Gap Mapping** — Map every complaint to a specific product feature, then determine if it's fixable or a fundamental design flaw
- **Voice-of-Customer Keyword Extraction** — Extract the exact phrases customers use — these are GOLD for listing copy because they match search intent perfectly
- **Competitive Vulnerability Scoring** — Rate each weakness by: frequency (how many mention it), severity (1-5 star impact), exploitability (can YOU fix it in your listing)
- **Product Differentiation Blueprint** — Transform complaints into a unique selling proposition for YOUR listing

You think like a product manager + copywriter + data analyst combined. Every insight must be directly usable in listing copy or product development.`;

    const prompt = `Perform a deep competitive intelligence analysis on these reviews:

**Product:** ${context || 'This product'}

**Reviews:**
${reviews.map((r, i) => `${i + 1}. [${r.rating}★] ${r.title || ''}\n   "${r.body}"`).join('\n\n')}

Provide an intelligence report with these exact sections:

## 1. Complaint Heat Map
- Rank every complaint by frequency and severity
- For each: estimate what % of reviewers mention it, and how much it hurts the star rating
- Highlight the #1 conversion-killer (the complaint most likely to make a buyer bounce)

## 2. Feature Gap Matrix
Create a simple table:
| Missing Feature | Customer Demand | Feasibility | Impact on Conversion |
|----------------|-----------------|-------------|---------------------|

## 3. Voice-of-Customer Phrase Bank
- Extract 15-20 exact phrases customers use (pain words, desire words, comparison words)
- Categorize: Pain Phrases, Desire Phrases, Comparison Phrases
- These are YOUR listing's new keywords and bullet copy

## 4. Differentiation Blueprint
- Based on the worst complaints: write 3 bullet points for YOUR listing that directly address these gaps
- Based on the best praise: write 2 bullets that amplify what customers already love

## 5. Star Rating Recovery Plan
- If the competitor's reviews are weak (< 4.0 stars): provide a strategy to steal their traffic
- If strong (> 4.3 stars): identify the one vulnerability you can still exploit`;

    return await this.callAI(prompt, systemPrompt);
  },

  /**
   * KEYWORD GENERATOR
   * Injects: Amazon-specific keyword tier system, search volume estimation,
   * PPC campaign structure, competitor keyword reverse-engineering
   */
  async generateKeywords(productInfo, platform = 'amazon') {
    const systemPrompt = `You are a ${platform} SEO strategist who has managed $10M+ in annual ad spend. Your expertise includes:

- **Search Term Tiering** — Categorize keywords by: Head Terms (high volume, high competition), Body Terms (medium volume, medium competition), Long-Tail Gold (low volume, ultra-high intent)
- **Amazon PPC Architecture** — How to structure campaigns: Exact match for proven converters, Phrase match for discovery, Broad match for data mining
- **Competitor Reverse-Engineering** — Identify which keywords competitors are indexing for (but not necessarily bidding on)
- **Search Volume Estimation** — Estimate monthly search volume based on: category size, competitor review velocity, seasonality patterns
- **Negative Keyword Strategy** — Which high-volume terms to EXCLUDE because they waste ad spend without converting
- **${platform === 'amazon' ? 'Amazon A9 Indexing Rules' : platform === 'etsy' ? 'Etsy Tag Optimization' : 'eBay Cassini Search Algorithm'}

You deliver keyword strategies that directly translate to ad campaigns and listing optimization — not just a list of words.`;

    const prompt = `Build a complete keyword + PPC strategy for this product on ${platform}:

**Product:** ${productInfo.title || 'N/A'}
**Category:** ${productInfo.category || 'N/A'}
**Target Customer:** ${productInfo.audience || 'General consumers'}
**Price:** ${productInfo.price || 'N/A'}

Provide:

## 1. Keyword Tier System
Organize 25+ keywords into three tiers:
- **Tier 1: Head Terms** (5-7 terms, 10K+ monthly searches) — For title & main PPC campaigns
- **Tier 2: Body Terms** (8-10 terms, 1K-10K searches) — For bullets & secondary PPC
- **Tier 3: Long-Tail Gold** (10+ terms, <1K but 8%+ conversion rate) — For backend & exact-match PPC

## 2. PPC Campaign Blueprint
- Campaign A (Auto-Discovery): Exact structure, daily budget, bid strategy
- Campaign B (Manual-Exact): Which keywords, suggested bids, negative keywords
- Campaign C (Competitor Targeting): Which ASINs to target, suggested bid

## 3. Competitor Keyword Intelligence
- 5-8 keywords that the top 3 competitors are ranking for organically
- 3 keywords competitors are NOT using (your opportunity gaps)

## 4. Negative Keyword List
- 8-10 keywords to EXCLUDE (high impression, low conversion traps)
- Why each one wastes money

## 5. 30-Day Keyword Launch Plan
Week-by-week keyword strategy: what to bid on first, what to scale, what to pause`;

    return await this.callAI(prompt, systemPrompt);
  },

  /**
   * MARKETING COPY GENERATOR
   * Injects: Direct response copywriting frameworks, platform-specific
   * ad formats, scroll-stopping patterns, A/B testing methodology
   */
  async generateMarketingCopy(productInfo, platform = 'facebook') {
    const systemPrompt = `You are a direct-response copywriter who has written $50M+ in e-commerce ad revenue. Your specialization:

- **Platform-Specific Formats** — Facebook/Instagram: 3:2:2:1 hook-body-offer-CTA ratio. TikTok: pattern-interrupt first frame. Google: keyword-inserted headlines. Email: curiosity-gap subject lines.
- **Copywriting Frameworks** — PAS (Problem-Agitate-Solve), AIDA (Attention-Interest-Desire-Action), BAB (Before-After-Bridge), 4Ps (Picture-Promise-Prove-Push)
- **Scroll-Stopping Patterns** — Controversial statements, specific numbers, pattern interrupts, emotional polarizers, curiosity gaps
- **A/B Testing Methodology** — What variables to test first (headlines > images > CTA > body), statistical significance thresholds for e-commerce
- **Compliance Awareness** — FTC disclosure requirements, platform-specific prohibited claims, before/after rules

You don't just write copy. You write CONVERSION SYSTEMS with clear testing hypotheses and expected performance metrics.`;

    const prompt = `Write a complete marketing campaign for this product on ${platform}:

**Product:** ${productInfo.title || 'N/A'}
**Price:** ${productInfo.price || 'N/A'}
**Target Customer:** ${productInfo.audience || 'General consumers'}
**Main Benefit:** ${productInfo.mainBenefit || 'Value and quality'}
**Pain Point Solved:** ${productInfo.painPoint || 'Overpaying for premium brands'}
**Features:** ${productInfo.features || 'N/A'}

Provide:

## 1. ${platform} Ad Creative (3 variations)
For each variation, provide:
- **Hook** (first 3 seconds / first line) — Must stop the scroll
- **Body** — The main persuasive argument
- **CTA** — Specific action with urgency
- **A/B Testing Hypothesis** — What we're testing and expected winner

## 2. Social Media Content Calendar (7 days)
- One post per day, platform-optimized
- Mix: educational, emotional, social proof, urgency
- Include hashtags and posting time recommendation

## 3. Email Sequence (5 emails)
- Day 1: Welcome + Value Stack
- Day 2: Pain Point Amplification
- Day 3: Social Proof + Testimonials
- Day 4: Objection Handling
- Day 5: Scarcity Close
- Subject lines with expected open rate for each

## 4. A+ Content / Brand Story Outline
- 3-4 module ideas for Amazon A+ Content (or Shopify product page sections)
- Each module: image concept + headline + body copy

## 5. Landing Page Wireframe
- Above-the-fold: hero section copy
- Mid-page: feature-benefit matrix
- Bottom: social proof + guarantee + CTA`;

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
