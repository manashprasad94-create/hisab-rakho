import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { validateTransactionDraft } from '../supabase/functions/_shared/transactionDraft.ts'

// Execute the real Edge handler with isolated auth/quota/provider dependencies.
// No live users, database writes, or paid provider requests are used.
const source = fs.readFileSync(new URL('../supabase/functions/parse-transaction/index.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source.replace(/^import .*\n/gm, ''), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.None } }).outputText
const valid = { amount: '600', reason: 'Dinner', category: 'food', direction: 'i_paid', mode: 'group', friends: ['Example One', 'Example Two'], includesSelf: true, issues: [] }

function setup({ authenticated = true, quota = true, providerStatus = 200, content = JSON.stringify(valid), configured = true } = {}) {
  let handler
  const calls = []
  vm.runInNewContext(compiled, {
    serve: (callback) => { handler = callback },
    authenticatedUser: async () => authenticated ? { id: 'test-user' } : null,
    claimQuota: async (...args) => { calls.push({ quota: args }); return quota },
    corsHeaders: {}, json: (body, status = 200) => new Response(JSON.stringify(body), { status }),
    validateTransactionDraft, Response, TextDecoder, Uint8Array, AbortSignal,
    Deno: { env: { get: (name) => name === 'GROQ_API_KEY' && configured ? 'test-key' : undefined } },
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: providerStatus }) },
  })
  return { handler, calls }
}
const request = (body, method = 'POST') => new Request('https://example.test/parse-transaction', { method, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) })

test('authentication and method gates prevent AI calls', async () => {
  const { handler, calls } = setup({ authenticated: false })
  assert.equal((await handler(request(undefined, 'OPTIONS'))).status, 200)
  assert.equal((await handler(request(undefined, 'GET'))).status, 405)
  assert.equal((await handler(request({ text: 'Synthetic expense' }))).status, 401)
  assert.equal(calls.length, 0)
})

test('invalid and oversized requests do not consume quota', async () => {
  const { handler, calls } = setup()
  for (const body of ['invalid JSON', { text: '' }, { text: 'x'.repeat(1001) }, { text: 123 }]) assert.equal((await handler(request(body))).status, 400)
  assert.equal((await handler(request('x'.repeat(8001)))).status, 413)
  assert.equal(calls.length, 0)
})

test('missing configuration and exhausted quota return recoverable errors', async () => {
  assert.equal((await setup({ configured: false }).handler(request({ text: 'Synthetic expense' }))).status, 503)
  const { handler, calls } = setup({ quota: false })
  assert.equal((await handler(request({ text: 'Synthetic expense' }))).status, 429)
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].quota, ['test-user', 'transaction_draft', 20])
})

test('provider errors and malformed model output are never usable drafts', async () => {
  for (const config of [{ providerStatus: 500 }, { content: 'not JSON' }, { content: JSON.stringify({ ...valid, amount: '-10' }) }]) {
    const response = await setup(config).handler(request({ text: 'Synthetic expense' }))
    assert.equal(response.status, 502)
    assert.equal('draft' in await response.json(), false)
  }
})

test('sends only the description to AI and returns validated data without saving', async () => {
  const { handler, calls } = setup()
  const response = await handler(request({ text: 'Synthetic expense', friends: ['private-list'], userId: 'spoofed-id' }))
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).draft, valid)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].body.messages[1].content, 'Synthetic expense')
  assert.equal(JSON.stringify(calls[1]).includes('private-list'), false)
  assert.equal(JSON.stringify(calls[1]).includes('spoofed-id'), false)
})
