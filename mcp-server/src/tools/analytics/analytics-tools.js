/**
 * Tool Analytics MCP Tools
 * MCP tools for analytics, monitoring, and performance insights
 * 
 * MCP-010: Tool Analytics and Monitoring Implementation
 */

import { z } from 'zod';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';
import { toolAnalytics } from '../shared/tool-analytics.js';
import { metricsCollector, performanceMonitor } from '../shared/metrics-collector.js';
import { toolCategoryManager } from '../shared/tool-categories.js';

/**
 * Register analytics tools with the MCP server
 * @param {object} server - MCP server instance
 */
export function registerAnalyticsTools(server) {
  // Get analytics report
  server.addTool({
    name: 'guidant_get_analytics_report',
    description: 'Get comprehensive analytics report for tool usage, performance, and patterns',
    parameters: z.object({
      timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h').describe('Time range for the report'),
      toolFilter: z.string().optional().describe('Filter by specific tool name'),
      categoryFilter: z.string().optional().describe('Filter by tool category'),
      includeRawData: z.boolean().default(false).describe('Include raw metrics data'),
      reportType: z.enum(['summary', 'detailed', 'performance', 'errors']).default('summary').describe('Type of report to generate')
    }),
    execute: async ({ timeRange, toolFilter, categoryFilter, includeRawData, reportType }) => {
      try {
        const report = toolAnalytics.getAnalyticsReport({
          timeRange,
          toolFilter,
          categoryFilter,
          includeRawData
        });

        // Filter report based on type
        let filteredReport = report;
        if (reportType === 'performance') {
          filteredReport = {
            summary: report.summary,
            performanceMetrics: report.performanceMetrics,
            timestamp: report.timestamp
          };
        } else if (reportType === 'errors') {
          filteredReport = {
            summary: report.summary,
            errorAnalysis: report.errorAnalysis,
            timestamp: report.timestamp
          };
        } else if (reportType === 'summary') {
          filteredReport = {
            summary: report.summary,
            recommendations: report.recommendations,
            timestamp: report.timestamp
          };
        }

        return formatSuccessResponse({
          report: filteredReport,
          reportType,
          timeRange,
          filters: { toolFilter, categoryFilter },
          message: `Analytics report generated for ${timeRange} time range`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to generate analytics report: ${error.message}`);
      }
    }
  });

  // Get tool usage metrics
  server.addTool({
    name: 'guidant_get_tool_metrics',
    description: 'Get detailed metrics for specific tools or categories',
    parameters: z.object({
      toolName: z.string().optional().describe('Specific tool to get metrics for'),
      category: z.string().optional().describe('Tool category to analyze'),
      includePerformance: z.boolean().default(true).describe('Include performance metrics'),
      includeErrors: z.boolean().default(true).describe('Include error metrics'),
      sortBy: z.enum(['usage', 'performance', 'errors', 'name']).default('usage').describe('Sort metrics by')
    }),
    execute: async ({ toolName, category, includePerformance, includeErrors, sortBy }) => {
      try {
        let toolMetrics = toolAnalytics.getToolMetrics(toolName);
        let performanceMetrics = {};
        let errorAnalysis = {};

        if (includePerformance) {
          performanceMetrics = toolAnalytics.getPerformanceMetrics(toolName);
        }

        if (includeErrors) {
          errorAnalysis = toolAnalytics.getErrorAnalysis(toolName);
        }

        // Filter by category if specified
        if (category) {
          const categoryTools = toolCategoryManager.getToolsByCategory(category);
          toolMetrics = Object.fromEntries(
            Object.entries(toolMetrics).filter(([tool]) => categoryTools.includes(tool))
          );
        }

        // Sort metrics
        const sortedTools = Object.entries(toolMetrics).sort((a, b) => {
          switch (sortBy) {
            case 'usage':
              return b[1].totalExecutions - a[1].totalExecutions;
            case 'performance':
              return parseFloat(a[1].averageExecutionTime) - parseFloat(b[1].averageExecutionTime);
            case 'errors':
              return parseFloat(b[1].errorRate) - parseFloat(a[1].errorRate);
            case 'name':
              return a[0].localeCompare(b[0]);
            default:
              return 0;
          }
        });

        return formatSuccessResponse({
          toolMetrics: Object.fromEntries(sortedTools),
          performanceMetrics,
          errorAnalysis,
          category,
          sortBy,
          totalTools: sortedTools.length,
          message: `Retrieved metrics for ${sortedTools.length} tools`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to get tool metrics: ${error.message}`);
      }
    }
  });

  // Get usage patterns
  server.addTool({
    name: 'guidant_get_usage_patterns',
    description: 'Analyze tool usage patterns and trends',
    parameters: z.object({
      analysisType: z.enum(['hourly', 'daily', 'sequences', 'sessions']).default('hourly').describe('Type of pattern analysis'),
      timeRange: z.enum(['24h', '7d', '30d']).default('24h').describe('Time range for analysis'),
      includeRecommendations: z.boolean().default(true).describe('Include optimization recommendations')
    }),
    execute: async ({ analysisType, timeRange, includeRecommendations }) => {
      try {
        const patterns = toolAnalytics.getUsagePatterns(timeRange);
        let analysisResult = {};

        switch (analysisType) {
          case 'hourly':
            analysisResult = {
              hourlyDistribution: patterns.hourlyDistribution,
              peakHours: patterns.peakHours,
              insights: this.generateHourlyInsights(patterns.hourlyDistribution)
            };
            break;
          case 'sequences':
            analysisResult = {
              commonSequences: patterns.toolSequences,
              insights: this.generateSequenceInsights(patterns.toolSequences)
            };
            break;
          case 'sessions':
            analysisResult = {
              sessionStats: patterns.sessionStats,
              insights: this.generateSessionInsights(patterns.sessionStats)
            };
            break;
          default:
            analysisResult = patterns;
        }

        const response = {
          patterns: analysisResult,
          analysisType,
          timeRange,
          message: `Usage pattern analysis completed for ${analysisType} patterns`
        };

        if (includeRecommendations) {
          response.recommendations = toolAnalytics.generateRecommendations();
        }

        return formatSuccessResponse(response);

      } catch (error) {
        return formatErrorResponse(`Failed to analyze usage patterns: ${error.message}`);
      }
    }
  });

  // Start performance monitoring
  server.addTool({
    name: 'guidant_start_monitoring',
    description: 'Start real-time performance monitoring',
    parameters: z.object({
      monitorInterval: z.number().default(30000).describe('Monitoring interval in milliseconds'),
      enableMemoryMonitoring: z.boolean().default(true).describe('Enable memory usage monitoring'),
      memoryThreshold: z.number().default(100 * 1024 * 1024).describe('Memory threshold for alerts (bytes)')
    }),
    execute: async ({ monitorInterval, enableMemoryMonitoring, memoryThreshold }) => {
      try {
        performanceMonitor.options.monitorInterval = monitorInterval;
        performanceMonitor.options.enableMemoryMonitoring = enableMemoryMonitoring;
        performanceMonitor.options.memoryThreshold = memoryThreshold;

        performanceMonitor.startMonitoring();

        return formatSuccessResponse({
          monitoring: true,
          interval: monitorInterval,
          memoryMonitoring: enableMemoryMonitoring,
          memoryThreshold,
          message: 'Performance monitoring started successfully'
        });

      } catch (error) {
        return formatErrorResponse(`Failed to start monitoring: ${error.message}`);
      }
    }
  });

  // Stop performance monitoring
  server.addTool({
    name: 'guidant_stop_monitoring',
    description: 'Stop real-time performance monitoring',
    parameters: z.object({}),
    execute: async () => {
      try {
        performanceMonitor.stopMonitoring();

        return formatSuccessResponse({
          monitoring: false,
          message: 'Performance monitoring stopped successfully'
        });

      } catch (error) {
        return formatErrorResponse(`Failed to stop monitoring: ${error.message}`);
      }
    }
  });

  // Get performance summary
  server.addTool({
    name: 'guidant_get_performance_summary',
    description: 'Get current system performance summary',
    parameters: z.object({
      includeAlerts: z.boolean().default(true).describe('Include recent performance alerts')
    }),
    execute: async ({ includeAlerts }) => {
      try {
        const summary = performanceMonitor.getPerformanceSummary();
        
        const response = {
          performance: summary,
          timestamp: new Date().toISOString(),
          message: `Performance summary - Memory: ${summary.memory.trend}, Monitoring: ${summary.monitoring ? 'active' : 'inactive'}`
        };

        if (!includeAlerts) {
          delete response.performance.alerts;
        }

        return formatSuccessResponse(response);

      } catch (error) {
        return formatErrorResponse(`Failed to get performance summary: ${error.message}`);
      }
    }
  });

  // Record custom metric
  server.addTool({
    name: 'guidant_record_metric',
    description: 'Record a custom metric or business event',
    parameters: z.object({
      metricName: z.string().describe('Name of the metric to record'),
      value: z.any().describe('Metric value'),
      tags: z.record(z.any()).optional().describe('Additional tags for the metric'),
      metricType: z.enum(['custom', 'business', 'workflow']).default('custom').describe('Type of metric')
    }),
    execute: async ({ metricName, value, tags = {}, metricType }) => {
      try {
        switch (metricType) {
          case 'business':
            metricsCollector.recordBusinessMetric(metricName, { value, ...tags });
            break;
          case 'workflow':
            metricsCollector.recordWorkflowMilestone(metricName, tags.workflowId || 'unknown', { value, ...tags });
            break;
          default:
            metricsCollector.recordCustomMetric(metricName, value, tags);
        }

        return formatSuccessResponse({
          metricName,
          value,
          tags,
          metricType,
          recorded: true,
          timestamp: new Date().toISOString(),
          message: `${metricType} metric '${metricName}' recorded successfully`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to record metric: ${error.message}`);
      }
    }
  });

  // Get category metrics
  server.addTool({
    name: 'guidant_get_category_metrics',
    description: 'Get metrics grouped by tool categories',
    parameters: z.object({
      includeToolBreakdown: z.boolean().default(false).describe('Include individual tool metrics within categories')
    }),
    execute: async ({ includeToolBreakdown }) => {
      try {
        const categories = toolCategoryManager.getAllCategories();
        const categoryMetrics = {};

        for (const category of categories) {
          const categoryTools = toolCategoryManager.getToolsByCategory(category.id);
          const toolMetrics = toolAnalytics.getToolMetrics();
          
          let totalExecutions = 0;
          let totalErrors = 0;
          let totalExecutionTime = 0;
          const categoryToolMetrics = {};

          for (const toolName of categoryTools) {
            if (toolMetrics[toolName]) {
              const metrics = toolMetrics[toolName];
              totalExecutions += parseInt(metrics.totalExecutions) || 0;
              totalErrors += (parseInt(metrics.totalExecutions) * parseFloat(metrics.errorRate) / 100) || 0;
              totalExecutionTime += parseFloat(metrics.averageExecutionTime) || 0;
              
              if (includeToolBreakdown) {
                categoryToolMetrics[toolName] = metrics;
              }
            }
          }

          categoryMetrics[category.id] = {
            name: category.name,
            description: category.description,
            toolCount: categoryTools.length,
            totalExecutions,
            errorRate: totalExecutions > 0 ? ((totalErrors / totalExecutions) * 100).toFixed(2) : 0,
            averageExecutionTime: categoryTools.length > 0 ? Math.round(totalExecutionTime / categoryTools.length) : 0,
            tools: includeToolBreakdown ? categoryToolMetrics : categoryTools
          };
        }

        return formatSuccessResponse({
          categoryMetrics,
          totalCategories: categories.length,
          includeToolBreakdown,
          message: `Retrieved metrics for ${categories.length} tool categories`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to get category metrics: ${error.message}`);
      }
    }
  });

  // Export analytics data
  server.addTool({
    name: 'guidant_export_analytics',
    description: 'Export analytics data for external analysis',
    parameters: z.object({
      format: z.enum(['json', 'csv']).default('json').describe('Export format'),
      includeRawData: z.boolean().default(false).describe('Include raw metrics data'),
      timeRange: z.enum(['24h', '7d', '30d', 'all']).default('7d').describe('Time range for export')
    }),
    execute: async ({ format, includeRawData, timeRange }) => {
      try {
        const report = toolAnalytics.getAnalyticsReport({
          timeRange,
          includeRawData
        });

        const exportData = {
          exportInfo: {
            timestamp: new Date().toISOString(),
            format,
            timeRange,
            includeRawData
          },
          analytics: report
        };

        if (format === 'csv') {
          // Convert to CSV format (simplified)
          const csvData = this.convertToCSV(report);
          exportData.csvData = csvData;
        }

        return formatSuccessResponse({
          exportData,
          format,
          timeRange,
          dataSize: JSON.stringify(exportData).length,
          message: `Analytics data exported in ${format} format`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to export analytics data: ${error.message}`);
      }
    }
  });

  console.log('📊 Tool analytics tools registered successfully');
}

/**
 * Helper function to convert analytics data to CSV format
 */
function convertToCSV(report) {
  const csvLines = [];
  
  // Tool metrics CSV
  csvLines.push('Tool Name,Total Executions,Success Rate,Average Execution Time,Error Rate');
  for (const [toolName, metrics] of Object.entries(report.toolMetrics || {})) {
    csvLines.push(`${toolName},${metrics.totalExecutions},${metrics.successRate},${metrics.averageExecutionTime},${metrics.errorRate}`);
  }
  
  return csvLines.join('\n');
}

/**
 * Helper function to generate hourly insights
 */
function generateHourlyInsights(hourlyData) {
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));
  const quietHour = hourlyData.indexOf(Math.min(...hourlyData));
  
  return {
    peakHour: `${peakHour}:00`,
    quietHour: `${quietHour}:00`,
    peakUsage: Math.max(...hourlyData),
    totalUsage: hourlyData.reduce((sum, usage) => sum + usage, 0)
  };
}

/**
 * Helper function to generate sequence insights
 */
function generateSequenceInsights(sequences) {
  if (!sequences || sequences.length === 0) {
    return { message: 'No common tool sequences found' };
  }
  
  return {
    mostCommonSequence: sequences[0],
    totalSequences: sequences.length,
    message: `Most common sequence: ${sequences[0].sequence} (${sequences[0].count} times)`
  };
}

/**
 * Helper function to generate session insights
 */
function generateSessionInsights(sessionStats) {
  return {
    efficiency: sessionStats.averageToolsPerSession > 5 ? 'high' : 'moderate',
    sessionLength: sessionStats.averageSessionDuration > 300 ? 'long' : 'short',
    message: `Average ${sessionStats.averageToolsPerSession} tools per session, ${sessionStats.averageSessionDuration}s duration`
  };
}
