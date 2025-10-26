-- Insert routing rules data
INSERT INTO routing_rules (id, created_at, priority, conditions, partner_api_url, partner_name, is_active)
VALUES
  (
    1,
    '2025-10-24 00:03:22.778121+00',
    10,
    '{"interest": "Education"}'::jsonb,
    'https://api.example.com/educate',
    'EDU_API',
    true
  ),
  (
    2,
    '2025-10-24 00:03:22.778121+00',
    20,
    '{"country": "US", "interest": "Finance"}'::jsonb,
    'https://api.example.com/finance',
    'FIN_API_US',
    true
  ),
  (
    3,
    '2025-10-24 00:03:22.778121+00',
    100,
    '{}'::jsonb,
    'https://api.example.com/insurance',
    'FALLBACK_API',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  priority = EXCLUDED.priority,
  conditions = EXCLUDED.conditions,
  partner_api_url = EXCLUDED.partner_api_url,
  partner_name = EXCLUDED.partner_name,
  is_active = EXCLUDED.is_active;
