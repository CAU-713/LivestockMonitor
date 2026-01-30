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

const VideoPlayer = React.forwardRef<any, Props>(
  ({ videoKey, src, autoPlay = true, muted = true, controls = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const hlsRef = useRef<any>(null);

    // 检查是否是MJPEG流
    const isMjpeg = src?.includes('/detect/infer');

    useEffect(() => {
      if (!src) return;

      if (isMjpeg) {
        // MJPEG流处理
        const img = imgRef.current;
        if (img) {
          img.src = src;
        }
      } else {
        // 原有视频流处理
        const video = videoRef.current;
        if (!video) return;

        if (src.endsWith('.m3u8')) {
          import('hls.js').then((HLSModule) => {
            const HLS = HLSModule.default;
            if (HLS.isSupported()) {
              if (hlsRef.current) hlsRef.current.destroy();
              const hls = new HLS();
              hlsRef.current = hls;
              hls.loadSource(src);
              hls.attachMedia(video);
              if (autoPlay) video.play().catch(() => {});
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = src;
              if (autoPlay) video.play().catch(() => {});
            }
          }).catch(() => {
            video.src = src;
          });
        } else {
          video.src = src;
          if (autoPlay) video.play().catch(() => {});
        }
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [src, autoPlay, isMjpeg]);

    useEffect(() => {
      if (ref) {
        const element = isMjpeg ? imgRef.current : videoRef.current;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      }
    }, [ref, isMjpeg]);

    return (
      <Box sx={{ width: '100%', minWidth: 0 }}>
        {isMjpeg ? (
          <img
            ref={imgRef}
            key={videoKey ?? "mjpeg-default"}
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '10px',
              border: '1px solid #e0e0e0',
              backgroundColor: 'black',
              objectFit: 'cover',
            }}
            alt="视频流"
          />
        ) : (
          <video
            ref={videoRef}
            key={videoKey ?? "video-default"}
            controls={controls}
            muted={muted}
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
        )}
      </Box>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
