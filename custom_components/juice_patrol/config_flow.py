"""Config flow for Juice Patrol."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
)

from .const import (
    CONF_LOW_THRESHOLD,
    CONF_PREDICTION_HORIZON,
    CONF_STALE_TIMEOUT,
    DEFAULT_LOW_THRESHOLD,
    DEFAULT_PREDICTION_HORIZON,
    DEFAULT_STALE_TIMEOUT,
    DOMAIN,
)


def _threshold_selector() -> NumberSelector:
    """Low battery threshold selector (slider with visible value)."""
    return NumberSelector(
        NumberSelectorConfig(
            min=1, max=99, step=1,
            unit_of_measurement="%",
            mode=NumberSelectorMode.SLIDER,
        )
    )


class JuicePatrolConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Juice Patrol."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        # Only allow a single instance
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(
                title="Juice Patrol",
                data={},
                options={
                    CONF_LOW_THRESHOLD: int(user_input.get(
                        CONF_LOW_THRESHOLD, DEFAULT_LOW_THRESHOLD
                    )),
                },
            )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_LOW_THRESHOLD, default=DEFAULT_LOW_THRESHOLD
                    ): _threshold_selector(),
                }
            ),
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: ConfigEntry,
    ) -> JuicePatrolOptionsFlow:
        """Get the options flow."""
        return JuicePatrolOptionsFlow()


class JuicePatrolOptionsFlow(OptionsFlow):
    """Handle options flow for Juice Patrol."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(data={
                CONF_LOW_THRESHOLD: int(user_input[CONF_LOW_THRESHOLD]),
                CONF_STALE_TIMEOUT: int(user_input[CONF_STALE_TIMEOUT]),
                CONF_PREDICTION_HORIZON: int(user_input[CONF_PREDICTION_HORIZON]),
            })

        options = self.config_entry.options

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_LOW_THRESHOLD,
                        default=options.get(
                            CONF_LOW_THRESHOLD, DEFAULT_LOW_THRESHOLD
                        ),
                    ): _threshold_selector(),
                    vol.Required(
                        CONF_STALE_TIMEOUT,
                        default=options.get(
                            CONF_STALE_TIMEOUT, DEFAULT_STALE_TIMEOUT
                        ),
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=1, max=720, step=1,
                            unit_of_measurement="hours",
                            mode=NumberSelectorMode.BOX,
                        )
                    ),
                    vol.Required(
                        CONF_PREDICTION_HORIZON,
                        default=options.get(
                            CONF_PREDICTION_HORIZON, DEFAULT_PREDICTION_HORIZON
                        ),
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=1, max=90, step=1,
                            unit_of_measurement="days",
                            mode=NumberSelectorMode.BOX,
                        )
                    ),
                }
            ),
        )
