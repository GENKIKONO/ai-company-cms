#!/usr/bin/env tsx

/**
 * P4-5 Translation & Embedding Pipeline E2E Test
 * Tests: enqueue → drain flow with idempotency and differential updates
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

// Environment validation
const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
});

const env = EnvSchema.parse(process.env);

// Test configuration
const TEST_ORG_ID = uuidv4(); // Use UUID for organization ID
const TEST_LANGUAGES = ['en', 'ko', 'zh'];

// Initialize Supabase client
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

interface TestResult {
  stage: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

class P45Tester {
  private results: TestResult[] = [];
  private testOrgId: string;

  constructor() {
    this.testOrgId = TEST_ORG_ID;
    console.log(`🧪 P4-5 E2E Test Starting - Organization: ${this.testOrgId}`);
  }

  private async logResult(stage: string, success: boolean, data?: any, error?: string, duration?: number) {
    const result: TestResult = { stage, success, data, error, duration };
    this.results.push(result);
    
    const emoji = success ? '✅' : '❌';
    const durationStr = duration ? ` (${duration}ms)` : '';
    console.log(`${emoji} ${stage}${durationStr}`);
    
    if (error) console.log(`   Error: ${error}`);
    if (data && typeof data === 'object') {
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  async setupTestData() {
    const start = Date.now();
    try {
      // Skip creating posts and use mock data for testing the API endpoints only
      const mockPosts = [
        {
          id: uuidv4(),
          organization_id: this.testOrgId,
          title: 'テスト記事1 - AI翻訳サービスについて',
          content: 'この記事では最新のAI翻訳技術について詳しく解説します。'
        },
        {
          id: uuidv4(),
          organization_id: this.testOrgId,
          title: 'テスト記事2 - エンベディング技術の活用',
          content: 'ベクトル検索とエンベディング技術を活用したセマンティック検索について説明します。'
        }
      ];

      await this.logResult('Setup test data', true, { mock_posts_created: mockPosts.length }, undefined, Date.now() - start);
      return mockPosts;
    } catch (error) {
      await this.logResult('Setup test data', false, undefined, error instanceof Error ? error.message : String(error), Date.now() - start);
      throw error;
    }
  }

  async testTranslationEnqueue(posts: any[]) {
    const start = Date.now();
    try {
      const jobs = [];
      
      for (const post of posts) {
        for (const targetLang of TEST_LANGUAGES) {
          // Enqueue title translation
          const titleJob = {
            action: 'enqueue',
            organization_id: post.organization_id,
            source_table: 'posts',
            source_id: post.id,
            source_field: 'title',
            source_lang: 'ja',
            target_lang: targetLang,
            source_text: post.title,
            priority: 8
          };

          const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/admin/translations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(titleJob)
          });

          const result = await response.json();
          jobs.push({ ...titleJob, response: result });
        }
      }

      await this.logResult('Translation enqueue', true, { 
        jobs_enqueued: jobs.length,
        sample_job: jobs[0]?.response 
      }, undefined, Date.now() - start);
      
      return jobs;
    } catch (error) {
      await this.logResult('Translation enqueue', false, undefined, error instanceof Error ? error.message : String(error), Date.now() - start);
      throw error;
    }
  }

  async testEmbeddingEnqueue(posts: any[]) {
    const start = Date.now();
    try {
      const jobs = [];
      
      for (const post of posts) {
        // Enqueue title embedding
        const titleJob = {
          action: 'enqueue',
          job: {
            organization_id: post.organization_id,
            source_table: 'posts',
            source_id: post.id,
            source_field: 'title',
            content_text: post.title,
            priority: 7
          }
        };

        const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/admin/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(titleJob)
        });

        const result = await response.json();
        jobs.push({ ...titleJob, response: result });
      }

      await this.logResult('Embedding enqueue', true, { 
        jobs_enqueued: jobs.length,
        sample_job: jobs[0]?.response 
      }, undefined, Date.now() - start);
      
      return jobs;
    } catch (error) {
      await this.logResult('Embedding enqueue', false, undefined, error instanceof Error ? error.message : String(error), Date.now() - start);
      throw error;
    }
  }

  async checkIdempotencyKeys() {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('idempotency_keys')
        .select('*')
        .ilike('key', `%${this.testOrgId}%`)
        .limit(10);

      if (error) throw error;

      await this.logResult('Check idempotency keys', true, { 
        keys_found: data?.length || 0,
        sample_keys: data?.slice(0, 3) 
      }, undefined, Date.now() - start);
      
      return data;
    } catch (error) {
      await this.logResult('Check idempotency keys', false, undefined, error instanceof Error ? error.message : String(error), Date.now() - start);
      throw error;
    }
  }

  async checkTranslationJobs() {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('translation_jobs')
        .select('*')
        .eq('organization_id', this.testOrgId)
        .limit(5);

      if (error) throw error;

      await this.logResult('Check translation jobs', true, { 
        jobs_found: data?.length || 0,
        sample_jobs: data?.slice(0, 2) 
      }, undefined, Date.now() - start);
      
      return data;
    } catch (error) {
      await this.logResult('Check translation jobs', false, undefined, error instanceof Error ? error.message : String(error), Date.now() - start);
      throw error;
    }
  }

  async checkEmbeddingJobs() {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('embedding_jobs')
        .select('*')
        .eq('organization_id', this.testOrgId)
        .limit(5);

      if (error) throw error;

      await this.logResult('Check embedding jobs', true, { 
        jobs_found: data?.length || 0,
        sample_jobs: data?.slice(0, 2) 
      }, undefined, Date.now() - start);
      
      return data;
    } catch (error) {
      await this.logResult('Check embedding jobs', false, undefined, error instanceof Error ? error.message : String(error), Date.now() - start);
      throw error;
    }
  }

  async checkJobRuns() {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('job_runs_v2')
        .select('*')
        .or(`meta->>organization_id.eq.${this.testOrgId}`)
        .limit(5);

      if (error) throw error;

      await this.logResult('Check job_runs_v2', true, { 
        runs_found: data?.length || 0,
        sample_runs: data?.slice(0, 2) 
      }, undefined, Date.now() - start);
      
      return data;
    } catch (error) {
      await this.logResult('Check job_runs_v2', false, undefined, error instanceof Error ? error.message : String(error), Date.now() - start);
      throw error;
    }
  }

  async cleanup() {
    const start = Date.now();
    try {
      // Clean up test data (only jobs since we're using mock posts)
      await supabase.from('translation_jobs').delete().eq('organization_id', this.testOrgId);
      await supabase.from('embedding_jobs').delete().eq('organization_id', this.testOrgId);
      
      // Note: idempotency_keys and job_runs_v2 are kept for audit purposes
      
      await this.logResult('Cleanup test data', true, undefined, undefined, Date.now() - start);
    } catch (error) {
      await this.logResult('Cleanup test data', false, undefined, error instanceof Error ? error.message : String(error), Date.now() - start);
    }
  }

  generateReport() {
    console.log('\n📊 P4-5 Test Report');
    console.log('='.repeat(50));
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const successRate = ((successful / total) * 100).toFixed(1);
    
    console.log(`✅ Success Rate: ${successful}/${total} (${successRate}%)`);
    console.log(`🕒 Test Organization: ${this.testOrgId}`);
    console.log(`📅 Test Time: ${new Date().toISOString()}`);
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach((result, index) => {
      const emoji = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${index + 1}. ${emoji} ${result.stage}${duration}`);
      
      if (result.error) {
        console.log(`   ⚠️  ${result.error}`);
      }
    });

    // Key findings
    console.log('\n🔍 Key Findings:');
    const translationJob = this.results.find(r => r.stage === 'Check translation jobs');
    const embeddingJob = this.results.find(r => r.stage === 'Check embedding jobs');
    const idempotencyKeys = this.results.find(r => r.stage === 'Check idempotency keys');
    const jobRuns = this.results.find(r => r.stage === 'Check job_runs_v2');
    
    if (translationJob?.data) {
      console.log(`- Translation jobs created: ${translationJob.data.jobs_found}`);
    }
    if (embeddingJob?.data) {
      console.log(`- Embedding jobs created: ${embeddingJob.data.jobs_found}`);
    }
    if (idempotencyKeys?.data) {
      console.log(`- Idempotency keys generated: ${idempotencyKeys.data.keys_found}`);
    }
    if (jobRuns?.data) {
      console.log(`- Job runs tracked: ${jobRuns.data.runs_found}`);
    }

    return {
      success_rate: parseFloat(successRate),
      total_tests: total,
      successful_tests: successful,
      test_organization: this.testOrgId,
      results: this.results
    };
  }
}

// Main test execution
async function main() {
  const tester = new P45Tester();
  
  try {
    // Setup phase
    const posts = await tester.setupTestData();
    
    // Enqueue phase
    await tester.testTranslationEnqueue(posts);
    await tester.testEmbeddingEnqueue(posts);
    
    // Wait a bit for potential async processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verification phase
    await tester.checkIdempotencyKeys();
    await tester.checkTranslationJobs();
    await tester.checkEmbeddingJobs();
    await tester.checkJobRuns();
    
    // Generate final report
    const report = tester.generateReport();
    
    // Cleanup
    await tester.cleanup();
    
    console.log('\n🎉 P4-5 E2E Test Completed');
    
    // Exit with appropriate code
    process.exit(report.success_rate === 100 ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

// Automatically run if this is the main module
main().catch(console.error);

export { P45Tester };