#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = 'https://aiohub.jp/';
const OUTPUT_DIR = 'widow-verification-screenshots';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureWidowProblems() {
  const browser = await chromium.launch();
  
  const viewports = [
    { name: 'iPhone-375', width: 375, height: 812 },
    { name: 'iPhone-Plus-414', width: 414, height: 896 }
  ];

  const results = {
    timestamp: new Date().toISOString(),
    url: TARGET_URL,
    findings: []
  };

  for (const viewport of viewports) {
    console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    try {
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      
      // Wait for any animations/loading
      await page.waitForTimeout(2000);
      
      // Target elements to inspect
      const targetSelectors = [
        {
          name: 'Hero Subtitle',
          selector: 'h1 + p, .hero p:first-of-type, [class*="hero"] p',
          description: 'プラットフォーム'
        },
        {
          name: 'Features Lead',
          selector: 'h2:has-text("充実した機能") + p, section:has(h2:has-text("機能")) p:first-of-type',
          description: '活用できます'
        },
        {
          name: 'FAQ Introduction',
          selector: 'h2:has-text("FAQ") + p, [class*="faq"] p:first-of-type',
          description: 'お問い合わせください'
        }
      ];

      for (const target of targetSelectors) {
        console.log(`\n🔍 Analyzing: ${target.name}`);
        
        try {
          // Try to find the element
          const elements = await page.locator(target.selector).all();
          
          if (elements.length === 0) {
            console.log(`❌ Element not found: ${target.selector}`);
            continue;
          }

          for (let i = 0; i < Math.min(elements.length, 3); i++) {
            const element = elements[i];
            
            // Get element info
            const boundingBox = await element.boundingBox();
            if (!boundingBox) continue;
            
            const computedStyle = await element.evaluate(el => {
              const style = window.getComputedStyle(el);
              return {
                textWrap: style.textWrap || style.getPropertyValue('text-wrap'),
                wordBreak: style.wordBreak || style.getPropertyValue('word-break'),
                lineHeight: style.lineHeight,
                maxWidth: style.maxWidth,
                textAlign: style.textAlign,
                fontSize: style.fontSize,
                className: el.className
              };
            });
            
            const innerText = await element.innerText();
            
            console.log(`📝 Text: "${innerText.substring(0, 60)}..."`);
            console.log(`🎨 Classes: ${computedStyle.className}`);
            console.log(`📐 Computed Style:`, computedStyle);
            
            // Take screenshot of the element
            const screenshotPath = path.join(OUTPUT_DIR, `${viewport.name}-${target.name.replace(/\s+/g, '-')}-${i}.png`);
            await element.screenshot({ path: screenshotPath });
            console.log(`📸 Screenshot saved: ${screenshotPath}`);
            
            // Analyze text for widow issues
            const lines = innerText.split('\n').filter(line => line.trim());
            const lastLine = lines[lines.length - 1];
            
            if (lastLine && lastLine.length <= 3) {
              console.log(`⚠️ WIDOW DETECTED: Last line is only ${lastLine.length} characters: "${lastLine}"`);
              results.findings.push({
                viewport: viewport.name,
                element: target.name,
                selector: target.selector,
                lastLine: lastLine,
                lastLineLength: lastLine.length,
                fullText: innerText,
                computedStyle: computedStyle,
                boundingBox: boundingBox
              });
            } else {
              console.log(`✅ No obvious widow (last line: ${lastLine?.length || 0} chars)`);
            }
          }
        } catch (error) {
          console.log(`❌ Error analyzing ${target.name}:`, error.message);
        }
      }
      
      // Take full page screenshot
      const fullPagePath = path.join(OUTPUT_DIR, `${viewport.name}-fullpage.png`);
      await page.screenshot({ path: fullPagePath, fullPage: true });
      console.log(`📸 Full page screenshot: ${fullPagePath}`);
      
    } catch (error) {
      console.error(`❌ Error with ${viewport.name}:`, error.message);
    }
    
    await page.close();
  }

  await browser.close();
  
  // Save results JSON
  const resultsPath = path.join(OUTPUT_DIR, 'widow-analysis.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Analysis results saved: ${resultsPath}`);
  
  // Summary
  console.log(`\n📋 VERIFICATION SUMMARY`);
  console.log(`======================`);
  console.log(`Total widow issues found: ${results.findings.length}`);
  
  if (results.findings.length > 0) {
    console.log(`\n⚠️ WIDOW ISSUES DETECTED:`);
    results.findings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding.viewport} - ${finding.element}`);
      console.log(`   Last line: "${finding.lastLine}" (${finding.lastLineLength} chars)`);
      console.log(`   Classes: ${finding.computedStyle.className}`);
    });
  } else {
    console.log(`✅ No obvious widow issues detected in automated analysis`);
  }
  
  return results;
}

// Run the verification
captureWidowProblems().catch(console.error);