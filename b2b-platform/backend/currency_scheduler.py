#!/usr/bin/env python3
"""
Currency Rate Scheduler
Schedules currency rate updates at 9:00, 14:00, and 19:00 daily.

Usage:
1. Make executable: chmod +x currency_scheduler.py
2. Add to crontab:
   0 9,14,19 * * * cd /path/to/project && ./currency_scheduler.py

Or use this cron entry:
0 9,14,19 * * * cd /Users/kairatkhidirboev/Desktop/Projects/businesshub/b2b-platform/backend && python currency_scheduler.py
"""

import os
import sys
import django
from datetime import datetime

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Now we can import Django modules
from django.core.management import call_command

def main():
    print(f"[{datetime.now()}] Starting scheduled currency rate update...")
    
    try:
        # Call the Django management command
        call_command('update_currency_rates', force=True)
        print(f"[{datetime.now()}] Currency rate update completed successfully")
        
    except Exception as e:
        print(f"[{datetime.now()}] Error during currency rate update: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()