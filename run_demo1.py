"""
Demo #1: "Stop Praying Your LLM Returns Valid JSON"

Run before/after comparison of generating synthetic user personas.

Usage:
    python run_demo1.py --before
    python run_demo1.py --after
    python run_demo1.py --both
"""

import argparse
import subprocess
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def run_before():
    """Run the messy pre-BAML persona generation"""
    print("\n" + "="*80)
    print("🔴 BEFORE BAML: Generating Personas (The Messy Reality)")
    print("="*80)
    print("This demonstrates the painful reality of production LLM code...")
    print("="*80 + "\n")

    result = subprocess.run(
        [sys.executable, "demo1_before_baml/messy_persona_gen.py"],
        env=os.environ.copy()
    )
    return result.returncode


def run_after():
    """Run the clean BAML persona generation"""
    print("\n" + "="*80)
    print("🟢 AFTER BAML: Generating Personas (The Clean Reality)")
    print("="*80)
    print("This demonstrates type-safe, reliable persona generation with BAML...")
    print("="*80 + "\n")

    result = subprocess.run(
        [sys.executable, "demo1_after_baml/clean_persona_gen.py"],
        env=os.environ.copy()
    )
    return result.returncode


def show_comparison():
    """Show code comparison stats"""
    print("\n" + "="*80)
    print("📊 CODE COMPARISON")
    print("="*80)

    try:
        with open('demo1_before_baml/messy_persona_gen.py', 'r') as f:
            before_lines = len([l for l in f.readlines() if l.strip() and not l.strip().startswith('#')])

        print(f"\n🔴 BEFORE BAML:")
        print(f"   File: demo1_before_baml/messy_persona_gen.py")
        print(f"   Lines: ~{before_lines}")
        print(f"   What you're fighting:")
        print(f"     ❌ JSON extraction from markdown")
        print(f"     ❌ Regex parsing for arrays/enums")
        print(f"     ❌ Manual type validation")
        print(f"     ❌ Retry logic with backoff")
        print(f"     ❌ Still fails ~5% of the time")

        with open('baml_src/persona_generation.baml', 'r') as f:
            baml_lines = len([l for l in f.readlines() if l.strip() and not l.strip().startswith('//')])

        with open('demo1_after_baml/clean_persona_gen.py', 'r') as f:
            after_lines = len([l for l in f.readlines() if l.strip() and not l.strip().startswith('#')])

        print(f"\n🟢 AFTER BAML:")
        print(f"   Schema: baml_src/persona_generation.baml (~{baml_lines} lines)")
        print(f"   Python: demo1_after_baml/clean_persona_gen.py (~{after_lines} lines)")
        print(f"   Total: ~{baml_lines + after_lines} lines")
        print(f"   What BAML handles for you:")
        print(f"     ✅ Schema-Aligned Parsing fixes broken JSON")
        print(f"     ✅ Type validation automatic")
        print(f"     ✅ Enums guaranteed valid")
        print(f"     ✅ Arrays always arrays")
        print(f"     ✅ Reliability: 99.9%+")

        reduction = ((before_lines - (baml_lines + after_lines)) / before_lines) * 100
        print(f"\n📉 Code Reduction: ~{reduction:.0f}%")
        print(f"   ({before_lines} lines → {baml_lines + after_lines} lines)")

        print(f"\n💰 TOKEN EFFICIENCY")
        print(f"   BAML uses ~80% fewer tokens than verbose JSON Schema")
        print(f"   • Compact schema syntax (not JSON Schema)")
        print(f"   • Efficient {{ ctx.output_format }} injection")
        print(f"   • No redundant schema in prompts")
        print(f"\n   Example: Traditional JSON Schema might use 500 tokens")
        print(f"            BAML uses ~100 tokens for the same schema")
        print(f"            = 80% savings on EVERY call!")

    except Exception as e:
        print(f"Could not calculate comparison: {e}")

    print("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(description='Run Demo #1: Persona Generation')
    parser.add_argument(
        'mode',
        choices=['before', 'after', 'both', 'compare'],
        nargs='?',
        default='both',
        help='Which demo to run (default: both)'
    )

    args = parser.parse_args()

    if not os.getenv('ANTHROPIC_API_KEY'):
        print("❌ Error: ANTHROPIC_API_KEY not set")
        print("\nSet it with:")
        print("  export ANTHROPIC_API_KEY='your-key-here'")
        sys.exit(1)

    if args.mode == 'compare':
        show_comparison()
        return

    if args.mode in ['before', 'both']:
        run_before()

    if args.mode in ['after', 'both']:
        run_after()

    if args.mode == 'both':
        show_comparison()


if __name__ == '__main__':
    main()
