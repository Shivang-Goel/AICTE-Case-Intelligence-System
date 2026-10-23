/**
 * AICTE Case Intelligence End-to-End Integration Verification Script
 */

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function runTests() {
  console.log('🧪 Starting AICTE Case Intelligence Integration Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${name} ->`, e.message);
      failed++;
    }
  }

  // 1. Health
  await test('System Health Diagnostics API', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'HEALTHY') throw new Error('Status not healthy');
    if (data.problemStatement !== 'SIH26264') throw new Error('Problem statement mismatch');
  });

  // 2. Dashboard KPIs
  await test('Executive Dashboard Telemetry', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.kpis || typeof data.kpis.totalCases !== 'number') throw new Error('Invalid KPIs');
    if (!Array.isArray(data.bureauWorkload)) throw new Error('Missing bureau workload');
  });

  // 3. Cases Listing & Filtering
  await test('Cases Registry with Filtering', async () => {
    const res = await fetch(`${BASE_URL}/cases?severity=CRITICAL`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data)) throw new Error('Missing cases data');
    if (data.data.some(c => c.severityLevel !== 'CRITICAL')) throw new Error('Filter breached');
  });

  // 4. AI Severity Pre-Triage
  await test('AI Explainable Severity Triage (Student Safety Protocol)', async () => {
    const res = await fetch(`${BASE_URL}/severity/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Freshers hazing and violent physical ragging in hostel block',
        description: 'First year students beaten with bats and locked inside bathroom.',
        category: 'SAFETY_RAGGING',
      }),
    });
    const data = await res.json();
    if (data.evaluation.severityLevel !== 'CRITICAL') throw new Error('Safety triage failed to elevate to CRITICAL');
    if (!data.evaluation.isSafetyUrgent) throw new Error('isSafetyUrgent flag was false');
  });

  // 5. Cross-Bureau Conflict Scan
  await test('Cross-Bureau Conflict Detection Engine', async () => {
    const res = await fetch(`${BASE_URL}/conflicts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.conflicts)) throw new Error('Missing conflicts array');
    const hasApexConflict = data.conflicts.some(c => c.institutionId === 'inst-1');
    if (!hasApexConflict) throw new Error('Apex Institute collision not detected');
  });

  // 6. Relationship Suggestions & Confirm Decision
  await test('AI Case Linking Decision Workflow', async () => {
    const res = await fetch(`${BASE_URL}/linking/suggestions`);
    const data = await res.json();
    if (!data.suggestions || data.suggestions.length === 0) throw new Error('No suggestions found');
    const sug = data.suggestions[0];

    const reviewRes = await fetch(`${BASE_URL}/linking/suggestions/${sug.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'REVIEWER' },
      body: JSON.stringify({ status: 'CONFIRMED', reason: 'Verified integration test link' }),
    });
    if (!reviewRes.ok) throw new Error('Review failed');
  });

  // 7. Reset to seed
  await test('Database Reset & Idempotent Seeding', async () => {
    const res = await fetch(`${BASE_URL}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Reset failed');
  });

  console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
