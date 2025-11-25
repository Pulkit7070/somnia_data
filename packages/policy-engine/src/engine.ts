/**
 * @swc/policy-engine - Policy Engine
 * Evaluates transactions against configured rules and returns risk assessments
 */

import {
  PolicyRule,
  PolicyContext,
  Transaction,
  PolicyEvaluationResult,
  RiskLevel,
  Logger,
  RiskDetectedAlert,
  AlertType,
} from '@swc/shared';

const logger = new Logger('PolicyEngine');

export interface PolicyEngineConfig {
  autoBlock: boolean;
  enabledRules: string[];
  parallelExecution: boolean;
}

export interface PolicyEngineResult {
  allowed: boolean;
  riskLevel: RiskLevel;
  triggeredRules: Array<{
    rule: PolicyRule;
    result: PolicyEvaluationResult;
  }>;
  alerts: RiskDetectedAlert[];
  recommendations: string[];
}

/**
 * Policy Engine
 * Evaluates transactions against security rules
 */
export class PolicyEngine {
  private rules = new Map<string, PolicyRule>();

  constructor(private config: PolicyEngineConfig) {}

  /**
   * Register a policy rule
   */
  registerRule(rule: PolicyRule): void {
    this.rules.set(rule.id, rule);
    logger.debug(`Registered rule: ${rule.name} (${rule.id})`);
  }

  /**
   * Unregister a policy rule
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.debug(`Unregistered rule: ${ruleId}`);
  }

  /**
   * Get all registered rules
   */
  getRules(): PolicyRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): PolicyRule[] {
    return this.getRules().filter(
      (rule) => rule.enabled && this.config.enabledRules.includes(rule.id)
    );
  }

  /**
   * Evaluate transaction against all enabled rules
   */
  async evaluateTransaction(
    tx: Transaction,
    context: PolicyContext
  ): Promise<PolicyEngineResult> {
    const enabledRules = this.getEnabledRules();
    
    logger.debug(`Evaluating transaction against ${enabledRules.length} rules`);

    // Execute rules
    const results = this.config.parallelExecution
      ? await this.evaluateParallel(tx, context, enabledRules)
      : await this.evaluateSequential(tx, context, enabledRules);

    // Filter triggered rules
    const triggeredRules = results.filter((r) => r.result.triggered);

    if (triggeredRules.length === 0) {
      logger.debug('No rules triggered - transaction allowed');
      return {
        allowed: true,
        riskLevel: RiskLevel.INFO,
        triggeredRules: [],
        alerts: [],
        recommendations: [],
      };
    }

    logger.warn(`${triggeredRules.length} rules triggered`);

    // Determine highest risk level
    const highestRiskLevel = this.getHighestRiskLevel(triggeredRules);

    // Determine if transaction should be blocked
    const shouldBlock = this.shouldBlockTransaction(triggeredRules);
    const allowed = this.config.autoBlock ? !shouldBlock : true;

    // Generate alerts
    const alerts = this.generateAlerts(tx, triggeredRules);

    // Generate recommendations
    const recommendations = this.generateRecommendations(triggeredRules);

    logger.info(
      `Transaction evaluation complete: ${allowed ? 'ALLOWED' : 'BLOCKED'} (risk: ${highestRiskLevel})`
    );

    return {
      allowed,
      riskLevel: highestRiskLevel,
      triggeredRules,
      alerts,
      recommendations,
    };
  }

  /**
   * Evaluate single rule
   */
  async evaluateRule(
    ruleId: string,
    tx: Transaction,
    context: PolicyContext
  ): Promise<PolicyEvaluationResult | null> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      return null;
    }

    try {
      const result = await rule.evaluate(tx, context);
      return result;
    } catch (error) {
      logger.error(`Rule ${ruleId} evaluation failed:`, error);
      return null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PolicyEngineConfig>): void {
    Object.assign(this.config, config);
    logger.info('Policy engine configuration updated');
  }

  /**
   * Get configuration
   */
  getConfig(): PolicyEngineConfig {
    return { ...this.config };
  }

  // Private methods

  private async evaluateParallel(
    tx: Transaction,
    context: PolicyContext,
    rules: PolicyRule[]
  ): Promise<Array<{ rule: PolicyRule; result: PolicyEvaluationResult }>> {
    const promises = rules.map(async (rule) => {
      try {
        const result = await rule.evaluate(tx, context);
        return { rule, result };
      } catch (error) {
        logger.error(`Rule ${rule.id} failed:`, error);
        return {
          rule,
          result: { triggered: false },
        };
      }
    });

    return Promise.all(promises);
  }

  private async evaluateSequential(
    tx: Transaction,
    context: PolicyContext,
    rules: PolicyRule[]
  ): Promise<Array<{ rule: PolicyRule; result: PolicyEvaluationResult }>> {
    const results: Array<{ rule: PolicyRule; result: PolicyEvaluationResult }> = [];

    for (const rule of rules) {
      try {
        const result = await rule.evaluate(tx, context);
        results.push({ rule, result });

        // Early exit if critical block rule triggers
        if (
          result.triggered &&
          result.suggestedAction === 'block' &&
          rule.riskLevel === RiskLevel.CRITICAL
        ) {
          logger.warn(`Critical rule ${rule.id} triggered - stopping evaluation`);
          break;
        }
      } catch (error) {
        logger.error(`Rule ${rule.id} failed:`, error);
      }
    }

    return results;
  }

  private getHighestRiskLevel(
    triggeredRules: Array<{ rule: PolicyRule; result: PolicyEvaluationResult }>
  ): RiskLevel {
    const riskLevels = triggeredRules.map((r) => r.rule.riskLevel);
    const riskOrder = [
      RiskLevel.CRITICAL,
      RiskLevel.HIGH,
      RiskLevel.MEDIUM,
      RiskLevel.LOW,
      RiskLevel.INFO,
    ];

    for (const level of riskOrder) {
      if (riskLevels.includes(level)) {
        return level;
      }
    }

    return RiskLevel.INFO;
  }

  private shouldBlockTransaction(
    triggeredRules: Array<{ rule: PolicyRule; result: PolicyEvaluationResult }>
  ): boolean {
    return triggeredRules.some((r) => r.result.suggestedAction === 'block');
  }

  private generateAlerts(
    tx: Transaction,
    triggeredRules: Array<{ rule: PolicyRule; result: PolicyEvaluationResult }>
  ): RiskDetectedAlert[] {
    return triggeredRules
      .filter((r) => r.result.message)
      .map((r) => ({
        type: AlertType.RISK_DETECTED,
        level: r.rule.riskLevel,
        ruleId: r.rule.id,
        ruleName: r.rule.name,
        description: r.result.message || r.rule.description,
        evidence: r.result.evidence || {},
        suggestedAction: r.result.suggestedAction || 'warn',
        transaction: {
          from: tx.from,
          to: tx.to || '',
          value: tx.value,
          data: tx.data,
          gas: tx.gas,
        },
        overridable: r.rule.riskLevel !== RiskLevel.CRITICAL,
        timestamp: Date.now(),
      }));
  }

  private generateRecommendations(
    triggeredRules: Array<{ rule: PolicyRule; result: PolicyEvaluationResult }>
  ): string[] {
    const recommendations: string[] = [];

    for (const { rule, result } of triggeredRules) {
      if (result.suggestedAction === 'block') {
        recommendations.push(`Do not proceed with this transaction (${rule.name})`);
      } else if (result.suggestedAction === 'warn') {
        recommendations.push(`Review transaction details carefully (${rule.name})`);
      }
    }

    return recommendations;
  }
}
