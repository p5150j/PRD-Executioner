"""
BEFORE BAML: The nightmare of generating structured personas

This shows the painful reality of getting LLMs to generate structured synthetic users.
You're trying to turn demographic segments into detailed user personas, but LLMs return:
- JSON wrapped in markdown
- Inconsistent field names
- Wrong data types (strings instead of arrays, ints as strings)
- Missing required fields
- Invalid enum values

300+ lines of parsing hell just to get semi-reliable persona objects.
This is why that 5% failure rate kills user trust.
"""

import os
import json
import re
import time
from typing import Dict, List, Optional, Any
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class UserPersona:
    """Manual data class since we can't trust LLM output"""

    def __init__(
        self,
        name: str,
        age: int,
        occupation: str,
        tech_comfort: str,
        income_level: str,
        pain_points: List[str],
        goals: List[str],
        preferred_channels: List[str],
        quote: str
    ):
        self.name = name
        self.age = age
        self.occupation = occupation
        self.tech_comfort = tech_comfort
        self.income_level = income_level
        self.pain_points = pain_points
        self.goals = goals
        self.preferred_channels = preferred_channels
        self.quote = quote

    def __repr__(self):
        return f"UserPersona(name={self.name}, age={self.age}, occupation={self.occupation})"


def extract_json_from_markdown(text: str) -> str:
    """
    🤮 HACK #1: LLMs wrap JSON in markdown code blocks

    Even when you explicitly say "no markdown", Claude returns:
    ```json
    {"your": "data"}
    ```

    So now we need regex to extract it. Try multiple patterns because
    sometimes it's ```json, sometimes just ```, sometimes nothing.

    This is fragile and breaks when the LLM gets creative.
    """
    patterns = [
        r'```json\s*\n(.*?)\n```',  # Markdown with json language tag
        r'```\s*\n(.*?)\n```',      # Markdown without language tag
        r'\{.*\}',                   # Raw JSON (if we're lucky)
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1) if '```' in pattern else match.group(0)

    return text  # Give up and return raw text 🤷


def clean_json_string(json_str: str) -> str:
    """
    🤮 HACK #2: LLMs return INVALID JSON

    Even though JSON doesn't support comments, Claude adds them:
    {
      "name": "John",  // This is helpful!
      "age": 35        # But breaks JSON.parse()
    }

    Trailing commas are also common:
    ["item1", "item2",]  // Valid in some languages, not in JSON

    So we need MORE regex to strip this out. Hope we don't break anything.
    """
    # Remove // style comments (JavaScript developers...)
    json_str = re.sub(r'//.*?\n', '\n', json_str)

    # Remove # style comments (Python developers...)
    json_str = re.sub(r'#.*?\n', '\n', json_str)

    # Remove trailing commas (because LLMs don't know JSON spec)
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)

    return json_str


def validate_tech_comfort(value: Any) -> str:
    """
    LLMs return: "very comfortable", "tech savvy", "advanced", "expert", "low", etc.
    Need to map to: "low", "moderate", "high"
    """
    if not value or not isinstance(value, str):
        return "moderate"

    value_lower = value.lower().strip()

    if any(word in value_lower for word in ["low", "beginner", "uncomfortable", "struggles", "basic"]):
        return "low"
    elif any(word in value_lower for word in ["high", "advanced", "expert", "savvy", "comfortable", "proficient"]):
        return "high"
    else:
        return "moderate"


def validate_age(value: Any) -> int:
    """
    🤮 HACK #4: LLMs return ages in creative ways

    You ask for: integer age

    You get:
    - "mid-30s" (what does that even mean??)
    - "around 40" (so... 40? 39? 41?)
    - "35 years old" (close, but still a string)
    - "thirty-five" (now we need NLP??)

    So we parse with regex, guess, and pray.
    """
    if isinstance(value, int):
        return max(18, min(100, value))

    if isinstance(value, str):
        # Try to extract number
        match = re.search(r'(\d+)', value)
        if match:
            return max(18, min(100, int(match.group(1))))

    # Default to middle age if can't parse
    return 35


