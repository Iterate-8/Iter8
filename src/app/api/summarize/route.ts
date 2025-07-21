import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Use OpenAI GPT-3.5-turbo for summarization
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a feedback analyzer for a startup platform. Extract ONLY the most important, actionable feedback points from customer feedback. 

RULES:
- Return ONLY bullet points (• or -)
- Focus on specific issues, bugs, feature requests, or UX problems
- Be concise and direct
- Skip general comments or compliments
- Maximum 5-7 bullet points
- Each bullet should be 1-2 sentences max
- If no actionable feedback found, return "No specific actionable feedback identified"`

            },
            {
              role: "user",
              content: `Analyze this customer feedback and extract the key actionable points:\n\n${text}`
            }
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('OpenAI error response:', errorText);
      
      // If quota exceeded, return a simple fallback summary
      if (response.status === 429) {
        const words = text.split(' ').slice(0, 20).join(' ');
        return NextResponse.json({ 
          summary: `• ${words}...\n• [AI summarization temporarily unavailable due to quota limit]\n• Please check OpenAI billing or try again later` 
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    // Extract the summary from the response
    const summary = result.choices?.[0]?.message?.content || "Unable to generate summary";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 