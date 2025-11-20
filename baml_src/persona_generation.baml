// AFTER BAML: Clean, type-safe persona generation
// This replaces 300+ lines of messy Python

// Define the persona structure we want
// BAML's Schema-Aligned Parsing will fix broken JSON automatically
class UserPersona {
  name string @description("First and last name of the persona")
  age int @description("Age in years")
  occupation string @description("Job title or occupation")

  // Use literals for valid enum values
  tech_comfort "low" | "moderate" | "high" @description("Comfort level with technology")

  income_level string @description("Income bracket")

  // Arrays are always arrays (never strings or null)
  pain_points string[] @description("Key frustrations and challenges")
  goals string[] @description("What they want to achieve")
  preferred_channels string[] @description("How they prefer to communicate")

  quote string @description("A realistic quote from this persona's perspective")
}

// Generate a synthetic user persona from demographic/behavioral segments
function GeneratePersona(segment_data: string) -> UserPersona {
  client "anthropic/claude-3-haiku-20240307"

  prompt #"
    Generate a realistic synthetic user persona based on this demographic and behavioral segment:

    {{ segment_data }}

    Create a detailed, believable persona that represents this user segment.
    Make them feel like a real person with authentic pain points, goals, and a quote.

    {{ ctx.output_format }}
  "#
}

// Test with a sample segment
test busy_parent_persona {
  functions [GeneratePersona]
  args {
    segment_data #"
      Segment: Busy Parents
      Demographics:
      - Age range: 30-45
      - Income: middle class
      - Family: married with children
      - Employment: full-time working

      Behavioral traits:
      - Tech savviness: moderate
      - Time constraints: very high
      - Budget sensitivity: high
      - Priorities: ease of use, time-saving, reliability
    "#
  }
}

test young_professional_persona {
  functions [GeneratePersona]
  args {
    segment_data #"
      Segment: Young Professionals
      Demographics:
      - Age range: 22-32
      - Income: middle to high
      - Family: single or partnered, no kids
      - Employment: career-focused

      Behavioral traits:
      - Tech savviness: high
      - Time constraints: moderate
      - Budget sensitivity: moderate
      - Priorities: innovation, integration, customization
    "#
  }
}
