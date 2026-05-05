import asyncio
import sys
import os

# Add sdk to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sdk.logger import audit_trace

@audit_trace(agent_id="test-agent-007")
async def simulate_decision(user_query: str):
    print(f"Processing: {user_query}")
    await asyncio.sleep(1) # Simulate work
    return f"I have decided to approve the request for: {user_query}"

async def main():
    print("Simulating agent decision...")
    result = await simulate_decision("Access to secure server")
    print(f"Agent result: {result}")
    print("Wait for log push...")
    await asyncio.sleep(2) # Wait for async push
    print("Test complete.")

if __name__ == "__main__":
    asyncio.run(main())
