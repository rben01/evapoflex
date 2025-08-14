# %%
import math
from pathlib import Path
import datetime

import polars as pl
import altair as alt
from IPython.display import display

_ = alt.data_transformers.enable("vegafusion")

# Constants from psychometric equation
CONVERSION_CONSTANT = 0.01157  # c_1 (W m day MJ^-1 mm^-1)
SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER = 2448  # L_v (MJ Mg^-1)
WATER_DENSITY = 1.0  # rho_w (Mg m^-3)
PSYCHROMETRIC_CONSTANT = 0.067  # gamma (kPa K^-1)

# Constants from power per area equation
EVAPORATION_CONVERSION_CONSTANT = 6.42465e-4  # c_t (mols day mm^-1 m^-2 s^-1)

# Other constants
IDEAL_GAS_CONSTANT = 8.31446261815324  # R (J mol^-1 K^-1)
WATER_VAPOR_GAS_CONSTANT = 461.5  # R_v (J kg^-1 K^-1)


CSV_FILE = "./weather-data.csv"


def calculate_saturation_vapor_pressure(T: float) -> float:
    """
    Calculate saturation vapor pressure using the Buck equation.

    Args:
        T: temperature in Kelvin (K)

    Returns:
        Saturation vapor pressure (kPa)
    """
    T_celsius = T - 273.15

    # in hPa = kPa/10
    e_s_hPa = 6.1121 * math.exp(
        (18.678 - T_celsius / 234.5) * T_celsius / (257.14 + T_celsius)
    )
    return e_s_hPa / 10


def calculate_Delta(
    *,
    T: float,
    e_s: float | None = None,
    L_v: float = SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER,
    R_v: float = WATER_VAPOR_GAS_CONSTANT,
) -> float:
    """
    Calculate the slope of saturation vapor pressure curve (delta) using de_s/dT = L_v(T)*e_s / (R_v * T^2).

    Args:
        T: temperature (K)
        e_s: saturation vapor pressure (kPa)
        L_v: latent heat of evaporation of water (MJ/Mg)
        R_v: gas constant of water vapor (J kg^-1 K^-1)

    Returns:
        Delta: slope of saturation vapor pressure curve (kPa K^-1)
    """
    # Convert L_v from MJ/Mg to J/kg
    L_v_j_kg = L_v * 1000

    if e_s is None:
        e_s = calculate_saturation_vapor_pressure(T)

    Delta = (L_v_j_kg * e_s) / (R_v * T**2)

    return Delta


def calculate_evaporation_rate(
    *,
    R_n: float,
    delta: float,
    u_a: float,
    T_mean: float,
    rel_hum: float,
    c_t: float = CONVERSION_CONSTANT,
    L_v: float = SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER,
    rho_w: float = WATER_DENSITY,
    gamma: float = PSYCHROMETRIC_CONSTANT,
) -> float:
    """
    Calculate evaporation rate of water surface (E_pr) using the psychrometric equation.

    Args:
        R_n: net radiation above the surface (W m^-2)
        delta: slope of the saturated vapor pressure curve (kPa K^-1)
        u_a: wind speed (m s^-1)
        T_mean: daily mean temperature (°C)
        rel_hum: relative humidity ratio (0-1)
        c_t: conversion constant (0.01157 W m day MJ^-1 mm^-1)
        L_v: latent heat of vaporization (2448 MJ Mg^-1)
        rho_w: density of water (1.0 Mg m^-3)
        gamma: psychrometric constant (0.067 kPa K^-1)

    Returns:
        E_pr: evaporation rate of water surface (mm day^-1)
    """

    e_star = calculate_saturation_vapor_pressure(T=T_mean)
    D_a = (1 - rel_hum) * e_star

    numerator = delta * R_n + 2.6 * c_t * L_v * rho_w * gamma * (1 + 0.54 * u_a) * D_a
    denominator = delta + gamma

    E_pr = numerator / (c_t * L_v * rho_w * denominator)

    return E_pr


