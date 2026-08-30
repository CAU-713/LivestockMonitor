# -*- coding: utf-8 -*-
"""主流程: 读库 → 转宽表 → 预测 → 写库 (可单次或循环)
用法:
  python run_pipeline.py            # 执行一次
  python run_pipeline.py --loop     # 每5分钟循环执行
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


def run_once() -> bool:
    """执行一次完整流程, 成功返回 True"""
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
        return True
    except Exception as e:
        log.error("流程失败: %s", e, exc_info=True)
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--loop", action="store_true", help="循环模式")
    ap.add_argument("--interval", type=float, default=None,
                    help="循环间隔(秒), 默认 3600(每小时)")
    args = ap.parse_args()

    if not args.loop:
        ok = run_once()
        raise SystemExit(0 if ok else 1)

    interval = args.interval or float(os.getenv("FORECAST_INTERVAL_SECONDS", DEFAULT_INTERVAL_SECONDS))
    if interval <= 0:
        raise SystemExit("循环间隔必须大于 0 秒")
    log.info("循环模式启动, 每 %.0f 秒执行一次 (Ctrl+C 退出)", interval)
    while True:
        t0 = time.time()
        try:
            run_once()
        except Exception:
            log.exception("循环执行异常")
        # 距下次执行 sleep, 保证约 interval 秒一次
        sleep = max(0, interval - (time.time() - t0))
        time.sleep(sleep)


if __name__ == "__main__":
    main()