def ensure_string_array(value: Any) -> List[str]:
    """
    🤮 HACK #5: Arrays? What arrays?

    You ask for: string[] (an array of strings)

    You get:
    - "pain1, pain2, pain3" (comma-separated string) 🙄
    - "1. pain\n2. more pain" (numbered list) 🙄
    - "Just one pain point" (single string) 🙄
    - ["pain1", "pain2", "pain3"] (actual array - rare!) 🎉
    - null (because why not) 🙄

    So we need logic to handle FIVE DIFFERENT FORMATS for what should
    be a simple array. This is insanity.
    """
    if not value:
        return []

    if isinstance(value, list):
        return [str(item).strip() for item in value if item]

    if isinstance(value, str):
        # Check for numbered list
        if re.search(r'^\d+\.', value, re.MULTILINE):
            items = re.findall(r'\d+\.\s*(.+?)(?=\n\d+\.|$)', value, re.DOTALL)
            return [item.strip() for item in items if item.strip()]

        # Check for comma-separated
        if ',' in value:
            return [item.strip() for item in value.split(',') if item.strip()]

        # Check for newline-separated
        if '\n' in value:
            return [item.strip() for item in value.split('\n') if item.strip()]

        # Single item
        return [value.strip()] if value.strip() else []

    return []


def parse_and_validate_response(raw_response: str, segment_id: str) -> UserPersona:
    """
    🤮 THE BIG KAHUNA: Parse and validate LLM output

    This is where all the hacks come together in a beautiful symphony of pain.
    We need to:
    1. Extract JSON from markdown (HACK #1)
    2. Clean invalid JSON syntax (HACK #2)
    3. Actually parse it (cross fingers)
    4. Validate EVERY field because the LLM can't be trusted
    5. Coerce types because "35" != 35
    6. Map fuzzy strings to enums (HACK #3)
    7. Handle missing fields with defaults
    8. Pray it works

    And even after all this... it still fails ~5% of the time.
    That 5% is why your users don't trust your AI.
    """
    # Extract JSON from markdown
    json_str = extract_json_from_markdown(raw_response)

    # Clean invalid JSON
    json_str = clean_json_string(json_str)

    # Try to parse
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing failed: {e}")
        print(f"Raw response: {raw_response[:200]}...")
        # Return default fallback
        return UserPersona(
            name=f"Unknown User ({segment_id})",
            age=35,
            occupation="Unknown",
            tech_comfort="moderate",
            income_level="unknown",
            pain_points=["Failed to parse LLM response"],
            goals=[],
            preferred_channels=[],
            quote="Parsing failed"
        )

    # Validate and coerce each field
    try:
        # Name variations: "name", "persona_name", "user_name"
        name = data.get("name") or data.get("persona_name") or data.get("user_name") or f"User {segment_id}"

        # Age can be string or int or range
        age = validate_age(data.get("age"))

        # Occupation
        occupation = str(data.get("occupation") or data.get("job") or "Unknown")

        # Tech comfort has many names
        tech_comfort = validate_tech_comfort(
            data.get("tech_comfort") or
            data.get("tech_savviness") or
            data.get("technical_skill") or
            data.get("tech_level")
        )

        # Income level
        income = str(data.get("income_level") or data.get("income") or "moderate")

        # Arrays - can come in many formats
        pain_points = ensure_string_array(data.get("pain_points") or data.get("challenges") or data.get("frustrations"))
        goals = ensure_string_array(data.get("goals") or data.get("objectives") or data.get("needs"))
        channels = ensure_string_array(data.get("preferred_channels") or data.get("channels") or data.get("communication_preferences"))

        # Quote
        quote = str(data.get("quote") or data.get("user_quote") or "")

        return UserPersona(
            name=name,
            age=age,
            occupation=occupation,
            tech_comfort=tech_comfort,
            income_level=income,
            pain_points=pain_points,
            goals=goals,
            preferred_channels=channels,
            quote=quote
        )

    except Exception as e:
        print(f"❌ Validation failed: {e}")
        print(f"Data: {data}")
        return UserPersona(
            name=f"Error User ({segment_id})",
            age=35,
            occupation="Unknown",
            tech_comfort="moderate",
            income_level="unknown",
            pain_points=["Validation error"],
            goals=[],
            preferred_channels=[],
            quote=""
        )


