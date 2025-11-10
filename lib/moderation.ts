// Content moderation utilities
// Detects spam, scams, and inappropriate content
// Integrates with ProhibitedItem database and FlaggedContent queue

import { sbServer } from './supabase/server'
import type { Database } from './supabase/databaseTypes'

type ProhibitedItemRow = Database['public']['Tables']['ProhibitedItem']['Row']
type FlaggedContentInsert = Database['public']['Tables']['FlaggedContent']['Insert']

// Enhanced spam/scam keywords and patterns
const SPAM_KEYWORDS = [
  // Scams & Financial Fraud
  'send money first', 'wire transfer', 'western union', 'moneygram', 'cashapp me',
  'venmo first', 'zelle first', 'pay before meeting', 'bitcoin', 'cryptocurrency',
  'send gift card', 'itunes card', 'amazon gift', 'google play card', 'prepaid card',
  'bank transfer', 'paypal friends family', 'crypto wallet', 'cash only no meetup',
  'shipping fee required', 'deposit required', 'processing fee',
  
  // Too good to be true / MLM
  'guaranteed income', 'work from home', 'make $$$', 'easy money', 'get rich quick',
  'limited time offer', 'act now', 'click here now', 'make money fast',
  'passive income', 'be your own boss', 'financial freedom', 'residual income',
  'multilevel marketing', 'pyramid scheme', 'join my team',
  
  // Phishing & Account Scams
  'verify your account', 'confirm your identity', 'update payment', 'verify now',
  'suspended account', 'unusual activity', 'security alert', 'account locked',
  'urgent action required', 'click to verify', 'confirm email',
  
  // External links (risky)
  'click this link', 'bit.ly', 'tinyurl', 'goo.gl', 'short.link', 'rebrand.ly',
  'follow link', 'go to website', 'visit site', 'check out my website',
  
  // Contact outside platform
  'text me at', 'call me at', 'email me at', 'whatsapp me', 'telegram me',
  'message me on instagram', 'dm me on twitter', 'add me on snap', 'kik me',
  'discord server', 'off platform', 'contact outside',
  
  // Fake urgency
  'only today', 'expires soon', 'while supplies last', 'first come first serve',
  'limited quantity', 'must sell now', 'selling fast', 'wont last',
  
  // Investment scams
  'investment opportunity', 'double your money', 'guaranteed returns',
  'trading signals', 'forex trading', 'binary options', 'pump and dump',
];

// Profanity and inappropriate terms (basic list - expand as needed)
const PROFANITY_KEYWORDS = [
  // Add common profanity here - keeping family friendly for now
  'f*ck', 'sh*t', 'b*tch', 'a**hole', 'd*mn',
  // Slurs and hate speech
  // Sexual content
  'xxx', 'porn', 'nude', 'nudes', 'sex',
];

// Suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\$\d+[.,]?\d*\s*(USD|usd|dollars?)\s*per\s*(hour|day|week)/gi, // Suspicious pricing
  /https?:\/\//g, // URLs (may be legitimate for marketplace)
];

export interface ModerationResult {
  isClean: boolean;
  flags: string[];
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
}

/**
 * Check text content for spam, scams, and inappropriate content
 */
export function moderateText(text: string): ModerationResult {
  const normalizedText = text.toLowerCase().trim();
  const flags: string[] = [];
  const reasons: string[] = [];

  // Check for spam keywords
  for (const keyword of SPAM_KEYWORDS) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      flags.push('spam');
      reasons.push(`Contains spam keyword: "${keyword}"`);
    }
  }

  // Check for profanity
  for (const word of PROFANITY_KEYWORDS) {
    if (normalizedText.includes(word.toLowerCase())) {
      flags.push('profanity');
      reasons.push(`Contains inappropriate language`);
    }
  }

  // Check for suspicious patterns
  const phoneMatches = text.match(SUSPICIOUS_PATTERNS[0]);
  if (phoneMatches && phoneMatches.length > 0) {
    flags.push('contact_info');
    reasons.push('Contains phone number (keep contact on platform)');
  }

  const emailMatches = text.match(SUSPICIOUS_PATTERNS[1]);
  if (emailMatches && emailMatches.length > 0) {
    flags.push('contact_info');
    reasons.push('Contains email address (keep contact on platform)');
  }

  const urlMatches = text.match(SUSPICIOUS_PATTERNS[3]);
  if (urlMatches && urlMatches.length > 2) {
    flags.push('suspicious_links');
    reasons.push('Contains multiple external links');
  }

  // Determine confidence level
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (flags.length >= 3) {
    confidence = 'high';
  } else if (flags.length >= 1) {
    confidence = 'medium';
  }

  // Remove duplicates
  const uniqueFlags = [...new Set(flags)];
  const uniqueReasons = [...new Set(reasons)];

  return {
    isClean: uniqueFlags.length === 0,
    flags: uniqueFlags,
    confidence,
    reasons: uniqueReasons,
  };
}

