/**
 * Smart Project Classification System
 * Analyzes projects and determines optimal workflow patterns
 */

// Use existing AI integration pattern from task-generator.js

/**
 * Project type definitions with workflow characteristics
 */
export const PROJECT_TYPES = {
	prototype: {
		name: 'Prototype',
		description: 'Quick proof-of-concept or MVP',
		complexity: 'simple',
		phases: ['concept', 'design', 'implementation'],
		estimatedDuration: '1-2 weeks',
		qualityLevel: 'basic',
		researchRequirement: 'minimal'
	},
	
	feature: {
		name: 'Feature',
		description: 'Adding functionality to existing product',
		complexity: 'standard',
		phases: ['requirements', 'design', 'implementation', 'deployment'],
		estimatedDuration: '2-4 weeks',
		qualityLevel: 'standard',
		researchRequirement: 'moderate'
	},
	
	product: {
		name: 'Product',
		description: 'Full product development',
		complexity: 'enterprise',
		phases: ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'],
		estimatedDuration: '2-6 months',
		qualityLevel: 'enterprise',
		researchRequirement: 'comprehensive'
	},
	
	research: {
		name: 'Research',
		description: 'Investigation or analysis project',
		complexity: 'standard',
		phases: ['concept', 'requirements', 'implementation'],
		estimatedDuration: '1-3 weeks',
		qualityLevel: 'standard',
		researchRequirement: 'extensive'
	},
	
	script: {
		name: 'Script',
		description: 'Automation or utility script',
		complexity: 'simple',
		phases: ['concept', 'implementation'],
		estimatedDuration: '1-3 days',
		qualityLevel: 'basic',
		researchRequirement: 'minimal'
	}
};

/**
 * Complexity levels with different rigor requirements
 */
export const COMPLEXITY_LEVELS = {
	simple: {
		name: 'Simple',
		description: 'Quick development with basic quality gates',
		qualityGates: 'basic',
		documentation: 'minimal',
		testing: 'basic',
		review: 'self'
	},
	
	standard: {
		name: 'Standard',
		description: 'Balanced development with standard practices',
		qualityGates: 'standard',
		documentation: 'comprehensive',
		testing: 'thorough',
		review: 'peer'
	},
	
	enterprise: {
		name: 'Enterprise',
		description: 'Full enterprise development with rigorous quality',
		qualityGates: 'enterprise',
		documentation: 'extensive',
		testing: 'comprehensive',
		review: 'formal'
	}
};

/**
 * 3-Question Project Classification Wizard
 */
export class ProjectClassificationWizard {
	constructor() {
		this.questions = [
			{
				id: 'scope',
				question: 'What is the scope of your project?',
				options: [
					{ value: 'proof_concept', label: 'Proof of concept or quick prototype', weight: { prototype: 3, script: 2 } },
					{ value: 'add_feature', label: 'Adding feature to existing product', weight: { feature: 3, product: 1 } },
					{ value: 'full_product', label: 'Building a complete product', weight: { product: 3, feature: 1 } },
					{ value: 'research_analysis', label: 'Research or analysis project', weight: { research: 3, prototype: 1 } },
					{ value: 'automation_script', label: 'Automation or utility script', weight: { script: 3, prototype: 1 } }
				]
			},
			{
				id: 'timeline',
				question: 'What is your target timeline?',
				options: [
					{ value: 'days', label: 'Days (1-7 days)', weight: { script: 3, prototype: 2 } },
					{ value: 'weeks_short', label: 'Short-term (1-4 weeks)', weight: { prototype: 2, feature: 3, research: 2 } },
					{ value: 'weeks_long', label: 'Medium-term (1-3 months)', weight: { feature: 2, product: 2, research: 1 } },
					{ value: 'months', label: 'Long-term (3+ months)', weight: { product: 3, feature: 1 } }
				]
			},
			{
				id: 'quality',
				question: 'What quality level do you need?',
				options: [
					{ value: 'basic', label: 'Basic - Quick and functional', weight: { script: 3, prototype: 3 } },
					{ value: 'standard', label: 'Standard - Good practices and testing', weight: { feature: 3, research: 3, prototype: 1 } },
					{ value: 'enterprise', label: 'Enterprise - Full documentation and rigorous testing', weight: { product: 3, feature: 1 } }
				]
			}
		];
	}

