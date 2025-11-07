/**
 * Integration Tests for Health Check API
 */

import { GET } from '@/app/api/health/route';

describe('Health Check API', () => {
  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.uptime).toBeGreaterThan(0);
    expect(data.environment).toBe('test');
  });

  it('should include version information', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.version).toBeDefined();
  });
});
