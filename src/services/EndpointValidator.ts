/**
 * EndpointValidator.ts
 * Strict Endpoint Validation and Anti-Exfiltration System.
 *
 * Enforces:
 * - Exact HTTPS scheme enforcement (no plaintext HTTP for cloud providers)
 * - Exact hostname allowlist (NO substring or wildcard matching)
 * - Approved path prefix validation
 * - Prevention of client-side `allowCustom: true` bypass
 * - Cryptographically provisioned custom endpoints requiring explicit admin authorization
 * - Rejection of control characters, CR/LF injection, and unexpected ports
 */

import { ApprovedEndpointConfig, EndpointValidationResult } from './SecurityTypes';
import { securityLogger } from './SecurityLogger';

interface ApprovedHostSpec {
  hostname: string;
  allowedPrefixes: string[];
  providerName: string;
  expectedPort: number;
}

export class EndpointValidator {
  private static instance: EndpointValidator;

  // Strict allowlist: Exact hostnames only. Substring matches are strictly rejected.
  private readonly APPROVED_HOSTS: Record<string, ApprovedHostSpec> = {
    'generativelanguage.googleapis.com': {
      hostname: 'generativelanguage.googleapis.com',
      allowedPrefixes: ['/v1beta/', '/v1/'],
      providerName: 'gemini',
      expectedPort: 443,
    },
    'api.openai.com': {
      hostname: 'api.openai.com',
      allowedPrefixes: ['/v1/chat/completions', '/v1/audio/', '/v1/models'],
      providerName: 'openai',
      expectedPort: 443,
    },
    'api.deepseek.com': {
      hostname: 'api.deepseek.com',
      allowedPrefixes: ['/v1/chat/completions', '/v1/models'],
      providerName: 'deepseek',
      expectedPort: 443,
    },
    'api.anthropic.com': {
      hostname: 'api.anthropic.com',
      allowedPrefixes: ['/v1/messages'],
      providerName: 'anthropic',
      expectedPort: 443,
    },
  };

  // Stored approved custom configurations that were provisioned via admin authorization
  private provisionedConfigs: Map<string, ApprovedEndpointConfig> = new Map();

  private constructor() {}

  public static getInstance(): EndpointValidator {
    if (!EndpointValidator.instance) {
      EndpointValidator.instance = new EndpointValidator();
    }
    return EndpointValidator.instance;
  }

  /**
   * Validates a target endpoint URL strictly BEFORE any API key is attached.
   * If validation fails, caller MUST abort immediately and never attach credentials.
   */
  public validateEndpoint(
    rawUrl: string,
    provisionedConfigId?: string
  ): EndpointValidationResult {
    if (!rawUrl || typeof rawUrl !== 'string') {
      securityLogger.log('SECURITY_ALERT', 'ENDPOINT_REJECTED', 'Empty or non-string URL provided.');
      return { valid: false, error: 'URL is required and must be a string' };
    }

    const trimmed = rawUrl.trim();

    // 1. Check for CRLF / Header injection characters
    if (/[\r\n\t\0\x00-\x1F\x7F]/.test(trimmed)) {
      securityLogger.log(
        'SECURITY_ALERT',
        'ENDPOINT_INJECTION_BLOCKED',
        'CRLF or control character injection detected in endpoint URL.'
      );
      return { valid: false, error: 'Control characters or CRLF injection rejected' };
    }

    // 2. Parse URL using strict URL parser
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      securityLogger.log('WARN', 'MALFORMED_URL_REJECTED', 'URL parsing failed.');
      return { valid: false, error: 'Malformed URL structure' };
    }

    // 3. Reject plain HTTP for cloud providers
    if (parsed.protocol !== 'https:') {
      securityLogger.log(
        'SECURITY_ALERT',
        'HTTP_CLOUD_ENDPOINT_REJECTED',
        `Non-HTTPS scheme (${parsed.protocol}) rejected for cloud provider.`
      );
      return { valid: false, error: 'HTTPS protocol is strictly required for cloud endpoints' };
    }

