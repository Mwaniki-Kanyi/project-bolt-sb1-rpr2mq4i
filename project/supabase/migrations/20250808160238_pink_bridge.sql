/*
  # Initial Schema for Sentry Jamii

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `user_type` (text: community, ranger, admin)
      - `created_at` (timestamp)
    
    - `reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, references user_profiles)
      - `animal_type` (text)
      - `image_url` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `status` (text: pending, invalid, updated, ranger_assigned)
      - `feedback` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create bucket for wildlife images

  3. Security
    - Enable RLS on all tables
    - Add policies for different user types
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('community', 'ranger', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  animal_type text NOT NULL,
  image_url text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invalid', 'updated', 'ranger_assigned')),
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Reports policies
CREATE POLICY "Anyone can insert reports"
  ON reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read all reports"
  ON reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Rangers and admins can update reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('ranger', 'admin')
    )
  );

CREATE POLICY "Admins can delete reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Create storage bucket for wildlife images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wildlife-images', 'wildlife-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can upload wildlife images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'wildlife-images');

CREATE POLICY "Anyone can view wildlife images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'wildlife-images');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for reports updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();