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
// Vapor pressure calculation method type
export type VaporPressureMethod =
	| "buck"
	| "magnus"
	| "tetens"
	| "antoine"
	| "goff-gratch";

/**
 * Calculate saturation vapor pressure using the Buck equation.
 *
 * @param T - temperature in Kelvin (K)
 * @returns Saturation vapor pressure (kPa)
 */
function calculateSaturationVaporPressure_Buck(T: number): number {
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
 * Calculate saturation vapor pressure using the Magnus formula.
 *
 * @param T - temperature in Kelvin (K)
 * @returns Saturation vapor pressure (kPa)
 */
function calculateSaturationVaporPressure_Magnus(T: number): number {
	const T_celsius = T - 273.15;
	const e_s_hPa = 6.112 * Math.exp((17.67 * T_celsius) / (T_celsius + 243.5));
	return e_s_hPa / 10; // Convert hPa to kPa
}

/**
 * Calculate saturation vapor pressure using the Tetens equation.
 *
 * @param T - temperature in Kelvin (K)
 * @returns Saturation vapor pressure (kPa)
 */
function calculateSaturationVaporPressure_Tetens(T: number): number {
	const T_celsius = T - 273.15;
	const e_s_hPa = 6.1078 * Math.exp((17.27 * T_celsius) / (T_celsius + 237.3));
	return e_s_hPa / 10;
}

/**
 * Calculate saturation vapor pressure using the Antoine equation.
 *
 * @param T - temperature in Kelvin (K)
 * @returns Saturation vapor pressure (kPa)
 */
function calculateSaturationVaporPressure_Antoine(T: number): number {
	// Antoine constants for water (temperature in K, pressure in mmHg)
	const A = 8.07131;
	const B = 1730.63;
	const C = -39.724;

	const log10_p_mmHg = A - B / (T + C);
	const p_mmHg = Math.pow(10, log10_p_mmHg);
	const p_kPa = p_mmHg * 0.133322; // Convert mmHg to kPa

	return p_kPa;
}

/**
 * Calculate saturation vapor pressure using the Goff-Gratch equation.
 *
 * @param T - temperature in Kelvin (K)
 * @returns Saturation vapor pressure (kPa)
 */
function calculateSaturationVaporPressure_GoffGratch(T: number): number {
	const T_steam = 373.16; // Steam point temperature (K)

	const log10_e_s =
		-7.90298 * (T_steam / T - 1) +
		5.02808 * Math.log10(T_steam / T) -
		1.3816e-7 * (Math.pow(10, 11.344 * (1 - T / T_steam)) - 1) +
		8.1328e-3 * (Math.pow(10, -3.49149 * (T_steam / T - 1)) - 1) +
		Math.log10(1013.246);

	const e_s_hPa = Math.pow(10, log10_e_s);
	return e_s_hPa / 10; // Convert to kPa
}

export function calculateSaturationVaporPressure(
	T: number,
	method: VaporPressureMethod = "buck",
): number {
	switch (method) {
		case "magnus":
			return calculateSaturationVaporPressure_Magnus(T);
		case "tetens":
			return calculateSaturationVaporPressure_Tetens(T);
		case "antoine":
			return calculateSaturationVaporPressure_Antoine(T);
		case "goff-gratch":
			return calculateSaturationVaporPressure_GoffGratch(T);
		case "buck":
		default:
			return calculateSaturationVaporPressure_Buck(T);
	}
}

/**
 * Calculate the slope of saturation vapor pressure curve (delta) using
 * `Delta := de_s/dT = L_v(T)*e_s / (R_v * T^2)`
 *
 * @param T - temperature (K)
 * @param e_s - saturation vapor pressure (kPa)
 * @param L_v - latent heat of evaporation of water (MJ/Mg)
 * @param R_v - gas constant of water vapor (J kg^-1 K^-1)
 * @returns Delta: slope of saturation vapor pressure curve (kPa K^-1)
 */
export function calculateDelta(params: {
	T: number;
	e_s?: number;
	L_v?: number;
	R_v?: number;
	method?: VaporPressureMethod;
}): number {
	const {
		T,
		e_s,
		L_v = SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER,
		R_v = WATER_VAPOR_GAS_CONSTANT,
		method = "buck",
	} = params;

	// Convert L_v from MJ/Mg to J/kg
	const L_v_j_kg = L_v * 1000;

	const e_s_calculated = e_s ?? calculateSaturationVaporPressure(T, method);
	const Delta = (L_v_j_kg * e_s_calculated) / (R_v * T ** 2);

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
export function calculateEvaporationRate(params: {
	R_n: number;
	delta: number;
	u_a: number;
	T_mean: number;
	relHum: number;
	c_t?: number;
	L_v?: number;
	rho_w?: number;
	gamma?: number;
	method?: VaporPressureMethod;
}): number {
	const {
		R_n,
		delta,
		u_a,
		T_mean,
		relHum,
		c_t = CONVERSION_CONSTANT,
		L_v = SPECIFIC_LATENT_HEAT_OF_VAPORIZATION_WATER,
		rho_w = WATER_DENSITY,
		gamma = PSYCHROMETRIC_CONSTANT,
		method = "buck",
	} = params;

	const e_star = calculateSaturationVaporPressure(T_mean, method);
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
export function calculatePowerPerArea(params: {
	evapRate: number;
	T_air: number;
	relHumWet: number;
	relHumAir: number;
	c_t?: number;
	R?: number;
}): number {
	const {
		evapRate,
		T_air,
		relHumWet,
		relHumAir,
		c_t = EVAPORATION_CONVERSION_CONSTANT,
		R = IDEAL_GAS_CONSTANT,
	} = params;

	const powerPerArea =
		c_t * evapRate * R * T_air * Math.log(relHumWet / relHumAir);

	return powerPerArea;
}
