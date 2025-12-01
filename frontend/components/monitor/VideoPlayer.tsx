"use client";
import React, { useEffect, useRef } from "react";
import { Box } from '@mui/material';

type Props = {
  videoKey?: string;
  src?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
};

const VideoPlayer = React.forwardRef<HTMLVideoElement, Props>(
  ({ videoKey, src, autoPlay = true, muted = true, controls = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<any>(null);

    useEffect(() => {
      if (!src) return;

      const video = videoRef.current;
      if (!video) return;

      // 检查是否是 HLS 流
      if (src.endsWith('.m3u8')) {
        // 动态导入 HLS.js
        import('hls.js').then((HLSModule) => {
          const HLS = HLSModule.default;
          
          if (HLS.isSupported()) {
            if (hlsRef.current) {
              hlsRef.current.destroy();
            }
            
            const hls = new HLS();
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            
            if (autoPlay) {
              video.play().catch(() => {
                // 自动播放失败，这在某些浏览器中是正常的
              });
            }
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari 原生支持 HLS
            video.src = src;
            if (autoPlay) {
              video.play().catch(() => {});
            }
          }
        }).catch((err) => {
          console.error('Failed to load HLS.js:', err);
          // 降级处理：直接设置 src，依赖浏览器原生支持
          video.src = src;
        });
      } else {
        // 普通视频格式，直接设置
        video.src = src;
        if (autoPlay) {
          video.play().catch(() => {});
        }
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [src, autoPlay]);

    // 合并 refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(videoRef.current);
        } else {
          ref.current = videoRef.current;
        }
      }
    }, [ref]);

    return (
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <video
          ref={videoRef}
          key={videoKey ?? "video-default"}
          controls={controls}
          muted={muted}
          sx={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'black',
            objectFit: 'cover',
          }}
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            backgroundColor: 'black',
            objectFit: 'cover',
          }}
        >
          Your browser does not support HTML5 video.
        </video>
      </Box>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
