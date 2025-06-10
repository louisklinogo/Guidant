/**
 * Quality Validation Tools Registration - CONSOLIDATED (MCP-006)
 * Registers quality validation MCP tools with the server
 *
 * CONSOLIDATION: 4 tools → 2 tools (50% reduction)
 * - guidant_validate_content (consolidates validation + statistics)
 * - guidant_quality_management (consolidates history + configuration)
 *
 * BACKEND-005: Content-Based Quality Gates Implementation
 */

import { qualityValidationTools } from './quality-validation.js';

/**
 * Register quality validation tools with MCP server (FastMCP pattern)
 * @param {object} server - MCP server instance
 */
export function registerQualityValidationTools(server) {
  try {
    // Register each quality validation tool using FastMCP pattern
    for (const tool of qualityValidationTools) {
      server.addTool({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
        execute: tool.handler
      });
    }

    console.log('✅ Quality validation tools registered successfully');
    console.log(`   • ${qualityValidationTools.length} quality tools available`);
    console.log(`   • 2 new consolidated tools + 4 deprecated tools for backward compatibility`);

  } catch (error) {
    console.error('❌ Error registering quality validation tools:', error);
    throw error;
  }
}

/**
 * Get quality validation tools metadata
 * @returns {Array} Array of tool metadata
 */
export function getQualityValidationToolsMetadata() {
  return qualityValidationTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    category: 'quality-validation',
    inputSchema: tool.inputSchema,
    capabilities: [
      'deliverable-quality-validation',
      'content-scoring',
      'improvement-feedback',
      'quality-history-tracking',
      'quality-statistics',
      'system-configuration'
    ]
  }));
}

export { qualityValidationTools };
