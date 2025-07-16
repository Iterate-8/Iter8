# Iter8 - Customer Feedback Platform

A minimalistic platform for collecting customer feedback on startup websites and applications.

## Features

- 🔐 **Authentication**: Secure user authentication with Supabase
- 🌐 **Website Embedding**: Interactive canvas for testing websites
- 💬 **Feedback Collection**: Real-time feedback submission
- 📊 **Data Storage**: Store user feedback with URLs in Supabase
- 🎨 **Clean Design**: Minimalistic UI with monospace fonts

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Create the following table in your Supabase database:

```sql
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);
```

3. Get your Supabase URL and anon key from the project settings
4. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

1. **Sign Up/In**: Create an account or sign in with your email
2. **Enter Website URL**: Input the website you want to test
3. **Interact**: Navigate through the website in the embedded canvas
4. **Provide Feedback**: Use the feedback box to submit your thoughts
5. **Track Progress**: All feedback is saved with the current URL

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Styling**: Custom monospace design system
- **Components**: Modular React components with clean separation

## Database Schema

### feedback table
- `id`: Unique identifier (UUID)
- `user_id`: Reference to authenticated user
- `url`: The website URL being tested
- `feedback`: User's feedback text
- `created_at`: Timestamp of submission

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
