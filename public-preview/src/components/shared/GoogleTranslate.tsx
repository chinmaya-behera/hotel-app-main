'use client';

import React, { useEffect } from 'react';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
    __applyGoogleTranslate?: (langCode: string) => void;
  }
}

/**
 * Patch DOM methods for React compatibility with Google Translate.
 * Google Translate wraps text nodes in <font> tags, which can break React's
 * virtual DOM reconciliation when elements unmount or update.
 */
function patchReactDomForGoogleTranslate() {
  if (typeof window === 'undefined' || typeof Node === 'undefined' || !Node.prototype) {
    return;
  }

  // Prevent double-patching
  if ((Node.prototype as any).__gt_patched) {
    return;
  }
  (Node.prototype as any).__gt_patched = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

/**
 * Eliminates the Google Translate top banner iframe and prevents body pushdown.
 */
function suppressGoogleTranslateBanner() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const killBanner = () => {
    // 1. Reset body and html positioning
    if (document.body) {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.setProperty('top', '0px', 'important');
      }
      if (document.body.style.position === 'relative') {
        document.body.style.setProperty('position', 'static', 'important');
      }
    }
    if (document.documentElement) {
      if (document.documentElement.style.top && document.documentElement.style.top !== '0px') {
        document.documentElement.style.setProperty('top', '0px', 'important');
      }
    }

    // 2. Hide banner iframes and toolbars
    const selectors = [
      '.goog-te-banner-frame',
      'iframe.goog-te-banner-frame',
      '.VIpgJd-ZVi9od-ORHb-OEVmcd',
      '.VIpgJd-ZVi9od-aZ2wEe-wOHMyf',
      '.VIpgJd-ZVi9od-aZ2wEe-wOHMyf-ti6hGc',
      '#goog-gt-tt',
      '.goog-te-balloon-frame',
    ];

    selectors.forEach((sel) => {
      const elements = document.querySelectorAll<HTMLElement>(sel);
      elements.forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('height', '0px', 'important');
        el.style.setProperty('width', '0px', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('position', 'fixed', 'important');
        el.style.setProperty('top', '-9999px', 'important');
      });
    });
  };

  killBanner();

  // Continuously observe DOM additions to immediately kill the banner the moment it spawns
  const observer = new MutationObserver(() => {
    killBanner();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  // Intercept direct style changes to body.top
  try {
    const origSetProperty = document.body.style.setProperty;
    document.body.style.setProperty = function (prop: string, val: string, priority?: string) {
      if (prop === 'top' && val !== '0px') {
        return origSetProperty.call(this, 'top', '0px', 'important');
      }
      if (prop === 'position' && val === 'relative') {
        return origSetProperty.call(this, 'position', 'static', 'important');
      }
      return origSetProperty.call(this, prop, val, priority);
    };
  } catch {
    // Non-fatal
  }
}

/**
 * Sets the Google Translate cookie and triggers translation without ANY page reloads.
 */
export function translateWholePage(langCode: string) {
  if (typeof window === 'undefined') return;

  const targetLang = langCode === 'en' ? '' : langCode;
  const cookieValue = targetLang ? `/auto/${targetLang}` : '/auto/en';

  // 1. Set Google Translate cookies
  try {
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    const host = window.location.hostname;
    document.cookie = `googtrans=${cookieValue}; domain=${host}; path=/;`;
    const parts = host.split('.');
    if (parts.length > 1) {
      document.cookie = `googtrans=${cookieValue}; domain=.${parts.slice(-2).join('.')}; path=/;`;
    }
  } catch (e) {
    // Ignore storage restrictions
  }

  // 2. Safely apply to combo selector if available (NEVER reload the page)
  function applyToCombo(): boolean {
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      combo.value = targetLang;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  if (!applyToCombo()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (applyToCombo() || attempts > 12) {
        clearInterval(interval);
      }
    }, 250);
  }
}

export function GoogleTranslate() {
  useEffect(() => {
    patchReactDomForGoogleTranslate();
    suppressGoogleTranslateBanner();

    // Register global trigger function
    window.__applyGoogleTranslate = translateWholePage;

    // Define the global Google Translate init callback: STRICTLY INDIAN LANGUAGES ONLY
    window.googleTranslateElementInit = () => {
      try {
        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              // Exclusively Indian languages: 22 8th Schedule official languages + English
              includedLanguages:
                'en,hi,or,bn,te,ta,mr,gu,kn,ml,pa,as,ur,sa,mai,ne,gom,sd,doi,mni-Mtei,brx,sat',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      } catch (err) {
        // Deferred initialization
      }
    };

    // Load the official Google Translate script if not already present
    const SCRIPT_ID = 'google-translate-script';
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'text/javascript';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (
      window.google &&
      window.google.translate &&
      typeof window.googleTranslateElementInit === 'function'
    ) {
      window.googleTranslateElementInit();
    }
  }, []);

  return (
    <div
      id="google_translate_element"
      className="notranslate"
      style={{
        display: 'none',
        visibility: 'hidden',
        height: 0,
        width: 0,
        overflow: 'hidden',
      }}
    />
  );
}
