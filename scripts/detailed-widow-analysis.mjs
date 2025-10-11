#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = 'https://aiohub.jp/';
const OUTPUT_DIR = 'detailed-widow-analysis';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function detailedWidowAnalysis() {
  const browser = await chromium.launch();
  
  const viewports = [
    { name: 'iPhone-375', width: 375, height: 812 },
    { name: 'iPhone-Plus-414', width: 414, height: 896 }
  ];

  // Specific text patterns to look for widow issues
  const problematicPatterns = [
    'プラットフォーム',
    '活用できます',
    'お問い合わせください',
    'お気軽にご相談',
    'チェックしてください',
    'まずはご相談'
  ];

  const results = {
    timestamp: new Date().toISOString(),
    url: TARGET_URL,
    detailedFindings: []
  };

  for (const viewport of viewports) {
    console.log(`\n📱 Detailed Analysis: ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    try {
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // Extract all text elements that might have widow issues
      const textElements = await page.evaluate(() => {
        const elements = [];
        const selectors = [
          'h1', 'h2', 'h3', 'p', '.lead', '[class*="hero"] p', 
          '[class*="subtitle"]', '[class*="description"]',
          'main p', 'section p'
        ];
        
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            if (el.innerText.trim() && el.offsetHeight > 0) {
              const rect = el.getBoundingClientRect();
              elements.push({
                selector: selector,
                text: el.innerText.trim(),
                className: el.className,
                tagName: el.tagName,
                boundingBox: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height
                },
                // Get computed layout info
                computedStyle: {
                  lineHeight: window.getComputedStyle(el).lineHeight,
                  fontSize: window.getComputedStyle(el).fontSize,
                  maxWidth: window.getComputedStyle(el).maxWidth,
                  textAlign: window.getComputedStyle(el).textAlign,
                  wordBreak: window.getComputedStyle(el).wordBreak,
                  textWrap: window.getComputedStyle(el).textWrap || 
                           window.getComputedStyle(el).getPropertyValue('text-wrap')
                }
              });
            }
          });
        });
        
        return elements;
      });

      console.log(`Found ${textElements.length} text elements to analyze`);

      // Check each element for problematic patterns
      for (const element of textElements) {
        for (const pattern of problematicPatterns) {
          if (element.text.includes(pattern)) {
            console.log(`\n🔍 Found target pattern "${pattern}" in:`);
            console.log(`📝 Text: "${element.text}"`);
            console.log(`🏷️ Tag: ${element.tagName}, Classes: ${element.className}`);
            
            // Simulate line breaking analysis
            const lines = await page.evaluate(({ element, pattern }) => {
              // Create a temporary element to measure line breaks
              const tempDiv = document.createElement('div');
              tempDiv.style.position = 'absolute';
              tempDiv.style.visibility = 'hidden';
              tempDiv.style.width = element.boundingBox.width + 'px';
              tempDiv.style.fontSize = element.computedStyle.fontSize;
              tempDiv.style.lineHeight = element.computedStyle.lineHeight;
              tempDiv.style.fontFamily = window.getComputedStyle(document.body).fontFamily;
              tempDiv.style.wordBreak = element.computedStyle.wordBreak;
              tempDiv.style.textWrap = element.computedStyle.textWrap;
              tempDiv.innerHTML = element.text;
              
              document.body.appendChild(tempDiv);
              
              // Get actual line breaks by measuring text height
              const singleLineHeight = parseFloat(element.computedStyle.lineHeight) || 
                                     parseFloat(element.computedStyle.fontSize) * 1.4;
              const totalHeight = tempDiv.offsetHeight;
              const estimatedLines = Math.round(totalHeight / singleLineHeight);
              
              // Try to detect where lines break by gradually measuring
              const words = element.text.split(/\s+/);
              const lineBreaks = [];
              let currentLine = '';
              
              for (let i = 0; i < words.length; i++) {
                const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
                tempDiv.innerHTML = testLine;
                
                if (tempDiv.offsetHeight > singleLineHeight * (lineBreaks.length + 1) + 5) {
                  // Line break detected
                  lineBreaks.push(currentLine.trim());
                  currentLine = words[i];
                } else {
                  currentLine = testLine;
                }
              }
              
              if (currentLine.trim()) {
                lineBreaks.push(currentLine.trim());
              }
              
              document.body.removeChild(tempDiv);
              
              return {
                estimatedLines,
                lineBreaks,
                totalHeight,
                singleLineHeight
              };
            }, { element, pattern });
            
            console.log(`📏 Estimated ${lines.estimatedLines} lines`);
            console.log(`📐 Line breaks detected:`, lines.lineBreaks);
            
            // Check for widow issues
            if (lines.lineBreaks.length > 1) {
              const lastLine = lines.lineBreaks[lines.lineBreaks.length - 1];
              const isWidow = lastLine.length <= 3 || 
                            (lastLine.length <= 6 && /[。、！？]$/.test(lastLine));
              
              if (isWidow) {
                console.log(`⚠️ WIDOW DETECTED: "${lastLine}" (${lastLine.length} chars)`);
                results.detailedFindings.push({
                  viewport: viewport.name,
                  pattern: pattern,
                  element: {
                    text: element.text,
                    className: element.className,
                    tagName: element.tagName,
                    boundingBox: element.boundingBox
                  },
                  widowIssue: {
                    lastLine: lastLine,
                    lastLineLength: lastLine.length,
                    totalLines: lines.lineBreaks.length,
                    allLines: lines.lineBreaks
                  }
                });
                
                // Take a focused screenshot of this problematic element
                try {
                  const locator = page.locator(`${element.tagName}:has-text("${pattern}")`).first();
                  const screenshotPath = path.join(OUTPUT_DIR, 
                    `${viewport.name}-widow-${pattern.replace(/[^\w]/g, '-')}.png`);
                  await locator.screenshot({ path: screenshotPath });
                  console.log(`📸 Widow screenshot: ${screenshotPath}`);
                } catch (screenshotError) {
                  console.log(`❌ Screenshot failed:`, screenshotError.message);
                }
              } else {
                console.log(`✅ No widow issue (last line: "${lastLine}", ${lastLine.length} chars)`);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error with ${viewport.name}:`, error.message);
    }
    
    await page.close();
  }

  await browser.close();
  
  const resultsPath = path.join(OUTPUT_DIR, 'detailed-widow-analysis.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📊 DETAILED WIDOW ANALYSIS SUMMARY`);
  console.log(`===================================`);
  console.log(`Total widow issues found: ${results.detailedFindings.length}`);
  
  if (results.detailedFindings.length > 0) {
    console.log(`\n⚠️ CONFIRMED WIDOW ISSUES:`);
    results.detailedFindings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding.viewport} - Pattern: "${finding.pattern}"`);
      console.log(`   Element: ${finding.element.tagName}.${finding.element.className}`);
      console.log(`   Widow line: "${finding.widowIssue.lastLine}" (${finding.widowIssue.lastLineLength} chars)`);
      console.log(`   Total lines: ${finding.widowIssue.totalLines}`);
    });
    
    console.log(`\n🔧 RECOMMENDED FIXES NEEDED`);
  } else {
    console.log(`✅ No widow issues found in detailed analysis`);
    console.log(`📝 Current typography settings appear to be working effectively`);
  }
  
  return results;
}

detailedWidowAnalysis().catch(console.error);