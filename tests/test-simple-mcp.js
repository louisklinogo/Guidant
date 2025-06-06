#!/usr/bin/env node

/**
 * Simple test to verify MCP response format
 */

import { FastMCP } from 'fastmcp';
import { z } from 'zod';

const server = new FastMCP({
  name: "Simple Test Server",
  version: "1.0.0",
});

// Simple test tool that returns proper MCP format
server.addTool({
  name: "test_format",
  description: "Test proper MCP response format",
  parameters: z.object({
    message: z.string().describe("Test message")
  }),
  execute: async ({ message }) => {
    // Return simple string (this works)
    return `Test successful: ${message}`;
  },
});

// Test tool that returns content object (this also works)
server.addTool({
  name: "test_content",
  description: "Test MCP content object format",
  parameters: z.object({
    data: z.string().describe("Test data")
  }),
  execute: async ({ data }) => {
    // Return content object format
    return {
      content: [
        {
          type: "text",
          text: `Data received: ${data}`
        }
      ]
    };
  },
});

server.start({
  transportType: "stdio",
});

console.log("Simple MCP test server started");
