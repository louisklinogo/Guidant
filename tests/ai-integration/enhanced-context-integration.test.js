/**
 * Enhanced Context Integration Test
 * Simple integration test for BACKEND-003 implementation
 */

import { describe, it, expect } from 'bun:test';
import { 
  createEnhancedContextOrchestrator,
  validateEnhancedContextSystem,
  ContextPresets,
  applyContextPreset
} from '../../src/ai-integration/index.js';

describe('Enhanced Context Integration', () => {
  it('should create enhanced context orchestrator', () => {
    const orchestrator = createEnhancedContextOrchestrator();
    expect(orchestrator).toBeDefined();
    expect(typeof orchestrator.generateEnhancedContext).toBe('function');
  });

  it('should apply context presets', () => {
    const balanced = applyContextPreset('balanced');
    expect(balanced).toBeDefined();
    expect(balanced.optimizerOptions).toBeDefined();
    expect(balanced.optimizerOptions.strategy).toBe('priority_based');
  });

  it('should validate system with minimal setup', async () => {
    const validation = await validateEnhancedContextSystem(process.cwd(), {
      enableCaching: false,
      timeout: 5000
    });
    
    expect(validation).toBeDefined();
    expect(typeof validation.valid).toBe('boolean');
  });

  it('should handle system status check', async () => {
    const orchestrator = createEnhancedContextOrchestrator({
      enableCaching: false
    });
    
    const status = await orchestrator.getSystemStatus();
    expect(status.status).toBe('operational');
    expect(status.components).toBeDefined();
    expect(status.contextSources).toBeDefined();
  });
});
