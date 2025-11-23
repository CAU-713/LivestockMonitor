"use client";
import React from "react";
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
    return (
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Box
          component="video"
          ref={ref}
          key={videoKey ?? "video-default"}
          src={src ?? undefined}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          sx={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 2.5, // Corresponds to 10px if theme spacing is 4px
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'black',
            objectFit: 'cover',
          }}
        >
          Your browser does not support HTML5 video.
        </Box>
      </Box>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
