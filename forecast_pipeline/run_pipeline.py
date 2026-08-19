# -*- coding: utf-8 -*-
"""主流程: 读库 → 转宽表 → 预测 → 写库 (可单次或循环)

用法:
  python run_pipeline.py                          # 执行一次
  python run_pipeline.py --loop                   # 循环执行(默认每小时一次)
  python run_pipeline.py --loop --interval 300    # 循环执行, 每300秒一次
  python run_pipeline.py --loop --interval 1800   # 循环执行, 每30分钟一次

执行频率不写死: 通过命令行参数 --interval 或环境变量 FORECAST_INTERVAL_SECONDS
配置(默认 3600 秒 = 每小时), 现场需要调整直接改参数即可。

部署注意: 必须设置环境变量 DB_PASSWORD(数据库密码), 否则后台运行会连接失败。
"""
from __future__ import annotations

import argparse
import logging
import os
import time

from db_config import DB_CONFIG, GATEWAY_MAC, DEVICE_ID, FORECAST_TABLE
from load_wide import get_engine, load_wide_history
from save_forecast import init_forecast_table, save_forecast_result
from predict import predict_environment

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("pipeline")

DEFAULT_INTERVAL_SECONDS = 3600  # 默认每小时预测一次

# 这些错误属于"数据未就绪"(采集失效/缺失), 跳过本次预测而非报错, 避免异常期刷屏。
# 告警目前以 WARNING 日志形式输出, 后续如需可在此接入钉钉/企业微信机器人。
_SKIP_KEYWORDS = (
    "无数据",
    "全0",
    "长缺口",
    "不足",
    "缺少 pointId",
)


def _is_data_unready(exc: Exception) -> bool:
    """数据未就绪(采集失效/缺口)时返回 True, 应跳过本次预测。"""
    return any(k in str(exc) for k in _SKIP_KEYWORDS)


def run_once() -> str:
    """执行一次完整流程, 返回 'ok' / 'skip' / 'error'。"""
    engine = get_engine()
    try:
        # 1. 建表(幂等)
        init_forecast_table(engine)
        # 2. 读库转宽表
        wide = load_wide_history(engine, GATEWAY_MAC, DEVICE_ID)
        log.info("宽表就绪: %s, 时间 %s ~ %s",
                 wide.shape, wide["时间"].iloc[0], wide["时间"].iloc[-1])
        # 3. 模型预测
        forecast = predict_environment(
            wide,
            gateway_mac=GATEWAY_MAC,
            device_id=DEVICE_ID,
        )
        log.info("预测完成: %s 行 (72步×27变量)", len(forecast))
        # 4. 写库
        n = save_forecast_result(engine, forecast)
        log.info("写入 %s: %s 行, batch_id=%s", FORECAST_TABLE, n,
                 forecast["batch_id"].iloc[0])
        return "ok"
    except Exception as e:
        if _is_data_unready(e):
            # 数据未就绪(传感器全0/长缺口等): 跳过本次, 记告警日志
            log.warning("数据未就绪, 跳过本次预测: %s", e)
            return "skip"
        log.error("流程失败: %s", e, exc_info=True)
        return "error"


def main():
    ap = argparse.ArgumentParser(description="环境时序预测主流程")
    ap.add_argument("--loop", action="store_true", help="循环模式")
    ap.add_argument("--interval", type=float, default=None,
                    help="循环间隔(秒), 默认 3600(每小时), 也可用环境变量 FORECAST_INTERVAL_SECONDS")
    args = ap.parse_args()

    if not args.loop:
        status = run_once()
        # skip(数据未就绪)视为正常, 返回0, 便于 cron 等调度不误报失败
        raise SystemExit(0 if status in ("ok", "skip") else 1)

    interval = args.interval or float(
        os.getenv("FORECAST_INTERVAL_SECONDS", DEFAULT_INTERVAL_SECONDS)
    )
    if interval <= 0:
        raise SystemExit("循环间隔必须大于 0 秒")
    log.info("循环模式启动, 每 %.0f 秒执行一次 (Ctrl+C 退出)", interval)
    while True:
        t0 = time.time()
        try:
            run_once()
        except Exception:
            log.exception("循环执行异常")
        # 距下次执行 sleep, 保证约每 interval 秒一次
        sleep = max(0, interval - (time.time() - t0))
        time.sleep(sleep)


if __name__ == "__main__":
    main()