def calculate_evaporation_rate_from_kwargs(kwargs: dict[str, float]) -> float:
    """
    Extract parameters from kwargs dict and calculate evaporation rate.

    Args:
        kwargs: Dictionary containing weather data columns:
            - terrestrial_radiation (W/m²): net radiation above surface
            - Delta: slope of saturated vapor pressure curve (kPa K^-1)
            - wind_speed_10m (m/s): wind speed at 10m height
            - temperature_2m (K): air temperature at 2m height
            - relative_humidity_2m (frac): relative humidity as fraction

    Returns:
        Evaporation rate (mm day^-1)
    """
    R_n = kwargs["terrestrial_radiation (W/m²)"]
    delta = kwargs["Delta"]
    u_a = kwargs["wind_speed_10m (m/s)"]
    T_mean = kwargs["temperature_2m (K)"]
    rel_hum = kwargs["relative_humidity_2m (frac)"]

    return calculate_evaporation_rate(
        R_n=R_n, delta=delta, u_a=u_a, T_mean=T_mean, rel_hum=rel_hum
    )


def calculate_power_per_area(
    evap_rate: float,
    T_air: float,
    rel_hum_wet: float,
    rel_hum_air: float,
    c_t: float = EVAPORATION_CONVERSION_CONSTANT,
    R: float = IDEAL_GAS_CONSTANT,
) -> float:
    """
    Calculate power per area using the given equation.

    Args:
        evap_rate: estimated evaporation rate of water surface (mm day^-1)
        T_air: temperature of the air (K)
        RH_wet: relative humidity in the saturated zone above evaporating water (0.95-1.0)
        RH_air: ambient relative humidity in the air
        c_t: conversion constant for evaporation rate (6.42465 * 10^-4 mols day mm^-1 m^-2 s^-1)
        R: ideal gas constant (8.31 J mol^-1 K^-1)

    Returns:
        Power per area (W m^-2)
    """

    power_per_area = c_t * evap_rate * R * T_air * math.log(rel_hum_wet / rel_hum_air)

    return power_per_area


def calculate_power_per_area_from_kwargs(kwargs: dict[str, float]) -> float:
    """
    Extract parameters from kwargs dict and calculate power per area.

    Args:
        kwargs: Dictionary containing calculated data:
            - evap_rate: evaporation rate (mm day^-1)
            - temperature_2m (K): air temperature at 2m height
            - relative_humidity_2m (frac): ambient relative humidity as fraction
            - rel_hum_wet (optional): relative humidity in saturated zone (defaults to 0.99)

    Returns:
        Power per area (W m^-2)
    """
    evap_rate = kwargs["evap_rate"]
    T_air = kwargs["temperature_2m (K)"]
    rel_hum_wet = kwargs.get("rel_hum_wet", 0.99)
    rel_hum_air = kwargs["relative_humidity_2m (frac)"]

    return calculate_power_per_area(
        evap_rate=evap_rate,
        T_air=T_air,
        rel_hum_wet=rel_hum_wet,
        rel_hum_air=rel_hum_air,
    )


