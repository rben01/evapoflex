// Constants from psychometric equation
const CONVERSION_CONSTANT = 0.01157; // c_1 (W m day MJ^-1 mm^-1)
export const SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER = 2448; // L_v (MJ Mg^-1)
const WATER_DENSITY = 1.0; // rho_w (Mg m^-3)
const PSYCHROMETRIC_CONSTANT = 0.067; // gamma (kPa K^-1)

// Constants from power per area equation
const EVAPORATION_CONVERSION_CONSTANT = 6.42465e-4; // c_t (mols day mm^-1 m^-2 s^-1)

// Other constants
const IDEAL_GAS_CONSTANT = 8.31446261815324; // R (J mol^-1 K^-1)
const WATER_VAPOR_GAS_CONSTANT = 461.5; // R_v (J kg^-1 K^-1)

/**
 * Calculate saturation vapor pressure using the Buck equation.
 *
 * @param T - temperature in Kelvin (K)
 * @returns Saturation vapor pressure (kPa)
 */
export function calculateSaturationVaporPressure(T: number): number {
	const T_celsius = T - 273.15;

	// in hPa = kPa/10
	const e_s_hPa =
		6.1121 *
		Math.exp(
			((18.678 - T_celsius / 234.5) * T_celsius) / (257.14 + T_celsius),
		);
	return e_s_hPa / 10;
}

/**
 * Calculate the slope of saturation vapor pressure curve (delta) using de_s/dT = L_v(T)*e_s / (R_v * T^2).
 *
 * @param T - temperature (K)
 * @param e_s - saturation vapor pressure (kPa)
 * @param L_v - latent heat of evaporation of water (MJ/Mg)
 * @param R_v - gas constant of water vapor (J kg^-1 K^-1)
 * @returns Delta: slope of saturation vapor pressure curve (kPa K^-1)
 */
export function calculateDelta(
	T: number,
	e_s?: number,
	L_v: number = SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER,
	R_v: number = WATER_VAPOR_GAS_CONSTANT,
): number {
	// Convert L_v from MJ/Mg to J/kg
	const L_v_j_kg = L_v * 1000;

	if (e_s === undefined) {
		e_s = calculateSaturationVaporPressure(T);
	}

	const Delta = (L_v_j_kg * e_s) / (R_v * T ** 2);

	return Delta;
}

/**
 * Calculate evaporation rate of water surface (E_pr) using the psychrometric equation.
 *
 * @param R_n - net radiation above the surface (W m^-2)
 * @param delta - slope of the saturated vapor pressure curve (kPa K^-1)
 * @param u_a - wind speed (m s^-1)
 * @param T_mean - daily mean temperature (K)
 * @param rel_hum - relative humidity ratio (0-1)
 * @param c_t - conversion constant (0.01157 W m day MJ^-1 mm^-1)
 * @param L_v - latent heat of vaporization (2448 MJ Mg^-1)
 * @param rho_w - density of water (1.0 Mg m^-3)
 * @param gamma - psychrometric constant (0.067 kPa K^-1)
 * @returns E_pr: evaporation rate of water surface (mm day^-1)
 */
export function calculateEvaporationRate(
	R_n: number,
	delta: number,
	u_a: number,
	T_mean: number,
	relHum: number,
	c_t: number = CONVERSION_CONSTANT,
	L_v: number = SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER,
	rho_w: number = WATER_DENSITY,
	gamma: number = PSYCHROMETRIC_CONSTANT,
): number {
	const e_star = calculateSaturationVaporPressure(T_mean);
	const D_a = (1 - relHum) * e_star;

	const numerator =
		delta * R_n + 2.6 * c_t * L_v * rho_w * gamma * (1 + 0.54 * u_a) * D_a;
	const denominator = delta + gamma;

	const E_pr = numerator / (c_t * L_v * rho_w * denominator);

	return E_pr;
}

/**
 * Calculate power per area using the given equation.
 *
 * @param evap_rate - estimated evaporation rate of water surface (mm day^-1)
 * @param T_air - temperature of the air (K)
 * @param rel_hum_wet - relative humidity in the saturated zone above evaporating water (0.95-1.0)
 * @param rel_hum_air - ambient relative humidity in the air
 * @param c_t - conversion constant for evaporation rate (6.42465 * 10^-4 mols day mm^-1 m^-2 s^-1)
 * @param R - ideal gas constant (8.31 J mol^-1 K^-1)
 * @returns Power per area (W m^-2)
 */
export function calculatePowerPerArea(
	evapRate: number,
	T_air: number,
	relHumWet: number,
	relHumAir: number,
	c_t: number = EVAPORATION_CONVERSION_CONSTANT,
	R: number = IDEAL_GAS_CONSTANT,
): number {
	const powerPerArea =
		c_t * evapRate * R * T_air * Math.log(relHumWet / relHumAir);

	return powerPerArea;
}
