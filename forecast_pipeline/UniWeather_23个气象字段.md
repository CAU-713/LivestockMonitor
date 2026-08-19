# UniWeather使用的23个数值气象字段

UniWeather使用23个随时间变化的数值气象字段。这些字段既作为第一阶段气象预训练的输入，也作为需要预测的目标变量；在下游适配阶段，它们作为气象外生变量输入模型。

## 字段列表

| 序号 | 类别 | 字段名 | 中文含义 | 单位 |
|---:|---|---|---|---|
| 1 | 热环境 | `temperature_2m` | 距地面2米处的空气温度 | ℃ |
| 2 | 热环境 | `dewpoint_2m` | 距地面2米处的露点温度 | ℃ |
| 3 | 热环境 | `apparent_temperature` | 综合气温、湿度和风况计算的体感温度 | ℃ |
| 4 | 热环境 | `wet_bulb_temperature_2m` | 距地面2米处的湿球温度，反映蒸发冷却潜力 | ℃ |
| 5 | 湿度与降水 | `relative_humidity_2m` | 距地面2米处的相对湿度 | % |
| 6 | 湿度与降水 | `precipitation` | 总降水量，包括液态和固态降水 | mm |
| 7 | 湿度与降水 | `rain` | 总降水中的液态降雨量 | mm |
| 8 | 湿度与降水 | `snowfall` | 降雪量 | cm |
| 9 | 湿度与降水 | `vapor_pressure_deficit` | 饱和水汽压与实际水汽压之差，反映空气干燥需求 | kPa |
| 10 | 云量 | `cloud_cover` | 天空被云层覆盖的比例，即总云量 | % |
| 11 | 云量 | `cloud_cover_low` | 天空被低层云覆盖的比例 | % |
| 12 | 云量 | `cloud_cover_mid` | 天空被中层云覆盖的比例 | % |
| 13 | 风 | `wind_speed_10m` | 距地面10米处的风速 | km/h |
| 14 | 风 | `wind_speed_100m` | 距地面100米处的风速 | km/h |
| 15 | 风 | `wind_direction_10m` | 距地面10米处的风向 | ° |
| 16 | 风 | `wind_direction_100m` | 距地面100米处的风向 | ° |
| 17 | 风 | `wind_gusts_10m` | 距地面10米处的最大短时阵风风速 | km/h |
| 18 | 太阳辐射 | `shortwave_radiation_ghi` | 全球水平短波辐射，包括直接和散射短波辐射 | W/m² |
| 19 | 土壤 | `soil_temperature_0_to_7cm` | 地表以下0–7 cm土层温度 | ℃ |
| 20 | 土壤 | `soil_temperature_7_to_28cm` | 地表以下7–28 cm土层温度 | ℃ |
| 21 | 土壤 | `soil_moisture_0_to_7cm` | 地表以下0–7 cm土层的体积含水量 | m³/m³ |
| 22 | 土壤 | `soil_moisture_7_to_28cm` | 地表以下7–28 cm土层的体积含水量 | m³/m³ |
| 23 | 蒸散 | `et0_fao_evapotranspiration` | 按FAO方法估算的参考蒸散量 | mm |

## 字段构成统计

| 类别 | 字段数量 |
|---|---:|
| 热环境 | 4 |
| 湿度与降水 | 5 |
| 云量 | 3 |
| 风 | 5 |
| 太阳辐射 | 1 |
| 土壤 | 4 |
| 蒸散 | 1 |
| **合计** | **23** |

## 其他辅助输入

除上述23个数值气象字段外，UniWeather还使用以下辅助信息，但它们不计入这23个数值字段：

- `weather_code`：WMO天气代码，经映射后形成8维天气语义向量；
- `climate_zone`：气候区类别；
- `latitude`：归一化纬度；
- `longitude`：归一化经度。

因此，论文中的完整模型输入共包含27个变量：23个数值气象字段、1个天气语义字段和3个静态气候地理字段。

## 数据来源

- `shortwave_radiation_ghi`：Open-Meteo Satellite Radiation API；
- 其余22个数值气象字段及`weather_code`：Open-Meteo Historical Weather API；
- `climate_zone`、`latitude`和`longitude`：根据城市气候区和地理坐标单独构建。
