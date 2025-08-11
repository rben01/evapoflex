MOLAR_ENTHALPY_OF_VAPORIZATION_WATER = 40.66  # kJ/mol
WATER_BOILING_POINT = 373.15  # K (100°C)
STANDARD_PRESSURE = 101.325  # kPa
IDEAL_GAS_CONSTANT = 8.31446261815324  # R (J mol^-1 K^-1)


def _clausius_clapeyron_vapor_pressure(
    *,
    T: float,
    H_vap: float = MOLAR_ENTHALPY_OF_VAPORIZATION_WATER,
    R: float = IDEAL_GAS_CONSTANT,
    P_ref: float = STANDARD_PRESSURE,
    T_boil: float = WATER_BOILING_POINT,
) -> float:
    """
    Calculate vapor pressure using the Clausius-Clapeyron equation.

    Args:
        T: current temperature (K)
        H_vap: enthalpy of vaporization (kJ/mol)
        R: specific gas constant (J/(mol K))
        P_ref: reference pressure at boiling point (kPa)
        T_boil: boiling point temperature (K)

    Returns:
        Vapor pressure (kPa)
    """
    # Convert H_vap from kJ/mol to J/mol
    H_vap_j = H_vap * 1000

    # Clausius-Clapeyron equation: ln(P/P_ref) = -(H_vap/R) * (1/T - 1/T_boil)
    ln_p_ratio = -(H_vap_j / R) * (1 / T - 1 / T_boil)

    vapor_pressure = P_ref * math.exp(ln_p_ratio)

    return vapor_pressure
