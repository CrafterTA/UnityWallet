"""
Database initialization script for Sovico ecosystem
Creates tables and populates initial data
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from chain.services.sovico_db import sovico_db

async def init_database():
    """Initialize Sovico database"""
    print("🏗️  Creating Sovico database tables...")
    sovico_db.create_tables()
    print("✅ Tables created successfully!")
    
    print("🏪 Initializing brands...")
    await sovico_db.initialize_brands()
    print("✅ Brands initialized!")
    
    print("🎯 Initializing campaigns...")
    await sovico_db.initialize_campaigns()
    print("✅ Campaigns initialized!")
    
    print("🎉 Sovico database setup complete!")

if __name__ == "__main__":
    asyncio.run(init_database())