def get_df(path: str | Path | None = None) -> pl.DataFrame:
    """
    Load and process weather data CSV into analysis DataFrame.

    Transforms raw weather data by:
    - Converting units (temperature to K, wind speed to m/s, humidity to fraction)
    - Calculating Delta (slope of saturation vapor pressure curve)
    - Computing evaporation rates using psychrometric equations
    - Calculating power per area and energy density

    Args:
        path: Path to CSV file (defaults to CSV_FILE constant)

    Returns:
        Processed DataFrame with calculated evaporation rates and power metrics
    """
    if path is None:
        path = CSV_FILE

    data_cols = [
        "temperature_2m (K)",
        "Delta",
        "relative_humidity_2m (frac)",
        "wind_speed_10m (m/s)",
        "terrestrial_radiation (W/m²)",
    ]

    df = (
        pl.read_csv(path, skip_lines=3)
        .with_columns(
            pl.from_epoch("time") - pl.duration(hours=4),
            (pl.col("temperature_2m (°C)") + 273.15).alias("temperature_2m (K)"),
            (pl.col("wind_speed_10m (km/h)") * 1000 / 3600).alias(
                "wind_speed_10m (m/s)"
            ),
            (pl.col("relative_humidity_2m (%)") / 100).alias(
                "relative_humidity_2m (frac)"
            ),
        )
        .with_columns(
            pl.col("temperature_2m (K)")
            .map_elements(lambda T: calculate_Delta(T=T), return_dtype=pl.Float64)
            .alias("Delta")
        )
        .with_columns(
            pl.struct(data_cols)
            .map_elements(
                calculate_evaporation_rate_from_kwargs, return_dtype=pl.Float64
            )
            .alias("evap_rate"),
        )
        .with_columns(
            pl.struct(*data_cols, "evap_rate")
            .map_elements(calculate_power_per_area_from_kwargs, return_dtype=pl.Float64)
            .alias("power (W/m^2)")
        )
        .with_columns((pl.col("power (W/m^2)") * 3600 / 1000).alias("energy (kJ/m^2)"))
    )

    return df


def get_lat_lon(path: str | Path | None = None) -> tuple[float, float]:
    """
    Extract latitude and longitude from weather data CSV header.

    Args:
        path: Path to CSV file (defaults to CSV_FILE constant)

    Returns:
        Tuple of (latitude, longitude) coordinates
    """
    if path is None:
        path = CSV_FILE

    df = pl.read_csv(path, n_rows=2, n_threads=1, truncate_ragged_lines=True)

    row = df.row(0, named=True)
    return (row["latitude"], row["longitude"])


def plot_df(
    df: pl.DataFrame,
    *,
    rolling=False,
    date_range: tuple[datetime.date, datetime.date] | None = None,
) -> alt.Chart:
    """
    Create a time series line chart of evaporative power data.

    Args:
        df: DataFrame with weather and power calculations
        rolling: If True, apply 1-week rolling average to smooth data
        date_range: Optional tuple of (start_date, end_date) to filter data

    Returns:
        Altair Chart object with time series visualization
    """
    (lat, lon) = get_lat_lon()

    if rolling:
        df = (
            df.rolling("time", period="1w", offset="0d")
            .agg(pl.col("power (W/m^2)").mean())
            .filter(pl.col("time") < pl.datetime(year=2025, month=8, day=1))
        )

    if date_range is not None:
        df = df.filter(pl.col("time").is_between(*date_range))

    return (
        alt.Chart(df)
        .mark_line()
        .encode(
            x=alt.X(
                "time",
                axis=alt.Axis(
                    format="%b %-d",
                    labelAngle=-40,
                    labelOverlap=True,
                    labelSeparation=-10,
                ),
            ),
            y="power (W/m^2)",
        )
        .properties(title=f"Evaporative power in NYC ({lat}, {lon}), Aug '24–Jul '25")
    )


def main():
    """
    Main entry point that loads data and displays rolling average power chart.

    Creates a visualization of evaporative power for Feb-June 2025 period
    with 1-week rolling average smoothing.
    """
    df = get_df()
    charts = {
        "full_year_rolling_week": plot_df(df, rolling=True),
        "june_2025": plot_df(
            df,
            rolling=False,
            date_range=(datetime.date(2025, 6, 1), datetime.datetime(2025, 6, 30)),
        ),
    }
    for name, chart in charts.items():
        _ = display(chart)
        chart.save(f"power_{name}.pdf")

    total_energy = df.select(energy=pl.col("power (W/m^2)").sum() * 3600).item()
    print(f"Total energy per area for the year: {total_energy} J/m^2")


if __name__ == "__main__":
    main()
