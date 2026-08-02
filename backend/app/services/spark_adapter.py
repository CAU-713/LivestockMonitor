"""
sparks 数据模型适配层
将 sparks MySQL 的扁平数据结构映射为系统标准模型（shed/sensor/sensor_record）。
"""
from typing import Any, Dict, List


class SparkDataAdapter:
    """将 sparks 原始数据适配为前端期望的标准格式"""

    def points_to_sensor_list(self, points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        将 device_data_update 的测点数据转换为传感器列表。

        每个测点映射为一个传感器对象，包含：
        - id: pointId
        - name: pointName（中文名）
        - type: 从 pointId 前缀推导的传感器类型
        - value: 最新值
        - unit: 根据类型推导的单位
        - updated_at: 数据更新时间
        """
        sensors = []
        for p in points:
            point_id = p.get("pointId", "")
            point_type = self._infer_sensor_type(point_id)

            sensors.append({
                "id": point_id,
                "name": p.get("pointName", point_id),
                "point_id": point_id,
                "point_name": p.get("pointName", ""),
                "device_id": p.get("deviceId", ""),
                "gateway_mac": p.get("gatewayMac", ""),
                "type": point_type,
                "type_name": self._get_type_name(point_type),
                "value": p.get("value", ""),
                "unit": self._get_unit(point_type),
                "status": "active",
                "updated_at": str(p.get("updated_at", "")) if p.get("updated_at") else None,
                "created_at": str(p.get("created_at", "")) if p.get("created_at") else None,
            })
        return sensors

    def history_to_chart_data(
        self,
        rows: List[Dict[str, Any]],
        granularity: str = "raw",
    ) -> List[Dict[str, Any]]:
        """
        将 device_data_save 的历史数据转换为图表数据格式。

        返回格式：
        - raw: [{ pointId, pointName, value, created_at }, ...]
        - hour/day: [{ pointId, pointName, record_time, avg_value, min_value, max_value, sample_count }, ...]
        """
        result = []
        for r in rows:
            item = {
                "point_id": r.get("pointId", ""),
                "point_name": r.get("pointName", ""),
            }

            if granularity in ("hour", "day"):
                item.update({
                    "record_time": str(r.get("record_time", "")),
                    "avg_value": r.get("avg_value"),
                    "min_value": r.get("min_value"),
                    "max_value": r.get("max_value"),
                    "sample_count": r.get("sample_count"),
                })
            else:
                item.update({
                    "id": r.get("id"),
                    "created_at": str(r.get("created_at", "")) if r.get("created_at") else None,
                    "value": r.get("value", ""),
                    "device_id": r.get("deviceId", ""),
                    "gateway_mac": r.get("gatewayMac", ""),
                })

            result.append(item)
        return result

    def gateway_to_shed(self, gateway: Dict[str, Any]) -> Dict[str, Any]:
        """将网关状态映射为 shed 对象"""
        if not gateway:
            return {}
        return {
            "id": gateway.get("gatewayMac", ""),
            "name": f"网关-{gateway.get('gatewayMac', 'unknown')[:6]}",
            "gateway_mac": gateway.get("gatewayMac", ""),
            "sim_insert": gateway.get("simInsert", 0),
            "iccid": gateway.get("iccid", ""),
            "csq": gateway.get("csq", -1),
            "latitude": gateway.get("latitude", 0),
            "longitude": gateway.get("longitude", 0),
            "updated_at": str(gateway.get("created_at", "")) if gateway.get("created_at") else None,
        }

    def device_attr_to_status(self, attr: Dict[str, Any]) -> Dict[str, Any]:
        """将 device_attribute 转换为设备通信状态对象"""
        if not attr:
            return {}
        return {
            "device_id": attr.get("deviceId", ""),
            "gateway_mac": attr.get("gatewayMac", ""),
            "is_online": bool(attr.get("isOnline", 0)),
            "loss_rate": attr.get("lossRate", 0),
            "comm_total_cnt": attr.get("commTotalCnt", 0),
            "comm_fail_cnt": attr.get("commFailCnt", 0),
            "last_comm_time": str(attr.get("lastCommRTC", "")) if attr.get("lastCommRTC") else None,
            "code": attr.get("code", 0),
            "message": attr.get("message", ""),
            "updated_at": str(attr.get("created_at", "")) if attr.get("created_at") else None,
        }

    def device_attrs_to_list(self, attrs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """批量转换 device_attribute 列表"""
        return [self.device_attr_to_status(a) for a in attrs]

    def overview_stats(self, stats: Dict[str, Any]) -> Dict[str, Any]:
        """格式化概览统计"""
        return {
            "total_points": stats.get("total_points", 0),
            "total_gateways": stats.get("total_gateways", 0),
            "total_devices": stats.get("total_devices", 0),
            "device_online": bool(stats.get("device_online", 0)),
            "device_loss_rate": stats.get("device_loss_rate", 0),
            "last_comm_time": stats.get("last_comm_time"),
            "gateway_csq": stats.get("gateway_csq", -1),
            "gateway_latitude": stats.get("gateway_latitude", 0),
            "gateway_longitude": stats.get("gateway_longitude", 0),
            "gateway_sim_insert": bool(stats.get("gateway_sim_insert", 0)),
        }

    # ==================== 辅助方法 ====================

    @staticmethod
    def _infer_sensor_type(point_id: str) -> str:
        """从 pointId 前缀推导传感器类型（支持前缀聚合与过滤）"""
        if not point_id:
            return "Unknown"
        prefix = point_id.split("-")[0].upper() if "-" in point_id else point_id.upper()

        type_map = {
            "CO2": "CO2",
            "LIG": "Light",
            "HUM": "Humidity",
            "TEMP": "Temperature",
            "TEM": "Temperature",
            "NH3": "Ammonia",
            "WIND": "WindSpeed",
            "WIN": "WindSpeed",
            "O2": "Oxygen",
            "H2S": "H2S",
            "CH4": "CH4",
            "PM": "PM",
            "TSP": "PM",
            "PM10": "PM",
            "PM25": "PM",
            "NOISE": "Noise",
            "BGT": "Temperature",  # 黑球温度归入温度类
        }
        # Q 前缀统一聚合（Q00/Q01/Q02/Q03… 设备控制关联）
        if prefix.startswith("Q"):
            return "Device"
        # I、M 前缀是设备开关/状态反馈（不是传感器数据），统一归为 Device
        if prefix.startswith("I") or prefix.startswith("M"):
            return "Device"
        return type_map.get(prefix, prefix)

    @staticmethod
    def _get_type_name(sensor_type: str) -> str:
        """获取传感器类型的中文名"""
        name_map = {
            "CO2": "二氧化碳",
            "Light": "光照",
            "Humidity": "湿度",
            "Temperature": "温度",
            "Ammonia": "氨气",
            "WindSpeed": "风速",
            "Oxygen": "氧气",
            "H2S": "硫化氢",
            "CH4": "甲烷",
            "PM": "颗粒物",
            "Noise": "噪音",
            "BGT": "黑球温度",
            "Device": "设备",
        }
        return name_map.get(sensor_type, sensor_type)

    @staticmethod
    def _get_unit(sensor_type: str) -> str:
        """获取传感器类型的单位"""
        unit_map = {
            "CO2": "ppm",
            "Light": "lux",
            "Humidity": "%RH",
            "Temperature": "°C",
            "Ammonia": "ppm",
            "WindSpeed": "m/s",
            "Oxygen": "%",
            "H2S": "ppm",
            "CH4": "ppm",
            "PM": "μg/m³",
            "Noise": "dB",
            "BGT": "°C",
            "Device": "",
        }
        return unit_map.get(sensor_type, "")


# 单例
spark_adapter = SparkDataAdapter()
