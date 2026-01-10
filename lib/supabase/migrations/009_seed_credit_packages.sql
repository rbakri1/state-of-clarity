-- Seed credit packages with initial pricing
-- stripe_price_id is left as placeholder - configure in Stripe Dashboard

INSERT INTO credit_packages (name, credits, price_gbp, stripe_price_id, active)
VALUES 
  ('Single', 1, 0.65, 'price_single_placeholder', true),
  ('Starter', 10, 6.00, 'price_starter_placeholder', true),
  ('Standard', 50, 28.00, 'price_standard_placeholder', true),
  ('Pro', 100, 52.00, 'price_pro_placeholder', true)
ON CONFLICT DO NOTHING;
