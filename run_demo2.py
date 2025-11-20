"""
Demo #2 Runner: "300 Synthetic Users Reviewed My PRD"

This is the main entry point for the multi-agent PRD review demo.
Showcases the power of BAML + LangGraph + LangSmith.

Usage:
    python run_demo2.py                    # Default: 20 personas, sample PRD
    python run_demo2.py --personas 300     # Full demo with 300 personas
    python run_demo2.py --prd my_prd.md    # Use your own PRD
    python run_demo2.py --help             # Show all options
"""

import argparse
import json
import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from demo2_multi_agent.langgraph_workflow import run_workflow


def print_banner():
    """Print demo banner"""
    print()
    print("=" * 80)
    print("DEMO #2: 300 Synthetic Users Reviewed My PRD")
    print("=" * 80)
    print()
    print("The Cold Start Solution:")
    print("  • Generate diverse user personas from demographic segments")
    print("  • Phase 1: Independent PRD reviews (breadth)")
    print("  • Phase 2: Agent debates (depth + conflict surfacing)")
    print("  • Aggregation: Themes, gaps, sentiment, risk score")
    print()
    print("Tech Stack:")
    print("  • BAML: Type-safe structured outputs")
    print("  • LangGraph: Multi-agent orchestration")
    print("  • LangSmith: Tracing & observability")
    print()
    print("=" * 80)
    print()