def generate_persona_with_retry(
    client: Anthropic,
    segment: Dict[str, Any],
    max_retries: int = 3
) -> tuple[UserPersona, Dict[str, int]]:
    """
    🤮 HACK #6: Retry logic with exponential backoff

    Because even after all the parsing/validation hacks above,
    it STILL fails sometimes. So we retry up to 3 times with
    exponential backoff (1s, 2s, 4s).

    This means:
    - More API calls = more $$$ 💸
    - Longer latency = worse UX ⏱️
    - Still fails ~5% of the time = angry users 😡

    And you're burning tokens on that verbose JSON Schema EVERY retry!
    """

    segment_id = segment["segment_id"]
    demographic = segment["demographic"]
    behavioral = segment["behavioral"]

    # Construct prompt (pray you got format right)
    prompt = f"""Generate a realistic synthetic user persona based on this demographic and behavioral segment.

Segment ID: {segment_id}

Demographics:
- Age range: {demographic['age_range']}
- Income level: {demographic['income_level']}
- Family status: {demographic['family_status']}
- Employment: {demographic['employment']}

Behavioral traits:
- Tech savviness: {behavioral['tech_savviness']}
- Time constraints: {behavioral['time_constraints']}
- Budget sensitivity: {behavioral['budget_sensitivity']}
- Feature priorities: {', '.join(behavioral['feature_priorities'])}

Please provide your response in valid JSON format matching this JSON Schema:

⚠️  WARNING: This verbose JSON Schema is about to BURN YOUR TOKENS ⚠️
(You're paying for ~2,400 input tokens just for this schema!)
(BAML does this in ~1,160 tokens - 51% savings!)

{{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {{
    "name": {{
      "type": "string",
      "description": "First and last name of the persona"
    }},
    "age": {{
      "type": "integer",
      "description": "Age in years",
      "minimum": 18,
      "maximum": 100
    }},
    "occupation": {{
      "type": "string",
      "description": "Job title or occupation"
    }},
    "tech_comfort": {{
      "type": "string",
      "enum": ["low", "moderate", "high"],
      "description": "Comfort level with technology"
    }},
    "income_level": {{
      "type": "string",
      "description": "Income bracket"
    }},
    "pain_points": {{
      "type": "array",
      "items": {{
        "type": "string"
      }},
      "description": "Key frustrations and challenges",
      "minItems": 1
    }},
    "goals": {{
      "type": "array",
      "items": {{
        "type": "string"
      }},
      "description": "What they want to achieve",
      "minItems": 1
    }},
    "preferred_channels": {{
      "type": "array",
      "items": {{
        "type": "string"
      }},
      "description": "How they prefer to communicate",
      "minItems": 1
    }},
    "quote": {{
      "type": "string",
      "description": "A realistic quote from this persona's perspective"
    }}
  }},
  "required": ["name", "age", "occupation", "tech_comfort", "income_level", "pain_points", "goals", "preferred_channels", "quote"]
}}

IMPORTANT: Return ONLY valid JSON matching this schema, no markdown code blocks, no explanations."""

    last_error = None
    total_tokens = {"input": 0, "output": 0}

    for attempt in range(max_retries):
        try:
            print(f"🔄 Attempt {attempt + 1}/{max_retries} for {segment_id}...")

            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1500,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Track token usage
            total_tokens["input"] += response.usage.input_tokens
            total_tokens["output"] += response.usage.output_tokens

            raw_response = response.content[0].text
            print(f"📥 Raw response length: {len(raw_response)} chars")
            print(f"🎫 Tokens: {response.usage.input_tokens} in, {response.usage.output_tokens} out")

            # Parse and validate
            result = parse_and_validate_response(raw_response, segment_id)

            # Check if we got real data or error fallback
            if result.name != f"Unknown User ({segment_id})" and result.name != f"Error User ({segment_id})":
                print(f"✅ Successfully generated persona: {result.name}")
                return result, total_tokens
            else:
                # 😭 We parsed JSON but got garbage data, try again
                print(f"⚠️  Parsed but validation failed, retrying...")
                last_error = "Validation failed"

        except Exception as e:
            # 💀 Something exploded (API error, timeout, etc)
            print(f"❌ API call failed: {e}")
            last_error = str(e)

        # 🔄 Wait before retry (exponential backoff)
        # This makes failures less noticeable but adds latency
        if attempt < max_retries - 1:
            wait_time = (2 ** attempt) * 1.0  # 1s, then 2s, then 4s
            print(f"⏳ Waiting {wait_time}s before retry...")
            print(f"   💸 And you'll burn that verbose JSON Schema AGAIN on retry!")
            time.sleep(wait_time)

    # 💀 💀 💀 ALL RETRIES EXHAUSTED - COMPLETE FAILURE 💀 💀 💀
    # After 3 tries, exponential backoff, burning tokens, and ~10 seconds...
    # we still couldn't get valid data. This is the 5% that kills user trust.
    print(f"💀 All retries exhausted for {segment_id}. Last error: {last_error}")
    print(f"   This is a REAL failure. User gets garbage data or an error.")
    return UserPersona(
        name=f"Failed User ({segment_id})",
        age=35,
        occupation="Unknown",
        tech_comfort="moderate",
        income_level="unknown",
        pain_points=["Failed after all retries"],
        goals=[],
        preferred_channels=[],
        quote=""
    ), total_tokens