/**
 * Check image URL for NSFW content using external API
 * Note: Requires setup of an image moderation service
 */
export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  // TODO: Integrate with image moderation API
  // Options:
  // 1. Cloudflare AI Workers (free tier)
  // 2. Sightengine (paid, very accurate)
  // 3. AWS Rekognition (pay per use)
  // 4. Google Cloud Vision API (pay per use)

  // For now, return clean (implement later)
  console.log('⚠️ Image moderation not implemented yet:', imageUrl);
  
  return {
    isClean: true,
    flags: [],
    confidence: 'low',
    reasons: ['Image moderation not configured'],
  };
}

/**
 * Enhanced spam score calculation for a listing
 */
export function calculateSpamScore(listing: {
  title: string;
  description: string;
  priceCents: number;
}): number {
  let score = 0;

  // Check title (weighted higher)
  const titleResult = moderateText(listing.title);
  score += titleResult.flags.length * 25; // Increased from 20
  if (titleResult.confidence === 'high') score += 20;

  // Check description
  const descResult = moderateText(listing.description);
  score += descResult.flags.length * 20; // Increased from 15
  if (descResult.confidence === 'high') score += 15;

  // Suspicious pricing
  if (listing.priceCents === 0) {
    score += 5; // Free items might be spam (reduced to avoid false positives)
  }
  if (listing.priceCents > 1000000) { // > $10,000
    score += 35; // Unrealistic pricing (increased)
  }
  if (listing.priceCents === 1 || listing.priceCents === 100) {
    score += 10; // $0.01 or $1.00 is suspicious
  }

  // All caps title (SCREAMING)
  if (listing.title === listing.title.toUpperCase() && listing.title.length > 5) {
    score += 20; // Increased from 15
  }

  // Excessive punctuation
  const exclamationCount = (listing.title.match(/!/g) || []).length;
  const questionCount = (listing.title.match(/\?/g) || []).length;
  if (exclamationCount > 3) score += 15;
  if (questionCount > 2) score += 10;
  
  // Dollar signs ($$$ often indicates spam)
  const dollarSignCount = (listing.title.match(/\$/g) || []).length;
  if (dollarSignCount > 2) score += 15;
  
  // Emoji spam
  const emojiCount = (listing.title.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
  if (emojiCount > 3) score += 10;
  
  // Short descriptions (spam often has minimal text)
  if (listing.description.length < 20) {
    score += 15;
  }
  
  // Repetitive text
  const words = listing.description.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 20 && uniqueWords.size / words.length < 0.5) {
    score += 20; // More than 50% repeated words
  }
  
  // Suspicious contact patterns
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(listing.description)) {
    score += 25; // Phone number in description
  }
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(listing.description)) {
    score += 25; // Email in description
  }

  return Math.min(score, 100);
}

/**
 * Check if content should be auto-rejected
 */
export function shouldAutoReject(moderationResult: ModerationResult): boolean {
  // Auto-reject high confidence spam/profanity
  if (moderationResult.confidence === 'high' && moderationResult.flags.length >= 2) {
    return true;
  }

  // Auto-reject if contains multiple red flags
  const criticalFlags = ['spam', 'profanity', 'suspicious_links'];
  const criticalFlagCount = moderationResult.flags.filter(f => 
    criticalFlags.includes(f)
  ).length;

  return criticalFlagCount >= 2;
}

/**
 * Check if content should be flagged for manual review
 */
export function shouldFlagForReview(moderationResult: ModerationResult): boolean {
  // Flag medium confidence issues
  if (moderationResult.confidence === 'medium' && moderationResult.flags.length > 0) {
    return true;
  }

  // Flag if contains contact info (common in scams)
  if (moderationResult.flags.includes('contact_info')) {
    return true;
  }

  return false;
}

/**
 * Enhanced moderation: Check text against database prohibited items
 * Returns moderation result with matched database patterns
 */