def check_env_vars():
    """Check required environment variables"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        print("❌ ERROR: ANTHROPIC_API_KEY not set")
        print()
        print("Set it with:")
        print("  export ANTHROPIC_API_KEY='your-key-here'")
        print()
        print("Or add to .env file:")
        print("  ANTHROPIC_API_KEY=your-key-here")
        print()
        sys.exit(1)
    
    # Check LangSmith (optional but recommended)
    langsmith_key = os.getenv("LANGCHAIN_API_KEY")
    langsmith_tracing = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    
    if not langsmith_tracing:
        print("💡 TIP: Enable LangSmith tracing for full observability")
        print()
        print("   export LANGCHAIN_TRACING_V2=true")
        print("   export LANGCHAIN_API_KEY='your-langsmith-key'")
        print("   export LANGCHAIN_PROJECT='baml-demo-2-prd-review'")
        print()
        print("   Get your key at: https://smith.langchain.com/")
        print("   (Free tier: 5K traces/month)")
        print()
        
        # Prompt to continue
        response = input("Continue without LangSmith? [y/N]: ").strip().lower()
        if response not in ['y', 'yes']:
            print("Exiting. Set up LangSmith and try again!")
            sys.exit(0)
        print()


def load_prd(prd_file: str) -> str:
    """Load PRD content from file"""
    if not os.path.exists(prd_file):
        print(f"❌ ERROR: PRD file not found: {prd_file}")
        sys.exit(1)
    
    with open(prd_file, 'r') as f:
        content = f.read()
    
    print(f"📄 Loaded PRD from: {prd_file}")
    print(f"   Length: {len(content)} characters")
    print()
    
    return content


def save_results(insights, output_file: str):
    """Save aggregated insights to JSON file"""
    if insights is None:
        print("⚠️  No insights to save (workflow may have failed)")
        return
    
    # Convert to dict for JSON serialization
    insights_dict = insights.model_dump()
    
    with open(output_file, 'w') as f:
        json.dump(insights_dict, f, indent=2)
    
    print(f"💾 Saved results to: {output_file}")


def print_insights_summary(insights):
    """Print a summary of the aggregated insights"""
    if insights is None:
        print("❌ No insights generated (workflow failed)")
        return
    
    print()
    print("=" * 80)
    print("AGGREGATED INSIGHTS")
    print("=" * 80)
    print()
    
    # Risk Score
    print(f"🎯 RISK SCORE: {insights.risk_score:.1f}/10")
    if insights.risk_score >= 7:
        print("   ⚠️  HIGH RISK - Major concerns identified")
    elif insights.risk_score >= 4:
        print("   ⚡ MODERATE RISK - Some issues to address")
    else:
        print("   ✅ LOW RISK - Generally positive reception")
    print()
    
    # Executive Summary
    print("📊 EXECUTIVE SUMMARY")
    print("-" * 80)
    print(insights.executive_summary)
    print()
    
    # Sentiment Breakdown
    print("💭 SENTIMENT BREAKDOWN")
    print("-" * 80)
    total = insights.sentiment_breakdown.total
    pos = insights.sentiment_breakdown.positive
    neu = insights.sentiment_breakdown.neutral
    neg = insights.sentiment_breakdown.negative
    
    print(f"  Positive:  {pos:3d} ({pos/total*100:5.1f}%)")
    print(f"  Neutral:   {neu:3d} ({neu/total*100:5.1f}%)")
    print(f"  Negative:  {neg:3d} ({neg/total*100:5.1f}%)")
    print(f"  Total:     {total:3d}")
    print()
    
    # Top Concerns
    print("⚠️  TOP CONCERNS (ranked by frequency)")
    print("-" * 80)
    for i, concern in enumerate(insights.top_concerns[:5], 1):
        print(f"  {i}. {concern}")
    print()
    
    # Critical Gaps
    print("🔍 CRITICAL GAPS (missing features)")
    print("-" * 80)
    for gap in insights.critical_gaps[:5]:
        print(f"  • {gap}")
    print()
    
    # Non-Obvious Insights (THE GOLD!)
    if insights.non_obvious_insights:
        print("💡 NON-OBVIOUS INSIGHTS (from agent debates)")
        print("-" * 80)
        for insight in insights.non_obvious_insights:
            print(f"  💡 {insight}")
        print()
    
    # Major Conflicts
    if insights.major_conflicts:
        print("⚔️  MAJOR CONFLICTS (incompatible needs)")
        print("-" * 80)
        for conflict in insights.major_conflicts[:3]:
            print(f"  • {conflict.segment_a} wants: {conflict.segment_a_wants}")
            print(f"    vs {conflict.segment_b} wants: {conflict.segment_b_wants}")
            print(f"    Conflict: {conflict.why_it_conflicts}")
            print()
    
    # Quick Wins
    if insights.quick_wins:
        print("✨ QUICK WINS (easy fixes)")
        print("-" * 80)
        for win in insights.quick_wins[:5]:
            print(f"  ✓ {win}")
        print()
    
    # Strategic Decisions
    if insights.strategic_decisions_needed:
        print("🎲 STRATEGIC DECISIONS NEEDED")
        print("-" * 80)
        for decision in insights.strategic_decisions_needed[:5]:
            print(f"  ? {decision}")
        print()
    
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(
        description="Demo #2: 300 Synthetic Users Reviewed My PRD",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_demo2.py                           # Quick demo (20 personas)
  python run_demo2.py --personas 300            # Full demo (300 personas)
  python run_demo2.py --prd my_prd.md           # Use your own PRD
  python run_demo2.py --personas 100 --output results.json  # Custom settings

LangSmith Tracing (Recommended):
  export LANGCHAIN_TRACING_V2=true
  export LANGCHAIN_API_KEY='your-key'
  export LANGCHAIN_PROJECT='baml-demo-2-prd-review'

Then view all 300+ agent calls at: https://smith.langchain.com/
        """
    )
    
    parser.add_argument(
        '--personas',
        type=int,
        default=20,
        help='Number of personas to generate (default: 20 for quick demo, use 300 for full demo)'
    )
    
    parser.add_argument(
        '--prd',
        type=str,
        default='sample_data/sample_prd.md',
        help='Path to PRD file to review (default: sample_data/sample_prd.md)'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='demo2_results.json',
        help='Output file for results (default: demo2_results.json)'
    )
    
    parser.add_argument(
        '--checkpoint',
        action='store_true',
        help='Enable LangGraph checkpointing (allows resuming on failure)'
    )
    
    parser.add_argument(
        '--no-banner',
        action='store_true',
        help='Skip the demo banner'
    )
    
    args = parser.parse_args()
    
    # Load environment variables
    load_dotenv()
    
    # Print banner
    if not args.no_banner:
        print_banner()
    
    # Check environment variables
    check_env_vars()
    
    # Load PRD
    prd_content = load_prd(args.prd)
    
    # Validate personas count
    if args.personas < 4:
        print(f"❌ ERROR: Need at least 4 personas (1 per segment)")
        sys.exit(1)
    
    if args.personas > 300:
        print(f"⚠️  WARNING: {args.personas} personas will take a long time")
        print(f"   Estimated time: ~{args.personas * 2.5 / 60:.1f} minutes")
        response = input("Continue? [y/N]: ").strip().lower()
        if response not in ['y', 'yes']:
            sys.exit(0)
    
    # Run the workflow!
    print("🚀 Starting workflow...")
    print()
    
    try:
        insights = run_workflow(
            prd_content=prd_content,
            personas_count=args.personas,
            enable_checkpointing=args.checkpoint
        )
        
        # Print summary
        print_insights_summary(insights)
        
        # Save results
        save_results(insights, args.output)
        
        print()
        print("✅ Demo complete!")
        print()
        print("Next steps:")
        print("  • Review the insights above")
        print("  • Check LangSmith trace for detailed analysis")
        print(f"  • View full results: {args.output}")
        print()
        
    except KeyboardInterrupt:
        print()
        print("⚠️  Demo interrupted by user")
        sys.exit(1)
    except Exception as e:
        print()
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