def main():
    """
    ☠️  WELCOME TO PRODUCTION LLM HELL ☠️

    This is what generating synthetic personas looks like without BAML.

    You wanted to use an LLM to generate structured data. Simple, right?

    WRONG. You now have 300+ lines of:
    - Regex parsing (HACK #1, #2)
    - Type coercion (HACK #3, #4)
    - Array handling (HACK #5)
    - Retry logic (HACK #6)
    - Error handling everywhere
    - Verbose JSON Schema burning tokens

    And after ALL that... it still fails 5% of the time.

    That 5% is why your users don't trust AI.

    There has to be a better way... 👀
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY environment variable not set")
        return

    client = Anthropic(api_key=api_key)

    # Load demographic segments
    with open('sample_data/demographic_segments.json', 'r') as f:
        segments = json.load(f)

    print("=" * 80)
    print("BEFORE BAML: Generating Synthetic User Personas (The Messy Reality)")
    print("=" * 80)
    print(f"Generating {len(segments)} personas from demographic segments...")
    print()

    personas = []
    total_input_tokens = 0
    total_output_tokens = 0
    start_time = time.time()

    for segment in segments:
        persona, tokens = generate_persona_with_retry(client, segment)
        personas.append(persona)
        total_input_tokens += tokens["input"]
        total_output_tokens += tokens["output"]
        print()

    elapsed = time.time() - start_time
    total_tokens = total_input_tokens + total_output_tokens

    print("=" * 80)
    print(f"Results (took {elapsed:.2f}s):")
    print("=" * 80)
    for persona in personas:
        print(f"\n{persona.name} ({persona.age}, {persona.occupation})")
        print(f"  Tech Comfort: {persona.tech_comfort}")
        print(f"  Pain Points: {persona.pain_points}")
        print(f"  Goals: {persona.goals}")
        print(f"  Quote: \"{persona.quote}\"")

    print()
    print("=" * 80)
    print("📊 TOKEN USAGE")
    print("=" * 80)
    print(f"Input tokens:  {total_input_tokens:,}")
    print(f"Output tokens: {total_output_tokens:,}")
    print(f"Total tokens:  {total_tokens:,}")
    print()
    print("💸 Note: These are just the LLM tokens.")
    print("   Your verbose JSON Schema prompt inflates token count significantly!")
    print()
    print("🤔 Notice all the:")
    print("   - Error handling and retries")
    print("   - Regex parsing and JSON cleaning")
    print("   - Field validation and type coercion")
    print("   - Manual enum mapping")
    print("   - Array parsing (comma-separated, numbered lists, etc.)")
    print()
    print("   That's 300+ lines just to get semi-reliable personas.")
    print("   And some still failed. This is the 5% that kills trust.")

    # Save token stats for comparison
    import json as json_lib
    with open('.demo_stats_before.json', 'w') as f:
        json_lib.dump({
            'total_input_tokens': total_input_tokens,
            'total_output_tokens': total_output_tokens,
            'total_tokens': total_tokens,
            'personas_generated': len(personas)
        }, f)


if __name__ == "__main__":
    main()