export async function moderateTextWithDatabase(
  text: string
): Promise<ModerationResult & { matchedProhibited?: ProhibitedItemRow[] }> {
  // Start with basic text moderation
  const basicResult = moderateText(text)
  
  try {
    const supabase = await sbServer()
    
    // Fetch active prohibited items
    const { data: prohibitedItems, error } = await supabase
      .from('ProhibitedItem')
      .select('*')
      .eq('isActive', true)
    
    if (error || !prohibitedItems) {
      console.error('Failed to fetch prohibited items:', error)
      return basicResult // Fallback to basic moderation
    }
    
    const matchedProhibited: ProhibitedItemRow[] = []
    const normalizedText = text.toLowerCase()
    
    for (const item of prohibitedItems) {
      let isMatch = false
      
      if (item.type === 'keyword') {
        // Exact keyword match (case-insensitive)
        isMatch = normalizedText.includes(item.pattern.toLowerCase())
      } else if (item.type === 'regex') {
        // Regex pattern match
        try {
          const regex = new RegExp(item.pattern, 'gi')
          isMatch = regex.test(text)
        } catch (e) {
          console.error(`Invalid regex pattern: ${item.pattern}`, e)
        }
      } else if (item.type === 'url_pattern') {
        // URL pattern match
        try {
          const regex = new RegExp(item.pattern, 'gi')
          isMatch = regex.test(text)
        } catch (e) {
          console.error(`Invalid URL pattern: ${item.pattern}`, e)
        }
      }
      
      if (isMatch) {
        matchedProhibited.push(item)
        basicResult.flags.push(item.category || 'prohibited')
        basicResult.reasons.push(item.description || `Matched prohibited pattern: ${item.pattern}`)
      }
    }
    
    // Upgrade confidence based on database matches
    if (matchedProhibited.length > 0) {
      const hasCritical = matchedProhibited.some(item => item.severity === 'critical')
      const hasHigh = matchedProhibited.some(item => item.severity === 'high')
      
      if (hasCritical) {
        basicResult.confidence = 'high'
      } else if (hasHigh && basicResult.confidence === 'low') {
        basicResult.confidence = 'medium'
      }
      
      basicResult.isClean = false
    }
    
    return {
      ...basicResult,
      matchedProhibited,
    }
  } catch (error) {
    console.error('Database moderation error:', error)
    return basicResult // Fallback to basic moderation
  }
}

/**
 * Create a flagged content record in the database
 */
export async function createFlaggedContent(
  contentType: 'listing' | 'message' | 'profile' | 'event',
  contentId: number,
  userId: number,
  moderationResult: ModerationResult & { matchedProhibited?: ProhibitedItemRow[] },
  source: 'auto' | 'user_report' | 'admin' = 'auto'
): Promise<number | null> {
  try {
    const supabase = await sbServer()
    
    // Determine severity based on moderation result
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    if (moderationResult.matchedProhibited && moderationResult.matchedProhibited.length > 0) {
      const maxSeverity = moderationResult.matchedProhibited.reduce((max, item) => {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
        return severityLevels[item.severity] > severityLevels[max] ? item.severity : max
      }, 'low' as 'low' | 'medium' | 'high' | 'critical')
      severity = maxSeverity
    } else if (moderationResult.confidence === 'high') {
      severity = 'high'
    }
    
    // Determine status based on severity and action
    let status: 'pending' | 'approved' | 'rejected' | 'deleted' = 'pending'
    const shouldAutoRejectResult = shouldAutoReject(moderationResult)
    if (shouldAutoRejectResult) {
      status = 'rejected'
    }
    
    // Prepare details
    const details = {
      flags: moderationResult.flags,
      reasons: moderationResult.reasons,
      confidence: moderationResult.confidence,
      matchedProhibited: moderationResult.matchedProhibited?.map(item => ({
        id: item.id,
        pattern: item.pattern,
        severity: item.severity,
        action: item.action,
        category: item.category,
      })),
    }
    
    const { data, error } = await supabase
      .from('FlaggedContent')
      .insert({
        contentType,
        contentId,
        userId,
        reason: moderationResult.flags.join(', ') || 'Unknown',
        severity,
        status,
        source,
        details,
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Failed to create flagged content:', error)
      return null
    }
    
    return data.id
  } catch (error) {
    console.error('Error creating flagged content:', error)
    return null
  }
}

/**
 * Check if content should be auto-rejected based on database rules
 */
export async function shouldAutoRejectWithDatabase(
  moderationResult: ModerationResult & { matchedProhibited?: ProhibitedItemRow[] }
): Promise<boolean> {
  // Check basic auto-reject rules first
  if (shouldAutoReject(moderationResult)) {
    return true
  }
  
  // Check if any matched prohibited items have auto_reject action
  if (moderationResult.matchedProhibited) {
    const hasAutoReject = moderationResult.matchedProhibited.some(
      item => item.action === 'auto_reject'
    )
    if (hasAutoReject) {
      return true
    }
  }
  
  return false
}

/**
 * Check if content should be flagged based on database rules
 */
export async function shouldFlagForReviewWithDatabase(
  moderationResult: ModerationResult & { matchedProhibited?: ProhibitedItemRow[] }
): Promise<boolean> {
  // Check basic flag rules first
  if (shouldFlagForReview(moderationResult)) {
    return true
  }
  
  // Check if any matched prohibited items have flag action
  if (moderationResult.matchedProhibited) {
    const hasFlag = moderationResult.matchedProhibited.some(
      item => item.action === 'flag'
    )
    if (hasFlag) {
      return true
    }
  }
  
  return false
}
