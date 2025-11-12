# Basic MCP Code Execution Workflow

This example demonstrates the fundamental pattern of using code execution with MCP to build efficient AI agents.

## Scenario

An agent needs to:
1. Fetch a large document from Google Drive
2. Extract relevant sections
3. Update a Salesforce record with a summary

## Traditional Approach (Direct Tool Calls)

```typescript
// Problem: Document passes through model context twice
// Token usage: ~100,000 tokens

// Step 1: Fetch document (50K tokens)
const doc = await tools.call('google-drive', 'get_document', {
  id: 'doc-123'
});
// Full 50K token document returned to model

// Step 2: Model decides to extract sections
// (Document already in context: 50K tokens)
const summary = await tools.call('text-processor', 'summarize', {
  text: doc.content,
  maxLength: 500
});
// Full document sent to summarizer: Another 50K tokens

// Step 3: Update Salesforce
await tools.call('salesforce', 'update_record', {
  id: 'record-456',
  summary: summary
});

// Total: ~100,000+ tokens (document duplicated in context)
```

## Code Execution Approach

```typescript
// Solution: Process data locally before returning to model
// Token usage: ~2,000 tokens

import { getDocument } from './servers/google-drive/getDocument';
import { updateRecord } from './servers/salesforce/updateRecord';

async function processDocument(docId: string, recordId: string) {
  // Step 1: Fetch document (happens in execution environment)
  const doc = await getDocument(docId);

  // Step 2: Process locally (no model context consumed)
  const sections = doc.content.split('\n\n');
  const relevantSections = sections.filter(s =>
    s.includes('Q4') || s.includes('revenue')
  );

  // Step 3: Generate summary locally
  const summary = {
    totalSections: relevantSections.length,
    keyPoints: relevantSections.slice(0, 3),
    wordCount: relevantSections.join(' ').split(' ').length
  };

  // Step 4: Update Salesforce with small summary
  const result = await updateRecord(recordId, {
    q4_summary: JSON.stringify(summary)
  });

  // Only summary returned to model (~500 tokens)
  return {
    success: true,
    sectionsProcessed: relevantSections.length,
    recordUpdated: result.id
  };
}

// Agent calls this function with parameters
await processDocument('doc-123', 'record-456');

// Total: ~2,000 tokens (98% reduction)
```

## Key Differences

### Token Efficiency

| Approach | Tokens Used | Cost (Claude 4.5) |
|----------|-------------|-------------------|
| Direct tool calls | ~100,000 | ~$0.30 |
| Code execution | ~2,000 | ~$0.006 |
| **Savings** | **98%** | **$0.294** |

### Latency

- **Direct tool calls**: 3 round trips to model (fetch → process → update)
- **Code execution**: 1 round trip (entire workflow in one execution)

### Privacy

- **Direct tool calls**: Full document content in model context
- **Code execution**: Only summary returned to model, full content stays local

## Progressive Tool Discovery

The code execution approach also enables progressive tool discovery:

```typescript
// Agent first explores available servers
const servers = await fs.readdir('./servers');
// Returns: ['google-drive', 'salesforce', 'github', ...]

// Agent reads only needed tool definitions
const gdTools = await fs.readdir('./servers/google-drive');
// Returns: ['getDocument.ts', 'listFiles.ts', 'shareDocument.ts']

// Agent imports only what it needs
import { getDocument } from './servers/google-drive/getDocument';

// Traditional approach would load ALL tools from ALL servers upfront
// Code execution loads on-demand: 50-100 tokens vs 50,000-150,000 tokens
```

## Control Flow Efficiency

Code execution enables familiar programming patterns:

```typescript
// Complex logic in one execution pass
async function syncDocumentsToSalesforce(driveFolder: string, sfAccount: string) {
  const files = await listFiles(driveFolder);

  const results = [];
  for (const file of files) {
    // Conditional logic in execution environment
    if (file.name.endsWith('.pdf')) {
      const doc = await getDocument(file.id);
      const text = await extractPdfText(doc);

      // Error handling
      try {
        const record = await createRecord(sfAccount, {
          name: file.name,
          content: text.slice(0, 5000) // Truncate locally
        });
        results.push({ file: file.name, status: 'success', recordId: record.id });
      } catch (error) {
        results.push({ file: file.name, status: 'error', error: error.message });
      }
    }
  }

  return results; // Compact summary to model
}

// Traditional approach would require model to orchestrate each loop iteration
// Result: 10-20x more round trips and token usage
```

## When to Use Code Execution

### Best For:
- Large data processing (spreadsheets, documents)
- Multi-step workflows with intermediate results
- Privacy-sensitive operations
- Complex control flow (loops, conditionals)
- High-frequency operations (cost-sensitive)

### Traditional Tools Better For:
- Single, simple operations
- When tool definitions are small
- When you need model reasoning between steps
- Exploratory workflows (agent figuring out what to do)

## Implementation Checklist

- [ ] Identify workflow steps that can be combined
- [ ] Determine which data can be processed locally
- [ ] Set up MCP server tool wrappers in `./servers/`
- [ ] Implement workflow as single executable function
- [ ] Add error handling and logging
- [ ] Test in sandboxed environment
- [ ] Measure token usage before/after
- [ ] Document as reusable skill if applicable

## Next Steps

1. Review the [server templates](../servers/README.md) for adding new tools
2. Explore [advanced patterns](./advanced-patterns.md) for complex workflows
3. Learn about [state persistence](./state-persistence.md) for long-running agents
4. See [privacy patterns](./privacy-patterns.md) for handling sensitive data

---

*Example from: Anthropic's "Code Execution with MCP" case study*
*Token savings: 98.7% (150K → 2K tokens)*
