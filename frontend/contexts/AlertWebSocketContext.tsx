'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

interface AlertNotification {
  id: number;
  severity: string;
  description: string;
  alert_time: string;
  shed_name?: string;
}

interface AlertWebSocketContextType {
  lastAlert: AlertNotification | null;
  unresolvedCount: number;
  setUnresolvedCount: (count: number) => void;
}

const AlertWebSocketContext = createContext<AlertWebSocketContextType>({
  lastAlert: null,
  unresolvedCount: 0,
  setUnresolvedCount: () => {},
});

export function useAlertWebSocket() {
  return useContext(AlertWebSocketContext);
}

export function AlertWebSocketProvider({ children }: { children: React.ReactNode }) {
  const [lastAlert, setLastAlert] = useState<AlertNotification | null>(null);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // 构建 WebSocket URL
  const getWsUrl = useCallback(() => {
    // 根据当前页面地址推断 WebSocket 地址
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // 开发环境用后端直连，生产环境用代理
    const host = process.env.NEXT_PUBLIC_BACKEND_URL
      ? new URL(process.env.NEXT_PUBLIC_BACKEND_URL).host
      : window.location.host;
    return `${protocol}//${host}/ws/alerts`;
  }, []);

  useEffect(() => {
    let websocket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      const url = getWsUrl();
      try {
        websocket = new WebSocket(url);

        websocket.onopen = () => {
          console.log('[AlertWS] Connected to', url);
          setWs(websocket);
        };

        websocket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'alert' && msg.data) {
              setLastAlert(msg.data);
              setSnackbarOpen(true);
              // 新告警来了，未解决数+1
              setUnresolvedCount((prev) => prev + 1);
            } else if (msg.type === 'pong') {
              // 心跳响应
            }
          } catch (e) {
            console.warn('[AlertWS] Failed to parse message', e);
          }
        };

        websocket.onerror = (e) => {
          console.warn('[AlertWS] Error', e);
        };

        websocket.onclose = () => {
          console.log('[AlertWS] Disconnected, reconnecting in 5s...');
          setWs(null);
          // 5秒后自动重连
          reconnectTimer = setTimeout(connect, 5000);
        };

        // 心跳：每30秒发送 ping
        const heartbeat = setInterval(() => {
          if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // 清理
        return () => {
          clearInterval(heartbeat);
          if (reconnectTimer) clearTimeout(reconnectTimer);
          if (websocket) websocket.close();
        };
      } catch (e) {
        console.warn('[AlertWS] Failed to connect', e);
        // 重试
        reconnectTimer = setTimeout(connect, 5000);
        return () => {
          if (reconnectTimer) clearTimeout(reconnectTimer);
        };
      }
    };

    const cleanup = connect();
    return cleanup;
  }, [getWsUrl]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // 告警严重程度到 MUI Alert severity 映射
  const severityMap: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  };

  return (
    <AlertWebSocketContext.Provider value={{ lastAlert, unresolvedCount, setUnresolvedCount }}>
      {children}

      {/* 实时告警通知 Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={severityMap[lastAlert?.severity ?? ''] || 'warning'}
          variant="filled"
          sx={{ width: '100%', maxWidth: 400 }}
        >
          <strong>
            {lastAlert?.severity === 'high' ? '高危告警' :
             lastAlert?.severity === 'medium' ? '中危告警' : '低危告警'}
          </strong>
          <br />
          {lastAlert?.description}
          {lastAlert?.shed_name && ` — ${lastAlert.shed_name}`}
        </MuiAlert>
      </Snackbar>
    </AlertWebSocketContext.Provider>
  );
}