#!/usr/bin/env tsx

/**
 * P4-5 Health & Smoke Test Script
 * Tests: health endpoints and comprehensive smoke testing for Edge Functions
 */

import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Environment validation
const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
});

const env = EnvSchema.parse(process.env);

interface TestResult {
  stage: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

class P45HealthSmokeTest {
  private results: TestResult[] = [];
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor() {
    this.supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    this.serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    console.log(`🏥 P4-5 Health & Smoke Test Starting`);
    console.log(`📍 Supabase URL: ${this.supabaseUrl}`);
  }

  private async logResult(stage: string, success: boolean, data?: any, error?: string, duration?: number) {
    const result: TestResult = { stage, success, data, error, duration };
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    const durationStr = duration ? ` (${duration}ms)` : '';
    console.log(`${status} ${stage}${durationStr}`);
    
    if (error) {
      console.log(`   Error: ${error}`);
    }
    
    if (data && typeof data === 'object') {
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  // Test Translation Runner Health endpoint
  async testTranslationHealth() {
    const startTime = Date.now();
    
    try {
      const url = `${this.supabaseUrl}/functions/v1/translation-runner/health`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
        }
      });

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.status === 'healthy') {
        await this.logResult('Translation Health Check', true, {
          status: data.status,
          service: data.checks?.service,
          database: data.database
        }, undefined, duration);
      } else {
        await this.logResult('Translation Health Check', false, data, 
          `HTTP ${response.status}: ${data.error || 'Health check failed'}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logResult('Translation Health Check', false, undefined,
        error instanceof Error ? error.message : 'Unknown error', duration);
    }
  }

  // Test Embedding Runner Health endpoint
  async testEmbeddingHealth() {
    const startTime = Date.now();
    
    try {
      const url = `${this.supabaseUrl}/functions/v1/embedding-runner/health`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
        }
      });

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.status === 'healthy') {
        await this.logResult('Embedding Health Check', true, {
          status: data.status,
          service: data.checks?.service,
          database: data.database
        }, undefined, duration);
      } else {
        await this.logResult('Embedding Health Check', false, data, 
          `HTTP ${response.status}: ${data.error || 'Health check failed'}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logResult('Embedding Health Check', false, undefined,
        error instanceof Error ? error.message : 'Unknown error', duration);
    }
  }

  // Test Translation Runner Smoke endpoint
  async testTranslationSmoke() {
    const startTime = Date.now();
    
    try {
      const url = `${this.supabaseUrl}/functions/v1/translation-runner/smoke`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.status === 'success') {
        await this.logResult('Translation Smoke Test', true, {
          status: data.status,
          smoke_test_id: data.smoke_test_id,
          tests_performed: data.tests_performed,
          duration_ms: data.duration_ms
        }, undefined, duration);
      } else {
        await this.logResult('Translation Smoke Test', false, data, 
          `HTTP ${response.status}: ${data.error || 'Smoke test failed'}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logResult('Translation Smoke Test', false, undefined,
        error instanceof Error ? error.message : 'Unknown error', duration);
    }
  }

  // Test Embedding Runner Smoke endpoint
  async testEmbeddingSmoke() {
    const startTime = Date.now();
    
    try {
      const url = `${this.supabaseUrl}/functions/v1/embedding-runner/smoke`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.status === 'success') {
        await this.logResult('Embedding Smoke Test', true, {
          status: data.status,
          smoke_test_id: data.smoke_test_id,
          tests_performed: data.tests_performed,
          duration_ms: data.duration_ms
        }, undefined, duration);
      } else {
        await this.logResult('Embedding Smoke Test', false, data, 
          `HTTP ${response.status}: ${data.error || 'Smoke test failed'}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logResult('Embedding Smoke Test', false, undefined,
        error instanceof Error ? error.message : 'Unknown error', duration);
    }
  }

  // Test that existing endpoints still work
  async testExistingEndpoints() {
    const startTime = Date.now();
    
    try {
      // Test translation-runner enqueue endpoint (should return error due to missing data, but endpoint should exist)
      const translationUrl = `${this.supabaseUrl}/functions/v1/translation-runner/enqueue`;
      const translationResponse = await fetch(translationUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Empty body should cause validation error, not 404
      });

      const translationExists = translationResponse.status !== 404;
      
      // Test embedding-runner enqueue endpoint
      const embeddingUrl = `${this.supabaseUrl}/functions/v1/embedding-runner/enqueue`;
      const embeddingResponse = await fetch(embeddingUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Empty body should cause validation error, not 404
      });

      const embeddingExists = embeddingResponse.status !== 404;
      const duration = Date.now() - startTime;
      
      if (translationExists && embeddingExists) {
        await this.logResult('Existing Endpoints Test', true, {
          translation_enqueue: `HTTP ${translationResponse.status}`,
          embedding_enqueue: `HTTP ${embeddingResponse.status}`
        }, undefined, duration);
      } else {
        await this.logResult('Existing Endpoints Test', false, undefined,
          `Translation exists: ${translationExists}, Embedding exists: ${embeddingExists}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logResult('Existing Endpoints Test', false, undefined,
        error instanceof Error ? error.message : 'Unknown error', duration);
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('\n🏁 Starting Health & Smoke Tests...\n');
    
    await this.testTranslationHealth();
    await this.testEmbeddingHealth();
    await this.testTranslationSmoke();
    await this.testEmbeddingSmoke();
    await this.testExistingEndpoints();
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    
    console.log(`✅ Passed: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
    
    if (successCount === totalCount) {
      console.log('\n🎉 All P4-5 Health & Smoke Tests PASSED!');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests FAILED. See details above.');
      process.exit(1);
    }
  }
}

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new P45HealthSmokeTest();
  tester.runAllTests().catch(console.error);
}

export default P45HealthSmokeTest;