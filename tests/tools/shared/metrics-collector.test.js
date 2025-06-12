import { describe, it, expect } from "bun:test";

// Import the module under test using a relative path from this test file
// Path: ../../../src/tools/shared/metrics-collector.js
import { MetricsCollector } from "../../../src/tools/shared/metrics-collector.js";

/**
 * Unit tests for MetricsCollector utility wrapper.
 * These tests focus on deterministic helper functions that do not require
 * the full FastMCP runtime or external analytics back-ends.
 */

describe("MetricsCollector – generateSessionId", () => {
  it("should return a unique session ID with the expected prefix", () => {
    const mc = new MetricsCollector({ enableDetailedMetrics: false });

    const id1 = mc.generateSessionId();
    const id2 = mc.generateSessionId();

    expect(id1).not.toEqual(id2);
    expect(id1.startsWith("session_")).toBe(true);
    expect(id2.startsWith("session_")).toBe(true);
  });
});

describe("MetricsCollector – sanitizeParameters", () => {
  it("should redact sensitive keys and truncate very long strings", () => {
    const mc = new MetricsCollector();

    const params = {
      username: "demoUser",
      password: "superSecretPassword",
      token: "1234567890abcdef",
      description: "a".repeat(1500), // long string
    };

    const sanitized = mc.sanitizeParameters(params);

    expect(sanitized.username).toBe("demoUser");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.description.startsWith("[TRUNCATED:")).toBe(true);
  });
});
