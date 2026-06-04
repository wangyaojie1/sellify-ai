/**
 * Sellify AI - Content Script
 * Injected into supported e-commerce product pages.
 * Adds a floating AI button and sidebar for quick access.
 */

(function() {
  'use strict';

  // Prevent double injection
  if (window.__sellifyInjected) return;
  window.__sellifyInjected = true;

  // --- Create Floating Button ---
  function createFloatingButton() {
    const btn = document.createElement('div');
    btn.id = 'sellify-floating-btn';
    btn.innerHTML = '⚡';
    btn.title = 'Sellify AI - Optimize this listing';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
      fontSize: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '99999',
      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
      border: 'none',
      transition: 'transform 0.2s, box-shadow 0.2s',
      userSelect: 'none'
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.6)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)';
    });
    btn.addEventListener('click', () => {
      // Open the extension popup
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    });

    document.body.appendChild(btn);
    return btn;
  }

  // --- Review Extraction Helper ---
  function extractReviews() {
    const reviews = [];
    const url = window.location.href;

    if (url.includes('amazon')) {
      document.querySelectorAll('[data-hook="review"]').forEach(el => {
        const rating = el.querySelector('[data-hook="review-star-rating"]')?.textContent?.trim() || '';
        const title = el.querySelector('[data-hook="review-title"]')?.textContent?.trim() || '';
        const body = el.querySelector('[data-hook="review-body"]')?.textContent?.trim() || '';
        if (body) reviews.push({ rating, title, body });
      });
    }

    return reviews;
  }

  // --- Initialize ---
  function init() {
    // Only show floating button on product pages
    const url = window.location.href;
    const isProductPage =
      url.includes('amazon.com/dp/') ||
      url.includes('amazon.com/gp/product/') ||
      url.includes('ebay.com/itm/') ||
      url.includes('etsy.com/listing/') ||
      url.includes('aliexpress.com/item/');

    if (isProductPage) {
      createFloatingButton();
    }

    // Listen for review extraction requests from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EXTRACT_REVIEWS') {
        sendResponse(extractReviews());
      }
    });
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