	/**
	 * Analyze answers and determine project type
	 */
	classifyProject(answers) {
		const scores = {};
		
		// Initialize scores
		Object.keys(PROJECT_TYPES).forEach(type => {
			scores[type] = 0;
		});

		// Calculate weighted scores
		this.questions.forEach(question => {
			const answer = answers[question.id];
			const option = question.options.find(opt => opt.value === answer);
			
			if (option && option.weight) {
				Object.entries(option.weight).forEach(([type, weight]) => {
					scores[type] += weight;
				});
			}
		});

		// Find the highest scoring type
		const bestType = Object.entries(scores)
			.sort(([,a], [,b]) => b - a)[0][0];

		const projectType = PROJECT_TYPES[bestType];
		const complexity = this.determineComplexity(answers, projectType);

		return {
			type: bestType,
			projectType,
			complexity,
			confidence: this.calculateConfidence(scores, bestType),
			scores,
			recommendations: this.generateRecommendations(projectType, complexity)
		};
	}

	/**
	 * Determine complexity level based on answers and project type
	 */
	determineComplexity(answers, projectType) {
		const qualityAnswer = answers.quality;
		const timelineAnswer = answers.timeline;

		// Quality-based complexity
		if (qualityAnswer === 'enterprise') return COMPLEXITY_LEVELS.enterprise;
		if (qualityAnswer === 'basic') return COMPLEXITY_LEVELS.simple;

		// Timeline-based complexity for standard quality
		if (timelineAnswer === 'days' || timelineAnswer === 'weeks_short') {
			return COMPLEXITY_LEVELS.simple;
		}
		if (timelineAnswer === 'months') {
			return COMPLEXITY_LEVELS.enterprise;
		}

		// Default to project type complexity
		return COMPLEXITY_LEVELS[projectType.complexity];
	}

	/**
	 * Calculate confidence score for classification
	 */
	calculateConfidence(scores, bestType) {
		const sortedScores = Object.values(scores).sort((a, b) => b - a);
		const topScore = sortedScores[0];
		const secondScore = sortedScores[1] || 0;
		
		if (topScore === 0) return 0;
		
		// Confidence based on margin between top two scores
		const margin = (topScore - secondScore) / topScore;
		return Math.round(margin * 100);
	}

	/**
	 * Generate recommendations based on classification
	 */
	generateRecommendations(projectType, complexity) {
		return {
			workflow: `${projectType.name} workflow with ${complexity.name.toLowerCase()} quality gates`,
			phases: projectType.phases,
			estimatedDuration: projectType.estimatedDuration,
			keyFocus: this.getKeyFocus(projectType),
			qualityGates: complexity.qualityGates,
			researchLevel: projectType.researchRequirement
		};
	}

	/**
	 * Get key focus areas for project type
	 */
	getKeyFocus(projectType) {
		const focusMap = {
			prototype: ['Speed', 'Core functionality', 'User validation'],
			feature: ['Integration', 'User experience', 'Testing'],
			product: ['Scalability', 'Architecture', 'Market fit'],
			research: ['Analysis', 'Documentation', 'Insights'],
			script: ['Automation', 'Reliability', 'Simplicity']
		};

		return focusMap[projectType.name.toLowerCase()] || ['Quality', 'Functionality'];
	}
}

/**
 * AI-Enhanced Project Classification
 * Uses AI to analyze project description and suggest classification
 */
