/**
 * MCP Response Utilities
 * Helper functions for formatting MCP tool responses properly
 */

/**
 * Helper function to format MCP tool responses properly
 * MCP tools must return either a string or a content object
 * @param {any} data - Data to format as MCP response
 * @returns {object} Properly formatted MCP response
 */
export function formatMCPResponse(data) {
	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(data, null, 2)
			}
		]
	};
}

/**
 * Format a success response with consistent structure
 * @param {object} data - Success data
 * @param {string} message - Success message
 * @param {string} nextAction - Suggested next action
 * @returns {object} Formatted success response
 */
export function formatSuccessResponse(data, message = 'Operation completed successfully', nextAction = null) {
	const response = {
		success: true,
		message,
		...data
	};
	
	if (nextAction) {
		response.nextAction = nextAction;
	}
	
	return formatMCPResponse(response);
}

/**
 * Format an error response with consistent structure
 * @param {string} error - Error message
 * @param {string} nextAction - Suggested next action
 * @returns {object} Formatted error response
 */
export function formatErrorResponse(error, nextAction = null) {
	const response = {
		success: false,
		error
	};
	
	if (nextAction) {
		response.nextAction = nextAction;
	}
	
	return formatMCPResponse(response);
}
