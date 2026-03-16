"""Tests for Juice Patrol config flow — 100% coverage required."""

from unittest.mock import patch

import pytest

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.juice_patrol.const import (
    CONF_LOW_THRESHOLD,
    CONF_PREDICTION_HORIZON,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_PREDICTION_HORIZON,
    DEFAULT_STALE_TIMEOUT,
    DOMAIN,
)


async def test_user_step_shows_form(hass: HomeAssistant) -> None:
    """Test that the user step shows a form when no input is provided."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"
    assert CONF_LOW_THRESHOLD in result["data_schema"].schema


async def test_user_step_creates_entry(hass: HomeAssistant) -> None:
    """Test that valid input creates a config entry."""
    with patch(
        "custom_components.juice_patrol.async_setup_entry",
        return_value=True,
    ) as mock_setup_entry, patch(
        "custom_components.juice_patrol.async_setup",
        return_value=True,
    ):
        result = await hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": config_entries.SOURCE_USER},
            data={CONF_LOW_THRESHOLD: 25},
        )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Juice Patrol"
    assert result["data"] == {}
    assert result["options"][CONF_LOW_THRESHOLD] == 25
    assert len(mock_setup_entry.mock_calls) == 1


async def test_user_step_default_threshold(hass: HomeAssistant) -> None:
    """Test that default threshold is used when not provided."""
    with patch(
        "custom_components.juice_patrol.async_setup_entry",
        return_value=True,
    ), patch(
        "custom_components.juice_patrol.async_setup",
        return_value=True,
    ):
        result = await hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": config_entries.SOURCE_USER},
            data={CONF_LOW_THRESHOLD: DEFAULT_LOW_THRESHOLD},
        )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"][CONF_LOW_THRESHOLD] == DEFAULT_LOW_THRESHOLD


async def test_user_step_abort_already_configured(hass: HomeAssistant) -> None:
    """Test that a second config entry is rejected."""
    # Create first entry
    with patch(
        "custom_components.juice_patrol.async_setup_entry",
        return_value=True,
    ), patch(
        "custom_components.juice_patrol.async_setup",
        return_value=True,
    ):
        result = await hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": config_entries.SOURCE_USER},
            data={CONF_LOW_THRESHOLD: 20},
        )
    assert result["type"] is FlowResultType.CREATE_ENTRY

    # Try to create a second entry
    result2 = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result2["type"] is FlowResultType.ABORT
    assert result2["reason"] == "already_configured"


async def test_options_flow_shows_form(hass: HomeAssistant) -> None:
    """Test that the options flow shows a form with current values."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Juice Patrol",
        data={},
        options={
            CONF_LOW_THRESHOLD: 25,
            CONF_STALE_TIMEOUT: 72,
            CONF_PREDICTION_HORIZON: 14,
        },
        unique_id=DOMAIN,
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "init"


async def test_options_flow_saves(hass: HomeAssistant) -> None:
    """Test that the options flow saves new values."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Juice Patrol",
        data={},
        options={
            CONF_LOW_THRESHOLD: 20,
            CONF_STALE_TIMEOUT: 48,
            CONF_PREDICTION_HORIZON: 7,
        },
        unique_id=DOMAIN,
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM

    result2 = await hass.config_entries.options.async_configure(
        result["flow_id"],
        user_input={
            CONF_LOW_THRESHOLD: 30,
            CONF_STALE_TIMEOUT: 96,
            CONF_PREDICTION_HORIZON: 21,
        },
    )

    assert result2["type"] is FlowResultType.CREATE_ENTRY
    assert result2["data"][CONF_LOW_THRESHOLD] == 30
    assert result2["data"][CONF_STALE_TIMEOUT] == 96
    assert result2["data"][CONF_PREDICTION_HORIZON] == 21


async def test_options_flow_defaults(hass: HomeAssistant) -> None:
    """Test that options flow uses defaults when entry has no options."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Juice Patrol",
        data={},
        options={},
        unique_id=DOMAIN,
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "init"


async def test_reconfigure_shows_form(hass: HomeAssistant) -> None:
    """Test that the reconfigure step shows a form with current values."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Juice Patrol",
        data={},
        options={
            CONF_LOW_THRESHOLD: 25,
            CONF_STALE_TIMEOUT: 72,
            CONF_PREDICTION_HORIZON: 14,
        },
        unique_id=DOMAIN,
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": "reconfigure", "entry_id": entry.entry_id},
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "reconfigure"


async def test_reconfigure_saves(hass: HomeAssistant) -> None:
    """Test that reconfigure saves new values and triggers reload."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Juice Patrol",
        data={},
        options={
            CONF_LOW_THRESHOLD: 20,
            CONF_STALE_TIMEOUT: 48,
            CONF_PREDICTION_HORIZON: 7,
        },
        unique_id=DOMAIN,
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": "reconfigure", "entry_id": entry.entry_id},
    )
    assert result["type"] is FlowResultType.FORM

    result2 = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input={
            CONF_LOW_THRESHOLD: 35,
            CONF_STALE_TIMEOUT: 120,
            CONF_PREDICTION_HORIZON: 30,
        },
    )

    assert result2["type"] is FlowResultType.ABORT
    assert result2["reason"] == "reconfigure_successful"
    assert entry.options[CONF_LOW_THRESHOLD] == 35
    assert entry.options[CONF_STALE_TIMEOUT] == 120
    assert entry.options[CONF_PREDICTION_HORIZON] == 30
