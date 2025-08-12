#!/bin/sh

lat='40.811419'
lon='-73.962220'
start_date='2024-08-01'
end_date='2025-08-07'

out_file='weather-data.csv'

curl "https://archive-api.open-meteo.com/v1/archive?format=csv&timeformat=unixtime&latitude=$lat&longitude=$lon&start_date=$start_date&end_date=$end_date&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,wind_speed_10m,wind_speed_100m,wind_direction_100m,wind_direction_10m,wind_gusts_10m,rain,weather_code,cloud_cover,cloud_cover_low,cloud_cover_high,cloud_cover_mid,et0_fao_evapotranspiration,vapour_pressure_deficit,wet_bulb_temperature_2m,is_day,sunshine_duration,albedo,shortwave_radiation,direct_radiation,diffuse_radiation,direct_normal_irradiance,global_tilted_irradiance,terrestrial_radiation,shortwave_radiation_instant,direct_radiation_instant,diffuse_radiation_instant,direct_normal_irradiance_instant,global_tilted_irradiance_instant,terrestrial_radiation_instant" -o "$out_file"