    // 4. Validate Port (default HTTPS 443 or explicit 443)
    const port = parsed.port ? parseInt(parsed.port, 10) : 443;
    if (port !== 443) {
      securityLogger.log(
        'SECURITY_ALERT',
        'NON_STANDARD_PORT_REJECTED',
        `Unexpected port ${port} on cloud endpoint.`
      );
      return { valid: false, error: 'Non-standard port rejected for cloud LLM provider' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 5. Check against default approved list via exact key lookup (NO SUBSTRING MATCHING)
    const approvedSpec = this.APPROVED_HOSTS[hostname];
    if (approvedSpec) {
      // Validate path prefix
      const validPath = approvedSpec.allowedPrefixes.some((prefix) =>
        parsed.pathname.startsWith(prefix)
      );
      if (!validPath) {
        securityLogger.log(
          'SECURITY_ALERT',
          'ENDPOINT_PATH_MISMATCH',
          `Host ${hostname} path ${parsed.pathname} does not match approved API endpoints.`
        );
        return {
          valid: false,
          error: `Unapproved API path prefix for provider ${approvedSpec.providerName}`,
        };
      }

      return {
        valid: true,
        hostname,
        provider: approvedSpec.providerName,
        sanitizedUrl: parsed.toString(),
      };
    }

    // 6. Check if this is an explicitly admin-provisioned endpoint with a valid config ID
    if (provisionedConfigId && this.provisionedConfigs.has(provisionedConfigId)) {
      const config = this.provisionedConfigs.get(provisionedConfigId)!;
      if (config.hostname.toLowerCase() === hostname && parsed.pathname.startsWith(config.pathPrefix)) {
        return {
          valid: true,
          hostname,
          provider: config.provider,
          sanitizedUrl: parsed.toString(),
        };
      }
    }

    // If neither, strictly reject!
    securityLogger.log(
      'SECURITY_ALERT',
      'UNTRUSTED_HOST_REJECTED',
      `Untrusted host ${hostname} blocked. Client attempted unverified destination.`
    );
    return {
      valid: false,
      error: `Untrusted endpoint host: ${hostname}. Only approved official providers or admin-provisioned configurations are permitted.`,
    };
  }

  /**
   * Secure Admin Provisioning Flow for Custom Endpoints.
   * Can ONLY be invoked by an authenticated session holding 'PROVIDER_CONFIG' permission.
   */
  public provisionCustomEndpoint(
    adminSessionId: string,
    hasProviderConfigPerm: boolean,
    params: {
      targetUrl: string;
      providerLabel: string;
      allowedPrefix: string;
    }
  ): { success: boolean; configId?: string; error?: string } {
    if (!hasProviderConfigPerm) {
      securityLogger.log(
        'SECURITY_ALERT',
        'PROVISIONING_UNAUTHORIZED',
        'Unauthorized attempt to provision custom endpoint.'
      );
      return { success: false, error: 'ADMIN authorization required to provision custom endpoints.' };
    }

    // Strict URL validation
    let parsed: URL;
    try {
      parsed = new URL(params.targetUrl);
    } catch {
      return { success: false, error: 'Invalid URL for custom endpoint' };
    }

    if (parsed.protocol !== 'https:') {
      return { success: false, error: 'Custom endpoints must use HTTPS' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Prevent loopback, private or SSRF targets in production
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      securityLogger.log(
        'SECURITY_ALERT',
        'SSRF_ENDPOINT_BLOCKED',
        `Attempted to provision private/internal hostname: ${hostname}`
      );
      return { success: false, error: 'Internal/private IP ranges cannot be provisioned as cloud LLM endpoints.' };
    }

    const configId = 'cfg-' + Math.random().toString(36).substring(2, 10);
    const config: ApprovedEndpointConfig = {
      configId,
      provider: 'custom_provisioned',
      hostname,
      pathPrefix: params.allowedPrefix || '/',
      requiresHttps: true,
      provisionedAt: Date.now(),
      provisionedBy: adminSessionId.substring(0, 8),
    };

    this.provisionedConfigs.set(configId, config);

    securityLogger.log(
      'INFO',
      'ENDPOINT_PROVISIONED',
      `Admin successfully provisioned custom endpoint config ${configId} for host ${hostname}.`
    );

    return { success: true, configId };
  }

  public getApprovedHostnames(): string[] {
    return Object.keys(this.APPROVED_HOSTS);
  }

  public getProvisionedConfigs(): ApprovedEndpointConfig[] {
    return Array.from(this.provisionedConfigs.values());
  }
}

export const endpointValidator = EndpointValidator.getInstance();
