'use client';

import { useCallback, useEffect, useRef } from 'react';

interface UsePollingOptions {
  /** 轮询间隔（毫秒），默认 5000 */
  interval?: number;
  /** 是否启用轮询，默认 true */
  enabled?: boolean;
  /** 页面切走（document.hidden）时暂停轮询，切回自动恢复，默认 true */
  pauseOnHidden?: boolean;
}

/**
 * 通用轮询 Hook：
 * - 按固定间隔执行异步回调，仅局部刷新数据，不触发整页刷新
 * - 上一次请求未完成时跳过本轮，避免请求堆积
 * - 组件卸载（用户离开页面）时自动清理定时器，释放资源
 * - 页面隐藏时自动暂停，切回时自动恢复
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions = {}
): void {
  const { interval = 5000, enabled = true, pauseOnHidden = true } = options;

  // 始终引用最新的回调，避免闭包过期导致轮询执行旧逻辑
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    if (!enabled || pausedRef.current) return;
    timerRef.current = setInterval(() => {
      // 上一次请求未完成则跳过本轮，防止请求堆积
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      Promise.resolve(callbackRef.current())
        .catch((e) => {
          console.error('[usePolling] 轮询请求失败:', e);
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    }, interval);
  }, [enabled, interval, clear]);

  // 页面可见性变化：隐藏时暂停，恢复可见时重新开始
  useEffect(() => {
    if (!pauseOnHidden) return;
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
      if (document.hidden) {
        clear();
      } else {
        start();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clear();
    };
  }, [pauseOnHidden, clear, start]);

  // 启停轮询；组件卸载时清理定时器
  useEffect(() => {
    start();
    return clear;
  }, [start, clear]);
}
