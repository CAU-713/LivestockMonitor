'use client';

/**
 * RAGFlow Agent 对话页面
 * 放置路径：frontend/app/(main)/ragflow/agent/page.tsx
 *
 * 使用 RAGFlow 官方提供的 iframe 嵌入方式，
 * 无需自行实现 SSE 解析和后端转发。
 */

import { Box, Typography } from '@mui/material';
import { AutoAwesome as AgentIcon } from '@mui/icons-material';

const AGENT_IFRAME_SRC =
  'http://localhost:8666/agent/share?shared_id=46e29c2a28ea11f1a2ef6e995083b457&from=agent&auth=P8AoFBZhZIy-zU3Yql8tJ12sprFjDAmO&locale=zh';

export default function AgentPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 2, md: 3 } }}>
      {/* 页面标题 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexShrink: 0 }}>
        <AgentIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Agent 智能对话
          </Typography>
          <Typography variant="body2" color="text.secondary">
            基于 RAGFlow Agent 工作流的多节点 AI 对话
          </Typography>
        </Box>
      </Box>

      {/* RAGFlow 官方 Agent 对话界面 */}
      <Box sx={{ flex: 1, minHeight: 600, borderRadius: 2, overflow: 'hidden',
        border: '1px solid', borderColor: 'divider' }}>
        <iframe
          src={AGENT_IFRAME_SRC}
          style={{ width: '100%', height: '100%', minHeight: 600, border: 'none', display: 'block' }}
          title="RAGFlow Agent 对话"
          allow="microphone"
        />
      </Box>
    </Box>
  );
}