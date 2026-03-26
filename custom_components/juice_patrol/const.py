"""Constants for the Juice Patrol integration."""

from homeassistant.const import Platform

DOMAIN = "juice_patrol"
VERSION = "0.1.0"

# Config keys
CONF_LOW_THRESHOLD = "low_threshold"
CONF_STALE_TIMEOUT = "stale_timeout"

# Defaults
DEFAULT_LOW_THRESHOLD = 20  # percent
DEFAULT_STALE_TIMEOUT = 48  # hours
DEFAULT_SCAN_INTERVAL = 3600  # seconds (1 hour)

# Replacement detection
REPLACEMENT_LOW_MULTIPLIER = 2  # "was reasonably low" = threshold × this

# Events
EVENT_BATTERY_LOW = f"{DOMAIN}_battery_low"
EVENT_DEVICE_STALE = f"{DOMAIN}_device_stale"
EVENT_DEVICE_REPLACED = f"{DOMAIN}_device_replaced"

# Storage
STORE_KEY = f"{DOMAIN}.metadata"
STORE_VERSION = 2  # Major version for HA Store class (do not bump without migration func)
STORE_MINOR_VERSION = 4  # Internal data schema version (4: completed_cycles)

# Memory limits
MAX_REPLACEMENT_HISTORY = 50  # max replacement timestamps per device
MAX_DENIED_REPLACEMENTS = 50  # max denied replacement timestamps per device

# Platforms
PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BINARY_SENSOR]