export async function classifyProjectWithAI(projectDescription, existingFiles = [], projectRoot = process.cwd()) {
	const prompt = `
Analyze this project and classify it:

PROJECT DESCRIPTION:
${projectDescription}

EXISTING FILES:
${existingFiles.slice(0, 10).join(', ') || 'None'}

CLASSIFICATION OPTIONS:
1. Prototype - Quick proof-of-concept or MVP
2. Feature - Adding functionality to existing product
3. Product - Full product development
4. Research - Investigation or analysis project
5. Script - Automation or utility script

COMPLEXITY LEVELS:
- Simple: Quick development, basic quality
- Standard: Balanced development, standard practices
- Enterprise: Rigorous development, full documentation

Please respond with JSON:
{
  "type": "prototype|feature|product|research|script",
  "complexity": "simple|standard|enterprise",
  "confidence": 85,
  "reasoning": "Brief explanation of classification",
  "suggestedPhases": ["phase1", "phase2"],
  "estimatedDuration": "1-2 weeks"
}`;

	// Use same multi-provider pattern as task-generator.js
	const providers = [
		{ name: 'OpenRouter', key: process.env.OPENROUTER_API_KEY, model: 'anthropic/claude-3.5-sonnet', baseUrl: 'https://openrouter.ai/api/v1' },
		{ name: 'Perplexity', key: process.env.PERPLEXITY_API_KEY, model: 'llama-3.1-sonar-large-128k-online', baseUrl: 'https://api.perplexity.ai' }
	];

	// Try each provider
	for (const provider of providers) {
		if (provider.key) {
			try {
				console.log(`Classifying project using ${provider.name}...`);

				const response = await fetch(`${provider.baseUrl}/chat/completions`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${provider.key}`,
						'Content-Type': 'application/json',
						'HTTP-Referer': 'https://github.com/louisklinogo/Guidant',
						'X-Title': 'Guidant Evolution'
					},
					body: JSON.stringify({
						model: provider.model,
						messages: [
							{
								role: 'system',
								content: 'You are an expert project manager who classifies software projects. Always respond with valid JSON.'
							},
							{
								role: 'user',
								content: prompt
							}
						],
						max_tokens: 500,
						temperature: 0.3
					})
				});

				if (!response.ok) {
					throw new Error(`${provider.name} API error: ${response.status}`);
				}

				const data = await response.json();
				const aiResponse = data.choices[0].message.content;

				// Try to parse JSON response
				try {
					const classification = JSON.parse(aiResponse);
					console.log(`✅ Project classified successfully using ${provider.name}`);

					return {
						success: true,
						classification,
						source: 'ai',
						provider: provider.name
					};
				} catch (parseError) {
					console.warn(`Failed to parse ${provider.name} response as JSON:`, parseError.message);
					continue;
				}
			} catch (error) {
				console.warn(`${provider.name} failed for classification:`, error.message);
				continue;
			}
		}
	}

	// Enhanced rule-based fallback (same as before but with better logging)
	console.warn('All AI providers failed, using enhanced rule-based classification');

	const description = projectDescription.toLowerCase();
	let type = 'feature'; // default
	let complexity = 'standard'; // default

	// Basic keyword detection
	if (description.includes('prototype') || description.includes('mvp') || description.includes('proof')) {
		type = 'prototype';
		complexity = 'simple';
	} else if (description.includes('script') || description.includes('automation') || description.includes('utility')) {
		type = 'script';
		complexity = 'simple';
	} else if (description.includes('research') || description.includes('analysis') || description.includes('study')) {
		type = 'research';
		complexity = 'standard';
	} else if (description.includes('product') || description.includes('application') || description.includes('platform')) {
		type = 'product';
		complexity = 'enterprise';
	}

	// Complexity detection
	if (description.includes('enterprise') || description.includes('production') || description.includes('scalable')) {
		complexity = 'enterprise';
	} else if (description.includes('simple') || description.includes('quick') || description.includes('basic')) {
		complexity = 'simple';
	}

	return {
		success: true,
		classification: {
			type,
			complexity,
			confidence: 70,
			reasoning: `Rule-based classification based on keywords in description`,
			suggestedPhases: PROJECT_TYPES[type]?.phases || ['concept', 'implementation'],
			estimatedDuration: PROJECT_TYPES[type]?.estimatedDuration || '2-4 weeks'
		},
		source: 'rule-based-fallback'
	};
}
