-- Add categories to the database
INSERT INTO "Category" (name, slug) VALUES
  ('Furniture', 'furniture'),
  ('Electronics', 'electronics'),
  ('Books', 'books'),
  ('Clothing', 'clothing'),
  ('Appliances', 'appliances'),
  ('School Supplies', 'school-supplies'),
  ('Sports Equipment', 'sports-equipment'),
  ('Other', 'other')
ON CONFLICT (slug) DO NOTHING;
