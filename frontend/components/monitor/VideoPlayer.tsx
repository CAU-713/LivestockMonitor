"use client";
import React from "react";

type Props = {
  styles: Record<string, string>;
  videoKey?: string;
  src?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
};

const VideoPlayer = React.forwardRef<HTMLVideoElement, Props>(
  ({ styles, videoKey, src, autoPlay = true, muted = true, controls = true }, ref) => {
    return (
      <div className={styles.videoPlayer}>
        <video
          ref={ref}
          key={videoKey ?? "video-default"}
          className={styles.video}
          src={src ?? undefined}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
        >
          Your browser does not support HTML5 video.
        </video>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
