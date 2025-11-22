'use client';
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ListItemButton from '@mui/material/ListItemButton';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import type { Shed, Camera } from '../../types';

type Props = {
  styles: Record<string, string>;
  sheds: Shed[];
  cameras: Camera[];
  selectedCameraId: string | null;
  onSelectCamera: (id: string) => void;
};

export default function CameraHeader({
  styles,
  sheds,
  cameras,
  selectedCameraId,
  onSelectCamera,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedShedId, setExpandedShedId] = useState<string | null>(
    sheds.length > 0 ? sheds[0].id : null
  );

  const selectedCamera =
    cameras.find((c) => c.id === selectedCameraId) ?? cameras[0] ?? null;

  return (
    <>
      <div className={styles.infoRow}>
        <span className={styles.label}>舍: </span>
        <span className={styles.value}>
          {sheds.find((s) => s.id === selectedCamera?.shedId)?.name ??
            sheds[0]?.name ??
            '-'}
        </span>
      </div>

      <div className={styles.infoRow} style={{ alignItems: 'center' }}>
        <span className={styles.label}>摄像头：</span>
        <span className={styles.value}>
          {selectedCamera?.name ?? selectedCamera?.id ?? '-'}
        </span>

        <div className={styles.dropdownWrapper}>
          <Button
            variant='outlined'
            size='small'
            onClick={(e) =>
              setAnchorEl((prev) =>
                prev ? null : (e.currentTarget as HTMLElement)
              )
            }
          >
            选择摄像头
          </Button>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ style: { maxWidth: 340 } }}
          >
            <List dense style={{ width: 320 }}>
              {sheds.map((shed) => (
                <div key={shed.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() =>
                        setExpandedShedId((prev) =>
                          prev === shed.id ? null : shed.id
                        )
                      }
                    >
                      <ListItemText primary={shed.name} />
                      {expandedShedId === shed.id ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </ListItemButton>
                  </ListItem>

                  <Collapse
                    in={expandedShedId === shed.id}
                    timeout='auto'
                    unmountOnExit
                  >
                    <List component='div' disablePadding>
                      {cameras.filter((c) => c.shedId === shed.id).length ===
                        0 && (
                        <ListItem>
                          <ListItemText primary='(无摄像头)' />
                        </ListItem>
                      )}
                      {cameras
                        .filter((c) => c.shedId === shed.id)
                        .map((cam) => (
                          <ListItem key={cam.id} disablePadding>
                            <ListItemButton
                              selected={selectedCameraId === cam.id}
                              onClick={() => onSelectCamera(cam.id)}
                            >
                              <ListItemText primary={cam.name} />
                            </ListItemButton>
                          </ListItem>
                        ))}
                    </List>
                  </Collapse>
                </div>
              ))}
            </List>
          </Popover>
        </div>
      </div>
    </>
  );
}
