"""
Persona Scaling Module

Generates 300 diverse personas from 4 demographic segments.
Uses BAML's GeneratePersona to ensure type-safe output.
"""

import json
import random
from typing import List
import sys
import os

# Add parent directory to path to find baml_client
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from baml_client import b
from baml_client.types import UserPersona


# Variation prompts to create diversity within each segment
VARIATION_PROMPTS = [
    "Create a unique individual with distinct personality traits.",
    "Make this person have different priorities than typical segment members.",
    "Give this person some contrarian views or unusual preferences.",
    "Create someone at the younger end of this segment's age range.",
    "Create someone at the older end of this segment's age range.",
    "Make this person particularly tech-savvy for their segment.",
    "Make this person less tech-comfortable than average for their segment.",
    "Create someone with additional accessibility needs.",
    "Make this person have unique cultural or lifestyle preferences.",
    "Create someone who is skeptical of new technology.",
]


def generate_persona_variation(segment: dict, variation_index: int) -> UserPersona:
    """
    Generate a single persona variation for a segment.
    
    Args:
        segment: Demographic segment data
        variation_index: Index of this variation (for randomization)
        
    Returns:
        Type-safe UserPersona object from BAML
    """
    # Use variation index to add diversity to the prompt
    variation_prompt = VARIATION_PROMPTS[variation_index % len(VARIATION_PROMPTS)]
    
    # Format segment data with variation instruction
    segment_data = f"""Segment: {segment['segment_id']}

Demographics:
- Age range: {segment['demographic']['age_range']}
- Income: {segment['demographic']['income_level']}
- Family: {segment['demographic']['family_status']}
- Employment: {segment['demographic']['employment']}

Behavioral traits:
- Tech savviness: {segment['behavioral']['tech_savviness']}
- Time constraints: {segment['behavioral']['time_constraints']}
- Budget sensitivity: {segment['behavioral']['budget_sensitivity']}
- Priorities: {', '.join(segment['behavioral']['feature_priorities'])}

VARIATION INSTRUCTION: {variation_prompt}
"""
    
    # Call BAML function for type-safe persona generation
    persona: UserPersona = b.GeneratePersona(segment_data=segment_data)
    
    return persona


def scale_personas(segments: List[dict], personas_per_segment: int = 75) -> List[UserPersona]:
    """
    Scale 4 demographic segments to N personas per segment.
    
    Args:
        segments: List of demographic segment dicts
        personas_per_segment: Number of personas to generate per segment (default: 75)
        
    Returns:
        List of UserPersona objects (type-safe from BAML)
    """
    all_personas = []
    
    print(f"Generating {len(segments) * personas_per_segment} personas from {len(segments)} segments...")
    print(f"({personas_per_segment} variations per segment)\n")
    
    for segment in segments:
        segment_name = segment['segment_id']
        print(f"Generating {personas_per_segment} personas for '{segment_name}'...")
        
        segment_personas = []
        for i in range(personas_per_segment):
            try:
                persona = generate_persona_variation(segment, i)
                segment_personas.append(persona)
                
                # Progress indicator
                if (i + 1) % 10 == 0:
                    print(f"  ✓ {i + 1}/{personas_per_segment} generated")
                    
            except Exception as e:
                print(f"  ✗ Error generating persona {i + 1}: {e}")
                continue
        
        print(f"✅ Completed '{segment_name}': {len(segment_personas)} personas\n")
        all_personas.extend(segment_personas)
    
    print(f"🎉 Total personas generated: {len(all_personas)}")
    return all_personas


def load_segments(segments_file: str = 'sample_data/demographic_segments.json') -> List[dict]:
    """Load demographic segments from JSON file."""
    with open(segments_file, 'r') as f:
        return json.load(f)


def save_personas(personas: List[UserPersona], output_file: str):
    """Save generated personas to JSON file."""
    personas_data = [persona.model_dump() for persona in personas]
    
    with open(output_file, 'w') as f:
        json.dump(personas_data, f, indent=2)
    
    print(f"💾 Saved {len(personas)} personas to {output_file}")


def main():
    """
    Main function for testing persona scaling.
    Generate 300 personas (75 per segment).
    """
    import time
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Check API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY environment variable not set")
        return
    
    print("=" * 80)
    print("PERSONA SCALING TEST")
    print("=" * 80)
    print()
    
    # Load segments
    segments = load_segments()
    print(f"Loaded {len(segments)} demographic segments")
    for seg in segments:
        print(f"  - {seg['segment_id']}")
    print()
    
    # Generate personas
    start_time = time.time()
    
    # For testing, use smaller number (e.g., 5 per segment = 20 total)
    # For production, use 75 per segment = 300 total
    test_mode = True
    personas_per_segment = 5 if test_mode else 75
    
    if test_mode:
        print("🧪 TEST MODE: Generating 5 personas per segment (20 total)")
        print("    For full demo, set test_mode = False to generate 300 personas")
        print()
    
    personas = scale_personas(segments, personas_per_segment)
    
    elapsed = time.time() - start_time
    
    print()
    print("=" * 80)
    print(f"✨ Completed in {elapsed:.2f}s")
    print(f"   Average: {elapsed / len(personas):.2f}s per persona")
    print("=" * 80)
    print()
    
    # Show sample personas
    print("Sample personas generated:")
    for i, persona in enumerate(personas[:5]):
        print(f"\n{i+1}. {persona.name} ({persona.age}, {persona.occupation})")
        print(f"   Tech comfort: {persona.tech_comfort}")
        print(f"   Quote: \"{persona.quote}\"")
    
    # Save to file
    output_file = f"demo2_multi_agent/generated_personas_{len(personas)}.json"
    save_personas(personas, output_file)
    
    print()
    print("✅ Persona scaling test complete!")
    print(f"   Generated personas ready for PRD review workflow")


if __name__ == "__main__":
    main()
