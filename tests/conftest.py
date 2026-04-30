"""Pytest configuration and fixtures."""

import pytest

# Add project root to path for imports
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
