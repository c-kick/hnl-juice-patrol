"""Constants for the Juice Patrol integration."""

from homeassistant.const import Platform

DOMAIN = "juice_patrol"
VERSION = "0.1.0"

# Config keys
CONF_LOW_THRESHOLD = "low_threshold"
CONF_STALE_TIMEOUT = "stale_timeout"
CONF_PREDICTION_HORIZON = "prediction_horizon"

# Defaults
DEFAULT_LOW_THRESHOLD = 20  # percent
DEFAULT_STALE_TIMEOUT = 48  # hours
DEFAULT_PREDICTION_HORIZON = 7  # days
DEFAULT_SCAN_INTERVAL = 3600  # seconds (1 hour)

# Prediction
MIN_READINGS_FOR_PREDICTION = 3
MIN_TIMESPAN_HOURS = 24
FLAT_SLOPE_THRESHOLD = 0.02  # %/day — below this, classify as FLAT

# Replacement detection — also mirrored in engine/analysis.py:_REPLACEMENT_LOW_MULTIPLIER
REPLACEMENT_LOW_MULTIPLIER = 2  # "was reasonably low" = threshold × this

# Events
EVENT_BATTERY_LOW = f"{DOMAIN}_battery_low"
EVENT_BATTERY_PREDICTED_LOW = f"{DOMAIN}_battery_predicted_low"
EVENT_DEVICE_STALE = f"{DOMAIN}_device_stale"
EVENT_DEVICE_REPLACED = f"{DOMAIN}_device_replaced"

# Storage
STORE_KEY = f"{DOMAIN}.metadata"
STORE_VERSION = 2  # Major version for HA Store class (do not bump without migration func)
STORE_MINOR_VERSION = 4  # Internal data schema version (4: completed_cycles)

# Recorder history
HISTORY_CACHE_TTL = 1800  # 30 min cache for recorder queries
HISTORY_DEFAULT_DAYS = 365  # how far back to query recorder

# Memory limits
MAX_REPLACEMENT_HISTORY = 50  # max replacement timestamps per device
MAX_DENIED_REPLACEMENTS = 50  # max denied replacement timestamps per device
MAX_HISTORY_CACHE_ENTRIES = 500  # max entities in the history cache

# Platforms
PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BINARY_SENSOR]
